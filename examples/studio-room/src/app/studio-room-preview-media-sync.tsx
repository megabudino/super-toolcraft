import * as React from "react";

import type { ToolcraftMediaAsset } from "@/toolcraft/runtime";
import {
  useToolcraftMediaPresentationUrls,
  useToolcraftPipelinePass,
} from "@/toolcraft/runtime/react";

import {
  createStudioRoomPreviewImageDerivative,
  type StudioRoomPreviewImageDerivative,
} from "./studio-room-preview-image-derivative";
import { studioRoomPreviewMediaPass } from "./studio-room-preview-pipeline";
import {
  createStudioRoomPreviewMediaMessage,
  type StudioRoomPreviewMediaItem,
} from "./studio-room-preview-protocol";
import type { StudioRoomTileImageTransform } from "./studio-room-values";

type StudioRoomImageAsset = Extract<ToolcraftMediaAsset, { assetKind: "image" }>;
export type StudioRoomPreviewDerivativeCache = Map<
  string,
  Readonly<{ derivative: StudioRoomPreviewImageDerivative; ref: string }>
>;

function imageTransform(asset: StudioRoomImageAsset): StudioRoomTileImageTransform {
  const rotation = asset.transform?.rotationDeg;
  return {
    flipHorizontal: asset.transform?.flipHorizontal === true,
    flipVertical: asset.transform?.flipVertical === true,
    rotationDeg: rotation === 90 || rotation === 180 || rotation === 270 ? rotation : 0,
  };
}

export function getStudioRoomPreviewDerivativeCacheKey(asset: StudioRoomImageAsset) {
  const transform = imageTransform(asset);
  return `${asset.resourceRef}:${transform.rotationDeg}:${Number(transform.flipHorizontal)}:${Number(transform.flipVertical)}`;
}

async function prepare({
  asset,
  cache,
  presentationUrl,
  signal,
}: Readonly<{
  asset: StudioRoomImageAsset;
  cache: StudioRoomPreviewDerivativeCache;
  presentationUrl: string;
  signal: AbortSignal;
}>): Promise<Readonly<{ cacheKey: string; image: StudioRoomPreviewMediaItem }>> {
  const cacheKey = getStudioRoomPreviewDerivativeCacheKey(asset);
  let cached = cache.get(cacheKey);
  if (!cached) {
    const response = await fetch(presentationUrl, { signal });
    if (!response.ok) throw new Error(`Could not read tile image ${asset.id}.`);
    const derivative = await createStudioRoomPreviewImageDerivative({
      blob: await response.blob(),
      signal,
      transform: imageTransform(asset),
    });
    cached = { derivative, ref: asset.resourceRef };
    cache.set(cacheKey, cached);
  }
  return {
    cacheKey,
    image: {
      blob: cached.derivative.blob,
      id: asset.id,
      mimeType: cached.derivative.mimeType,
      ref: asset.resourceRef,
    },
  };
}

function MediaPass({
  assets,
  cache,
  frame,
  origin,
  presentationUrls,
  sentKeys,
}: Readonly<{
  assets: readonly StudioRoomImageAsset[];
  cache: StudioRoomPreviewDerivativeCache;
  frame: HTMLIFrameElement | null;
  origin: string;
  presentationUrls: ReadonlyMap<string, string>;
  sentKeys: React.MutableRefObject<Set<string>>;
}>) {
  const abortRef = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => abortRef.current?.abort(), []);

  useToolcraftPipelinePass(studioRoomPreviewMediaPass, undefined, async () => {
    const frameWindow = frame?.contentWindow;
    if (!frameWindow) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const candidates = assets.flatMap((asset) => {
      const key = getStudioRoomPreviewDerivativeCacheKey(asset);
      const presentationUrl = presentationUrls.get(asset.id);
      return sentKeys.current.has(key) || !presentationUrl ? [] : [{ asset, presentationUrl }];
    });

    for (let index = 0; index < candidates.length; index += 4) {
      const settled = await Promise.allSettled(
        candidates
          .slice(index, index + 4)
          .map(({ asset, presentationUrl }) =>
            prepare({ asset, cache, presentationUrl, signal: controller.signal }),
          ),
      );
      if (controller.signal.aborted) return;
      const ready = settled.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      if (ready.length === 0) continue;
      frameWindow.postMessage(
        createStudioRoomPreviewMediaMessage(ready.map(({ image }) => image)),
        origin,
      );
      for (const { cacheKey } of ready) sentKeys.current.add(cacheKey);
    }
  });
  return null;
}

export function StudioRoomPreviewMediaSync({
  assets,
  cache,
  frame,
  origin,
  revision,
  sentKeys,
}: Readonly<{
  assets: readonly StudioRoomImageAsset[];
  cache: StudioRoomPreviewDerivativeCache;
  frame: HTMLIFrameElement | null;
  origin: string;
  revision: number;
  sentKeys: React.MutableRefObject<Set<string>>;
}>) {
  const presentationUrls = useToolcraftMediaPresentationUrls(assets);
  const pendingKey = assets
    .flatMap((asset) => {
      const key = getStudioRoomPreviewDerivativeCacheKey(asset);
      return sentKeys.current.has(key) || !presentationUrls.has(asset.id) ? [] : [key];
    })
    .join("|");
  return (
    <MediaPass
      assets={assets}
      cache={cache}
      frame={frame}
      key={`${revision}:${pendingKey}`}
      origin={origin}
      presentationUrls={presentationUrls}
      sentKeys={sentKeys}
    />
  );
}

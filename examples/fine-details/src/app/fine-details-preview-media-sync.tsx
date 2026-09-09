import * as React from "react";

import type { ToolcraftMediaAsset } from "@/toolcraft/runtime";
import {
  useToolcraftMediaPresentationUrls,
  useToolcraftPipelinePass,
} from "@/toolcraft/runtime/react";

import {
  createFineDetailsPreviewImageDerivative,
  normalizeFineDetailsPreviewImageRotation,
  type FineDetailsPreviewImageDerivative,
} from "./fine-details-preview-image-derivative";
import { fineDetailsPreviewMediaPass } from "./fine-details-preview-pipeline";
import {
  createFineDetailsPreviewMediaMessage,
  type FineDetailsPreviewMediaItem,
} from "./fine-details-preview-protocol";

const previewMediaConcurrency = 4;
type FineDetailsTrailImageAsset = Extract<
  ToolcraftMediaAsset,
  { assetKind: "image" }
>;

export type FineDetailsPreviewImageDerivativeCacheEntry = Readonly<{
  derivative: FineDetailsPreviewImageDerivative;
  ref: string;
}>;

export type FineDetailsPreviewImageDerivativeCache = Map<
  string,
  FineDetailsPreviewImageDerivativeCacheEntry
>;

export function getFineDetailsPreviewDerivativeCacheKey(
  asset: FineDetailsTrailImageAsset,
) {
  const rotation = normalizeFineDetailsPreviewImageRotation(
    asset.transform?.rotationDeg,
  );
  return `${asset.resourceRef}:${rotation}`;
}

async function preparePreviewMediaItem({
  asset,
  cache,
  presentationUrl,
  signal,
}: Readonly<{
  asset: FineDetailsTrailImageAsset;
  cache: FineDetailsPreviewImageDerivativeCache;
  presentationUrl: string;
  signal: AbortSignal;
}>): Promise<Readonly<{ cacheKey: string; image: FineDetailsPreviewMediaItem }>> {
  const cacheKey = getFineDetailsPreviewDerivativeCacheKey(asset);
  let cached = cache.get(cacheKey);

  if (!cached) {
    const response = await fetch(presentationUrl, { signal });
    if (!response.ok) {
      throw new Error(`Could not read trail image ${asset.id}.`);
    }

    const derivative = await createFineDetailsPreviewImageDerivative({
      blob: await response.blob(),
      rotationDeg: asset.transform?.rotationDeg,
      signal,
    });
    if (signal.aborted) {
      throw new DOMException("Preview media sync was aborted.", "AbortError");
    }

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

function FineDetailsPreviewMediaSyncPass({
  assets,
  derivativeCache,
  frame,
  presentationUrls,
  previewOrigin,
  sentKeys,
}: {
  assets: readonly ToolcraftMediaAsset[];
  derivativeCache: FineDetailsPreviewImageDerivativeCache;
  frame: HTMLIFrameElement | null;
  presentationUrls: ReadonlyMap<string, string>;
  previewOrigin: string;
  sentKeys: React.MutableRefObject<Set<string>>;
}) {
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  useToolcraftPipelinePass(fineDetailsPreviewMediaPass, undefined, async () => {
    const frameWindow = frame?.contentWindow;
    if (!frameWindow) return;

    const controller = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = controller;

    const candidates = assets.flatMap((asset) => {
      if (asset.assetKind !== "image" || asset.lifecycle === "unavailable") {
        return [];
      }

      const cacheKey = getFineDetailsPreviewDerivativeCacheKey(asset);
      const presentationUrl = presentationUrls.get(asset.id);
      if (sentKeys.current.has(cacheKey) || !presentationUrl) return [];
      return [{ asset, presentationUrl }];
    });

    for (let index = 0; index < candidates.length; index += previewMediaConcurrency) {
      if (controller.signal.aborted) return;

      const group = candidates.slice(index, index + previewMediaConcurrency);
      const settled = await Promise.allSettled(
        group.map(({ asset, presentationUrl }) =>
          preparePreviewMediaItem({
            asset,
            cache: derivativeCache,
            presentationUrl,
            signal: controller.signal,
          }),
        ),
      );
      if (controller.signal.aborted) return;

      const ready = settled.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      if (ready.length === 0) continue;

      frameWindow.postMessage(
        createFineDetailsPreviewMediaMessage(ready.map(({ image }) => image)),
        previewOrigin,
      );
      for (const { cacheKey } of ready) sentKeys.current.add(cacheKey);
    }
  });

  return null;
}

export function FineDetailsPreviewMediaSync({
  assets,
  derivativeCache,
  frame,
  previewOrigin,
  revision,
  sentKeys,
}: {
  assets: readonly ToolcraftMediaAsset[];
  derivativeCache: FineDetailsPreviewImageDerivativeCache;
  frame: HTMLIFrameElement | null;
  previewOrigin: string;
  revision: number;
  sentKeys: React.MutableRefObject<Set<string>>;
}) {
  const presentationUrls = useToolcraftMediaPresentationUrls(assets);
  const pendingRefsKey = assets
    .flatMap((asset) => {
      if (
        asset.assetKind !== "image" ||
        asset.lifecycle === "unavailable" ||
        sentKeys.current.has(getFineDetailsPreviewDerivativeCacheKey(asset)) ||
        !presentationUrls.has(asset.id)
      ) {
        return [];
      }
      return [getFineDetailsPreviewDerivativeCacheKey(asset)];
    })
    .join("|");

  return (
    <FineDetailsPreviewMediaSyncPass
      assets={assets}
      derivativeCache={derivativeCache}
      frame={frame}
      key={`${revision}:${pendingRefsKey}`}
      presentationUrls={presentationUrls}
      previewOrigin={previewOrigin}
      sentKeys={sentKeys}
    />
  );
}

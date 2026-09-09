import * as React from "react";

import type { ToolcraftImageAsset } from "@/toolcraft/runtime";
import { useToolcraftPipelinePass, useToolcraftSelector } from "@/toolcraft/runtime/react";

import styles from "./studio-room-preview.module.css";
import {
  getStudioRoomPreviewDerivativeCacheKey,
  StudioRoomPreviewMediaSync,
  type StudioRoomPreviewDerivativeCache,
} from "./studio-room-preview-media-sync";
import { studioRoomPreviewSyncPass } from "./studio-room-preview-pipeline";
import {
  createStudioRoomPreviewReadyRequestMessage,
  createStudioRoomPreviewSaveSettingsMessage,
  createStudioRoomPreviewSettingsMessage,
  isStudioRoomPreviewReadyMessage,
  isStudioRoomPreviewSaveResultMessage,
  STUDIO_ROOM_PREVIEW_URL,
  type StudioRoomPreviewSettings,
} from "./studio-room-preview-protocol";
import {
  createStudioRoomSettingsFromValues,
  createStudioRoomTileImagesFromMediaAssets,
  studioRoomTargets,
} from "./studio-room-values";
import {
  registerStudioRoomWebsiteSettingsSaveHandler,
  type StudioRoomWebsiteSettingsSaveRequest,
} from "./studio-room-preview-website-actions";

const previewOrigin = new URL(STUDIO_ROOM_PREVIEW_URL).origin;
const saveRequestTimeoutMs = 10_000;
export const STUDIO_ROOM_PRODUCT_OUTPUT_MARKER = "studio-room-external-preview";
export const STUDIO_ROOM_IFRAME_SANDBOX = "allow-same-origin allow-scripts";

type PendingSave = { reject: (reason?: unknown) => void; resolve: () => void; timeoutId: number };

function PreviewSyncPass({
  frame,
  settings,
}: Readonly<{ frame: HTMLIFrameElement | null; settings: StudioRoomPreviewSettings }>) {
  useToolcraftPipelinePass(studioRoomPreviewSyncPass, undefined, () => {
    frame?.contentWindow?.postMessage(
      createStudioRoomPreviewSettingsMessage(settings),
      previewOrigin,
    );
  });
  return null;
}

export function StudioRoomExternalPreview() {
  const height = useToolcraftSelector((state) => state.canvas.size.height, Object.is);
  const values = useToolcraftSelector((state) => state.values, Object.is);
  const mediaAssets = useToolcraftSelector((state) => state.mediaAssets, Object.is);
  const tileAssets = React.useMemo(
    () =>
      mediaAssets.filter(
        (asset): asset is ToolcraftImageAsset =>
          asset.assetKind === "image" &&
          asset.sourceTarget === studioRoomTargets.tilesImages &&
          asset.lifecycle !== "unavailable",
      ),
    [mediaAssets],
  );
  const images = React.useMemo(
    () => createStudioRoomTileImagesFromMediaAssets(tileAssets),
    [tileAssets],
  );
  const settings = React.useMemo(
    () => createStudioRoomSettingsFromValues(values, height, images),
    [height, images, values],
  );
  const settingsKey = JSON.stringify(settings);
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const readyRef = React.useRef(false);
  const pendingSavesRef = React.useRef(new Map<string, PendingSave>());
  const derivativeCacheRef = React.useRef<StudioRoomPreviewDerivativeCache>(new Map());
  const sentMediaKeysRef = React.useRef(new Set<string>());
  const [revision, setRevision] = React.useState(0);

  const requestReady = React.useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      createStudioRoomPreviewReadyRequestMessage(),
      previewOrigin,
    );
  }, []);
  const rejectPending = React.useCallback((message: string) => {
    for (const pending of pendingSavesRef.current.values()) {
      window.clearTimeout(pending.timeoutId);
      pending.reject(new Error(message));
    }
    pendingSavesRef.current.clear();
  }, []);
  const requestSave = React.useCallback(
    ({ intent, settings: nextSettings }: StudioRoomWebsiteSettingsSaveRequest) => {
      const frameWindow = frameRef.current?.contentWindow;
      if (!frameWindow || !readyRef.current)
        return Promise.reject(new Error("The website preview is not ready."));
      const requestId = crypto.randomUUID();
      return new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          pendingSavesRef.current.delete(requestId);
          reject(new Error("The website settings request timed out."));
        }, saveRequestTimeoutMs);
        pendingSavesRef.current.set(requestId, { reject, resolve, timeoutId });
        frameWindow.postMessage(
          createStudioRoomPreviewSaveSettingsMessage({ intent, payload: nextSettings, requestId }),
          previewOrigin,
        );
      });
    },
    [],
  );

  React.useEffect(() => {
    const activeKeys = new Set(tileAssets.map(getStudioRoomPreviewDerivativeCacheKey));
    for (const key of derivativeCacheRef.current.keys())
      if (!activeKeys.has(key)) derivativeCacheRef.current.delete(key);
    for (const key of sentMediaKeysRef.current)
      if (!activeKeys.has(key)) sentMediaKeysRef.current.delete(key);
  }, [tileAssets]);

  React.useEffect(() => {
    function receive(event: MessageEvent<unknown>) {
      if (event.source !== frameRef.current?.contentWindow || event.origin !== previewOrigin)
        return;
      if (isStudioRoomPreviewReadyMessage(event.data)) {
        readyRef.current = true;
        sentMediaKeysRef.current.clear();
        setRevision((current) => current + 1);
        return;
      }
      if (isStudioRoomPreviewSaveResultMessage(event.data)) {
        const pending = pendingSavesRef.current.get(event.data.requestId);
        if (!pending) return;
        window.clearTimeout(pending.timeoutId);
        pendingSavesRef.current.delete(event.data.requestId);
        if (event.data.ok) pending.resolve();
        else pending.reject(new Error(event.data.message ?? "The website rejected the settings."));
      }
    }
    window.addEventListener("message", receive);
    return () => {
      window.removeEventListener("message", receive);
      readyRef.current = false;
      rejectPending("The website preview was closed.");
    };
  }, [rejectPending]);

  React.useEffect(() => {
    requestReady();
    const interval = window.setInterval(() => {
      if (readyRef.current) window.clearInterval(interval);
      else requestReady();
    }, 250);
    return () => window.clearInterval(interval);
  }, [requestReady]);
  React.useEffect(() => registerStudioRoomWebsiteSettingsSaveHandler(requestSave), [requestSave]);

  return (
    <div
      className={styles.preview}
      data-studio-room-height={height}
      data-studio-room-settings={settingsKey}
      data-toolcraft-product-output={STUDIO_ROOM_PRODUCT_OUTPUT_MARKER}
    >
      <iframe
        className={styles.frame}
        onLoad={() => {
          rejectPending("The website preview was reloaded.");
          readyRef.current = false;
          sentMediaKeysRef.current.clear();
          requestReady();
          setRevision((current) => current + 1);
        }}
        ref={frameRef}
        sandbox={STUDIO_ROOM_IFRAME_SANDBOX}
        src={STUDIO_ROOM_PREVIEW_URL}
        title="Recraft Studio Room website preview"
      />
      {readyRef.current ? (
        <PreviewSyncPass
          frame={frameRef.current}
          key={`${revision}:${settingsKey}`}
          settings={settings}
        />
      ) : null}
      {readyRef.current ? (
        <StudioRoomPreviewMediaSync
          assets={tileAssets}
          cache={derivativeCacheRef.current}
          frame={frameRef.current}
          origin={previewOrigin}
          revision={revision}
          sentKeys={sentMediaKeysRef}
        />
      ) : null}
    </div>
  );
}

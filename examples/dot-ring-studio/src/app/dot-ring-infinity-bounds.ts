import * as React from "react";
import type {
  ToolcraftSceneRect,
  ToolcraftState,
} from "@/toolcraft/runtime";

import type { DotRingAudioProfile } from "./dot-ring-drawing";
import {
  createDotRingSceneBoundsSnapshot,
  getDotRingSceneBoundsForAudio,
  unionDotRingSceneRects,
  type DotRingSceneBoundsWorkerRequest,
  type DotRingSceneBoundsWorkerResponse,
} from "./dot-ring-scene-bounds";

const workerStartDelayMs = 80;

type CompletedBounds = {
  key: string;
  rect: ToolcraftSceneRect | null;
};

export type DotRingInfinityBoundsResult = {
  rect: ToolcraftSceneRect | null;
  status: "inactive" | "refining" | "settled";
};

export function useDotRingInfinityBounds({
  audioProfile,
  spatialSettingsKey,
  state,
}: {
  audioProfile: DotRingAudioProfile;
  spatialSettingsKey: string;
  state: ToolcraftState;
}): DotRingInfinityBoundsResult {
  const requestIdRef = React.useRef(0);
  const [completedBounds, setCompletedBounds] =
    React.useState<CompletedBounds | null>(null);
  const boundsKey = [
    audioProfile.durationSeconds,
    audioProfile.frames.length,
    audioProfile.sourceName,
    spatialSettingsKey,
    state.canvas.mode,
    state.canvas.size.height,
    state.canvas.size.width,
    state.timeline.durationSeconds,
  ].join(":");
  const immediateBounds = React.useMemo(() => {
    if (state.canvas.mode !== "infinite") return null;
    return getDotRingSceneBoundsForAudio({ state }, audioProfile)[0] ?? null;
  }, [
    audioProfile,
    spatialSettingsKey,
    state.canvas.mode,
    state.canvas.size.height,
    state.canvas.size.width,
    state.timeline.durationSeconds,
  ]);

  React.useEffect(() => {
    if (state.canvas.mode !== "infinite") return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let worker: Worker | null = null;
    const timeoutId = window.setTimeout(() => {
      const snapshot = createDotRingSceneBoundsSnapshot(state);
      const request: DotRingSceneBoundsWorkerRequest = {
        audioProfile,
        requestId,
        snapshot,
        timeRange: {
          endSeconds: state.timeline.durationSeconds,
          startSeconds: 0,
        },
      };

      worker = new Worker(
        new URL("./dot-ring-scene-bounds.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.addEventListener(
        "message",
        (event: MessageEvent<DotRingSceneBoundsWorkerResponse>) => {
          worker?.terminate();
          worker = null;

          if (
            event.data.requestId === requestIdRef.current &&
            event.data.status === "success"
          ) {
            setCompletedBounds({
              key: boundsKey,
              rect: event.data.rect,
            });
          }
        },
      );
      worker.postMessage(request);
    }, workerStartDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
      worker?.terminate();
    };
  }, [
    audioProfile,
    boundsKey,
    spatialSettingsKey,
    state.canvas.mode,
    state.canvas.size.height,
    state.canvas.size.width,
    state.timeline.durationSeconds,
  ]);

  if (state.canvas.mode !== "infinite") {
    return { rect: null, status: "inactive" };
  }

  const isSettled = completedBounds?.key === boundsKey;

  return {
    rect: isSettled
      ? completedBounds.rect
      : unionDotRingSceneRects(
          completedBounds?.rect ?? null,
          immediateBounds,
        ),
    status: isSettled ? "settled" : "refining",
  };
}

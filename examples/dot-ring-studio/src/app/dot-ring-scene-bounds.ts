import type {
  ToolcraftProductSceneBoundsProvider,
  ToolcraftSceneRect,
  ToolcraftState,
} from "@/toolcraft/runtime";

import { getCachedDotRingAudioProfileForState } from "./dot-ring-audio";
import {
  getDotRingBaseOuterRadius,
  getDotRingBeadExtentScale,
  getDotRingSpatialFrameGeometry,
  getDotRingSettingsFromState,
  type DotRingAudioProfile,
  type DotRingSettings,
} from "./dot-ring-drawing";

export const DOT_RING_VIDEO_FRAME_RATE = 30;

export type DotRingSceneBoundsSnapshot = {
  canvasHeight: number;
  canvasMode: ToolcraftState["canvas"]["mode"];
  canvasWidth: number;
  currentTimeSeconds: number;
  durationSeconds: number;
  settings: DotRingSettings;
};

export type DotRingSceneBoundsWorkerRequest = {
  audioProfile: DotRingAudioProfile;
  requestId: number;
  snapshot: DotRingSceneBoundsSnapshot;
  timeRange: Readonly<{ endSeconds: number; startSeconds: number }>;
};

export type DotRingSceneBoundsWorkerResponse =
  | {
      rect: ToolcraftSceneRect | null;
      requestId: number;
      status: "success";
    }
  | {
      error: string;
      requestId: number;
      status: "error";
    };

type MutableBounds = {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
};

function createEmptyBounds(): MutableBounds {
  return {
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
  };
}

function includePoint(
  bounds: MutableBounds,
  x: number,
  y: number,
  padding: number,
): void {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(padding)
  ) {
    return;
  }

  bounds.minX = Math.min(bounds.minX, x - padding);
  bounds.minY = Math.min(bounds.minY, y - padding);
  bounds.maxX = Math.max(bounds.maxX, x + padding);
  bounds.maxY = Math.max(bounds.maxY, y + padding);
}

function resolveBounds(bounds: MutableBounds): ToolcraftSceneRect | null {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  if (
    !Number.isFinite(bounds.minX) ||
    !Number.isFinite(bounds.minY) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return {
    height,
    width,
    x: bounds.minX,
    y: bounds.minY,
  };
}

function getSampleTimes(
  snapshot: DotRingSceneBoundsSnapshot,
  timeRange?: Readonly<{ endSeconds: number; startSeconds: number }>,
): readonly number[] {
  if (!timeRange) {
    return [snapshot.currentTimeSeconds];
  }

  const startSeconds = Math.min(
    timeRange.startSeconds,
    timeRange.endSeconds,
  );
  const endSeconds = Math.max(timeRange.startSeconds, timeRange.endSeconds);
  const durationSeconds = Math.max(0, endSeconds - startSeconds);
  const intervalCount = Math.max(
    1,
    Math.ceil(durationSeconds * DOT_RING_VIDEO_FRAME_RATE),
  );

  return Array.from(
    { length: intervalCount + 1 },
    (_, index) =>
      startSeconds + (durationSeconds * index) / intervalCount,
  );
}

function getSnapshotWorldOrigin(
  snapshot: DotRingSceneBoundsSnapshot,
): Readonly<{ x: number; y: number }> {
  return snapshot.canvasMode === "infinite"
    ? {
        x: -snapshot.canvasWidth / 2,
        y: -snapshot.canvasHeight / 2,
      }
    : { x: 0, y: 0 };
}

export function createDotRingSceneBoundsSnapshot(
  state: ToolcraftState,
): DotRingSceneBoundsSnapshot {
  return {
    canvasHeight: state.canvas.size.height,
    canvasMode: state.canvas.mode,
    canvasWidth: state.canvas.size.width,
    currentTimeSeconds: state.timeline.currentTimeSeconds,
    durationSeconds: state.timeline.durationSeconds,
    settings: getDotRingSettingsFromState(state),
  };
}

export function getDotRingWorldOrigin(
  state: ToolcraftState,
): Readonly<{ x: number; y: number }> {
  return getSnapshotWorldOrigin(createDotRingSceneBoundsSnapshot(state));
}

export function getDotRingSceneBoundsForSnapshot(
  {
    snapshot,
    timeRange,
  }: {
    snapshot: DotRingSceneBoundsSnapshot;
    timeRange?: Readonly<{ endSeconds: number; startSeconds: number }>;
  },
  audioProfile: DotRingAudioProfile,
): readonly ToolcraftSceneRect[] {
  const { settings } = snapshot;
  const origin = getSnapshotWorldOrigin(snapshot);
  const bounds = createEmptyBounds();
  const baseOuterRadius = getDotRingBaseOuterRadius({
    height: snapshot.canvasHeight,
    settings,
    width: snapshot.canvasWidth,
  });
  const centerX = origin.x + snapshot.canvasWidth / 2;
  const centerY = origin.y + snapshot.canvasHeight / 2;

  includePoint(bounds, centerX - baseOuterRadius, centerY, 0);
  includePoint(bounds, centerX + baseOuterRadius, centerY, 0);
  includePoint(bounds, centerX, centerY - baseOuterRadius, 0);
  includePoint(bounds, centerX, centerY + baseOuterRadius, 0);

  const beadExtentScale = getDotRingBeadExtentScale(settings.glow / 100);

  for (const timeSeconds of getSampleTimes(snapshot, timeRange)) {
    const geometry = getDotRingSpatialFrameGeometry({
      audioProfile,
      durationSeconds: snapshot.durationSeconds,
      height: snapshot.canvasHeight,
      settings,
      timeSeconds,
      width: snapshot.canvasWidth,
    });

    for (const bead of geometry.beads) {
      includePoint(
        bounds,
        origin.x + bead.x,
        origin.y + bead.y,
        geometry.beadRadius * bead.scale * beadExtentScale,
      );
    }
  }

  const resolved = resolveBounds(bounds);
  return resolved ? [resolved] : [];
}

export function getDotRingSceneBoundsForAudio(
  {
    state,
    timeRange,
  }: Parameters<ToolcraftProductSceneBoundsProvider>[0],
  audioProfile: DotRingAudioProfile,
): readonly ToolcraftSceneRect[] {
  return getDotRingSceneBoundsForSnapshot(
    {
      snapshot: createDotRingSceneBoundsSnapshot(state),
      ...(timeRange ? { timeRange } : {}),
    },
    audioProfile,
  );
}

export function unionDotRingSceneRects(
  left: ToolcraftSceneRect | null,
  right: ToolcraftSceneRect | null,
): ToolcraftSceneRect | null {
  if (!left) return right;
  if (!right) return left;

  const x = Math.min(left.x, right.x);
  const y = Math.min(left.y, right.y);
  const maxX = Math.max(left.x + left.width, right.x + right.width);
  const maxY = Math.max(left.y + left.height, right.y + right.height);

  return {
    height: maxY - y,
    width: maxX - x,
    x,
    y,
  };
}

export const getDotRingSceneBounds: ToolcraftProductSceneBoundsProvider = (
  options,
) =>
  getDotRingSceneBoundsForAudio(
    options,
    getCachedDotRingAudioProfileForState(options.state),
  );

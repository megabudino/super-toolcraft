import {
  getToolcraftTimelineLoopProgress,
  type ToolcraftProductSceneBoundsProvider,
  type ToolcraftSceneRect,
  type ToolcraftState,
} from "@/toolcraft/runtime";

import { dotPositionAt } from "./dots-motion";
import { getDotPlan } from "./dots-shape";
import type { DotParticle, DotsSettings } from "./dots-types";
import { readDotsSettings } from "./dots-values";

export const DOTS_VIDEO_FRAME_RATE = 30;

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

function getTrailStride(count: number): number {
  return count >= 1_600 ? 6 : count >= 900 ? 3 : count >= 500 ? 2 : 1;
}

function getGlowStride(count: number): number {
  return count >= 1_600 ? 3 : count >= 900 ? 2 : 1;
}

function getSampleTimes(
  state: ToolcraftState,
  timeRange?: Readonly<{ endSeconds: number; startSeconds: number }>,
): readonly number[] {
  if (!timeRange) {
    return [state.timeline.currentTimeSeconds];
  }

  const startSeconds = Math.min(
    timeRange.startSeconds,
    timeRange.endSeconds,
  );
  const endSeconds = Math.max(
    timeRange.startSeconds,
    timeRange.endSeconds,
  );
  const durationSeconds = Math.max(0, endSeconds - startSeconds);
  const intervalCount = Math.max(
    1,
    Math.ceil(durationSeconds * DOTS_VIDEO_FRAME_RATE),
  );

  return Array.from(
    { length: intervalCount + 1 },
    (_, index) =>
      startSeconds + (durationSeconds * index) / intervalCount,
  );
}

export function getDotsWorldOrigin(
  state: ToolcraftState,
): Readonly<{ x: number; y: number }> {
  return state.canvas.mode === "infinite"
    ? {
        x: -state.canvas.size.width / 2,
        y: -state.canvas.size.height / 2,
      }
    : { x: 0, y: 0 };
}

function includeParticleFrame(
  bounds: MutableBounds,
  particle: DotParticle,
  progress: number,
  settings: DotsSettings,
  origin: Readonly<{ x: number; y: number }>,
): void {
  const { height, width } = settings.canvas;
  const count = settings.particles.count;
  const point = dotPositionAt(particle, progress, settings);
  const maxRadius = settings.particles.size[1];
  const glowRadius =
    settings.appearance.glow > 0.002 &&
    particle.index % getGlowStride(count) === 0
      ? maxRadius * (1.35 + settings.appearance.glow * 0.95)
      : maxRadius;

  includePoint(
    bounds,
    origin.x + point.x * width,
    origin.y + point.y * height,
    glowRadius,
  );

  if (
    settings.appearance.trails <= 0.002 ||
    particle.index % getTrailStride(count) !== 0
  ) {
    return;
  }

  const trailStep =
    (0.035 + settings.appearance.trails * 0.13) /
    settings.motion.loopDurationSeconds;
  const previous1 = dotPositionAt(
    particle,
    progress - trailStep,
    settings,
  );
  const minDimension = Math.min(width, height);

  if (
    Math.hypot(point.x - previous1.x, point.y - previous1.y) *
      minDimension <
    0.16
  ) {
    return;
  }

  const linePadding = Math.max(
    0.45,
    settings.particles.size[0] * 0.18,
  ) / 2;
  const trailPoints = [
    dotPositionAt(particle, progress - trailStep * 3, settings),
    dotPositionAt(particle, progress - trailStep * 2, settings),
    previous1,
    point,
  ];

  for (const trailPoint of trailPoints) {
    includePoint(
      bounds,
      origin.x + trailPoint.x * width,
      origin.y + trailPoint.y * height,
      linePadding,
    );
  }
}

export const getDotsSceneBounds: ToolcraftProductSceneBoundsProvider = ({
  state,
  timeRange,
}) => {
  const settings = readDotsSettings(state);
  const plan = getDotPlan(settings);
  const origin = getDotsWorldOrigin(state);
  const bounds = createEmptyBounds();

  for (const sampleTime of getSampleTimes(state, timeRange)) {
    const progress = getToolcraftTimelineLoopProgress({
      currentTimeSeconds: sampleTime,
      durationSeconds: state.timeline.durationSeconds,
    });

    for (const particle of plan.particles) {
      includeParticleFrame(
        bounds,
        particle,
        progress,
        settings,
        origin,
      );
    }
  }

  const resolved = resolveBounds(bounds);
  return resolved ? [resolved] : [];
};

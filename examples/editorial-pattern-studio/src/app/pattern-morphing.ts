import * as React from "react";

import type { Point } from "./pattern-equations";

type MorphOptions = {
  durationMs?: number;
  maxPointCount?: number;
};

type CanonicalMorphTransition = {
  final: readonly Point[];
  from: readonly Point[];
  to: readonly Point[];
};

type MorphResult = {
  isMorphing: boolean;
  key: string;
  points: readonly Point[];
  progress: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pointDistance(a: Point, b: Point): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function withoutDuplicateClosure(points: readonly Point[]): readonly Point[] {
  if (points.length > 2 && pointDistance(points[0]!, points.at(-1)!) < 0.000001) {
    return points.slice(0, -1);
  }
  return points;
}

export function resampleClosedLoop(
  points: readonly Point[],
  pointCount: number,
): readonly Point[] {
  const source = withoutDuplicateClosure(points);
  const count = Math.max(2, Math.round(pointCount));
  if (source.length === 0) {
    return [];
  }
  if (source.length === 1) {
    return Array.from({ length: count + 1 }, () => source[0]!);
  }

  const cumulative = [0];
  for (let index = 0; index < source.length; index += 1) {
    const current = source[index]!;
    const next = source[(index + 1) % source.length]!;
    cumulative.push((cumulative.at(-1) ?? 0) + pointDistance(current, next));
  }
  const totalLength = cumulative.at(-1) ?? 0;
  if (totalLength <= 0.000001) {
    return Array.from({ length: count + 1 }, () => source[0]!);
  }

  const sampled: Point[] = [];
  let segmentIndex = 0;
  for (let sampleIndex = 0; sampleIndex < count; sampleIndex += 1) {
    const targetDistance = (sampleIndex / count) * totalLength;
    while (
      segmentIndex < source.length - 1 &&
      (cumulative[segmentIndex + 1] ?? totalLength) < targetDistance
    ) {
      segmentIndex += 1;
    }
    const startDistance = cumulative[segmentIndex] ?? 0;
    const endDistance = cumulative[segmentIndex + 1] ?? totalLength;
    const progress =
      endDistance === startDistance
        ? 0
        : (targetDistance - startDistance) / (endDistance - startDistance);
    const start = source[segmentIndex]!;
    const end = source[(segmentIndex + 1) % source.length]!;
    sampled.push([
      start[0] + (end[0] - start[0]) * progress,
      start[1] + (end[1] - start[1]) * progress,
    ]);
  }
  sampled.push(sampled[0]!);
  return sampled;
}

export function resampleClosedLoopByParameter(
  points: readonly Point[],
  pointCount: number,
): readonly Point[] {
  const source = withoutDuplicateClosure(points);
  const count = Math.max(2, Math.round(pointCount));
  if (source.length === 0) {
    return [];
  }
  if (source.length === 1) {
    return Array.from({ length: count + 1 }, () => source[0]!);
  }

  const sampled: Point[] = [];
  for (let sampleIndex = 0; sampleIndex < count; sampleIndex += 1) {
    const sourcePosition = (sampleIndex / count) * source.length;
    const sourceIndex = Math.floor(sourcePosition) % source.length;
    const progress = sourcePosition - Math.floor(sourcePosition);
    const start = source[sourceIndex]!;
    const end = source[(sourceIndex + 1) % source.length]!;
    sampled.push([
      start[0] + (end[0] - start[0]) * progress,
      start[1] + (end[1] - start[1]) * progress,
    ]);
  }
  sampled.push(sampled[0]!);
  return sampled;
}

export function easeInOutCubic(progress: number): number {
  const value = clamp(progress, 0, 1);
  return value < 0.5
    ? 4 * value * value * value
    : 1 - ((-2 * value + 2) ** 3) / 2;
}

export function interpolateAlignedPoints(
  from: readonly Point[],
  to: readonly Point[],
  progress: number,
): readonly Point[] {
  const amount = clamp(progress, 0, 1);
  const length = Math.min(from.length, to.length);
  const points: Point[] = [];
  for (let index = 0; index < length; index += 1) {
    const start = from[index]!;
    const end = to[index]!;
    points.push([
      start[0] + (end[0] - start[0]) * amount,
      start[1] + (end[1] - start[1]) * amount,
    ]);
  }
  return points;
}

export function createCanonicalMorphTransition(
  displayedPoints: readonly Point[],
  targetPoints: readonly Point[],
  maxPointCount: number,
): CanonicalMorphTransition {
  const pointCount = Math.min(
    Math.max(2, Math.round(maxPointCount)),
    Math.max(2, targetPoints.length - 1),
  );
  return {
    final: targetPoints,
    from: resampleClosedLoopByParameter(displayedPoints, pointCount),
    to: resampleClosedLoopByParameter(targetPoints, pointCount),
  };
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  return prefersReducedMotion;
}

export function useMorphingEquationPoints(
  targetPoints: readonly Point[],
  morphKey: string,
  options: MorphOptions = {},
): MorphResult {
  const durationMs = options.durationMs ?? 480;
  const maxPointCount = options.maxPointCount ?? 1_200;
  const prefersReducedMotion = usePrefersReducedMotion();
  const displayedPointsRef = React.useRef(targetPoints);
  const previousKeyRef = React.useRef(morphKey);
  const frameRef = React.useRef<number | null>(null);
  const [result, setResult] = React.useState<MorphResult>({
    isMorphing: false,
    key: morphKey,
    points: targetPoints,
    progress: 1,
  });

  React.useEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const geometryChanged = previousKeyRef.current !== morphKey;
    previousKeyRef.current = morphKey;
    if (!geometryChanged || prefersReducedMotion || durationMs <= 0) {
      displayedPointsRef.current = targetPoints;
      setResult({ isMorphing: false, key: morphKey, points: targetPoints, progress: 1 });
      return;
    }

    const transition = createCanonicalMorphTransition(
      displayedPointsRef.current,
      targetPoints,
      maxPointCount,
    );
    displayedPointsRef.current = transition.from;
    setResult({ isMorphing: true, key: morphKey, points: transition.from, progress: 0 });
    const startTime = performance.now();

    const tick = (timestamp: number) => {
      const linearProgress = clamp((timestamp - startTime) / durationMs, 0, 1);
      if (linearProgress >= 1) {
        displayedPointsRef.current = transition.final;
        setResult({
          isMorphing: false,
          key: morphKey,
          points: transition.final,
          progress: 1,
        });
        frameRef.current = null;
        return;
      }
      const points = interpolateAlignedPoints(
        transition.from,
        transition.to,
        easeInOutCubic(linearProgress),
      );
      displayedPointsRef.current = points;
      setResult({ isMorphing: true, key: morphKey, points, progress: linearProgress });
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [durationMs, maxPointCount, morphKey, prefersReducedMotion, targetPoints]);

  return result;
}

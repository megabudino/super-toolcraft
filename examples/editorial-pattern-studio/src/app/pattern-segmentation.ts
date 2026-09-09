import type { Point } from "./pattern-equations";

export type PatternSegment = {
  colorIndex: 0 | 1 | 2;
  d: string;
  points: readonly Point[];
};

export type PatternSegmentationOptions = {
  colorSpread: number;
  randomSeed: number;
  randomness: number;
  segmentSize: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0 || 0x6d2b79f5;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function buildPath(points: readonly Point[]): string {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(5)} ${y.toFixed(5)}`)
    .join(" ");
}

function interpolatePoint(points: readonly Point[], position: number): Point {
  const intervalCount = points.length - 1;
  const safePosition = clamp(position, 0, intervalCount);
  const index = Math.min(intervalCount - 1, Math.floor(safePosition));
  const progress = safePosition - index;
  const start = points[index] ?? points[0] ?? [0, 0];
  const end = points[index + 1] ?? points.at(-1) ?? start;
  return [
    start[0] + (end[0] - start[0]) * progress,
    start[1] + (end[1] - start[1]) * progress,
  ];
}

function getSegmentPoints(
  points: readonly Point[],
  startFraction: number,
  endFraction: number,
): readonly Point[] {
  const intervalCount = points.length - 1;
  const startPosition = startFraction * intervalCount;
  const endPosition = endFraction * intervalCount;
  const segmentPoints: Point[] = [interpolatePoint(points, startPosition)];
  const firstInteriorIndex = Math.floor(startPosition) + 1;
  const lastInteriorIndex = Math.ceil(endPosition) - 1;

  for (
    let pointIndex = firstInteriorIndex;
    pointIndex <= lastInteriorIndex;
    pointIndex += 1
  ) {
    const point = points[pointIndex];
    if (point) {
      segmentPoints.push(point);
    }
  }

  const endPoint = interpolatePoint(points, endPosition);
  const lastPoint = segmentPoints.at(-1);
  if (!lastPoint || lastPoint[0] !== endPoint[0] || lastPoint[1] !== endPoint[1]) {
    segmentPoints.push(endPoint);
  }
  return segmentPoints;
}

export function createPatternSeed(parts: readonly (number | string)[]): number {
  let hash = 2_166_136_261;

  for (const character of parts.join("|")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

export function buildPatternSegments(
  points: readonly Point[],
  options: PatternSegmentationOptions,
): readonly PatternSegment[] {
  if (points.length < 2) {
    return [];
  }

  const random = createRandom(options.randomSeed);
  const randomness = clamp(options.randomness, 0, 100) / 100;
  const colorSpread = clamp(options.colorSpread, 0, 100) / 100;
  const baseFraction = clamp(options.segmentSize, 0.35, 2.5) / 100;
  const colorClusterSize = Math.max(1, Math.round(1 + (1 - colorSpread) * 10));
  const segments: PatternSegment[] = [];
  let startFraction = 0;
  let segmentIndex = 0;

  while (startFraction < 1 - Number.EPSILON * 10) {
    const jitterFactor = 1 + randomness * (0.45 + random() * 1.25 - 1);
    const segmentFraction = Math.max(baseFraction * 0.2, baseFraction * jitterFactor);
    const endFraction = Math.min(1, startFraction + segmentFraction);
    const segmentPoints = getSegmentPoints(points, startFraction, endFraction);
    const clusteredColor = Math.floor(segmentIndex / colorClusterSize) % 3;
    const randomizeColor = random() < randomness * 0.55;
    const colorIndex = (randomizeColor ? Math.floor(random() * 3) : clusteredColor) as 0 | 1 | 2;

    segments.push({
      colorIndex,
      d: buildPath(segmentPoints),
      points: segmentPoints,
    });

    startFraction = endFraction;
    segmentIndex += 1;
  }

  return segments;
}

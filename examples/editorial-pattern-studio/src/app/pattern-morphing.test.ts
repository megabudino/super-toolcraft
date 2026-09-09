import { describe, expect, it } from "vitest";

import {
  createCanonicalMorphTransition,
  easeInOutCubic,
  interpolateAlignedPoints,
  resampleClosedLoop,
  resampleClosedLoopByParameter,
} from "./pattern-morphing";
import type { Point } from "./pattern-equations";

const square: readonly Point[] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
];

function distance(a: Point, b: Point): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

describe("closed pattern morphing", () => {
  it("resamples a loop to a requested closed point count", () => {
    const points = resampleClosedLoop(square, 32);
    expect(points).toHaveLength(33);
    expect(distance(points[0]!, points.at(-1)!)).toBeLessThan(0.000001);
    expect(points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
  });

  it("keeps canonical phase and winding when the final loop refines to full detail", () => {
    const fullDetailTarget = Array.from({ length: 257 }, (_, index) => {
      const t = Math.PI / 2 - (index / 256) * Math.PI * 2;
      return [Math.cos(t), Math.sin(t) * 0.35] as Point;
    });
    const transition = createCanonicalMorphTransition(
      square,
      fullDetailTarget,
      64,
    );
    const refinedTarget = resampleClosedLoopByParameter(transition.final, 64);
    const arcLengthTarget = resampleClosedLoop(transition.final, 64);

    expect(distance(transition.to[0]!, fullDetailTarget[0]!)).toBeLessThan(0.000001);
    expect(
      transition.to.reduce(
        (greatest, point, index) =>
          Math.max(greatest, distance(point, refinedTarget[index]!)),
        0,
      ),
    ).toBeLessThan(0.000001);
    expect(
      transition.to.reduce(
        (greatest, point, index) =>
          Math.max(greatest, distance(point, arcLengthTarget[index]!)),
        0,
      ),
    ).toBeGreaterThan(0.05);
  });

  it("interpolates exact endpoints with a symmetric ease-in-out curve", () => {
    const from: readonly Point[] = [[0, 0], [0, 0]];
    const to: readonly Point[] = [[2, 4], [2, 4]];
    expect(interpolateAlignedPoints(from, to, 0)).toEqual(from);
    expect(interpolateAlignedPoints(from, to, 1)).toEqual(to);
    expect(interpolateAlignedPoints(from, to, 0.5)).toEqual([[1, 2], [1, 2]]);
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.25)).toBeCloseTo(1 - easeInOutCubic(0.75), 8);
  });
});

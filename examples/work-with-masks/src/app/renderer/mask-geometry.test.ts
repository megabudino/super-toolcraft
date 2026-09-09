import { describe, expect, it } from "vitest";

import type { HeroMask, HeroMaskRecord } from "../domain/masks";
import {
  applyMaskHandleDrag,
  getMaskPinPositions,
  maskCoverage,
  toArtboardMask,
  unionCoverage,
} from "./mask-geometry";

const normalizedCircle: HeroMask = {
  enabled: true,
  feather: 0.2,
  opacity: 1,
  position: { x: 0, y: 0 },
  radius: 0.3,
  rotation: 0,
  stretch: 1,
};

const rawCircle: HeroMaskRecord = {
  enabled: true,
  feather: 20,
  opacity: 65,
  position: { x: 0, y: 0 },
  radius: 30,
  rotation: 0,
  stretch: 1,
};

describe("circle mask geometry", () => {
  it("computes feathered ellipse coverage and its union", () => {
    const aspect = 16 / 9;
    const height = 1_000;
    const circle = toArtboardMask(normalizedCircle, aspect, height);
    const pins = getMaskPinPositions(circle, 28 / height);

    expect(maskCoverage(circle, circle.center)).toBe(1);
    const translucent = toArtboardMask({ ...normalizedCircle, opacity: 0.5 }, aspect, height);
    expect(maskCoverage(translucent, translucent.center)).toBe(0.5);
    expect(unionCoverage([translucent, translucent], translucent.center)).toBe(0.75);
    expect(maskCoverage(circle, pins.size)).toBeCloseTo(0.5, 8);
    expect(maskCoverage(circle, { x: circle.center.x + circle.rx * 2, y: circle.center.y })).toBe(
      0,
    );

    const hard = toArtboardMask({ ...normalizedCircle, feather: 0 }, aspect, height);
    expect(
      maskCoverage(hard, { x: hard.center.x + hard.rx + 0.75 / height, y: hard.center.y }),
    ).toBe(0);

    const rotated = toArtboardMask(
      { ...normalizedCircle, rotation: 90, stretch: 2 },
      aspect,
      height,
    );
    expect(
      maskCoverage(rotated, { x: rotated.center.x + rotated.rx, y: rotated.center.y }),
    ).toBeGreaterThan(0.5);
    expect(maskCoverage(rotated, getMaskPinPositions(rotated, 0).stretch)).toBeCloseTo(0.5, 8);

    expect(unionCoverage([], circle.center)).toBe(1);
    expect(unionCoverage([circle, { ...circle, enabled: false }], circle.center)).toBe(1);
    expect(
      unionCoverage(
        [circle, { ...circle, center: { x: circle.center.x + 2, y: circle.center.y } }],
        circle.center,
      ),
    ).toBe(maskCoverage(circle, circle.center));
  });

  it("moves, resizes, stretches, and rotates a mask from handle drags", () => {
    const aspect = 16 / 9;
    const center = toArtboardMask(
      {
        ...normalizedCircle,
        feather: rawCircle.feather / 100,
        radius: rawCircle.radius / 100,
      },
      aspect,
      1_000,
    ).center;

    const moved = applyMaskHandleDrag({
      aspect,
      currentPoint: { x: center.x + 0.2, y: center.y - 0.1 },
      kind: "move",
      record: rawCircle,
      startPoint: center,
    });
    expect(moved).toEqual({
      ...rawCircle,
      position: { x: 0.225, y: -0.2 },
    });
    expect(moved.opacity).toBe(65);

    const sizeStart = { x: center.x + 0.3, y: center.y };
    expect(
      applyMaskHandleDrag({
        aspect,
        currentPoint: { x: sizeStart.x + 0.1, y: sizeStart.y },
        kind: "size",
        record: rawCircle,
        startPoint: sizeStart,
      }).radius,
    ).toBe(40);

    const stretchStart = { x: center.x, y: center.y + 0.3 };
    expect(
      applyMaskHandleDrag({
        aspect,
        currentPoint: { x: stretchStart.x, y: stretchStart.y + 0.3 },
        kind: "stretch",
        record: rawCircle,
        startPoint: stretchStart,
      }).stretch,
    ).toBe(2);

    expect(
      applyMaskHandleDrag({
        aspect,
        currentPoint: { x: center.x, y: center.y + 0.4 },
        kind: "rotate",
        record: rawCircle,
        startPoint: { x: center.x + 0.4, y: center.y },
      }).rotation,
    ).toBe(90);

    expect(
      applyMaskHandleDrag({
        aspect,
        currentPoint: { x: center.x + 10, y: center.y - 10 },
        kind: "move",
        record: rawCircle,
        startPoint: center,
      }).position,
    ).toEqual({ x: 1.5, y: -1.5 });
  });
});

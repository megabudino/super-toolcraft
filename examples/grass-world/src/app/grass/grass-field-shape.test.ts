import { describe, expect, it } from "vitest";
import type { ToolcraftControlSchema, ToolcraftState } from "@/toolcraft/runtime";

import { appSchema } from "../app-schema";
import {
  getGrassFieldPoint,
  getGrassFieldRelativeDistance,
  getGrassFieldShapeSettings,
  isGrassFieldPointInside,
  type GrassFieldShapeSettings,
} from "./grass-field-shape";
import { readGrassSettings } from "./grass-values";

function findControl(target: string): ToolcraftControlSchema {
  for (const section of appSchema.panels.controls?.sections ?? []) {
    const control = Object.values(section.controls).find(
      (candidate) => candidate.target === target,
    );
    if (control) return control;
  }
  throw new Error(`Missing control ${target}`);
}

function settingsWith(values: Readonly<Record<string, unknown>> = {}) {
  return readGrassSettings({
    canvas: { size: { height: 1080, width: 1920 } },
    mediaAssets: [],
    timeline: {
      currentTimeSeconds: 0,
      durationSeconds: 6,
      isLooping: true,
      isPlaying: false,
    },
    values,
  } as unknown as ToolcraftState);
}

const shape = (
  values: Partial<GrassFieldShapeSettings> = {},
): GrassFieldShapeSettings => ({
  depth: 6,
  irregularity: 0,
  roundness: 1,
  seed: 17,
  width: 8,
  ...values,
});

describe("editable grass field shape", () => {
  it("field shape controls map to one shared perimeter", () => {
    expect(findControl("field.shapeRoundness")).toMatchObject({
      defaultValue: 95,
      max: 100,
      min: 0,
      step: 1,
      type: "slider",
      unit: "%",
    });
    expect(findControl("field.edgeIrregularity")).toMatchObject({
      defaultValue: 23,
      max: 30,
      min: 0,
      step: 1,
      type: "slider",
      unit: "%",
    });

    const defaults = settingsWith();
    expect(defaults.field.shapeRoundness).toBe(0.95);
    expect(defaults.field.edgeIrregularity).toBe(0.23);
    expect(
      settingsWith({
        "field.edgeIrregularity": 70,
        "field.shapeRoundness": -20,
      }).field,
    ).toMatchObject({ edgeIrregularity: 0.3, shapeRoundness: 0 });

    const roundedCorner = getGrassFieldPoint(1, 1, shape());
    const squareCorner = getGrassFieldPoint(
      1,
      1,
      shape({ roundness: 0 }),
    );
    expect(squareCorner[0]).toBeGreaterThan(roundedCorner[0] * 1.25);
    expect(squareCorner[1]).toBeGreaterThan(roundedCorner[1] * 1.25);
    expect(getGrassFieldRelativeDistance(...squareCorner, shape({ roundness: 0 }))).toBeCloseTo(1);

    const irregular = shape({ irregularity: 0.3 });
    const edgeDistances = Array.from({ length: 72 }, (_, index) => {
      const angle = (index / 72) * Math.PI * 2;
      return getGrassFieldRelativeDistance(
        Math.cos(angle) * irregular.width * 0.5,
        Math.sin(angle) * irregular.depth * 0.5,
        irregular,
      );
    });
    expect(Math.max(...edgeDistances) - Math.min(...edgeDistances)).toBeGreaterThan(0.2);

    for (let row = 0; row <= 12; row += 1) {
      for (let column = 0; column <= 12; column += 1) {
        const point = getGrassFieldPoint(column / 12, row / 12, irregular);
        expect(getGrassFieldRelativeDistance(...point, irregular)).toBeLessThanOrEqual(1.000001);
        expect(isGrassFieldPointInside(...point, irregular)).toBe(true);
      }
    }

    expect(getGrassFieldShapeSettings(defaults)).toEqual({
      depth: 5,
      irregularity: 0.23,
      roundness: 0.95,
      seed: 86,
      width: 7,
    });
  });
});

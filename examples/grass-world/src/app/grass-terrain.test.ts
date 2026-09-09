import { expect, it } from "vitest";
import type { ToolcraftControlSchema, ToolcraftState } from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { readGrassSettings, type GrassSettings } from "./grass/grass-values";
import { remapTerrainHeightMask } from "./grass/terrain-noise";

function findControl(target: string): ToolcraftControlSchema {
  for (const section of appSchema.panels.controls?.sections ?? []) {
    const control = Object.values(section.controls).find(
      (candidate) => candidate.target === target,
    );
    if (control) return control;
  }
  throw new Error(`Missing control ${target}`);
}

function settingsWith(values: Record<string, unknown> = {}): GrassSettings {
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

it("terrain height levels smoothly remap both mask bounds", () => {
  expect(findControl("terrain.heightLevels")).toMatchObject({
    defaultValue: [61, 87],
    max: 100,
    min: 0,
    step: 1,
    type: "rangeSlider",
    unit: "%",
  });
  expect(settingsWith().terrain.heightLevels).toEqual([0.61, 0.87]);
  expect(
    settingsWith({ "terrain.heightLevels": [85, 25] }).terrain.heightLevels,
  ).toEqual([0.25, 0.85]);

  expect(remapTerrainHeightMask(0.2, [0.25, 0.75])).toBe(0);
  expect(remapTerrainHeightMask(0.5, [0.25, 0.75])).toBeCloseTo(0.5);
  expect(remapTerrainHeightMask(0.8, [0.25, 0.75])).toBe(1);
  expect(remapTerrainHeightMask(0.251, [0.25, 0.75])).toBeLessThan(0.001);
  expect(remapTerrainHeightMask(0.749, [0.25, 0.75])).toBeGreaterThan(0.999);
});

it("terrain maximum height scales the completed mask", () => {
  expect(findControl("terrain.maxHeight")).toMatchObject({
    defaultValue: 1.9,
    max: 3,
    min: 0,
    step: 0.05,
    type: "slider",
    unit: "m",
  });
  expect(settingsWith().terrain.maxHeight).toBe(1.9);
  expect(settingsWith({ "terrain.maxHeight": -1 }).terrain.maxHeight).toBe(0);
  expect(settingsWith({ "terrain.maxHeight": 7 }).terrain.maxHeight).toBe(3);
  expect(() => findControl("terrain.heightContrast")).toThrow();
  expect(() => findControl("terrain.heightRange")).toThrow();
});

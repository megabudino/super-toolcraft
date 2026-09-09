import { describe, expect, it } from "vitest";
import type {
  ToolcraftControlSchema,
  ToolcraftState,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import {
  calculateLawnBladeCount,
  createGrassLayout,
} from "./grass/grass-layout";
import {
  getGrassLayoutKey,
  getLawnLayoutKey,
  readGrassSettings,
} from "./grass/grass-values";

function findControl(target: string): ToolcraftControlSchema {
  for (const section of appSchema.panels.controls?.sections ?? []) {
    const control = Object.values(section.controls).find(
      (candidate) => candidate.target === target,
    );
    if (control) return control;
  }
  throw new Error(`Missing control ${target}`);
}

function settingsWith(values: Record<string, unknown> = {}) {
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

describe("Grass Studio dual layers", () => {
  it("dual grass layers map independent settings and wind ownership", () => {
    const initial = settingsWith();
    const changedLawn = settingsWith({
      "lawn.colorContrast": 130,
      "lawn.colorSaturation": 55,
      "lawn.colorVariation": 76,
      "lawn.bladeGradient": {
        angle: 20,
        gradientType: "radial",
        stops: [
          { color: "#08220d", opacity: 100, position: "0%" },
          { color: "#45a138", opacity: 85, position: "55%" },
          { color: "#c4e66f", opacity: 70, position: "100%" },
        ],
      },
      "lawn.densityMax": 22_000,
      "lawn.heightRange": [0.12, 0.42],
      "lawn.seed": 73,
    });
    expect(findControl("grass.enabled")).toMatchObject({
      defaultValue: true,
      type: "switch",
    });
    expect(findControl("lawn.enabled")).toMatchObject({
      defaultValue: true,
      type: "switch",
    });
    expect(findControl("preview.lawnBladeCount")).toMatchObject({
      defaultValue: 12_000,
      max: 12_000,
      min: 1000,
      performanceRole: "workload",
    });
    expect(getGrassLayoutKey(changedLawn)).toBe(getGrassLayoutKey(initial));
    expect(getLawnLayoutKey(changedLawn)).not.toBe(getLawnLayoutKey(initial));
    expect(calculateLawnBladeCount(changedLawn)).toBe(22_000);
    expect(createGrassLayout(changedLawn, "lawn").heights).not.toEqual(
      createGrassLayout(initial, "lawn").heights,
    );
    const angledWind = settingsWith({
      "wind.directionAngle": 180,
      "wind.mode": "wind",
    });
    expect(getGrassLayoutKey(angledWind)).toBe(getGrassLayoutKey(initial));
    expect(getLawnLayoutKey(angledWind)).toBe(getLawnLayoutKey(initial));
    expect(changedLawn.lawn.bladeColors).toEqual([
      "#08220d",
      "#45a138",
      "#c4e66f",
    ]);
    expect(changedLawn.lawn.colorVariation).toBe(0.76);
    expect(changedLawn.lawn.colorContrast).toBe(1.3);
    expect(changedLawn.lawn.colorSaturation).toBe(0.55);
    expect(initial.appearance.colorVariation).toBe(0.59);
    expect(findControl("lawn.colorVariation")).toMatchObject({
      defaultValue: 88,
      max: 100,
      min: 0,
      performanceRole: "responsiveness",
      type: "slider",
    });
    for (const [target, defaultValue] of [
      ["lawn.colorContrast", 167],
      ["lawn.colorSaturation", 157],
    ] as const) {
      expect(findControl(target)).toMatchObject({
        defaultValue,
        max: 200,
        min: 0,
        performanceRole: "responsiveness",
        type: "slider",
      });
    }
  });
});

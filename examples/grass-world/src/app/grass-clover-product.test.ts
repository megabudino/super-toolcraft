import { describe, expect, it } from "vitest";
import type {
  ToolcraftControlSchema,
  ToolcraftState,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import {
  getGrassRenderKey,
  readGrassSettings,
  type GrassSettings,
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

describe("Clover product controls", () => {
  it("keeps both ground materials and their blend mask inside Surface", () => {
    const sections = appSchema.panels.controls?.sections ?? [];
    const surface = sections.find((section) => section.title === "Surface");
    expect(surface).toBeDefined();
    expect(sections.some((section) => section.title === "Clover Material"))
      .toBe(false);
    expect(sections.some((section) => section.title === "Clover Blend")).toBe(
      false,
    );
    const targets = new Set(
      Object.values(surface?.controls ?? {}).map((control) => control.target),
    );
    for (const target of [
      "appearance.groundColor",
      "surface.cloverColor",
      "surface.textureScale",
      "surface.cloverTextureScale",
      "surface.cloverMaskOffset",
      "surface.cloverMaskScale",
      "surface.cloverMaskDetail",
      "surface.cloverMaskRoughness",
      "surface.cloverMaskSeed",
      "surface.cloverMaskLevels",
    ]) {
      expect(targets.has(target), target).toBe(true);
    }
  });

  it("Clover blend preview maps value-noise state to the ground material", () => {
    expect(findControl("surface.cloverMaskOffset")).toMatchObject({
      keyframeable: false,
      type: "grassNoisePreview",
    });
    expect(findControl("surface.cloverMaskDetail")).toMatchObject({
      max: 6,
      min: 1,
      performanceRole: "workload",
      type: "slider",
    });
    expect(findControl("appearance.groundColor")).toMatchObject({
      label: "Current color",
      type: "color",
    });
    expect(findControl("surface.cloverColor")).toMatchObject({
      label: "Clover color",
      type: "color",
    });
    const initial = settingsWith();
    const changed = settingsWith({
      "surface.cloverMaskDetail": 6,
      "surface.cloverMaskOffset": [3.25, -5.5],
      "surface.cloverMaskRoughness": 82,
      "surface.cloverMaskScale": 1.2,
      "surface.cloverMaskSeed": 87,
      "surface.cloverColor": "#496f2d",
      "surface.cloverNormalStrength": 72,
      "surface.cloverRoughness": 64,
      "surface.cloverTextureScale": 1.8,
    });
    expect(changed.surface.cloverMask).toEqual({
      detail: 6,
      levels: [0.42, 0.62],
      offset: [3.25, -5.5],
      roughness: 0.82,
      scale: 1.2,
      seed: 87,
    });
    expect(changed.surface.clover).toEqual({
      color: "#496f2d",
      normalStrength: 0.72,
      roughness: 0.64,
      textureScale: 1.8,
    });
    expect(initial.surface.clover.color).toBe("#51D520");
    expect(getGrassRenderKey(changed)).not.toBe(getGrassRenderKey(initial));
  });

  it("Clover blend levels map black and white bounds to one PBR blend", () => {
    expect(findControl("surface.cloverMaskLevels")).toMatchObject({
      max: 100,
      min: 0,
      type: "rangeSlider",
    });
    expect(
      settingsWith({ "surface.cloverMaskLevels": [0, 0] }).surface.cloverMask
        .levels,
    ).toEqual([0, 0]);
    expect(
      settingsWith({ "surface.cloverMaskLevels": [100, 100] }).surface
        .cloverMask.levels,
    ).toEqual([1, 1]);
    expect(
      settingsWith({ "surface.cloverMaskLevels": [85, 25] }).surface.cloverMask
        .levels,
    ).toEqual([0.25, 0.85]);
  });
});

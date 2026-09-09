import { describe, expect, it } from "vitest";
import type { ToolcraftState } from "@/toolcraft/runtime";

import { readGrassSettings } from "./grass/grass-values";

function readDefaultPreset() {
  return readGrassSettings({
    canvas: { size: { height: 1080, width: 1920 } },
    mediaAssets: [],
    timeline: {
      currentTimeSeconds: 0,
      durationSeconds: 6,
      isLooping: true,
      isPlaying: false,
    },
    values: {},
  } as unknown as ToolcraftState);
}

describe("Grass Studio reference golden-light preset", () => {
  it("ships the reference-matched golden light as the default reset preset", () => {
    const preset = readDefaultPreset();
    expect(preset.preview).toEqual({
      bladeCount: 6000,
      lawnBladeCount: 12_000,
    });
    expect(preset.appearance).toMatchObject({
      colorContrast: 1.31,
      colorSaturation: 2,
      colorVariation: 0.59,
      groundColor: "#86BD70",
      pbrRoughness: 1,
      pbrSheen: 0.44,
    });
    expect(preset.field).toMatchObject({
      depth: 5,
      densityMax: 24_000,
      seed: 149_410,
      topFacingOnly: false,
      width: 7,
    });
    expect(preset.blade).toMatchObject({
      curveResolution: 8,
      heightMax: 0.6,
      heightMin: 0.3,
      thickness: 0.015,
      tilt2d: (-43 * Math.PI) / 180,
    });
    expect(preset.lawn).toMatchObject({
      colorContrast: 1.67,
      colorSaturation: 1.57,
      colorVariation: 0.88,
      densityMax: 36_000,
      heightMax: 0.16,
      heightMin: 0.0585,
      tilt2d: (-1 * Math.PI) / 180,
      use3d: true,
    });
    expect(preset.environment).toMatchObject({
      exposure: 1.51,
      fillStrength: 0.31,
      intensity: 2.5,
      keyColor: "#F2AB26",
      keyStrength: 1.97,
      preset: "sunrise",
      rimColor: "#DB831F",
      rimStrength: 1.72,
      rotation: 100,
      rotationX: -11,
      rotationZ: 133,
      sunPatches: {
        coverage: 0.54,
        enabled: true,
        offset: [-0.96, 0.4],
        scale: 1.2,
        seed: 50,
        softness: 0.61,
        strength: 1.56,
      },
      visible: false,
    });
    expect(preset.scene.background).toBe("#88BB77");
    expect(preset.scans.boulder).toMatchObject({
      colorContrast: 0.57,
      colorSaturation: 0.09,
      enabled: true,
      pbrAoStrength: 1,
      pbrBrightness: 1.49,
      pbrNormalStrength: 0.85,
      pbrRoughness: 0.81,
      pbrTint: "#c5c9bd",
      seed: 51,
      size: 1.55,
      surfaceOffset: -0.07,
    });
    expect(preset.view.orientation.position).toEqual([
      0.0924051962359733, 0.5138578798477916, 0.8663783001823914,
    ]);
    expect(preset.surface).toMatchObject({
      colorContrast: 1.19,
      colorSaturation: 0.55,
      normalStrength: 1.5,
      roughness: 0.41,
      textureScale: 1.55,
    });
    expect(preset.terrain).toMatchObject({
      detail: 5,
      heightLevels: [0.61, 0.87],
      maxHeight: 1.9,
      noiseOffset: [-10.576542541058394, 5.231356534090908],
      noiseScale: 0.19,
      roughness: 0.43,
      seed: 86,
    });
    expect(preset.wind.mode).toBe("simulation");
  });
});

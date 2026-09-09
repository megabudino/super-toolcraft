import { describe, expect, it } from "vitest";
import type {
  ToolcraftControlSchema,
  ToolcraftState,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import {
  grassBoulderScanAsset,
  grassGroundScanTextures,
} from "./grass/grass-scan-assets";
import {
  grassScanLayerContracts,
  grassScanLayerKinds,
} from "./grass/grass-scan-contract";
import {
  createGrassBoulderLayout,
  createGrassScanLayout,
  getGrassScanLayoutKey,
} from "./grass/grass-scan-layout";
import { grassDefaults } from "./grass/grass-defaults";
import { readGrassSettings } from "./grass/grass-values";

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

describe("Grass Studio Megascans field", () => {
  it("Megascans layers preserve deterministic counts and terrain placement", () => {
    const initial = settingsWith();
    for (const kind of grassScanLayerKinds) {
      const layout = createGrassScanLayout(kind, initial);
      expect(layout.count).toBe(initial.scans[kind].count);
      expect(createGrassScanLayout(kind, initial)).toEqual(layout);
      expect(findControl(`scan.${kind}.count`)).toMatchObject({
        max: grassScanLayerContracts[kind].countMax,
        min: 0,
        performanceRole: "workload",
        type: "slider",
      });
      expect(findControl(`scan.${kind}.sizeRange`)).toMatchObject({
        type: "rangeSlider",
        visibleWhen: { equals: true, target: `scan.${kind}.enabled` },
      });
      for (const suffix of ["colorContrast", "colorSaturation"]) {
        const target = `scan.${kind}.${suffix}` as keyof typeof grassDefaults;
        expect(findControl(`scan.${kind}.${suffix}`)).toMatchObject({
          defaultValue: grassDefaults[target],
          max: 200,
          min: 0,
          performanceRole: "responsiveness",
          type: "slider",
          visibleWhen: { equals: true, target: `scan.${kind}.enabled` },
        });
      }
      const pbrTintTarget =
        `scan.${kind}.pbrTint` as keyof typeof grassDefaults;
      expect(findControl(`scan.${kind}.pbrTint`)).toMatchObject({
        defaultValue: grassDefaults[pbrTintTarget],
        performanceRole: "responsiveness",
        type: "color",
        visibleWhen: { equals: true, target: `scan.${kind}.enabled` },
      });
      for (const suffix of [
        "pbrBrightness",
        "pbrRoughness",
        "pbrNormalStrength",
      ]) {
        expect(findControl(`scan.${kind}.${suffix}`)).toMatchObject({
          min: 0,
          performanceRole: "responsiveness",
          type: "slider",
          visibleWhen: { equals: true, target: `scan.${kind}.enabled` },
        });
      }
      for (const suffix of ["pbrAoStrength", "pbrSheen", "pbrBacklight"]) {
        expect(() => findControl(`scan.${kind}.${suffix}`)).toThrow();
      }
      for (let index = 0; index < layout.count; index += 1) {
        const y = layout.offsets[index * 3 + 1];
        expect(Number.isFinite(y)).toBe(true);
      }
    }

    const changedYellow = settingsWith({
      "scan.yellow.clumping": 12,
      "scan.yellow.count": 18,
      "scan.yellow.seed": 4,
      "scan.yellow.sizeRange": [0.5, 0.8],
    });
    expect(createGrassScanLayout("yellow", changedYellow).count).toBe(18);
    expect(getGrassScanLayoutKey("yellow", changedYellow)).not.toBe(
      getGrassScanLayoutKey("yellow", initial),
    );
    expect(getGrassScanLayoutKey("white", changedYellow)).toBe(
      getGrassScanLayoutKey("white", initial),
    );
    expect(initial.surface).toMatchObject({
      colorContrast: 1.19,
      colorSaturation: 0.55,
      normalStrength: 1.5,
      roughness: 0.41,
      textureScale: 1.55,
    });
    expect(grassGroundScanTextures.baseColor).toContain(
      "assets/scans/ground/ground-basecolor.webp",
    );
    expect(grassBoulderScanAsset.geometry).toContain(
      "assets/scans/boulder/boulder.meshbin",
    );
    expect(initial.scans.boulder).toMatchObject({
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
    for (const target of [
      "scan.boulder.enabled",
      "scan.boulder.size",
      "scan.boulder.seed",
      "scan.boulder.surfaceOffset",
      "scan.boulder.pbrTint",
      "scan.boulder.pbrBrightness",
      "scan.boulder.colorContrast",
      "scan.boulder.colorSaturation",
      "scan.boulder.pbrRoughness",
      "scan.boulder.pbrNormalStrength",
      "surface.colorContrast",
      "surface.colorSaturation",
    ]) {
      expect(findControl(target)).toBeDefined();
    }
    const initialBoulder = createGrassBoulderLayout(
      settingsWith({ "scan.boulder.enabled": true }),
    );
    expect(initialBoulder.count).toBe(1);
    const movedBoulderSettings = settingsWith({
      "scan.boulder.enabled": true,
      "scan.boulder.seed": 87,
    });
    expect(createGrassBoulderLayout(movedBoulderSettings)).not.toEqual(
      initialBoulder,
    );
    expect(
      createGrassBoulderLayout(settingsWith({ "scan.boulder.enabled": true })),
    ).toEqual(initialBoulder);
    const gradedYellow = settingsWith({
      "scan.yellow.colorContrast": 160,
      "scan.yellow.colorSaturation": 45,
      "scan.yellow.pbrAoStrength": 125,
      "scan.yellow.pbrBacklight": 50,
      "scan.yellow.pbrBrightness": 80,
      "scan.yellow.pbrNormalStrength": 140,
      "scan.yellow.pbrRoughness": 72,
      "scan.yellow.pbrSheen": 35,
      "scan.yellow.pbrTint": "#f0ffaa",
    });
    expect(gradedYellow.scans.yellow).toMatchObject({
      colorContrast: 1.6,
      colorSaturation: 0.45,
      pbrAoStrength: 1,
      pbrBacklight: 0.5,
      pbrBrightness: 0.8,
      pbrNormalStrength: 1.4,
      pbrRoughness: 0.72,
      pbrSheen: 0.35,
      pbrTint: "#f0ffaa",
    });
    for (const suffix of [
      "pbrAoStrength",
      "textureMaskLevels",
      "textureMaskScale",
      "textureMaskSeed",
    ]) {
      expect(() => findControl(`scan.boulder.${suffix}`)).toThrow();
    }
    expect(getGrassScanLayoutKey("yellow", gradedYellow)).toBe(
      getGrassScanLayoutKey("yellow", initial),
    );
  });
});

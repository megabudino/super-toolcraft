import * as THREE from "three";
import { describe, expect, it } from "vitest";
import type {
  ToolcraftControlSchema,
  ToolcraftState,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import {
  applyGrassLayerMaterialSettings,
  createGrassLayerMaterialSet,
} from "./grass/grass-material";
import { createGrassSunPatchUniforms } from "./grass/grass-sun-patches";
import { GrassSurfaceEdgeFadeResource } from "./grass/grass-surface-edge-fade";
import {
  applyGrassTextureMaskSettings,
  createGrassTextureMaskUniforms,
  extendGrassStandardMaterialWithTextureMask,
  grassTextureMaskFragmentDeclarations,
} from "./grass/grass-texture-mask";
import { readGrassSettings } from "./grass/grass-values";
import { GrassWindFrameController } from "./grass/grass-wind";

const owners = [
  "appearance",
  "lawn",
  "surface",
  "scan.tufted",
  "scan.wild",
  "scan.white",
  "scan.yellow",
  "scan.rocks",
  "scan.boulder",
] as const;

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

describe("Grass texture masks", () => {
  it("texture masks normalize imported state without exposing editor settings", () => {
    for (const owner of owners) {
      for (const suffix of ["Levels", "Scale", "Seed"]) {
        expect(() => findControl(`${owner}.textureMask${suffix}`)).toThrow();
      }
    }

    const fixed = settingsWith({
      "appearance.textureMaskLevels": [0, 0],
      "appearance.textureMaskScale": 4.2,
      "appearance.textureMaskSeed": 83,
      "lawn.textureMaskLevels": [35, 70],
      "scan.rocks.textureMaskLevels": [100, 100],
      "surface.textureMaskLevels": [90, 10],
    });
    expect(fixed.appearance.textureMask).toEqual({
      levels: [0, 0],
      scale: 4.2,
      seed: 83,
    });
    expect(fixed.lawn.textureMask.levels).toEqual([0.35, 0.7]);
    expect(fixed.scans.rocks.textureMask.levels).toEqual([1, 1]);
    expect(fixed.surface.textureMask.levels).toEqual([0.1, 0.9]);

    const uniforms = createGrassTextureMaskUniforms();
    applyGrassTextureMaskSettings(uniforms, fixed.appearance.textureMask);
    expect(
      (uniforms.uGrassTextureMaskLevels?.value as THREE.Vector2).toArray(),
    ).toEqual([0, 0]);
    expect(uniforms.uGrassTextureMaskScale?.value).toBe(4.2);
    expect(uniforms.uGrassTextureMaskSeed?.value).toBe(83);
    expect(grassTextureMaskFragmentDeclarations).toContain(
      "grassEvaluateTextureMaskAt",
    );

    const standardMaterial = new THREE.MeshStandardMaterial();
    extendGrassStandardMaterialWithTextureMask(
      standardMaterial,
      uniforms,
      "test",
    );
    expect(standardMaterial.customProgramCacheKey()).toContain(
      "grass-texture-mask-v2:material:test",
    );
    standardMaterial.dispose();

    const materials = createGrassLayerMaterialSet(
      "texture-mask-test",
      createGrassSunPatchUniforms(),
      new GrassSurfaceEdgeFadeResource(),
    );
    const wind = new GrassWindFrameController().resolve(
      fixed.wind,
      0,
      "export",
      0,
    );
    applyGrassLayerMaterialSettings(materials, {
      alignToNormals: 1,
      colorContrast: 1,
      colorSaturation: 1,
      colorVariation: 0.5,
      depthOffset: 0,
      environmentContrast: 0,
      environmentDirection: [1, 0],
      environmentIntensity: 1,
      environmentTint: [1, 1, 1],
      gradient: settingsWith().appearance.bladeGradient,
      highlightWarmth: 0,
      instanceColors: {
        colors: ["#173a26", "#789546", "#eef29a"],
        weights: [0.34, 0.33, 0.33],
      },
      instanceColorSeed: 1,
      pbrRoughness: 0.8,
      pbrSheen: 0.3,
      randomRotation: 1,
      restBendScale: 0.78,
      sceneContrast: 1,
      sceneSaturation: 1,
      shadowCoolness: 0,
      taper: 0.9,
      textureMask: fixed.appearance.textureMask,
      thickness: 0.05,
      tilt: 0,
      wind,
      windResponse: 1,
    });
    expect(materials.uniforms.uGrassTextureMaskScale?.value).toBe(4.2);
    materials.depth.dispose();
    materials.pbr.dispose();
  });
});

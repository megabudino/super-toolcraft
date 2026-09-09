import * as THREE from "three";
import { describe, expect, it } from "vitest";
import type { ToolcraftControlSchema, ToolcraftState } from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import {
  applyGrassInstanceColorSettings,
  createGrassInstanceColorUniforms,
  grassInstanceColorFragmentDeclarations,
  grassInstanceColorVertexDeclarations,
  normalizeGrassInstanceColorWeights,
} from "./grass/grass-instance-colors";
import { createGrassSceneLayerMaterialSettings } from "./grass/grass-scene-material-settings";
import { readGrassSettings } from "./grass/grass-values";
import { GrassWindFrameController } from "./grass/grass-wind";

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

describe("Grass instance color distribution", () => {
  it("grass instance color distribution maps weighted palettes and layer seeds", () => {
    for (const owner of ["appearance", "lawn"] as const) {
      for (const index of [1, 2, 3] as const) {
        expect(findControl(`${owner}.instanceColor${index}`)).toMatchObject({
          performanceRole: "responsiveness",
          type: "color",
        });
        expect(findControl(`${owner}.instanceColorWeight${index}`)).toMatchObject({
          max: 100,
          min: 0,
          performanceRole: "responsiveness",
          type: "slider",
        });
      }
    }

    const changed = settingsWith({
      "appearance.instanceColor1": "#ff0000",
      "appearance.instanceColor2": "#00ff00",
      "appearance.instanceColor3": "#0000ff",
      "appearance.instanceColorWeight1": 25,
      "appearance.instanceColorWeight2": 75,
      "appearance.instanceColorWeight3": 0,
      "field.seed": 73,
      "lawn.instanceColorWeight1": 0,
      "lawn.instanceColorWeight2": 0,
      "lawn.instanceColorWeight3": 0,
      "lawn.seed": 19,
    });
    expect(changed.appearance.instanceColors).toEqual({
      colors: ["#ff0000", "#00ff00", "#0000ff"],
      weights: [0.25, 0.75, 0],
    });
    expect(changed.lawn.instanceColors.weights).toEqual([
      1 / 3,
      1 / 3,
      1 / 3,
    ]);
    expect(normalizeGrassInstanceColorWeights([10, Number.NaN, -4])).toEqual([
      1,
      0,
      0,
    ]);

    const uniforms = createGrassInstanceColorUniforms();
    applyGrassInstanceColorSettings(
      uniforms,
      changed.appearance.instanceColors,
      changed.field.seed,
    );
    expect(
      (uniforms.uInstanceColor1?.value as THREE.Color).getHexString(),
    ).toBe("ff0000");
    expect(
      (uniforms.uInstanceColorWeights?.value as THREE.Vector3).toArray(),
    ).toEqual([0.25, 0.75, 0]);
    expect(uniforms.uInstanceColorSeed?.value).toBe(73);
    expect(grassInstanceColorVertexDeclarations).toContain(
      "uInstanceColorSeed",
    );
    expect(grassInstanceColorFragmentDeclarations).toContain(
      "grassSelectedInstanceColor",
    );

    const lighting = {
      contrast: 0,
      direction: [1, 0] as const,
      tint: [1, 1, 1] as const,
    };
    const wind = new GrassWindFrameController().resolve(
      changed.wind,
      0,
      "export",
      0,
    );
    expect(
      createGrassSceneLayerMaterialSettings({
        layer: "tall",
        lighting,
        settings: changed,
        wind,
      }).instanceColorSeed,
    ).toBe(73);
    expect(
      createGrassSceneLayerMaterialSettings({
        layer: "lawn",
        lighting,
        settings: changed,
        wind,
      }).instanceColorSeed,
    ).toBe(19);
  });
});

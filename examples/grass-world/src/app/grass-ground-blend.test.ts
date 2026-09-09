import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  applyGrassGroundBlendSettings,
  applyGrassGroundColorTints,
  createGrassGroundBlendUniforms,
  extendGrassStandardMaterialWithGroundBlend,
} from "./grass/grass-ground-blend-material";
import { createGrassTextureMaskUniforms } from "./grass/grass-texture-mask";
import { readGrassSettings } from "./grass/grass-values";
import type { ToolcraftState } from "@/toolcraft/runtime";

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

describe("Clover ground material blend", () => {
  it("updates one shared mask and all Clover PBR uniforms", () => {
    const uniforms = createGrassGroundBlendUniforms();
    const surface = settingsWith({
      "surface.cloverMaskDetail": 5,
      "surface.cloverMaskLevels": [18, 76],
      "surface.cloverMaskOffset": [4, -2],
      "surface.cloverMaskRoughness": 67,
      "surface.cloverMaskScale": 0.72,
      "surface.cloverMaskSeed": 63,
      "surface.cloverNormalStrength": 88,
      "surface.cloverRoughness": 74,
      "surface.cloverTextureScale": 2,
      "surface.brightness": 240,
      "surface.textureScale": 0.5,
    }).surface;
    applyGrassGroundBlendSettings(uniforms, surface);

    expect(uniforms.uGrassCloverMaskDetail?.value).toBe(5);
    expect(
      (uniforms.uGrassCloverMaskLevels?.value as THREE.Vector2).toArray(),
    ).toEqual([0.18, 0.76]);
    expect(
      (uniforms.uGrassCloverMaskOffset?.value as THREE.Vector2).toArray(),
    ).toEqual([4, -2]);
    expect(uniforms.uGrassCloverMaskRoughness?.value).toBe(0.67);
    expect(uniforms.uGrassCloverMaskScale?.value).toBe(0.72);
    expect(uniforms.uGrassCloverMaskSeed?.value).toBe(63);
    expect(
      (uniforms.uGrassCloverNormalScale?.value as THREE.Vector2).toArray(),
    ).toEqual([0.88, -0.88]);
    expect(uniforms.uGrassCloverRoughness?.value).toBe(0.74);
    expect(uniforms.uGrassCloverUvScale?.value).toBe(4);
    expect(uniforms.uGrassSurfaceBrightness?.value).toBe(2.4);

    applyGrassGroundColorTints(uniforms, "#7a9d45", "#496f2d");
    expect(
      (uniforms.uGrassCurrentColorTint?.value as THREE.Color).getHexString(),
    ).toBe("7a9d45");
    expect(
      (uniforms.uGrassCloverColorTint?.value as THREE.Color).getHexString(),
    ).toBe("496f2d");
  });

  it("injects one retained shader that blends color AO normal and roughness", () => {
    const material = new THREE.MeshStandardMaterial();
    const blendUniforms = createGrassGroundBlendUniforms();
    extendGrassStandardMaterialWithGroundBlend(
      material,
      createGrassTextureMaskUniforms(),
      blendUniforms,
      "test",
    );
    const shader = {
      fragmentShader: [
        "#include <common>",
        "#include <map_fragment>",
        "#include <roughnessmap_fragment>",
        "#include <normal_fragment_maps>",
        "#include <aomap_fragment>",
      ].join("\n"),
      uniforms: {},
      vertexShader: ["#include <common>", "#include <project_vertex>"].join(
        "\n",
      ),
    };
    material.onBeforeCompile(
      shader as THREE.WebGLProgramParametersWithUniforms,
      null as unknown as THREE.WebGLRenderer,
    );

    expect(shader.fragmentShader).toContain("grassCloverEvaluateMask");
    expect(shader.fragmentShader).toContain("uGrassCloverMap");
    expect(shader.fragmentShader).toContain("uGrassCloverAoMap");
    expect(shader.fragmentShader).toContain("uGrassCloverNormalMap");
    expect(shader.fragmentShader).toContain("uGrassCloverRoughnessMap");
    expect(shader.fragmentShader).toContain(
      "grassGroundMapSample.rgb = grassApplyGroundColorTint(\n      grassGroundMapSample.rgb,\n      uGrassCurrentColorTint",
    );
    expect(shader.fragmentShader).toContain(
      "grassCloverMapSample.rgb = grassApplyGroundColorTint(\n      grassCloverMapSample.rgb,\n      uGrassCloverColorTint",
    );
    expect(shader.fragmentShader).toContain(
      "float grassGroundColorLuminance",
    );
    expect(shader.fragmentShader).toContain(
      "diffuseColor.rgb *= uGrassSurfaceBrightness",
    );
    expect(shader.vertexShader).toContain("vGrassGroundBlendWorldPosition");
    expect(material.customProgramCacheKey()).toContain(
      "grass-ground-blend-v5:test",
    );
    material.dispose();
  });
});

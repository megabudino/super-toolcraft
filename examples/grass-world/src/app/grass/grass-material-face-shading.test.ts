import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  createGrassLayerMaterialSet,
  disposeGrassLayerMaterialSet,
} from "./grass-material";
import { GrassSurfaceEdgeFadeResource } from "./grass-surface-edge-fade";
import { createGrassSunPatchUniforms } from "./grass-sun-patches";

function compileFragment(clump: boolean) {
  const materials = createGrassLayerMaterialSet(
    clump ? "lawn-face-test" : "tall-face-test",
    createGrassSunPatchUniforms(),
    new GrassSurfaceEdgeFadeResource(),
    { clump },
  );
  const shader = {
    fragmentShader: [
      "#include <common>",
      "#include <color_fragment>",
      "#include <normal_fragment_begin>",
      "#include <opaque_fragment>",
    ].join("\n"),
    uniforms: {},
    vertexShader: [
      "#include <common>",
      "#include <beginnormal_vertex>",
      "#include <begin_vertex>",
      "#include <project_vertex>",
    ].join("\n"),
  };
  materials.pbr.onBeforeCompile(
    shader as THREE.WebGLProgramParametersWithUniforms,
    null as unknown as THREE.WebGLRenderer,
  );
  const result = {
    cacheKey: materials.pbr.customProgramCacheKey(),
    defines: materials.pbr.defines,
    fragmentShader: shader.fragmentShader,
    vertexShader: shader.vertexShader,
  };
  disposeGrassLayerMaterialSet(materials);
  return result;
}

describe("Tall Grass equal-face color", () => {
  it("uses the same PBR normal on the front and reverse sides of Tall ribbons", () => {
    const tall = compileFragment(false);
    const lawn = compileFragment(true);

    expect(tall.defines).toMatchObject({
      GRASS_EQUAL_FACE_SHADING: "1",
      GRASS_SHARED_WIND_FORCE: "1",
    });
    expect(tall.fragmentShader).toContain("if (!gl_FrontFacing)");
    expect(tall.fragmentShader).toContain("normal = -normal;");
    expect(tall.fragmentShader).toContain("nonPerturbedNormal = normal;");
    expect(tall.vertexShader).toContain("vec2 grassForce = grassNormalForce;");
    expect(tall.cacheKey).toContain("grass-pbr-v7:tall-face-test");

    expect(lawn.defines).not.toHaveProperty("GRASS_EQUAL_FACE_SHADING");
    expect(lawn.defines).toMatchObject({
      GRASS_LAWN_CLUMP: "1",
      GRASS_SHARED_WIND_FORCE: "1",
    });
  });
});

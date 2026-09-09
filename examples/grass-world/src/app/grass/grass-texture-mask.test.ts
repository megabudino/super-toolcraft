import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  createGrassTextureMaskUniforms,
  extendGrassStandardMaterialWithTextureMask,
} from "./grass-texture-mask";

function compileTextureMaskFragment(mapTint: "material" | "neutral"): string {
  const material = new THREE.MeshStandardMaterial({ color: "#78a45f" });
  extendGrassStandardMaterialWithTextureMask(
    material,
    createGrassTextureMaskUniforms(),
    `test-${mapTint}`,
    { mapTint },
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
    vertexShader: "#include <common>\n#include <project_vertex>",
  };
  material.onBeforeCompile(
    shader as Parameters<typeof material.onBeforeCompile>[0],
    {} as THREE.WebGLRenderer,
  );
  return shader.fragmentShader;
}

describe("grass texture-mask material tinting", () => {
  it("keeps ordinary scan and grass maps multiplied by their material tint", () => {
    const fragmentShader = compileTextureMaskFragment("material");

    expect(fragmentShader).toContain("#include <map_fragment>");
    expect(fragmentShader).toContain("diffuseColor.rgb = mix(");
    expect(fragmentShader).toContain("diffuse,");
  });

  it("mixes Terrain fallback color against a neutral PBR BaseColor sample", () => {
    const fragmentShader = compileTextureMaskFragment("neutral");

    expect(fragmentShader).not.toContain("#include <map_fragment>");
    expect(fragmentShader).toContain(
      "vec4 grassTextureMaskFallbackColor = diffuseColor;",
    );
    expect(fragmentShader).toContain(
      "vec4 grassTextureMaskSample = texture2D(map, vMapUv);",
    );
    expect(fragmentShader).toContain("grassTextureMaskFallbackColor.rgb,");
    expect(fragmentShader).toContain("grassTextureMaskSample.rgb,");
    expect(fragmentShader).not.toContain(
      "diffuseColor *= grassTextureMaskSample;",
    );
  });
});

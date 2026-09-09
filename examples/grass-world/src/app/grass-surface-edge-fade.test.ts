import * as THREE from "three";
import { describe, expect, it } from "vitest";
import type { ToolcraftState } from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import {
  createGrassLayerMaterialSet,
  disposeGrassLayerMaterialSet,
} from "./grass/grass-material";
import type { GrassScanLayerKind } from "./grass/grass-scan-contract";
import {
  createGrassBoulderMaterialBundle,
  createGrassScanMaterialBundle,
  type GrassScanLoadedTextureSet,
} from "./grass/grass-scan-materials";
import { createGrassSunPatchUniforms } from "./grass/grass-sun-patches";
import {
  applyGrassSurfaceEdgeFadeSettings,
  createGrassSurfaceEdgeFadeUniforms,
  extendGrassMaterialWithSurfaceEdgeFade,
  GrassSurfaceEdgeFadeResource,
} from "./grass/grass-surface-edge-fade";
import { readGrassSettings } from "./grass/grass-values";

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

describe("Surface edge fade", () => {
  it("exposes one focused section after Surface and normalizes its settings", () => {
    const sections = appSchema.panels.controls?.sections ?? [];
    const fade = sections.find((section) => section.title === "Surface Fade");
    expect(fade?.title).toBe("Surface Fade");
    expect(
      Object.values(fade?.controls ?? {}).map(({ target }) => target),
    ).toEqual(["surface.edgeFadeWidth", "surface.edgeFadeStrength"]);

    const settings = settingsWith({
      "field.depth": 6,
      "field.edgeIrregularity": 24,
      "field.shapeRoundness": 35,
      "field.width": 8,
      "surface.edgeFadeStrength": 72,
      "surface.edgeFadeWidth": 28,
    });
    expect(settings.surface.edgeFade).toEqual({ strength: 0.72, width: 0.28 });

    const uniforms = createGrassSurfaceEdgeFadeUniforms();
    applyGrassSurfaceEdgeFadeSettings(uniforms, settings);
    expect(uniforms.uGrassSurfaceEdgeFadeStrength?.value).toBe(0.72);
    expect(uniforms.uGrassSurfaceEdgeFadeWidth?.value).toBe(0.28);
    expect(uniforms.uGrassSurfaceEdgeIrregularity?.value).toBe(0.24);
    expect(uniforms.uGrassSurfaceEdgeRoundness?.value).toBe(0.35);
    expect(uniforms.uGrassSurfaceEdgeSeed?.value).toBe(86);
    expect(
      (uniforms.uGrassSurfaceEdgeHalfSize?.value as THREE.Vector2).toArray(),
    ).toEqual([4, 3]);
  });

  it("shares one world-field falloff across blended color and hashed depth materials", () => {
    const material = new THREE.MeshStandardMaterial();
    const uniforms = createGrassSurfaceEdgeFadeUniforms();
    extendGrassMaterialWithSurfaceEdgeFade(
      material,
      uniforms,
      "terrain-test",
      "blend",
    );
    const shader = {
      fragmentShader: ["#include <common>", "#include <opaque_fragment>"].join(
        "\n",
      ),
      uniforms: {},
      vertexShader: ["#include <common>", "#include <project_vertex>"].join(
        "\n",
      ),
    };
    material.onBeforeCompile(
      shader as THREE.WebGLProgramParametersWithUniforms,
      null as unknown as THREE.WebGLRenderer,
    );

    expect(material.transparent).toBe(true);
    expect(material.alphaToCoverage).toBe(true);
    expect(shader.vertexShader).toContain("vGrassSurfaceEdgeWorldPosition");
    expect(shader.vertexShader).toContain(
      "instanceMatrix * grassSurfaceEdgeWorldPosition",
    );
    expect(shader.vertexShader).toContain(
      "modelMatrix * grassSurfaceEdgeWorldPosition",
    );
    expect(shader.fragmentShader).toContain("grassSurfaceEdgeDistance");
    expect(shader.fragmentShader).toContain("grassSurfaceEdgeExponent");
    expect(shader.fragmentShader).toContain("diffuseColor.a *= mix");
    expect(shader.fragmentShader).toContain("discard");
    expect(material.customProgramCacheKey()).toContain(
      "grass-surface-edge-fade-v3:blend:terrain-test",
    );

    const depthMaterial = new THREE.MeshDepthMaterial();
    extendGrassMaterialWithSurfaceEdgeFade(
      depthMaterial,
      uniforms,
      "objects-depth-test",
      "hashed",
    );
    const depthShader = {
      fragmentShader: [
        "#include <common>",
        "#include <alphahash_fragment>",
      ].join("\n"),
      uniforms: {},
      vertexShader: ["#include <common>", "#include <project_vertex>"].join(
        "\n",
      ),
    };
    depthMaterial.onBeforeCompile(
      depthShader as THREE.WebGLProgramParametersWithUniforms,
      null as unknown as THREE.WebGLRenderer,
    );
    expect(depthMaterial.alphaHash).toBe(true);
    expect(depthMaterial.transparent).toBe(false);
    expect(depthShader.fragmentShader).toContain("diffuseColor.a *= mix");
    expect(
      depthShader.fragmentShader.indexOf("diffuseColor.a *= mix"),
    ).toBeLessThan(
      depthShader.fragmentShader.indexOf("#include <alphahash_fragment>"),
    );
    expect(depthMaterial.customProgramCacheKey()).toContain(
      "grass-surface-edge-fade-v3:hashed:objects-depth-test",
    );
    depthMaterial.dispose();
    material.dispose();
  });

  it("wires the shared color and shadow mask into every grass and scanned-object bundle", () => {
    const edgeFade = new GrassSurfaceEdgeFadeResource();
    const sunPatches = createGrassSunPatchUniforms();
    for (const [cacheKey, clump] of [
      ["tall", false],
      ["lawn-clump", true],
    ] as const) {
      const materials = createGrassLayerMaterialSet(
        cacheKey,
        sunPatches,
        edgeFade,
        { clump },
      );
      expect(materials.pbr.alphaHash).toBe(true);
      expect(materials.depth.alphaHash).toBe(true);
      expect(materials.pbr.customProgramCacheKey()).toContain(
        `grass-surface-edge-fade-v3:hashed:grass-pbr:${cacheKey}`,
      );
      expect(materials.depth.customProgramCacheKey()).toContain(
        `grass-surface-edge-fade-v3:hashed:grass-depth:${cacheKey}`,
      );
      disposeGrassLayerMaterialSet(materials);
    }

    const textures: GrassScanLoadedTextureSet = {
      ao: new THREE.Texture(),
      baseColor: new THREE.Texture(),
      normal: new THREE.Texture(),
      opacity: new THREE.Texture(),
      roughness: new THREE.Texture(),
    };
    for (const kind of [
      "tufted",
      "wild",
      "white",
      "yellow",
      "rocks",
    ] satisfies readonly GrassScanLayerKind[]) {
      const bundle = createGrassScanMaterialBundle(
        kind,
        textures,
        sunPatches,
        edgeFade,
      );
      expect(bundle.material.alphaHash).toBe(true);
      expect(bundle.depthMaterial.alphaHash).toBe(true);
      expect(bundle.material.customProgramCacheKey()).toContain(
        `grass-surface-edge-fade-v3:hashed:scan:${kind}`,
      );
      expect(bundle.depthMaterial.customProgramCacheKey()).toContain(
        `grass-surface-edge-fade-v3:hashed:scan:${kind}:depth`,
      );
      bundle.material.dispose();
      bundle.depthMaterial.dispose();
    }

    const boulder = createGrassBoulderMaterialBundle(
      textures,
      sunPatches,
      edgeFade,
    );
    expect(boulder.material.alphaHash).toBe(true);
    expect(boulder.depthMaterial.alphaHash).toBe(true);
    expect(boulder.material.customProgramCacheKey()).toContain(
      "grass-surface-edge-fade-v3:hashed:scan:boulder",
    );
    expect(boulder.depthMaterial.customProgramCacheKey()).toContain(
      "grass-surface-edge-fade-v3:hashed:scan:boulder:depth",
    );
    boulder.material.dispose();
    boulder.depthMaterial.dispose();
    for (const texture of Object.values(textures)) texture.dispose();
  });
});

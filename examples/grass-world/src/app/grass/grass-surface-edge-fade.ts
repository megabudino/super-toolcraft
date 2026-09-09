import * as THREE from "three";

import type { GrassSettings } from "./grass-values";

export type GrassSurfaceEdgeFadeUniforms = Record<string, THREE.IUniform>;
export type GrassSurfaceEdgeFadeMode = "blend" | "hashed";

type GrassSurfaceEdgeFadeMaterial =
  THREE.MeshDepthMaterial | THREE.MeshStandardMaterial;

const vertexDeclarations = /* glsl */ `
  varying vec2 vGrassSurfaceEdgeWorldPosition;
`;

const vertexAssignment = /* glsl */ `
  vec4 grassSurfaceEdgeWorldPosition = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
    grassSurfaceEdgeWorldPosition =
      batchingMatrix * grassSurfaceEdgeWorldPosition;
  #endif
  #ifdef USE_INSTANCING
    grassSurfaceEdgeWorldPosition =
      instanceMatrix * grassSurfaceEdgeWorldPosition;
  #endif
  grassSurfaceEdgeWorldPosition =
    modelMatrix * grassSurfaceEdgeWorldPosition;
  vGrassSurfaceEdgeWorldPosition = grassSurfaceEdgeWorldPosition.xz;
`;

const fragmentDeclarations = /* glsl */ `
  varying vec2 vGrassSurfaceEdgeWorldPosition;
  uniform float uGrassSurfaceEdgeIrregularity;
  uniform vec2 uGrassSurfaceEdgeHalfSize;
  uniform float uGrassSurfaceEdgeRoundness;
  uniform float uGrassSurfaceEdgeSeed;
  uniform float uGrassSurfaceEdgeFadeStrength;
  uniform float uGrassSurfaceEdgeFadeWidth;
`;

const fragmentFade = /* glsl */ `
  vec2 grassSurfaceEdgeNormalizedPosition =
    vGrassSurfaceEdgeWorldPosition / max(
      uGrassSurfaceEdgeHalfSize,
      vec2(0.001)
    );
  float grassSurfaceEdgeExponent = 2.0 +
    (1.0 - clamp(uGrassSurfaceEdgeRoundness, 0.0, 1.0)) * 10.0;
  float grassSurfaceEdgeAngle = atan(
    grassSurfaceEdgeNormalizedPosition.y,
    grassSurfaceEdgeNormalizedPosition.x
  );
  float grassSurfaceEdgePhase = uGrassSurfaceEdgeSeed * 0.173;
  float grassSurfaceEdgeWave =
    sin(grassSurfaceEdgeAngle * 3.0 + grassSurfaceEdgePhase) * 0.67 +
    sin(grassSurfaceEdgeAngle * 7.0 - grassSurfaceEdgePhase * 1.7) * 0.33;
  float grassSurfaceEdgeScale = 1.0 -
    uGrassSurfaceEdgeIrregularity * 0.5 +
    grassSurfaceEdgeWave * uGrassSurfaceEdgeIrregularity * 0.5;
  float grassSurfaceEdgeDistance = pow(
    pow(abs(grassSurfaceEdgeNormalizedPosition.x), grassSurfaceEdgeExponent) +
      pow(abs(grassSurfaceEdgeNormalizedPosition.y), grassSurfaceEdgeExponent),
    1.0 / grassSurfaceEdgeExponent
  ) / max(0.001, grassSurfaceEdgeScale);
  float grassSurfaceEdgeInwardDistance = 1.0 - grassSurfaceEdgeDistance;
  float grassSurfaceEdgeFadeEnabled = step(
    0.0001,
    uGrassSurfaceEdgeFadeWidth
  ) * uGrassSurfaceEdgeFadeStrength;
  float grassSurfaceEdgeAlpha = smoothstep(
    0.0,
    max(0.0001, uGrassSurfaceEdgeFadeWidth),
    grassSurfaceEdgeInwardDistance
  );
  diffuseColor.a *= mix(
    1.0,
    grassSurfaceEdgeAlpha,
    grassSurfaceEdgeFadeEnabled
  );
  if (diffuseColor.a <= 0.001) discard;
`;

export function createGrassSurfaceEdgeFadeUniforms(): GrassSurfaceEdgeFadeUniforms {
  return {
    uGrassSurfaceEdgeFadeStrength: { value: 1 },
    uGrassSurfaceEdgeFadeWidth: { value: 0.12 },
    uGrassSurfaceEdgeIrregularity: { value: 0.07 },
    uGrassSurfaceEdgeHalfSize: { value: new THREE.Vector2(3.5, 2.5) },
    uGrassSurfaceEdgeRoundness: { value: 1 },
    uGrassSurfaceEdgeSeed: { value: 4 },
  };
}

export function applyGrassSurfaceEdgeFadeSettings(
  uniforms: GrassSurfaceEdgeFadeUniforms,
  settings: GrassSettings,
): void {
  uniforms.uGrassSurfaceEdgeFadeStrength!.value =
    settings.surface.edgeFade.strength;
  uniforms.uGrassSurfaceEdgeFadeWidth!.value = settings.surface.edgeFade.width;
  uniforms.uGrassSurfaceEdgeIrregularity!.value =
    settings.field.edgeIrregularity;
  uniforms.uGrassSurfaceEdgeRoundness!.value = settings.field.shapeRoundness;
  uniforms.uGrassSurfaceEdgeSeed!.value = settings.terrain.seed;
  (uniforms.uGrassSurfaceEdgeHalfSize!.value as THREE.Vector2).set(
    settings.field.width * 0.5,
    settings.field.depth * 0.5,
  );
}

export function extendGrassMaterialWithSurfaceEdgeFade(
  material: GrassSurfaceEdgeFadeMaterial,
  uniforms: GrassSurfaceEdgeFadeUniforms,
  cacheKey: string,
  mode: GrassSurfaceEdgeFadeMode,
): void {
  const previousOnBeforeCompile = material.onBeforeCompile;
  const previousProgramCacheKey = material.customProgramCacheKey;
  material.alphaToCoverage = true;
  if (mode === "blend") {
    material.transparent = true;
  } else {
    material.alphaHash = true;
    material.transparent = false;
  }
  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${vertexDeclarations}`)
      .replace(
        "#include <project_vertex>",
        `${vertexAssignment}\n#include <project_vertex>`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\n${fragmentDeclarations}`,
      )
      .replace(
        mode === "blend"
          ? "#include <opaque_fragment>"
          : "#include <alphahash_fragment>",
        `${fragmentFade}\n#include <${mode === "blend" ? "opaque" : "alphahash"}_fragment>`,
      );
  };
  material.customProgramCacheKey = () =>
    `${previousProgramCacheKey.call(material)}:grass-surface-edge-fade-v3:${mode}:${cacheKey}`;
  material.needsUpdate = true;
}

export class GrassSurfaceEdgeFadeResource {
  private readonly uniforms = createGrassSurfaceEdgeFadeUniforms();

  apply(settings: GrassSettings): void {
    applyGrassSurfaceEdgeFadeSettings(this.uniforms, settings);
  }

  extendBlend(material: THREE.MeshStandardMaterial, cacheKey: string): void {
    extendGrassMaterialWithSurfaceEdgeFade(
      material,
      this.uniforms,
      cacheKey,
      "blend",
    );
  }

  extendHashed(material: GrassSurfaceEdgeFadeMaterial, cacheKey: string): void {
    extendGrassMaterialWithSurfaceEdgeFade(
      material,
      this.uniforms,
      cacheKey,
      "hashed",
    );
  }
}

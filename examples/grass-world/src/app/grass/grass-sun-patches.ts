import * as THREE from "three";

import type { GrassSettings } from "./grass-values";

export type GrassSunPatchUniforms = Record<string, THREE.IUniform>;

export const grassSunPatchVertexDeclarations = /* glsl */ `
  varying vec3 vGrassSunPatchWorldPosition;
`;

export const grassSunPatchFragmentDeclarations = /* glsl */ `
  uniform float uSunPatchCoverage;
  uniform float uSunPatchEnabled;
  uniform vec2 uSunPatchOffset;
  uniform float uSunPatchRotation;
  uniform float uSunPatchScale;
  uniform float uSunPatchSeed;
  uniform float uSunPatchSoftness;
  uniform float uSunPatchStrength;

  varying vec3 vGrassSunPatchWorldPosition;

  float grassSunPatchHash(vec2 point) {
    vec3 value = fract(vec3(point.xyx) * 0.1031);
    value += dot(value, value.yzx + 33.33);
    return fract((value.x + value.y) * value.z);
  }

  float grassSunPatchNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    vec2 blend = local * local * (3.0 - 2.0 * local);
    float bottom = mix(
      grassSunPatchHash(cell),
      grassSunPatchHash(cell + vec2(1.0, 0.0)),
      blend.x
    );
    float top = mix(
      grassSunPatchHash(cell + vec2(0.0, 1.0)),
      grassSunPatchHash(cell + vec2(1.0, 1.0)),
      blend.x
    );
    return mix(bottom, top, blend.y);
  }

  float grassSunPatchField(vec2 point) {
    return
      grassSunPatchNoise(point) * 0.52 +
      grassSunPatchNoise(point * 2.03 + vec2(7.31, -4.17)) * 0.30 +
      grassSunPatchNoise(point * 4.11 + vec2(-3.27, 9.43)) * 0.18;
  }

  vec2 grassSunPatchLighting(vec3 worldPosition) {
    if (uSunPatchEnabled < 0.5) return vec2(1.0);
    float cosine = cos(uSunPatchRotation);
    float sine = sin(uSunPatchRotation);
    mat2 rotation = mat2(cosine, -sine, sine, cosine);
    vec2 position = rotation * (
      worldPosition.xz - uSunPatchOffset
    ) / max(0.2, uSunPatchScale);
    position += vec2(uSunPatchSeed * 0.173, uSunPatchSeed * -0.219);
    float pattern = grassSunPatchField(position);
    float threshold = mix(1.04, -0.04, clamp(uSunPatchCoverage, 0.0, 1.0));
    float edge = mix(0.015, 0.30, clamp(uSunPatchSoftness, 0.0, 1.0));
    float shadow = smoothstep(threshold - edge, threshold + edge, pattern);
    float baseStrength = clamp(uSunPatchStrength, 0.0, 1.0);
    float extraStrength = clamp(uSunPatchStrength - 1.0, 0.0, 1.0);
    float shadowDirect = mix(
      mix(1.0, 0.32, baseStrength),
      0.03,
      extraStrength
    );
    float sunDirect = mix(1.0, 1.45, extraStrength);
    float shadowIndirect = mix(1.0, 0.35, extraStrength);
    float sunIndirect = mix(1.0, 1.08, extraStrength);
    return vec2(
      mix(sunDirect, shadowDirect, shadow),
      mix(sunIndirect, shadowIndirect, shadow)
    );
  }
`;

export function createGrassSunPatchUniforms(): GrassSunPatchUniforms {
  return {
    uSunPatchCoverage: { value: 0.42 },
    uSunPatchEnabled: { value: 1 },
    uSunPatchOffset: { value: new THREE.Vector2() },
    uSunPatchRotation: { value: 0 },
    uSunPatchScale: { value: 3.6 },
    uSunPatchSeed: { value: 37 },
    uSunPatchSoftness: { value: 0.38 },
    uSunPatchStrength: { value: 0.66 },
  };
}

export function applyGrassSunPatchSettings(
  uniforms: GrassSunPatchUniforms,
  settings: GrassSettings["environment"]["sunPatches"],
  rotationRadians: number,
): void {
  uniforms.uSunPatchCoverage!.value = settings.coverage;
  uniforms.uSunPatchEnabled!.value = settings.enabled ? 1 : 0;
  (uniforms.uSunPatchOffset!.value as THREE.Vector2).set(
    settings.offset[0],
    settings.offset[1],
  );
  uniforms.uSunPatchRotation!.value = rotationRadians;
  uniforms.uSunPatchScale!.value = settings.scale;
  uniforms.uSunPatchSeed!.value = settings.seed;
  uniforms.uSunPatchSoftness!.value = settings.softness;
  uniforms.uSunPatchStrength!.value = settings.strength;
}

export function extendGrassStandardMaterialWithSunPatches(
  material: THREE.MeshStandardMaterial,
  uniforms: GrassSunPatchUniforms,
  cacheKey: string,
): void {
  const previousOnBeforeCompile = material.onBeforeCompile;
  const previousProgramCacheKey = material.customProgramCacheKey;
  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>\n${grassSunPatchVertexDeclarations}`,
      )
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
vec4 grassSunPatchWorldPosition = vec4(transformed, 1.0);
#ifdef USE_BATCHING
  grassSunPatchWorldPosition = batchingMatrix * grassSunPatchWorldPosition;
#endif
#ifdef USE_INSTANCING
  grassSunPatchWorldPosition = instanceMatrix * grassSunPatchWorldPosition;
#endif
vGrassSunPatchWorldPosition = (
  modelMatrix * grassSunPatchWorldPosition
).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\n${grassSunPatchFragmentDeclarations}`,
      )
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
vec2 grassPatchLighting = grassSunPatchLighting(vGrassSunPatchWorldPosition);
reflectedLight.directDiffuse *= grassPatchLighting.x;
reflectedLight.directSpecular *= grassPatchLighting.x;
reflectedLight.indirectDiffuse *= grassPatchLighting.y;
reflectedLight.indirectSpecular *= grassPatchLighting.y;
#ifdef USE_SHEEN
  sheenSpecularDirect *= grassPatchLighting.x;
#endif
#ifdef USE_CLEARCOAT
  clearcoatSpecularDirect *= grassPatchLighting.x;
#endif`,
      );
  };
  material.customProgramCacheKey = () =>
    `${previousProgramCacheKey.call(material)}:grass-sun-patches-v3:${cacheKey}`;
  material.needsUpdate = true;
}

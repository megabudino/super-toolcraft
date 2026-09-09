import * as THREE from "three";

import type { GrassTextureMaskSettings } from "./grass-texture-mask-settings";

export type GrassTextureMaskUniforms = Record<string, THREE.IUniform>;

export type GrassTextureMaskMaterialOptions = Readonly<{
  mapTint?: "material" | "neutral";
}>;

const vertexDeclarations = /* glsl */ `
  varying vec3 vGrassTextureMaskWorldPosition;
`;

const vertexAssignment = /* glsl */ `
  vec4 grassTextureMaskPosition = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
    grassTextureMaskPosition = batchingMatrix * grassTextureMaskPosition;
  #endif
  #ifdef USE_INSTANCING
    grassTextureMaskPosition = instanceMatrix * grassTextureMaskPosition;
  #endif
  vGrassTextureMaskWorldPosition = (
    modelMatrix * grassTextureMaskPosition
  ).xyz;
`;

export const grassTextureMaskFragmentDeclarations = /* glsl */ `
  uniform vec2 uGrassTextureMaskLevels;
  uniform float uGrassTextureMaskScale;
  uniform float uGrassTextureMaskSeed;

  float grassTextureMaskHash(vec2 point) {
    return fract(
      sin(dot(point, vec2(127.1, 311.7)) + uGrassTextureMaskSeed * 19.19) *
      43758.5453123
    );
  }

  float grassTextureMaskNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    vec2 blend = local * local * (3.0 - 2.0 * local);
    float lower = mix(
      grassTextureMaskHash(cell),
      grassTextureMaskHash(cell + vec2(1.0, 0.0)),
      blend.x
    );
    float upper = mix(
      grassTextureMaskHash(cell + vec2(0.0, 1.0)),
      grassTextureMaskHash(cell + vec2(1.0, 1.0)),
      blend.x
    );
    return mix(lower, upper, blend.y);
  }

  float grassTextureMaskFbm(vec2 point) {
    float value = grassTextureMaskNoise(point) * 0.5714286;
    value += grassTextureMaskNoise(point * 2.03 + 17.17) * 0.2857143;
    value += grassTextureMaskNoise(point * 4.11 - 9.73) * 0.1428571;
    return clamp(value, 0.0, 1.0);
  }

  float grassEvaluateTextureMaskAt(vec3 worldPosition) {
    if (uGrassTextureMaskLevels.y <= 0.001) {
      return 0.0;
    }
    if (
      uGrassTextureMaskLevels.x >= 0.99 &&
      uGrassTextureMaskLevels.y >= 0.999
    ) {
      return 1.0;
    }
    vec2 point = worldPosition.xz /
      max(0.001, uGrassTextureMaskScale);
    float noiseValue = grassTextureMaskFbm(point);
    return clamp(
      mix(
        uGrassTextureMaskLevels.x,
        uGrassTextureMaskLevels.y,
        noiseValue
      ),
      0.0,
      1.0
    );
  }
`;

const fragmentDeclarations = /* glsl */ `
  varying vec3 vGrassTextureMaskWorldPosition;
  ${grassTextureMaskFragmentDeclarations}
`;

const maskedAoMapFragment = /* glsl */ `
  #ifdef USE_AOMAP
    float ambientOcclusion = (
      texture2D(aoMap, vAoMapUv).r - 1.0
    ) * aoMapIntensity + 1.0;
    ambientOcclusion = mix(
      1.0,
      ambientOcclusion,
      grassTextureMaskAmount
    );
    reflectedLight.indirectDiffuse *= ambientOcclusion;
    #if defined(USE_CLEARCOAT)
      clearcoatSpecularIndirect *= ambientOcclusion;
    #endif
    #if defined(USE_SHEEN)
      sheenSpecularIndirect *= ambientOcclusion;
    #endif
    #if defined(USE_ENVMAP) && defined(STANDARD)
      float dotNV = saturate(dot(geometryNormal, geometryViewDir));
      reflectedLight.indirectSpecular *= computeSpecularOcclusion(
        dotNV,
        ambientOcclusion,
        material.roughness
      );
    #endif
  #endif
`;

const materialTintedMapFragment = /* glsl */ `
  float grassTextureMaskAmount = grassEvaluateTextureMaskAt(
    vGrassTextureMaskWorldPosition
  );
  #include <map_fragment>
  diffuseColor.rgb = mix(
    diffuse,
    diffuseColor.rgb,
    grassTextureMaskAmount
  );
`;

const neutralMapFragment = /* glsl */ `
  float grassTextureMaskAmount = grassEvaluateTextureMaskAt(
    vGrassTextureMaskWorldPosition
  );
  #ifdef USE_MAP
    vec4 grassTextureMaskFallbackColor = diffuseColor;
    vec4 grassTextureMaskSample = texture2D(map, vMapUv);
    #ifdef DECODE_VIDEO_TEXTURE
      grassTextureMaskSample = sRGBTransferEOTF(grassTextureMaskSample);
    #endif
    diffuseColor.rgb = mix(
      grassTextureMaskFallbackColor.rgb,
      grassTextureMaskSample.rgb,
      grassTextureMaskAmount
    );
    diffuseColor.a = mix(
      grassTextureMaskFallbackColor.a,
      grassTextureMaskFallbackColor.a * grassTextureMaskSample.a,
      grassTextureMaskAmount
    );
  #endif
`;

export function createGrassTextureMaskUniforms(): GrassTextureMaskUniforms {
  return {
    uGrassTextureMaskLevels: { value: new THREE.Vector2(0.99, 1) },
    uGrassTextureMaskScale: { value: 1 },
    uGrassTextureMaskSeed: { value: 0 },
  };
}

export function applyGrassTextureMaskSettings(
  uniforms: GrassTextureMaskUniforms,
  settings: GrassTextureMaskSettings,
): void {
  (uniforms.uGrassTextureMaskLevels!.value as THREE.Vector2).set(
    settings.levels[0],
    settings.levels[1],
  );
  uniforms.uGrassTextureMaskScale!.value = settings.scale;
  uniforms.uGrassTextureMaskSeed!.value = settings.seed;
}

export function extendGrassStandardMaterialWithTextureMask(
  material: THREE.MeshStandardMaterial,
  uniforms: GrassTextureMaskUniforms,
  cacheKey: string,
  options: GrassTextureMaskMaterialOptions = {},
): void {
  const previousOnBeforeCompile = material.onBeforeCompile;
  const previousProgramCacheKey = material.customProgramCacheKey;
  const mapTint = options.mapTint ?? "material";
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
        "#include <map_fragment>",
        mapTint === "neutral" ? neutralMapFragment : materialTintedMapFragment,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>\nroughnessFactor = mix(roughness, roughnessFactor, grassTextureMaskAmount);`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `vec3 grassTextureMaskBaseNormal = normal;\n#include <normal_fragment_maps>\nnormal = normalize(mix(grassTextureMaskBaseNormal, normal, grassTextureMaskAmount));`,
      )
      .replace("#include <aomap_fragment>", maskedAoMapFragment);
  };
  material.customProgramCacheKey = () =>
    `${previousProgramCacheKey.call(material)}:grass-texture-mask-v2:${mapTint}:${cacheKey}`;
  material.needsUpdate = true;
}

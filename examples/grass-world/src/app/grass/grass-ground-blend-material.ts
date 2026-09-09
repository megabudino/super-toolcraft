import * as THREE from "three";

import type { GrassScanLoadedTextureSet } from "./grass-scan-materials";
import { grassGroundBlendNoiseGlsl } from "./grass-ground-blend-noise";
import type { GrassSettings } from "./grass-values";
import {
  grassTextureMaskFragmentDeclarations,
  type GrassTextureMaskUniforms,
} from "./grass-texture-mask";

export type GrassGroundBlendUniforms = Record<string, THREE.IUniform>;

const vertexDeclarations = /* glsl */ `
  varying vec3 vGrassGroundBlendWorldPosition;
`;

const vertexAssignment = /* glsl */ `
  vec4 grassGroundBlendPosition = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
    grassGroundBlendPosition = batchingMatrix * grassGroundBlendPosition;
  #endif
  #ifdef USE_INSTANCING
    grassGroundBlendPosition = instanceMatrix * grassGroundBlendPosition;
  #endif
  vGrassGroundBlendWorldPosition = (
    modelMatrix * grassGroundBlendPosition
  ).xyz;
`;

const fragmentDeclarations = /* glsl */ `
  varying vec3 vGrassGroundBlendWorldPosition;
  uniform sampler2D uGrassCloverAoMap;
  uniform sampler2D uGrassCloverMap;
  uniform sampler2D uGrassCloverNormalMap;
  uniform sampler2D uGrassCloverRoughnessMap;
  uniform int uGrassCloverMaskDetail;
  uniform vec2 uGrassCloverMaskLevels;
  uniform vec2 uGrassCloverMaskOffset;
  uniform float uGrassCloverMaskRoughness;
  uniform float uGrassCloverMaskScale;
  uniform float uGrassCloverMaskSeed;
  uniform vec2 uGrassCloverNormalScale;
  uniform float uGrassCloverRoughness;
  uniform float uGrassCloverUvScale;
  uniform vec3 uGrassCurrentColorTint;
  uniform vec3 uGrassCloverColorTint;
  uniform float uGrassSurfaceBrightness;
  ${grassTextureMaskFragmentDeclarations}
  ${grassGroundBlendNoiseGlsl}

  float grassGroundColorLuminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
  }

  vec3 grassApplyGroundColorTint(vec3 albedo, vec3 colorTint) {
    float sourceLuminance = grassGroundColorLuminance(albedo);
    float tintLuminance = grassGroundColorLuminance(colorTint);
    vec3 tintAtSourceLuminance = tintLuminance > 0.00001
      ? colorTint * (sourceLuminance / tintLuminance)
      : vec3(sourceLuminance);
    vec3 tinted = mix(albedo, tintAtSourceLuminance, 0.92);

    // Both inputs have the same luminance. Compress only chroma when the
    // requested tint would leave the displayable albedo gamut, retaining the
    // texture's original light/dark structure and therefore its PBR detail.
    float maximumChannel = max(tinted.r, max(tinted.g, tinted.b));
    float chromaScale = maximumChannel > 1.0
      ? (1.0 - sourceLuminance) /
        max(0.00001, maximumChannel - sourceLuminance)
      : 1.0;
    return clamp(
      mix(vec3(sourceLuminance), tinted, clamp(chromaScale, 0.0, 1.0)),
      0.0,
      1.0
    );
  }
`;

const blendedMapFragment = /* glsl */ `
  float grassGroundTextureMaskAmount = grassEvaluateTextureMaskAt(
    vGrassGroundBlendWorldPosition
  );
  float grassCloverMaskAmount = grassCloverEvaluateMask(
    vGrassGroundBlendWorldPosition.xz,
    uGrassCloverMaskOffset,
    uGrassCloverMaskScale,
    uGrassCloverMaskSeed,
    uGrassCloverMaskRoughness,
    uGrassCloverMaskDetail,
    uGrassCloverMaskLevels
  );
  #ifdef USE_MAP
    vec4 grassGroundFallbackColor = diffuseColor;
    vec4 grassGroundMapSample = texture2D(map, vMapUv);
    #ifdef DECODE_VIDEO_TEXTURE
      grassGroundMapSample = sRGBTransferEOTF(grassGroundMapSample);
    #endif
    grassGroundMapSample.rgb = grassApplyGroundColorTint(
      grassGroundMapSample.rgb,
      uGrassCurrentColorTint
    );
    vec4 grassGroundCurrentColor = vec4(
      mix(
        grassGroundFallbackColor.rgb,
        grassGroundMapSample.rgb,
        grassGroundTextureMaskAmount
      ),
      mix(
        grassGroundFallbackColor.a,
        grassGroundFallbackColor.a * grassGroundMapSample.a,
        grassGroundTextureMaskAmount
      )
    );
    vec4 grassCloverMapSample = texture2D(
      uGrassCloverMap,
      vMapUv * uGrassCloverUvScale
    );
    grassCloverMapSample.rgb = grassApplyGroundColorTint(
      grassCloverMapSample.rgb,
      uGrassCloverColorTint
    );
    diffuseColor = mix(
      grassGroundCurrentColor,
      grassCloverMapSample,
      grassCloverMaskAmount
    );
  #endif
  diffuseColor.rgb *= uGrassSurfaceBrightness;
`;

const blendedRoughnessFragment = /* glsl */ `
  float roughnessFactor = roughness;
  #ifdef USE_ROUGHNESSMAP
    vec4 grassGroundRoughnessSample = texture2D(
      roughnessMap,
      vRoughnessMapUv
    );
    float grassGroundMappedRoughness = roughness *
      grassGroundRoughnessSample.g;
    float grassGroundCurrentRoughness = mix(
      roughness,
      grassGroundMappedRoughness,
      grassGroundTextureMaskAmount
    );
    float grassCloverMappedRoughness = uGrassCloverRoughness * texture2D(
      uGrassCloverRoughnessMap,
      vRoughnessMapUv * uGrassCloverUvScale
    ).g;
    roughnessFactor = mix(
      grassGroundCurrentRoughness,
      grassCloverMappedRoughness,
      grassCloverMaskAmount
    );
  #endif
`;

const blendedNormalFragment = /* glsl */ `
  vec3 grassGroundBaseNormal = normal;
  #include <normal_fragment_maps>
  vec3 grassGroundMappedNormal = normal;
  normal = normalize(mix(
    grassGroundBaseNormal,
    grassGroundMappedNormal,
    grassGroundTextureMaskAmount
  ));
  #ifdef USE_NORMALMAP_TANGENTSPACE
    vec3 grassCloverMapNormal = texture2D(
      uGrassCloverNormalMap,
      vNormalMapUv * uGrassCloverUvScale
    ).xyz * 2.0 - 1.0;
    grassCloverMapNormal.xy *= uGrassCloverNormalScale;
    vec3 grassCloverMappedNormal = normalize(tbn * grassCloverMapNormal);
    normal = normalize(mix(
      normal,
      grassCloverMappedNormal,
      grassCloverMaskAmount
    ));
  #endif
`;

const blendedAoFragment = /* glsl */ `
  #ifdef USE_AOMAP
    float grassGroundAmbientOcclusion = (
      texture2D(aoMap, vAoMapUv).r - 1.0
    ) * aoMapIntensity + 1.0;
    grassGroundAmbientOcclusion = mix(
      1.0,
      grassGroundAmbientOcclusion,
      grassGroundTextureMaskAmount
    );
    float grassCloverAmbientOcclusion = texture2D(
      uGrassCloverAoMap,
      vAoMapUv * uGrassCloverUvScale
    ).r;
    float ambientOcclusion = mix(
      grassGroundAmbientOcclusion,
      grassCloverAmbientOcclusion,
      grassCloverMaskAmount
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

export function createGrassGroundBlendUniforms(): GrassGroundBlendUniforms {
  return {
    uGrassCloverAoMap: { value: null },
    uGrassCloverMap: { value: null },
    uGrassCloverMaskDetail: { value: 4 },
    uGrassCloverMaskLevels: { value: new THREE.Vector2(0.42, 0.62) },
    uGrassCloverMaskOffset: { value: new THREE.Vector2() },
    uGrassCloverMaskRoughness: { value: 0.55 },
    uGrassCloverMaskScale: { value: 0.34 },
    uGrassCloverMaskSeed: { value: 41 },
    uGrassCloverNormalMap: { value: null },
    uGrassCloverNormalScale: { value: new THREE.Vector2(1, -1) },
    uGrassCloverRoughness: { value: 1 },
    uGrassCloverRoughnessMap: { value: null },
    uGrassCloverUvScale: { value: 1 },
    uGrassCurrentColorTint: { value: new THREE.Color(0xffffff) },
    uGrassCloverColorTint: { value: new THREE.Color(0xffffff) },
    uGrassSurfaceBrightness: { value: 1 },
  };
}

export function applyGrassGroundColorTints(
  uniforms: GrassGroundBlendUniforms,
  currentColor: string,
  cloverColor: string,
): void {
  (uniforms.uGrassCurrentColorTint!.value as THREE.Color).set(currentColor);
  (uniforms.uGrassCloverColorTint!.value as THREE.Color).set(cloverColor);
}

export function applyGrassGroundBlendSettings(
  uniforms: GrassGroundBlendUniforms,
  surface: GrassSettings["surface"],
): void {
  const mask = surface.cloverMask;
  uniforms.uGrassCloverMaskDetail!.value = mask.detail;
  (uniforms.uGrassCloverMaskLevels!.value as THREE.Vector2).set(
    mask.levels[0],
    mask.levels[1],
  );
  (uniforms.uGrassCloverMaskOffset!.value as THREE.Vector2).set(
    mask.offset[0],
    mask.offset[1],
  );
  uniforms.uGrassCloverMaskRoughness!.value = mask.roughness;
  uniforms.uGrassCloverMaskScale!.value = mask.scale;
  uniforms.uGrassCloverMaskSeed!.value = mask.seed;
  (uniforms.uGrassCloverNormalScale!.value as THREE.Vector2).set(
    surface.clover.normalStrength,
    -surface.clover.normalStrength,
  );
  uniforms.uGrassCloverRoughness!.value = surface.clover.roughness;
  uniforms.uGrassCloverUvScale!.value =
    surface.clover.textureScale / Math.max(0.001, surface.textureScale);
  uniforms.uGrassSurfaceBrightness!.value = surface.brightness;
}

export function applyGrassGroundBlendTextures(
  uniforms: GrassGroundBlendUniforms,
  textures: GrassScanLoadedTextureSet,
): void {
  uniforms.uGrassCloverAoMap!.value = textures.ao;
  uniforms.uGrassCloverMap!.value = textures.baseColor;
  uniforms.uGrassCloverNormalMap!.value = textures.normal;
  uniforms.uGrassCloverRoughnessMap!.value = textures.roughness;
}

export function extendGrassStandardMaterialWithGroundBlend(
  material: THREE.MeshStandardMaterial,
  textureMaskUniforms: GrassTextureMaskUniforms,
  blendUniforms: GrassGroundBlendUniforms,
  cacheKey: string,
): void {
  const previousOnBeforeCompile = material.onBeforeCompile;
  const previousProgramCacheKey = material.customProgramCacheKey;
  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, textureMaskUniforms, blendUniforms);
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
      .replace("#include <map_fragment>", blendedMapFragment)
      .replace("#include <roughnessmap_fragment>", blendedRoughnessFragment)
      .replace("#include <normal_fragment_maps>", blendedNormalFragment)
      .replace("#include <aomap_fragment>", blendedAoFragment);
  };
  material.customProgramCacheKey = () =>
    `${previousProgramCacheKey.call(material)}:grass-ground-blend-v5:${cacheKey}`;
  material.needsUpdate = true;
}

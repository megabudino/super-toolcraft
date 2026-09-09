import { Color, type MeshPhysicalMaterial, type Texture } from "three";

export type DonutFoodShaderKind = "dough" | "icing";

export type DonutFoodShaderSettings = Readonly<{
  bake: number;
  glaze: number;
  moisture: number;
  pores: number;
  sssTint: Color;
  subsurface: number;
  texture: number;
  variation: number;
}>;

export type DonutFoodTextures = Readonly<{
  baseColor: Texture;
  normal: Texture;
  roughness: Texture;
}>;

type Uniform<Value> = { value: Value };

type DonutFoodUniforms = Readonly<{
  uFoodBake: Uniform<number>;
  uFoodBaseColorMap: Uniform<Texture>;
  uFoodGlaze: Uniform<number>;
  uFoodMoisture: Uniform<number>;
  uFoodNormalMap: Uniform<Texture>;
  uFoodPores: Uniform<number>;
  uFoodRoughnessMap: Uniform<Texture>;
  uFoodSssColor: Uniform<Color>;
  uFoodSubsurface: Uniform<number>;
  uFoodTexture: Uniform<number>;
  uFoodVariation: Uniform<number>;
}>;

type CompilableShader = {
  fragmentShader: string;
  uniforms: Record<string, unknown>;
  vertexShader: string;
};

const shaderStates = new WeakMap<
  MeshPhysicalMaterial,
  Readonly<{ kind: DonutFoodShaderKind; uniforms: DonutFoodUniforms }>
>();

const FOOD_NOISE_GLSL = /* glsl */ `
varying vec3 vDonutFoodPosition;
varying vec3 vDonutFoodNormal;
varying vec2 vDonutFoodUv;
uniform float uFoodBake;
uniform float uFoodGlaze;
uniform float uFoodMoisture;
uniform float uFoodPores;
uniform float uFoodSubsurface;
uniform float uFoodTexture;
uniform float uFoodVariation;
uniform vec3 uFoodSssColor;
uniform sampler2D uFoodBaseColorMap;
uniform sampler2D uFoodNormalMap;
uniform sampler2D uFoodRoughnessMap;

float donutFoodHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float donutFoodNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(donutFoodHash(i), donutFoodHash(i + vec3(1.0, 0.0, 0.0)), f.x),
      mix(donutFoodHash(i + vec3(0.0, 1.0, 0.0)), donutFoodHash(i + vec3(1.0, 1.0, 0.0)), f.x),
      f.y
    ),
    mix(
      mix(donutFoodHash(i + vec3(0.0, 0.0, 1.0)), donutFoodHash(i + vec3(1.0, 0.0, 1.0)), f.x),
      mix(donutFoodHash(i + vec3(0.0, 1.0, 1.0)), donutFoodHash(i + vec3(1.0, 1.0, 1.0)), f.x),
      f.y
    ),
    f.z
  );
}

float donutFoodFbm(vec3 p) {
  float value = 0.0;
  value += donutFoodNoise(p) * 0.5714;
  value += donutFoodNoise(p * 2.03 + 7.1) * 0.2857;
  value += donutFoodNoise(p * 4.11 + 13.7) * 0.1429;
  return value;
}

vec3 donutFoodTriplanarWeights(vec3 normalDirection) {
  vec3 weights = pow(abs(normalize(normalDirection)), vec3(4.0));
  return weights / max(weights.x + weights.y + weights.z, 0.0001);
}

vec2 donutFoodTileX(vec3 position) { return position.zy * 0.34 + vec2(0.17, 0.43); }
vec2 donutFoodTileY(vec3 position) { return position.xz * 0.34 + vec2(0.61, 0.23); }
vec2 donutFoodTileZ(vec3 position) { return position.xy * 0.34 + vec2(0.37, 0.71); }

vec4 donutFoodAtlasSample(sampler2D atlas, vec2 tile, vec4 region) {
  vec2 uv = region.xy + fract(tile) * region.zw;
  return textureGrad(atlas, uv, dFdx(tile) * region.zw, dFdy(tile) * region.zw);
}

vec4 donutFoodAtlasTriplanar(
  sampler2D atlas,
  vec3 position,
  vec3 weights,
  vec4 region
) {
  return
    donutFoodAtlasSample(atlas, donutFoodTileX(position), region) * weights.x +
    donutFoodAtlasSample(atlas, donutFoodTileY(position), region) * weights.y +
    donutFoodAtlasSample(atlas, donutFoodTileZ(position), region) * weights.z;
}

vec3 donutFoodTriplanarNormalDelta(
  sampler2D atlas,
  vec3 position,
  vec3 weights,
  vec4 region
) {
  vec3 tX = donutFoodAtlasSample(atlas, donutFoodTileX(position), region).rgb * 2.0 - 1.0;
  vec3 tY = donutFoodAtlasSample(atlas, donutFoodTileY(position), region).rgb * 2.0 - 1.0;
  vec3 tZ = donutFoodAtlasSample(atlas, donutFoodTileZ(position), region).rgb * 2.0 - 1.0;
  return
    vec3(0.0, tX.y, tX.x) * weights.x +
    vec3(tY.x, 0.0, tY.y) * weights.y +
    vec3(tZ.x, tZ.y, 0.0) * weights.z;
}

mat3 donutFoodAlign(vec3 from, vec3 to) {
  vec3 v = cross(from, to);
  float c = clamp(dot(from, to), -0.999, 1.0);
  float k = 1.0 / (1.0 + c);
  return mat3(
    v.x * v.x * k + c, v.y * v.x * k + v.z, v.z * v.x * k - v.y,
    v.x * v.y * k - v.z, v.y * v.y * k + c, v.z * v.y * k + v.x,
    v.x * v.z * k + v.y, v.y * v.z * k - v.x, v.z * v.z * k + c
  );
}
`;

function replaceShaderChunk(
  source: string,
  marker: string,
  replacement: string,
): string {
  if (!source.includes(marker)) {
    throw new Error(`Donut edible shader could not find ${marker}.`);
  }
  return source.replace(marker, replacement);
}

export function patchDonutFoodShader(
  shader: CompilableShader,
  kind: DonutFoodShaderKind,
  uniforms: DonutFoodUniforms,
): void {
  Object.assign(shader.uniforms, uniforms);

  shader.vertexShader = replaceShaderChunk(
    shader.vertexShader,
    "#include <common>",
    "#include <common>\nvarying vec3 vDonutFoodPosition;\nvarying vec3 vDonutFoodNormal;\nvarying vec2 vDonutFoodUv;",
  );
  shader.vertexShader = replaceShaderChunk(
    shader.vertexShader,
    "#include <beginnormal_vertex>",
    "#include <beginnormal_vertex>\nvDonutFoodNormal = objectNormal;",
  );
  shader.vertexShader = replaceShaderChunk(
    shader.vertexShader,
    "#include <begin_vertex>",
    "#include <begin_vertex>\nvDonutFoodPosition = transformed;\nvDonutFoodUv = uv;",
  );

  shader.fragmentShader = replaceShaderChunk(
    shader.fragmentShader,
    "#include <common>",
    `#include <common>\n${FOOD_NOISE_GLSL}`,
  );

  const kindValue = kind === "dough" ? "0.0" : "1.0";
  shader.fragmentShader = replaceShaderChunk(
    shader.fragmentShader,
    "vec4 diffuseColor = vec4( diffuse, opacity );",
    /* glsl */ `vec4 diffuseColor = vec4( diffuse, opacity );
  const float donutFoodKind = ${kindValue};
  vec3 donutFoodObjectNormal = normalize(vDonutFoodNormal);
  vec3 donutFoodWeights = donutFoodTriplanarWeights(donutFoodObjectNormal);
  float donutFoodLow = donutFoodFbm(vDonutFoodPosition * 0.78 + vec3(2.7, 0.4, 1.8));
  float donutFoodMid = donutFoodNoise(vDonutFoodPosition * 5.2 + vec3(4.0, 8.0, 2.0));
  float donutFoodFine = donutFoodNoise(vDonutFoodPosition * 25.0 + vec3(9.0, 2.0, 6.0));
  float donutFoodPore = smoothstep(0.6, 0.91, donutFoodFine);
  float donutFoodFine2 = donutFoodNoise(vDonutFoodPosition * 52.0 + vec3(3.0, 11.0, 7.0));
  float donutFoodPore2 = smoothstep(0.58, 0.9, donutFoodFine2);
  float donutFoodGlazeCalm = 1.0 - uFoodGlaze * 0.75;
  vec4 donutFoodAtlasRegion = donutFoodKind < 0.5
    ? vec4(0.53, 0.025, 0.42, 0.43)
    : vec4(0.53, 0.59, 0.42, 0.36);
  vec3 donutFoodScanColor = max(
    donutFoodAtlasTriplanar(
      uFoodBaseColorMap,
      vDonutFoodPosition,
      donutFoodWeights,
      donutFoodAtlasRegion
    ).rgb,
    vec3(0.0)
  );
  float donutFoodScanRoughness = donutFoodAtlasTriplanar(
    uFoodRoughnessMap,
    vDonutFoodPosition,
    donutFoodWeights,
    donutFoodAtlasRegion
  ).r;
  float donutFoodScanLuminance = dot(
    donutFoodScanColor,
    vec3(0.2126, 0.7152, 0.0722)
  );
  float donutFoodScanTone = clamp(
    donutFoodScanLuminance * 2.55,
    0.72,
    1.32
  );

  if (donutFoodKind < 0.5) {
    float donutFoodBrown = smoothstep(0.24, 0.82, donutFoodLow);
    float donutFoodCrust = smoothstep(0.18, 0.78, abs(donutFoodObjectNormal.y));
    float donutFoodRing = 1.0 - smoothstep(
      0.16 + (donutFoodLow - 0.5) * 0.06,
      0.5 + (donutFoodMid - 0.5) * 0.05,
      abs(donutFoodObjectNormal.y)
    );
    float donutFoodSurfaceAuthority = 0.14 + uFoodVariation * 0.36;
    float donutFoodScanDetail = mix(
      1.0,
      donutFoodScanTone,
      donutFoodSurfaceAuthority
    );
    float donutFoodBakeAmount = uFoodBake *
      clamp(0.3 + donutFoodBrown * 0.1 + donutFoodCrust * 0.5, 0.0, 1.0);
    vec3 donutFoodBakeTint = mix(
      vec3(1.18, 1.1, 0.94),
      vec3(0.88, 0.6, 0.33),
      donutFoodBakeAmount
    );
    float donutFoodBakeExposure = mix(1.28, 0.92, uFoodBake);
    float donutFoodVariationTone = mix(
      1.0,
      mix(0.88, 1.12, donutFoodLow),
      uFoodVariation
    );
    diffuseColor.rgb *=
      donutFoodScanDetail *
      donutFoodBakeTint *
      donutFoodBakeExposure *
      donutFoodVariationTone;
    vec3 donutFoodProofTint = diffuseColor.rgb * vec3(1.16, 1.08, 0.9);
    diffuseColor.rgb = mix(
      diffuseColor.rgb,
      donutFoodProofTint,
      donutFoodRing * (0.1 + uFoodBake * 0.22)
    );
    diffuseColor.rgb *=
      1.0 - (donutFoodPore * 0.3 + donutFoodPore2 * 0.16) * uFoodPores;
  } else {
    float donutFoodMarble = mix(0.9, 1.1, donutFoodLow);
    float donutFoodIcingDetail = mix(
      1.0,
      donutFoodScanTone * donutFoodMarble,
      (0.1 + uFoodTexture * 0.5) * donutFoodGlazeCalm
    );
    float donutFoodRimEdge =
      smoothstep(0.0, 0.05, vDonutFoodUv.y) *
      smoothstep(1.0, 0.95, vDonutFoodUv.y);
    diffuseColor.rgb =
      diffuseColor.rgb *
      donutFoodIcingDetail *
      mix(0.96, 1.07, uFoodGlaze);
    diffuseColor.rgb *= mix(0.8, 1.0, donutFoodRimEdge);
    diffuseColor.rgb *= 1.0 - donutFoodPore * uFoodTexture * 0.085 * donutFoodGlazeCalm;
  }`,
  );

  shader.fragmentShader = replaceShaderChunk(
    shader.fragmentShader,
    "#include <roughnessmap_fragment>",
    /* glsl */ `#include <roughnessmap_fragment>
  if (donutFoodKind < 0.5) {
    float donutFoodRoughVariation =
      (donutFoodMid - 0.5) * 0.32 * uFoodVariation;
    float donutFoodScanRoughDetail =
      (donutFoodScanRoughness - 0.5) * (0.18 + uFoodVariation * 0.34);
    roughnessFactor = clamp(
      roughnessFactor +
      donutFoodScanRoughDetail +
      donutFoodRoughVariation +
      (donutFoodPore * 0.2 + donutFoodPore2 * 0.1) * uFoodPores -
      uFoodMoisture * 0.12,
      0.05,
      1.0
    );
  } else {
    float donutFoodIcingVariation =
      (donutFoodMid - 0.5) * 0.24 * uFoodTexture * donutFoodGlazeCalm;
    float donutFoodIcingScanRoughness =
      (donutFoodScanRoughness - 0.5) *
      (0.1 + uFoodTexture * 0.32) *
      donutFoodGlazeCalm;
    roughnessFactor = clamp(
      roughnessFactor +
      donutFoodIcingScanRoughness +
      donutFoodIcingVariation -
      uFoodGlaze * 0.12,
      0.03,
      0.98
    );
  }`,
  );

  shader.fragmentShader = replaceShaderChunk(
    shader.fragmentShader,
    "#include <normal_fragment_maps>",
    /* glsl */ `#include <normal_fragment_maps>
  vec3 donutFoodNormalDelta = donutFoodTriplanarNormalDelta(
    uFoodNormalMap,
    vDonutFoodPosition,
    donutFoodWeights,
    donutFoodAtlasRegion
  );
  float donutFoodNormalStrength = donutFoodKind < 0.5
    ? 0.34 + uFoodPores * 0.5 + uFoodVariation * 0.18
    : (0.22 + uFoodTexture * 0.6) * donutFoodGlazeCalm;
  vec3 donutFoodPerturbedObject = normalize(
    donutFoodObjectNormal + donutFoodNormalDelta * donutFoodNormalStrength
  );
  if (dot(donutFoodObjectNormal, normal) > -0.999) {
    normal = normalize(
      donutFoodAlign(donutFoodObjectNormal, normal) * donutFoodPerturbedObject
    );
  }
  float donutFoodHeight = donutFoodKind < 0.5
    ? (donutFoodPore * 1.1 + donutFoodPore2 * 0.5) * uFoodPores +
      donutFoodMid * 0.2 * uFoodVariation
    : (donutFoodMid * 0.3 + donutFoodFine * 0.12) * uFoodTexture * donutFoodGlazeCalm;
  float donutFoodBump = donutFoodKind < 0.5
    ? 0.16 + uFoodPores * 1.05
    : (0.1 + uFoodTexture * 0.6) * donutFoodGlazeCalm;
  vec3 donutFoodDx = normalize(dFdx(vViewPosition));
  vec3 donutFoodDy = normalize(dFdy(vViewPosition));
  vec3 donutFoodGradient =
    donutFoodDx * dFdx(donutFoodHeight) +
    donutFoodDy * dFdy(donutFoodHeight);
  normal = normalize(normal - donutFoodGradient * donutFoodBump);
  float donutFoodNdV = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
  float donutFoodSssRim = pow(1.0 - donutFoodNdV, 2.0);
  float donutFoodSssReach = donutFoodKind < 0.5
    ? 0.6
    : 0.35 + 0.65 * (1.0 - smoothstep(0.0, 0.42, vDonutFoodUv.y));
  diffuseColor.rgb += uFoodSssColor *
    (uFoodSubsurface * donutFoodSssRim * donutFoodSssReach * 0.42);`,
  );
}

export function installDonutFoodShader(
  material: MeshPhysicalMaterial,
  kind: DonutFoodShaderKind,
  textures: DonutFoodTextures,
): void {
  const uniforms: DonutFoodUniforms = {
    uFoodBake: { value: 0 },
    uFoodBaseColorMap: { value: textures.baseColor },
    uFoodGlaze: { value: 0 },
    uFoodMoisture: { value: 0 },
    uFoodNormalMap: { value: textures.normal },
    uFoodPores: { value: 0 },
    uFoodRoughnessMap: { value: textures.roughness },
    uFoodSssColor: { value: new Color(1, 1, 1) },
    uFoodSubsurface: { value: 0 },
    uFoodTexture: { value: 0 },
    uFoodVariation: { value: 0 },
  };
  shaderStates.set(material, { kind, uniforms });
  material.onBeforeCompile = (shader) => {
    patchDonutFoodShader(shader, kind, uniforms);
  };
  material.customProgramCacheKey = () => `donut-edible-pbr-v5:${kind}`;
  material.needsUpdate = true;
}

export function updateDonutFoodShader(
  material: MeshPhysicalMaterial,
  settings: DonutFoodShaderSettings,
): void {
  const state = shaderStates.get(material);
  if (!state) {
    throw new Error("Donut food shader must be installed before it is updated.");
  }
  state.uniforms.uFoodBake.value = settings.bake;
  state.uniforms.uFoodGlaze.value = settings.glaze;
  state.uniforms.uFoodMoisture.value = settings.moisture;
  state.uniforms.uFoodPores.value = settings.pores;
  state.uniforms.uFoodSssColor.value.copy(settings.sssTint);
  state.uniforms.uFoodSubsurface.value = settings.subsurface;
  state.uniforms.uFoodTexture.value = settings.texture;
  state.uniforms.uFoodVariation.value = settings.variation;
}

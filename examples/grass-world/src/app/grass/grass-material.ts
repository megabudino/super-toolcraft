import * as THREE from "three";

import {
  applyGrassColorGradeSettings,
  createGrassColorGradeUniforms,
  extendGrassStandardMaterialWithColorGrade,
} from "./grass-color-grade";
import { grassGradientFragmentModel } from "./grass-gradient-shader";
import {
  extendGrassStandardMaterialWithSunPatches,
  type GrassSunPatchUniforms,
} from "./grass-sun-patches";
import { GrassSurfaceEdgeFadeResource } from "./grass-surface-edge-fade";
import {
  applyGrassTextureMaskSettings,
  createGrassTextureMaskUniforms,
  grassTextureMaskFragmentDeclarations,
} from "./grass-texture-mask";
import type { GrassGradient, GrassSettings } from "./grass-values";
import {
  createGrassWindUniformSettings,
  type GrassWindFrameSettings,
} from "./grass-wind";
import {
  applyGrassWindUniformSettings,
  createGrassWindUniforms,
  grassWindVertexModel,
} from "./grass-wind-material";
import {
  applyGrassInstanceColorSettings,
  createGrassInstanceColorUniforms,
  grassInstanceColorFragmentDeclarations,
  grassInstanceColorVertexDeclarations,
  type GrassInstanceColors,
} from "./grass-instance-colors";

const grassNaturalVariationVertexModel = /* glsl */ `
  float grassVariationHash(vec2 point) {
    vec3 value = fract(vec3(point.xyx) * 0.1031);
    value += dot(value, value.yzx + 33.33);
    return fract((value.x + value.y) * value.z);
  }

  vec2 grassNaturalColorVariation(vec3 root, float phaseValue) {
    float micro = grassVariationHash(
      root.xz * 2.31 + vec2(phaseValue, -phaseValue) * 0.071
    );
    float macro = clamp(
      0.5 +
        sin(root.x * 1.17 + root.z * 0.83) * 0.24 +
        sin(root.x * 0.43 - root.z * 1.31 + 1.7) * 0.18,
      0.0,
      1.0
    );
    float colorValue = mix(0.78, 1.14, mix(micro, macro, 0.58));
    float warmSeed = grassVariationHash(
      root.zx * 3.17 + vec2(phaseValue * 0.17, phaseValue * 0.29) + 11.7
    );
    return vec2(colorValue, clamp(warmSeed * 0.58 + macro * 0.42, 0.0, 1.0));
  }
`;

const pbrVertexHeader = /* glsl */ `
  attribute vec3 aOffset;
  attribute float aHeight;
  attribute float aAngle;
  attribute float aPhase;
  attribute vec2 aSlope;
  attribute float aVisibility;

  #ifdef GRASS_LAWN_CLUMP
    attribute float aClumpScale;
    attribute vec2 aLocalRoot;
    attribute float aLocalAngle;
    attribute float aLocalHeightScale;
    attribute float aLocalPhase;
    attribute float aLocalRestTilt;
    attribute float aLocalStiffness;
  #endif

  uniform float uAlignNormals;
  uniform float uDepthOffset;
  uniform float uRandomRotation;
  uniform float uRestBendScale;
  uniform float uTaper;
  uniform float uThickness;
  uniform float uTilt;

  ${grassWindVertexModel}
  ${grassNaturalVariationVertexModel}
  ${grassInstanceColorVertexDeclarations}

  varying float vGrassHeight;
  varying float vGrassAcross;
  varying float vGrassColorValue;
  varying float vGrassColorWarmth;
  varying float vGrassVisibility;

  vec2 grassRotate2d(vec2 value, float angle) {
    float cosine = cos(angle);
    float sine = sin(angle);
    return vec2(
      value.x * cosine - value.y * sine,
      value.x * sine + value.y * cosine
    );
  }

  float grassBladeAngleValue() {
    float angle = aAngle * uRandomRotation;
    #ifdef GRASS_LAWN_CLUMP
      angle += aLocalAngle;
    #endif
    return angle;
  }

  float grassBladeHeightValue() {
    #ifdef GRASS_LAWN_CLUMP
      return aHeight * aLocalHeightScale;
    #else
      return aHeight;
    #endif
  }

  float grassBladePhaseValue() {
    #ifdef GRASS_LAWN_CLUMP
      return aPhase + aLocalPhase;
    #else
      return aPhase;
    #endif
  }

  float grassBladeStiffnessValue() {
    #ifdef GRASS_LAWN_CLUMP
      return aLocalStiffness;
    #else
      return 1.0;
    #endif
  }

  float grassBladeRestTiltValue() {
    #ifdef GRASS_LAWN_CLUMP
      return aLocalRestTilt;
    #else
      return 0.0;
    #endif
  }

  vec2 grassBladeRootValue() {
    #ifdef GRASS_LAWN_CLUMP
      float baseAngle = aAngle * uRandomRotation;
      return aOffset.xz + grassRotate2d(aLocalRoot * aClumpScale, baseAngle);
    #else
      return aOffset.xz;
    #endif
  }
`;

const pbrNormalVertex = /* glsl */ `
  vec3 objectNormal = vec3(normal);
  float grassAngle = grassBladeAngleValue();
  float grassCosine = cos(grassAngle);
  float grassSine = sin(grassAngle);
  objectNormal = normalize(vec3(
    objectNormal.x * grassCosine - objectNormal.z * grassSine,
    objectNormal.y,
    objectNormal.x * grassSine + objectNormal.z * grassCosine
  ));
  vec2 grassNormalRoot = grassBladeRootValue();
  float grassNormalPhase = grassBladePhaseValue();
  vec2 grassNormalForce = grassTotalWindForce(
    vec3(grassNormalRoot.x, aOffset.y, grassNormalRoot.y),
    grassNormalPhase,
    grassBladeStiffnessValue(),
    clamp(position.y, 0.0, 1.0)
  );
  float grassForceLength = length(grassNormalForce);
  vec2 grassForceDirection = grassForceLength > 0.0001
    ? grassNormalForce / grassForceLength
    : vec2(1.0, 0.0);
  float grassBendAngle = grassForceLength * 0.48;
  float grassBendCosine = cos(grassBendAngle);
  float grassBendSine = sin(grassBendAngle);
  vec3 grassBendAxis = vec3(
    grassForceDirection.y,
    0.0,
    -grassForceDirection.x
  );
  objectNormal =
    objectNormal * grassBendCosine +
    cross(grassBendAxis, objectNormal) * grassBendSine +
    grassBendAxis * dot(grassBendAxis, objectNormal) *
      (1.0 - grassBendCosine);
`;

const pbrBeginVertex = /* glsl */ `
  float grassT = position.y;
  float grassHeight = grassBladeHeightValue();
  float grassPhase = grassBladePhaseValue();
  vec2 grassRoot = grassBladeRootValue();
  vec3 grassRoot3d = vec3(grassRoot.x, aOffset.y, grassRoot.y);
  #ifdef GRASS_SHARED_WIND_FORCE
    vec2 grassForce = grassNormalForce;
  #else
    vec2 grassForce = grassTotalWindForce(
      grassRoot3d,
      grassPhase,
      grassBladeStiffnessValue(),
      grassT
    );
  #endif
  vec2 grassColorVariation = grassNaturalColorVariation(grassRoot3d, grassPhase);
  float grassBendShape = pow(grassT, 1.55) * (0.42 + grassHeight * 0.62);
  float grassAngleForPosition = grassBladeAngleValue();
  float grassCosineForPosition = cos(grassAngleForPosition);
  float grassSineForPosition = sin(grassAngleForPosition);
  vec2 grassRibbon = vec2(
    position.x * grassCosineForPosition - position.z * grassSineForPosition,
    position.x * grassSineForPosition + position.z * grassCosineForPosition
  );
  float grassTaper = mix(1.0, max(0.018, 1.0 - grassT), uTaper);
  grassRibbon *= uThickness * grassTaper;

  vec3 transformed = vec3(grassRoot.x, aOffset.y + uDepthOffset, grassRoot.y);
  transformed.xz += grassRibbon;
  transformed.y += grassT * grassHeight * aVisibility;
  float grassLeanVariation = 0.72 + 0.28 * (0.5 + 0.5 * sin(grassPhase));
  float grassLean = tan(uTilt + grassBladeRestTiltValue()) *
    grassT * grassHeight * 0.9 * grassLeanVariation;
  transformed.xz += vec2(
    cos(grassAngleForPosition),
    sin(grassAngleForPosition)
  ) * grassLean;
  float grassRestWave = 0.5 + 0.5 * sin(grassPhase * 1.73);
  float grassRestBend =
    uRestBendScale *
    (0.58 + grassRestWave * 0.42) *
    pow(grassT, 1.42) * grassHeight;
  transformed.xz += vec2(
    cos(grassAngleForPosition + sin(grassPhase * 0.71) * 0.52),
    sin(grassAngleForPosition + sin(grassPhase * 0.71) * 0.52)
  ) * grassRestBend;
  transformed.y -=
    abs(grassRestBend) *
    pow(grassT, 1.7) *
    (0.24 + grassRestWave * 0.08);
  transformed.xz += grassForce * grassBendShape;
  transformed.xz -= aSlope * uAlignNormals * grassT * grassHeight * 0.18;
  transformed.y -= dot(grassForce, grassForce) * grassT * grassHeight * 0.16;

  vGrassHeight = grassT;
  vGrassAcross = clamp((position.x + position.z) * 2.0, -1.0, 1.0);
  vGrassColorValue = grassColorVariation.x;
  vGrassColorWarmth = grassColorVariation.y;
  vGrassInstanceSelector = grassInstanceColorSelector(grassRoot3d, grassPhase);
  vGrassVisibility = aVisibility;
`;

const pbrFragmentHeader = /* glsl */ `
  ${grassTextureMaskFragmentDeclarations}
  ${grassGradientFragmentModel}
  ${grassInstanceColorFragmentDeclarations}

  uniform vec3 uRootColor;
  uniform vec3 uMiddleColor;
  uniform vec3 uTipColor;
  uniform float uColorVariation;
`;

const pbrColorFragment = /* glsl */ `
  #include <color_fragment>
  if (vGrassVisibility < 0.02) discard;
  vec2 grassGradientSampleValue = grassGradientSample();
  float grassGradientCoordinate = grassGradientSampleValue.x;
  float grassMiddlePosition = clamp(
    uMiddlePosition,
    uRootPosition + 0.001,
    0.999
  );
  float grassTipPosition = clamp(
    uTipPosition,
    grassMiddlePosition + 0.001,
    1.0
  );
  float grassFirstMix = smoothstep(
    uRootPosition,
    grassMiddlePosition,
    grassGradientCoordinate
  );
  float grassSecondMix = smoothstep(
    grassMiddlePosition,
    grassTipPosition,
    grassGradientCoordinate
  );
  vec3 grassGradientColor = grassGradientCoordinate < grassMiddlePosition
    ? mix(uRootColor, uMiddleColor, grassFirstMix)
    : mix(uMiddleColor, uTipColor, grassSecondMix);
  vec3 grassLuminanceWeights = vec3(0.2126, 0.7152, 0.0722);
  float grassBaseLuminance = dot(
    grassGradientColor,
    grassLuminanceWeights
  );
  vec3 grassCoolColor = grassGradientColor * vec3(0.97, 1.01, 1.04);
  vec3 grassWarmColor = grassGradientColor * vec3(1.03, 0.99, 0.96);
  vec3 grassNaturalColor = mix(
    grassCoolColor,
    grassWarmColor,
    vGrassColorWarmth
  );
  float grassNaturalLuminance = dot(
    grassNaturalColor,
    grassLuminanceWeights
  );
  grassNaturalColor *= grassBaseLuminance / max(
    grassNaturalLuminance,
    0.00001
  );
  grassNaturalColor *= vGrassColorValue;
  grassGradientColor = mix(
    grassGradientColor,
    grassNaturalColor,
    uColorVariation
  );
  vec3 grassInstanceColor = grassSelectedInstanceColor();
  vec3 grassInstanceRatio = grassInstanceColor / max(
    uMiddleColor,
    vec3(0.06)
  );
  grassGradientColor *= clamp(
    grassInstanceRatio,
    vec3(0.18),
    vec3(5.0)
  );
  float grassTextureMaskAmount = grassEvaluateTextureMaskAt(
    vGrassSunPatchWorldPosition
  );
  grassGradientColor = mix(
    grassInstanceColor,
    grassGradientColor,
    grassTextureMaskAmount
  );
  diffuseColor.rgb *= grassGradientColor;
  diffuseColor.a *= grassGradientSampleValue.y;
`;

const pbrEqualFaceNormalFragment = /* glsl */ `
  #include <normal_fragment_begin>
  #ifdef GRASS_EQUAL_FACE_SHADING
    if (!gl_FrontFacing) {
      normal = -normal;
      nonPerturbedNormal = normal;
    }
  #endif
`;

const grassDepthOpacityFragment = /* glsl */ `
  if (vGrassVisibility < 0.02) discard;
  diffuseColor.a *= grassGradientSample().y;
  #include <alphatest_fragment>
`;

export type GrassLayerMaterialSettings = Readonly<{
  alignToNormals: number;
  colorContrast: number;
  colorSaturation: number;
  colorVariation: number;
  depthOffset: number;
  environmentDirection: readonly [number, number];
  environmentContrast: number;
  environmentIntensity: number;
  environmentTint: readonly [number, number, number];
  gradient: GrassGradient;
  highlightWarmth: number;
  instanceColors: GrassInstanceColors;
  instanceColorSeed: number;
  pbrRoughness: number;
  pbrSheen: number;
  randomRotation: number;
  restBendScale: number;
  sceneContrast: number;
  sceneSaturation: number;
  shadowCoolness: number;
  taper: number;
  thickness: number;
  textureMask: GrassSettings["appearance"]["textureMask"];
  tilt: number;
  wind: GrassWindFrameSettings;
  windResponse: number;
}>;

export type GrassLayerMaterialSet = Readonly<{
  depth: THREE.MeshDepthMaterial;
  pbr: THREE.MeshPhysicalMaterial;
  uniforms: Record<string, THREE.IUniform>;
}>;

export function createGrassMaterialUniforms(): Record<string, THREE.IUniform> {
  return {
    ...createGrassColorGradeUniforms(),
    ...createGrassInstanceColorUniforms(),
    ...createGrassTextureMaskUniforms(),
    ...createGrassWindUniforms(),
    uAlignNormals: { value: 1 },
    uColorVariation: { value: 0 },
    uDepthOffset: { value: 0 },
    uEnvironmentContrast: { value: 0 },
    uEnvironmentDirection: { value: new THREE.Vector2(1, 0) },
    uEnvironmentIntensity: { value: 1 },
    uEnvironmentTint: { value: new THREE.Color(1, 1, 1) },
    uMiddleColor: { value: new THREE.Color("#6fca48") },
    uMiddleOpacity: { value: 1 },
    uMiddlePosition: { value: 0.58 },
    uRandomRotation: { value: 1 },
    uRestBendScale: { value: 0.28 },
    uRootColor: { value: new THREE.Color("#173f1f") },
    uRootOpacity: { value: 1 },
    uRootPosition: { value: 0 },
    uTaper: { value: 0.82 },
    uThickness: { value: 0.055 },
    uTilt: { value: 0 },
    uTipColor: { value: new THREE.Color("#d7f171") },
    uTipOpacity: { value: 1 },
    uTipPosition: { value: 1 },
    uGradientAngle: { value: Math.PI / 2 },
    uGradientMode: { value: 0 },
  };
}

function grassMaterialDefines(
  clump: boolean,
): Record<string, string> | undefined {
  return clump ? { GRASS_LAWN_CLUMP: "1" } : undefined;
}

function grassPbrMaterialDefines(clump: boolean): Record<string, string> {
  return clump
    ? { GRASS_LAWN_CLUMP: "1", GRASS_SHARED_WIND_FORCE: "1" }
    : {
        GRASS_EQUAL_FACE_SHADING: "1",
        GRASS_SHARED_WIND_FORCE: "1",
      };
}

function createBladeDepthMaterial(
  uniforms: Record<string, THREE.IUniform>,
  cacheKey: string,
  clump: boolean,
): THREE.MeshDepthMaterial {
  const material = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    side: THREE.DoubleSide,
  });
  material.defines = grassMaterialDefines(clump);
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${pbrVertexHeader}`)
      .replace("#include <begin_vertex>", pbrBeginVertex);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\n${grassGradientFragmentModel}`,
      )
      .replace("#include <alphatest_fragment>", grassDepthOpacityFragment);
  };
  material.customProgramCacheKey = () => `grass-depth-v3:${cacheKey}`;
  return material;
}

function createPbrBladeMaterial(
  uniforms: Record<string, THREE.IUniform>,
  cacheKey: string,
  clump: boolean,
): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    alphaTest: 0,
    color: 0xffffff,
    depthWrite: true,
    metalness: 0,
    roughness: 0.72,
    sheen: 0.35,
    sheenColor: new THREE.Color("#a7d879"),
    sheenRoughness: 0.74,
    side: THREE.DoubleSide,
    transparent: false,
  });
  material.defines = grassPbrMaterialDefines(clump);
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${pbrVertexHeader}`)
      .replace("#include <beginnormal_vertex>", pbrNormalVertex)
      .replace("#include <begin_vertex>", pbrBeginVertex);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${pbrFragmentHeader}`)
      .replace(
        "#include <normal_fragment_begin>",
        pbrEqualFaceNormalFragment,
      )
      .replace("#include <color_fragment>", pbrColorFragment);
  };
  material.customProgramCacheKey = () => `grass-pbr-v7:${cacheKey}`;
  return material;
}

export function createGrassLayerMaterialSet(
  cacheKey: string,
  sunPatchUniforms: GrassSunPatchUniforms,
  surfaceEdgeFade: GrassSurfaceEdgeFadeResource,
  options: Readonly<{ clump?: boolean }> = {},
): GrassLayerMaterialSet {
  const uniforms = createGrassMaterialUniforms();
  Object.assign(uniforms, sunPatchUniforms);
  const clump = options.clump ?? false;
  const pbr = createPbrBladeMaterial(uniforms, cacheKey, clump);
  extendGrassStandardMaterialWithSunPatches(
    pbr,
    sunPatchUniforms,
    `grass-pbr:${cacheKey}`,
  );
  extendGrassStandardMaterialWithColorGrade(
    pbr,
    uniforms,
    `grass-pbr:${cacheKey}`,
  );
  surfaceEdgeFade.extendHashed(pbr, `grass-pbr:${cacheKey}`);
  const depth = createBladeDepthMaterial(uniforms, cacheKey, clump);
  surfaceEdgeFade.extendHashed(depth, `grass-depth:${cacheKey}`);
  return {
    depth,
    pbr,
    uniforms,
  };
}

function getGradientMode(type: GrassGradient["type"]): number {
  if (type === "radial") return 1;
  if (type === "angular") return 2;
  if (type === "diamond") return 3;
  return 0;
}

function applyOpacityMode(
  materials: GrassLayerMaterialSet,
  gradient: GrassGradient,
): void {
  const material = materials.pbr;
  const opaque = gradient.opacities.every((opacity) => opacity >= 0.999);
  if (
    material.alphaHash === true &&
    materials.depth.alphaHash === true &&
    material.forceSinglePass === !opaque &&
    material.transparent === false
  ) {
    return;
  }
  material.alphaHash = true;
  material.transparent = false;
  material.depthWrite = true;
  material.alphaTest = 0;
  material.forceSinglePass = !opaque;
  material.needsUpdate = true;
  materials.depth.alphaHash = true;
  materials.depth.needsUpdate = true;
}

export function applyGrassLayerMaterialSettings(
  materials: GrassLayerMaterialSet,
  settings: GrassLayerMaterialSettings,
): void {
  const uniforms = materials.uniforms;
  uniforms.uAlignNormals.value = settings.alignToNormals;
  applyGrassColorGradeSettings(uniforms, settings, settings);
  applyGrassTextureMaskSettings(uniforms, settings.textureMask);
  uniforms.uColorVariation.value = settings.colorVariation;
  uniforms.uDepthOffset.value = settings.depthOffset;
  uniforms.uEnvironmentContrast.value = settings.environmentContrast;
  (uniforms.uEnvironmentDirection.value as THREE.Vector2).set(
    settings.environmentDirection[0],
    settings.environmentDirection[1],
  );
  uniforms.uEnvironmentIntensity.value = settings.environmentIntensity;
  (uniforms.uEnvironmentTint.value as THREE.Color).setRGB(
    settings.environmentTint[0],
    settings.environmentTint[1],
    settings.environmentTint[2],
  );
  uniforms.uRandomRotation.value = settings.randomRotation;
  uniforms.uRestBendScale.value = settings.restBendScale;
  applyGrassWindUniformSettings(
    uniforms,
    createGrassWindUniformSettings(settings.wind, settings.windResponse),
  );
  uniforms.uTaper.value = settings.taper;
  uniforms.uThickness.value = settings.thickness;
  uniforms.uTilt.value = settings.tilt;
  uniforms.uGradientAngle.value = (settings.gradient.angle * Math.PI) / 180;
  uniforms.uGradientMode.value = getGradientMode(settings.gradient.type);
  applyGrassInstanceColorSettings(
    uniforms,
    settings.instanceColors,
    settings.instanceColorSeed,
  );
  uniforms.uRootOpacity.value = settings.gradient.opacities[0];
  uniforms.uMiddleOpacity.value = settings.gradient.opacities[1];
  uniforms.uTipOpacity.value = settings.gradient.opacities[2];
  uniforms.uRootPosition.value = settings.gradient.positions[0];
  uniforms.uMiddlePosition.value = settings.gradient.positions[1];
  uniforms.uTipPosition.value = settings.gradient.positions[2];
  (uniforms.uRootColor.value as THREE.Color).set(settings.gradient.colors[0]);
  (uniforms.uMiddleColor.value as THREE.Color).set(settings.gradient.colors[1]);
  (uniforms.uTipColor.value as THREE.Color).set(settings.gradient.colors[2]);
  materials.pbr.roughness = settings.pbrRoughness;
  materials.pbr.sheen = settings.pbrSheen;
  materials.pbr.sheenRoughness = Math.min(1, settings.pbrRoughness + 0.08);
  applyOpacityMode(materials, settings.gradient);
}

export function disposeGrassLayerMaterialSet(
  materials: GrassLayerMaterialSet,
): void {
  materials.depth.dispose();
  materials.pbr.dispose();
}

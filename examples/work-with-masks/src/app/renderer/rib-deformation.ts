import * as THREE from "three";
import type { WebGLProgramParametersWithUniforms } from "three";

import type { HeroParams } from "../domain/hero-params";
import { flowTravelOffset } from "./rib-flow";

export type HeroRibDeformationUniforms = Readonly<{
  uTravel: { value: number };
  uDome: { value: number };
  uDomeLength: { value: number };
  uDomeMinimum: { value: number };
  uFlowBounds: { value: THREE.Vector2 };
  uSpacing: { value: number };
  uTwist: { value: number };
  uWave: { value: number };
  uWaveLength: { value: number };
  uWavePhase: { value: number };
}>;

const declarations = `
attribute float aRibX;
attribute float aDeform;
attribute vec2 aRibCenter;
uniform float uTravel;
uniform float uDome;
uniform float uDomeLength;
uniform float uDomeMinimum;
uniform vec2 uFlowBounds;
uniform float uSpacing;
uniform float uTwist;
uniform float uWave;
uniform float uWaveLength;
uniform float uWavePhase;

float heroDomeRadiusFactor(float x) {
  float ratio = x / max(0.001, uDomeLength);
  return uDome > 0.5 ? sqrt(max(uDomeMinimum * uDomeMinimum, 1.0 - ratio * ratio)) : 1.0;
}

vec3 heroFlowPosition(vec3 source) {
  if (aDeform < 0.5) return source;
  float x = aRibX + uTravel;
  float coverage = smoothstep(uFlowBounds.x - uSpacing, uFlowBounds.x, x) *
    (1.0 - smoothstep(uFlowBounds.y, uFlowBounds.y + uSpacing, x));
  if (uTravel == 0.0 && coverage == 1.0) return source;
  float scale = heroDomeRadiusFactor(x) / max(0.001, heroDomeRadiusFactor(aRibX));
  return vec3(x + (source.x - aRibX) * coverage,
    aRibCenter * scale + (source.yz - aRibCenter) * coverage);
}
`;

const normalDeformation = `
float heroNormalPhase = 6.28318530718 * heroFlowPosition(position).z / max(0.001, uWaveLength) + uWavePhase;
float heroNormalSlope = uWave * cos(heroNormalPhase) * 6.28318530718 / max(0.001, uWaveLength) * aDeform;
objectNormal.z -= heroNormalSlope * objectNormal.x;
objectNormal = normalize(objectNormal);
float heroNormalTwist = uTwist * (aRibX + uTravel * aDeform) / max(0.001, uSpacing);
mat2 heroNormalRotation = mat2(cos(heroNormalTwist), -sin(heroNormalTwist), sin(heroNormalTwist), cos(heroNormalTwist));
objectNormal.xz = heroNormalRotation * objectNormal.xz;
`;

const positionDeformation = `
transformed = heroFlowPosition(transformed);
float heroRibX = aRibX + uTravel * aDeform;
float heroZ0 = transformed.z;
float heroPhase = 6.28318530718 * heroZ0 / max(0.001, uWaveLength) + uWavePhase;
float heroDx = uWave * sin(heroPhase) * aDeform;
float heroSlope = uWave * cos(heroPhase) * 6.28318530718 / max(0.001, uWaveLength) * aDeform;
float heroLean = atan(heroSlope);
float heroProfileOffsetX = transformed.x - heroRibX;
vec3 heroPosition = vec3(
  heroRibX + heroDx + heroProfileOffsetX * cos(heroLean),
  transformed.y,
  heroZ0 + heroProfileOffsetX * sin(heroLean)
);
float heroTwist = uTwist * heroRibX / max(0.001, uSpacing);
mat2 heroRotation = mat2(cos(heroTwist), -sin(heroTwist), sin(heroTwist), cos(heroTwist));
heroPosition.xz = heroRotation * heroPosition.xz;
transformed = heroPosition;
`;

export function createRibDeformationUniforms(): HeroRibDeformationUniforms {
  return {
    uTravel: { value: 0 },
    uDome: { value: 0 },
    uDomeLength: { value: 1 },
    uDomeMinimum: { value: 0.15 },
    uFlowBounds: { value: new THREE.Vector2() },
    uSpacing: { value: 1 },
    uTwist: { value: 0 },
    uWave: { value: 0 },
    uWaveLength: { value: 1 },
    uWavePhase: { value: 0 },
  };
}

export function updateRibDeformationUniforms(
  uniforms: HeroRibDeformationUniforms,
  params: HeroParams,
): void {
  const structure = params.structure;
  uniforms.uTravel.value = flowTravelOffset(structure.travel, structure.spacing);
  uniforms.uDome.value = structure.shape === "dome" ? 1 : 0;
  uniforms.uDomeLength.value = structure.domeLength;
  uniforms.uDomeMinimum.value = structure.domeMinimum;
  const halfSpan = structure.spacing * (Math.round(structure.count) - 1) / 2;
  uniforms.uFlowBounds.value.set(structure.xShift - halfSpan, structure.xShift + halfSpan);
  uniforms.uSpacing.value = params.structure.spacing;
  uniforms.uTwist.value = THREE.MathUtils.degToRad(params.structure.twist);
  uniforms.uWave.value = params.structure.wave;
  uniforms.uWaveLength.value = params.structure.waveLength;
  uniforms.uWavePhase.value = params.structure.wavePhase;
}

export function applyRibDeformation(
  material: THREE.Material,
  uniforms: HeroRibDeformationUniforms,
): void {
  const previousCompile = material.onBeforeCompile;
  const previousCacheKey = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = (
    shader: WebGLProgramParametersWithUniforms,
    renderer: THREE.WebGLRenderer,
  ) => {
    previousCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>${declarations}`)
      .replace("#include <beginnormal_vertex>", `#include <beginnormal_vertex>${normalDeformation}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>${positionDeformation}`);
  };
  material.customProgramCacheKey = () => `${previousCacheKey()}|percent-hero-rib-deformation-flow-v2`;
  material.needsUpdate = true;
}

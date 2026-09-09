import * as THREE from "three";

import type { ToolcraftState } from "@/toolcraft/runtime";

import { grassDefaults } from "./grass-defaults";

export type GrassInstanceColors = Readonly<{
  colors: readonly [string, string, string];
  weights: readonly [number, number, number];
}>;

export const grassInstanceColorVertexDeclarations = /* glsl */ `
  uniform float uInstanceColorSeed;
  varying float vGrassInstanceSelector;

  float grassInstanceColorSelector(vec3 root, float phaseValue) {
    return grassVariationHash(
      root.xz * 4.23 +
      vec2(phaseValue * 0.113, phaseValue * 0.197) +
      vec2(uInstanceColorSeed * 0.071, uInstanceColorSeed * 0.137)
    );
  }
`;

export const grassInstanceColorFragmentDeclarations = /* glsl */ `
  uniform vec3 uInstanceColor1;
  uniform vec3 uInstanceColor2;
  uniform vec3 uInstanceColor3;
  uniform vec3 uInstanceColorWeights;
  varying float vGrassInstanceSelector;

  vec3 grassSelectedInstanceColor() {
    vec3 safeWeights = max(uInstanceColorWeights, vec3(0.0));
    float total = dot(safeWeights, vec3(1.0));
    vec3 weights = total > 0.000001
      ? safeWeights / total
      : vec3(0.3333333333);
    return vGrassInstanceSelector < weights.x
      ? uInstanceColor1
      : vGrassInstanceSelector < weights.x + weights.y
        ? uInstanceColor2
        : uInstanceColor3;
  }
`;

export function createGrassInstanceColorUniforms(): Record<
  string,
  THREE.IUniform
> {
  return {
    uInstanceColor1: { value: new THREE.Color("#315a2d") },
    uInstanceColor2: { value: new THREE.Color("#6f8f3f") },
    uInstanceColor3: { value: new THREE.Color("#a3ad58") },
    uInstanceColorSeed: { value: 0 },
    uInstanceColorWeights: { value: new THREE.Vector3(0.45, 0.35, 0.2) },
  };
}

export function applyGrassInstanceColorSettings(
  uniforms: Record<string, THREE.IUniform>,
  settings: GrassInstanceColors,
  seed: number,
): void {
  (uniforms.uInstanceColor1!.value as THREE.Color).set(settings.colors[0]);
  (uniforms.uInstanceColor2!.value as THREE.Color).set(settings.colors[1]);
  (uniforms.uInstanceColor3!.value as THREE.Color).set(settings.colors[2]);
  uniforms.uInstanceColorSeed!.value = seed;
  (uniforms.uInstanceColorWeights!.value as THREE.Vector3).set(
    settings.weights[0],
    settings.weights[1],
    settings.weights[2],
  );
}

export function normalizeGrassInstanceColorWeights(
  values: readonly [number, number, number],
): [number, number, number] {
  const safe = values.map((value) =>
    Number.isFinite(value) ? Math.max(0, value) : 0,
  ) as [number, number, number];
  const total = safe[0] + safe[1] + safe[2];
  if (total <= 0.000001) {
    return [1 / 3, 1 / 3, 1 / 3];
  }
  return [safe[0] / total, safe[1] / total, safe[2] / total];
}

type GrassInstanceColorOwner = "appearance" | "lawn";

function readInstanceColor(
  state: ToolcraftState,
  target: keyof typeof grassDefaults,
): string {
  const value = state.values[target];
  const candidate =
    typeof value === "object" && value !== null && "hex" in value
      ? value.hex
      : value;
  return typeof candidate === "string" && /^#[0-9a-f]{6}$/i.test(candidate)
    ? candidate
    : String(grassDefaults[target]);
}

function readInstanceColorWeight(
  state: ToolcraftState,
  target: keyof typeof grassDefaults,
): number {
  const fallback = Number(grassDefaults[target]);
  const value = Number(state.values[target] ?? fallback);
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : fallback));
}

export function readGrassInstanceColors(
  state: ToolcraftState,
  owner: GrassInstanceColorOwner,
): GrassInstanceColors {
  return {
    colors: [
      readInstanceColor(state, `${owner}.instanceColor1`),
      readInstanceColor(state, `${owner}.instanceColor2`),
      readInstanceColor(state, `${owner}.instanceColor3`),
    ],
    weights: normalizeGrassInstanceColorWeights([
      readInstanceColorWeight(state, `${owner}.instanceColorWeight1`),
      readInstanceColorWeight(state, `${owner}.instanceColorWeight2`),
      readInstanceColorWeight(state, `${owner}.instanceColorWeight3`),
    ]),
  };
}

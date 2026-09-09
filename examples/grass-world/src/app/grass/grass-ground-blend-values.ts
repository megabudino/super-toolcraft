import type { ToolcraftState } from "@/toolcraft/runtime";

import { grassDefaults } from "./grass-defaults";
import type { GrassValueNoiseMaskSettings } from "./grass-settings-types";

type GroundBlendPairTarget =
  "surface.cloverMaskLevels" | "surface.cloverMaskOffset";

function boundedNumber(
  state: ToolcraftState,
  target: keyof typeof grassDefaults,
  minimum: number,
  maximum: number,
): number {
  const raw = Number(state.values[target] ?? grassDefaults[target]);
  const fallback = Number(grassDefaults[target]);
  return Math.max(
    minimum,
    Math.min(maximum, Number.isFinite(raw) ? raw : fallback),
  );
}

function readPair(
  state: ToolcraftState,
  target: GroundBlendPairTarget,
): readonly [number, number] {
  const value = state.values[target];
  if (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(Number(value[0])) &&
    Number.isFinite(Number(value[1]))
  ) {
    return [Number(value[0]), Number(value[1])];
  }
  return [...grassDefaults[target]];
}

export function readGrassGroundBlendMaskSettings(
  state: ToolcraftState,
): GrassValueNoiseMaskSettings {
  const [rawLow, rawHigh] = readPair(state, "surface.cloverMaskLevels");
  const low = Math.max(0, Math.min(100, rawLow)) / 100;
  const high = Math.max(0, Math.min(100, rawHigh)) / 100;
  const [offsetX, offsetZ] = readPair(state, "surface.cloverMaskOffset");
  return {
    detail: Math.round(boundedNumber(state, "surface.cloverMaskDetail", 1, 6)),
    levels: low <= high ? [low, high] : [high, low],
    offset: [
      Math.max(-24, Math.min(24, offsetX)),
      Math.max(-24, Math.min(24, offsetZ)),
    ],
    roughness:
      boundedNumber(state, "surface.cloverMaskRoughness", 10, 90) / 100,
    scale: boundedNumber(state, "surface.cloverMaskScale", 0.08, 2.5),
    seed: Math.round(boundedNumber(state, "surface.cloverMaskSeed", 0, 100)),
  };
}

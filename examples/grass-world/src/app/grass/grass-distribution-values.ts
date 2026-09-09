import type { ToolcraftState } from "@/toolcraft/runtime";

import { grassDefaults } from "./grass-defaults";
import type { GrassDistributionNoiseSettings } from "./grass-distribution-noise";

function boundedStateNumber(
  state: ToolcraftState,
  target: keyof typeof grassDefaults,
  minimum: number,
  maximum: number,
): number {
  const value = Number(state.values[target] ?? grassDefaults[target]);
  const fallback = Number(grassDefaults[target]);
  return Math.max(
    minimum,
    Math.min(maximum, Number.isFinite(value) ? value : fallback),
  );
}

type GrassDistributionOwner = "field" | "lawn";
type GrassDistributionPairTarget =
  | "field.distributionLevels"
  | "field.distributionOffset"
  | "lawn.distributionLevels"
  | "lawn.distributionOffset";

function readPair(
  state: ToolcraftState,
  target: GrassDistributionPairTarget,
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

export function readGrassDistributionSettings(
  state: ToolcraftState,
  owner: GrassDistributionOwner = "field",
): GrassDistributionNoiseSettings {
  const levelsTarget = `${owner}.distributionLevels` as GrassDistributionPairTarget;
  const offsetTarget = `${owner}.distributionOffset` as GrassDistributionPairTarget;
  const [rawLow, rawHigh] = readPair(state, levelsTarget);
  const low = Math.max(0, Math.min(100, rawLow)) / 100;
  const high = Math.max(0, Math.min(100, rawHigh)) / 100;
  const [offsetX, offsetZ] = readPair(state, offsetTarget);
  return {
    detail: Math.round(
      boundedStateNumber(state, `${owner}.distributionDetail`, 1, 6),
    ),
    levels: low <= high ? [low, high] : [high, low],
    offset: [
      Math.max(-24, Math.min(24, offsetX)),
      Math.max(-24, Math.min(24, offsetZ)),
    ],
    roughness:
      boundedStateNumber(state, `${owner}.distributionRoughness`, 10, 90) / 100,
    scale: boundedStateNumber(state, `${owner}.distributionScale`, 0.08, 2.5),
    seed: Math.round(
      boundedStateNumber(state, `${owner}.distributionSeed`, 0, 100),
    ),
  };
}

import type { ToolcraftState } from "@/toolcraft/runtime";

import { grassDefaults } from "./grass-defaults";

export type GrassTextureMaskSettings = Readonly<{
  levels: readonly [number, number];
  scale: number;
  seed: number;
}>;

export type GrassTextureMaskOwner =
  | "appearance"
  | "lawn"
  | "surface"
  | "scan.boulder"
  | "scan.rocks"
  | "scan.tufted"
  | "scan.white"
  | "scan.wild"
  | "scan.yellow";

export function readGrassTextureMaskSettings(
  state: ToolcraftState,
  owner: GrassTextureMaskOwner,
): GrassTextureMaskSettings {
  const levelsTarget =
    `${owner}.textureMaskLevels` as keyof typeof grassDefaults;
  const scaleTarget = `${owner}.textureMaskScale` as keyof typeof grassDefaults;
  const seedTarget = `${owner}.textureMaskSeed` as keyof typeof grassDefaults;
  const fallback = grassDefaults[levelsTarget] as readonly [number, number];
  const value = state.values[levelsTarget];
  const rawLevels =
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(Number(value[0])) &&
    Number.isFinite(Number(value[1]))
      ? [Number(value[0]), Number(value[1])]
      : fallback;
  const low = Math.max(0, Math.min(100, rawLevels[0] ?? fallback[0])) / 100;
  const high = Math.max(0, Math.min(100, rawLevels[1] ?? fallback[1])) / 100;
  const scaleValue = Number(state.values[scaleTarget] ?? grassDefaults[scaleTarget]);
  const seedValue = Number(state.values[seedTarget] ?? grassDefaults[seedTarget]);
  return {
    levels: low <= high ? [low, high] : [high, low],
    scale: Math.max(
      0.1,
      Math.min(
        10,
        Number.isFinite(scaleValue)
          ? scaleValue
          : Number(grassDefaults[scaleTarget]),
      ),
    ),
    seed: Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number.isFinite(seedValue)
            ? seedValue
            : Number(grassDefaults[seedTarget]),
        ),
      ),
    ),
  };
}

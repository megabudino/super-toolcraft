import type { GrassSettings } from "./grass-values";

export type TerrainNoiseSettings = GrassSettings["terrain"];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function interpolate(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value);
}

function hashCell(x: number, z: number, seed: number): number {
  let value =
    Math.imul(x, 521_288_629) +
    Math.imul(z, 1_597_334_805) +
    Math.imul(seed, 1_820_416_117);
  value = Math.imul(value ^ (value >>> 13), 668_265_261);
  value ^= value >>> 15;
  return (value >>> 0) / 4_294_967_295;
}

function valueNoise(x: number, z: number, seed: number): number {
  const cellX = Math.floor(x);
  const cellZ = Math.floor(z);
  const fractionX = smooth(x - cellX);
  const fractionZ = smooth(z - cellZ);
  const near = interpolate(
    hashCell(cellX, cellZ, seed),
    hashCell(cellX + 1, cellZ, seed),
    fractionX,
  );
  const far = interpolate(
    hashCell(cellX, cellZ + 1, seed),
    hashCell(cellX + 1, cellZ + 1, seed),
    fractionX,
  );
  return interpolate(near, far, fractionZ);
}

export function sampleTerrainNoise(
  x: number,
  z: number,
  terrain: TerrainNoiseSettings,
): number {
  const baseX = (x + terrain.noiseOffset[0]) * terrain.noiseScale;
  const baseZ = (z + terrain.noiseOffset[1]) * terrain.noiseScale;
  let amplitude = 1;
  let frequency = 1;
  let normalization = 0;
  let value = 0;

  for (let octave = 0; octave < terrain.detail; octave += 1) {
    value +=
      valueNoise(
        baseX * frequency + octave * 13.37,
        baseZ * frequency - octave * 7.91,
        terrain.seed + octave * 19,
      ) * amplitude;
    normalization += amplitude;
    amplitude *= terrain.roughness;
    frequency *= 2;
  }

  return clamp01(value / Math.max(0.0001, normalization));
}

export function remapTerrainHeightMask(
  value: number,
  levels: readonly [number, number],
): number {
  const black = clamp01(Math.min(levels[0], levels[1]));
  const white = clamp01(Math.max(levels[0], levels[1]));
  const amount = clamp01((value - black) / Math.max(0.0001, white - black));
  return smooth(amount);
}

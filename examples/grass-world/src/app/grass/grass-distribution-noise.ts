export type GrassDistributionNoiseSettings = Readonly<{
  detail: number;
  levels: readonly [number, number];
  offset: readonly [number, number];
  roughness: number;
  scale: number;
  seed: number;
}>;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function hashCell(
  x: number,
  z: number,
  seed: number,
  channel: number,
): number {
  let value =
    Math.imul(x, 521_288_629) +
    Math.imul(z, 1_597_334_805) +
    Math.imul(seed + channel * 1013, 1_820_416_117);
  value = Math.imul(value ^ (value >>> 13), 668_265_261);
  value ^= value >>> 15;
  return (value >>> 0) / 4_294_967_295;
}

function sampleVoronoi(x: number, z: number, seed: number): number {
  const cellX = Math.floor(x);
  const cellZ = Math.floor(z);
  let nearestDistanceSquared = Number.POSITIVE_INFINITY;

  for (let offsetZ = -1; offsetZ <= 1; offsetZ += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const neighborX = cellX + offsetX;
      const neighborZ = cellZ + offsetZ;
      const featureX =
        neighborX + hashCell(neighborX, neighborZ, seed, 0);
      const featureZ =
        neighborZ + hashCell(neighborX, neighborZ, seed, 1);
      const deltaX = featureX - x;
      const deltaZ = featureZ - z;
      nearestDistanceSquared = Math.min(
        nearestDistanceSquared,
        deltaX * deltaX + deltaZ * deltaZ,
      );
    }
  }

  return 1 - clamp01(Math.sqrt(nearestDistanceSquared) / 0.9);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge1 <= edge0) return value >= edge1 ? 1 : 0;
  const amount = clamp01((value - edge0) / (edge1 - edge0));
  return amount * amount * (3 - 2 * amount);
}

export function sampleGrassDistributionNoise(
  x: number,
  z: number,
  settings: GrassDistributionNoiseSettings,
): number {
  const baseX = (x + settings.offset[0]) * settings.scale;
  const baseZ = (z + settings.offset[1]) * settings.scale;
  let amplitude = 1;
  let frequency = 1;
  let normalization = 0;
  let value = 0;

  for (let octave = 0; octave < settings.detail; octave += 1) {
    value +=
      sampleVoronoi(
        baseX * frequency + octave * 11.17,
        baseZ * frequency - octave * 5.73,
        settings.seed + octave * 29,
      ) * amplitude;
    normalization += amplitude;
    amplitude *= settings.roughness;
    frequency *= 2;
  }

  return smoothstep(
    settings.levels[0],
    settings.levels[1],
    clamp01(value / Math.max(0.0001, normalization)),
  );
}


import { sampleGrassDistributionNoise } from "./grass-distribution-noise";
import type { GrassScanLayerKind } from "./grass-scan-contract";
import type { GrassSettings } from "./grass-settings-types";

export type GrassWorldCoverageChannel =
  "boulder" | "lawn" | "tall" | GrassScanLayerKind;

export type GrassCoordinateLayout = Readonly<{
  count: number;
  offsets: Float32Array;
}>;

export function sampleGrassWorldCoverage(
  channel: GrassWorldCoverageChannel,
  x: number,
  z: number,
  settings: GrassSettings,
): number {
  if (channel === "tall") {
    return sampleGrassDistributionNoise(x, z, settings.field.distribution);
  }
  if (channel === "lawn") {
    return sampleGrassDistributionNoise(x, z, settings.lawn.distribution);
  }
  return 1;
}

export function createGrassCoordinateSignature(
  label: string,
  layout: GrassCoordinateLayout,
): string {
  let hash = hashText(label);
  hash = hashInteger(hash, layout.count);
  const sampleCount = Math.min(96, layout.count);
  const stride = Math.max(
    1,
    Math.ceil(layout.count / Math.max(1, sampleCount)),
  );
  for (let index = 0; index < layout.count; index += stride) {
    hash = hashInteger(
      hash,
      Math.round((layout.offsets[index * 3] ?? 0) * 10_000),
    );
    hash = hashInteger(
      hash,
      Math.round((layout.offsets[index * 3 + 1] ?? 0) * 10_000),
    );
    hash = hashInteger(
      hash,
      Math.round((layout.offsets[index * 3 + 2] ?? 0) * 10_000),
    );
  }
  return `${label}:${layout.count}:${hash.toString(36)}`;
}

export function combineGrassLayoutSignatures(
  signatures: Readonly<Record<string, string>>,
): string {
  return Object.keys(signatures)
    .sort()
    .map((key) => `${key}=${signatures[key]}`)
    .join("|");
}

function hashText(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function hashInteger(hash: number, value: number): number {
  let next = hash ^ (value | 0);
  next = Math.imul(next ^ (next >>> 16), 0x7feb352d);
  next = Math.imul(next ^ (next >>> 15), 0x846ca68b);
  return (next ^ (next >>> 16)) >>> 0;
}

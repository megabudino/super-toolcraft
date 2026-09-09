import { getGrassFieldPoint, getGrassFieldShapeSettings } from "./grass-field-shape";
import { getGrassReferenceSurfaceHeight } from "./grass-reference-composition";
import type { GrassSettings } from "./grass-settings-types";

export const grassButterflyMaximumCount = 64;
export const grassButterflyAtlasVariantCount = 8;

export type GrassButterflyLayout = Readonly<{
  anchorHeights: Float32Array;
  anchors: Float32Array;
  atlasIndices: Float32Array;
  count: number;
  headings: Float32Array;
  landingOrders: Float32Array;
  orbitRadii: Float32Array;
  phases: Float32Array;
  sizeFactors: Float32Array;
  verticalFactors: Float32Array;
}>;

function hash01(seed: number, index: number, channel: number): number {
  let value = Math.imul(seed + channel * 0x9e3779b9, 0x85ebca6b);
  value ^= Math.imul(index + 1, 0xc2b2ae35);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 4_294_967_296;
}

export function createGrassButterflyLayout(
  settings: GrassSettings,
): GrassButterflyLayout {
  const count = Math.max(
    0,
    Math.min(grassButterflyMaximumCount, Math.floor(settings.butterflies.count)),
  );
  const anchors = new Float32Array(count * 2);
  const anchorHeights = new Float32Array(count);
  const atlasIndices = new Float32Array(count);
  const headings = new Float32Array(count);
  const landingOrders = new Float32Array(count);
  const orbitRadii = new Float32Array(count);
  const phases = new Float32Array(count);
  const sizeFactors = new Float32Array(count);
  const verticalFactors = new Float32Array(count);
  const shape = getGrassFieldShapeSettings(settings);
  const minimumExtent = Math.min(settings.field.width, settings.field.depth);
  const seed = settings.butterflies.seed;

  for (let index = 0; index < count; index += 1) {
    const [fieldX, fieldZ] = getGrassFieldPoint(
      hash01(seed, index, 3),
      hash01(seed, index, 5),
      shape,
    );
    const x = fieldX * 0.68;
    const z = fieldZ * 0.68;
    anchors[index * 2] = x;
    anchors[index * 2 + 1] = z;
    anchorHeights[index] = getGrassReferenceSurfaceHeight(x, z, settings);
    atlasIndices[index] = Math.floor(
      hash01(seed, index, 7) * grassButterflyAtlasVariantCount,
    );
    headings[index] = hash01(seed, index, 11) * Math.PI * 2;
    landingOrders[index] = hash01(seed, index, 29);
    orbitRadii[index] =
      minimumExtent * (0.025 + hash01(seed, index, 13) * 0.055);
    phases[index] = hash01(seed, index, 17);
    sizeFactors[index] = hash01(seed, index, 19);
    verticalFactors[index] = hash01(seed, index, 23);
  }

  return {
    anchorHeights,
    anchors,
    atlasIndices,
    count,
    headings,
    landingOrders,
    orbitRadii,
    phases,
    sizeFactors,
    verticalFactors,
  };
}

export function getGrassButterflyLayoutSignature(
  layout: GrassButterflyLayout,
): string {
  let checksum = layout.count;
  for (let index = 0; index < layout.count; index += 1) {
    checksum =
      (checksum * 31 +
        Math.round(layout.anchors[index * 2]! * 1_000) +
        Math.round(layout.anchors[index * 2 + 1]! * 1_000) +
        Math.round(layout.anchorHeights[index]! * 1_000) +
        Math.round(layout.atlasIndices[index]!)) |
      0;
  }
  return `butterflies:${layout.count}:${checksum >>> 0}`;
}

import type { GrassSettings } from "./grass-values";
import {
  getGrassFieldRelativeDistance,
  getGrassFieldShapeSettings,
} from "./grass-field-shape";
import {
  remapTerrainHeightMask,
  sampleTerrainNoise,
} from "./terrain-noise";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const amount = clamp01((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return amount * amount * (3 - 2 * amount);
}

function getPerimeterEnvelope(
  x: number,
  z: number,
  settings: GrassSettings,
): number {
  const distance = getGrassFieldRelativeDistance(
    x,
    z,
    getGrassFieldShapeSettings(settings),
  );
  return 1 - smoothstep(0.76, 1, distance);
}

export function getGrassTerrainMaskValue(
  x: number,
  z: number,
  settings: GrassSettings,
): number {
  const noise = sampleTerrainNoise(x, z, settings.terrain);
  const remapped = remapTerrainHeightMask(
    noise,
    settings.terrain.heightLevels,
  );
  return clamp01(remapped * getPerimeterEnvelope(x, z, settings));
}

export function getGrassReferenceSurfaceHeight(
  x: number,
  z: number,
  settings: GrassSettings,
): number {
  return getGrassTerrainMaskValue(x, z, settings) * settings.terrain.maxHeight;
}

export function getGrassReferenceSurfaceSlope(
  x: number,
  z: number,
  settings: GrassSettings,
): readonly [number, number] {
  const epsilon = Math.max(
    0.018,
    Math.min(settings.field.width, settings.field.depth) * 0.006,
  );
  const center = getGrassReferenceSurfaceHeight(x, z, settings);
  return [
    (getGrassReferenceSurfaceHeight(x + epsilon, z, settings) - center) /
      epsilon,
    (getGrassReferenceSurfaceHeight(x, z + epsilon, settings) - center) /
      epsilon,
  ];
}

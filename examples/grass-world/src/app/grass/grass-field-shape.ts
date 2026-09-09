import type { GrassSettings } from "./grass-settings-types";

export type GrassFieldPoint = readonly [x: number, z: number];

export type GrassFieldShapeSettings = Readonly<{
  depth: number;
  irregularity: number;
  roundness: number;
  seed: number;
  width: number;
}>;

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
}

function getGrassFieldExponent(roundness: number): number {
  return 2 + (1 - clamp01(roundness)) * 10;
}

function getGrassFieldEdgeScale(
  angle: number,
  settings: GrassFieldShapeSettings,
): number {
  const irregularity = Number.isFinite(settings.irregularity)
    ? Math.max(0, Math.min(0.3, settings.irregularity))
    : 0.07;
  const phase = settings.seed * 0.173;
  const wave =
    Math.sin(angle * 3 + phase) * 0.67 +
    Math.sin(angle * 7 - phase * 1.7) * 0.33;
  return 1 - irregularity * 0.5 + wave * irregularity * 0.5;
}

function getSuperellipseBoundaryRadius(
  angle: number,
  exponent: number,
): number {
  const cosine = Math.abs(Math.cos(angle));
  const sine = Math.abs(Math.sin(angle));
  return 1 / Math.pow(cosine ** exponent + sine ** exponent, 1 / exponent);
}

export function getGrassFieldShapeSettings(
  settings: Pick<GrassSettings, "field" | "terrain">,
): GrassFieldShapeSettings {
  return {
    depth: settings.field.depth,
    irregularity: settings.field.edgeIrregularity ?? 0.07,
    roundness: settings.field.shapeRoundness ?? 1,
    seed: settings.terrain.seed,
    width: settings.field.width,
  };
}

export function getGrassFieldRelativeDistance(
  x: number,
  z: number,
  settings: GrassFieldShapeSettings,
): number {
  const normalizedX = x / Math.max(0.0001, settings.width * 0.5);
  const normalizedZ = z / Math.max(0.0001, settings.depth * 0.5);
  const exponent = getGrassFieldExponent(settings.roundness);
  const superellipseDistance = Math.pow(
    Math.abs(normalizedX) ** exponent + Math.abs(normalizedZ) ** exponent,
    1 / exponent,
  );
  const angle = Math.atan2(normalizedZ, normalizedX);
  return superellipseDistance / getGrassFieldEdgeScale(angle, settings);
}

export function isGrassFieldPointInside(
  x: number,
  z: number,
  settings: GrassFieldShapeSettings,
): boolean {
  return getGrassFieldRelativeDistance(x, z, settings) <= 1 + 1e-9;
}

export function isGrassFieldFootprintInside(
  x: number,
  z: number,
  radius: number,
  settings: GrassFieldShapeSettings,
): boolean {
  const safeRadius = Math.max(0, radius);
  if (!isGrassFieldPointInside(x, z, settings)) return false;
  if (safeRadius <= Number.EPSILON) return true;
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    if (
      !isGrassFieldPointInside(
        x + Math.cos(angle) * safeRadius,
        z + Math.sin(angle) * safeRadius,
        settings,
      )
    ) {
      return false;
    }
  }
  return true;
}

export function getGrassFieldPoint(
  unitX: number,
  unitZ: number,
  settings: GrassFieldShapeSettings,
): GrassFieldPoint {
  const squareX = Math.max(-1, Math.min(1, unitX * 2 - 1));
  const squareZ = Math.max(-1, Math.min(1, unitZ * 2 - 1));
  const discX = squareX * Math.sqrt(Math.max(0, 1 - squareZ ** 2 * 0.5));
  const discZ = squareZ * Math.sqrt(Math.max(0, 1 - squareX ** 2 * 0.5));
  const radius = Math.hypot(discX, discZ);
  if (radius <= Number.EPSILON) return [0, 0];
  const angle = Math.atan2(discZ, discX);
  const boundaryRadius = getSuperellipseBoundaryRadius(
    angle,
    getGrassFieldExponent(settings.roundness),
  );
  const shapedRadius =
    radius * boundaryRadius * getGrassFieldEdgeScale(angle, settings);
  return [
    (discX / radius) * shapedRadius * settings.width * 0.5,
    (discZ / radius) * shapedRadius * settings.depth * 0.5,
  ];
}

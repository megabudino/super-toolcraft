import {
  getGrassFieldRelativeDistance,
  getGrassFieldShapeSettings,
  type GrassFieldShapeSettings,
} from "./grass-field-shape";
import type { GrassSettings } from "./grass-settings-types";

type GrassSurfaceBendSettings = GrassSettings["surface"]["bend"];

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function smootherstep(value: number): number {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function getGrassSurfaceBendOffset(
  relativeDistance: number,
  bend: GrassSurfaceBendSettings,
): number {
  if (!bend.enabled || bend.depth <= 0) return 0;
  const width = Math.max(0.0001, Math.min(0.4, bend.width));
  const start = 1 - width;
  const t = clamp01((relativeDistance - start) / width);
  if (t <= 0) return 0;
  const smoothness = clamp01(bend.smoothness);
  const eased = t + (smootherstep(t) - t) * smoothness;
  const exponent = 2.4 + (0.65 - 2.4) * clamp01(bend.roundness);
  return -Math.max(0, bend.depth) * Math.pow(eased, exponent);
}

export function getGrassSurfacePlacementShapeSettings(
  settings: Pick<GrassSettings, "field" | "surface" | "terrain">,
): GrassFieldShapeSettings {
  const fieldShape = getGrassFieldShapeSettings(settings);
  if (!settings.surface.bend.enabled) return fieldShape;
  const scale = 1 - Math.max(0.05, Math.min(0.4, settings.surface.bend.width));
  return {
    ...fieldShape,
    depth: fieldShape.depth * scale,
    width: fieldShape.width * scale,
  };
}

export function isGrassSurfaceBendPoint(
  x: number,
  z: number,
  settings: Pick<GrassSettings, "field" | "surface" | "terrain">,
): boolean {
  if (!settings.surface.bend.enabled) return false;
  const distance = getGrassFieldRelativeDistance(
    x,
    z,
    getGrassFieldShapeSettings(settings),
  );
  return distance > 1 - settings.surface.bend.width + 1e-9;
}

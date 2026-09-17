import type { IcebergSettings } from './iceberg-controls';

export const ICEBERG_PLATE_COUNT = 4;

export function getIcebergPlateThickness(settings: IcebergSettings): number {
  // Lower bound of seam(), independent of seed/phase: excavation <= 1 and
  // fracture >= -1. Apply its same monotonic floor cushion to that bound.
  // terrain() stays above min(seam, seamLevel), so the whole square is solid.
  const clearance = Math.max(0.12, settings.seamLevel + settings.depth - 0.12);
  const floor = settings.seamLevel - clearance;
  const cushion = Math.min(0.16, clearance * 0.25);
  const lowest = settings.seamLevel
    - clearance * (1 - Math.exp(-settings.seamValley / clearance)) - settings.seamVariation;
  const boundary = lowest < floor + cushion
    ? floor + cushion * Math.exp((lowest - floor - cushion) / cushion)
    : lowest;
  const coreHeight = settings.depth + Math.min(settings.seamLevel, boundary);
  return coreHeight / ICEBERG_PLATE_COUNT;
}

export function getIcebergPlateOffset(index: number, gap: number): number {
  return (index - ICEBERG_PLATE_COUNT) * gap;
}

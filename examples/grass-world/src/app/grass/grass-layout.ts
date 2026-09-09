import type { GrassSettings } from "./grass-values";
import { calculateGrassCoverageCount } from "./grass-coverage-policy";
import {
  createGrassPlacementCandidatePool,
  filterGrassPlacementCandidatesByCoverage,
} from "./grass-placement-candidates";
import {
  getGrassReferenceSurfaceHeight,
  getGrassReferenceSurfaceSlope,
} from "./grass-reference-composition";
import { sampleGrassWorldCoverage } from "./grass-world-coverage";
import { getGrassSurfacePlacementShapeSettings } from "./grass-surface-bend";

export type GrassLayout = Readonly<{
  angles: Float32Array;
  count: number;
  heights: Float32Array;
  offsets: Float32Array;
  phases: Float32Array;
  slopes: Float32Array;
  visibility: Float32Array;
}>;

export type GrassLayerKind = "lawn" | "tall";

function sliceFloat32(
  source: Float32Array,
  itemSize: number,
  start: number,
  count: number,
): Float32Array {
  return source.slice(start * itemSize, (start + count) * itemSize);
}

export function sliceGrassLayout(
  layout: GrassLayout,
  start: number,
  count = layout.count - start,
): GrassLayout {
  const safeStart = Math.max(0, Math.min(layout.count, Math.floor(start)));
  const safeCount = Math.max(
    0,
    Math.min(layout.count - safeStart, Math.floor(count)),
  );
  return {
    angles: sliceFloat32(layout.angles, 1, safeStart, safeCount),
    count: safeCount,
    heights: sliceFloat32(layout.heights, 1, safeStart, safeCount),
    offsets: sliceFloat32(layout.offsets, 3, safeStart, safeCount),
    phases: sliceFloat32(layout.phases, 1, safeStart, safeCount),
    slopes: sliceFloat32(layout.slopes, 2, safeStart, safeCount),
    visibility: sliceFloat32(layout.visibility, 1, safeStart, safeCount),
  };
}

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

export function calculateGrassBladeCount(settings: GrassSettings): number {
  return calculateGrassCoverageCount({
    densityMax: settings.field.densityMax,
    layer: "tall",
  });
}

export function calculateLawnBladeCount(settings: GrassSettings): number {
  return calculateGrassCoverageCount({
    densityMax: settings.lawn.densityMax,
    layer: "lawn",
  });
}

export function createGrassLayout(
  settings: GrassSettings,
  layer: GrassLayerKind = "tall",
): GrassLayout {
  const isLawn = layer === "lawn";
  const requestedCount = isLawn
    ? calculateLawnBladeCount(settings)
    : calculateGrassBladeCount(settings);
  const layerSettings = isLawn ? settings.lawn : settings.field;
  const placementPool = createGrassPlacementCandidatePool({
    count: requestedCount,
    distanceMin: layerSettings.distanceMin,
    seed: layerSettings.seed,
    shape: getGrassSurfacePlacementShapeSettings(settings),
  });
  const placements = filterGrassPlacementCandidatesByCoverage({
    candidates: placementPool,
    coverageAt: (x, z) =>
      sampleGrassWorldCoverage(layer, x, z, settings),
    seed: layerSettings.seed,
  }).slice(0, requestedCount);
  const count = placements.length;
  const offsets = new Float32Array(count * 3);
  const heights = new Float32Array(count);
  const angles = new Float32Array(count);
  const phases = new Float32Array(count);
  const slopes = new Float32Array(count * 2);
  const visibility = new Float32Array(count);
  const seed = layerSettings.seed;
  for (let index = 0; index < count; index += 1) {
    const placement = placements[index];
    if (!placement) continue;
    const { sourceIndex, x, z } = placement;
    const y = getGrassReferenceSurfaceHeight(x, z, settings);
    const [slopeX, slopeZ] = getGrassReferenceSurfaceSlope(x, z, settings);
    const upward = 1 / Math.sqrt(1 + slopeX * slopeX + slopeZ * slopeZ);
    const threshold = 0.995 - settings.field.topFacingCoverage * 0.02;
    const fadeWidth = 0.003 + settings.field.topFacingFade * 0.02;
    const facingFactor =
      !isLawn && settings.field.topFacingOnly
        ? Math.max(
            0,
            Math.min(1, (upward - (threshold - fadeWidth)) / fadeWidth),
          )
        : 1;
    const offsetIndex = index * 3;
    offsets[offsetIndex] = x;
    offsets[offsetIndex + 1] = y;
    offsets[offsetIndex + 2] = z;
    slopes[index * 2] = slopeX;
    slopes[index * 2 + 1] = slopeZ;
    const heightMin = isLawn
      ? settings.lawn.heightMin
      : settings.blade.heightMin;
    const heightMax = isLawn
      ? settings.lawn.heightMax
      : settings.blade.heightMax;
    heights[index] =
      heightMin +
      (heightMax - heightMin) *
        (0.18 + hash01(seed, sourceIndex, 31) * 0.82);
    angles[index] = hash01(seed, sourceIndex, 37) * Math.PI * 2;
    phases[index] = hash01(seed, sourceIndex, 41) * Math.PI * 2;
    visibility[index] = facingFactor;
  }
  return { angles, count, heights, offsets, phases, slopes, visibility };
}

import {
  grassScanLayerContracts,
  type GrassScanLayerKind,
} from "./grass-scan-contract";
import {
  isGrassFieldFootprintInside,
  isGrassFieldPointInside,
} from "./grass-field-shape";
import {
  createGrassBasePlacementCandidates,
  type GrassPlacementCandidate,
} from "./grass-placement-candidates";
import {
  getGrassReferenceSurfaceHeight,
  getGrassReferenceSurfaceSlope,
} from "./grass-reference-composition";
import type { GrassSettings } from "./grass-values";
import { getGrassSurfacePlacementShapeSettings } from "./grass-surface-bend";

export type GrassScanLayout = Readonly<{
  angles: Float32Array;
  count: number;
  normals: Float32Array;
  offsets: Float32Array;
  scales: Float32Array;
  variants: Uint8Array;
}>;

export type GrassBoulderLayout = Readonly<{
  angle: number;
  count: 0 | 1;
  normal: readonly [number, number, number];
  offset: readonly [number, number, number];
  scale: number;
}>;

const kindSeedOffsets = {
  rocks: 0x2f31,
  tufted: 0x43a7,
  white: 0x5bb9,
  wild: 0x718d,
  yellow: 0x89e3,
} as const satisfies Record<GrassScanLayerKind, number>;

function random(seed: number): () => number {
  let value = (seed | 0) + 0x6d2b79f5;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function fitPlacementFootprint(
  candidate: GrassPlacementCandidate,
  radius: number,
  shape: ReturnType<typeof getGrassSurfacePlacementShapeSettings>,
): GrassPlacementCandidate {
  if (isGrassFieldFootprintInside(candidate.x, candidate.z, radius, shape)) {
    return candidate;
  }
  let x = candidate.x;
  let z = candidate.z;
  for (let iteration = 0; iteration < 32; iteration += 1) {
    x *= 0.86;
    z *= 0.86;
    if (isGrassFieldFootprintInside(x, z, radius, shape)) {
      return { ...candidate, x, z };
    }
  }
  return { ...candidate, x: 0, z: 0 };
}

export function createGrassBoulderLayout(
  settings: GrassSettings,
): GrassBoulderLayout {
  const boulder = settings.scans.boulder;
  const empty: GrassBoulderLayout = {
    angle: 0,
    count: 0,
    normal: [0, 1, 0],
    offset: [0, -1000, 0],
    scale: boulder.size,
  };
  if (!boulder.enabled) return empty;

  const fieldShape = getGrassSurfacePlacementShapeSettings(settings);
  const base = createGrassBasePlacementCandidates({
    count: 48,
    distanceMin: Math.min(fieldShape.width, fieldShape.depth) * 0.045,
    seed: boulder.seed + 0x4b17,
    shape: fieldShape,
  });
  const placement = base[0]
    ? fitPlacementFootprint(base[0], boulder.size * 0.5, fieldShape)
    : undefined;
  if (!placement) return empty;

  const next = random(boulder.seed + placement.sourceIndex + 0x4b17);
  const { x, z } = placement;
  const y =
    getGrassReferenceSurfaceHeight(x, z, settings) + boulder.surfaceOffset;
  const [slopeX, slopeZ] = getGrassReferenceSurfaceSlope(x, z, settings);
  const normalLength = Math.hypot(slopeX, 1, slopeZ);
  return {
    angle: next() * Math.PI * 2,
    count: 1,
    normal: [-slopeX / normalLength, 1 / normalLength, -slopeZ / normalLength],
    offset: [x, y, z],
    scale: boulder.size,
  };
}

export function createGrassScanLayout(
  kind: GrassScanLayerKind,
  settings: GrassSettings,
): GrassScanLayout {
  const layer = settings.scans[kind];
  const contract = grassScanLayerContracts[kind];
  const requestedCount = layer.enabled
    ? Math.max(0, Math.min(contract.countMax, Math.floor(layer.count)))
    : 0;
  if (requestedCount === 0) return emptyScanLayout();

  const seed = layer.seed + kindSeedOffsets[kind];
  const fieldShape = getGrassSurfacePlacementShapeSettings(settings);
  const base = createGrassBasePlacementCandidates({
    count: requestedCount,
    distanceMin: 0.0001,
    seed,
    shape: fieldShape,
  });
  const clumping = clamp(layer.clumping, 0, 1);
  const footprintRadius = layer.sizeMax * contract.baseSize * 0.5;
  const clusterCount = Math.max(
    1,
    Math.min(6, Math.round(Math.sqrt(requestedCount) / 3)),
  );
  const centerBase = createGrassBasePlacementCandidates({
    count: clusterCount,
    distanceMin: Math.min(fieldShape.width, fieldShape.depth) * 0.08,
    seed: seed + 0x4f1b,
    shape: fieldShape,
  });
  const centers = centerBase;
  const placements = base.map((placement) => {
    const next = random(seed + placement.sourceIndex * 17);
    const center = centers[Math.floor(next() * centers.length)];
    const clumpMix = center ? clumping * 0.9 : 0;
    const spread =
      Math.min(fieldShape.width, fieldShape.depth) *
      (0.025 + (1 - clumping) * 0.28);
    const clusterX = center ? center.x + (next() - 0.5) * spread : placement.x;
    const clusterZ = center ? center.z + (next() - 0.5) * spread : placement.z;
    const candidate: GrassPlacementCandidate = {
      sourceIndex: placement.sourceIndex,
      x: mix(placement.x, clusterX, clumpMix),
      z: mix(placement.z, clusterZ, clumpMix),
    };
    if (!isGrassFieldPointInside(candidate.x, candidate.z, fieldShape)) {
      return fitPlacementFootprint(placement, footprintRadius, fieldShape);
    }
    return fitPlacementFootprint(candidate, footprintRadius, fieldShape);
  });
  const count = placements.length;
  const offsets = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const angles = new Float32Array(count);
  const scales = new Float32Array(count);
  const variants = new Uint8Array(count);

  for (let index = 0; index < count; index += 1) {
    const placement = placements[index];
    if (!placement) continue;
    const next = random(seed + placement.sourceIndex * 31 + 0x761d);
    const { x, z } = placement;
    const y =
      getGrassReferenceSurfaceHeight(x, z, settings) + layer.surfaceOffset;
    const [slopeX, slopeZ] = getGrassReferenceSurfaceSlope(x, z, settings);
    const normalLength = Math.hypot(slopeX, 1, slopeZ);
    const offsetIndex = index * 3;
    offsets[offsetIndex] = x;
    offsets[offsetIndex + 1] = y;
    offsets[offsetIndex + 2] = z;
    normals[offsetIndex] = -slopeX / normalLength;
    normals[offsetIndex + 1] = 1 / normalLength;
    normals[offsetIndex + 2] = -slopeZ / normalLength;
    angles[index] = next() * Math.PI * 2;
    scales[index] = mix(layer.sizeMin, layer.sizeMax, 0.12 + next() * 0.88);
    variants[index] = Math.min(
      contract.variantCount - 1,
      Math.floor(next() * contract.variantCount),
    );
  }
  return { angles, count, normals, offsets, scales, variants };
}

export function getGrassScanLayoutKey(
  kind: GrassScanLayerKind,
  settings: GrassSettings,
): string {
  const layer = settings.scans[kind];
  const boulder = settings.scans.boulder;
  return JSON.stringify({
    ...(kind === "rocks"
      ? {
          boulder: {
            enabled: boulder.enabled,
            seed: boulder.seed,
            size: boulder.size,
            surfaceOffset: boulder.surfaceOffset,
          },
        }
      : {}),
    field: {
      depth: settings.field.depth,
      edgeIrregularity: settings.field.edgeIrregularity,
      shapeRoundness: settings.field.shapeRoundness,
      width: settings.field.width,
    },
    surfaceBend: {
      enabled: settings.surface.bend.enabled,
      width: settings.surface.bend.width,
    },
    kind,
    layer: {
      clumping: layer.clumping,
      count: layer.count,
      enabled: layer.enabled,
      seed: layer.seed,
      sizeMax: layer.sizeMax,
      sizeMin: layer.sizeMin,
      surfaceOffset: layer.surfaceOffset,
    },
    terrain: settings.terrain,
  });
}

function emptyScanLayout(): GrassScanLayout {
  return {
    angles: new Float32Array(0),
    count: 0,
    normals: new Float32Array(0),
    offsets: new Float32Array(0),
    scales: new Float32Array(0),
    variants: new Uint8Array(0),
  };
}

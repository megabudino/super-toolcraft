import { grassDefaults } from "./grass-defaults";
import {
  grassAbundanceVariations,
  grassFeatureCompositions,
  grassScaleVariations,
  grassTerrainMorphologies,
  grassVegetationBalances,
  type GrassWorldRange,
} from "./grass-world-catalog";
import { grassCoverageTopologies } from "./grass-world-topologies";
import {
  grassScanLayerContracts,
  grassScanLayerKinds,
} from "./grass-scan-contract";
import {
  createGrassWorldScaledPatch,
  GRASS_WORLD_SCALE_MAX,
  GRASS_WORLD_SCALE_MIN,
} from "./grass-world-scale";

export {
  GRASS_WORLD_SCALE_MAX,
  GRASS_WORLD_SCALE_MIN,
} from "./grass-world-scale";

type GrassSettingTarget = keyof typeof grassDefaults;
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly [infer A, infer B]
        ? [Widen<A>, Widen<B>]
        : T extends readonly (infer Item)[]
          ? Widen<Item>[]
          : T extends object
            ? { -readonly [Key in keyof T]: Widen<T[Key]> }
            : T;
type GrassSettingValue<Target extends GrassSettingTarget> = Widen<
  (typeof grassDefaults)[Target]
>;

export type GrassRandomizationPatch = {
  [Target in GrassSettingTarget]?: GrassSettingValue<Target>;
};

export type GrassWorldAxes = Readonly<{
  abundanceVariation: number;
  coverageTopology: number;
  featureComposition: number;
  scaleVariation: number;
  terrainMorphology: number;
  vegetationBalance: number;
}>;

export const GRASS_WORLD_COUNT =
  grassCoverageTopologies.length *
  grassTerrainMorphologies.length *
  grassVegetationBalances.length *
  grassFeatureCompositions.length *
  grassScaleVariations.length *
  grassAbundanceVariations.length;
export const GRASS_WORLD_STEP = 12_163;

export const GRASS_FORCED_VISIBLE_TARGETS = [
  "field.showGround",
  "grass.enabled",
  "lawn.enabled",
  "butterflies.enabled",
  "scan.boulder.enabled",
  "scan.rocks.enabled",
  "scan.tufted.enabled",
  "scan.white.enabled",
  "scan.wild.enabled",
  "scan.yellow.enabled",
] as const satisfies readonly GrassSettingTarget[];

export const GRASS_WORLD_MARKER_TARGETS = [
  "butterflies.count",
  "butterflies.seed",
  "field.distributionDetail",
  "field.distributionLevels",
  "field.distributionRoughness",
  "field.distributionScale",
  "field.distributionSeed",
  "field.seed",
  "lawn.densityMax",
  "lawn.distributionDetail",
  "lawn.distributionLevels",
  "lawn.distributionRoughness",
  "lawn.distributionScale",
  "lawn.distributionSeed",
  "lawn.distanceMin",
  "lawn.seed",
  "scan.boulder.seed",
  "scan.rocks.clumping",
  "scan.rocks.count",
  "scan.rocks.seed",
  "scan.tufted.clumping",
  "scan.tufted.count",
  "scan.tufted.seed",
  "scan.white.clumping",
  "scan.white.count",
  "scan.white.seed",
  "scan.wild.clumping",
  "scan.wild.count",
  "scan.wild.seed",
  "scan.yellow.clumping",
  "scan.yellow.count",
  "scan.yellow.seed",
  "terrain.detail",
  "terrain.heightLevels",
  "terrain.noiseScale",
  "terrain.roughness",
  "terrain.seed",
] as const satisfies readonly GrassSettingTarget[];

export const GRASS_GENERATED_WORLD_TARGETS = [
  "blade.heightRange",
  "blade.taperEnd",
  "blade.thickness",
  "blade.tilt2d",
  "butterflies.count",
  "butterflies.enabled",
  "butterflies.seed",
  "butterflies.sizeRange",
  "field.alignToNormals",
  "field.densityMax",
  "field.distanceMin",
  "field.distributionDetail",
  "field.distributionLevels",
  "field.distributionOffset",
  "field.distributionRoughness",
  "field.distributionScale",
  "field.distributionSeed",
  "field.edgeIrregularity",
  "field.randomRotation",
  "field.seed",
  "field.shapeRoundness",
  "field.showGround",
  "field.topFacingCoverage",
  "field.topFacingFade",
  "field.topFacingOnly",
  "grass.depthOffset",
  "grass.enabled",
  "lawn.densityMax",
  "lawn.depthOffset",
  "lawn.distanceMin",
  "lawn.distributionDetail",
  "lawn.distributionLevels",
  "lawn.distributionOffset",
  "lawn.distributionRoughness",
  "lawn.distributionScale",
  "lawn.distributionSeed",
  "lawn.enabled",
  "lawn.heightRange",
  "lawn.seed",
  "lawn.taperEnd",
  "lawn.thickness",
  "lawn.tilt2d",
  "scan.boulder.enabled",
  "scan.boulder.seed",
  "scan.boulder.size",
  "scan.boulder.surfaceOffset",
  "scan.rocks.clumping",
  "scan.rocks.count",
  "scan.rocks.enabled",
  "scan.rocks.seed",
  "scan.rocks.sizeRange",
  "scan.rocks.surfaceOffset",
  "scan.tufted.clumping",
  "scan.tufted.count",
  "scan.tufted.enabled",
  "scan.tufted.seed",
  "scan.tufted.sizeRange",
  "scan.tufted.surfaceOffset",
  "scan.white.clumping",
  "scan.white.count",
  "scan.white.enabled",
  "scan.white.seed",
  "scan.white.sizeRange",
  "scan.white.surfaceOffset",
  "scan.wild.clumping",
  "scan.wild.count",
  "scan.wild.enabled",
  "scan.wild.seed",
  "scan.wild.sizeRange",
  "scan.wild.surfaceOffset",
  "scan.yellow.clumping",
  "scan.yellow.count",
  "scan.yellow.enabled",
  "scan.yellow.seed",
  "scan.yellow.sizeRange",
  "scan.yellow.surfaceOffset",
  "terrain.detail",
  "terrain.heightLevels",
  "terrain.maxHeight",
  "terrain.noiseOffset",
  "terrain.noiseScale",
  "terrain.roughness",
  "terrain.seed",
] as const satisfies readonly GrassSettingTarget[];

const generatedTargetSet = new Set<GrassSettingTarget>(
  GRASS_GENERATED_WORLD_TARGETS,
);
export const GRASS_PRESERVED_TARGETS = (
  Object.keys(grassDefaults) as GrassSettingTarget[]
).filter((target) => !generatedTargetSet.has(target));

export function normalizeGrassWorldId(value: unknown): number {
  const numeric = Number(value);
  const rounded = Number.isFinite(numeric) ? Math.round(numeric) : 0;
  return (
    ((rounded % GRASS_WORLD_COUNT) + GRASS_WORLD_COUNT) % GRASS_WORLD_COUNT
  );
}

export function advanceGrassWorldId(value: unknown): number {
  return (normalizeGrassWorldId(value) + GRASS_WORLD_STEP) % GRASS_WORLD_COUNT;
}

export function decodeGrassWorldId(value: unknown): GrassWorldAxes {
  let remainder = normalizeGrassWorldId(value);
  const coverageTopology = remainder % grassCoverageTopologies.length;
  remainder = Math.floor(remainder / grassCoverageTopologies.length);
  const terrainMorphology = remainder % grassTerrainMorphologies.length;
  remainder = Math.floor(remainder / grassTerrainMorphologies.length);
  const vegetationBalance = remainder % grassVegetationBalances.length;
  remainder = Math.floor(remainder / grassVegetationBalances.length);
  const featureComposition = remainder % grassFeatureCompositions.length;
  remainder = Math.floor(remainder / grassFeatureCompositions.length);
  const scaleVariation = remainder % grassScaleVariations.length;
  remainder = Math.floor(remainder / grassScaleVariations.length);
  const abundanceVariation = remainder % grassAbundanceVariations.length;
  return {
    abundanceVariation,
    coverageTopology,
    featureComposition,
    scaleVariation,
    terrainMorphology,
    vegetationBalance,
  };
}

export function getGrassWorldScale(value: unknown): number {
  const axes = decodeGrassWorldId(value);
  return Math.max(
    GRASS_WORLD_SCALE_MIN,
    Math.min(GRASS_WORLD_SCALE_MAX, grassScaleVariations[axes.scaleVariation]!),
  );
}

export function compileGrassWorldPatch(
  value: unknown,
  referenceValues: Readonly<Record<string, unknown>> = grassDefaults,
): GrassRandomizationPatch {
  const worldId = normalizeGrassWorldId(value);
  const axes = decodeGrassWorldId(worldId);
  const topology = grassCoverageTopologies[axes.coverageTopology]!;
  const terrain = grassTerrainMorphologies[axes.terrainMorphology]!;
  const vegetation = grassVegetationBalances[axes.vegetationBalance]!;
  const features = grassFeatureCompositions[axes.featureComposition]!;
  const scaleVariation = getGrassWorldScale(worldId);
  const abundanceVariation = grassAbundanceVariations[axes.abundanceVariation]!;
  const scaledSizes = createGrassWorldScaledPatch(
    referenceValues,
    scaleVariation,
  );
  const patch: GrassRandomizationPatch = {
    "blade.heightRange": scaledSizes["blade.heightRange"],
    "blade.taperEnd": integer(worldId, "tall-taper", 68, 100),
    "blade.thickness": scaledSizes["blade.thickness"],
    "blade.tilt2d": integer(worldId, "tall-tilt", 0, 28),
    "butterflies.count": integer(worldId, "butterfly-count", 8, 34),
    "butterflies.enabled": true,
    "butterflies.seed": versionedSeed(worldId, "butterfly-seed", 71),
    "butterflies.sizeRange": scaledSizes["butterflies.sizeRange"],
    "field.alignToNormals": integer(worldId, "align-normals", 72, 100),
    "field.densityMax": scaledIntegerRange(
      worldId,
      "tall-density",
      vegetation.tallDensity,
      abundanceVariation,
      1_000,
      24_000,
    ),
    "field.distanceMin": steppedRange(
      worldId,
      "tall-spacing",
      vegetation.tallSpacing,
      0.005,
    ),
    "field.distributionDetail": integerRange(
      worldId,
      "tall-mask-detail",
      topology.detail,
    ),
    "field.distributionLevels": orderedProfileRange(
      worldId,
      "tall-levels",
      topology.levels,
      4,
    ),
    "field.distributionOffset": [
      stepped(worldId, "tall-offset-x", -24, 24, 0.5),
      stepped(worldId, "tall-offset-z", -24, 24, 0.5),
    ],
    "field.distributionRoughness": integerRange(
      worldId,
      "tall-roughness",
      topology.roughness,
    ),
    "field.distributionScale": steppedRange(
      worldId,
      "tall-scale",
      topology.scale,
      0.01,
    ),
    "field.distributionSeed": versionedSeed(worldId, "tall-seed", 37),
    "field.edgeIrregularity": integerRange(
      worldId,
      "field-irregularity",
      terrain.edgeIrregularity,
    ),
    "field.randomRotation": integer(worldId, "field-rotation", 45, 100),
    "field.seed": worldId,
    "field.shapeRoundness": integerRange(
      worldId,
      "field-roundness",
      terrain.roundness,
    ),
    "field.showGround": true,
    "field.topFacingCoverage": integer(worldId, "top-facing-coverage", 24, 86),
    "field.topFacingFade": integer(worldId, "top-facing-fade", 32, 96),
    "field.topFacingOnly": terrain.topFacing,
    "grass.depthOffset": stepped(
      worldId,
      "tall-depth-offset",
      -0.06,
      0.04,
      0.005,
    ),
    "grass.enabled": true,
    "lawn.densityMax": scaledIntegerRange(
      worldId,
      "lawn-density",
      vegetation.lawnDensity,
      abundanceVariation,
      1_000,
      36_000,
    ),
    "lawn.depthOffset": stepped(
      worldId,
      "lawn-depth-offset",
      -0.055,
      0.025,
      0.005,
    ),
    "lawn.distanceMin": steppedRange(
      worldId,
      "lawn-spacing",
      vegetation.lawnSpacing,
      0.005,
    ),
    "lawn.distributionDetail": integerRange(
      worldId,
      "lawn-mask-detail",
      topology.detail,
    ),
    "lawn.distributionLevels": orderedProfileRange(
      worldId,
      "lawn-levels",
      topology.levels,
      4,
    ),
    "lawn.distributionOffset": [
      stepped(worldId, "lawn-offset-x", -24, 24, 0.5),
      stepped(worldId, "lawn-offset-z", -24, 24, 0.5),
    ],
    "lawn.distributionRoughness": integerRange(
      worldId,
      "lawn-roughness",
      topology.roughness,
    ),
    "lawn.distributionScale": steppedRange(
      worldId,
      "lawn-scale",
      topology.scale,
      0.01,
    ),
    "lawn.distributionSeed": versionedSeed(worldId, "lawn-mask-seed", 61),
    "lawn.enabled": true,
    "lawn.heightRange": scaledSizes["lawn.heightRange"],
    "lawn.seed": versionedSeed(worldId, "lawn-seed", 53),
    "lawn.taperEnd": integer(worldId, "lawn-taper", 68, 100),
    "lawn.thickness": scaledSizes["lawn.thickness"],
    "lawn.tilt2d": integer(worldId, "lawn-tilt", 0, 26),
    "scan.boulder.enabled": true,
    "scan.boulder.seed": integer(worldId, "boulder-seed", 0, 100),
    "scan.boulder.size": scaledSizes["scan.boulder.size"],
    "scan.boulder.surfaceOffset": stepped(
      worldId,
      "boulder-offset",
      -0.28,
      0.02,
      0.01,
    ),
    "terrain.detail": integerRange(worldId, "terrain-detail", terrain.detail),
    "terrain.heightLevels": orderedProfileRange(
      worldId,
      "terrain-levels",
      terrain.levels,
      4,
    ),
    "terrain.maxHeight": scaledSizes["terrain.maxHeight"],
    "terrain.noiseOffset": [
      stepped(worldId, "terrain-offset-x", -12, 12, 0.5),
      stepped(worldId, "terrain-offset-z", -12, 12, 0.5),
    ],
    "terrain.noiseScale": steppedRange(
      worldId,
      "terrain-scale",
      terrain.scale,
      0.01,
    ),
    "terrain.roughness": integerRange(
      worldId,
      "terrain-roughness",
      terrain.roughness,
    ),
    "terrain.seed": integer(worldId, "terrain-seed", 0, 100),
  };

  addScanPlacementPatch(
    patch,
    worldId,
    features,
    abundanceVariation,
    scaledSizes,
  );
  assertPatchCoverage(patch);
  return patch;
}

export function matchesCompiledGrassWorld(
  currentValues: Readonly<Record<string, unknown>>,
  value: unknown = currentValues["field.seed"],
): boolean {
  const worldId = normalizeGrassWorldId(value);
  if (normalizeGrassWorldId(currentValues["field.seed"]) !== worldId) {
    return false;
  }
  const expected = compileGrassWorldPatch(worldId, grassDefaults);
  return GRASS_WORLD_MARKER_TARGETS.every((target) =>
    settingValuesEqual(currentValues[target], expected[target]),
  );
}

function addScanPlacementPatch(
  patch: GrassRandomizationPatch,
  worldId: number,
  features: (typeof grassFeatureCompositions)[number],
  abundanceVariation: number,
  scaledSizes: ReturnType<typeof createGrassWorldScaledPatch>,
): void {
  for (const kind of grassScanLayerKinds) {
    const contract = grassScanLayerContracts[kind];
    const channel = `scan-${kind}`;
    const countFraction = sampleRange(
      worldId,
      `${channel}-count`,
      features.countFraction,
    );
    const count = Math.max(
      24,
      Math.min(
        contract.countMax,
        Math.round(contract.countMax * countFraction * abundanceVariation),
      ),
    );
    setPatchValue(
      patch,
      `scan.${kind}.clumping`,
      integerRange(worldId, `${channel}-clumping`, features.clumping),
    );
    setPatchValue(patch, `scan.${kind}.count`, count);
    setPatchValue(patch, `scan.${kind}.enabled`, true);
    setPatchValue(
      patch,
      `scan.${kind}.seed`,
      integer(worldId, `${channel}-seed`, 0, 100),
    );
    setPatchValue(
      patch,
      `scan.${kind}.sizeRange`,
      scaledSizes[`scan.${kind}.sizeRange`],
    );
    setPatchValue(
      patch,
      `scan.${kind}.surfaceOffset`,
      stepped(
        worldId,
        `${channel}-offset`,
        kind === "rocks" ? -0.08 : -0.05,
        kind === "rocks" ? 0.02 : 0.06,
        0.005,
      ),
    );
  }
}

function settingValuesEqual(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) || Array.isArray(right)) {
    return JSON.stringify(left) === JSON.stringify(right);
  }
  return left === right;
}

function assertPatchCoverage(patch: GrassRandomizationPatch): void {
  for (const target of GRASS_GENERATED_WORLD_TARGETS) {
    if (!(target in patch)) {
      throw new Error(`Grass world compiler omitted ${target}.`);
    }
  }
  for (const target of GRASS_PRESERVED_TARGETS) {
    if (target in patch) {
      throw new Error(`Grass world compiler wrote preserved target ${target}.`);
    }
  }
}

function setPatchValue<Target extends GrassSettingTarget>(
  patch: GrassRandomizationPatch,
  target: Target,
  value: GrassSettingValue<Target>,
): void {
  Object.assign(patch, { [target]: value });
}

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function unit(worldId: number, channel: string): number {
  let value = Math.imul(worldId + 1, 0x9e3779b1) ^ hashString(channel);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 4_294_967_296;
}

function sample(
  worldId: number,
  channel: string,
  minimum: number,
  maximum: number,
): number {
  return minimum + (maximum - minimum) * unit(worldId, channel);
}

function sampleRange(
  worldId: number,
  channel: string,
  range: GrassWorldRange,
): number {
  return sample(worldId, channel, range[0], range[1]);
}

function integer(
  worldId: number,
  channel: string,
  minimum: number,
  maximum: number,
): number {
  return Math.round(sample(worldId, channel, minimum, maximum));
}

function integerRange(
  worldId: number,
  channel: string,
  range: GrassWorldRange,
): number {
  return integer(worldId, channel, range[0], range[1]);
}

function versionedSeed(
  worldId: number,
  channel: string,
  offset: number,
): number {
  return (integer(worldId, channel, 0, 100) + offset) % 101;
}

function scaledIntegerRange(
  worldId: number,
  channel: string,
  range: GrassWorldRange,
  factor: number,
  minimum: number,
  maximum: number,
): number {
  return Math.max(
    minimum,
    Math.min(
      maximum,
      Math.round(sampleRange(worldId, channel, range) * factor),
    ),
  );
}

function stepped(
  worldId: number,
  channel: string,
  minimum: number,
  maximum: number,
  step: number,
): number {
  return steppedValue(sample(worldId, channel, minimum, maximum), step);
}

function steppedRange(
  worldId: number,
  channel: string,
  range: GrassWorldRange,
  step: number,
): number {
  return stepped(worldId, channel, range[0], range[1], step);
}

function steppedValue(value: number, step: number): number {
  return Number((Math.round(value / step) * step).toFixed(4));
}

function orderedProfileRange(
  worldId: number,
  channel: string,
  ranges: readonly [GrassWorldRange, GrassWorldRange],
  minimumGap: number,
): [number, number] {
  const low = integerRange(worldId, `${channel}-low`, ranges[0]);
  const high = integerRange(worldId, `${channel}-high`, ranges[1]);
  return [low, Math.min(100, Math.max(low + minimumGap, high))];
}

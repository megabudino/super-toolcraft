import { grassDefaults } from "./grass-defaults";
import {
  grassScanLayerContracts,
  grassScanLayerKinds,
} from "./grass-scan-contract";

export const GRASS_WORLD_SCALE_MIN = 0.75;
export const GRASS_WORLD_SCALE_MAX = 1.2;

export const GRASS_WORLD_SCALED_TARGETS = [
  "blade.heightRange",
  "blade.thickness",
  "butterflies.sizeRange",
  "lawn.heightRange",
  "lawn.thickness",
  "scan.boulder.size",
  "scan.rocks.sizeRange",
  "scan.tufted.sizeRange",
  "scan.white.sizeRange",
  "scan.wild.sizeRange",
  "scan.yellow.sizeRange",
  "terrain.maxHeight",
] as const;

export type GrassWorldScaledTarget =
  (typeof GRASS_WORLD_SCALED_TARGETS)[number];

export type GrassWorldScaledPatch = Readonly<{
  "blade.heightRange": [number, number];
  "blade.thickness": number;
  "butterflies.sizeRange": [number, number];
  "lawn.heightRange": [number, number];
  "lawn.thickness": number;
  "scan.boulder.size": number;
  "scan.rocks.sizeRange": [number, number];
  "scan.tufted.sizeRange": [number, number];
  "scan.white.sizeRange": [number, number];
  "scan.wild.sizeRange": [number, number];
  "scan.yellow.sizeRange": [number, number];
  "terrain.maxHeight": number;
}>;

export type GrassWorldScaleMarker = Readonly<{
  generated: Readonly<Record<GrassWorldScaledTarget, number | readonly number[]>>;
  reference: Readonly<Record<GrassWorldScaledTarget, number | readonly number[]>>;
}>;

export function createGrassWorldScaledPatch(
  referenceValues: Readonly<Record<string, unknown>>,
  scale: number,
): GrassWorldScaledPatch {
  const fieldMinimum = Math.max(
    1,
    Math.min(
      readNumber(referenceValues, "field.width"),
      readNumber(referenceValues, "field.depth"),
    ),
  );
  const boulderReference = readNumber(referenceValues, "scan.boulder.size");
  const boulderMaximum = Math.min(
    3.2,
    Math.max(
      0.6,
      fieldMinimum * 0.22,
      Number(grassDefaults["scan.boulder.size"]),
    ),
  );
  const patch: Record<string, number | [number, number]> = {
    "blade.heightRange": scaleOrderedRange(
      readRange(referenceValues, "blade.heightRange"),
      scale,
      0.2,
      Math.min(2.4, fieldMinimum * 0.25),
      0.01,
    ),
    "blade.thickness": scaleNumber(
      readNumber(referenceValues, "blade.thickness"),
      scale,
      0.015,
      0.14,
    ),
    "butterflies.sizeRange": scaleOrderedRange(
      readRange(referenceValues, "butterflies.sizeRange"),
      scale,
      0.05,
      Math.min(0.45, fieldMinimum * 0.09),
      0.01,
    ),
    "lawn.heightRange": scaleOrderedRange(
      readRange(referenceValues, "lawn.heightRange"),
      scale,
      0.03,
      Math.min(0.55, fieldMinimum * 0.1),
      0.005,
    ),
    "lawn.thickness": scaleNumber(
      readNumber(referenceValues, "lawn.thickness"),
      scale,
      0.01,
      0.09,
    ),
    "scan.boulder.size": scaleNumber(
      boulderReference,
      scale,
      0.6,
      boulderMaximum,
    ),
    "terrain.maxHeight": scaleNumber(
      readNumber(referenceValues, "terrain.maxHeight"),
      scale,
      0,
      Math.min(3, fieldMinimum * 0.42),
    ),
  };

  for (const kind of grassScanLayerKinds) {
    const contract = grassScanLayerContracts[kind];
    const organicMaximum = Math.min(
      contract.sizeMax,
      fieldMinimum * (kind === "rocks" ? 0.18 : 0.22),
    );
    patch[`scan.${kind}.sizeRange`] = scaleOrderedRange(
      readRange(referenceValues, `scan.${kind}.sizeRange`),
      scale,
      contract.sizeMin,
      Math.max(contract.sizeMin + 0.05, organicMaximum),
      0.01,
    );
  }

  return patch as GrassWorldScaledPatch;
}

export function recoverGrassWorldScaleReference(
  currentValues: Readonly<Record<string, unknown>>,
  previousScale: number,
  isPreviousGeneratedWorld: boolean,
  marker: GrassWorldScaleMarker | null = null,
): Readonly<Record<string, unknown>> {
  if (!isPreviousGeneratedWorld) return currentValues;

  const referenceValues: Record<string, unknown> = { ...currentValues };
  for (const target of GRASS_WORLD_SCALED_TARGETS) {
    const current = currentValues[target] ?? grassDefaults[target];
    if (
      marker &&
      settingValuesEqual(current, marker.generated[target])
    ) {
      referenceValues[target] = marker.reference[target];
      continue;
    }
    referenceValues[target] =
      marker === null
        ? unscaleValue(current, previousScale)
        : current;
  }
  return referenceValues;
}

export function createGrassWorldScaleMarker(
  referenceValues: Readonly<Record<string, unknown>>,
  generatedValues: Readonly<Record<string, unknown>>,
): GrassWorldScaleMarker {
  const reference = {} as Record<
    GrassWorldScaledTarget,
    number | readonly number[]
  >;
  const generated = {} as Record<
    GrassWorldScaledTarget,
    number | readonly number[]
  >;
  for (const target of GRASS_WORLD_SCALED_TARGETS) {
    reference[target] = cloneScaleValue(
      referenceValues[target] ?? grassDefaults[target],
    );
    generated[target] = cloneScaleValue(
      generatedValues[target] ?? reference[target],
    );
  }
  return { generated, reference };
}

function readNumber(
  values: Readonly<Record<string, unknown>>,
  target: keyof typeof grassDefaults,
): number {
  const numeric = Number(values[target] ?? grassDefaults[target]);
  return Number.isFinite(numeric) ? numeric : Number(grassDefaults[target]);
}

function readRange(
  values: Readonly<Record<string, unknown>>,
  target: GrassWorldScaledTarget,
): readonly [number, number] {
  const fallback = grassDefaults[target];
  const current = values[target];
  if (
    Array.isArray(current) &&
    current.length >= 2 &&
    Number.isFinite(Number(current[0])) &&
    Number.isFinite(Number(current[1]))
  ) {
    return [Number(current[0]), Number(current[1])];
  }
  if (Array.isArray(fallback)) {
    return [Number(fallback[0]), Number(fallback[1])];
  }
  throw new Error(`Grass world scale target ${target} is not a range.`);
}

function scaleNumber(
  reference: number,
  scale: number,
  minimum: number,
  maximum: number,
): number {
  return precise(Math.max(minimum, Math.min(maximum, reference * scale)));
}

function scaleOrderedRange(
  reference: readonly [number, number],
  scale: number,
  minimum: number,
  maximum: number,
  minimumGap: number,
): [number, number] {
  const high = Math.max(
    minimum + minimumGap,
    Math.min(maximum, reference[1] * scale),
  );
  const low = Math.max(
    minimum,
    Math.min(high - minimumGap, reference[0] * scale),
  );
  return [precise(low), precise(high)];
}

function precise(value: number): number {
  return Number(value.toFixed(6));
}

function cloneScaleValue(value: unknown): number | readonly number[] {
  return Array.isArray(value)
    ? value.map((entry) => Number(entry))
    : Number(value);
}

function settingValuesEqual(left: unknown, right: unknown): boolean {
  return Array.isArray(left) || Array.isArray(right)
    ? JSON.stringify(left) === JSON.stringify(right)
    : left === right;
}

function unscaleValue(
  value: unknown,
  previousScale: number,
): number | readonly number[] {
  return Array.isArray(value)
    ? value.map((entry) => precise(Number(entry) / previousScale))
    : precise(Number(value) / previousScale);
}

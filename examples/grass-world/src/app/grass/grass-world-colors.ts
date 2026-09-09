import { grassDefaults } from "./grass-defaults";
import {
  createGrassWorldColorMood,
  transformGrassWorldColor,
  type GrassWorldColorRole,
} from "./grass-world-color-transform";

export const GRASS_WORLD_COLOR_TARGETS = [
  "appearance.groundColor",
  "surface.cloverColor",
  "appearance.bladeGradient",
  "appearance.instanceColor1",
  "appearance.instanceColor2",
  "appearance.instanceColor3",
  "lawn.bladeGradient",
  "lawn.instanceColor1",
  "lawn.instanceColor2",
  "lawn.instanceColor3",
  "scan.tufted.pbrTint",
  "scan.wild.pbrTint",
  "scan.white.pbrTint",
  "scan.yellow.pbrTint",
  "scan.rocks.pbrTint",
  "scan.boulder.pbrTint",
] as const satisfies readonly (keyof typeof grassDefaults)[];

export type GrassWorldColorTarget = (typeof GRASS_WORLD_COLOR_TARGETS)[number];

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

export type GrassWorldColorPatch = Readonly<{
  [Target in GrassWorldColorTarget]: Widen<(typeof grassDefaults)[Target]>;
}>;

export type GrassWorldPaletteValues = Readonly<
  Record<GrassWorldColorTarget, unknown>
>;

export type GrassWorldPaletteMarker = Readonly<{
  generatedValues: GrassWorldPaletteValues;
  referenceValues: GrassWorldPaletteValues;
  worldId: number;
}>;

type GradientValue = Readonly<{
  stops: readonly Record<string, unknown>[];
}> &
  Record<string, unknown>;

const gradientTargets = new Set<GrassWorldColorTarget>([
  "appearance.bladeGradient",
  "lawn.bladeGradient",
]);

const solidTargetRoles = {
  "appearance.groundColor": "ground",
  "surface.cloverColor": "ground",
  "appearance.instanceColor1": "vegetation-instance-dark",
  "appearance.instanceColor2": "vegetation-instance-middle",
  "appearance.instanceColor3": "vegetation-instance-light",
  "lawn.instanceColor1": "vegetation-instance-dark",
  "lawn.instanceColor2": "vegetation-instance-middle",
  "lawn.instanceColor3": "vegetation-instance-light",
  "scan.boulder.pbrTint": "stone",
  "scan.rocks.pbrTint": "stone",
  "scan.tufted.pbrTint": "vegetation-tufted",
  "scan.white.pbrTint": "flower-white",
  "scan.wild.pbrTint": "vegetation-wild",
  "scan.yellow.pbrTint": "flower-yellow",
} as const satisfies Partial<
  Record<GrassWorldColorTarget, GrassWorldColorRole>
>;

type SolidTarget = keyof typeof solidTargetRoles;

/** Builds all twenty concrete colors from one deterministic world mood. */
export function createGrassWorldColorPatch(
  referenceValues: Readonly<Record<string, unknown>>,
  worldId: unknown,
): GrassWorldColorPatch {
  const mood = createGrassWorldColorMood(worldId);
  const patch: Partial<Record<GrassWorldColorTarget, unknown>> = {};
  for (const target of GRASS_WORLD_COLOR_TARGETS) {
    patch[target] = transformTargetValue(
      referenceValues[target] ?? grassDefaults[target],
      target,
      mood,
    );
  }
  return patch as GrassWorldColorPatch;
}

/**
 * Restores each unchanged generated target from its exact deep-cloned baseline.
 * A manual edit breaks only that target's marker match and becomes its new
 * baseline without changing the other fifteen targets.
 */
export function recoverGrassWorldPaletteReference(
  currentValues: Readonly<Record<string, unknown>>,
  previousWorldId: unknown,
  marker: GrassWorldPaletteMarker | null,
): Readonly<Record<string, unknown>> {
  if (
    !marker ||
    marker.worldId !== finiteInteger(previousWorldId)
  ) {
    return currentValues;
  }

  let recovered: Record<string, unknown> | null = null;
  for (const target of GRASS_WORLD_COLOR_TARGETS) {
    const current = currentValues[target] ?? grassDefaults[target];
    if (!deepEqual(current, marker.generatedValues[target])) continue;
    recovered ??= { ...currentValues };
    recovered[target] = deepClone(marker.referenceValues[target]);
  }
  return recovered ?? currentValues;
}

export function createGrassWorldPaletteMarker(
  referenceValues: Readonly<Record<string, unknown>>,
  generatedPatch: Readonly<Record<string, unknown>>,
  worldId: unknown,
): GrassWorldPaletteMarker {
  const fallbackPatch = createGrassWorldColorPatch(referenceValues, worldId);
  const generatedValues: Partial<Record<GrassWorldColorTarget, unknown>> = {};
  const paletteReference: Partial<Record<GrassWorldColorTarget, unknown>> = {};

  for (const target of GRASS_WORLD_COLOR_TARGETS) {
    paletteReference[target] = deepClone(
      referenceValues[target] ?? grassDefaults[target],
    );
    generatedValues[target] = deepClone(
      generatedPatch[target] ?? fallbackPatch[target],
    );
  }

  return {
    generatedValues: generatedValues as GrassWorldPaletteValues,
    referenceValues: paletteReference as GrassWorldPaletteValues,
    worldId: finiteInteger(worldId),
  };
}

function transformTargetValue(
  value: unknown,
  target: GrassWorldColorTarget,
  mood: ReturnType<typeof createGrassWorldColorMood>,
): unknown {
  if (gradientTargets.has(target)) {
    const fallback = grassDefaults[target] as GradientValue;
    const gradient = readGradient(value) ?? fallback;
    return {
      ...gradient,
      stops: gradient.stops.map((stop, index) => {
        const fallbackStop =
          fallback.stops[
            Math.min(fallback.stops.length - 1, index % fallback.stops.length)
          ]!;
        const color = readHex(stop.color) ?? String(fallbackStop.color);
        return {
          ...stop,
          color: transformGrassWorldColor(
            color,
            gradientRole(index, gradient.stops.length),
            mood,
            `${target}-stop-${index}`,
          ),
        };
      }),
    };
  }

  const role = solidTargetRoles[target as SolidTarget];
  if (!role) throw new Error(`Missing palette role for ${target}.`);
  return transformGrassWorldColor(
    readHex(value) ?? String(grassDefaults[target]),
    role,
    mood,
    target,
  );
}

function gradientRole(index: number, count: number): GrassWorldColorRole {
  if (index === 0) return "vegetation-root";
  if (index === count - 1) return "vegetation-tip";
  return "vegetation-middle";
}

function readGradient(value: unknown): GradientValue | null {
  if (!isRecord(value) || !Array.isArray(value.stops) || value.stops.length < 2) {
    return null;
  }
  if (!value.stops.every(isRecord)) return null;
  return value as GradientValue;
}

function readHex(value: unknown): string | undefined {
  return typeof value === "string" && /^#[\da-f]{3}(?:[\da-f]{3})?$/iu.test(value)
    ? value
    : undefined;
}

function deepClone(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(deepClone);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, deepClone(child)]),
  );
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    return (
      left.length === right.length &&
      left.every((value, index) => deepEqual(value, right[index]))
    );
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] && deepEqual(left[key], right[key]),
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteInteger(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

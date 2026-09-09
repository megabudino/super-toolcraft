import presetDefaultsSource from "./donut-preset-defaults.json" with {
  type: "json",
};

export type DonutPresetOrientation = Readonly<{
  position: readonly [number, number, number];
  up: readonly [number, number, number];
}>;

export type DonutPresetValue =
  | boolean
  | DonutPresetOrientation
  | number
  | string;

export type DonutPreset = Readonly<{
  id: string;
  label: string;
  values: Readonly<Record<string, DonutPresetValue>>;
}>;

export const DONUT_PRESET_TARGET = "donut.preset";
export const DONUT_PRESET_CUSTOM = "custom";
export const DONUT_PRESET_DEFAULT = "strawberry-party";

type DonutPresetSource = Readonly<{
  id: string;
  label: string;
  values: Readonly<Record<string, unknown>>;
}>;

const presetSources =
  presetDefaultsSource.presets as unknown as readonly DonutPresetSource[];

function sourcePreset(source: DonutPresetSource): DonutPreset {
  return Object.freeze({
    id: source.id,
    label: source.label,
    values: Object.freeze({
      ...source.values,
    }) as Readonly<Record<string, DonutPresetValue>>,
  });
}

function isVector3(value: unknown): value is readonly [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every(
      (component) => typeof component === "number" && Number.isFinite(component),
    )
  );
}

function readDefaultOrientation(): DonutPresetOrientation {
  const source = presetSources.find(
    (preset) => preset.id === DONUT_PRESET_DEFAULT,
  )?.values["scene.orientation"];
  if (
    typeof source !== "object" ||
    source === null ||
    !("position" in source) ||
    !("up" in source) ||
    !isVector3(source.position) ||
    !isVector3(source.up)
  ) {
    throw new Error("The default donut preset requires a valid camera pose.");
  }
  return Object.freeze({
    position: Object.freeze([...source.position]) as readonly [
      number,
      number,
      number,
    ],
    up: Object.freeze([...source.up]) as readonly [number, number, number],
  });
}

if (
  presetDefaultsSource.format !== "donut-studio-presets" ||
  presetDefaultsSource.version !== 1 ||
  presetSources[0]?.id !== DONUT_PRESET_DEFAULT ||
  new Set(presetSources.map((preset) => preset.id)).size !== presetSources.length
) {
  throw new Error(
    "The bundled donut preset defaults must be a unique default-first version 1 library.",
  );
}

export const DONUT_DEFAULT_PRESET_ORIENTATION = readDefaultOrientation();

export const DONUT_PRESETS: readonly DonutPreset[] = Object.freeze(
  presetSources.map(sourcePreset),
);

export function findDonutPreset(id: unknown): DonutPreset | null {
  if (typeof id !== "string" || id === DONUT_PRESET_CUSTOM) return null;
  return DONUT_PRESETS.find((preset) => preset.id === id) ?? null;
}

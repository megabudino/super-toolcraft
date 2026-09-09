import type { ToolcraftState } from "@/toolcraft/runtime";

import {
  DONUT_DEFAULT_PRESET_ORIENTATION,
  DONUT_PRESET_DEFAULT,
  DONUT_PRESETS,
  type DonutPreset,
  type DonutPresetValue,
} from "./donut-presets";
import type { DonutSettings } from "./donut-types";
import {
  DONUT_DEFAULTS,
  DONUT_FACTORY_DEFAULTS,
  readDonutSettings,
} from "./donut-values";

export const DONUT_PRESET_LIBRARY_TARGET = "donut.presetLibrary";
export const DONUT_PRESET_RESET_ACTION = "presets.reset-current";
export const DONUT_PRESET_LIBRARY_FORMAT = "donut-studio-presets";
export const DONUT_PRESET_LIBRARY_VERSION = 1;

export type DonutPresetLibrary = Readonly<{
  format: typeof DONUT_PRESET_LIBRARY_FORMAT;
  presets: readonly DonutPreset[];
  version: typeof DONUT_PRESET_LIBRARY_VERSION;
}>;

export type DonutPresetLibraryParseResult =
  | Readonly<{ library: DonutPresetLibrary; ok: true }>
  | Readonly<{ code: string; message: string; ok: false }>;

type DonutPresetState = Pick<ToolcraftState, "canvas" | "values">;

const DEFAULT_PRESET_ORIENTATION = DONUT_DEFAULT_PRESET_ORIENTATION;

function flattenDonutPresetValues(
  settings: DonutSettings,
  infinityCanvas: boolean,
  orientation: typeof DEFAULT_PRESET_ORIENTATION,
): Readonly<Record<string, DonutPresetValue>> {
  return Object.freeze({
    "appearance.background": settings.background.color,
    "canvas.infinity": infinityCanvas,
    "donut.height": settings.donut.height,
    "donut.majorRadius": settings.donut.majorRadius,
    "donut.organic": settings.donut.organic,
    "donut.thickness": settings.donut.thickness,
    "export.includeBackground": settings.background.include,
    "icing.color": settings.icing.color,
    "icing.coverage": settings.icing.coverage,
    "icing.detail": settings.icing.detail,
    "icing.dripAmount": settings.icing.dripAmount,
    "icing.dripFrequency": settings.icing.dripFrequency,
    "icing.enabled": settings.icing.enabled,
    "icing.flow": settings.icing.flow,
    "icing.thickness": settings.icing.thickness,
    "material.donut.bake": settings.materials.donut.bake,
    "material.donut.coat": settings.materials.donut.coat,
    "material.donut.color": settings.materials.donut.color,
    "material.donut.moisture": settings.materials.donut.moisture,
    "material.donut.pores": settings.materials.donut.pores,
    "material.donut.roughness": settings.materials.donut.roughness,
    "material.donut.sheen": settings.materials.donut.sheen,
    "material.donut.softness": settings.materials.donut.softness,
    "material.donut.subsurface": settings.materials.donut.subsurface,
    "material.donut.variation": settings.materials.donut.variation,
    "material.icing.coat": settings.materials.icing.coat,
    "material.icing.glaze": settings.materials.icing.glaze,
    "material.icing.roughness": settings.materials.icing.roughness,
    "material.icing.sheen": settings.materials.icing.sheen,
    "material.icing.subsurface": settings.materials.icing.subsurface,
    "material.icing.texture": settings.materials.icing.texture,
    "material.plate.coat": settings.materials.plate.coat,
    "material.plate.color": settings.materials.plate.color,
    "material.plate.roughness": settings.materials.plate.roughness,
    "material.sprinkle.coat": settings.materials.sprinkle.coat,
    "material.sprinkle.roughness": settings.materials.sprinkle.roughness,
    "scene.orientation": orientation,
    "scene.plateVisible": settings.plateVisible,
    "sprinkles.coverage": settings.sprinkles.coverage,
    "sprinkles.flow": settings.sprinkles.flow,
    "sprinkles.metallic": settings.sprinkles.metallic,
    "sprinkles.palette": String(settings.sprinkles.palette),
    "sprinkles.rotation": settings.sprinkles.rotation,
    "sprinkles.scale": settings.sprinkles.scale,
    "sprinkles.seed": settings.sprinkles.seed,
    "sprinkles.shape": String(settings.sprinkles.shape),
    "sprinkles.sizeVariation": settings.sprinkles.sizeVariation,
    "sprinkles.solidColor": settings.sprinkles.solidColor,
    "sprinkles.surfaceOffset": settings.sprinkles.surfaceOffset,
    "studio.cool.color": settings.studio.cool.color,
    "studio.cool.power": settings.studio.cool.power,
    "studio.cool.size": settings.studio.cool.size,
    "studio.environmentBlur": settings.studio.environmentBlur,
    "studio.environmentRotation": settings.studio.environmentRotation,
    "studio.environmentStrength": settings.studio.environmentStrength,
    "studio.hdriVisible": settings.studio.environmentBackdrop,
    "studio.key.color": settings.studio.key.color,
    "studio.key.power": settings.studio.key.power,
    "studio.key.size": settings.studio.key.size,
    "studio.shadowSoftness": settings.studio.shadowSoftness,
    "studio.shadowStrength": settings.studio.shadowStrength,
    "studio.shadowsEnabled": settings.studio.shadowsEnabled,
    "studio.warm.color": settings.studio.warm.color,
    "studio.warm.power": settings.studio.warm.power,
    "studio.warm.size": settings.studio.warm.size,
  });
}

const FACTORY_PRESET_VALUES = flattenDonutPresetValues(
  DONUT_FACTORY_DEFAULTS,
  true,
  DEFAULT_PRESET_ORIENTATION,
);
const APP_DEFAULT_PRESET_VALUES = flattenDonutPresetValues(
  DONUT_DEFAULTS,
  true,
  DEFAULT_PRESET_ORIENTATION,
);

function normalizePresetValues(
  candidate: Readonly<Record<string, unknown>>,
  fallback: Readonly<Record<string, DonutPresetValue>>,
): Readonly<Record<string, DonutPresetValue>> {
  const merged = { ...fallback, ...candidate };
  return flattenDonutPresetValues(
    readDonutSettings(merged),
    true,
    DEFAULT_PRESET_ORIENTATION,
  );
}

function factoryPreset(preset: DonutPreset): DonutPreset {
  return Object.freeze({
    id: preset.id,
    label: preset.label,
    values: normalizePresetValues(
      preset.values,
      preset.id === DONUT_PRESET_DEFAULT
        ? APP_DEFAULT_PRESET_VALUES
        : FACTORY_PRESET_VALUES,
    ),
  });
}

export const DONUT_FACTORY_PRESET_LIBRARY: DonutPresetLibrary = Object.freeze({
  format: DONUT_PRESET_LIBRARY_FORMAT,
  presets: Object.freeze(DONUT_PRESETS.map(factoryPreset)),
  version: DONUT_PRESET_LIBRARY_VERSION,
});

export function serializeDonutPresetLibrary(
  library: DonutPresetLibrary,
): string {
  return `${JSON.stringify(library, null, 2)}\n`;
}

export const DONUT_DEFAULT_PRESET_LIBRARY_JSON =
  serializeDonutPresetLibrary(DONUT_FACTORY_PRESET_LIBRARY);

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function findDonutLibraryPreset(
  library: DonutPresetLibrary,
  id: unknown,
): DonutPreset | null {
  if (typeof id !== "string") return null;
  return library.presets.find((preset) => preset.id === id) ?? null;
}

export function parseDonutPresetLibrary(
  source: unknown,
  fallback: DonutPresetLibrary = DONUT_FACTORY_PRESET_LIBRARY,
): DonutPresetLibraryParseResult {
  let parsed: unknown = source;
  if (typeof source === "string") {
    try {
      parsed = JSON.parse(source);
    } catch {
      return {
        code: "preset-json-invalid",
        message: "Preset JSON is not valid JSON.",
        ok: false,
      };
    }
  }
  if (
    !isRecord(parsed) ||
    parsed.format !== DONUT_PRESET_LIBRARY_FORMAT ||
    parsed.version !== DONUT_PRESET_LIBRARY_VERSION ||
    !Array.isArray(parsed.presets)
  ) {
    return {
      code: "preset-library-format-invalid",
      message:
        "Preset JSON must use the donut-studio-presets format version 1.",
      ok: false,
    };
  }

  const updates = new Map<string, Readonly<Record<string, unknown>>>();
  for (const entry of parsed.presets) {
    if (!isRecord(entry) || typeof entry.id !== "string") {
      return {
        code: "preset-entry-invalid",
        message: "Every preset entry must have an id and values object.",
        ok: false,
      };
    }
    if (!isRecord(entry.values)) {
      return {
        code: "preset-values-invalid",
        message: `Preset ${entry.id} must contain a values object.`,
        ok: false,
      };
    }
    if (updates.has(entry.id)) {
      return {
        code: "preset-id-duplicate",
        message: `Preset ${entry.id} appears more than once.`,
        ok: false,
      };
    }
    updates.set(entry.id, entry.values);
  }

  if (
    updates.size === 0 ||
    ![...updates.keys()].some((id) =>
      DONUT_PRESETS.some((preset) => preset.id === id),
    )
  ) {
    return {
      code: "preset-library-empty",
      message: "Preset JSON does not contain a known donut preset.",
      ok: false,
    };
  }

  const presets = DONUT_PRESETS.map((factory) => {
    const current =
      findDonutLibraryPreset(fallback, factory.id) ?? factoryPreset(factory);
    const update = updates.get(factory.id);
    return Object.freeze({
      id: factory.id,
      label: factory.label,
      values: update
        ? normalizePresetValues(update, current.values)
        : current.values,
    });
  });

  return {
    library: Object.freeze({
      format: DONUT_PRESET_LIBRARY_FORMAT,
      presets: Object.freeze(presets),
      version: DONUT_PRESET_LIBRARY_VERSION,
    }),
    ok: true,
  };
}

export function updateDonutPresetLibrary(
  library: DonutPresetLibrary,
  presetId: string,
  values: Readonly<Record<string, DonutPresetValue>>,
): DonutPresetLibrary {
  return Object.freeze({
    ...library,
    presets: Object.freeze(
      library.presets.map((preset) =>
        preset.id === presetId
          ? Object.freeze({
              ...preset,
              values: normalizePresetValues(values, preset.values),
            })
          : preset,
      ),
    ),
  });
}

export function resetDonutLibraryPreset(
  library: DonutPresetLibrary,
  presetId: string,
): DonutPresetLibrary {
  const factory = findDonutLibraryPreset(
    DONUT_FACTORY_PRESET_LIBRARY,
    presetId,
  );
  return factory
    ? Object.freeze({
        ...library,
        presets: Object.freeze(
          library.presets.map((preset) =>
            preset.id === presetId ? factory : preset,
          ),
        ),
      })
    : library;
}

export function readCurrentDonutPresetValues(
  state: DonutPresetState,
): Readonly<Record<string, DonutPresetValue>> {
  return normalizePresetValues(
    {
      ...state.values,
      "canvas.infinity": state.canvas.mode === "infinite",
    },
    APP_DEFAULT_PRESET_VALUES,
  );
}

export function shouldApplyDonutPresetOnInitialMount(
  presetId: unknown,
  currentValues: Readonly<Record<string, DonutPresetValue>>,
  storedValues: Readonly<Record<string, DonutPresetValue>> | undefined,
): boolean {
  if (presetId !== DONUT_PRESET_DEFAULT || !storedValues) return false;
  return Object.entries(storedValues).every(([target, storedValue]) => {
    if (target === "canvas.infinity") return true;
    return JSON.stringify(currentValues[target]) === JSON.stringify(storedValue);
  });
}

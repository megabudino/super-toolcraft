import type { ToolcraftState } from "@/toolcraft/runtime";

import { grassDefaults, type GrassHdriPreset } from "./grass-defaults";
import { getGrassHdriPresetSource, type GrassHdriSource } from "./grass-hdri";
import type { GrassSettings } from "./grass-settings-types";
import {
  booleanValue,
  boundedNumberValue,
  colorValue,
  stringValue,
} from "./grass-value-readers";

export function readGrassEnvironmentSource(
  state: ToolcraftState,
  preset: GrassHdriPreset,
): GrassHdriSource {
  const custom = [...(state.mediaAssets ?? [])]
    .reverse()
    .find(
      (asset) =>
        asset.assetKind === "file" &&
        asset.sourceTarget === "environment.hdriFile" &&
        /\.hdr$/iu.test(asset.fileName),
    );
  if (custom?.assetKind === "file") {
    return {
      cacheKey: `custom:${custom.id}:${custom.fileName}`,
      fileName: custom.fileName,
      kind: "custom",
      url: custom.dataUrl,
    };
  }
  return getGrassHdriPresetSource(preset);
}

export function readGrassSunPatchOffset(
  state: ToolcraftState,
): [number, number] {
  const value = state.values["environment.sunPatchOffset"];
  const fallback = grassDefaults["environment.sunPatchOffset"];
  const record =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Readonly<Record<string, unknown>>)
      : fallback;
  const x = Number(record.x);
  const y = Number(record.y);
  return [
    Math.max(-1, Math.min(1, Number.isFinite(x) ? x : Number(fallback.x))) * 8,
    Math.max(-1, Math.min(1, Number.isFinite(y) ? y : Number(fallback.y))) * 8,
  ];
}

export function readGrassEnvironmentSettings(
  state: ToolcraftState,
): GrassSettings["environment"] {
  const preset = stringValue(state, "environment.preset", [
    "meadow",
    "alps",
    "sunrise",
    "hardSun",
    "overcast",
    "forest",
    "golden",
    "blendSunset",
  ] satisfies readonly GrassHdriPreset[]);
  return {
    backgroundBlur:
      boundedNumberValue(state, "environment.backgroundBlur", 0, 100) / 100,
    exposure: boundedNumberValue(state, "environment.exposure", 50, 250) / 100,
    fillColor: colorValue(state, "environment.fillColor"),
    fillStrength:
      boundedNumberValue(state, "environment.fillStrength", 0, 200) / 100,
    highlightWarmth:
      boundedNumberValue(state, "environment.highlightWarmth", 0, 100) / 100,
    intensity:
      boundedNumberValue(state, "environment.intensity", 0, 250) / 100,
    keyColor: colorValue(state, "environment.keyColor"),
    keyStrength:
      boundedNumberValue(state, "environment.keyStrength", 0, 200) / 100,
    preset,
    rimColor: colorValue(state, "environment.rimColor"),
    rimStrength:
      boundedNumberValue(state, "environment.rimStrength", 0, 200) / 100,
    rotation: boundedNumberValue(state, "environment.rotation", 0, 360),
    rotationX: boundedNumberValue(state, "environment.rotationX", -180, 180),
    rotationZ: boundedNumberValue(state, "environment.rotationZ", -180, 180),
    sceneContrast:
      boundedNumberValue(state, "environment.sceneContrast", 50, 200) / 100,
    sceneSaturation:
      boundedNumberValue(state, "environment.sceneSaturation", 0, 200) / 100,
    shadowCoolness:
      boundedNumberValue(state, "environment.shadowCoolness", 0, 100) / 100,
    source: readGrassEnvironmentSource(state, preset),
    sunPatches: {
      coverage:
        boundedNumberValue(state, "environment.sunPatchCoverage", 0, 100) / 100,
      enabled: booleanValue(state, "environment.sunPatchEnabled"),
      offset: readGrassSunPatchOffset(state),
      scale: boundedNumberValue(state, "environment.sunPatchScale", 0.5, 8),
      seed: Math.round(
        boundedNumberValue(state, "environment.sunPatchSeed", 0, 100),
      ),
      softness:
        boundedNumberValue(state, "environment.sunPatchSoftness", 0, 100) / 100,
      strength:
        boundedNumberValue(state, "environment.sunPatchStrength", 0, 200) / 100,
    },
    visible: booleanValue(state, "environment.visible"),
  };
}

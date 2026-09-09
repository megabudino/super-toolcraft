import type { ToolcraftState } from "@/toolcraft/runtime";

import { grassDefaults } from "./grass-defaults";
import { readGrassGroundBlendMaskSettings } from "./grass-ground-blend-values";
import type { GrassSettings } from "./grass-settings-types";
import { readGrassTextureMaskSettings } from "./grass-texture-mask-settings";
import {
  booleanValue,
  boundedNumberValue,
  colorValue,
  numberValue,
  rangeValue,
} from "./grass-value-readers";

function readTerrainHeightLevels(state: ToolcraftState): [number, number] {
  const [low, high] = rangeValue(state, "terrain.heightLevels", 0, 100);
  return [low / 100, high / 100];
}

function readTerrainOffset(state: ToolcraftState): [number, number] {
  const value = state.values["terrain.noiseOffset"];
  if (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(Number(value[0])) &&
    Number.isFinite(Number(value[1]))
  ) {
    return [
      Math.max(-24, Math.min(24, Number(value[0]))),
      Math.max(-24, Math.min(24, Number(value[1]))),
    ];
  }
  return [...grassDefaults["terrain.noiseOffset"]];
}

export function readGrassGroundShadowSettings(
  state: ToolcraftState,
): GrassSettings["groundShadow"] {
  return {
    blur: boundedNumberValue(state, "groundShadow.blur", 0, 2),
    color: colorValue(state, "groundShadow.color"),
    offsetY: boundedNumberValue(state, "groundShadow.offsetY", -1.5, 0),
    offsetZ: boundedNumberValue(state, "groundShadow.offsetZ", -3, 3),
    scale: boundedNumberValue(state, "groundShadow.scale", 25, 200) / 100,
    strength: boundedNumberValue(state, "groundShadow.strength", 0, 100) / 100,
  };
}

export function readGrassSurfaceSettings(
  state: ToolcraftState,
): GrassSettings["surface"] {
  return {
    bend: {
      depth: boundedNumberValue(state, "surface.bendDepth", 0, 2.5),
      enabled: booleanValue(state, "surface.bendEnabled"),
      roundness:
        boundedNumberValue(state, "surface.bendRoundness", 0, 100) / 100,
      smoothness:
        boundedNumberValue(state, "surface.bendSmoothness", 0, 100) / 100,
      width: boundedNumberValue(state, "surface.bendWidth", 5, 40) / 100,
    },
    brightness: boundedNumberValue(state, "surface.brightness", 0, 300) / 100,
    clover: {
      color: colorValue(state, "surface.cloverColor"),
      normalStrength:
        boundedNumberValue(state, "surface.cloverNormalStrength", 0, 150) / 100,
      roughness:
        boundedNumberValue(state, "surface.cloverRoughness", 25, 125) / 100,
      textureScale: boundedNumberValue(
        state,
        "surface.cloverTextureScale",
        0.25,
        4,
      ),
    },
    cloverMask: readGrassGroundBlendMaskSettings(state),
    colorContrast:
      boundedNumberValue(state, "surface.colorContrast", 0, 200) / 100,
    colorSaturation:
      boundedNumberValue(state, "surface.colorSaturation", 0, 200) / 100,
    edgeFade: {
      strength:
        boundedNumberValue(state, "surface.edgeFadeStrength", 0, 100) / 100,
      width: boundedNumberValue(state, "surface.edgeFadeWidth", 0, 40) / 100,
    },
    normalStrength:
      boundedNumberValue(state, "surface.normalStrength", 0, 150) / 100,
    receiveShadows: booleanValue(state, "surface.receiveShadows"),
    roughness: boundedNumberValue(state, "surface.roughness", 25, 125) / 100,
    textureMask: readGrassTextureMaskSettings(state, "surface"),
    textureScale: boundedNumberValue(state, "surface.textureScale", 0.25, 4),
  };
}

export function readGrassTerrainSettings(
  state: ToolcraftState,
): GrassSettings["terrain"] {
  return {
    detail: Math.max(
      1,
      Math.min(6, Math.round(numberValue(state, "terrain.detail"))),
    ),
    heightLevels: readTerrainHeightLevels(state),
    maxHeight: boundedNumberValue(state, "terrain.maxHeight", 0, 3),
    noiseOffset: readTerrainOffset(state),
    noiseScale: Math.max(
      0.08,
      Math.min(1.4, numberValue(state, "terrain.noiseScale")),
    ),
    roughness: Math.max(
      0.1,
      Math.min(0.9, numberValue(state, "terrain.roughness") / 100),
    ),
    seed: Math.max(
      0,
      Math.min(100, Math.round(numberValue(state, "terrain.seed"))),
    ),
  };
}

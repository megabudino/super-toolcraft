import type { ToolcraftState } from "@/toolcraft/runtime";

import { grassDefaults } from "./grass-defaults";
import { readGrassDistributionSettings } from "./grass-distribution-values";
import { readGrassInstanceColors } from "./grass-instance-colors";
import type {
  GrassGradient,
  GrassGradientStop,
  GrassSettings,
} from "./grass-settings-types";
import { readGrassTextureMaskSettings } from "./grass-texture-mask-settings";
import {
  booleanValue,
  boundedNumberValue,
  colorValue,
  numberValue,
  rangeValue,
} from "./grass-value-readers";

function parseStopPosition(value: unknown, fallback: number): number {
  const parsed =
    typeof value === "string" ? Number.parseFloat(value) / 100 : Number(value);
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : fallback;
}

type GrassGradientTarget = "appearance.bladeGradient" | "lawn.bladeGradient";

function readBladeGradient(
  state: ToolcraftState,
  target: GrassGradientTarget = "appearance.bladeGradient",
): GrassGradient {
  const value = state.values[target];
  const fallback = grassDefaults[target];
  const gradient =
    typeof value === "object" && value !== null
      ? (value as { angle?: unknown; gradientType?: unknown; stops?: unknown })
      : fallback;
  const stops = "stops" in gradient ? gradient.stops : fallback.stops;
  const valid = Array.isArray(stops)
    ? stops.filter(
        (stop): stop is GrassGradientStop =>
          typeof stop === "object" &&
          stop !== null &&
          "color" in stop &&
          typeof stop.color === "string" &&
          /^#[0-9a-f]{6}$/i.test(stop.color),
      )
    : [];
  const fallbackStops = fallback.stops;
  const middleStop = valid.at(Math.floor((valid.length - 1) / 2));
  const rootStop = valid.at(0);
  const tipStop = valid.at(-1);
  const gradientType = gradient.gradientType;
  return {
    angle: Number.isFinite(Number(gradient.angle))
      ? Number(gradient.angle)
      : 90,
    colors: [
      rootStop?.color ?? fallbackStops[0].color,
      middleStop?.color ?? fallbackStops[1].color,
      tipStop?.color ?? fallbackStops[2].color,
    ],
    opacities: [
      Math.min(
        1,
        Math.max(
          0,
          Number(rootStop?.opacity ?? fallbackStops[0].opacity) / 100,
        ),
      ),
      Math.min(
        1,
        Math.max(
          0,
          Number(middleStop?.opacity ?? fallbackStops[1].opacity) / 100,
        ),
      ),
      Math.min(
        1,
        Math.max(0, Number(tipStop?.opacity ?? fallbackStops[2].opacity) / 100),
      ),
    ],
    positions: [
      parseStopPosition(rootStop?.position, 0),
      parseStopPosition(middleStop?.position, 0.58),
      parseStopPosition(tipStop?.position, 1),
    ],
    type:
      gradientType === "radial" ||
      gradientType === "angular" ||
      gradientType === "diamond"
        ? gradientType
        : "linear",
  };
}

export function readGrassAppearanceSettings(
  state: ToolcraftState,
): GrassSettings["appearance"] {
  const bladeGradient = readBladeGradient(state);
  return {
    bladeColors: bladeGradient.colors,
    bladeGradient,
    colorVariation:
      boundedNumberValue(state, "appearance.colorVariation", 0, 100) / 100,
    colorContrast:
      boundedNumberValue(state, "appearance.colorContrast", 0, 200) / 100,
    colorSaturation:
      boundedNumberValue(state, "appearance.colorSaturation", 0, 200) / 100,
    groundColor: colorValue(state, "appearance.groundColor"),
    instanceColors: readGrassInstanceColors(state, "appearance"),
    pbrRoughness:
      boundedNumberValue(state, "appearance.pbrRoughness", 5, 100) / 100,
    pbrSheen:
      boundedNumberValue(state, "appearance.pbrSheen", 0, 100) / 100,
    textureMask: readGrassTextureMaskSettings(state, "appearance"),
  };
}

export function readGrassBladeSettings(
  state: ToolcraftState,
): GrassSettings["blade"] {
  const [heightMin, heightMax] = rangeValue(
    state,
    "blade.heightRange",
    0.2,
    2.4,
  );
  return {
    curveResolution: Math.round(numberValue(state, "blade.curveResolution")),
    heightMax,
    heightMin,
    taperEnd: numberValue(state, "blade.taperEnd") / 100,
    thickness: numberValue(state, "blade.thickness"),
    tilt2d: (numberValue(state, "blade.tilt2d") * Math.PI) / 180,
    use3d: booleanValue(state, "blade.use3d"),
  };
}

export function readGrassLawnSettings(
  state: ToolcraftState,
): GrassSettings["lawn"] {
  const [heightMin, heightMax] = rangeValue(
    state,
    "lawn.heightRange",
    0.03,
    0.55,
  );
  const bladeGradient = readBladeGradient(state, "lawn.bladeGradient");
  return {
    bladeColors: bladeGradient.colors,
    bladeGradient,
    colorVariation:
      boundedNumberValue(state, "lawn.colorVariation", 0, 100) / 100,
    colorContrast:
      boundedNumberValue(state, "lawn.colorContrast", 0, 200) / 100,
    colorSaturation:
      boundedNumberValue(state, "lawn.colorSaturation", 0, 200) / 100,
    curveResolution: Math.round(numberValue(state, "lawn.curveResolution")),
    densityMax: Math.round(numberValue(state, "lawn.densityMax")),
    depthOffset: numberValue(state, "lawn.depthOffset"),
    distanceMin: numberValue(state, "lawn.distanceMin"),
    distribution: readGrassDistributionSettings(state, "lawn"),
    enabled: booleanValue(state, "lawn.enabled"),
    heightMax,
    heightMin,
    instanceColors: readGrassInstanceColors(state, "lawn"),
    pbrRoughness:
      boundedNumberValue(state, "lawn.pbrRoughness", 5, 100) / 100,
    pbrSheen: boundedNumberValue(state, "lawn.pbrSheen", 0, 100) / 100,
    seed: Math.round(numberValue(state, "lawn.seed")),
    taperEnd: numberValue(state, "lawn.taperEnd") / 100,
    thickness: numberValue(state, "lawn.thickness"),
    tilt2d: (numberValue(state, "lawn.tilt2d") * Math.PI) / 180,
    textureMask: readGrassTextureMaskSettings(state, "lawn"),
    use3d: booleanValue(state, "lawn.use3d"),
  };
}

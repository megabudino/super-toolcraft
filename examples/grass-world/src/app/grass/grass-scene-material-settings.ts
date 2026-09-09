import type { GrassLayerMaterialSettings } from "./grass-material";
import type { GrassSettings } from "./grass-values";
import {
  GRASS_LAWN_WIND_RESPONSE,
  type GrassWindFrameSettings,
} from "./grass-wind";

export type GrassSceneLightingSample = Readonly<{
  contrast: number;
  direction: readonly [number, number];
  tint: readonly [number, number, number];
}>;

export function createGrassSceneLayerMaterialSettings(
  input: Readonly<{
    layer: "lawn" | "tall";
    lighting: GrassSceneLightingSample;
    settings: GrassSettings;
    wind: GrassWindFrameSettings;
  }>,
): GrassLayerMaterialSettings {
  const { settings } = input;
  const isLawn = input.layer === "lawn";
  const appearance = isLawn ? settings.lawn : settings.appearance;
  return {
    alignToNormals: isLawn ? 1 : settings.field.alignToNormals,
    colorContrast: appearance.colorContrast,
    colorSaturation: appearance.colorSaturation,
    colorVariation: appearance.colorVariation,
    depthOffset: isLawn
      ? settings.lawn.depthOffset
      : settings.grass.depthOffset,
    environmentContrast: input.lighting.contrast,
    environmentDirection: input.lighting.direction,
    environmentIntensity: settings.environment.intensity,
    environmentTint: input.lighting.tint,
    gradient: appearance.bladeGradient,
    highlightWarmth: settings.environment.highlightWarmth,
    pbrRoughness: appearance.pbrRoughness,
    pbrSheen: appearance.pbrSheen,
    instanceColors: appearance.instanceColors,
    instanceColorSeed: isLawn ? settings.lawn.seed : settings.field.seed,
    randomRotation: isLawn ? 1 : settings.field.randomRotation,
    restBendScale: isLawn ? 0.28 : 0.78,
    sceneContrast: settings.environment.sceneContrast,
    sceneSaturation: settings.environment.sceneSaturation,
    shadowCoolness: settings.environment.shadowCoolness,
    taper: isLawn ? settings.lawn.taperEnd : settings.blade.taperEnd,
    textureMask: appearance.textureMask,
    thickness: isLawn ? settings.lawn.thickness : settings.blade.thickness,
    tilt: isLawn ? settings.lawn.tilt2d : settings.blade.tilt2d,
    wind: input.wind,
    windResponse: isLawn ? GRASS_LAWN_WIND_RESPONSE : 1,
  };
}

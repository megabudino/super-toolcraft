import type { ToolcraftOrientationPose } from "@/toolcraft/runtime/react";

import type {
  GrassHdriPreset,
  GrassImageFormat,
  GrassImageResolution,
  GrassVideoFormat,
  GrassVideoResolution,
  GrassWindMode,
} from "./grass-defaults";
import type { GrassHdriSource } from "./grass-hdri";
import type { GrassDistributionNoiseSettings } from "./grass-distribution-noise";
import type { GrassInstanceColors } from "./grass-instance-colors";
import type { GrassScanLayerKind } from "./grass-scan-contract";
import type { GrassTextureMaskSettings } from "./grass-texture-mask-settings";

export type GrassGradientStop = Readonly<{
  color: string;
  opacity: number;
  position: string;
}>;

export type GrassGradient = Readonly<{
  angle: number;
  colors: readonly [string, string, string];
  opacities: readonly [number, number, number];
  positions: readonly [number, number, number];
  type: "angular" | "diamond" | "linear" | "radial";
}>;

export type GrassValueNoiseMaskSettings = Readonly<{
  detail: number;
  levels: readonly [number, number];
  offset: readonly [number, number];
  roughness: number;
  scale: number;
  seed: number;
}>;

export type GrassScanLayerSettings = Readonly<{
  clumping: number;
  colorContrast: number;
  colorSaturation: number;
  count: number;
  enabled: boolean;
  pbrAoStrength: number;
  pbrBacklight: number;
  pbrBrightness: number;
  pbrNormalStrength: number;
  pbrRoughness: number;
  pbrSheen: number;
  pbrTint: string;
  shadowColor: string;
  seed: number;
  sizeMax: number;
  sizeMin: number;
  surfaceOffset: number;
  textureMask: GrassTextureMaskSettings;
}>;

export type GrassBoulderSettings = Readonly<{
  colorContrast: number;
  colorSaturation: number;
  enabled: boolean;
  pbrAoStrength: number;
  pbrBrightness: number;
  pbrNormalStrength: number;
  pbrRoughness: number;
  pbrTint: string;
  shadowColor: string;
  seed: number;
  size: number;
  surfaceOffset: number;
  textureMask: GrassTextureMaskSettings;
}>;

export type GrassSettings = Readonly<{
  appearance: Readonly<{
    bladeColors: readonly [string, string, string];
    bladeGradient: GrassGradient;
    colorVariation: number;
    colorContrast: number;
    colorSaturation: number;
    groundColor: string;
    instanceColors: GrassInstanceColors;
    pbrRoughness: number;
    pbrSheen: number;
    textureMask: GrassTextureMaskSettings;
  }>;
  blade: Readonly<{
    curveResolution: number;
    heightMax: number;
    heightMin: number;
    taperEnd: number;
    thickness: number;
    tilt2d: number;
    use3d: boolean;
  }>;
  butterflies: Readonly<{
    count: number;
    enabled: boolean;
    flightCycles: number;
    heightMax: number;
    heightMin: number;
    landingTime: number;
    seed: number;
    sizeMax: number;
    sizeMin: number;
    wingCycles: number;
  }>;
  export: Readonly<{
    imageFormat: GrassImageFormat;
    imageResolution: GrassImageResolution;
    includeBackground: boolean;
    videoFormat: GrassVideoFormat;
    videoResolution: GrassVideoResolution;
  }>;
  environment: Readonly<{
    backgroundBlur: number;
    exposure: number;
    fillColor: string;
    fillStrength: number;
    highlightWarmth: number;
    intensity: number;
    keyColor: string;
    keyStrength: number;
    preset: GrassHdriPreset;
    rimColor: string;
    rimStrength: number;
    sceneContrast: number;
    sceneSaturation: number;
    shadowCoolness: number;
    rotation: number;
    rotationX: number;
    rotationZ: number;
    sunPatches: Readonly<{
      coverage: number;
      enabled: boolean;
      offset: readonly [number, number];
      scale: number;
      seed: number;
      softness: number;
      strength: number;
    }>;
    visible: boolean;
    source: GrassHdriSource;
  }>;
  field: Readonly<{
    alignToNormals: number;
    densityMax: number;
    depth: number;
    distanceMin: number;
    distribution: GrassDistributionNoiseSettings;
    edgeIrregularity: number;
    randomRotation: number;
    seed: number;
    showGround: boolean;
    shapeRoundness: number;
    topFacingCoverage: number;
    topFacingFade: number;
    topFacingOnly: boolean;
    width: number;
  }>;
  grass: Readonly<{ depthOffset: number; enabled: boolean }>;
  groundShadow: Readonly<{
    blur: number;
    color: string;
    offsetY: number;
    offsetZ: number;
    scale: number;
    strength: number;
  }>;
  lawn: Readonly<{
    bladeColors: readonly [string, string, string];
    bladeGradient: GrassGradient;
    colorVariation: number;
    colorContrast: number;
    colorSaturation: number;
    curveResolution: number;
    densityMax: number;
    depthOffset: number;
    distanceMin: number;
    distribution: GrassDistributionNoiseSettings;
    enabled: boolean;
    heightMax: number;
    heightMin: number;
    instanceColors: GrassInstanceColors;
    pbrRoughness: number;
    pbrSheen: number;
    seed: number;
    taperEnd: number;
    thickness: number;
    tilt2d: number;
    textureMask: GrassTextureMaskSettings;
    use3d: boolean;
  }>;
  preview: Readonly<{
    bladeCount: number;
    lawnBladeCount: number;
  }>;
  scene: Readonly<{ background: string }>;
  scans: Readonly<
    Record<GrassScanLayerKind, GrassScanLayerSettings> & {
      boulder: GrassBoulderSettings;
    }
  >;
  surface: Readonly<{
    bend: Readonly<{
      depth: number;
      enabled: boolean;
      roundness: number;
      smoothness: number;
      width: number;
    }>;
    brightness: number;
    clover: Readonly<{
      color: string;
      normalStrength: number;
      roughness: number;
      textureScale: number;
    }>;
    cloverMask: GrassValueNoiseMaskSettings;
    colorContrast: number;
    colorSaturation: number;
    edgeFade: Readonly<{
      strength: number;
      width: number;
    }>;
    normalStrength: number;
    receiveShadows: boolean;
    roughness: number;
    textureMask: GrassTextureMaskSettings;
    textureScale: number;
  }>;
  terrain: Readonly<{
    detail: number;
    heightLevels: readonly [number, number];
    maxHeight: number;
    noiseOffset: readonly [number, number];
    noiseScale: number;
    roughness: number;
    seed: number;
  }>;
  view: Readonly<{ orientation: ToolcraftOrientationPose }>;
  wind: Readonly<{
    audioVolume: number;
    directionAngle: number;
    directionResponse: number;
    flow: number;
    gustCycles: number;
    gustWidth: number;
    mode: GrassWindMode;
    noiseDetail: number;
    noiseScale: number;
    noiseStrength: number;
    rampUp: number;
    release: number;
    seed: number;
    strength: number;
    surfaceTiltDown: number;
    surfaceTiltLeft: number;
    surfaceTiltRight: number;
    surfaceTiltSmoothing: number;
    surfaceTiltUp: number;
    swayCycles: number;
    swayStrength: number;
    swayVariation: number;
  }>;
}>;

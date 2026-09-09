export type DonutIcingClearMode = "base" | "detail" | "none";
export type DonutSprinkleShape = 1 | 2 | 3;
export type DonutSprinklePalette = 1 | 2 | 3 | 4 | 5;
export type DonutImageResolution = "2k" | "4k" | "8k";
export type DonutImageFormat = "jpg" | "png";

export type DonutLightSettings = Readonly<{
  color: string;
  power: number;
  size: number;
}>;

export type DonutSettings = Readonly<{
  background: Readonly<{
    color: string;
    include: boolean;
  }>;
  donut: Readonly<{
    height: number;
    majorRadius: number;
    organic: number;
    thickness: number;
  }>;
  icing: Readonly<{
    clearMode: DonutIcingClearMode;
    color: string;
    coverage: number;
    detail: number;
    dripAmount: number;
    dripFrequency: number;
    enabled: boolean;
    flow: number;
    thickness: number;
  }>;
  image: Readonly<{
    format: DonutImageFormat;
    resolution: DonutImageResolution;
  }>;
  materials: Readonly<{
    donut: Readonly<{
      bake: number;
      coat: number;
      color: string;
      moisture: number;
      pores: number;
      roughness: number;
      sheen: number;
      softness: number;
      subsurface: number;
      variation: number;
    }>;
    icing: Readonly<{
      coat: number;
      glaze: number;
      roughness: number;
      sheen: number;
      subsurface: number;
      texture: number;
    }>;
    plate: Readonly<{
      coat: number;
      color: string;
      roughness: number;
    }>;
    sprinkle: Readonly<{
      coat: number;
      roughness: number;
    }>;
  }>;
  plateVisible: boolean;
  renderScale: number;
  sprinkles: Readonly<{
    clear: boolean;
    coverage: number;
    flow: number;
    metallic: number;
    palette: DonutSprinklePalette;
    rotation: number;
    scale: number;
    seed: number;
    shape: DonutSprinkleShape;
    sizeVariation: number;
    solidColor: string;
    surfaceOffset: number;
  }>;
  studio: Readonly<{
    cool: DonutLightSettings;
    environmentBackdrop: boolean;
    environmentBlur: number;
    environmentRotation: number;
    environmentStrength: number;
    key: DonutLightSettings;
    shadowSoftness: number;
    shadowStrength: number;
    shadowsEnabled: boolean;
    warm: DonutLightSettings;
  }>;
}>;

export type DonutSprinkleInstance = Readonly<{
  color: string;
  index: number;
  normal: readonly [number, number, number];
  position: readonly [number, number, number];
  quaternion: readonly [number, number, number, number];
  scale: readonly [number, number, number];
  surfacePosition: readonly [number, number, number];
}>;

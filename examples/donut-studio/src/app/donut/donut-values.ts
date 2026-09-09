import {
  DONUT_LIGHTS,
  DONUT_MATERIALS,
  DONUT_WORLD,
} from "./donut-reference";
import type {
  DonutIcingClearMode,
  DonutImageFormat,
  DonutImageResolution,
  DonutLightSettings,
  DonutSettings,
  DonutSprinklePalette,
  DonutSprinkleShape,
} from "./donut-types";

type ToolcraftValues = Readonly<Record<string, unknown>>;

function linearChannelToSrgb(channel: number): number {
  const bounded = Math.max(0, Math.min(1, channel));
  const value =
    bounded <= 0.0031308
      ? bounded * 12.92
      : 1.055 * bounded ** (1 / 2.4) - 0.055;
  return Math.round(value * 255);
}

export function linearRgbToHex(
  color: readonly [number, number, number] | readonly number[],
): string {
  return `#${color
    .slice(0, 3)
    .map((channel) => linearChannelToSrgb(Number(channel)))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function normalizeHex(value: unknown, fallback: string): string {
  const candidate =
    typeof value === "object" &&
    value !== null &&
    "hex" in value &&
    typeof value.hex === "string"
      ? value.hex
      : value;
  const match =
    typeof candidate === "string"
      ? candidate.trim().match(/^#?([\da-f]{6})$/i)
      : null;
  return match ? `#${match[1]?.toUpperCase()}` : fallback;
}

function finiteNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value: unknown, fallback: number, min: number, max: number) {
  return Math.max(min, Math.min(max, finiteNumber(value, fallback)));
}

function numeric(
  values: ToolcraftValues,
  target: string,
  fallback: number,
  min: number,
  max: number,
): number {
  return clamp(values[target], fallback, min, max);
}

function color(
  values: ToolcraftValues,
  target: string,
  fallback: string,
): string {
  return normalizeHex(values[target], fallback);
}

function boolean(
  values: ToolcraftValues,
  target: string,
  fallback: boolean,
): boolean {
  return typeof values[target] === "boolean" ? values[target] : fallback;
}

function readShape(
  value: unknown,
  fallback: DonutSprinkleShape,
): DonutSprinkleShape {
  if (value === "pellet") return 1;
  if (value === "pearl") return 2;
  if (value === "rod") return 3;
  const numericValue = Number(value);
  return numericValue === 1 || numericValue === 2 || numericValue === 3
    ? numericValue
    : fallback;
}

function readPalette(
  value: unknown,
  fallback: DonutSprinklePalette,
): DonutSprinklePalette {
  const numericValue = Number(value);
  return numericValue === 1 ||
    numericValue === 2 ||
    numericValue === 3 ||
    numericValue === 4 ||
    numericValue === 5
    ? numericValue
    : fallback;
}

function readClearMode(value: unknown): DonutIcingClearMode {
  return value === "base" || value === "detail" ? value : "none";
}

function readImageResolution(value: unknown): DonutImageResolution {
  return value === "2k" || value === "8k" ? value : "4k";
}

function readImageFormat(value: unknown): DonutImageFormat {
  return value === "jpg" ? "jpg" : "png";
}

function readLight(
  values: ToolcraftValues,
  prefix: string,
  defaults: DonutLightSettings,
  maxPower: number,
): DonutLightSettings {
  return {
    color: color(values, `${prefix}.color`, defaults.color),
    power: numeric(values, `${prefix}.power`, defaults.power, 0, maxPower),
    size: numeric(values, `${prefix}.size`, defaults.size, 0.25, 12),
  };
}

export const DONUT_FACTORY_DEFAULTS = Object.freeze({
  background: { color: DONUT_WORLD.background, include: true },
  donut: { height: 1, majorRadius: 1, organic: 1, thickness: 1 },
  icing: {
    clearMode: "none",
    color: linearRgbToHex([0.86699069, 0.62104517, 0]),
    coverage: 1,
    detail: 1,
    dripAmount: 1,
    dripFrequency: 1,
    enabled: true,
    flow: 1,
    thickness: 1,
  },
  image: { format: "png", resolution: "4k" },
  materials: {
    donut: {
      bake: 0.65,
      coat: DONUT_MATERIALS.donut.coat,
      color: DONUT_MATERIALS.donut.color,
      moisture: 0.22,
      pores: 0.65,
      roughness: DONUT_MATERIALS.donut.roughness,
      sheen: DONUT_MATERIALS.donut.sheen,
      softness: DONUT_MATERIALS.donut.softness,
      subsurface: DONUT_MATERIALS.donut.subsurface,
      variation: 0.55,
    },
    icing: {
      coat: DONUT_MATERIALS.icing.coat,
      glaze: 0.45,
      roughness: DONUT_MATERIALS.icing.roughness,
      sheen: DONUT_MATERIALS.icing.sheen,
      subsurface: DONUT_MATERIALS.icing.subsurface,
      texture: 0.5,
    },
    plate: {
      coat: DONUT_MATERIALS.plate.coat,
      color: DONUT_MATERIALS.plate.color,
      roughness: DONUT_MATERIALS.plate.roughness,
    },
    sprinkle: {
      coat: DONUT_MATERIALS.sprinkle.coat,
      roughness: DONUT_MATERIALS.sprinkle.roughness,
    },
  },
  plateVisible: true,
  renderScale: 1,
  sprinkles: {
    clear: false,
    coverage: 1,
    flow: 1,
    metallic: 0,
    palette: 4,
    rotation: 1,
    scale: 0.5,
    seed: 417,
    shape: 3,
    sizeVariation: 1,
    solidColor: linearRgbToHex([0.02099699, 0.87032992, 0.41709954]),
    surfaceOffset: 0.02,
  },
  studio: {
    cool: {
      color: DONUT_LIGHTS[2].color,
      power: DONUT_LIGHTS[2].energy,
      size: DONUT_LIGHTS[2].size,
    },
    environmentBackdrop: false,
    environmentBlur: 0.35,
    environmentRotation: 330,
    environmentStrength: DONUT_WORLD.environmentStrength,
    key: {
      color: DONUT_LIGHTS[0].color,
      power: DONUT_LIGHTS[0].energy,
      size: DONUT_LIGHTS[0].size,
    },
    shadowSoftness: 2,
    shadowStrength: 0.8,
    shadowsEnabled: true,
    warm: {
      color: DONUT_LIGHTS[1].color,
      power: DONUT_LIGHTS[1].energy,
      size: DONUT_LIGHTS[1].size,
    },
  },
} satisfies DonutSettings);

export const DONUT_DEFAULTS = Object.freeze({
  ...DONUT_FACTORY_DEFAULTS,
  background: { color: "#C8B1BD", include: true },
  donut: {
    height: 1,
    majorRadius: 1,
    organic: 1,
    thickness: 1,
  },
  icing: {
    clearMode: "none",
    color: "#F26D9C",
    coverage: 1.05,
    detail: 1,
    dripAmount: 1,
    dripFrequency: 1,
    enabled: true,
    flow: 1,
    thickness: 1,
  },
  image: { format: "png", resolution: "4k" },
  materials: {
    donut: {
      bake: 0.65,
      coat: 0.12,
      color: "#9C6235",
      moisture: 0.22,
      pores: 0.65,
      roughness: 0.58,
      sheen: 0.15,
      softness: 0.08,
      subsurface: 0.28,
      variation: 0.55,
    },
    icing: {
      coat: 0.3,
      glaze: 0.55,
      roughness: 0.5,
      sheen: 0.15,
      subsurface: 0.35,
      texture: 0.4,
    },
    plate: {
      coat: 0.34,
      color: "#F1EEE7",
      roughness: 0.19454545,
    },
    sprinkle: {
      coat: 0.16,
      roughness: 0.31,
    },
  },
  plateVisible: true,
  renderScale: 2,
  sprinkles: {
    clear: false,
    coverage: 1,
    flow: 1.25,
    metallic: 0,
    palette: 4,
    rotation: 1,
    scale: 0.5,
    seed: 87,
    shape: 3,
    sizeVariation: 1.09,
    solidColor: "#F6E7C8",
    surfaceOffset: 0,
  },
  studio: {
    cool: {
      color: "#B7D2F2",
      power: 0,
      size: 4.70047,
    },
    environmentBackdrop: false,
    environmentBlur: 0.35,
    environmentRotation: 330,
    environmentStrength: 0.45,
    key: {
      color: "#FFFFFF",
      power: 1680,
      size: 4.131158,
    },
    shadowSoftness: 2,
    shadowStrength: 0.8,
    shadowsEnabled: true,
    warm: {
      color: "#FFDCAE",
      power: 230,
      size: 0.25,
    },
  },
} satisfies DonutSettings);

export function readDonutSettings(values: ToolcraftValues): DonutSettings {
  const defaults = DONUT_DEFAULTS;
  return {
    background: {
      color: color(values, "appearance.background", defaults.background.color),
      include: boolean(
        values,
        "export.includeBackground",
        defaults.background.include,
      ),
    },
    donut: {
      height: numeric(values, "donut.height", defaults.donut.height, 0.65, 1.35),
      majorRadius: numeric(
        values,
        "donut.majorRadius",
        defaults.donut.majorRadius,
        0.78,
        1.28,
      ),
      organic: numeric(values, "donut.organic", defaults.donut.organic, 0, 2),
      thickness: numeric(
        values,
        "donut.thickness",
        defaults.donut.thickness,
        0.65,
        1.35,
      ),
    },
    icing: {
      clearMode: readClearMode(values["icing.clearMode"]),
      color: color(values, "icing.color", defaults.icing.color),
      coverage: numeric(
        values,
        "icing.coverage",
        defaults.icing.coverage,
        0.55,
        1.25,
      ),
      detail: numeric(values, "icing.detail", defaults.icing.detail, 0, 2),
      dripAmount: numeric(
        values,
        "icing.dripAmount",
        defaults.icing.dripAmount,
        0,
        2,
      ),
      dripFrequency: numeric(
        values,
        "icing.dripFrequency",
        defaults.icing.dripFrequency,
        0.5,
        2,
      ),
      enabled: boolean(values, "icing.enabled", defaults.icing.enabled),
      flow: numeric(values, "icing.flow", defaults.icing.flow, 0, 2),
      thickness: numeric(
        values,
        "icing.thickness",
        defaults.icing.thickness,
        0.55,
        1.45,
      ),
    },
    image: {
      format: readImageFormat(values["export.image.format"]),
      resolution: readImageResolution(values["export.image.resolution"]),
    },
    materials: {
      donut: {
        bake: numeric(
          values,
          "material.donut.bake",
          defaults.materials.donut.bake,
          0,
          1,
        ),
        coat: numeric(
          values,
          "material.donut.coat",
          defaults.materials.donut.coat,
          0,
          1,
        ),
        color: color(
          values,
          "material.donut.color",
          defaults.materials.donut.color,
        ),
        moisture: numeric(
          values,
          "material.donut.moisture",
          defaults.materials.donut.moisture,
          0,
          1,
        ),
        pores: numeric(
          values,
          "material.donut.pores",
          defaults.materials.donut.pores,
          0,
          1,
        ),
        roughness: numeric(
          values,
          "material.donut.roughness",
          defaults.materials.donut.roughness,
          0.05,
          1,
        ),
        sheen: numeric(
          values,
          "material.donut.sheen",
          defaults.materials.donut.sheen,
          0,
          1,
        ),
        softness: numeric(
          values,
          "material.donut.softness",
          defaults.materials.donut.softness,
          0,
          0.5,
        ),
        subsurface: numeric(
          values,
          "material.donut.subsurface",
          defaults.materials.donut.subsurface,
          0,
          1,
        ),
        variation: numeric(
          values,
          "material.donut.variation",
          defaults.materials.donut.variation,
          0,
          1,
        ),
      },
      icing: {
        coat: numeric(
          values,
          "material.icing.coat",
          defaults.materials.icing.coat,
          0,
          1,
        ),
        glaze: numeric(
          values,
          "material.icing.glaze",
          defaults.materials.icing.glaze,
          0,
          1,
        ),
        roughness: numeric(
          values,
          "material.icing.roughness",
          defaults.materials.icing.roughness,
          0.05,
          1,
        ),
        sheen: numeric(
          values,
          "material.icing.sheen",
          defaults.materials.icing.sheen,
          0,
          1,
        ),
        subsurface: numeric(
          values,
          "material.icing.subsurface",
          defaults.materials.icing.subsurface,
          0,
          1,
        ),
        texture: numeric(
          values,
          "material.icing.texture",
          defaults.materials.icing.texture,
          0,
          1,
        ),
      },
      plate: {
        coat: numeric(
          values,
          "material.plate.coat",
          defaults.materials.plate.coat,
          0,
          1,
        ),
        color: color(
          values,
          "material.plate.color",
          defaults.materials.plate.color,
        ),
        roughness: numeric(
          values,
          "material.plate.roughness",
          defaults.materials.plate.roughness,
          0.05,
          1,
        ),
      },
      sprinkle: {
        coat: numeric(
          values,
          "material.sprinkle.coat",
          defaults.materials.sprinkle.coat,
          0,
          1,
        ),
        roughness: numeric(
          values,
          "material.sprinkle.roughness",
          defaults.materials.sprinkle.roughness,
          0.05,
          1,
        ),
      },
    },
    plateVisible: boolean(
      values,
      "scene.plateVisible",
      defaults.plateVisible,
    ),
    renderScale: numeric(
      values,
      "canvas.renderScale",
      defaults.renderScale,
      1,
      2,
    ),
    sprinkles: {
      clear: boolean(values, "sprinkles.clear", defaults.sprinkles.clear),
      coverage: numeric(
        values,
        "sprinkles.coverage",
        defaults.sprinkles.coverage,
        0.25,
        1,
      ),
      flow: numeric(values, "sprinkles.flow", defaults.sprinkles.flow, 0, 2),
      metallic: numeric(
        values,
        "sprinkles.metallic",
        defaults.sprinkles.metallic,
        0,
        1,
      ),
      palette: readPalette(
        values["sprinkles.palette"],
        defaults.sprinkles.palette,
      ),
      rotation: numeric(
        values,
        "sprinkles.rotation",
        defaults.sprinkles.rotation,
        0,
        2,
      ),
      scale: numeric(
        values,
        "sprinkles.scale",
        defaults.sprinkles.scale,
        0.2,
        1.5,
      ),
      seed: Math.round(
        numeric(values, "sprinkles.seed", defaults.sprinkles.seed, 0, 999),
      ),
      shape: readShape(values["sprinkles.shape"], defaults.sprinkles.shape),
      sizeVariation: numeric(
        values,
        "sprinkles.sizeVariation",
        defaults.sprinkles.sizeVariation,
        0,
        2,
      ),
      solidColor: color(
        values,
        "sprinkles.solidColor",
        defaults.sprinkles.solidColor,
      ),
      surfaceOffset: numeric(
        values,
        "sprinkles.surfaceOffset",
        defaults.sprinkles.surfaceOffset,
        -0.15,
        0.15,
      ),
    },
    studio: {
      cool: readLight(values, "studio.cool", defaults.studio.cool, 2000),
      environmentBackdrop: boolean(
        values,
        "studio.hdriVisible",
        defaults.studio.environmentBackdrop,
      ),
      environmentBlur: numeric(
        values,
        "studio.environmentBlur",
        defaults.studio.environmentBlur,
        0,
        1,
      ),
      environmentRotation: numeric(
        values,
        "studio.environmentRotation",
        defaults.studio.environmentRotation,
        0,
        360,
      ),
      environmentStrength: numeric(
        values,
        "studio.environmentStrength",
        defaults.studio.environmentStrength,
        0,
        2,
      ),
      key: readLight(values, "studio.key", defaults.studio.key, 6000),
      shadowSoftness: numeric(
        values,
        "studio.shadowSoftness",
        defaults.studio.shadowSoftness,
        0,
        8,
      ),
      shadowStrength: numeric(
        values,
        "studio.shadowStrength",
        defaults.studio.shadowStrength,
        0,
        1,
      ),
      shadowsEnabled: boolean(
        values,
        "studio.shadowsEnabled",
        defaults.studio.shadowsEnabled,
      ),
      warm: readLight(values, "studio.warm", defaults.studio.warm, 2500),
    },
  };
}

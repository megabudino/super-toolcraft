import type { ToolcraftMediaAsset } from "@/toolcraft/runtime";

export const fineDetailsTrailTargets = {
  borderColor: "trail.border.color",
  borderEnabled: "trail.border.enabled",
  borderWidth: "trail.border.width",
  cardRadius: "trail.cardRadius",
  cardSize: "trail.cardSize",
  enabled: "trail.enabled",
  fadeIn: "trail.fadeIn",
  fadeOut: "trail.fadeOut",
  images: "trail.images",
  length: "trail.length",
  lifetime: "trail.lifetime",
  resumeDelay: "trail.resumeDelay",
  resumeRamp: "trail.resumeRamp",
  shadowBlur: "trail.shadow.blur",
  shadowColorOpacity: "trail.shadow.colorOpacity",
  shadowEnabled: "trail.shadow.enabled",
  shadowOffset: "trail.shadow.offset",
  shadowSpread: "trail.shadow.spread",
  sizeFalloff: "trail.sizeFalloff",
  smoothness: "trail.smoothness",
  spacing: "trail.spacing",
  tilt: "trail.tilt",
} as const;

export type FineDetailsTrailImageTransform = Readonly<{
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotationDeg: 0 | 90 | 180 | 270;
}>;

export type FineDetailsTrailImage = Readonly<{
  height: number;
  id: string;
  ref: string;
  transform: FineDetailsTrailImageTransform;
  width: number;
}>;

export type FineDetailsTrailSettings = Readonly<{
  border: Readonly<{
    color: string;
    enabled: boolean;
    width: number;
  }>;
  cardRadius: number;
  cardSize: number;
  enabled: boolean;
  fadeIn: number;
  fadeOut: number;
  images: readonly FineDetailsTrailImage[];
  length: number;
  lifetime: number;
  resumeDelay: number;
  resumeRamp: number;
  shadow: Readonly<{
    blur: number;
    colorOpacity: Readonly<{ hex: string; opacity: number }>;
    enabled: boolean;
    offset: Readonly<{ x: number; y: number }>;
    spread: number;
  }>;
  sizeFalloff: number;
  smoothness: number;
  spacing: number;
  tilt: number;
}>;

export const FINE_DETAILS_TRAIL_DEFAULTS: FineDetailsTrailSettings = {
  border: { color: "#FFFFFF", enabled: true, width: 2 },
  cardRadius: 14,
  cardSize: 180,
  enabled: true,
  fadeIn: 150,
  fadeOut: 200,
  images: [],
  length: 8,
  lifetime: 600,
  resumeDelay: 300,
  resumeRamp: 500,
  shadow: {
    blur: 40,
    colorOpacity: { hex: "#000000", opacity: 35 },
    enabled: true,
    offset: { x: 0, y: 0.125 },
    spread: 0,
  },
  sizeFalloff: 8,
  smoothness: 200,
  spacing: 64,
  tilt: 8,
};

function numberValue(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function colorValue(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9A-F]{6}$/.test(value)
    ? value
    : fallback;
}

function vectorValue(value: unknown, fallback: Readonly<{ x: number; y: number }>) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fallback;
  }

  const vector = value as Record<string, unknown>;
  return {
    x: numberValue(vector.x, fallback.x, -1, 1),
    y: numberValue(vector.y, fallback.y, -1, 1),
  };
}

function colorOpacityValue(
  value: unknown,
  fallback: Readonly<{ hex: string; opacity: number }>,
) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fallback;
  }

  const colorOpacity = value as Record<string, unknown>;
  return {
    hex:
      typeof colorOpacity.hex === "string" && /^#[0-9A-F]{6}$/.test(colorOpacity.hex)
        ? colorOpacity.hex
        : fallback.hex,
    opacity: numberValue(colorOpacity.opacity, fallback.opacity, 0, 100),
  };
}

function normalizeRotation(value: unknown): 0 | 90 | 180 | 270 {
  return value === 90 || value === 180 || value === 270 ? value : 0;
}

export function createFineDetailsTrailImagesFromMediaAssets(
  mediaAssets: readonly ToolcraftMediaAsset[],
): readonly FineDetailsTrailImage[] {
  return mediaAssets.flatMap((asset) => {
      if (
        asset.assetKind !== "image" ||
        asset.sourceTarget !== fineDetailsTrailTargets.images ||
        asset.lifecycle === "unavailable"
      ) {
        return [];
      }

      return [
        {
          height: asset.size?.height ?? 0,
          id: asset.id,
          ref: asset.resourceRef,
          transform: {
            flipHorizontal: asset.transform?.flipHorizontal === true,
            flipVertical: asset.transform?.flipVertical === true,
            rotationDeg: normalizeRotation(asset.transform?.rotationDeg),
          },
          width: asset.size?.width ?? 0,
        },
      ];
    });
}

export function createFineDetailsTrailFromValues(
  values: Readonly<Record<string, unknown>>,
  images: readonly FineDetailsTrailImage[] = [],
): FineDetailsTrailSettings {
  return {
    border: {
      color: colorValue(
        values[fineDetailsTrailTargets.borderColor],
        FINE_DETAILS_TRAIL_DEFAULTS.border.color,
      ),
      enabled: booleanValue(
        values[fineDetailsTrailTargets.borderEnabled],
        FINE_DETAILS_TRAIL_DEFAULTS.border.enabled,
      ),
      width: numberValue(
        values[fineDetailsTrailTargets.borderWidth],
        FINE_DETAILS_TRAIL_DEFAULTS.border.width,
        1,
        20,
      ),
    },
    cardRadius: numberValue(
      values[fineDetailsTrailTargets.cardRadius],
      FINE_DETAILS_TRAIL_DEFAULTS.cardRadius,
      0,
      100,
    ),
    cardSize: numberValue(
      values[fineDetailsTrailTargets.cardSize],
      FINE_DETAILS_TRAIL_DEFAULTS.cardSize,
      40,
      400,
    ),
    enabled: booleanValue(
      values[fineDetailsTrailTargets.enabled],
      FINE_DETAILS_TRAIL_DEFAULTS.enabled,
    ),
    fadeIn: numberValue(
      values[fineDetailsTrailTargets.fadeIn],
      FINE_DETAILS_TRAIL_DEFAULTS.fadeIn,
      0,
      1000,
    ),
    fadeOut: numberValue(
      values[fineDetailsTrailTargets.fadeOut],
      FINE_DETAILS_TRAIL_DEFAULTS.fadeOut,
      100,
      2000,
    ),
    images,
    length: Math.round(
      numberValue(
        values[fineDetailsTrailTargets.length],
        FINE_DETAILS_TRAIL_DEFAULTS.length,
        2,
        24,
      ),
    ),
    lifetime: numberValue(
      values[fineDetailsTrailTargets.lifetime],
      FINE_DETAILS_TRAIL_DEFAULTS.lifetime,
      200,
      10_000,
    ),
    resumeDelay: numberValue(
      values[fineDetailsTrailTargets.resumeDelay],
      FINE_DETAILS_TRAIL_DEFAULTS.resumeDelay,
      0,
      2000,
    ),
    resumeRamp: numberValue(
      values[fineDetailsTrailTargets.resumeRamp],
      FINE_DETAILS_TRAIL_DEFAULTS.resumeRamp,
      0,
      2000,
    ),
    shadow: {
      blur: numberValue(
        values[fineDetailsTrailTargets.shadowBlur],
        FINE_DETAILS_TRAIL_DEFAULTS.shadow.blur,
        0,
        100,
      ),
      colorOpacity: colorOpacityValue(
        values[fineDetailsTrailTargets.shadowColorOpacity],
        FINE_DETAILS_TRAIL_DEFAULTS.shadow.colorOpacity,
      ),
      enabled: booleanValue(
        values[fineDetailsTrailTargets.shadowEnabled],
        FINE_DETAILS_TRAIL_DEFAULTS.shadow.enabled,
      ),
      offset: vectorValue(
        values[fineDetailsTrailTargets.shadowOffset],
        FINE_DETAILS_TRAIL_DEFAULTS.shadow.offset,
      ),
      spread: numberValue(
        values[fineDetailsTrailTargets.shadowSpread],
        FINE_DETAILS_TRAIL_DEFAULTS.shadow.spread,
        -32,
        32,
      ),
    },
    sizeFalloff: numberValue(
      values[fineDetailsTrailTargets.sizeFalloff],
      FINE_DETAILS_TRAIL_DEFAULTS.sizeFalloff,
      0,
      60,
    ),
    smoothness: numberValue(
      values[fineDetailsTrailTargets.smoothness],
      FINE_DETAILS_TRAIL_DEFAULTS.smoothness,
      0,
      1000,
    ),
    spacing: numberValue(
      values[fineDetailsTrailTargets.spacing],
      FINE_DETAILS_TRAIL_DEFAULTS.spacing,
      10,
      300,
    ),
    tilt: numberValue(
      values[fineDetailsTrailTargets.tilt],
      FINE_DETAILS_TRAIL_DEFAULTS.tilt,
      0,
      30,
    ),
  };
}

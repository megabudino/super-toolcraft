export const fineDetailsCarouselTargets = {
  borderColorOpacity: "carousel.border.colorOpacity",
  borderEnabled: "carousel.border.enabled",
  borderWidth: "carousel.border.width",
  count: "carousel.count",
  gap: "carousel.gap",
  imagesMode: "images.mode",
  radius: "carousel.radius",
  shadowBlur: "carousel.shadow.blur",
  shadowColorOpacity: "carousel.shadow.colorOpacity",
  shadowEnabled: "carousel.shadow.enabled",
  shadowOffset: "carousel.shadow.offset",
  shadowSpread: "carousel.shadow.spread",
  speed: "carousel.speed",
  textGap: "carousel.textGap",
} as const;

export type FineDetailsImagesMode = "trail" | "loading" | "carousel";

export type FineDetailsCarouselSettings = Readonly<{
  border: Readonly<{
    colorOpacity: Readonly<{ hex: string; opacity: number }>;
    enabled: boolean;
    width: number;
  }>;
  count: number;
  gap: number;
  radius: number;
  shadow: Readonly<{
    blur: number;
    colorOpacity: Readonly<{ hex: string; opacity: number }>;
    enabled: boolean;
    offset: Readonly<{ x: number; y: number }>;
    spread: number;
  }>;
  speed: number;
  textGap: number;
}>;

export const FINE_DETAILS_IMAGES_MODE_DEFAULT: FineDetailsImagesMode = "trail";

export const FINE_DETAILS_CAROUSEL_DEFAULTS: FineDetailsCarouselSettings = {
  border: {
    colorOpacity: { hex: "#FFFFFF", opacity: 100 },
    enabled: false,
    width: 2,
  },
  count: 4,
  gap: 24,
  radius: 12,
  shadow: {
    blur: 40,
    colorOpacity: { hex: "#000000", opacity: 35 },
    enabled: false,
    offset: { x: 0, y: 0.125 },
    spread: 0,
  },
  speed: 60,
  textGap: 24,
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

function vectorValue(
  value: unknown,
  fallback: Readonly<{ x: number; y: number }>,
) {
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
  const hex =
    typeof colorOpacity.hex === "string" && /^#[0-9A-F]{6}$/i.test(colorOpacity.hex)
      ? colorOpacity.hex.toUpperCase()
      : fallback.hex;

  return {
    hex,
    opacity: numberValue(colorOpacity.opacity, fallback.opacity, 0, 100),
  };
}

export function normalizeFineDetailsImagesMode(
  value: unknown,
): FineDetailsImagesMode {
  return value === "trail" || value === "loading" || value === "carousel"
    ? value
    : FINE_DETAILS_IMAGES_MODE_DEFAULT;
}

export function createFineDetailsImagesModeFromValues(
  values: Readonly<Record<string, unknown>>,
): FineDetailsImagesMode {
  return normalizeFineDetailsImagesMode(
    values[fineDetailsCarouselTargets.imagesMode],
  );
}

export function createFineDetailsCarouselFromValues(
  values: Readonly<Record<string, unknown>>,
): FineDetailsCarouselSettings {
  return {
    border: {
      colorOpacity: colorOpacityValue(
        values[fineDetailsCarouselTargets.borderColorOpacity],
        FINE_DETAILS_CAROUSEL_DEFAULTS.border.colorOpacity,
      ),
      enabled: booleanValue(
        values[fineDetailsCarouselTargets.borderEnabled],
        FINE_DETAILS_CAROUSEL_DEFAULTS.border.enabled,
      ),
      width: numberValue(
        values[fineDetailsCarouselTargets.borderWidth],
        FINE_DETAILS_CAROUSEL_DEFAULTS.border.width,
        1,
        20,
      ),
    },
    count: Math.round(
      numberValue(
        values[fineDetailsCarouselTargets.count],
        FINE_DETAILS_CAROUSEL_DEFAULTS.count,
        1,
        4,
      ),
    ),
    gap: numberValue(
      values[fineDetailsCarouselTargets.gap],
      FINE_DETAILS_CAROUSEL_DEFAULTS.gap,
      0,
      120,
    ),
    radius: numberValue(
      values[fineDetailsCarouselTargets.radius],
      FINE_DETAILS_CAROUSEL_DEFAULTS.radius,
      0,
      48,
    ),
    shadow: {
      blur: numberValue(
        values[fineDetailsCarouselTargets.shadowBlur],
        FINE_DETAILS_CAROUSEL_DEFAULTS.shadow.blur,
        0,
        100,
      ),
      colorOpacity: colorOpacityValue(
        values[fineDetailsCarouselTargets.shadowColorOpacity],
        FINE_DETAILS_CAROUSEL_DEFAULTS.shadow.colorOpacity,
      ),
      enabled: booleanValue(
        values[fineDetailsCarouselTargets.shadowEnabled],
        FINE_DETAILS_CAROUSEL_DEFAULTS.shadow.enabled,
      ),
      offset: vectorValue(
        values[fineDetailsCarouselTargets.shadowOffset],
        FINE_DETAILS_CAROUSEL_DEFAULTS.shadow.offset,
      ),
      spread: numberValue(
        values[fineDetailsCarouselTargets.shadowSpread],
        FINE_DETAILS_CAROUSEL_DEFAULTS.shadow.spread,
        -32,
        32,
      ),
    },
    speed: numberValue(
      values[fineDetailsCarouselTargets.speed],
      FINE_DETAILS_CAROUSEL_DEFAULTS.speed,
      10,
      300,
    ),
    textGap: numberValue(
      values[fineDetailsCarouselTargets.textGap],
      FINE_DETAILS_CAROUSEL_DEFAULTS.textGap,
      0,
      200,
    ),
  };
}

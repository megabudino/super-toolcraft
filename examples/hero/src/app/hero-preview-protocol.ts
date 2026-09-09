import {
  HERO_BACKGROUND_PATTERN_DEFAULTS,
  heroBackgroundPatternTargets,
  type HeroBackgroundPatternSettings,
} from "./hero-background-pattern-values";
import {
  createHeroDispersionSettingsFromValues,
  type HeroDispersionSettings,
} from "./hero-dispersion-values";
import {
  createHeroEffectsSettingsFromValues,
  type HeroEffectsSettings,
} from "./hero-effects-values";
import {
  createHeroGallerySettingsFromValues,
  type HeroGalleryImage,
  type HeroGallerySettings,
} from "./hero-gallery-values";
import {
  HERO_HEADING_DEFAULTS,
  heroHeadingTargets,
  type HeroHeadingSettings,
} from "./hero-heading-values";
import { createHeroHeadingCtaSettingsFromValues } from "./hero-heading-cta-values";
import { createHeroHeadingSubtitleSettingsFromValues } from "./hero-heading-subtitle-values";
import {
  createHeroShadowSettingsFromValues,
  type HeroColorOpacity,
} from "./hero-shadow-values";
import { HERO_WEBSITE_DEFAULTS } from "./hero-website-defaults";

export const HERO_PREVIEW_CHANNEL = "recraft.hero-scene";
export const HERO_PREVIEW_PROTOCOL_VERSION = 23;
export const HERO_PREVIEW_SCENE_BOUNDS = {
  height: 1080,
  width: 1920,
  x: 0,
  y: 0,
} as const;

export type HeroPreviewSettings = Readonly<{
  background: string;
  backgroundEnabled: boolean;
  dispersion: HeroDispersionSettings;
  effects: HeroEffectsSettings;
  gallery: HeroGallerySettings;
  heading: HeroHeadingSettings;
  pattern: HeroBackgroundPatternSettings;
  perspective: number;
  vanishingPoint: Readonly<{
    x: number;
    y: number;
  }>;
}>;

export const HERO_PREVIEW_DEFAULTS: HeroPreviewSettings =
  HERO_WEBSITE_DEFAULTS;


function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function boundedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  return Math.min(maximum, Math.max(minimum, numberValue(value, fallback)));
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function colorValue(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9A-F]{6}$/.test(value)
    ? value
    : fallback;
}

function colorOpacityValue(
  value: unknown,
  fallback: HeroColorOpacity,
): HeroColorOpacity {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fallback;
  }

  const colorOpacity = value as Record<string, unknown>;
  return {
    hex: colorValue(colorOpacity.hex, fallback.hex),
    opacity: Math.min(
      100,
      Math.max(0, numberValue(colorOpacity.opacity, fallback.opacity)),
    ),
  };
}

function vectorValue(
  value: unknown,
  fallback: Readonly<{ x: number; y: number }>,
): Readonly<{ x: number; y: number }> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fallback;
  }

  const vector = value as Record<string, unknown>;
  return {
    x: Math.min(1, Math.max(-1, numberValue(vector.x, fallback.x))),
    y: Math.min(1, Math.max(-1, numberValue(vector.y, fallback.y))),
  };
}

export function createHeroPreviewSettingsFromValues(
  values: Readonly<Record<string, unknown>>,
  images: readonly HeroGalleryImage[] = [],
  rowImages: readonly (readonly HeroGalleryImage[])[] = [],
): HeroPreviewSettings {
  const headingPosition = vectorValue(
    values[heroHeadingTargets.position],
    HERO_HEADING_DEFAULTS.position,
  );
  const hasVanishingPoint =
    typeof values["scene.vanishingPoint"] === "object" &&
    values["scene.vanishingPoint"] !== null &&
    !Array.isArray(values["scene.vanishingPoint"]);
  const vanishingPoint = hasVanishingPoint
    ? vectorValue(values["scene.vanishingPoint"], { x: 0, y: 0 })
    : null;

  return {
    background: colorValue(
      values["appearance.background"],
      HERO_PREVIEW_DEFAULTS.background,
    ),
    backgroundEnabled: booleanValue(
      values["export.includeBackground"],
      HERO_PREVIEW_DEFAULTS.backgroundEnabled,
    ),
    dispersion: createHeroDispersionSettingsFromValues(values),
    effects: createHeroEffectsSettingsFromValues(values),
    gallery: createHeroGallerySettingsFromValues(values, images, rowImages),
    heading: {
      badgeColor: colorValue(
        values[heroHeadingTargets.badgeColor],
        HERO_HEADING_DEFAULTS.badgeColor,
      ),
      badgeGap: boundedNumber(
        values[heroHeadingTargets.badgeGap],
        0,
        160,
        HERO_HEADING_DEFAULTS.badgeGap,
      ),
      badgeScale: boundedNumber(
        values[heroHeadingTargets.badgeScale],
        25,
        300,
        HERO_HEADING_DEFAULTS.badgeScale,
      ),
      badgeShadow: createHeroShadowSettingsFromValues(
        values,
        {
          blur: heroHeadingTargets.badgeShadowBlur,
          colorOpacity: heroHeadingTargets.badgeShadowColorOpacity,
          enabled: heroHeadingTargets.badgeShadowEnabled,
          offset: heroHeadingTargets.badgeShadowOffset,
          spread: heroHeadingTargets.badgeShadowSpread,
        },
        HERO_HEADING_DEFAULTS.badgeShadow,
      ),
      badgeVisible: booleanValue(
        values[heroHeadingTargets.badgeVisible],
        HERO_HEADING_DEFAULTS.badgeVisible,
      ),
      color: colorValue(
        values[heroHeadingTargets.color],
        HERO_HEADING_DEFAULTS.color,
      ),
      cta: createHeroHeadingCtaSettingsFromValues(values),
      lineGap: numberValue(
        values[heroHeadingTargets.lineGap],
        HERO_HEADING_DEFAULTS.lineGap,
      ),
      position: headingPosition,
      recraftSize: numberValue(
        values[heroHeadingTargets.recraftSize],
        HERO_HEADING_DEFAULTS.recraftSize,
      ),
      shadow: createHeroShadowSettingsFromValues(
        values,
        {
          blur: heroHeadingTargets.shadowBlur,
          colorOpacity: heroHeadingTargets.shadowColorOpacity,
          enabled: heroHeadingTargets.shadowEnabled,
          offset: heroHeadingTargets.shadowOffset,
          spread: heroHeadingTargets.shadowSpread,
        },
        HERO_HEADING_DEFAULTS.shadow,
      ),
      stylesSize: numberValue(
        values[heroHeadingTargets.stylesSize],
        HERO_HEADING_DEFAULTS.stylesSize,
      ),
      subtitle: createHeroHeadingSubtitleSettingsFromValues(values),
    },
    pattern: {
      colorOpacity: colorOpacityValue(
        values[heroBackgroundPatternTargets.colorOpacity],
        HERO_BACKGROUND_PATTERN_DEFAULTS.colorOpacity,
      ),
      enabled: booleanValue(
        values[heroBackgroundPatternTargets.enabled],
        HERO_BACKGROUND_PATTERN_DEFAULTS.enabled,
      ),
      squareSize: Math.min(
        160,
        Math.max(
          4,
          numberValue(
            values[heroBackgroundPatternTargets.squareSize],
            HERO_BACKGROUND_PATTERN_DEFAULTS.squareSize,
          ),
        ),
      ),
    },
    perspective: numberValue(
      values["scene.perspective"],
      HERO_PREVIEW_DEFAULTS.perspective,
    ),
    vanishingPoint: {
      x: vanishingPoint
        ? 50 + Math.min(1, Math.max(-1, vanishingPoint.x)) * 35
        : HERO_PREVIEW_DEFAULTS.vanishingPoint.x,
      y: vanishingPoint
        ? 50 + Math.min(1, Math.max(-1, vanishingPoint.y)) * 35
        : HERO_PREVIEW_DEFAULTS.vanishingPoint.y,
    },
  };
}

export type HeroPreviewSettingsMessage = Readonly<{
  channel: typeof HERO_PREVIEW_CHANNEL;
  payload: HeroPreviewSettings;
  type: "settings";
  version: typeof HERO_PREVIEW_PROTOCOL_VERSION;
}>;

export type HeroPreviewReadyMessage = Readonly<{
  channel: typeof HERO_PREVIEW_CHANNEL;
  type: "ready";
  version: typeof HERO_PREVIEW_PROTOCOL_VERSION;
}>;

export type HeroPreviewMediaItem = Readonly<{
  blob: Blob;
  id: string;
  mimeType: string;
  ref: string;
}>;

export type HeroPreviewMediaMessage = Readonly<{
  channel: typeof HERO_PREVIEW_CHANNEL;
  images: readonly HeroPreviewMediaItem[];
  type: "media";
  version: typeof HERO_PREVIEW_PROTOCOL_VERSION;
}>;

export type HeroPreviewGalleryState = Readonly<{
  galleryType: "rows" | "sphere";
  imageOrder: readonly string[];
  imageSignature: string;
  readyImageIds: readonly string[];
  renderer: "fallback" | "webgl";
  pan: Readonly<{ turns: number; x: number; y: number }>;
  rowSignature: string;
  rows: number;
}>;

export type HeroPreviewSnapshotMessage = Readonly<{
  channel: typeof HERO_PREVIEW_CHANNEL;
  requestId: string;
  type: "snapshot";
  version: typeof HERO_PREVIEW_PROTOCOL_VERSION;
}>;

export type HeroPreviewSnapshotResultMessage = Readonly<{
  blob?: Blob;
  channel: typeof HERO_PREVIEW_CHANNEL;
  height?: number;
  message?: string;
  ok: boolean;
  requestId: string;
  type: "snapshot-result";
  version: typeof HERO_PREVIEW_PROTOCOL_VERSION;
  width?: number;
}>;

export type HeroPreviewStateMessage = Readonly<{
  channel: typeof HERO_PREVIEW_CHANNEL;
  payload: HeroPreviewGalleryState;
  type: "state";
  version: typeof HERO_PREVIEW_PROTOCOL_VERSION;
}>;



export function createHeroPreviewSettingsMessage(
  payload: HeroPreviewSettings,
): HeroPreviewSettingsMessage {
  return {
    channel: HERO_PREVIEW_CHANNEL,
    payload,
    type: "settings",
    version: HERO_PREVIEW_PROTOCOL_VERSION,
  };
}

export function createHeroPreviewMediaMessage(
  images: readonly HeroPreviewMediaItem[],
): HeroPreviewMediaMessage {
  return {
    channel: HERO_PREVIEW_CHANNEL,
    images,
    type: "media",
    version: HERO_PREVIEW_PROTOCOL_VERSION,
  };
}


export function isHeroPreviewReadyMessage(
  value: unknown,
): value is HeroPreviewReadyMessage {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const message = value as Record<string, unknown>;
  return (
    message.channel === HERO_PREVIEW_CHANNEL &&
    message.version === HERO_PREVIEW_PROTOCOL_VERSION &&
    message.type === "ready"
  );
}


export function isHeroPreviewStateMessage(
  value: unknown,
): value is HeroPreviewStateMessage {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const message = value as Record<string, unknown>;
  if (
    message.channel !== HERO_PREVIEW_CHANNEL ||
    message.version !== HERO_PREVIEW_PROTOCOL_VERSION ||
    message.type !== "state" ||
    typeof message.payload !== "object" ||
    message.payload === null ||
    Array.isArray(message.payload)
  ) {
    return false;
  }

  const payload = message.payload as Record<string, unknown>;
  const pan = payload.pan;
  return (
    (payload.galleryType === "rows" || payload.galleryType === "sphere") &&
    (payload.renderer === "webgl" || payload.renderer === "fallback") &&
    Array.isArray(payload.imageOrder) &&
    payload.imageOrder.every((id) => typeof id === "string") &&
    Array.isArray(payload.readyImageIds) &&
    payload.readyImageIds.every((id) => typeof id === "string") &&
    typeof payload.imageSignature === "string" &&
    typeof payload.rows === "number" &&
    Number.isFinite(payload.rows) &&
    typeof payload.rowSignature === "string" &&
    typeof pan === "object" &&
    pan !== null &&
    !Array.isArray(pan) &&
    typeof (pan as Record<string, unknown>).x === "number" &&
    Number.isFinite((pan as Record<string, unknown>).x) &&
    typeof (pan as Record<string, unknown>).y === "number" &&
    Number.isFinite((pan as Record<string, unknown>).y) &&
    Number.isInteger((pan as Record<string, unknown>).turns)
  );
}

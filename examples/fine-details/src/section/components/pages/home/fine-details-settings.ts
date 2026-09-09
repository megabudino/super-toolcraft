import appliedFineDetailsSettingsSource from './fine-details-applied-settings.json';
import { fineDetailsDefaultTrailAssets } from './fine-details-default-assets';

export interface FineDetailsColorOpacity {
  hex: string;
  opacity: number;
}

export interface FineDetailsShadowSettings {
  blur: number;
  colorOpacity: FineDetailsColorOpacity;
  enabled: boolean;
  offset: { x: number; y: number };
  spread: number;
}

export interface FineDetailsPromptFlightSettings {
  bounce: number;
  enabled: boolean;
  flightTime: number;
  ghostFalloff: number;
  ghostOpacity: number;
  ghostSpacing: number;
  ghosts: boolean;
  offset: { x: number; y: number };
  startDelay: number;
  vanishStagger: number;
  vanishTime: number;
}

export interface FineDetailsPromptSettings {
  flight: FineDetailsPromptFlightSettings;
  position: { x: number; y: number };
  shadow: FineDetailsShadowSettings;
  typing: FineDetailsPromptTypingSettings;
}

export interface FineDetailsPromptTypingSettings {
  deleteSpeed: number;
  deleteStyle: 'backspace' | 'instant';
  enabled: boolean;
  gap: number;
  hold: number;
  humanize: number;
  phrases: readonly string[];
  typeSpeed: number;
}

export interface FineDetailsBorderSettings {
  color: string;
  enabled: boolean;
  width: number;
}

export interface FineDetailsCarouselBorderSettings {
  colorOpacity: FineDetailsColorOpacity;
  enabled: boolean;
  width: number;
}

export interface FineDetailsCarouselSettings {
  border: FineDetailsCarouselBorderSettings;
  count: number;
  gap: number;
  radius: number;
  shadow: FineDetailsShadowSettings;
  speed: number;
  textGap: number;
}

export interface FineDetailsTrailImageTransform {
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotationDeg: 0 | 90 | 180 | 270;
}

export interface FineDetailsTrailImage {
  height: number;
  id: string;
  ref: string;
  transform: FineDetailsTrailImageTransform;
  width: number;
}

export interface FineDetailsTrailSettings {
  border: FineDetailsBorderSettings;
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
  shadow: FineDetailsShadowSettings;
  sizeFalloff: number;
  smoothness: number;
  spacing: number;
  tilt: number;
}

export interface FineDetailsTypographySettings {
  lowerRight: {
    bodyFontSize: number;
    bottom: number;
    gap: number;
    headingFontSize: number;
    right: number;
  };
  upperLeft: {
    fontSize: number;
    left: number;
    top: number;
  };
}

export interface FineDetailsLoadingSettings {
  angle: number;
  baseTone: number;
  border: { colorOpacity: FineDetailsColorOpacity; width: number };
  cell: number;
  contrast: number;
  desync: number;
  distort: number;
  enabled: boolean;
  glare: number;
  passTime: number;
  pause: number;
  softness: number;
  stagger: number;
  waveWidth: number;
}

export type FineDetailsImagesMode = 'carousel' | 'loading' | 'trail';

export interface FineDetailsSettings {
  background: string;
  carousel: FineDetailsCarouselSettings;
  gridOpacity: number;
  gridSize: number;
  height: number;
  imagesMode: FineDetailsImagesMode;
  loading: FineDetailsLoadingSettings;
  prompt: FineDetailsPromptSettings;
  trail: FineDetailsTrailSettings;
  typography: FineDetailsTypographySettings;
}

export type PersistedFineDetailsSettings = Omit<FineDetailsSettings, 'trail'> & {
  trail: Omit<FineDetailsTrailSettings, 'images'>;
};

export const FINE_DETAILS_HEIGHT_LIMIT = 8192;
export const FINE_DETAILS_GRID_SIZE_MIN = 10;
export const FINE_DETAILS_GRID_SIZE_MAX = 200;
export const FINE_DETAILS_TYPOGRAPHY_INSET_MAX = 8192;
export const FINE_DETAILS_TYPOGRAPHY_SIZE_MIN = 8;
export const FINE_DETAILS_TYPOGRAPHY_SIZE_MAX = 512;
export const FINE_DETAILS_TYPOGRAPHY_GAP_MAX = 512;
export const FINE_DETAILS_DEFAULT_PROMPT =
  'Create four campaign visuals: a sneaker, camera, chair, and perfume bottle.';

export const defaultFineDetailsPromptTypingSettings: FineDetailsPromptTypingSettings = {
  deleteSpeed: 30,
  deleteStyle: 'backspace',
  enabled: false,
  gap: 0.6,
  hold: 1.8,
  humanize: 0.6,
  phrases: [
    'Create a surreal fashion campaign set in a blooming desert.',
    'Design a playful 3D mascot for a futuristic coffee brand.',
    'Generate a cinematic portrait lit by neon signs at night.',
    'Illustrate a cozy glass house hidden deep in the forest.',
    'Create a bold poster for an experimental music festival.',
    'Design a minimal perfume bottle inspired by ocean waves.',
  ],
  typeSpeed: 12,
};

export const defaultFineDetailsCarouselSettings: FineDetailsCarouselSettings = {
  border: {
    colorOpacity: { hex: '#FFFFFF', opacity: 100 },
    enabled: false,
    width: 2,
  },
  count: 4,
  gap: 24,
  radius: 12,
  shadow: {
    blur: 40,
    colorOpacity: { hex: '#000000', opacity: 35 },
    enabled: false,
    offset: { x: 0, y: 0.125 },
    spread: 0,
  },
  speed: 60,
  textGap: 24,
};

export const defaultFineDetailsTrailSettings: FineDetailsTrailSettings = {
  border: { color: '#FFFFFF', enabled: true, width: 2 },
  cardRadius: 14,
  cardSize: 180,
  enabled: true,
  fadeIn: 150,
  fadeOut: 200,
  images: fineDetailsDefaultTrailAssets.map(({ height, id, ref, width }) => ({
    height,
    id,
    ref,
    transform: { flipHorizontal: false, flipVertical: false, rotationDeg: 0 },
    width,
  })),
  length: 8,
  lifetime: 600,
  resumeDelay: 300,
  resumeRamp: 500,
  shadow: {
    blur: 40,
    colorOpacity: { hex: '#000000', opacity: 35 },
    enabled: true,
    offset: { x: 0, y: 0.125 },
    spread: 0,
  },
  sizeFalloff: 8,
  smoothness: 200,
  spacing: 64,
  tilt: 8,
};

export const defaultFineDetailsPromptFlightSettings: FineDetailsPromptFlightSettings = {
  bounce: 12,
  enabled: true,
  flightTime: 550,
  ghostFalloff: 8,
  ghostOpacity: 55,
  ghostSpacing: 56,
  ghosts: true,
  offset: { x: 0, y: 0 },
  startDelay: 150,
  vanishStagger: 70,
  vanishTime: 260,
};

export const defaultFineDetailsLoadingSettings: FineDetailsLoadingSettings = {
  angle: 45,
  baseTone: 85,
  border: { colorOpacity: { hex: '#000000', opacity: 12 }, width: 1 },
  cell: 20,
  contrast: 14,
  desync: 12,
  distort: 6,
  enabled: true,
  glare: 55,
  passTime: 1600,
  pause: 300,
  softness: 60,
  stagger: 180,
  waveWidth: 45,
};

export const defaultFineDetailsSettings: FineDetailsSettings = {
  background: '#F2F2F2',
  carousel: defaultFineDetailsCarouselSettings,
  gridOpacity: 80,
  gridSize: 50,
  height: 1080,
  imagesMode: 'trail',
  loading: defaultFineDetailsLoadingSettings,
  prompt: {
    flight: defaultFineDetailsPromptFlightSettings,
    position: { x: 0, y: -0.06 },
    shadow: {
      blur: 33,
      colorOpacity: { hex: '#000000', opacity: 35 },
      enabled: true,
      offset: { x: 0, y: 0.48 },
      spread: 5,
    },
    typing: defaultFineDetailsPromptTypingSettings,
  },
  trail: defaultFineDetailsTrailSettings,
  typography: {
    lowerRight: {
      bodyFontSize: 24,
      bottom: 96,
      gap: 8,
      headingFontSize: 88,
      right: 96,
    },
    upperLeft: {
      fontSize: 120,
      left: 96,
      top: 96,
    },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeBoundedNumber(value: unknown, minimum: number, maximum: number, round: boolean) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const bounded = Math.min(maximum, Math.max(minimum, value));
  return round ? Math.round(bounded) : bounded;
}

function normalizeVector(value: unknown) {
  if (!isRecord(value)) return null;

  const x = normalizeBoundedNumber(value.x, -1, 1, false);
  const y = normalizeBoundedNumber(value.y, -1, 1, false);
  return x === null || y === null ? null : { x, y };
}

function normalizeColorOpacity(value: unknown) {
  if (!isRecord(value)) return null;

  const opacity = normalizeBoundedNumber(value.opacity, 0, 100, false);
  if (typeof value.hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(value.hex) || opacity === null) {
    return null;
  }

  return { hex: value.hex.toUpperCase(), opacity };
}

function normalizeShadow(value: unknown): FineDetailsShadowSettings | null {
  if (!isRecord(value)) return null;

  const blur = normalizeBoundedNumber(value.blur, 0, 100, false);
  const colorOpacity = normalizeColorOpacity(value.colorOpacity);
  const offset = normalizeVector(value.offset);
  const spread = normalizeBoundedNumber(value.spread, -32, 32, false);

  if (
    blur === null ||
    colorOpacity === null ||
    typeof value.enabled !== 'boolean' ||
    offset === null ||
    spread === null
  ) {
    return null;
  }

  return {
    blur,
    colorOpacity,
    enabled: value.enabled,
    offset,
    spread,
  };
}

function normalizeDefaultedNumber(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
  round = false,
) {
  return value === undefined ? fallback : normalizeBoundedNumber(value, minimum, maximum, round);
}

function normalizeDefaultedBoolean(value: unknown, fallback: boolean) {
  return value === undefined ? fallback : typeof value === 'boolean' ? value : null;
}

function normalizePromptFlight(value: unknown): FineDetailsPromptFlightSettings {
  const flight = isRecord(value) ? value : {};
  const defaults = defaultFineDetailsPromptFlightSettings;
  const offset = isRecord(flight.offset) ? flight.offset : {};

  return {
    bounce: normalizeBoundedNumber(flight.bounce, 0, 50, false) ?? defaults.bounce,
    enabled: typeof flight.enabled === 'boolean' ? flight.enabled : defaults.enabled,
    flightTime: normalizeBoundedNumber(flight.flightTime, 150, 2000, false) ?? defaults.flightTime,
    ghostFalloff:
      normalizeBoundedNumber(flight.ghostFalloff, 0, 40, false) ?? defaults.ghostFalloff,
    ghostOpacity:
      normalizeBoundedNumber(flight.ghostOpacity, 5, 100, false) ?? defaults.ghostOpacity,
    ghostSpacing:
      normalizeBoundedNumber(flight.ghostSpacing, 16, 240, false) ?? defaults.ghostSpacing,
    ghosts: typeof flight.ghosts === 'boolean' ? flight.ghosts : defaults.ghosts,
    offset: {
      x: normalizeBoundedNumber(offset.x, -120, 120, false) ?? defaults.offset.x,
      y: normalizeBoundedNumber(offset.y, -120, 120, false) ?? defaults.offset.y,
    },
    startDelay: normalizeBoundedNumber(flight.startDelay, 0, 2000, false) ?? defaults.startDelay,
    vanishStagger:
      normalizeBoundedNumber(flight.vanishStagger, 0, 400, false) ?? defaults.vanishStagger,
    vanishTime: normalizeBoundedNumber(flight.vanishTime, 80, 1200, false) ?? defaults.vanishTime,
  };
}

function normalizeLoading(value: unknown): FineDetailsLoadingSettings {
  const loading = isRecord(value) ? value : {};
  const defaults = defaultFineDetailsLoadingSettings;

  return {
    angle: normalizeBoundedNumber(loading.angle, 0, 360, false) ?? defaults.angle,
    baseTone: normalizeBoundedNumber(loading.baseTone, 0, 100, false) ?? defaults.baseTone,
    border: (() => {
      const border = isRecord(loading.border) ? loading.border : {};
      return {
        colorOpacity: normalizeColorOpacity(border.colorOpacity) ?? defaults.border.colorOpacity,
        width: normalizeBoundedNumber(border.width, 0, 8, false) ?? defaults.border.width,
      };
    })(),
    cell: normalizeBoundedNumber(loading.cell, 8, 64, true) ?? defaults.cell,
    contrast: normalizeBoundedNumber(loading.contrast, 0, 60, false) ?? defaults.contrast,
    desync: normalizeBoundedNumber(loading.desync, 0, 50, false) ?? defaults.desync,
    distort: normalizeBoundedNumber(loading.distort, 0, 24, false) ?? defaults.distort,
    enabled: typeof loading.enabled === 'boolean' ? loading.enabled : defaults.enabled,
    glare: normalizeBoundedNumber(loading.glare, 0, 100, false) ?? defaults.glare,
    passTime: normalizeBoundedNumber(loading.passTime, 600, 4000, false) ?? defaults.passTime,
    pause: normalizeBoundedNumber(loading.pause, 0, 2000, false) ?? defaults.pause,
    softness: normalizeBoundedNumber(loading.softness, 0, 100, false) ?? defaults.softness,
    stagger: normalizeBoundedNumber(loading.stagger, 0, 800, false) ?? defaults.stagger,
    waveWidth: normalizeBoundedNumber(loading.waveWidth, 10, 100, false) ?? defaults.waveWidth,
  };
}

function normalizeTrailBorder(value: unknown): FineDetailsBorderSettings | null {
  if (value === undefined) return defaultFineDetailsTrailSettings.border;
  if (!isRecord(value)) return null;

  const defaults = defaultFineDetailsTrailSettings.border;
  const color =
    value.color === undefined
      ? defaults.color
      : typeof value.color === 'string' && /^#[0-9a-f]{6}$/i.test(value.color)
        ? value.color.toUpperCase()
        : null;
  const enabled = normalizeDefaultedBoolean(value.enabled, defaults.enabled);
  const width = normalizeDefaultedNumber(value.width, defaults.width, 1, 20);

  return color === null || enabled === null || width === null ? null : { color, enabled, width };
}

function normalizeTrailShadow(value: unknown): FineDetailsShadowSettings | null {
  if (value === undefined) return defaultFineDetailsTrailSettings.shadow;
  if (!isRecord(value)) return null;

  const defaults = defaultFineDetailsTrailSettings.shadow;
  const blur = normalizeDefaultedNumber(value.blur, defaults.blur, 0, 100);
  const colorOpacity =
    value.colorOpacity === undefined
      ? defaults.colorOpacity
      : normalizeColorOpacity(value.colorOpacity);
  const enabled = normalizeDefaultedBoolean(value.enabled, defaults.enabled);
  const offset = value.offset === undefined ? defaults.offset : normalizeVector(value.offset);
  const spread = normalizeDefaultedNumber(value.spread, defaults.spread, -32, 32);

  if (
    blur === null ||
    colorOpacity === null ||
    enabled === null ||
    offset === null ||
    spread === null
  ) {
    return null;
  }

  return { blur, colorOpacity, enabled, offset, spread };
}

function normalizeCarouselBorder(value: unknown): FineDetailsCarouselBorderSettings | null {
  if (value === undefined) return defaultFineDetailsCarouselSettings.border;
  if (!isRecord(value)) return null;

  const defaults = defaultFineDetailsCarouselSettings.border;
  const colorOpacity =
    value.colorOpacity === undefined
      ? defaults.colorOpacity
      : normalizeColorOpacity(value.colorOpacity);
  const enabled = normalizeDefaultedBoolean(value.enabled, defaults.enabled);
  const width = normalizeDefaultedNumber(value.width, defaults.width, 1, 20);

  return colorOpacity === null || enabled === null || width === null
    ? null
    : { colorOpacity, enabled, width };
}

function normalizeCarouselShadow(value: unknown): FineDetailsShadowSettings | null {
  if (value === undefined) return defaultFineDetailsCarouselSettings.shadow;
  if (!isRecord(value)) return null;

  const defaults = defaultFineDetailsCarouselSettings.shadow;
  const blur = normalizeDefaultedNumber(value.blur, defaults.blur, 0, 100);
  const colorOpacity =
    value.colorOpacity === undefined
      ? defaults.colorOpacity
      : normalizeColorOpacity(value.colorOpacity);
  const enabled = normalizeDefaultedBoolean(value.enabled, defaults.enabled);
  const offset = value.offset === undefined ? defaults.offset : normalizeVector(value.offset);
  const spread = normalizeDefaultedNumber(value.spread, defaults.spread, -32, 32);

  if (
    blur === null ||
    colorOpacity === null ||
    enabled === null ||
    offset === null ||
    spread === null
  ) {
    return null;
  }

  return { blur, colorOpacity, enabled, offset, spread };
}

function normalizePromptTyping(value: unknown): FineDetailsPromptTypingSettings | null {
  if (value === undefined) return defaultFineDetailsPromptTypingSettings;
  if (!isRecord(value)) return null;

  const defaults = defaultFineDetailsPromptTypingSettings;
  const enabled = normalizeDefaultedBoolean(value.enabled, defaults.enabled);
  const deleteStyle =
    value.deleteStyle === undefined
      ? defaults.deleteStyle
      : value.deleteStyle === 'backspace' || value.deleteStyle === 'instant'
        ? value.deleteStyle
        : null;
  const phrases = Array.isArray(value.phrases)
    ? value.phrases.filter((phrase): phrase is string => typeof phrase === 'string').slice(0, 8)
    : value.phrases === undefined
      ? defaults.phrases
      : null;
  const normalizeTypingNumber = (
    candidate: unknown,
    fallback: number,
    minimum: number,
    maximum: number,
  ) =>
    typeof candidate === 'number' && Number.isFinite(candidate)
      ? Math.min(maximum, Math.max(minimum, candidate))
      : fallback;
  const typeSpeed = normalizeTypingNumber(value.typeSpeed, defaults.typeSpeed, 3, 30);
  const deleteSpeed = normalizeTypingNumber(value.deleteSpeed, defaults.deleteSpeed, 5, 60);
  const hold = normalizeTypingNumber(value.hold, defaults.hold, 0.2, 6);
  const gap = normalizeTypingNumber(value.gap, defaults.gap, 0, 3);
  const humanize = normalizeTypingNumber(value.humanize, defaults.humanize, 0, 1);

  if (enabled === null || deleteStyle === null || phrases === null) return null;

  return {
    deleteSpeed,
    deleteStyle,
    enabled,
    gap,
    hold,
    humanize,
    phrases: phrases.length > 0 ? phrases : defaults.phrases,
    typeSpeed,
  };
}

function normalizeCarousel(value: unknown): FineDetailsCarouselSettings | null {
  if (value === undefined) return defaultFineDetailsCarouselSettings;
  if (!isRecord(value)) return null;

  const defaults = defaultFineDetailsCarouselSettings;
  const border = normalizeCarouselBorder(value.border);
  const count = normalizeDefaultedNumber(value.count, defaults.count, 1, 4, true);
  const gap = normalizeDefaultedNumber(value.gap, defaults.gap, 0, 120);
  const radius = normalizeDefaultedNumber(value.radius, defaults.radius, 0, 48);
  const shadow = normalizeCarouselShadow(value.shadow);
  const speed = normalizeDefaultedNumber(value.speed, defaults.speed, 10, 300);
  const textGap = normalizeDefaultedNumber(value.textGap, defaults.textGap, 0, 200);

  if (
    border === null ||
    count === null ||
    gap === null ||
    radius === null ||
    shadow === null ||
    speed === null ||
    textGap === null
  ) {
    return null;
  }

  return { border, count, gap, radius, shadow, speed, textGap };
}

function normalizeTrailImageTransform(value: unknown): FineDetailsTrailImageTransform | null {
  if (value === undefined) {
    return { flipHorizontal: false, flipVertical: false, rotationDeg: 0 };
  }
  if (!isRecord(value)) return null;

  const flipHorizontal = normalizeDefaultedBoolean(value.flipHorizontal, false);
  const flipVertical = normalizeDefaultedBoolean(value.flipVertical, false);
  const rotationDeg = value.rotationDeg === undefined ? 0 : value.rotationDeg;

  if (
    flipHorizontal === null ||
    flipVertical === null ||
    (rotationDeg !== 0 && rotationDeg !== 90 && rotationDeg !== 180 && rotationDeg !== 270)
  ) {
    return null;
  }

  return { flipHorizontal, flipVertical, rotationDeg };
}

function normalizeTrailImage(value: unknown): FineDetailsTrailImage | null {
  if (!isRecord(value)) return null;

  const height = normalizeBoundedNumber(value.height, 0, 16_384, false);
  const width = normalizeBoundedNumber(value.width, 0, 16_384, false);
  const transform = normalizeTrailImageTransform(value.transform);
  if (
    height === null ||
    width === null ||
    transform === null ||
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    value.id.length > 512 ||
    typeof value.ref !== 'string' ||
    value.ref.length === 0 ||
    value.ref.length > 512
  ) {
    return null;
  }

  return { height, id: value.id, ref: value.ref, transform, width };
}

function normalizeTrail(value: unknown): FineDetailsTrailSettings | null {
  if (value === undefined) return defaultFineDetailsTrailSettings;
  if (!isRecord(value)) return null;

  let images: readonly FineDetailsTrailImage[] = defaultFineDetailsTrailSettings.images;
  if (value.images !== undefined) {
    if (!Array.isArray(value.images)) return null;
    const normalizedImages: FineDetailsTrailImage[] = [];
    for (const candidate of value.images) {
      const image = normalizeTrailImage(candidate);
      if (!image) return null;
      normalizedImages.push(image);
    }
    images = normalizedImages;
  }

  const defaults = defaultFineDetailsTrailSettings;
  const border = normalizeTrailBorder(value.border);
  const cardRadius = normalizeDefaultedNumber(value.cardRadius, defaults.cardRadius, 0, 100);
  const cardSize = normalizeDefaultedNumber(value.cardSize, defaults.cardSize, 40, 400);
  const enabled = normalizeDefaultedBoolean(value.enabled, defaults.enabled);
  const fadeIn = normalizeDefaultedNumber(value.fadeIn, defaults.fadeIn, 0, 1000);
  const fadeOut = normalizeDefaultedNumber(value.fadeOut, defaults.fadeOut, 100, 2000);
  const length = normalizeDefaultedNumber(value.length, defaults.length, 2, 24, true);
  const lifetime = normalizeDefaultedNumber(value.lifetime, defaults.lifetime, 200, 10_000);
  const resumeDelay = normalizeDefaultedNumber(value.resumeDelay, defaults.resumeDelay, 0, 2000);
  const resumeRamp = normalizeDefaultedNumber(value.resumeRamp, defaults.resumeRamp, 0, 2000);
  const shadow = normalizeTrailShadow(value.shadow);
  const sizeFalloff = normalizeDefaultedNumber(value.sizeFalloff, defaults.sizeFalloff, 0, 60);
  const smoothness = normalizeDefaultedNumber(value.smoothness, defaults.smoothness, 0, 1000);
  const spacing = normalizeDefaultedNumber(value.spacing, defaults.spacing, 10, 300);
  const tilt = normalizeDefaultedNumber(value.tilt, defaults.tilt, 0, 30);

  if (
    border === null ||
    cardRadius === null ||
    cardSize === null ||
    enabled === null ||
    fadeIn === null ||
    fadeOut === null ||
    length === null ||
    lifetime === null ||
    resumeDelay === null ||
    resumeRamp === null ||
    shadow === null ||
    sizeFalloff === null ||
    smoothness === null ||
    spacing === null ||
    tilt === null
  ) {
    return null;
  }

  return {
    border,
    cardRadius,
    cardSize,
    enabled,
    fadeIn,
    fadeOut,
    images,
    length,
    lifetime,
    resumeDelay,
    resumeRamp,
    shadow,
    sizeFalloff,
    smoothness,
    spacing,
    tilt,
  };
}

function normalizeTypography(value: unknown): FineDetailsTypographySettings | null {
  if (!isRecord(value)) return null;

  const lowerRight = isRecord(value.lowerRight) ? value.lowerRight : null;
  const upperLeft = isRecord(value.upperLeft) ? value.upperLeft : null;
  if (!lowerRight || !upperLeft) return null;

  const bodyFontSize = normalizeBoundedNumber(
    lowerRight.bodyFontSize,
    FINE_DETAILS_TYPOGRAPHY_SIZE_MIN,
    FINE_DETAILS_TYPOGRAPHY_SIZE_MAX,
    false,
  );
  const bottom = normalizeBoundedNumber(
    lowerRight.bottom,
    0,
    FINE_DETAILS_TYPOGRAPHY_INSET_MAX,
    false,
  );
  const gap = normalizeBoundedNumber(lowerRight.gap, 0, FINE_DETAILS_TYPOGRAPHY_GAP_MAX, false);
  const headingFontSize = normalizeBoundedNumber(
    lowerRight.headingFontSize,
    FINE_DETAILS_TYPOGRAPHY_SIZE_MIN,
    FINE_DETAILS_TYPOGRAPHY_SIZE_MAX,
    false,
  );
  const right = normalizeBoundedNumber(
    lowerRight.right,
    0,
    FINE_DETAILS_TYPOGRAPHY_INSET_MAX,
    false,
  );
  const fontSize = normalizeBoundedNumber(
    upperLeft.fontSize,
    FINE_DETAILS_TYPOGRAPHY_SIZE_MIN,
    FINE_DETAILS_TYPOGRAPHY_SIZE_MAX,
    false,
  );
  const left = normalizeBoundedNumber(upperLeft.left, 0, FINE_DETAILS_TYPOGRAPHY_INSET_MAX, false);
  const top = normalizeBoundedNumber(upperLeft.top, 0, FINE_DETAILS_TYPOGRAPHY_INSET_MAX, false);

  if (
    bodyFontSize === null ||
    bottom === null ||
    gap === null ||
    headingFontSize === null ||
    right === null ||
    fontSize === null ||
    left === null ||
    top === null
  ) {
    return null;
  }

  return {
    lowerRight: { bodyFontSize, bottom, gap, headingFontSize, right },
    upperLeft: { fontSize, left, top },
  };
}

export function normalizeFineDetailsSettings(value: unknown): FineDetailsSettings | null {
  if (!isRecord(value)) return null;

  const background = value.background;
  const carousel = normalizeCarousel(value.carousel);
  const height = normalizeBoundedNumber(value.height, 1, FINE_DETAILS_HEIGHT_LIMIT, true);
  const gridSize = normalizeBoundedNumber(
    value.gridSize,
    FINE_DETAILS_GRID_SIZE_MIN,
    FINE_DETAILS_GRID_SIZE_MAX,
    true,
  );
  const gridOpacity = normalizeBoundedNumber(value.gridOpacity, 0, 100, false);
  const imagesMode =
    value.imagesMode === 'carousel' || value.imagesMode === 'loading' ? value.imagesMode : 'trail';
  const loading = normalizeLoading(value.loading);
  const prompt = isRecord(value.prompt) ? value.prompt : null;
  const promptFlight = prompt ? normalizePromptFlight(prompt.flight) : null;
  const promptPosition = prompt ? normalizeVector(prompt.position) : null;
  const promptShadow = prompt ? normalizeShadow(prompt.shadow) : null;
  const promptTyping = prompt ? normalizePromptTyping(prompt.typing) : null;
  const trail = normalizeTrail(value.trail);
  const typography = normalizeTypography(value.typography);

  if (
    typeof background !== 'string' ||
    !/^#[0-9a-f]{6}$/i.test(background) ||
    carousel === null ||
    height === null ||
    gridSize === null ||
    gridOpacity === null ||
    promptFlight === null ||
    promptPosition === null ||
    promptShadow === null ||
    promptTyping === null ||
    trail === null ||
    typography === null
  ) {
    return null;
  }

  return {
    background: background.toUpperCase(),
    carousel,
    gridOpacity,
    gridSize,
    height,
    imagesMode,
    loading,
    prompt: {
      flight: promptFlight,
      position: promptPosition,
      shadow: promptShadow,
      typing: promptTyping,
    },
    trail,
    typography,
  };
}

export function createPersistedFineDetailsSettings(
  settings: FineDetailsSettings,
): PersistedFineDetailsSettings {
  return {
    background: settings.background,
    carousel: settings.carousel,
    gridOpacity: settings.gridOpacity,
    gridSize: settings.gridSize,
    height: settings.height,
    imagesMode: settings.imagesMode,
    loading: settings.loading,
    prompt: settings.prompt,
    trail: {
      border: settings.trail.border,
      cardRadius: settings.trail.cardRadius,
      cardSize: settings.trail.cardSize,
      enabled: settings.trail.enabled,
      fadeIn: settings.trail.fadeIn,
      fadeOut: settings.trail.fadeOut,
      length: settings.trail.length,
      lifetime: settings.trail.lifetime,
      resumeDelay: settings.trail.resumeDelay,
      resumeRamp: settings.trail.resumeRamp,
      shadow: settings.trail.shadow,
      sizeFalloff: settings.trail.sizeFalloff,
      smoothness: settings.trail.smoothness,
      spacing: settings.trail.spacing,
      tilt: settings.trail.tilt,
    },
    typography: settings.typography,
  };
}

export const appliedFineDetailsSettings =
  normalizeFineDetailsSettings(appliedFineDetailsSettingsSource) ?? defaultFineDetailsSettings;

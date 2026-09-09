import appliedHeroSceneSettingsSource from './hero-applied-settings.json';

export type HeroDispersionWarpStyle = 'prism' | 'stretch';
export type HeroDispersionWaveKind = 'glass' | 'ripple';

export interface HeroDispersionSettings {
  amount: number;
  aura: number;
  blur: number;
  count: number;
  curve: number;
  edgeFade: number;
  edgeWidth: number;
  gateGlow: number;
  gateOffset: number;
  gateRefraction: number;
  gateWidth: number;
  hue: number;
  spectrum: number;
  turbulence: number;
  turbulenceScale: number;
  velocity: number;
  warp: number;
  warpFace: number;
  warpOffset: number;
  warpSharpness: number;
  warpStyle: HeroDispersionWarpStyle;
  warpWave: number;
  warpWaveBlur: number;
  warpWaveEnabled: boolean;
  warpWaveKind: HeroDispersionWaveKind;
  warpWaveLength: number;
}

export interface HeroEffectsSettings {
  crt: {
    chroma: number;
    enabled: boolean;
    fade: number;
    flicker: number;
    pitch: number;
    scanlines: number;
  };
  grain: {
    amount: number;
    enabled: boolean;
    size: number;
  };
}

export interface HeroEdgeBlurSettings {
  enabled: boolean;
  width: number;
  strength: number;
}

export interface HeroShadowSettings {
  blur: number;
  colorOpacity: {
    hex: string;
    opacity: number;
  };
  enabled: boolean;
  offset: {
    x: number;
    y: number;
  };
  spread: number;
}

export interface HeroHeadingCtaSettings {
  backgroundColor: string;
  fontSize: number;
  gap: number;
  horizontalPadding: number;
  shadow: HeroShadowSettings;
  text: string;
  textColor: string;
  verticalPadding: number;
}

export interface HeroHeadingSubtitleSettings {
  fontSize: number;
  gap: number;
  shadow: HeroShadowSettings;
}

export interface HeroHeadingSettings {
  badgeColor: string;
  badgeGap: number;
  badgeScale: number;
  badgeShadow: HeroShadowSettings;
  badgeVisible: boolean;
  color: string;
  cta: HeroHeadingCtaSettings;
  lineGap: number;
  position: {
    x: number;
    y: number;
  };
  recraftSize: number;
  shadow: HeroShadowSettings;
  stylesSize: number;
  subtitle: HeroHeadingSubtitleSettings;
}

export interface HeroBackgroundPatternSettings {
  colorOpacity: {
    hex: string;
    opacity: number;
  };
  enabled: boolean;
  squareSize: number;
}

export interface HeroGalleryImageTransform {
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotationDeg: 0 | 90 | 180 | 270;
}

export interface HeroGalleryImage {
  height: number;
  id: string;
  ref: string;
  transform: HeroGalleryImageTransform;
  width: number;
}

export interface HeroSphereRow {
  images: HeroGalleryImage[];
  offset: number;
  speed: number;
}

export interface HeroGallerySettings {
  cardGap: number;
  cardHeight: number;
  cardRadius: number;
  images: HeroGalleryImage[];
  position: { x: number; y: number };
  rows: {
    roll: number;
    safetyWidth: number;
  };
  sphere: {
    autoScroll: { duration: number; enabled: boolean; interval: number };
    bendX: number;
    bendY: number;
    depth: number;
    height: number;
    pan: { turns?: number; x: number; y: number };
    rowGap: number;
    rows: HeroSphereRow[];
    width: number;
  };
  type: 'rows' | 'sphere';
}

export interface HeroGalleryRenderState {
  galleryType: 'rows' | 'sphere';
  imageOrder: string[];
  imageSignature: string;
  readyImageIds: string[];
  renderer: 'fallback' | 'webgl';
  pan: { turns: number; x: number; y: number };
  rowSignature: string;
  rows: number;
}

export interface HeroSceneSettings {
  background: string;
  backgroundEnabled: boolean;
  dispersion: HeroDispersionSettings;
  edgeBlur: HeroEdgeBlurSettings;
  effects: HeroEffectsSettings;
  gallery: HeroGallerySettings;
  heading: HeroHeadingSettings;
  pattern: HeroBackgroundPatternSettings;
  perspective: number;
  vanishingPoint: {
    x: number;
    y: number;
  };
}

export const defaultHeroDispersionSettings: HeroDispersionSettings = {
  amount: 200,
  aura: 0.8,
  blur: 22,
  count: 6,
  curve: 1.4,
  edgeFade: 0,
  edgeWidth: 25,
  gateGlow: 0.6,
  gateOffset: 35,
  gateRefraction: 10,
  gateWidth: 116,
  hue: 0,
  spectrum: 0.82,
  turbulence: 0.7,
  turbulenceScale: 130,
  velocity: 0.8,
  warp: 4,
  warpFace: 47,
  warpOffset: 5,
  warpSharpness: 2,
  warpStyle: 'prism',
  warpWave: 18,
  warpWaveBlur: 0,
  warpWaveEnabled: false,
  warpWaveKind: 'glass',
  warpWaveLength: 140,
};

export const defaultHeroEffectsSettings: HeroEffectsSettings = {
  crt: {
    chroma: 5.5,
    enabled: true,
    fade: 0.6,
    flicker: 0.43,
    pitch: 5,
    scanlines: 0.15,
  },
  grain: {
    amount: 0.09,
    enabled: true,
    size: 2.5,
  },
};

export const defaultHeroEdgeBlurSettings: HeroEdgeBlurSettings = {
  enabled: true,
  width: 220,
  strength: 18,
};

export const defaultHeroSceneSettings: HeroSceneSettings = {
  background: '#030303',
  backgroundEnabled: true,
  dispersion: defaultHeroDispersionSettings,
  edgeBlur: defaultHeroEdgeBlurSettings,
  effects: defaultHeroEffectsSettings,
  gallery: {
    cardGap: 24,
    cardHeight: 610,
    cardRadius: 45,
    images: [],
    position: { x: 0, y: 0.02 },
    rows: {
      roll: 42,
      safetyWidth: 694,
    },
    sphere: {
      autoScroll: { duration: 0.3, enabled: true, interval: 4 },
      bendX: 0.5,
      bendY: 0.99,
      depth: 1270,
      height: 520,
      pan: { x: 0.8821207137451461, y: -0.13462165235322487 },
      rowGap: 17,
      rows: [
        { images: [], offset: -101, speed: -4 },
        { images: [], offset: -9, speed: 4 },
        { images: [], offset: -8, speed: -4 },
        { images: [], offset: 0, speed: 4 },
        { images: [], offset: 0, speed: -4 },
        { images: [], offset: 0, speed: 4 },
      ],
      width: 510,
    },
    type: 'sphere',
  },
  heading: {
    badgeColor: '#E6E6E6',
    badgeGap: 28,
    badgeScale: 131,
    badgeShadow: {
      blur: 32,
      colorOpacity: { hex: '#000000', opacity: 25 },
      enabled: true,
      offset: { x: 0, y: 0.125 },
      spread: 4,
    },
    badgeVisible: true,
    color: '#D2FC31',
    cta: {
      backgroundColor: '#E6E6E6',
      fontSize: 22,
      gap: 39,
      horizontalPadding: 32,
      shadow: {
        blur: 16,
        colorOpacity: { hex: '#000000', opacity: 20 },
        enabled: true,
        offset: { x: 0, y: 0.2 },
        spread: 8,
      },
      text: 'See How it Works',
      textColor: '#000000',
      verticalPadding: 20,
    },
    lineGap: -24,
    position: { x: 0, y: -0.16 },
    recraftSize: 137,
    shadow: {
      blur: 51,
      colorOpacity: { hex: '#000000', opacity: 35 },
      enabled: true,
      offset: { x: 0, y: 0.125 },
      spread: 12,
    },
    stylesSize: 149,
    subtitle: {
      fontSize: 32,
      gap: 0,
      shadow: {
        blur: 12,
        colorOpacity: { hex: '#000000', opacity: 40 },
        enabled: true,
        offset: { x: 0, y: 0.125 },
        spread: 1,
      },
    },
  },
  pattern: {
    colorOpacity: { hex: '#FFFFFF', opacity: 5 },
    enabled: true,
    squareSize: 11,
  },
  perspective: 1660,
  vanishingPoint: { x: 50, y: 44 },
};

const numericBounds = {
  autoScrollDuration: [0.15, 2],
  autoScrollInterval: [0.5, 60],
  dispersionAmount: [0, 200],
  dispersionAura: [0, 1],
  dispersionBlur: [0, 48],
  dispersionCount: [6, 48],
  dispersionCurve: [0.5, 3],
  dispersionEdgeFade: [0, 1],
  dispersionEdgeWidth: [0, 50],
  dispersionGateGlow: [0, 1],
  dispersionGateOffset: [0, 50],
  dispersionGateRefraction: [0, 60],
  dispersionGateWidth: [20, 240],
  dispersionHue: [0, 360],
  dispersionSpectrum: [0, 1],
  dispersionTurbulence: [0, 1],
  dispersionTurbulenceScale: [40, 280],
  dispersionVelocity: [0, 1],
  dispersionWarp: [0, 80],
  dispersionWarpFace: [12, 160],
  dispersionWarpOffset: [0, 40],
  dispersionWarpSharpness: [0.4, 4],
  dispersionWarpWave: [0, 48],
  dispersionWarpWaveBlur: [0, 28],
  dispersionWarpWaveLength: [40, 400],
  edgeBlurWidth: [0, 480],
  edgeBlurStrength: [0, 48],
  effectsCrtChroma: [0, 8],
  effectsCrtFade: [0.05, 3],
  effectsCrtFlicker: [0, 1],
  effectsCrtPitch: [2, 16],
  effectsCrtScanlines: [0, 1],
  effectsGrainAmount: [0, 1],
  effectsGrainSize: [1, 8],
  headingBadgeGap: [0, 160],
  headingBadgeScale: [25, 300],
  headingLineGap: [-64, 160],
  headingCtaFontSize: [10, 64],
  headingCtaGap: [0, 160],
  headingCtaHorizontalPadding: [0, 120],
  headingCtaVerticalPadding: [0, 80],
  headingPosition: [-1, 1],
  headingSize: [32, 200],
  headingSubtitleFontSize: [10, 64],
  headingSubtitleGap: [0, 160],
  heroShadowBlur: [0, 100],
  heroShadowOffset: [-1, 1],
  heroShadowOpacity: [0, 100],
  heroShadowSpread: [-32, 32],
  galleryGap: [-240, 160],
  galleryCardRadius: [0, 160],
  galleryImageSize: [0, 16384],
  galleryPosition: [-1, 1],
  patternOpacity: [0, 100],
  patternSquareSize: [4, 160],
  perspective: [200, 2400],
  galleryCardHeight: [80, 1080],
  rowsRoll: [0, 85],
  rowsSafetyWidth: [320, 1440],
  spherePan: [-1, 1],
  spherePanTurns: [-1000, 1000],
  sphereBend: [-1, 1],
  sphereRowGap: [-200, 400],
  sphereRowOffset: [-180, 180],
  sphereRowSpeed: [-45, 45],
  sphereSize: [200, 6000],
  vanishingPointX: [15, 85],
  vanishingPointY: [15, 85],
} as const;

function clampNumber(
  value: unknown,
  [minimum, maximum]: readonly [number, number],
  fallback: number,
) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

function normalizeColor(value: unknown, fallback: string) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toUpperCase()
    : fallback;
}

function normalizeSingleLineText(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.replace(/\s+/g, ' ').trim().slice(0, 80);
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeHeroShadowSettings(
  value: unknown,
  fallback: HeroShadowSettings,
): HeroShadowSettings {
  const input =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const colorOpacity =
    typeof input.colorOpacity === 'object' &&
    input.colorOpacity !== null &&
    !Array.isArray(input.colorOpacity)
      ? (input.colorOpacity as Record<string, unknown>)
      : {};
  const offset =
    typeof input.offset === 'object' && input.offset !== null && !Array.isArray(input.offset)
      ? (input.offset as Record<string, unknown>)
      : {};

  return {
    blur: clampNumber(input.blur, numericBounds.heroShadowBlur, fallback.blur),
    colorOpacity: {
      hex: normalizeColor(colorOpacity.hex, fallback.colorOpacity.hex),
      opacity: clampNumber(
        colorOpacity.opacity,
        numericBounds.heroShadowOpacity,
        fallback.colorOpacity.opacity,
      ),
    },
    enabled: typeof input.enabled === 'boolean' ? input.enabled : fallback.enabled,
    offset: {
      x: clampNumber(offset.x, numericBounds.heroShadowOffset, fallback.offset.x),
      y: clampNumber(offset.y, numericBounds.heroShadowOffset, fallback.offset.y),
    },
    spread: clampNumber(input.spread, numericBounds.heroShadowSpread, fallback.spread),
  };
}

function normalizeGalleryImageTransform(value: unknown): HeroGalleryImageTransform {
  const transform =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const rotationDeg =
    transform.rotationDeg === 90 || transform.rotationDeg === 180 || transform.rotationDeg === 270
      ? transform.rotationDeg
      : 0;

  return {
    flipHorizontal: transform.flipHorizontal === true,
    flipVertical: transform.flipVertical === true,
    rotationDeg,
  };
}

function normalizeGalleryImages(
  value: unknown,
  maximum = 24,
  dedupeById = false,
  seenIds?: Set<string>,
): HeroGalleryImage[] {
  if (!Array.isArray(value)) return [];

  const ids = seenIds ?? new Set<string>();
  const images: HeroGalleryImage[] = [];
  for (const candidate of value) {
    if (images.length >= maximum) break;
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) continue;
    const image = candidate as Record<string, unknown>;
    if (
      typeof image.id !== 'string' ||
      image.id.length === 0 ||
      typeof image.ref !== 'string' ||
      image.ref.length === 0
    ) {
      continue;
    }

    if (dedupeById && ids.has(image.id)) continue;
    if (dedupeById) ids.add(image.id);

    images.push({
      height: clampNumber(image.height, numericBounds.galleryImageSize, 0),
      id: image.id,
      ref: image.ref,
      transform: normalizeGalleryImageTransform(image.transform),
      width: clampNumber(image.width, numericBounds.galleryImageSize, 0),
    });
  }
  return images;
}

function normalizeSphereRows(value: unknown): HeroSphereRow[] {
  if (!Array.isArray(value)) return [...defaultHeroSceneSettings.gallery.sphere.rows];

  const seenImageIds = new Set<string>();
  const rows = value.slice(0, 6).flatMap((candidate) => {
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) return [];
    const row = candidate as Record<string, unknown>;
    return [
      {
        images: normalizeGalleryImages(row.images, 8, true, seenImageIds),
        offset: clampNumber(row.offset, numericBounds.sphereRowOffset, 0),
        speed: clampNumber(row.speed, numericBounds.sphereRowSpeed, 3),
      },
    ];
  });

  return rows.length > 0 ? rows : [...defaultHeroSceneSettings.gallery.sphere.rows];
}

function normalizeHeroGallerySettings(value: unknown): HeroGallerySettings {
  const input =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const position =
    typeof input.position === 'object' && input.position !== null && !Array.isArray(input.position)
      ? (input.position as Record<string, unknown>)
      : {};
  const rows =
    typeof input.rows === 'object' && input.rows !== null && !Array.isArray(input.rows)
      ? (input.rows as Record<string, unknown>)
      : {};
  const sphere =
    typeof input.sphere === 'object' && input.sphere !== null && !Array.isArray(input.sphere)
      ? (input.sphere as Record<string, unknown>)
      : {};
  const pan =
    typeof sphere.pan === 'object' && sphere.pan !== null && !Array.isArray(sphere.pan)
      ? (sphere.pan as Record<string, unknown>)
      : {};
  const autoScroll =
    typeof sphere.autoScroll === 'object' &&
    sphere.autoScroll !== null &&
    !Array.isArray(sphere.autoScroll)
      ? (sphere.autoScroll as Record<string, unknown>)
      : {};
  const fallback = defaultHeroSceneSettings.gallery;
  const width = clampNumber(sphere.width, numericBounds.sphereSize, fallback.sphere.width);
  const panTurns = Number.isInteger(pan.turns)
    ? clampNumber(pan.turns, numericBounds.spherePanTurns, 0)
    : null;

  return {
    cardGap: clampNumber(input.cardGap, numericBounds.galleryGap, fallback.cardGap),
    cardHeight: clampNumber(
      input.cardHeight ?? rows.cardHeight,
      numericBounds.galleryCardHeight,
      fallback.cardHeight,
    ),
    cardRadius: clampNumber(input.cardRadius, numericBounds.galleryCardRadius, fallback.cardRadius),
    images: normalizeGalleryImages(input.images),
    position: {
      x: clampNumber(position.x, numericBounds.galleryPosition, fallback.position.x),
      y: clampNumber(position.y, numericBounds.galleryPosition, fallback.position.y),
    },
    rows: {
      roll: clampNumber(rows.roll, numericBounds.rowsRoll, fallback.rows.roll),
      safetyWidth: clampNumber(
        rows.safetyWidth,
        numericBounds.rowsSafetyWidth,
        fallback.rows.safetyWidth,
      ),
    },
    sphere: {
      autoScroll: {
        duration: clampNumber(
          autoScroll.duration,
          numericBounds.autoScrollDuration,
          fallback.sphere.autoScroll.duration,
        ),
        enabled:
          typeof autoScroll.enabled === 'boolean'
            ? autoScroll.enabled
            : fallback.sphere.autoScroll.enabled,
        interval: clampNumber(
          autoScroll.interval,
          numericBounds.autoScrollInterval,
          fallback.sphere.autoScroll.interval,
        ),
      },
      bendX: clampNumber(sphere.bendX, numericBounds.sphereBend, fallback.sphere.bendX),
      bendY: clampNumber(sphere.bendY, numericBounds.sphereBend, fallback.sphere.bendY),
      depth: clampNumber(sphere.depth, numericBounds.sphereSize, width),
      height: clampNumber(sphere.height, numericBounds.sphereSize, fallback.sphere.height),
      pan: {
        x: clampNumber(pan.x, numericBounds.spherePan, fallback.sphere.pan.x),
        y: clampNumber(pan.y, numericBounds.spherePan, fallback.sphere.pan.y),
        ...(panTurns === null ? {} : { turns: panTurns }),
      },
      rowGap: clampNumber(sphere.rowGap, numericBounds.sphereRowGap, fallback.sphere.rowGap),
      rows: normalizeSphereRows(sphere.rows),
      width,
    },
    type: input.type === 'sphere' ? 'sphere' : 'rows',
  };
}

function normalizeHeroDispersionSettings(value: unknown): HeroDispersionSettings {
  const input =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const fallback = defaultHeroDispersionSettings;

  return {
    amount: clampNumber(input.amount, numericBounds.dispersionAmount, fallback.amount),
    aura: clampNumber(input.aura, numericBounds.dispersionAura, fallback.aura),
    blur: clampNumber(input.blur, numericBounds.dispersionBlur, fallback.blur),
    count: clampNumber(input.count, numericBounds.dispersionCount, fallback.count),
    curve: clampNumber(input.curve, numericBounds.dispersionCurve, fallback.curve),
    edgeFade: clampNumber(input.edgeFade, numericBounds.dispersionEdgeFade, fallback.edgeFade),
    edgeWidth: clampNumber(input.edgeWidth, numericBounds.dispersionEdgeWidth, fallback.edgeWidth),
    gateGlow: clampNumber(input.gateGlow, numericBounds.dispersionGateGlow, fallback.gateGlow),
    gateOffset: clampNumber(
      input.gateOffset,
      numericBounds.dispersionGateOffset,
      fallback.gateOffset,
    ),
    gateRefraction: clampNumber(
      input.gateRefraction,
      numericBounds.dispersionGateRefraction,
      fallback.gateRefraction,
    ),
    gateWidth: clampNumber(input.gateWidth, numericBounds.dispersionGateWidth, fallback.gateWidth),
    hue: clampNumber(input.hue, numericBounds.dispersionHue, fallback.hue),
    spectrum: clampNumber(input.spectrum, numericBounds.dispersionSpectrum, fallback.spectrum),
    turbulence: clampNumber(
      input.turbulence,
      numericBounds.dispersionTurbulence,
      fallback.turbulence,
    ),
    turbulenceScale: clampNumber(
      input.turbulenceScale,
      numericBounds.dispersionTurbulenceScale,
      fallback.turbulenceScale,
    ),
    velocity: clampNumber(input.velocity, numericBounds.dispersionVelocity, fallback.velocity),
    warp: clampNumber(input.warp, numericBounds.dispersionWarp, fallback.warp),
    warpFace: clampNumber(input.warpFace, numericBounds.dispersionWarpFace, fallback.warpFace),
    warpOffset: clampNumber(
      input.warpOffset,
      numericBounds.dispersionWarpOffset,
      fallback.warpOffset,
    ),
    warpSharpness: clampNumber(
      input.warpSharpness,
      numericBounds.dispersionWarpSharpness,
      fallback.warpSharpness,
    ),
    warpStyle: input.warpStyle === 'prism' ? 'prism' : 'stretch',
    warpWave: clampNumber(input.warpWave, numericBounds.dispersionWarpWave, fallback.warpWave),
    warpWaveBlur: clampNumber(
      input.warpWaveBlur,
      numericBounds.dispersionWarpWaveBlur,
      fallback.warpWaveBlur,
    ),
    warpWaveEnabled:
      typeof input.warpWaveEnabled === 'boolean' ? input.warpWaveEnabled : fallback.warpWaveEnabled,
    warpWaveKind: input.warpWaveKind === 'ripple' ? 'ripple' : 'glass',
    warpWaveLength: clampNumber(
      input.warpWaveLength,
      numericBounds.dispersionWarpWaveLength,
      fallback.warpWaveLength,
    ),
  };
}

function normalizeHeroEffectsSettings(value: unknown): HeroEffectsSettings {
  const input =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const crt =
    typeof input.crt === 'object' && input.crt !== null && !Array.isArray(input.crt)
      ? (input.crt as Record<string, unknown>)
      : {};
  const grain =
    typeof input.grain === 'object' && input.grain !== null && !Array.isArray(input.grain)
      ? (input.grain as Record<string, unknown>)
      : {};
  const fallback = defaultHeroEffectsSettings;

  return {
    crt: {
      chroma: clampNumber(crt.chroma, numericBounds.effectsCrtChroma, fallback.crt.chroma),
      enabled: typeof crt.enabled === 'boolean' ? crt.enabled : fallback.crt.enabled,
      fade: clampNumber(crt.fade, numericBounds.effectsCrtFade, fallback.crt.fade),
      flicker: clampNumber(crt.flicker, numericBounds.effectsCrtFlicker, fallback.crt.flicker),
      pitch: clampNumber(crt.pitch, numericBounds.effectsCrtPitch, fallback.crt.pitch),
      scanlines: clampNumber(
        crt.scanlines,
        numericBounds.effectsCrtScanlines,
        fallback.crt.scanlines,
      ),
    },
    grain: {
      amount: clampNumber(grain.amount, numericBounds.effectsGrainAmount, fallback.grain.amount),
      enabled: typeof grain.enabled === 'boolean' ? grain.enabled : fallback.grain.enabled,
      size: clampNumber(grain.size, numericBounds.effectsGrainSize, fallback.grain.size),
    },
  };
}

function normalizeHeroEdgeBlurSettings(value: unknown): HeroEdgeBlurSettings {
  const input =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const fallback = defaultHeroEdgeBlurSettings;

  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : fallback.enabled,
    width: clampNumber(input.width, numericBounds.edgeBlurWidth, fallback.width),
    strength: clampNumber(input.strength, numericBounds.edgeBlurStrength, fallback.strength),
  };
}

export function normalizeHeroSceneSettings(value: unknown): HeroSceneSettings | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  const heading =
    typeof input.heading === 'object' && input.heading !== null
      ? (input.heading as Record<string, unknown>)
      : {};
  const headingPosition =
    typeof heading.position === 'object' && heading.position !== null
      ? (heading.position as Record<string, unknown>)
      : {};
  const headingCta =
    typeof heading.cta === 'object' && heading.cta !== null && !Array.isArray(heading.cta)
      ? (heading.cta as Record<string, unknown>)
      : {};
  const headingCtaShadow = normalizeHeroShadowSettings(
    headingCta.shadow,
    defaultHeroSceneSettings.heading.cta.shadow,
  );
  const headingBadgeShadow = normalizeHeroShadowSettings(
    heading.badgeShadow,
    defaultHeroSceneSettings.heading.badgeShadow,
  );
  const headingShadow = normalizeHeroShadowSettings(
    heading.shadow,
    defaultHeroSceneSettings.heading.shadow,
  );
  const headingSubtitle =
    typeof heading.subtitle === 'object' &&
    heading.subtitle !== null &&
    !Array.isArray(heading.subtitle)
      ? (heading.subtitle as Record<string, unknown>)
      : {};
  const headingSubtitleShadow = normalizeHeroShadowSettings(
    headingSubtitle.shadow,
    defaultHeroSceneSettings.heading.subtitle.shadow,
  );
  const pattern =
    typeof input.pattern === 'object' && input.pattern !== null
      ? (input.pattern as Record<string, unknown>)
      : {};
  const patternColorOpacity =
    typeof pattern.colorOpacity === 'object' && pattern.colorOpacity !== null
      ? (pattern.colorOpacity as Record<string, unknown>)
      : {};
  const vanishingPoint =
    typeof input.vanishingPoint === 'object' && input.vanishingPoint !== null
      ? (input.vanishingPoint as Record<string, unknown>)
      : {};

  return {
    background: normalizeColor(input.background, defaultHeroSceneSettings.background),
    backgroundEnabled:
      typeof input.backgroundEnabled === 'boolean'
        ? input.backgroundEnabled
        : defaultHeroSceneSettings.backgroundEnabled,
    dispersion: normalizeHeroDispersionSettings(input.dispersion),
    edgeBlur: normalizeHeroEdgeBlurSettings(input.edgeBlur),
    effects: normalizeHeroEffectsSettings(input.effects),
    gallery: normalizeHeroGallerySettings(input.gallery),
    heading: {
      badgeColor: normalizeColor(heading.badgeColor, defaultHeroSceneSettings.heading.badgeColor),
      badgeGap: clampNumber(
        heading.badgeGap,
        numericBounds.headingBadgeGap,
        defaultHeroSceneSettings.heading.badgeGap,
      ),
      badgeScale: clampNumber(
        heading.badgeScale,
        numericBounds.headingBadgeScale,
        defaultHeroSceneSettings.heading.badgeScale,
      ),
      badgeShadow: headingBadgeShadow,
      badgeVisible:
        typeof heading.badgeVisible === 'boolean'
          ? heading.badgeVisible
          : defaultHeroSceneSettings.heading.badgeVisible,
      color: normalizeColor(heading.color, defaultHeroSceneSettings.heading.color),
      cta: {
        backgroundColor: normalizeColor(
          headingCta.backgroundColor,
          defaultHeroSceneSettings.heading.cta.backgroundColor,
        ),
        fontSize: clampNumber(
          headingCta.fontSize,
          numericBounds.headingCtaFontSize,
          defaultHeroSceneSettings.heading.cta.fontSize,
        ),
        gap: clampNumber(
          headingCta.gap,
          numericBounds.headingCtaGap,
          defaultHeroSceneSettings.heading.cta.gap,
        ),
        horizontalPadding: clampNumber(
          headingCta.horizontalPadding,
          numericBounds.headingCtaHorizontalPadding,
          defaultHeroSceneSettings.heading.cta.horizontalPadding,
        ),
        shadow: headingCtaShadow,
        text: normalizeSingleLineText(headingCta.text, defaultHeroSceneSettings.heading.cta.text),
        textColor: normalizeColor(
          headingCta.textColor,
          defaultHeroSceneSettings.heading.cta.textColor,
        ),
        verticalPadding: clampNumber(
          headingCta.verticalPadding,
          numericBounds.headingCtaVerticalPadding,
          defaultHeroSceneSettings.heading.cta.verticalPadding,
        ),
      },
      lineGap: clampNumber(
        heading.lineGap,
        numericBounds.headingLineGap,
        defaultHeroSceneSettings.heading.lineGap,
      ),
      position: {
        x: clampNumber(
          headingPosition.x,
          numericBounds.headingPosition,
          defaultHeroSceneSettings.heading.position.x,
        ),
        y: clampNumber(
          headingPosition.y,
          numericBounds.headingPosition,
          defaultHeroSceneSettings.heading.position.y,
        ),
      },
      recraftSize: clampNumber(
        heading.recraftSize,
        numericBounds.headingSize,
        defaultHeroSceneSettings.heading.recraftSize,
      ),
      shadow: headingShadow,
      stylesSize: clampNumber(
        heading.stylesSize,
        numericBounds.headingSize,
        defaultHeroSceneSettings.heading.stylesSize,
      ),
      subtitle: {
        fontSize: clampNumber(
          headingSubtitle.fontSize,
          numericBounds.headingSubtitleFontSize,
          defaultHeroSceneSettings.heading.subtitle.fontSize,
        ),
        gap: clampNumber(
          headingSubtitle.gap,
          numericBounds.headingSubtitleGap,
          defaultHeroSceneSettings.heading.subtitle.gap,
        ),
        shadow: headingSubtitleShadow,
      },
    },
    pattern: {
      colorOpacity: {
        hex: normalizeColor(
          patternColorOpacity.hex,
          defaultHeroSceneSettings.pattern.colorOpacity.hex,
        ),
        opacity: clampNumber(
          patternColorOpacity.opacity,
          numericBounds.patternOpacity,
          defaultHeroSceneSettings.pattern.colorOpacity.opacity,
        ),
      },
      enabled:
        typeof pattern.enabled === 'boolean'
          ? pattern.enabled
          : defaultHeroSceneSettings.pattern.enabled,
      squareSize: clampNumber(
        pattern.squareSize,
        numericBounds.patternSquareSize,
        defaultHeroSceneSettings.pattern.squareSize,
      ),
    },
    perspective: clampNumber(
      input.perspective,
      numericBounds.perspective,
      defaultHeroSceneSettings.perspective,
    ),
    vanishingPoint: {
      x: clampNumber(
        vanishingPoint.x,
        numericBounds.vanishingPointX,
        defaultHeroSceneSettings.vanishingPoint.x,
      ),
      y: clampNumber(
        vanishingPoint.y,
        numericBounds.vanishingPointY,
        defaultHeroSceneSettings.vanishingPoint.y,
      ),
    },
  };
}

export const appliedHeroSceneSettings =
  normalizeHeroSceneSettings(appliedHeroSceneSettingsSource) ?? defaultHeroSceneSettings;

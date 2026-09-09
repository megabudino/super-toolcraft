import type { ToolcraftMediaAsset } from "@/toolcraft/runtime";

import { HERO_WEBSITE_DEFAULTS } from "./hero-website-defaults";

export const heroGalleryTargets = {
  autoScrollDuration: "sphere.autoScroll.duration",
  autoScrollEnabled: "sphere.autoScroll.enabled",
  autoScrollInterval: "sphere.autoScroll.interval",
  cardHeight: "cards.height",
  cardRadius: "cards.radius",
  gap: "cards.gap",
  images: "gallery.images",
  position: "gallery.position.v2",
  pan: "sphere.pan",
  rowImages0: "sphere.rowImages.0",
  rowImages1: "sphere.rowImages.1",
  rowImages2: "sphere.rowImages.2",
  rowImages3: "sphere.rowImages.3",
  rowImages4: "sphere.rowImages.4",
  rowImages5: "sphere.rowImages.5",
  roll: "cards.roll",
  rowGap: "sphere.rowGap",
  safetyWidth: "cards.safetyWidth",
  sphereBendX: "sphere.bendX",
  sphereBendY: "sphere.bendY",
  sphereDepth: "sphere.depth",
  sphereHeight: "sphere.height",
  sphereRows: "sphere.rows",
  sphereWidth: "sphere.width",
  type: "gallery.type",
} as const;

export const heroSphereRowImageTargets = [
  heroGalleryTargets.rowImages0,
  heroGalleryTargets.rowImages1,
  heroGalleryTargets.rowImages2,
  heroGalleryTargets.rowImages3,
  heroGalleryTargets.rowImages4,
  heroGalleryTargets.rowImages5,
] as const;

export const heroGalleryMediaTargets = [
  heroGalleryTargets.images,
  ...heroSphereRowImageTargets,
] as const;

export type HeroGalleryImageTransform = Readonly<{
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotationDeg: 0 | 90 | 180 | 270;
}>;

export type HeroGalleryImage = Readonly<{
  height: number;
  id: string;
  ref: string;
  transform: HeroGalleryImageTransform;
  width: number;
}>;

export type HeroSphereRow = Readonly<{
  images: readonly HeroGalleryImage[];
  offset: number;
  speed: number;
}>;

export type HeroGalleryPan = Readonly<{ x: number; y: number }>;

export type HeroGallerySettings = Readonly<{
  cardGap: number;
  cardHeight: number;
  cardRadius: number;
  images: readonly HeroGalleryImage[];
  position: Readonly<{ x: number; y: number }>;
  rows: Readonly<{
    roll: number;
    safetyWidth: number;
  }>;
  sphere: Readonly<{
    autoScroll: Readonly<{
      duration: number;
      enabled: boolean;
      interval: number;
    }>;
    bendX: number;
    bendY: number;
    depth: number;
    height: number;
    pan: HeroGalleryPan;
    rowGap: number;
    rows: readonly HeroSphereRow[];
    width: number;
  }>;
  type: "rows" | "sphere";
}>;

export const HERO_SPHERE_ROW_DEFAULT: HeroSphereRow = {
  images: [],
  offset: 0,
  speed: 3,
};

export const HERO_SPHERE_ROWS_DEFAULT: readonly HeroSphereRow[] =
  HERO_WEBSITE_DEFAULTS.gallery.sphere.rows;

export const HERO_GALLERY_DEFAULTS: HeroGallerySettings =
  HERO_WEBSITE_DEFAULTS.gallery;

function clampNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
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
    x: clampNumber(vector.x, -1, 1, fallback.x),
    y: clampNumber(vector.y, -1, 1, fallback.y),
  };
}

export function sphereRowsValue(value: unknown): readonly HeroSphereRow[] {
  if (!Array.isArray(value)) {
    return HERO_GALLERY_DEFAULTS.sphere.rows;
  }

  const rows = value.slice(0, 6).flatMap((candidate) => {
    if (
      typeof candidate !== "object" ||
      candidate === null ||
      Array.isArray(candidate)
    ) {
      return [];
    }

    const row = candidate as Record<string, unknown>;
    return [
      {
        images: [],
        offset: clampNumber(
          row.offset,
          -180,
          180,
          HERO_SPHERE_ROW_DEFAULT.offset,
        ),
        speed: clampNumber(row.speed, -45, 45, HERO_SPHERE_ROW_DEFAULT.speed),
      },
    ];
  });

  return rows.length > 0 ? rows : HERO_GALLERY_DEFAULTS.sphere.rows;
}

function normalizeRotation(value: unknown): 0 | 90 | 180 | 270 {
  return value === 90 || value === 180 || value === 270 ? value : 0;
}

export function createHeroGalleryImagesFromMediaAssets(
  mediaAssets: readonly ToolcraftMediaAsset[],
  sourceTarget: string = heroGalleryTargets.images,
): readonly HeroGalleryImage[] {
  return mediaAssets.flatMap((asset) => {
    if (
      asset.assetKind !== "image" ||
      asset.sourceTarget !== sourceTarget ||
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

export function createHeroSphereRowImagesFromMediaAssets(
  mediaAssets: readonly ToolcraftMediaAsset[],
): readonly (readonly HeroGalleryImage[])[] {
  return heroSphereRowImageTargets.map((sourceTarget) =>
    createHeroGalleryImagesFromMediaAssets(mediaAssets, sourceTarget),
  );
}

function assignSphereRowImages(
  rows: readonly HeroSphereRow[],
  legacyImages: readonly HeroGalleryImage[],
  rowImages: readonly (readonly HeroGalleryImage[])[],
): readonly HeroSphereRow[] {
  const boundedRowImages = rowImages
    .slice(0, heroSphereRowImageTargets.length)
    .map((images) => images.slice(0, 8));
  const hasPerRowImages = boundedRowImages.some((images) => images.length > 0);

  if (hasPerRowImages) {
    return rows.map((row, rowIndex) => ({
      ...row,
      images: boundedRowImages[rowIndex] ?? [],
    }));
  }

  return rows.map((row, rowIndex) => ({
    ...row,
    images: legacyImages.filter(
      (_image, imageIndex) => imageIndex % rows.length === rowIndex,
    ),
  }));
}

export function createHeroGallerySettingsFromValues(
  values: Readonly<Record<string, unknown>>,
  images: readonly HeroGalleryImage[] = [],
  rowImages: readonly (readonly HeroGalleryImage[])[] = [],
): HeroGallerySettings {
  const position = vectorValue(
    values[heroGalleryTargets.position],
    HERO_GALLERY_DEFAULTS.position,
  );
  const pan = vectorValue(
    values[heroGalleryTargets.pan],
    HERO_GALLERY_DEFAULTS.sphere.pan,
  );
  const autoScrollEnabled = values[heroGalleryTargets.autoScrollEnabled];

  return {
    cardGap: clampNumber(
      values[heroGalleryTargets.gap],
      -240,
      160,
      HERO_GALLERY_DEFAULTS.cardGap,
    ),
    cardHeight: clampNumber(
      values[heroGalleryTargets.cardHeight],
      80,
      1080,
      HERO_GALLERY_DEFAULTS.cardHeight,
    ),
    cardRadius: clampNumber(
      values[heroGalleryTargets.cardRadius],
      0,
      160,
      HERO_GALLERY_DEFAULTS.cardRadius,
    ),
    images: images.slice(0, 24),
    position,
    rows: {
      roll: clampNumber(
        values[heroGalleryTargets.roll],
        0,
        85,
        HERO_GALLERY_DEFAULTS.rows.roll,
      ),
      safetyWidth: clampNumber(
        values[heroGalleryTargets.safetyWidth],
        320,
        1440,
        HERO_GALLERY_DEFAULTS.rows.safetyWidth,
      ),
    },
    sphere: {
      autoScroll: {
        duration: clampNumber(
          values[heroGalleryTargets.autoScrollDuration],
          0.15,
          2,
          HERO_GALLERY_DEFAULTS.sphere.autoScroll.duration,
        ),
        enabled:
          typeof autoScrollEnabled === "boolean"
            ? autoScrollEnabled
            : HERO_GALLERY_DEFAULTS.sphere.autoScroll.enabled,
        interval: clampNumber(
          values[heroGalleryTargets.autoScrollInterval],
          0.5,
          60,
          HERO_GALLERY_DEFAULTS.sphere.autoScroll.interval,
        ),
      },
      bendX:
        clampNumber(
          values[heroGalleryTargets.sphereBendX],
          -100,
          100,
          HERO_GALLERY_DEFAULTS.sphere.bendX * 100,
        ) / 100,
      bendY:
        clampNumber(
          values[heroGalleryTargets.sphereBendY],
          -100,
          100,
          HERO_GALLERY_DEFAULTS.sphere.bendY * 100,
        ) / 100,
      depth: clampNumber(
        values[heroGalleryTargets.sphereDepth],
        200,
        6000,
        HERO_GALLERY_DEFAULTS.sphere.depth,
      ),
      height: clampNumber(
        values[heroGalleryTargets.sphereHeight],
        200,
        6000,
        HERO_GALLERY_DEFAULTS.sphere.height,
      ),
      pan,
      rowGap: clampNumber(
        values[heroGalleryTargets.rowGap],
        -200,
        400,
        HERO_GALLERY_DEFAULTS.sphere.rowGap,
      ),
      rows: assignSphereRowImages(
        sphereRowsValue(values[heroGalleryTargets.sphereRows]),
        images.slice(0, 24),
        rowImages,
      ),
      width: clampNumber(
        values[heroGalleryTargets.sphereWidth],
        200,
        6000,
        HERO_GALLERY_DEFAULTS.sphere.width,
      ),
    },
    type: values[heroGalleryTargets.type] === "rows" ? "rows" : "sphere",
  };
}

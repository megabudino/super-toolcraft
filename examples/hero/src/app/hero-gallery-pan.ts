import {
  HERO_GALLERY_DEFAULTS,
  heroGalleryTargets,
  type HeroGalleryPan,
} from "./hero-gallery-values";

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

export function wrapHeroGalleryPanUnit(value: number): number {
  return ((value + 1) % 2 + 2) % 2 - 1;
}

export function getHeroGalleryPanelPeriod({
  cardHeight,
  rowCount,
  rowGap,
}: {
  cardHeight: number;
  rowCount: number;
  rowGap: number;
}): number {
  const safeHeight = Math.max(1, cardHeight);
  const pitch = Math.max(safeHeight + rowGap, safeHeight / 2);

  // Keep this formula aligned with getHeroPanelPeriod on the website.
  return Math.max(1, Math.floor(rowCount)) * pitch;
}

export function applyHeroGalleryPanDrag({
  deltaPx,
  panelPeriod,
  sphereWidth,
  start,
}: {
  deltaPx: Readonly<{ x: number; y: number }>;
  panelPeriod: number;
  sphereWidth: number;
  start: HeroGalleryPan;
}): HeroGalleryPan {
  return {
    x: wrapHeroGalleryPanUnit(
      start.x + deltaPx.x / (Math.PI * Math.max(1, sphereWidth)),
    ),
    y: wrapHeroGalleryPanUnit(
      start.y + deltaPx.y / Math.max(1, panelPeriod / 2),
    ),
  };
}

export function readHeroGalleryPanDragInputs(
  values: Readonly<Record<string, unknown>>,
): {
  panelPeriod: number;
  sphereWidth: number;
  type: "rows" | "sphere";
} {
  const cardHeight = clampNumber(
    values[heroGalleryTargets.cardHeight],
    80,
    1080,
    HERO_GALLERY_DEFAULTS.cardHeight,
  );
  const rowGap = clampNumber(
    values[heroGalleryTargets.rowGap],
    -200,
    400,
    HERO_GALLERY_DEFAULTS.sphere.rowGap,
  );
  const rowsValue = values[heroGalleryTargets.sphereRows];
  const rows = Array.isArray(rowsValue)
    ? rowsValue.slice(0, 6)
    : HERO_GALLERY_DEFAULTS.sphere.rows;

  return {
    panelPeriod: getHeroGalleryPanelPeriod({
      cardHeight,
      rowCount: Math.max(1, rows.length),
      rowGap,
    }),
    sphereWidth: clampNumber(
      values[heroGalleryTargets.sphereWidth],
      200,
      6000,
      HERO_GALLERY_DEFAULTS.sphere.width,
    ),
    type: values[heroGalleryTargets.type] === "rows" ? "rows" : "sphere",
  };
}

export interface HeroGalleryPan {
  x: number;
  y: number;
}

export function wrapHeroGalleryPanUnit(value: number): number {
  return ((((value + 1) % 2) + 2) % 2) - 1;
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
  start: Readonly<HeroGalleryPan>;
}): HeroGalleryPan {
  return {
    x: wrapHeroGalleryPanUnit(start.x + deltaPx.x / (Math.PI * Math.max(1, sphereWidth))),
    y: wrapHeroGalleryPanUnit(start.y + deltaPx.y / Math.max(1, panelPeriod / 2)),
  };
}

export function applyHeroGalleryPanClick({
  clickPx,
  panelPeriod,
  progress = 1,
  sphereWidth,
  start,
  viewportSize,
}: {
  clickPx: Readonly<{ x: number; y: number }>;
  panelPeriod: number;
  progress?: number;
  sphereWidth: number;
  start: Readonly<HeroGalleryPan>;
  viewportSize: Readonly<{ height: number; width: number }>;
}): HeroGalleryPan {
  const clampedProgress = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  return applyHeroGalleryPanDrag({
    deltaPx: {
      x: (viewportSize.width / 2 - clickPx.x) * clampedProgress,
      y: (viewportSize.height / 2 - clickPx.y) * clampedProgress,
    },
    panelPeriod,
    sphereWidth,
    start,
  });
}

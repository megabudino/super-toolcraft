import { getHeroGallerySourceAspect, type HeroGalleryImageSource } from './hero-gallery-sources';
import type { HeroSphereRow } from './hero-scene-settings';

const degreesToRadians = Math.PI / 180;
const maximumCardsPerFrame = 96;
const maximumVerticalCopiesPerRow = 12;
const maximumLatitude = 85 * degreesToRadians;
export const HERO_LENS_NEAR = 8;

export interface HeroLensProjectionParams {
  bendX: number;
  bendY: number;
  focal: number;
  near: number;
  phi0: number;
  principal: { x: number; y: number };
  rx: number;
  ry: number;
  rz: number;
  theta0: number;
}

export interface HeroSphereLayoutCard {
  arcWidth: number;
  centerX: number;
  centerY: number;
  copy: number;
  cycle: number;
  depth: number;
  order: number;
  phiCenter: number;
  rowIndex: number;
  side: -1 | 1;
  sourceIndex: number;
  thetaCenter: number;
}

export interface HeroSphereGalleryLayout {
  cards: HeroSphereLayoutCard[];
  periods: number[];
}

export function getHeroPanelPitch(cardHeight: number, rowGap: number) {
  const safeHeight = Math.max(1, cardHeight);
  return Math.max(safeHeight + rowGap, safeHeight / 2);
}

export function getHeroPanelPeriod(rowCount: number, pitch: number) {
  // Keep this formula aligned with getHeroGalleryPanelPeriod in Toolcraft.
  return Math.max(1, Math.floor(rowCount)) * Math.max(1, pitch);
}

export function getHeroPanelRowCenters(rowCount: number, pitch: number) {
  return Array.from(
    { length: Math.max(1, Math.floor(rowCount)) },
    (_, rowIndex) => (rowIndex - (rowCount - 1) / 2) * pitch,
  );
}

export function getHeroLensOrigin({
  pan,
  period,
  ry,
  turns,
}: {
  pan: Readonly<{ x: number; y: number }>;
  period: number;
  ry: number;
  turns: number;
}) {
  return {
    phi0: (-pan.y * (period / 2)) / Math.max(1, ry),
    theta0: (pan.x + 2 * turns) * Math.PI,
  };
}

export function projectHeroLensPoint(
  u: number,
  v: number,
  params: HeroLensProjectionParams,
): { w: number; x: number; y: number; z: number } {
  const theta = u / Math.max(1, params.rx) + params.theta0;
  const phi = params.phi0 - v / Math.max(1, params.ry);
  const x = params.rx * Math.sin(theta);
  const y = params.ry * Math.sin(phi);
  const z = params.rz * (params.bendX * (1 - Math.cos(theta)) + params.bendY * (1 - Math.cos(phi)));
  const w = params.focal - z;
  const scale = params.focal / Math.max(w, params.near);

  return {
    w,
    x: params.principal.x + x * scale,
    y: params.principal.y - y * scale,
    z,
  };
}

function cardIntersectsViewport({
  arcWidth,
  bleed,
  cardHeight,
  projection,
  uCenter,
  vCenter,
  viewport,
}: {
  arcWidth: number;
  bleed: { horizontal: number; vertical: number };
  cardHeight: number;
  projection: HeroLensProjectionParams;
  uCenter: number;
  vCenter: number;
  viewport: { height: number; width: number };
}) {
  const halfWidth = arcWidth / 2 + bleed.horizontal;
  const halfHeight = cardHeight / 2 + bleed.vertical;
  const samples = [
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [-halfWidth, halfHeight],
    [halfWidth, halfHeight],
    [0, -halfHeight],
    [0, halfHeight],
    [-halfWidth, 0],
    [halfWidth, 0],
  ] as const;
  const points = samples.map(([uOffset, vOffset]) =>
    projectHeroLensPoint(uCenter + uOffset, vCenter + vOffset, projection),
  );

  if (points.every((point) => point.w <= projection.near)) return false;
  if (points.some((point) => point.w <= projection.near)) return true;

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return (
    Math.min(...xs) <= viewport.width + bleed.horizontal &&
    Math.max(...xs) >= -bleed.horizontal &&
    Math.min(...ys) <= viewport.height + bleed.vertical &&
    Math.max(...ys) >= -bleed.vertical
  );
}

function getLimitedCycleRange({
  baseV,
  cardHeight,
  panelPeriod,
  phi0,
  ry,
}: {
  baseV: number;
  cardHeight: number;
  panelPeriod: number;
  phi0: number;
  ry: number;
}): readonly [number, number] | null {
  const halfHeight = cardHeight / 2;
  const minimumV = ry * (phi0 - maximumLatitude);
  const maximumV = ry * (phi0 + maximumLatitude);
  const minimumCycle = Math.ceil((minimumV - baseV - halfHeight) / panelPeriod);
  const maximumCycle = Math.floor((maximumV - baseV + halfHeight) / panelPeriod);

  if (minimumCycle > maximumCycle) return null;
  if (maximumCycle - minimumCycle + 1 <= maximumVerticalCopiesPerRow) {
    return [minimumCycle, maximumCycle];
  }

  const nearest = Math.min(maximumCycle, Math.max(minimumCycle, Math.round(-baseV / panelPeriod)));
  let start = Math.max(minimumCycle, nearest - Math.floor(maximumVerticalCopiesPerRow / 2));
  start = Math.min(start, maximumCycle - maximumVerticalCopiesPerRow + 1);
  return [start, start + maximumVerticalCopiesPerRow - 1];
}

export function layoutHeroSphereGallery({
  bendX,
  bendY,
  bleed,
  cardHeight,
  focal,
  gap,
  pan,
  phaseCarries,
  phases,
  principal,
  rowGap,
  rowSources,
  rows,
  rx,
  ry,
  rz,
  viewport,
}: {
  bendX: number;
  bendY: number;
  bleed: { horizontal: number; vertical: number };
  cardHeight: number;
  focal: number;
  gap: number;
  pan: Readonly<{ turns: number; x: number; y: number }>;
  phaseCarries: readonly number[];
  phases: readonly number[];
  principal: { x: number; y: number };
  rowGap: number;
  rowSources: readonly (readonly HeroGalleryImageSource[])[];
  rows: readonly HeroSphereRow[];
  rx: number;
  ry: number;
  rz: number;
  viewport: { height: number; width: number };
}): HeroSphereGalleryLayout {
  const cards: HeroSphereLayoutCard[] = [];
  const periods: number[] = [];
  const pitch = getHeroPanelPitch(cardHeight, rowGap);
  const panelPeriod = getHeroPanelPeriod(rows.length, pitch);
  const rowCenters = getHeroPanelRowCenters(rows.length, pitch);
  const origin = getHeroLensOrigin({ pan, period: panelPeriod, ry, turns: pan.turns });
  const projection: HeroLensProjectionParams = {
    bendX,
    bendY,
    focal,
    near: HERO_LENS_NEAR,
    phi0: origin.phi0,
    principal,
    rx,
    ry,
    rz,
    theta0: origin.theta0,
  };
  const minimumU = (-Math.PI - origin.theta0) * rx;
  const maximumU = (Math.PI - origin.theta0) * rx;

  rows.forEach((row, rowIndex) => {
    const sources = rowSources[rowIndex] ?? [];
    if (sources.length === 0) {
      periods.push(1);
      return;
    }

    const widths = sources.map((source) => cardHeight * getHeroGallerySourceAspect(source));
    const slots = widths.map((width) => Math.max(width + gap, 1));
    const period = Math.max(
      1,
      slots.reduce((total, slot) => total + slot, 0),
    );
    periods.push(period);
    const baseV = rowCenters[rowIndex] ?? 0;
    const cycleRange = getLimitedCycleRange({
      baseV,
      cardHeight,
      panelPeriod,
      phi0: origin.phi0,
      ry,
    });
    if (!cycleRange) return;

    let start = 0;
    widths.forEach((arcWidth, sourceIndex) => {
      const baseU =
        row.offset * degreesToRadians * rx +
        (phases[rowIndex] ?? 0) +
        -(phaseCarries[rowIndex] ?? 0) * period +
        start +
        arcWidth / 2 -
        period / 2;
      start += slots[sourceIndex] ?? arcWidth;
      const minimumCopy = Math.ceil((minimumU - baseU) / period);
      const maximumCopy = Math.ceil((maximumU - baseU) / period) - 1;

      for (let cycle = cycleRange[0]; cycle <= cycleRange[1]; cycle += 1) {
        const vCenter = baseV + cycle * panelPeriod;
        const phiCenter = origin.phi0 - vCenter / Math.max(1, ry);

        for (let copy = minimumCopy; copy <= maximumCopy; copy += 1) {
          const uCenter = baseU + copy * period;
          if (
            !cardIntersectsViewport({
              arcWidth,
              bleed,
              cardHeight,
              projection,
              uCenter,
              vCenter,
              viewport,
            })
          ) {
            continue;
          }

          const center = projectHeroLensPoint(uCenter, vCenter, projection);
          cards.push({
            arcWidth,
            centerX: center.x,
            centerY: center.y,
            copy,
            cycle,
            depth: center.z,
            order: 0,
            phiCenter,
            rowIndex,
            side: center.x < viewport.width / 2 ? -1 : 1,
            sourceIndex,
            thetaCenter: uCenter / Math.max(1, rx) + origin.theta0,
          });
        }
      }
    });
  });

  const selectedCards =
    cards.length > maximumCardsPerFrame
      ? [...cards]
          .sort(
            (left, right) =>
              Math.abs(left.centerX - viewport.width / 2) +
              Math.abs(left.centerY - viewport.height / 2) -
              (Math.abs(right.centerX - viewport.width / 2) +
                Math.abs(right.centerY - viewport.height / 2)),
          )
          .slice(0, maximumCardsPerFrame)
      : cards;

  selectedCards.sort(
    (left, right) =>
      left.depth - right.depth ||
      left.rowIndex - right.rowIndex ||
      left.thetaCenter - right.thetaCenter,
  );

  return {
    cards: selectedCards.map((card, order) => ({ ...card, order })),
    periods,
  };
}

export function advanceHeroPanelPhase(
  phasePx: number,
  speedDegPerSecond: number,
  dtMs: number,
  periodPx: number,
  previousPeriodPx: number,
  rx: number,
) {
  const safePeriod = Math.max(1, periodPx);
  const scaledPhase = previousPeriodPx > 0 ? (phasePx / previousPeriodPx) * safePeriod : phasePx;
  const next =
    scaledPhase +
    speedDegPerSecond *
      degreesToRadians *
      Math.max(1, rx) *
      (Math.min(50, Math.max(0, dtMs)) / 1000);
  return ((next % safePeriod) + safePeriod) % safePeriod;
}

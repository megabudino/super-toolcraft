export type RoomSurface = 'ceiling' | 'floor' | 'left' | 'right';
export type TrailSide = 'bottom' | 'left' | 'right' | 'top';
export type TileShuffleStyle = 'slide' | 'swap';

export const PRE_FOOTER_PRELOAD_VIEWPORTS = 1.5;

export function getPreFooterPreloadRootMargin(viewportHeight: number) {
  const safeViewportHeight = Number.isFinite(viewportHeight) ? Math.max(0, viewportHeight) : 0;
  return `${Math.round(safeViewportHeight * PRE_FOOTER_PRELOAD_VIEWPORTS)}px 0px`;
}

export interface RoomPoint {
  x: number;
  y: number;
}

export type RoomTileCorners = readonly [RoomPoint, RoomPoint, RoomPoint, RoomPoint];

export interface RoomStageSize {
  height: number;
  width: number;
}

export interface RoomCell {
  crossIndex: number;
  depthIndex: number;
  surface: RoomSurface;
}

export interface RoomTileAssignment extends RoomCell {
  image: string;
}

export interface RoomTileLayout {
  assignments: readonly RoomTileAssignment[];
}

export interface TrailEnvelopes {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface TrailVelocity {
  x: number;
  y: number;
}

export interface TrailEnvelopeConfig {
  enabled: boolean;
  fade: number;
  velocityScale: number;
}

export interface TileChange {
  destination: RoomCell;
  image: string;
  shuffleStyle: TileShuffleStyle;
  source: RoomTileAssignment;
}

export function createTrailCrossSteps(crossDivisions: number, amount: number, subdivision: number) {
  const intervalCount = Math.max(1, Math.round(finiteOr(crossDivisions, 1)));
  const lineCount = clamp(Math.round(finiteOr(amount, 1)), 1, 3);
  const fineSubdivision = clamp(Math.round(finiteOr(subdivision, 3)), 2, 6);
  const localSteps = Array.from({ length: lineCount }, (_, index) => {
    if (lineCount >= fineSubdivision) return (index + 1) / (lineCount + 1);

    const fineIndex = clamp(
      Math.floor(((index + 1) * fineSubdivision) / (lineCount + 1)),
      1,
      fineSubdivision - 1,
    );
    return fineIndex / fineSubdivision;
  });

  return Array.from({ length: intervalCount }, (_, intervalIndex) =>
    localSteps.map((localStep) => (intervalIndex + localStep) / intervalCount),
  ).flat();
}

const emptyTrailEnvelopes: TrailEnvelopes = { bottom: 0, left: 0, right: 0, top: 0 };

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function getRoomTileCssTransform(
  corners: RoomTileCorners,
  stageSize: RoomStageSize,
  viewBoxSize: number,
) {
  const scalePoint = ({ x, y }: RoomPoint) => ({
    x: (x / viewBoxSize) * stageSize.width,
    y: (y / viewBoxSize) * stageSize.height,
  });
  const [topLeft, topRight, bottomRight, bottomLeft] = corners;
  const scaledTopLeft = scalePoint(topLeft);
  const scaledTopRight = scalePoint(topRight);
  const scaledBottomRight = scalePoint(bottomRight);
  const scaledBottomLeft = scalePoint(bottomLeft);
  const deltaX1 = scaledTopRight.x - scaledBottomRight.x;
  const deltaX2 = scaledBottomLeft.x - scaledBottomRight.x;
  const deltaX3 = scaledTopLeft.x - scaledTopRight.x + scaledBottomRight.x - scaledBottomLeft.x;
  const deltaY1 = scaledTopRight.y - scaledBottomRight.y;
  const deltaY2 = scaledBottomLeft.y - scaledBottomRight.y;
  const deltaY3 = scaledTopLeft.y - scaledTopRight.y + scaledBottomRight.y - scaledBottomLeft.y;
  const divisor = deltaX1 * deltaY2 - deltaX2 * deltaY1;
  let perspectiveX = 0;
  let perspectiveY = 0;

  if (Math.abs(divisor) > 0.000001) {
    perspectiveX = (deltaX3 * deltaY2 - deltaX2 * deltaY3) / divisor;
    perspectiveY = (deltaX1 * deltaY3 - deltaX3 * deltaY1) / divisor;
  }

  const transformScaleX = scaledTopRight.x - scaledTopLeft.x + perspectiveX * scaledTopRight.x;
  const skewY = scaledTopRight.y - scaledTopLeft.y + perspectiveX * scaledTopRight.y;
  const skewX = scaledBottomLeft.x - scaledTopLeft.x + perspectiveY * scaledBottomLeft.x;
  const transformScaleY = scaledBottomLeft.y - scaledTopLeft.y + perspectiveY * scaledBottomLeft.y;

  return `matrix3d(${transformScaleX / viewBoxSize}, ${skewY / viewBoxSize}, 0, ${perspectiveX / viewBoxSize}, ${skewX / viewBoxSize}, ${transformScaleY / viewBoxSize}, 0, ${perspectiveY / viewBoxSize}, 0, 0, 1, 0, ${scaledTopLeft.x}, ${scaledTopLeft.y}, 0, 1)`;
}

export function getCircularRoomSvgRadii(radius: number, stageWidth: number, stageHeight: number) {
  if (stageWidth <= 0 || stageHeight <= 0) return { rx: radius, ry: radius };
  return { rx: radius * (stageHeight / stageWidth), ry: radius };
}

export function getCircularRoomScreenRadius(
  radius: number,
  stageHeight: number,
  viewBoxSize: number,
) {
  if (stageHeight <= 0 || viewBoxSize <= 0) return radius;
  return (radius / viewBoxSize) * stageHeight;
}

function normalizeEnvelope(value: number) {
  return clamp(finiteOr(value, 0), 0, 1);
}

function selectIndex(length: number, random: () => number) {
  if (length <= 0) return -1;

  const value = clamp(finiteOr(random(), 0), 0, 1 - Number.EPSILON);
  return Math.floor(value * length);
}

function cellsMatch(first: RoomCell, second: RoomCell) {
  return (
    first.surface === second.surface &&
    first.crossIndex === second.crossIndex &&
    first.depthIndex === second.depthIndex
  );
}

export function cellsShareEdge(first: RoomCell, second: RoomCell) {
  if (first.surface !== second.surface) return false;

  return (
    (first.depthIndex === second.depthIndex &&
      Math.abs(first.crossIndex - second.crossIndex) === 1) ||
    (first.crossIndex === second.crossIndex && Math.abs(first.depthIndex - second.depthIndex) === 1)
  );
}

function isUniqueCell(cell: RoomCell, index: number, cells: readonly RoomCell[]) {
  return !cells.slice(0, index).some((candidate) => cellsMatch(candidate, cell));
}

export function selectNonAdjacentCells(
  preferred: readonly RoomCell[],
  candidates: readonly RoomCell[],
  requestedCount: number,
) {
  const selected: RoomCell[] = [];
  const orderedCells = [...preferred, ...candidates];

  for (const cell of orderedCells) {
    if (selected.length >= requestedCount) break;
    if (selected.some((candidate) => cellsMatch(candidate, cell))) continue;
    if (selected.some((candidate) => cellsShareEdge(candidate, cell))) continue;
    selected.push(cell);
  }

  return selected;
}

const slideContactEpsilon = 0.000001;

function getAxisContactInterval(start: number, end: number, occupied: number) {
  const delta = end - start;
  if (Math.abs(delta) < slideContactEpsilon) {
    return Math.abs(start - occupied) <= 1 ? ([0, 1] as const) : null;
  }

  const first = (occupied - 1 - start) / delta;
  const second = (occupied + 1 - start) / delta;
  const intervalStart = Math.max(0, Math.min(first, second));
  const intervalEnd = Math.min(1, Math.max(first, second));
  return intervalStart <= intervalEnd + slideContactEpsilon
    ? ([intervalStart, intervalEnd] as const)
    : null;
}

function sweptTileCrossesOrTouchesEdge(
  source: RoomCell,
  destination: RoomCell,
  occupied: RoomCell,
) {
  if (occupied.surface !== source.surface) return false;

  const crossInterval = getAxisContactInterval(
    source.crossIndex,
    destination.crossIndex,
    occupied.crossIndex,
  );
  const depthInterval = getAxisContactInterval(
    source.depthIndex,
    destination.depthIndex,
    occupied.depthIndex,
  );
  if (!crossInterval || !depthInterval) return false;

  const contactStart = Math.max(crossInterval[0], depthInterval[0]);
  const contactEnd = Math.min(crossInterval[1], depthInterval[1]);
  if (contactStart > contactEnd + slideContactEpsilon) return false;
  if (contactEnd - contactStart > slideContactEpsilon) return true;

  const contactProgress = (contactStart + contactEnd) / 2;
  const crossDistance = Math.abs(
    source.crossIndex +
      (destination.crossIndex - source.crossIndex) * contactProgress -
      occupied.crossIndex,
  );
  const depthDistance = Math.abs(
    source.depthIndex +
      (destination.depthIndex - source.depthIndex) * contactProgress -
      occupied.depthIndex,
  );
  const isCornerOnly =
    Math.abs(crossDistance - 1) <= slideContactEpsilon &&
    Math.abs(depthDistance - 1) <= slideContactEpsilon;
  return !isCornerOnly;
}

export function slidePathIsClear(
  source: RoomCell,
  destination: RoomCell,
  occupied: readonly RoomCell[],
) {
  if (source.surface !== destination.surface) return false;

  return !occupied.some(
    (occupiedCell) =>
      !cellsMatch(occupiedCell, source) &&
      sweptTileCrossesOrTouchesEdge(source, destination, occupiedCell),
  );
}

function nextEnvelope(current: number, target: number, releaseMultiplier: number) {
  return target > current ? target : Math.max(target, current * releaseMultiplier);
}

export function advanceTrailEnvelopes(
  state: TrailEnvelopes,
  dt: number,
  velocity: TrailVelocity,
  config: TrailEnvelopeConfig,
): TrailEnvelopes {
  if (config.enabled !== true) return { ...emptyTrailEnvelopes };

  const elapsed = Math.max(0, finiteOr(dt, 0));
  const fade = clamp(finiteOr(config.fade, 0.2), 0.2, 2);
  const velocityScale = Math.max(Number.EPSILON, finiteOr(config.velocityScale, 1));
  const velocityX = finiteOr(velocity.x, 0);
  const velocityY = finiteOr(velocity.y, 0);
  const releaseMultiplier = Math.exp(-elapsed / fade);
  const targets: TrailEnvelopes = {
    bottom: velocityY < 0 ? clamp(Math.abs(velocityY) / velocityScale, 0, 1) : 0,
    left: velocityX > 0 ? clamp(Math.abs(velocityX) / velocityScale, 0, 1) : 0,
    right: velocityX < 0 ? clamp(Math.abs(velocityX) / velocityScale, 0, 1) : 0,
    top: velocityY > 0 ? clamp(Math.abs(velocityY) / velocityScale, 0, 1) : 0,
  };

  return {
    bottom: nextEnvelope(normalizeEnvelope(state.bottom), targets.bottom, releaseMultiplier),
    left: nextEnvelope(normalizeEnvelope(state.left), targets.left, releaseMultiplier),
    right: nextEnvelope(normalizeEnvelope(state.right), targets.right, releaseMultiplier),
    top: nextEnvelope(normalizeEnvelope(state.top), targets.top, releaseMultiplier),
  };
}

export function pickNextTileChange(
  layout: RoomTileLayout,
  cells: readonly RoomCell[],
  images: readonly string[],
  random: () => number,
  requestedShuffleStyle: TileShuffleStyle = 'swap',
): TileChange | null {
  const sourceIndex = selectIndex(layout.assignments.length, random);
  if (sourceIndex < 0) return null;

  const source = layout.assignments[sourceIndex];
  if (!source) return null;

  const surfaces = [...new Set(cells.map((cell) => cell.surface))];
  const surfaceCounts = new Map(
    surfaces.map((surface) => [
      surface,
      layout.assignments.filter((assignment) => assignment.surface === surface).length,
    ]),
  );
  const minimumSurfaceCount = Math.min(...surfaceCounts.values());
  const extraSurfaces = surfaces.filter(
    (surface) => surfaceCounts.get(surface) === minimumSurfaceCount + 1,
  );
  const uniqueExtraSurface = extraSurfaces.length === 1 ? extraSurfaces[0] : null;
  const freeCells = cells.filter(
    (cell, index) =>
      isUniqueCell(cell, index, cells) &&
      !layout.assignments.some((assignment) => cellsMatch(assignment, cell)) &&
      !layout.assignments.some(
        (assignment) => !cellsMatch(assignment, source) && cellsShareEdge(assignment, cell),
      ) &&
      (cell.surface === source.surface ||
        (source.surface === uniqueExtraSurface &&
          surfaceCounts.get(cell.surface) === minimumSurfaceCount)),
  );
  const destinationIndex = selectIndex(freeCells.length, random);
  const destination = destinationIndex < 0 ? null : freeCells[destinationIndex];
  if (!destination) return null;

  const usableImages = images.filter((image) => image.length > 0);
  const occupiedImages = new Set(layout.assignments.map((assignment) => assignment.image));
  const unoccupiedImages = usableImages.filter((image) => !occupiedImages.has(image));
  const imageChoices = unoccupiedImages.length > 0 ? unoccupiedImages : usableImages;
  const imageIndex = selectIndex(imageChoices.length, random);
  const image = imageIndex < 0 ? source.image : (imageChoices[imageIndex] ?? source.image);
  const shuffleStyle =
    requestedShuffleStyle === 'slide' && slidePathIsClear(source, destination, layout.assignments)
      ? 'slide'
      : 'swap';

  return { destination, image, shuffleStyle, source };
}

export function interpolateRoomTileCorners(
  start: RoomTileCorners,
  end: RoomTileCorners,
  progress: number,
): RoomTileCorners {
  const boundedProgress = clamp(finiteOr(progress, 0), 0, 1);
  if (boundedProgress === 0) return start;
  if (boundedProgress === 1) return end;

  const interpolatePoint = (startPoint: RoomPoint, endPoint: RoomPoint): RoomPoint => ({
    x: startPoint.x + (endPoint.x - startPoint.x) * boundedProgress,
    y: startPoint.y + (endPoint.y - startPoint.y) * boundedProgress,
  });

  return [
    interpolatePoint(start[0], end[0]),
    interpolatePoint(start[1], end[1]),
    interpolatePoint(start[2], end[2]),
    interpolatePoint(start[3], end[3]),
  ];
}

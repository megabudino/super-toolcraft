import appliedStudioRoomSettingsSource from './studio-room-applied-settings.json';

export interface StudioRoomPoint {
  x: number;
  y: number;
}

export interface StudioRoomColorOpacity {
  hex: string;
  opacity: number;
}

export interface StudioRoomCompositionSettings {
  buttonGap: number;
  firstRowScale: number;
  lineGap: number;
  secondRowScale: number;
}

export interface StudioRoomWallBorderSettings {
  colorOpacity: StudioRoomColorOpacity;
  width: number;
}

export interface StudioRoomInnerGridSettings {
  depth: number;
  enabled: boolean;
  falloff: number;
  opacity: number;
}

export interface StudioRoomRoomSettings {
  depth: number;
  innerGrid: StudioRoomInnerGridSettings;
  vanishing: StudioRoomPoint;
  wallBorder: StudioRoomWallBorderSettings;
  wallFill: string;
}

export interface StudioRoomGridSettings {
  color: string;
  columns: number;
  depthDivisions: number;
  opacity: number;
  rows: number;
  thickness: number;
}

export interface StudioRoomFineGridSettings {
  color: string;
  enabled: boolean;
  opacity: number;
  subdivision: number;
  thickness: number;
}

export type StudioRoomTileShuffleStyle = 'slide' | 'swap';

export interface StudioRoomTileImageTransform {
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotationDeg: 0 | 90 | 180 | 270;
}

export interface StudioRoomTileImage {
  height: number;
  id: string;
  order: number;
  ref: string;
  transform: StudioRoomTileImageTransform;
  width: number;
}

export interface StudioRoomTilesSettings {
  develop: number;
  fog: number;
  hoverLift: number;
  images: readonly StudioRoomTileImage[];
  interval: number;
  perSurface: number;
  shuffleStyle: StudioRoomTileShuffleStyle;
}

export interface StudioRoomMotionSettings {
  enabled: boolean;
  parallax: number;
  scrollNudge: number;
  smoothness: number;
}

export interface StudioRoomTrailSettings {
  amount: number;
  enabled: boolean;
  fade: number;
  strength: number;
}

export interface StudioRoomSettings {
  composition: StudioRoomCompositionSettings;
  fineGrid: StudioRoomFineGridSettings;
  grid: StudioRoomGridSettings;
  height: number;
  motion: StudioRoomMotionSettings;
  room: StudioRoomRoomSettings;
  tiles: StudioRoomTilesSettings;
  trail: StudioRoomTrailSettings;
}

export type PersistedStudioRoomSettings = StudioRoomSettings;

export const defaultStudioRoomSettings: StudioRoomSettings = {
  composition: {
    buttonGap: 6,
    firstRowScale: 100,
    lineGap: -12,
    secondRowScale: 100,
  },
  fineGrid: {
    color: '#6F7946',
    enabled: true,
    opacity: 12,
    subdivision: 3,
    thickness: 0.5,
  },
  grid: {
    color: '#6F7946',
    columns: 8,
    depthDivisions: 4,
    opacity: 34,
    rows: 4,
    thickness: 1.3,
  },
  height: 1080,
  motion: {
    enabled: true,
    parallax: 100,
    scrollNudge: 0.35,
    smoothness: 0.5,
  },
  room: {
    depth: 0.3,
    innerGrid: {
      depth: 22,
      enabled: false,
      falloff: 1.6,
      opacity: 40,
    },
    vanishing: { x: 0, y: 0 },
    wallBorder: {
      colorOpacity: { hex: '#6F7946', opacity: 34 },
      width: 1.3,
    },
    wallFill: '#F0F4E2',
  },
  tiles: {
    develop: 0.25,
    fog: 0,
    hoverLift: 0.25,
    images: [],
    interval: 1.4,
    perSurface: 2,
    shuffleStyle: 'swap',
  },
  trail: {
    amount: 2,
    enabled: true,
    fade: 0.7,
    strength: 40,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && actualKeys.every((key) => keys.includes(key));
}

function normalizeBoundedNumber(value: unknown, minimum: number, maximum: number, round = false) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;

  const bounded = Math.min(maximum, Math.max(minimum, value));
  return round ? Math.round(bounded) : bounded;
}

function normalizeColor(value: unknown) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : null;
}

function normalizePoint(value: unknown): StudioRoomPoint | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ['x', 'y'])) return null;

  const x = normalizeBoundedNumber(value.x, -1, 1);
  const y = normalizeBoundedNumber(value.y, -1, 1);
  return x === null || y === null ? null : { x, y };
}

function normalizeColorOpacity(value: unknown): StudioRoomColorOpacity | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ['hex', 'opacity'])) return null;

  const hex = normalizeColor(value.hex);
  const opacity = normalizeBoundedNumber(value.opacity, 0, 100);
  return hex === null || opacity === null ? null : { hex, opacity };
}

function normalizeComposition(value: unknown): StudioRoomCompositionSettings | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['buttonGap', 'firstRowScale', 'lineGap', 'secondRowScale'])
  ) {
    return null;
  }

  const buttonGap = normalizeBoundedNumber(value.buttonGap, 0, 160);
  const firstRowScale = normalizeBoundedNumber(value.firstRowScale, 50, 150);
  const lineGap = normalizeBoundedNumber(value.lineGap, -40, 80);
  const secondRowScale = normalizeBoundedNumber(value.secondRowScale, 50, 150);

  return buttonGap === null || firstRowScale === null || lineGap === null || secondRowScale === null
    ? null
    : { buttonGap, firstRowScale, lineGap, secondRowScale };
}

function normalizeWallBorder(value: unknown): StudioRoomWallBorderSettings | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ['colorOpacity', 'width'])) return null;

  const colorOpacity = normalizeColorOpacity(value.colorOpacity);
  const width = normalizeBoundedNumber(value.width, 0, 12);
  return colorOpacity === null || width === null ? null : { colorOpacity, width };
}

function normalizeInnerGrid(value: unknown): StudioRoomInnerGridSettings | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ['depth', 'enabled', 'falloff', 'opacity'])) {
    return null;
  }

  const depth = normalizeBoundedNumber(value.depth, 5, 60);
  const falloff = normalizeBoundedNumber(value.falloff, 0.5, 4);
  const opacity = normalizeBoundedNumber(value.opacity, 0, 100);

  if (
    typeof value.enabled !== 'boolean' ||
    depth === null ||
    falloff === null ||
    opacity === null
  ) {
    return null;
  }

  return { depth, enabled: value.enabled, falloff, opacity };
}

function normalizeRoom(value: unknown): StudioRoomRoomSettings | null {
  if (!isRecord(value)) return null;

  const roomKeys = Object.keys(value);
  if (
    !roomKeys.every((key) =>
      ['depth', 'innerGrid', 'vanishing', 'wallBorder', 'wallFill'].includes(key),
    ) ||
    !roomKeys.includes('depth') ||
    !roomKeys.includes('vanishing')
  ) {
    return null;
  }

  const depth = normalizeBoundedNumber(value.depth, 0, 1);
  const innerGrid = roomKeys.includes('innerGrid')
    ? normalizeInnerGrid(value.innerGrid)
    : { ...defaultStudioRoomSettings.room.innerGrid };
  const vanishing = normalizePoint(value.vanishing);
  const wallBorder = roomKeys.includes('wallBorder')
    ? normalizeWallBorder(value.wallBorder)
    : {
        ...defaultStudioRoomSettings.room.wallBorder,
        colorOpacity: { ...defaultStudioRoomSettings.room.wallBorder.colorOpacity },
      };
  const wallFill = roomKeys.includes('wallFill')
    ? normalizeColor(value.wallFill)
    : defaultStudioRoomSettings.room.wallFill;

  return depth === null ||
    innerGrid === null ||
    vanishing === null ||
    wallBorder === null ||
    wallFill === null
    ? null
    : { depth, innerGrid, vanishing, wallBorder, wallFill };
}

function normalizeGrid(value: unknown): StudioRoomGridSettings | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['color', 'columns', 'depthDivisions', 'opacity', 'rows', 'thickness'])
  ) {
    return null;
  }

  const color = normalizeColor(value.color);
  const columns = normalizeBoundedNumber(value.columns, 4, 16, true);
  const depthDivisions = normalizeBoundedNumber(value.depthDivisions, 2, 8, true);
  const opacity = normalizeBoundedNumber(value.opacity, 0, 100);
  const rows = normalizeBoundedNumber(value.rows, 2, 8, true);
  const thickness = normalizeBoundedNumber(value.thickness, 0.5, 4);

  if (
    color === null ||
    columns === null ||
    depthDivisions === null ||
    opacity === null ||
    rows === null ||
    thickness === null
  ) {
    return null;
  }

  return { color, columns, depthDivisions, opacity, rows, thickness };
}

function normalizeFineGrid(value: unknown): StudioRoomFineGridSettings | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['color', 'enabled', 'opacity', 'subdivision', 'thickness'])
  ) {
    return null;
  }

  const color = normalizeColor(value.color);
  const opacity = normalizeBoundedNumber(value.opacity, 0, 100);
  const subdivision = normalizeBoundedNumber(value.subdivision, 2, 6, true);
  const thickness = normalizeBoundedNumber(value.thickness, 0.5, 2);

  if (
    typeof value.enabled !== 'boolean' ||
    color === null ||
    opacity === null ||
    subdivision === null ||
    thickness === null
  ) {
    return null;
  }

  return { color, enabled: value.enabled, opacity, subdivision, thickness };
}

function normalizeTileImageTransform(value: unknown): StudioRoomTileImageTransform | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['flipHorizontal', 'flipVertical', 'rotationDeg']) ||
    typeof value.flipHorizontal !== 'boolean' ||
    typeof value.flipVertical !== 'boolean' ||
    (value.rotationDeg !== 0 &&
      value.rotationDeg !== 90 &&
      value.rotationDeg !== 180 &&
      value.rotationDeg !== 270)
  ) {
    return null;
  }

  return {
    flipHorizontal: value.flipHorizontal,
    flipVertical: value.flipVertical,
    rotationDeg: value.rotationDeg,
  };
}

function normalizeTileImage(value: unknown): StudioRoomTileImage | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['height', 'id', 'order', 'ref', 'transform', 'width'])
  ) {
    return null;
  }

  const height = normalizeBoundedNumber(value.height, 1, 16_384);
  const order =
    typeof value.order === 'number' && Number.isSafeInteger(value.order) && value.order >= 0
      ? value.order
      : null;
  const transform = normalizeTileImageTransform(value.transform);
  const width = normalizeBoundedNumber(value.width, 1, 16_384);

  if (
    height === null ||
    order === null ||
    transform === null ||
    width === null ||
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    value.id.length > 512 ||
    typeof value.ref !== 'string' ||
    value.ref.length === 0 ||
    value.ref.length > 512 ||
    /^data:/i.test(value.ref)
  ) {
    return null;
  }

  return { height, id: value.id, order, ref: value.ref, transform, width };
}

function normalizeTileImages(value: unknown): readonly StudioRoomTileImage[] | null {
  if (!Array.isArray(value)) return null;

  const images: StudioRoomTileImage[] = [];
  const imageIds = new Set<string>();
  const imageRefs = new Set<string>();
  const imageOrders = new Set<number>();

  for (const candidate of value) {
    const image = normalizeTileImage(candidate);
    if (
      image === null ||
      imageIds.has(image.id) ||
      imageRefs.has(image.ref) ||
      imageOrders.has(image.order)
    ) {
      return null;
    }

    imageIds.add(image.id);
    imageRefs.add(image.ref);
    imageOrders.add(image.order);
    images.push(image);
  }

  return images;
}

function normalizeTiles(value: unknown): StudioRoomTilesSettings | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'develop',
      'fog',
      'hoverLift',
      'images',
      'interval',
      'perSurface',
      'shuffleStyle',
    ])
  ) {
    return null;
  }

  const develop = normalizeBoundedNumber(value.develop, 0, 1);
  const fog = normalizeBoundedNumber(value.fog, 0, 1);
  const hoverLift = normalizeBoundedNumber(value.hoverLift, 0, 1);
  const images = normalizeTileImages(value.images);
  const interval = normalizeBoundedNumber(value.interval, 0.4, 5);
  const perSurface = normalizeBoundedNumber(value.perSurface, 1, 6, true);
  const shuffleStyle = value.shuffleStyle;

  if (
    develop === null ||
    fog === null ||
    hoverLift === null ||
    images === null ||
    interval === null ||
    perSurface === null ||
    (shuffleStyle !== 'slide' && shuffleStyle !== 'swap')
  ) {
    return null;
  }

  return { develop, fog, hoverLift, images, interval, perSurface, shuffleStyle };
}

function normalizeMotion(value: unknown): StudioRoomMotionSettings | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['enabled', 'parallax', 'scrollNudge', 'smoothness'])
  ) {
    return null;
  }

  const parallax = normalizeBoundedNumber(value.parallax, 0, 150);
  const scrollNudge = normalizeBoundedNumber(value.scrollNudge, 0, 1);
  const smoothness = normalizeBoundedNumber(value.smoothness, 0, 1);

  if (
    typeof value.enabled !== 'boolean' ||
    parallax === null ||
    scrollNudge === null ||
    smoothness === null
  ) {
    return null;
  }

  return { enabled: value.enabled, parallax, scrollNudge, smoothness };
}

function normalizeTrail(value: unknown): StudioRoomTrailSettings | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ['amount', 'enabled', 'fade', 'strength'])) {
    return null;
  }

  const amount = normalizeBoundedNumber(value.amount, 1, 3, true);
  const fade = normalizeBoundedNumber(value.fade, 0.2, 2);
  const strength = normalizeBoundedNumber(value.strength, 0, 100);

  if (typeof value.enabled !== 'boolean' || amount === null || fade === null || strength === null) {
    return null;
  }

  return { amount, enabled: value.enabled, fade, strength };
}

export function normalizeStudioRoomSettings(value: unknown): StudioRoomSettings | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'composition',
      'fineGrid',
      'grid',
      'height',
      'motion',
      'room',
      'tiles',
      'trail',
    ])
  ) {
    return null;
  }

  const composition = normalizeComposition(value.composition);
  const fineGrid = normalizeFineGrid(value.fineGrid);
  const grid = normalizeGrid(value.grid);
  const height = normalizeBoundedNumber(value.height, 576, 8192, true);
  const motion = normalizeMotion(value.motion);
  const room = normalizeRoom(value.room);
  const tiles = normalizeTiles(value.tiles);
  const trail = normalizeTrail(value.trail);

  if (
    composition === null ||
    fineGrid === null ||
    grid === null ||
    height === null ||
    motion === null ||
    room === null ||
    tiles === null ||
    trail === null
  ) {
    return null;
  }

  return { composition, fineGrid, grid, height, motion, room, tiles, trail };
}

export const appliedStudioRoomSettings =
  normalizeStudioRoomSettings(appliedStudioRoomSettingsSource) ?? defaultStudioRoomSettings;

export function createPersistedStudioRoomSettings(
  settings: StudioRoomSettings,
): PersistedStudioRoomSettings {
  return {
    ...settings,
    tiles: {
      ...settings.tiles,
      images: [],
    },
  };
}

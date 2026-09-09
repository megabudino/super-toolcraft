import {
  createFineDetailsCarouselFromValues,
  createFineDetailsImagesModeFromValues,
  FINE_DETAILS_CAROUSEL_DEFAULTS,
  FINE_DETAILS_IMAGES_MODE_DEFAULT,
  type FineDetailsCarouselSettings,
  type FineDetailsImagesMode,
} from './fine-details-carousel-values';
import {
  createFineDetailsAppearanceFromValues,
  FINE_DETAILS_APPEARANCE_DEFAULTS,
} from './fine-details-values';
import {
  createFineDetailsLoadingFromValues,
  FINE_DETAILS_LOADING_DEFAULTS,
  type FineDetailsLoadingSettings,
} from './fine-details-loading-values';
import {
  createFineDetailsPromptFromValues,
  FINE_DETAILS_PROMPT_DEFAULTS,
  type FineDetailsPromptSettings,
} from './fine-details-prompt-values';
import {
  createFineDetailsPromptFlightFromValues,
  FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS,
  type FineDetailsPromptFlightSettings,
} from './fine-details-prompt-flight-values';
import {
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE,
  type FineDetailsPromptFlightCommand,
} from './fine-details-prompt-flight-command-contract';
import {
  createFineDetailsTypographyFromValues,
  FINE_DETAILS_TYPOGRAPHY_DEFAULTS,
  type FineDetailsTypographySettings,
} from './fine-details-typography-values';
import {
  createFineDetailsTrailFromValues,
  FINE_DETAILS_TRAIL_DEFAULTS,
  type FineDetailsTrailImage,
  type FineDetailsTrailSettings,
} from './fine-details-trail-values';

export const FINE_DETAILS_PREVIEW_CHANNEL = 'recraft.fine-details';
export const FINE_DETAILS_PREVIEW_VERSION = 17;

export type { FineDetailsPromptFlightCommand } from './fine-details-prompt-flight-command-contract';

export type FineDetailsPreviewPromptSettings = FineDetailsPromptSettings &
  Readonly<{ flight: FineDetailsPromptFlightSettings }>;

export interface FineDetailsPreviewSettings {
  background: string;
  carousel: FineDetailsCarouselSettings;
  gridOpacity: number;
  gridSize: number;
  height: number;
  imagesMode: FineDetailsImagesMode;
  loading: FineDetailsLoadingSettings;
  prompt: FineDetailsPreviewPromptSettings;
  trail: FineDetailsTrailSettings;
  typography: FineDetailsTypographySettings;
}


export const FINE_DETAILS_PREVIEW_DEFAULTS: FineDetailsPreviewSettings = {
  ...FINE_DETAILS_APPEARANCE_DEFAULTS,
  carousel: FINE_DETAILS_CAROUSEL_DEFAULTS,
  height: 1080,
  imagesMode: FINE_DETAILS_IMAGES_MODE_DEFAULT,
  loading: FINE_DETAILS_LOADING_DEFAULTS,
  prompt: {
    ...FINE_DETAILS_PROMPT_DEFAULTS,
    flight: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS,
  },
  trail: FINE_DETAILS_TRAIL_DEFAULTS,
  typography: FINE_DETAILS_TYPOGRAPHY_DEFAULTS,
};

export const FINE_DETAILS_PREVIEW_SCENE_BOUNDS = {
  height: FINE_DETAILS_PREVIEW_DEFAULTS.height,
  width: 1920,
  x: 0,
  y: 0,
} as const;

export function createFineDetailsPreviewSettingsFromValues(
  values: Readonly<Record<string, unknown>>,
  height: number,
  images: readonly FineDetailsTrailImage[] = [],
): FineDetailsPreviewSettings {
  return {
    ...createFineDetailsAppearanceFromValues(values),
    carousel: createFineDetailsCarouselFromValues(values),
    height: Number.isFinite(height) ? Math.min(8192, Math.max(1, Math.round(height))) : 1080,
    imagesMode: createFineDetailsImagesModeFromValues(values),
    loading: createFineDetailsLoadingFromValues(values),
    prompt: {
      ...createFineDetailsPromptFromValues(values),
      flight: createFineDetailsPromptFlightFromValues(values),
    },
    trail: createFineDetailsTrailFromValues(values, images),
    typography: createFineDetailsTypographyFromValues(values),
  };
}

export type FineDetailsPreviewMediaItem = Readonly<{
  blob: Blob;
  id: string;
  mimeType: string;
  ref: string;
}>;

export type FineDetailsPreviewMediaMessage = Readonly<{
  channel: typeof FINE_DETAILS_PREVIEW_CHANNEL;
  images: readonly FineDetailsPreviewMediaItem[];
  type: 'media';
  version: typeof FINE_DETAILS_PREVIEW_VERSION;
}>;

export type FineDetailsPreviewPointerMessage = Readonly<{
  channel: typeof FINE_DETAILS_PREVIEW_CHANNEL;
  payload: Readonly<{ active: boolean; x: number; y: number }>;
  type: 'pointer';
  version: typeof FINE_DETAILS_PREVIEW_VERSION;
}>;

export type FineDetailsPromptSceneRect = Readonly<{
  bottom: number;
  left: number;
  right: number;
  top: number;
}>;

export type FineDetailsPromptSceneGeometry = Readonly<{
  interactiveRects: readonly FineDetailsPromptSceneRect[];
  rect: FineDetailsPromptSceneRect | null;
}>;

export type FineDetailsPreviewPromptGesture = Readonly<{
  phase: 'cancel' | 'double-click' | 'down' | 'move' | 'up';
  pointerId: number;
  pointerType: string;
  x: number;
  y: number;
}>;

export type FineDetailsPreviewPromptGestureMessage = Readonly<{
  channel: typeof FINE_DETAILS_PREVIEW_CHANNEL;
  payload: FineDetailsPreviewPromptGesture;
  type: 'prompt-gesture';
  version: typeof FINE_DETAILS_PREVIEW_VERSION;
}>;

export type FineDetailsPreviewPromptGeometryMessage = Readonly<{
  channel: typeof FINE_DETAILS_PREVIEW_CHANNEL;
  payload: FineDetailsPromptSceneGeometry;
  type: 'prompt-geometry';
  version: typeof FINE_DETAILS_PREVIEW_VERSION;
}>;

export type FineDetailsPreviewPromptFlightCommandMessage = Readonly<{
  channel: typeof FINE_DETAILS_PREVIEW_CHANNEL;
  command: FineDetailsPromptFlightCommand;
  nonce: string;
  type: typeof FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE;
  version: typeof FINE_DETAILS_PREVIEW_VERSION;
}>;

export type FineDetailsPreviewReadyRequestMessage = Readonly<{
  channel: typeof FINE_DETAILS_PREVIEW_CHANNEL;
  type: 'ready-request';
  version: typeof FINE_DETAILS_PREVIEW_VERSION;
}>;

export type FineDetailsPreviewSettingsMessage = Readonly<{
  channel: typeof FINE_DETAILS_PREVIEW_CHANNEL;
  payload: FineDetailsPreviewSettings;
  type: 'settings';
  version: typeof FINE_DETAILS_PREVIEW_VERSION;
}>;

export type FineDetailsPreviewReadyMessage = Readonly<{
  channel: typeof FINE_DETAILS_PREVIEW_CHANNEL;
  type: 'ready';
  version: typeof FINE_DETAILS_PREVIEW_VERSION;
}>;



function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createFineDetailsPreviewSettingsMessage(
  settings: FineDetailsPreviewSettings,
): FineDetailsPreviewSettingsMessage {
  return {
    channel: FINE_DETAILS_PREVIEW_CHANNEL,
    payload: settings,
    type: 'settings',
    version: FINE_DETAILS_PREVIEW_VERSION,
  };
}

export function createFineDetailsPreviewMediaMessage(
  images: readonly FineDetailsPreviewMediaItem[],
): FineDetailsPreviewMediaMessage {
  return {
    channel: FINE_DETAILS_PREVIEW_CHANNEL,
    images,
    type: 'media',
    version: FINE_DETAILS_PREVIEW_VERSION,
  };
}

export function createFineDetailsPreviewPointerMessage(
  pointer: Readonly<{ active: boolean; x: number; y: number }>,
): FineDetailsPreviewPointerMessage {
  return {
    channel: FINE_DETAILS_PREVIEW_CHANNEL,
    payload: pointer,
    type: 'pointer',
    version: FINE_DETAILS_PREVIEW_VERSION,
  };
}

export function createFineDetailsPreviewPromptGestureMessage(
  gesture: FineDetailsPreviewPromptGesture,
): FineDetailsPreviewPromptGestureMessage {
  return {
    channel: FINE_DETAILS_PREVIEW_CHANNEL,
    payload: gesture,
    type: 'prompt-gesture',
    version: FINE_DETAILS_PREVIEW_VERSION,
  };
}

export function createFineDetailsPreviewReadyRequestMessage(): FineDetailsPreviewReadyRequestMessage {
  return {
    channel: FINE_DETAILS_PREVIEW_CHANNEL,
    type: 'ready-request',
    version: FINE_DETAILS_PREVIEW_VERSION,
  };
}

export function createFineDetailsPreviewPromptFlightCommandMessage(
  command: FineDetailsPromptFlightCommand,
  nonce: string,
): FineDetailsPreviewPromptFlightCommandMessage {
  return {
    channel: FINE_DETAILS_PREVIEW_CHANNEL,
    command,
    nonce,
    type: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE,
    version: FINE_DETAILS_PREVIEW_VERSION,
  };
}


export function isFineDetailsPreviewReadyMessage(
  value: unknown,
): value is FineDetailsPreviewReadyMessage {
  return (
    isRecord(value) &&
    value.channel === FINE_DETAILS_PREVIEW_CHANNEL &&
    value.type === 'ready' &&
    value.version === FINE_DETAILS_PREVIEW_VERSION
  );
}

function isFineDetailsPromptSceneRect(value: unknown): value is FineDetailsPromptSceneRect {
  if (!isRecord(value)) return false;

  const { bottom, left, right, top } = value;
  return (
    typeof bottom === 'number' &&
    Number.isFinite(bottom) &&
    typeof left === 'number' &&
    Number.isFinite(left) &&
    typeof right === 'number' &&
    Number.isFinite(right) &&
    typeof top === 'number' &&
    Number.isFinite(top) &&
    right >= left &&
    bottom >= top
  );
}

export function isPointInsideFineDetailsPromptDragRegion(
  point: Readonly<{ x: number; y: number }>,
  rect: FineDetailsPromptSceneRect | null,
  interactiveRects: readonly FineDetailsPromptSceneRect[],
) {
  const insidePrompt =
    rect !== null &&
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom;
  if (!insidePrompt) return false;

  return !interactiveRects.some(
    (interactiveRect) =>
      point.x >= interactiveRect.left &&
      point.x <= interactiveRect.right &&
      point.y >= interactiveRect.top &&
      point.y <= interactiveRect.bottom,
  );
}

export function isFineDetailsPreviewPromptGeometryMessage(
  value: unknown,
): value is FineDetailsPreviewPromptGeometryMessage {
  if (
    !isRecord(value) ||
    value.channel !== FINE_DETAILS_PREVIEW_CHANNEL ||
    value.type !== 'prompt-geometry' ||
    value.version !== FINE_DETAILS_PREVIEW_VERSION ||
    !isRecord(value.payload)
  ) {
    return false;
  }

  const rect = value.payload.rect;
  const interactiveRects = value.payload.interactiveRects;
  if (!Array.isArray(interactiveRects)) return false;
  if (rect === null) return interactiveRects.length === 0;
  if (!isFineDetailsPromptSceneRect(rect)) return false;

  return interactiveRects.every(
    (interactiveRect) =>
      isFineDetailsPromptSceneRect(interactiveRect) &&
      interactiveRect.left >= rect.left &&
      interactiveRect.right <= rect.right &&
      interactiveRect.top >= rect.top &&
      interactiveRect.bottom <= rect.bottom,
  );
}

import {
  createStudioRoomSettingsFromValues,
  STUDIO_ROOM_DEFAULTS,
  type StudioRoomSettings,
  type StudioRoomTileImage,
} from "./studio-room-values";

export const STUDIO_ROOM_PREVIEW_URL = "http://localhost:3000/v4styles/toolcraft/studio-room";
export const STUDIO_ROOM_PREVIEW_CHANNEL = "recraft.studio-room";
export const STUDIO_ROOM_PREVIEW_VERSION = 6;
export const STUDIO_ROOM_PREVIEW_DEFAULTS = STUDIO_ROOM_DEFAULTS;
export { createStudioRoomSettingsFromValues };
export type StudioRoomPreviewSettings = StudioRoomSettings;
export type StudioRoomWebsiteSettingsSaveIntent = "apply" | "reset";

export type StudioRoomPreviewMediaItem = Readonly<{
  blob: Blob;
  id: string;
  mimeType: string;
  ref: string;
}>;
export type StudioRoomPreviewMediaMessage = Readonly<{
  channel: typeof STUDIO_ROOM_PREVIEW_CHANNEL;
  images: readonly StudioRoomPreviewMediaItem[];
  type: "media";
  version: typeof STUDIO_ROOM_PREVIEW_VERSION;
}>;
export type StudioRoomPreviewReadyMessage = Readonly<{
  channel: typeof STUDIO_ROOM_PREVIEW_CHANNEL;
  type: "ready";
  version: typeof STUDIO_ROOM_PREVIEW_VERSION;
}>;
export type StudioRoomPreviewReadyRequestMessage = Readonly<{
  channel: typeof STUDIO_ROOM_PREVIEW_CHANNEL;
  type: "ready-request";
  version: typeof STUDIO_ROOM_PREVIEW_VERSION;
}>;
export type StudioRoomPreviewSettingsMessage = Readonly<{
  channel: typeof STUDIO_ROOM_PREVIEW_CHANNEL;
  payload: StudioRoomPreviewSettings;
  type: "settings";
  version: typeof STUDIO_ROOM_PREVIEW_VERSION;
}>;
export type StudioRoomPreviewSaveSettingsMessage = Readonly<{
  channel: typeof STUDIO_ROOM_PREVIEW_CHANNEL;
  intent: StudioRoomWebsiteSettingsSaveIntent;
  payload: StudioRoomPreviewSettings;
  requestId: string;
  type: "save-settings";
  version: typeof STUDIO_ROOM_PREVIEW_VERSION;
}>;
export type StudioRoomPreviewSaveResultMessage = Readonly<{
  channel: typeof STUDIO_ROOM_PREVIEW_CHANNEL;
  message?: string;
  ok: boolean;
  requestId: string;
  type: "save-result";
  version: typeof STUDIO_ROOM_PREVIEW_VERSION;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}
function hasEnvelope(value: Record<string, unknown>, type: string) {
  return (
    value.channel === STUDIO_ROOM_PREVIEW_CHANNEL &&
    value.type === type &&
    value.version === STUDIO_ROOM_PREVIEW_VERSION
  );
}
function numberIn(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}
function color(value: unknown) {
  return typeof value === "string" && /^#[0-9A-F]{6}$/i.test(value);
}
function tileImage(value: unknown): value is StudioRoomTileImage {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["height", "id", "order", "ref", "transform", "width"])
  )
    return false;
  const transform = value.transform;
  return (
    numberIn(value.height, 1, 16_384) &&
    numberIn(value.width, 1, 16_384) &&
    typeof value.order === "number" &&
    Number.isSafeInteger(value.order) &&
    value.order >= 0 &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    value.id.length <= 512 &&
    typeof value.ref === "string" &&
    value.ref.length > 0 &&
    value.ref.length <= 512 &&
    !/^data:/i.test(value.ref) &&
    isRecord(transform) &&
    hasOnlyKeys(transform, ["flipHorizontal", "flipVertical", "rotationDeg"]) &&
    typeof transform.flipHorizontal === "boolean" &&
    typeof transform.flipVertical === "boolean" &&
    (transform.rotationDeg === 0 ||
      transform.rotationDeg === 90 ||
      transform.rotationDeg === 180 ||
      transform.rotationDeg === 270)
  );
}

export function isStudioRoomPreviewSettings(value: unknown): value is StudioRoomPreviewSettings {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "composition",
      "fineGrid",
      "grid",
      "height",
      "motion",
      "room",
      "tiles",
      "trail",
    ])
  )
    return false;
  const { composition, fineGrid, grid, motion, room, tiles, trail } = value;
  if (!Number.isInteger(value.height) || !numberIn(value.height, 576, 8192)) return false;
  if (
    !isRecord(composition) ||
    !hasOnlyKeys(composition, ["buttonGap", "firstRowScale", "lineGap", "secondRowScale"]) ||
    !numberIn(composition.buttonGap, 0, 160) ||
    !numberIn(composition.firstRowScale, 50, 150) ||
    !numberIn(composition.lineGap, -40, 80) ||
    !numberIn(composition.secondRowScale, 50, 150)
  )
    return false;
  if (
    !isRecord(room) ||
    !hasOnlyKeys(room, ["depth", "innerGrid", "vanishing", "wallBorder", "wallFill"]) ||
    !numberIn(room.depth, 0, 1) ||
    !isRecord(room.innerGrid) ||
    !hasOnlyKeys(room.innerGrid, ["depth", "enabled", "falloff", "opacity"]) ||
    !numberIn(room.innerGrid.depth, 5, 60) ||
    typeof room.innerGrid.enabled !== "boolean" ||
    !numberIn(room.innerGrid.falloff, 0.5, 4) ||
    !numberIn(room.innerGrid.opacity, 0, 100) ||
    !isRecord(room.vanishing) ||
    !hasOnlyKeys(room.vanishing, ["x", "y"]) ||
    !numberIn(room.vanishing.x, -1, 1) ||
    !numberIn(room.vanishing.y, -1, 1) ||
    !isRecord(room.wallBorder) ||
    !hasOnlyKeys(room.wallBorder, ["colorOpacity", "width"]) ||
    !numberIn(room.wallBorder.width, 0, 12) ||
    !isRecord(room.wallBorder.colorOpacity) ||
    !hasOnlyKeys(room.wallBorder.colorOpacity, ["hex", "opacity"]) ||
    !color(room.wallBorder.colorOpacity.hex) ||
    !numberIn(room.wallBorder.colorOpacity.opacity, 0, 100) ||
    !color(room.wallFill)
  )
    return false;
  if (
    !isRecord(grid) ||
    !hasOnlyKeys(grid, ["color", "columns", "depthDivisions", "opacity", "rows", "thickness"]) ||
    !color(grid.color) ||
    !Number.isInteger(grid.columns) ||
    !numberIn(grid.columns, 4, 16) ||
    !Number.isInteger(grid.rows) ||
    !numberIn(grid.rows, 2, 8) ||
    !Number.isInteger(grid.depthDivisions) ||
    !numberIn(grid.depthDivisions, 2, 8) ||
    !numberIn(grid.opacity, 0, 100) ||
    !numberIn(grid.thickness, 0.5, 4)
  )
    return false;
  if (
    !isRecord(fineGrid) ||
    !hasOnlyKeys(fineGrid, ["color", "enabled", "opacity", "subdivision", "thickness"]) ||
    typeof fineGrid.enabled !== "boolean" ||
    !color(fineGrid.color) ||
    !numberIn(fineGrid.opacity, 0, 100) ||
    !Number.isInteger(fineGrid.subdivision) ||
    !numberIn(fineGrid.subdivision, 2, 6) ||
    !numberIn(fineGrid.thickness, 0.5, 2)
  )
    return false;
  if (
    !isRecord(motion) ||
    !hasOnlyKeys(motion, ["enabled", "parallax", "scrollNudge", "smoothness"]) ||
    typeof motion.enabled !== "boolean" ||
    !numberIn(motion.parallax, 0, 150) ||
    !numberIn(motion.scrollNudge, 0, 1) ||
    !numberIn(motion.smoothness, 0, 1)
  )
    return false;
  if (
    !isRecord(trail) ||
    !hasOnlyKeys(trail, ["amount", "enabled", "fade", "strength"]) ||
    typeof trail.enabled !== "boolean" ||
    !Number.isInteger(trail.amount) ||
    !numberIn(trail.amount, 1, 3) ||
    !numberIn(trail.fade, 0.2, 2) ||
    !numberIn(trail.strength, 0, 100)
  )
    return false;
  if (
    !isRecord(tiles) ||
    !hasOnlyKeys(tiles, [
      "develop",
      "fog",
      "hoverLift",
      "images",
      "interval",
      "perSurface",
      "shuffleStyle",
    ]) ||
    !numberIn(tiles.develop, 0, 1) ||
    !numberIn(tiles.fog, 0, 1) ||
    !numberIn(tiles.hoverLift, 0, 1) ||
    !numberIn(tiles.interval, 0.4, 5) ||
    !Number.isInteger(tiles.perSurface) ||
    !numberIn(tiles.perSurface, 1, 6) ||
    (tiles.shuffleStyle !== "slide" && tiles.shuffleStyle !== "swap") ||
    !Array.isArray(tiles.images) ||
    !tiles.images.every(tileImage)
  )
    return false;
  const ids = new Set(tiles.images.map((image) => image.id));
  const refs = new Set(tiles.images.map((image) => image.ref));
  const orders = new Set(tiles.images.map((image) => image.order));
  return (
    ids.size === tiles.images.length &&
    refs.size === tiles.images.length &&
    orders.size === tiles.images.length
  );
}

export function createStudioRoomPreviewSettingsMessage(
  settings: StudioRoomPreviewSettings,
): StudioRoomPreviewSettingsMessage {
  return {
    channel: STUDIO_ROOM_PREVIEW_CHANNEL,
    payload: settings,
    type: "settings",
    version: STUDIO_ROOM_PREVIEW_VERSION,
  };
}
export function createStudioRoomPreviewMediaMessage(
  images: readonly StudioRoomPreviewMediaItem[],
): StudioRoomPreviewMediaMessage {
  return {
    channel: STUDIO_ROOM_PREVIEW_CHANNEL,
    images,
    type: "media",
    version: STUDIO_ROOM_PREVIEW_VERSION,
  };
}
export function createStudioRoomPreviewReadyRequestMessage(): StudioRoomPreviewReadyRequestMessage {
  return {
    channel: STUDIO_ROOM_PREVIEW_CHANNEL,
    type: "ready-request",
    version: STUDIO_ROOM_PREVIEW_VERSION,
  };
}
export function createStudioRoomPreviewSaveSettingsMessage({
  intent,
  payload,
  requestId,
}: Readonly<{
  intent: StudioRoomWebsiteSettingsSaveIntent;
  payload: StudioRoomPreviewSettings;
  requestId: string;
}>): StudioRoomPreviewSaveSettingsMessage {
  return {
    channel: STUDIO_ROOM_PREVIEW_CHANNEL,
    intent,
    payload,
    requestId,
    type: "save-settings",
    version: STUDIO_ROOM_PREVIEW_VERSION,
  };
}
export function isStudioRoomPreviewSettingsMessage(
  value: unknown,
): value is StudioRoomPreviewSettingsMessage {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["channel", "payload", "type", "version"]) &&
    hasEnvelope(value, "settings") &&
    isStudioRoomPreviewSettings(value.payload)
  );
}
export function isStudioRoomPreviewReadyMessage(
  value: unknown,
): value is StudioRoomPreviewReadyMessage {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["channel", "type", "version"]) &&
    hasEnvelope(value, "ready")
  );
}
export function isStudioRoomPreviewSaveResultMessage(
  value: unknown,
): value is StudioRoomPreviewSaveResultMessage {
  if (!isRecord(value) || !hasEnvelope(value, "save-result")) return false;
  const expectedKeys =
    value.message === undefined
      ? ["channel", "ok", "requestId", "type", "version"]
      : ["channel", "message", "ok", "requestId", "type", "version"];
  return (
    hasOnlyKeys(value, expectedKeys) &&
    typeof value.ok === "boolean" &&
    typeof value.requestId === "string" &&
    value.requestId.length > 0 &&
    value.requestId.length <= 128 &&
    (value.message === undefined || typeof value.message === "string")
  );
}

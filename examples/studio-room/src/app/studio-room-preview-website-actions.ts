import type {
  StudioRoomPreviewSettings,
  StudioRoomWebsiteSettingsSaveIntent,
} from "./studio-room-preview-protocol";

export type StudioRoomWebsiteSettingsSaveRequest = Readonly<{
  intent: StudioRoomWebsiteSettingsSaveIntent;
  settings: StudioRoomPreviewSettings;
}>;
type SaveHandler = (request: StudioRoomWebsiteSettingsSaveRequest) => Promise<void>;
let activeSaveHandler: SaveHandler | null = null;

export function registerStudioRoomWebsiteSettingsSaveHandler(handler: SaveHandler) {
  activeSaveHandler = handler;
  return () => {
    if (activeSaveHandler === handler) activeSaveHandler = null;
  };
}

export function saveStudioRoomWebsiteSettings(request: StudioRoomWebsiteSettingsSaveRequest) {
  return activeSaveHandler
    ? activeSaveHandler(request)
    : Promise.reject(new Error("The website preview is not ready."));
}

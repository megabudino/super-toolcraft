import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { StudioRoomNativePreview } from "./studio-room-native-preview";

export function getStudioRoomSceneBounds(size: Readonly<{ height: number; width: number }>) {
  return [{ height: size.height, width: size.width, x: 0, y: 0 }] as const;
}

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <StudioRoomNativePreview />,
  renderDefaultCanvasMedia: false,
  sceneBoundsProvider: ({ state }) => getStudioRoomSceneBounds(state.canvas.size),
  schema: appSchema,
};

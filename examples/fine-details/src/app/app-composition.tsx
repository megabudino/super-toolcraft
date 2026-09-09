import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { handleFineDetailsPanelAction } from "./fine-details-panel-actions";
import { FineDetailsNativePreview } from "./fine-details-native-preview";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <FineDetailsNativePreview />,
  onPanelAction: handleFineDetailsPanelAction,
  renderDefaultCanvasMedia: false,
  sceneBoundsProvider: ({ state }) => [
    {
      height: state.canvas.size.height,
      width: state.canvas.size.width,
      x: 0,
      y: 0,
    },
  ],
  schema: appSchema,
};

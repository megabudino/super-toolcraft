import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { grassRendererPipelineRegistration } from "./app-renderer-pipeline";
import { appSchema } from "./app-schema";
import { GrassOutput } from "./grass/grass-output";
import { GrassNoisePreviewControl } from "./grass/grass-noise-preview";
import { onGrassPanelAction } from "./grass/grass-panel-actions";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <GrassOutput />,
  controlRenderers: {
    grassNoisePreview: GrassNoisePreviewControl,
  },
  onPanelAction: onGrassPanelAction,
  rendererPipelineRegistration: grassRendererPipelineRegistration,
  renderDefaultCanvasMedia: false,
  schema: appSchema,
};

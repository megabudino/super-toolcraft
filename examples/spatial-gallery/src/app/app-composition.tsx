import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { SpiralGalleryCanvas } from "./spiral-gallery/spiral-gallery-canvas";
import { handleSpiralGalleryPanelAction } from "./spiral-gallery/spiral-gallery-export";
import { spiralGalleryPipelineRegistration } from "./spiral-gallery/spiral-gallery-pipeline";

export const appComposition = {
  canvasContent: <SpiralGalleryCanvas />,
  controlRenderers: undefined,
  modelPresentation: { mode: "runtime" },
  onPanelAction: handleSpiralGalleryPanelAction,
  renderDefaultCanvasMedia: false,
  rendererPipelineRegistration: spiralGalleryPipelineRegistration,
  schema: appSchema,
} satisfies ToolcraftAppComposition;

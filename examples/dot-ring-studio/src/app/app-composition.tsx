import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import {
  DotRingRenderer,
  handleDotRingPanelAction,
} from "./dot-ring-renderer";
import { rendererPipelineRegistration } from "./dot-ring-pipeline";
import { getDotRingSceneBounds } from "./dot-ring-scene-bounds";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <DotRingRenderer />,
  modelPresentation: { mode: "runtime" },
  onPanelAction: handleDotRingPanelAction,
  renderDefaultCanvasMedia: false,
  rendererPipelineRegistration,
  sceneBoundsProvider: getDotRingSceneBounds,
  schema: appSchema,
};

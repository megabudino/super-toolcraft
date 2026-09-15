import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { GLOBE_TARGETS } from "./globe-constants";
import { requestLogoIntroRun } from "./globe-logo-intro-controller";
import {
  GlobeCanvas,
  globeExportRenderer,
  globeSceneBoundsProvider,
} from "./globe-renderer";
import { globeRendererPipelineRegistration } from "./globe-renderer-pipeline";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <GlobeCanvas />,
  exportRenderer: globeExportRenderer,
  onPanelAction: ({ action }) => {
    if (action.value === GLOBE_TARGETS.logoIntroRun) {
      requestLogoIntroRun();
    }
  },
  rendererPipelineRegistration: globeRendererPipelineRegistration,
  sceneBoundsProvider: globeSceneBoundsProvider,
  schema: appSchema,
};

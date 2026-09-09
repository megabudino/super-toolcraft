import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { exportDotsImage, exportDotsVideo } from "./dots/dots-export";
import { rendererPipelineRegistration } from "./dots/dots-pipeline";
import { getDotsSceneBounds } from "./dots/dots-scene-bounds";
import {
  applyDotColorTheme,
  isDotColorThemeActionValue,
} from "./dots/dots-theme";
import { DotsRenderer } from "./dots/dots-renderer";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <DotsRenderer />,
  modelPresentation: { mode: "runtime" },
  onPanelAction: (context) => {
    if (context.action.value === "export.png") {
      return exportDotsImage(context);
    }
    if (context.action.value === "export.video") {
      return exportDotsVideo(context);
    }
    if (isDotColorThemeActionValue(context.action.value)) {
      applyDotColorTheme(context);
    }
  },
  rendererPipelineRegistration,
  sceneBoundsProvider: getDotsSceneBounds,
  schema: appSchema,
};

import type { ToolcraftPanelActionHandler } from "@/toolcraft/runtime/react";

import { exportGrassImage, exportGrassVideo } from "./grass-export";
import {
  applyGrassSceneRandomization,
  applyGrassSceneScratch,
} from "./grass-randomizer";

export const onGrassPanelAction: ToolcraftPanelActionHandler = ({
  action,
  dispatch,
  rendererPipeline,
  reportProgress,
  state,
}) => {
  if (action.value === "randomize.scene") {
    applyGrassSceneRandomization({ dispatch, state });
    return;
  }
  if (action.value === "scratch.scene") {
    applyGrassSceneScratch({ dispatch, state });
    return;
  }
  if (action.value === "export.png") {
    return exportGrassImage(state, reportProgress, rendererPipeline);
  }
  if (action.value === "export.video") {
    return exportGrassVideo(state, reportProgress, rendererPipeline);
  }
};

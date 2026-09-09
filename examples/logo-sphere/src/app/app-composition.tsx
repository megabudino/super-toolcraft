import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { LogoSphereCanvas } from "./logo-sphere-canvas";
import { waitForLogoSphereImages } from "./logo-sphere-image-registry";
import {
  logoSphereExportPass,
  logoSpherePipelineRegistration,
} from "./logo-sphere-pipeline";
import { renderLogoSphereSharedFrame } from "./logo-sphere-surface-renderer";
import {
  createLogoSphereProjectionInput,
  getLogoSphereCardStyle,
  getLogoSphereSceneRect,
  getLogoSphereSourceAssets,
} from "./logo-sphere-state";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <LogoSphereCanvas />,
  exportRenderer: {
    baseFileName: "logo-sphere",
    renderFrame: async ({
      context,
      frame,
      rendererPipeline,
      state,
      timelineProgress,
    }) => {
      const images = await waitForLogoSphereImages(
        getLogoSphereSourceAssets(state.mediaAssets),
      );
      const draw = () => {
        const background = state.values["appearance.background"];
        const includeBackground =
          state.values["export.image.format"] === "jpg" ||
          state.values["export.includeBackground"] !== false;
        renderLogoSphereSharedFrame({
          backgroundColor:
            includeBackground &&
            typeof background === "string" &&
            background.trim().length > 0
              ? background
              : null,
          cardStyle: getLogoSphereCardStyle(state),
          context,
          images,
          projection: createLogoSphereProjectionInput(state, frame, {
            loopProgress: timelineProgress,
          }),
        });
      };

      if (rendererPipeline) {
        await rendererPipeline.runPass(logoSphereExportPass, undefined, draw);
      } else {
        draw();
      }
    },
  },
  renderDefaultCanvasMedia: false,
  rendererPipelineRegistration: logoSpherePipelineRegistration,
  sceneBoundsProvider: ({ state }) => {
    const bounds = getLogoSphereSceneRect(state);
    return bounds ? [bounds] : [];
  },
  schema: appSchema,
};

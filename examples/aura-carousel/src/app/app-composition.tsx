import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { dispersionCarouselExportRenderer } from "./dispersion-carousel/dispersion-carousel-export";
import { dispersionCarouselRendererPipelineRegistration } from "./dispersion-carousel/dispersion-carousel-pipeline";
import { DispersionCarouselRenderer } from "./dispersion-carousel/dispersion-carousel-renderer";
import { DISPERSION_CAROUSEL_GEOMETRY } from "./dispersion-carousel/dispersion-carousel-values";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <DispersionCarouselRenderer />,
  exportRenderer: dispersionCarouselExportRenderer,
  modelPresentation: { mode: "runtime" },
  rendererPipelineRegistration: dispersionCarouselRendererPipelineRegistration,
  renderDefaultCanvasMedia: false,
  sceneBoundsProvider: () => [
    {
      height: DISPERSION_CAROUSEL_GEOMETRY.canvasHeight,
      width: DISPERSION_CAROUSEL_GEOMETRY.trackWidth,
      x: 0,
      y: 0,
    },
  ],
  schema: appSchema,
};

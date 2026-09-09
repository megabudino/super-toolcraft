import { registerToolcraftRendererPipeline } from "@/toolcraft/runtime";

import { grassRendererInteractionInvalidation } from "./app-renderer-interactions";
import { grassRendererPassDefinitions } from "./app-renderer-pass-definitions";
import type { GrassRendererPassContracts } from "./app-renderer-pipeline-types";

export const grassRendererPipelineRegistration =
  registerToolcraftRendererPipeline<GrassRendererPassContracts>()({
    interactionInvalidation: grassRendererInteractionInvalidation,
    passes: grassRendererPassDefinitions,
    runtimeId: "grass-live-pbr-clumps-webgl-v20",
  });

export const grassPipelinePasses = {
  butterflyLayoutBuild: grassRendererPipelineRegistration.getPass(
    "grass-butterfly-layout-build",
  ),
  butterflyResource: grassRendererPipelineRegistration.getPass(
    "grass-butterfly-resource",
  ),
  environmentResource: grassRendererPipelineRegistration.getPass(
    "grass-environment-resource",
  ),
  groundGeometryBuild: grassRendererPipelineRegistration.getPass(
    "grass-ground-geometry-build",
  ),
  scanResource: grassRendererPipelineRegistration.getPass(
    "grass-scan-resource",
  ),
  exportFrame: grassRendererPipelineRegistration.getPass("grass-export-frame"),
  layoutBuild: grassRendererPipelineRegistration.getPass("grass-layout-build"),
  lawnLayoutBuild: grassRendererPipelineRegistration.getPass(
    "grass-lawn-layout-build",
  ),
  sceneRender: grassRendererPipelineRegistration.getPass("grass-scene-render"),
  sceneResource: grassRendererPipelineRegistration.getPass(
    "grass-scene-resource",
  ),
  rockLayoutBuild: grassRendererPipelineRegistration.getPass(
    "grass-rock-layout-build",
  ),
  tuftedLayoutBuild: grassRendererPipelineRegistration.getPass(
    "grass-tufted-layout-build",
  ),
  whiteLayoutBuild: grassRendererPipelineRegistration.getPass(
    "grass-white-layout-build",
  ),
  wildLayoutBuild: grassRendererPipelineRegistration.getPass(
    "grass-wild-layout-build",
  ),
  yellowLayoutBuild: grassRendererPipelineRegistration.getPass(
    "grass-yellow-layout-build",
  ),
  noisePreview: grassRendererPipelineRegistration.getPass(
    "grass-noise-preview",
  ),
} as const;

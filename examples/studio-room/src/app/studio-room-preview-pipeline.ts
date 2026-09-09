import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import { studioRoomTargets } from "./studio-room-values";

export const studioRoomPreviewSettingsTargets = [
  "canvas.size.height",
  studioRoomTargets.compositionFirstRowScale,
  studioRoomTargets.compositionSecondRowScale,
  studioRoomTargets.compositionLineGap,
  studioRoomTargets.compositionButtonGap,
  studioRoomTargets.roomDepth,
  studioRoomTargets.roomWallFill,
  studioRoomTargets.roomWallBorderWidth,
  studioRoomTargets.roomWallBorderColorOpacity,
  studioRoomTargets.roomVanishing,
  studioRoomTargets.gridColumns,
  studioRoomTargets.gridRows,
  studioRoomTargets.gridDepthDivisions,
  studioRoomTargets.gridColor,
  studioRoomTargets.gridOpacity,
  studioRoomTargets.gridThickness,
  studioRoomTargets.fineGridEnabled,
  studioRoomTargets.fineGridSubdivision,
  studioRoomTargets.fineGridColor,
  studioRoomTargets.fineGridOpacity,
  studioRoomTargets.fineGridThickness,
  studioRoomTargets.tilesPerSurface,
  studioRoomTargets.tilesInterval,
  studioRoomTargets.tilesShuffleStyle,
  studioRoomTargets.tilesDevelop,
  studioRoomTargets.tilesHoverLift,
  studioRoomTargets.tilesFog,
  studioRoomTargets.motionEnabled,
  studioRoomTargets.motionParallax,
  studioRoomTargets.motionSmoothness,
  studioRoomTargets.motionScrollNudge,
  studioRoomTargets.trailEnabled,
  studioRoomTargets.trailAmount,
  studioRoomTargets.trailStrength,
  studioRoomTargets.trailFade,
  studioRoomTargets.roomInnerGridEnabled,
  studioRoomTargets.roomInnerGridDepth,
  studioRoomTargets.roomInnerGridFalloff,
  studioRoomTargets.roomInnerGridOpacity,
] as const;

type Passes = {
  "media-sync": ToolcraftRendererPipelinePassContract<void>;
  "preview-sync": ToolcraftRendererPipelinePassContract<void>;
};

export const studioRoomPreviewPipelineRegistration = registerToolcraftRendererPipeline<Passes>()({
  interactionInvalidation: [
    {
      interaction: "initial-render",
      invalidates: ["preview-sync"],
      targets: ["canvas.initial-render"],
    },
    {
      interaction: "control-change",
      invalidates: ["preview-sync"],
      targets: studioRoomPreviewSettingsTargets,
    },
    {
      interaction: "media-import",
      invalidates: ["media-sync", "preview-sync"],
      targets: [studioRoomTargets.tilesImages],
    },
    {
      interaction: "viewport-drag",
      invalidates: [],
      mustNotInvalidate: ["media-sync", "preview-sync"],
      targets: ["canvas.viewport"],
    },
    {
      interaction: "viewport-zoom",
      invalidates: [],
      mustNotInvalidate: ["media-sync", "preview-sync"],
      targets: ["canvas.viewport"],
    },
  ],
  passes: [
    {
      cost: { dimensions: ["tile-image-count"], frequency: "batch", relationship: "linear" },
      id: "media-sync",
      inputs: [
        studioRoomTargets.tilesImages,
        "runtime image presentation URLs and cached <=1024px derivatives",
      ],
      invalidatedBy: [studioRoomTargets.tilesImages],
      kind: "preprocess",
      lifecycle: { cache: "none", resourceScope: "call" },
      output: "source",
      quality: "retina",
      runsOn: "main",
    },
    {
      cost: {
        dimensions: [
          "grid-columns",
          "grid-rows",
          "grid-depth-divisions",
          "fine-grid-subdivision",
          "tiles-per-surface",
          "trail-line-amount",
        ],
        frequency: "interaction",
        relationship: "linear",
      },
      id: "preview-sync",
      inputs: [...studioRoomPreviewSettingsTargets, "website-owned Recraft Studio Room DOM"],
      invalidatedBy: studioRoomPreviewSettingsTargets,
      kind: "composite",
      lifecycle: { cache: "none", resourceScope: "call" },
      output: "preview",
      quality: "full",
      runsOn: "main",
    },
  ],
  runtimeId: "studio-room-external-preview-v6",
});

export const studioRoomPreviewMediaPass =
  studioRoomPreviewPipelineRegistration.getPass("media-sync");
export const studioRoomPreviewSyncPass =
  studioRoomPreviewPipelineRegistration.getPass("preview-sync");

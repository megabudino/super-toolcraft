import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import { fineDetailsCarouselTargets } from "./fine-details-carousel-values";
import { fineDetailsPromptFlightTargets } from "./fine-details-prompt-flight-values";
import { fineDetailsTargets } from "./fine-details-values";
import { fineDetailsLoadingTargets } from "./fine-details-loading-values";
import { fineDetailsPromptTargets } from "./fine-details-prompt-values";
import { fineDetailsTypographyTargets } from "./fine-details-typography-values";
import { fineDetailsTrailTargets } from "./fine-details-trail-values";

const previewSettingsTargets = [
  "canvas.size.height",
  fineDetailsCarouselTargets.imagesMode,
  fineDetailsCarouselTargets.count,
  fineDetailsCarouselTargets.textGap,
  fineDetailsCarouselTargets.radius,
  fineDetailsCarouselTargets.gap,
  fineDetailsCarouselTargets.speed,
  fineDetailsCarouselTargets.borderEnabled,
  fineDetailsCarouselTargets.borderWidth,
  fineDetailsCarouselTargets.borderColorOpacity,
  fineDetailsCarouselTargets.shadowEnabled,
  fineDetailsCarouselTargets.shadowOffset,
  fineDetailsCarouselTargets.shadowBlur,
  fineDetailsCarouselTargets.shadowSpread,
  fineDetailsCarouselTargets.shadowColorOpacity,
  fineDetailsTargets.background,
  fineDetailsTargets.gridOpacity,
  fineDetailsTargets.gridSize,
  fineDetailsPromptTargets.position,
  fineDetailsPromptTargets.shadowBlur,
  fineDetailsPromptTargets.shadowColorOpacity,
  fineDetailsPromptTargets.shadowEnabled,
  fineDetailsPromptTargets.shadowOffset,
  fineDetailsPromptTargets.shadowSpread,
  fineDetailsPromptFlightTargets.enabled,
  fineDetailsPromptFlightTargets.ghosts,
  fineDetailsLoadingTargets.enabled,
  fineDetailsLoadingTargets.borderColorOpacity,
  fineDetailsPromptTargets.typingDeleteSpeed,
  fineDetailsPromptTargets.typingDeleteStyle,
  fineDetailsPromptTargets.typingEnabled,
  fineDetailsPromptTargets.typingGap,
  fineDetailsPromptTargets.typingHold,
  fineDetailsPromptTargets.typingHumanize,
  fineDetailsPromptTargets.typingPhrases,
  fineDetailsPromptTargets.typingTypeSpeed,
  fineDetailsTypographyTargets.upperLeftLeft,
  fineDetailsTypographyTargets.upperLeftTop,
  fineDetailsTypographyTargets.upperLeftFontSize,
  fineDetailsTypographyTargets.lowerRightRight,
  fineDetailsTypographyTargets.lowerRightBottom,
  fineDetailsTypographyTargets.lowerRightHeadingFontSize,
  fineDetailsTypographyTargets.lowerRightBodyFontSize,
  fineDetailsTypographyTargets.lowerRightGap,
  fineDetailsTrailTargets.enabled,
  fineDetailsTrailTargets.borderEnabled,
  fineDetailsTrailTargets.borderWidth,
  fineDetailsTrailTargets.borderColor,
  fineDetailsTrailTargets.cardSize,
  fineDetailsTrailTargets.cardRadius,
  fineDetailsTrailTargets.length,
  fineDetailsTrailTargets.sizeFalloff,
  fineDetailsTrailTargets.spacing,
  fineDetailsTrailTargets.tilt,
  fineDetailsTrailTargets.smoothness,
  fineDetailsTrailTargets.lifetime,
  fineDetailsTrailTargets.fadeIn,
  fineDetailsTrailTargets.fadeOut,
  fineDetailsTrailTargets.resumeDelay,
  fineDetailsTrailTargets.resumeRamp,
  fineDetailsTrailTargets.shadowEnabled,
  fineDetailsTrailTargets.shadowOffset,
  fineDetailsTrailTargets.shadowBlur,
  fineDetailsTrailTargets.shadowSpread,
  fineDetailsTrailTargets.shadowColorOpacity,
] as const;

const promptFlightControlDragTargets = [
  fineDetailsPromptFlightTargets.offsetX,
  fineDetailsPromptFlightTargets.offsetY,
  fineDetailsPromptFlightTargets.startDelay,
  fineDetailsPromptFlightTargets.flightTime,
  fineDetailsPromptFlightTargets.bounce,
  fineDetailsPromptFlightTargets.ghostSpacing,
  fineDetailsPromptFlightTargets.ghostOpacity,
  fineDetailsPromptFlightTargets.ghostFalloff,
  fineDetailsPromptFlightTargets.vanishStagger,
  fineDetailsPromptFlightTargets.vanishTime,
] as const;

const loadingWaveControlDragTargets = [
  fineDetailsLoadingTargets.cell,
  fineDetailsLoadingTargets.contrast,
  fineDetailsLoadingTargets.baseTone,
  fineDetailsLoadingTargets.glare,
  fineDetailsLoadingTargets.distort,
  fineDetailsLoadingTargets.borderWidth,
  fineDetailsLoadingTargets.waveWidth,
  fineDetailsLoadingTargets.softness,
  fineDetailsLoadingTargets.angle,
  fineDetailsLoadingTargets.passTime,
  fineDetailsLoadingTargets.pause,
  fineDetailsLoadingTargets.stagger,
  fineDetailsLoadingTargets.desync,
] as const;

const controlDragTargets = [
  ...promptFlightControlDragTargets,
  ...loadingWaveControlDragTargets,
] as const;

const previewSyncTargets = [
  ...previewSettingsTargets,
  ...controlDragTargets,
] as const;

type FineDetailsPreviewPipelinePasses = {
  "media-sync": ToolcraftRendererPipelinePassContract<void>;
  "preview-sync": ToolcraftRendererPipelinePassContract<void>;
};

export const fineDetailsPreviewPipelineRegistration =
  registerToolcraftRendererPipeline<FineDetailsPreviewPipelinePasses>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: ["preview-sync"],
        targets: ["canvas.initial-render"],
      },
      {
        interaction: "control-change",
        invalidates: ["preview-sync"],
        targets: previewSettingsTargets,
      },
      {
        interaction: "control-drag",
        invalidates: ["preview-sync"],
        targets: controlDragTargets,
      },
      {
        interaction: "media-import",
        invalidates: ["media-sync", "preview-sync"],
        targets: [fineDetailsTrailTargets.images],
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
        cost: {
          dimensions: ["trail-image-count"],
          frequency: "batch",
          relationship: "linear",
        },
        id: "media-sync",
        inputs: [
          fineDetailsTrailTargets.images,
          "runtime-owned binary presentation URLs and cached preview derivatives for the Fine Details trail image set",
        ],
        invalidatedBy: [fineDetailsTrailTargets.images],
        kind: "preprocess",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "source",
        quality: "retina",
        runsOn: "main",
      },
      {
        cost: {
          dimensions: [],
          frequency: "discrete",
          relationship: "constant",
        },
        id: "preview-sync",
        inputs: [...previewSyncTargets, "website-owned Recraft Fine Details DOM"],
        invalidatedBy: previewSyncTargets,
        kind: "composite",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "preview",
        quality: "full",
        runsOn: "main",
      },
    ],
    runtimeId: "fine-details-external-preview-v17",
  });

export const fineDetailsPreviewMediaPass =
  fineDetailsPreviewPipelineRegistration.getPass("media-sync");

export const fineDetailsPreviewSyncPass =
  fineDetailsPreviewPipelineRegistration.getPass("preview-sync");

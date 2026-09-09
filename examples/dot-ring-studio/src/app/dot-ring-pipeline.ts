import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import type { DotRingAudioProfile } from "./dot-ring-types";

export const dotRingPassIds = {
  audioAnalysis: "dot-ring.audio-analysis",
  imageExport: "dot-ring.image-export",
  previewFrame: "dot-ring.preview-frame",
  videoFrame: "dot-ring.video-frame",
} as const;

type DotRingPipelineContracts = {
  [dotRingPassIds.audioAnalysis]:
    ToolcraftRendererPipelinePassContract<DotRingAudioProfile>;
  [dotRingPassIds.previewFrame]: ToolcraftRendererPipelinePassContract<void>;
  [dotRingPassIds.imageExport]: ToolcraftRendererPipelinePassContract<void>;
  [dotRingPassIds.videoFrame]: ToolcraftRendererPipelinePassContract<Blob>;
};

const geometryTargets = [
  "canvas.aspectRatio",
  "canvas.size.width",
  "canvas.size.height",
  "ring.radius",
  "ring.density",
  "ring.rows",
] as const;

const appearanceTargets = [
  "ring.color1",
  "ring.color2",
  "ring.color3",
  "ring.color4",
  "ring.color5",
  "ring.colorMode",
  "ring.colorSpread",
  "ring.dotSize",
  "ring.sizeResponse",
  "ring.glow",
  "wave.formula",
  "wave.speed",
  "wave.rotationSpeed",
  "wave.globalRotationSpeed",
  "wave.affectedAmplitude",
  "wave.calmAmplitude",
  "wave.sectorAngle",
  "wave.rowEcho",
  "appearance.background",
  "export.includeBackground",
  "canvas.renderScale",
] as const;

const previewPasses = [
  dotRingPassIds.audioAnalysis,
  dotRingPassIds.previewFrame,
] as const;

export const rendererPipelineRegistration =
  registerToolcraftRendererPipeline<DotRingPipelineContracts>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: previewPasses,
        targets: ["runtime.initial-render"],
      },
      {
        interaction: "media-import",
        invalidates: previewPasses,
        targets: ["audio.source"],
      },
      {
        interaction: "control-drag",
        invalidates: [dotRingPassIds.previewFrame],
        mustNotInvalidate: [dotRingPassIds.audioAnalysis],
        targets: [...geometryTargets, ...appearanceTargets],
      },
      {
        interaction: "control-change",
        invalidates: [dotRingPassIds.previewFrame],
        mustNotInvalidate: [dotRingPassIds.audioAnalysis],
        targets: [
          ...geometryTargets,
          ...appearanceTargets,
          "panels.timeline.extended",
          "export.image.format",
          "export.image.resolution",
          "export.video.format",
          "export.video.resolution",
        ],
      },
      {
        interaction: "animation-frame",
        invalidates: [dotRingPassIds.previewFrame],
        mustNotInvalidate: [dotRingPassIds.audioAnalysis],
        targets: ["runtime.animation-frame"],
      },
      {
        interaction: "timeline-playback",
        invalidates: [dotRingPassIds.previewFrame],
        mustNotInvalidate: [dotRingPassIds.audioAnalysis],
        targets: ["runtime.timeline"],
      },
      {
        interaction: "timeline-scrub",
        invalidates: [dotRingPassIds.previewFrame],
        mustNotInvalidate: [dotRingPassIds.audioAnalysis],
        targets: ["runtime.timeline"],
      },
      {
        interaction: "viewport-drag",
        invalidates: [],
        mustNotInvalidate: previewPasses,
        targets: ["runtime.canvas.viewport"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: [],
        mustNotInvalidate: previewPasses,
        targets: ["runtime.canvas.viewport"],
      },
      {
        interaction: "export",
        invalidates: [dotRingPassIds.imageExport],
        mustNotInvalidate: previewPasses,
        targets: [
          "export.png",
          "export.image.format",
          "export.image.resolution",
          "export.includeBackground",
        ],
      },
      {
        interaction: "export",
        invalidates: [dotRingPassIds.videoFrame],
        mustNotInvalidate: previewPasses,
        targets: [
          "export.video",
          "export.video.format",
          "export.video.resolution",
          "runtime.timeline.duration",
        ],
      },
    ],
    passes: [
      {
        cacheKey: ["sourceId"],
        cost: {
          dimensions: [],
          frequency: "discrete",
          relationship: "constant",
        },
        id: dotRingPassIds.audioAnalysis,
        inputs: ["audio.source"],
        invalidatedBy: ["audio.source"],
        kind: "decode",
        lifecycle: { cache: "memoized", resourceScope: "source" },
        output: "intermediate",
        quality: "full",
        runsOn: "main",
      },
      {
        cost: {
          dimensions: ["ring-density", "ring-rows"],
          frequency: "frame",
          relationship: "product",
        },
        id: dotRingPassIds.previewFrame,
        inputs: [
          "decoded audio profile",
          "ring geometry",
          "wave settings",
          "timeline time",
        ],
        invalidatedBy: [
          "audio.source",
          ...geometryTargets,
          ...appearanceTargets,
          "runtime.timeline",
        ],
        kind: "vector-build",
        lifecycle: { cache: "none", resourceScope: "renderer" },
        output: "preview",
        quality: "retina",
        runsOn: "main",
      },
      {
        cost: {
          dimensions: ["ring-density", "ring-rows", "image-long-edge"],
          frequency: "batch",
          relationship: "product",
        },
        id: dotRingPassIds.imageExport,
        inputs: [
          "decoded audio profile",
          "selected timeline frame",
          "image settings",
        ],
        invalidatedBy: [
          "export.png",
          "export.image.format",
          "export.image.resolution",
          "export.includeBackground",
        ],
        kind: "export",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "export",
        quality: "export",
        runsOn: "export-only",
      },
      {
        cost: {
          dimensions: ["ring-density", "ring-rows", "video-long-edge"],
          frequency: "batch",
          relationship: "product",
        },
        id: dotRingPassIds.videoFrame,
        inputs: [
          "decoded audio profile",
          "timeline timestamps",
          "video settings",
        ],
        invalidatedBy: [
          "export.video",
          "export.video.format",
          "export.video.resolution",
          "runtime.timeline.duration",
        ],
        kind: "export",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "export",
        quality: "export",
        runsOn: "export-only",
      },
    ],
    runtimeId: "dot-ring.renderer@2",
  });

export const dotRingPipelinePasses = {
  audioAnalysis: rendererPipelineRegistration.getPass(
    dotRingPassIds.audioAnalysis,
  ),
  imageExport: rendererPipelineRegistration.getPass(dotRingPassIds.imageExport),
  previewFrame: rendererPipelineRegistration.getPass(
    dotRingPassIds.previewFrame,
  ),
  videoFrame: rendererPipelineRegistration.getPass(dotRingPassIds.videoFrame),
} as const;

import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

export const dotsPassIds = {
  imageExport: "dots.image-export",
  previewFrame: "dots.preview-frame",
  shapeSample: "dots.shape-sample",
  videoFrame: "dots.video-frame",
} as const;

type DotsPipelineContracts = {
  [dotsPassIds.shapeSample]: ToolcraftRendererPipelinePassContract<unknown>;
  [dotsPassIds.previewFrame]: ToolcraftRendererPipelinePassContract<void>;
  [dotsPassIds.imageExport]: ToolcraftRendererPipelinePassContract<void>;
  [dotsPassIds.videoFrame]: ToolcraftRendererPipelinePassContract<void>;
};

const shapeTargets = [
  "text.content",
  "text.typography",
  "particles.count",
  "particles.distribution",
  "particles.edgeSpill",
  "particles.launch",
  "canvas.aspectRatio",
  "canvas.size.width",
  "canvas.size.height",
] as const;

const motionTargets = [
  "motion.activeDuration",
  "motion.calmDuration",
  "particles.size",
  "physics.mass",
  "physics.attraction",
  "physics.damping",
  "physics.turbulence",
  "appearance.palette",
  "appearance.trails",
  "appearance.sizeMotion",
  "appearance.glow",
  "appearance.background",
  "export.includeBackground",
  "canvas.renderScale",
] as const;

export const rendererPipelineRegistration =
  registerToolcraftRendererPipeline<DotsPipelineContracts>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: [dotsPassIds.shapeSample, dotsPassIds.previewFrame],
        targets: ["runtime.initial-render"],
      },
      {
        interaction: "control-drag",
        invalidates: [dotsPassIds.shapeSample, dotsPassIds.previewFrame],
        targets: ["particles.count", "particles.edgeSpill"],
      },
      {
        interaction: "control-drag",
        invalidates: [dotsPassIds.previewFrame],
        mustNotInvalidate: [dotsPassIds.shapeSample],
        targets: motionTargets,
      },
      {
        interaction: "control-change",
        invalidates: [dotsPassIds.shapeSample, dotsPassIds.previewFrame],
        targets: shapeTargets.filter(
          (target) =>
            target !== "particles.count" && target !== "particles.edgeSpill",
        ),
      },
      {
        interaction: "control-change",
        invalidates: [dotsPassIds.previewFrame],
        mustNotInvalidate: [dotsPassIds.shapeSample],
        targets: [
          "panels.timeline.extended",
          "export.image.format",
          "export.image.resolution",
          "export.video.format",
          "export.video.resolution",
        ],
      },
      {
        interaction: "animation-frame",
        invalidates: [dotsPassIds.previewFrame],
        mustNotInvalidate: [dotsPassIds.shapeSample],
        targets: ["runtime.animation-frame"],
      },
      {
        interaction: "timeline-playback",
        invalidates: [dotsPassIds.previewFrame],
        mustNotInvalidate: [dotsPassIds.shapeSample],
        targets: ["runtime.timeline"],
      },
      {
        interaction: "timeline-scrub",
        invalidates: [dotsPassIds.previewFrame],
        mustNotInvalidate: [dotsPassIds.shapeSample],
        targets: ["runtime.timeline"],
      },
      {
        interaction: "viewport-drag",
        invalidates: [],
        mustNotInvalidate: [dotsPassIds.shapeSample, dotsPassIds.previewFrame],
        targets: ["runtime.canvas.viewport"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: [],
        mustNotInvalidate: [dotsPassIds.shapeSample, dotsPassIds.previewFrame],
        targets: ["runtime.canvas.viewport"],
      },
      {
        interaction: "export",
        invalidates: [dotsPassIds.imageExport],
        mustNotInvalidate: [dotsPassIds.shapeSample, dotsPassIds.previewFrame],
        targets: [
          "export.png",
          "export.image.format",
          "export.image.resolution",
          "export.includeBackground",
        ],
      },
      {
        interaction: "export",
        invalidates: [dotsPassIds.videoFrame],
        mustNotInvalidate: [dotsPassIds.shapeSample, dotsPassIds.previewFrame],
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
        cost: {
          dimensions: ["particle-count"],
          frequency: "discrete",
          relationship: "linear",
        },
        id: dotsPassIds.shapeSample,
        inputs: ["text content", "font settings", "glyph distribution", "canvas aspect"],
        invalidatedBy: shapeTargets,
        kind: "vector-build",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "intermediate",
        quality: "full",
        runsOn: "main",
      },
      {
        cost: {
          dimensions: ["particle-count"],
          frequency: "frame",
          relationship: "linear",
        },
        id: dotsPassIds.previewFrame,
        inputs: ["sampled glyph targets", "analytic spring time", "appearance settings"],
        invalidatedBy: [
          ...shapeTargets,
          ...motionTargets,
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
          dimensions: ["particle-count", "image-long-edge"],
          frequency: "batch",
          relationship: "product",
        },
        id: dotsPassIds.imageExport,
        inputs: ["sampled glyph targets", "selected timeline frame", "image settings"],
        invalidatedBy: [
          "export.png",
          "export.image.format",
          "export.image.resolution",
          "export.includeBackground",
          "motion.activeDuration",
          "motion.calmDuration",
        ],
        kind: "export",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "export",
        quality: "export",
        runsOn: "export-only",
      },
      {
        cost: {
          dimensions: ["particle-count", "video-long-edge"],
          frequency: "batch",
          relationship: "product",
        },
        id: dotsPassIds.videoFrame,
        inputs: ["sampled glyph targets", "timeline timestamps", "video settings"],
        invalidatedBy: [
          "export.video",
          "export.video.format",
          "export.video.resolution",
          "motion.activeDuration",
          "motion.calmDuration",
          "runtime.timeline.duration",
        ],
        kind: "export",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "export",
        quality: "export",
        runsOn: "worker-or-gpu",
      },
    ],
    runtimeId: "dot-formation.renderer@1",
  });

export const dotsPipelinePasses = {
  imageExport: rendererPipelineRegistration.getPass(dotsPassIds.imageExport),
  previewFrame: rendererPipelineRegistration.getPass(dotsPassIds.previewFrame),
  shapeSample: rendererPipelineRegistration.getPass(dotsPassIds.shapeSample),
  videoFrame: rendererPipelineRegistration.getPass(dotsPassIds.videoFrame),
} as const;

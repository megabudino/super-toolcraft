import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import { dispersionCarouselTargets } from "./dispersion-carousel-values";

export const dispersionCarouselPassIds = {
  imageExport: "dispersion-carousel.image-export",
  preview: "dispersion-carousel.preview",
} as const;

type DispersionCarouselPipelineContracts = {
  [dispersionCarouselPassIds.imageExport]: ToolcraftRendererPipelinePassContract<void>;
  [dispersionCarouselPassIds.preview]: ToolcraftRendererPipelinePassContract<void>;
};

const effectTargets = [
  dispersionCarouselTargets.edgeWidth,
  dispersionCarouselTargets.curve,
  dispersionCarouselTargets.edgeFade,
  dispersionCarouselTargets.amount,
  dispersionCarouselTargets.count,
  dispersionCarouselTargets.spectrum,
  dispersionCarouselTargets.hue,
  dispersionCarouselTargets.blur,
  dispersionCarouselTargets.aura,
  dispersionCarouselTargets.velocity,
  dispersionCarouselTargets.gateOffset,
  dispersionCarouselTargets.gateWidth,
  dispersionCarouselTargets.gateGlow,
  dispersionCarouselTargets.gateRefraction,
  dispersionCarouselTargets.turbulence,
  dispersionCarouselTargets.turbulenceScale,
  dispersionCarouselTargets.warp,
  dispersionCarouselTargets.warpFace,
  dispersionCarouselTargets.warpOffset,
  dispersionCarouselTargets.warpSharpness,
  dispersionCarouselTargets.warpWave,
  dispersionCarouselTargets.warpWaveBlur,
  dispersionCarouselTargets.warpWaveLength,
] as const;

export const dispersionCarouselRendererPipelineRegistration =
  registerToolcraftRendererPipeline<DispersionCarouselPipelineContracts>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: [dispersionCarouselPassIds.preview],
        mustNotInvalidate: [dispersionCarouselPassIds.imageExport],
        targets: ["runtime.initial-render"],
      },
      {
        interaction: "control-drag",
        invalidates: [dispersionCarouselPassIds.preview],
        mustNotInvalidate: [dispersionCarouselPassIds.imageExport],
        targets: [...effectTargets, "canvas.renderScale"],
      },
      {
        interaction: "control-change",
        invalidates: [dispersionCarouselPassIds.preview],
        mustNotInvalidate: [dispersionCarouselPassIds.imageExport],
        targets: [
          dispersionCarouselTargets.includeText,
          dispersionCarouselTargets.warpStyle,
          dispersionCarouselTargets.warpWaveEnabled,
          dispersionCarouselTargets.warpWaveKind,
          dispersionCarouselTargets.includeBackground,
          dispersionCarouselTargets.background,
          "canvas.aspectRatio",
          "canvas.size.width",
          "canvas.size.height",
        ],
      },
      {
        interaction: "control-change",
        invalidates: [],
        mustNotInvalidate: [
          dispersionCarouselPassIds.preview,
          dispersionCarouselPassIds.imageExport,
        ],
        targets: [
          dispersionCarouselTargets.imageFormat,
          dispersionCarouselTargets.imageResolution,
        ],
      },
      {
        interaction: "animation-frame",
        invalidates: [dispersionCarouselPassIds.preview],
        mustNotInvalidate: [dispersionCarouselPassIds.imageExport],
        targets: ["carousel.scroll"],
      },
      {
        interaction: "viewport-drag",
        invalidates: [],
        mustNotInvalidate: [
          dispersionCarouselPassIds.preview,
          dispersionCarouselPassIds.imageExport,
        ],
        targets: ["runtime.canvas.viewport"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: [],
        mustNotInvalidate: [
          dispersionCarouselPassIds.preview,
          dispersionCarouselPassIds.imageExport,
        ],
        targets: ["runtime.canvas.viewport"],
      },
      {
        interaction: "export",
        invalidates: [dispersionCarouselPassIds.imageExport],
        mustNotInvalidate: [dispersionCarouselPassIds.preview],
        targets: [
          "export.png",
          dispersionCarouselTargets.imageFormat,
          dispersionCarouselTargets.imageResolution,
          dispersionCarouselTargets.includeBackground,
          dispersionCarouselTargets.background,
          dispersionCarouselTargets.includeText,
        ],
      },
    ],
    passes: [
      {
        cost: {
          dimensions: ["edge-blur-radius", "lens-samples"],
          frequency: "frame",
          relationship: "product",
        },
        id: dispersionCarouselPassIds.preview,
        inputs: [
          "five exact x2 card sources assembled once into one retained image texture",
          "one retained transparent Figtree testimonial texture from the canonical DOM card data",
          "screen-space spectral dispersion shader with aura, defocus, and geometric warp",
          "stationary viewport-anchored edge field with independently positioned boundary light bands",
          "normalized seamless carousel-cycle position and smoothed wrapped scroll velocity",
          "selected render scale",
          "source-derived transparent text rows and unchanged full-quality frame reuse",
        ],
        invalidatedBy: [
          ...effectTargets,
          dispersionCarouselTargets.includeText,
          dispersionCarouselTargets.warpStyle,
          dispersionCarouselTargets.warpWaveEnabled,
          dispersionCarouselTargets.warpWaveKind,
          dispersionCarouselTargets.includeBackground,
          dispersionCarouselTargets.background,
          "canvas.aspectRatio",
          "canvas.size.width",
          "canvas.size.height",
          "canvas.renderScale",
          "carousel.scroll",
        ],
        kind: "pixel-transform",
        lifecycle: { cache: "none", resourceScope: "renderer" },
        output: "preview",
        quality: "retina",
        runsOn: "gpu",
      },
      {
        cost: {
          dimensions: [
            "edge-blur-radius",
            "image-long-edge",
            "lens-samples",
          ],
          frequency: "batch",
          relationship: "product",
        },
        id: dispersionCarouselPassIds.imageExport,
        inputs: [
          "current carousel position",
          "Figma heading",
          "selected clean-or-dispersed testimonial composition",
          "deterministic velocity-free dispersion rail snapshot at export resolution",
          "runtime-selected image export settings",
        ],
        invalidatedBy: [
          "export.png",
          dispersionCarouselTargets.imageFormat,
          dispersionCarouselTargets.imageResolution,
          dispersionCarouselTargets.includeBackground,
          dispersionCarouselTargets.background,
          dispersionCarouselTargets.includeText,
        ],
        kind: "export",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "export",
        quality: "export",
        runsOn: "export-only",
      },
    ],
    runtimeId: "dispersion-carousel.renderer@10",
  });

export const dispersionCarouselPipelinePasses = {
  imageExport: dispersionCarouselRendererPipelineRegistration.getPass(
    dispersionCarouselPassIds.imageExport,
  ),
  preview: dispersionCarouselRendererPipelineRegistration.getPass(
    dispersionCarouselPassIds.preview,
  ),
} as const;

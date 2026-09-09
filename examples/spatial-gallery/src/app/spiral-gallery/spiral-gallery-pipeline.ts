import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import type {
  SpiralGalleryFrameSnapshot,
  SpiralGalleryResource,
} from "./spiral-gallery-types";

type SpiralGalleryPipelineContracts = {
  "spiral.export": ToolcraftRendererPipelinePassContract<void>;
  "spiral.preview": ToolcraftRendererPipelinePassContract<SpiralGalleryFrameSnapshot>;
  "spiral.webgl-resource": ToolcraftRendererPipelinePassContract<
    SpiralGalleryResource,
    SpiralGalleryResource,
    readonly [HTMLCanvasElement]
  >;
};

export const spiralSliderTargets = [
  "spiral.radius",
  "spiral.twistDegrees",
  "spiral.verticalGap",
  "spiral.depth",
  "spiral.depthOffset",
  "spiral.taper",
  "spiral.repetitions",
  "stack.gap",
  "stack.depthStep",
  "stack.backTiltDegrees",
  "stack.fallDistance",
  "stack.fallTiltDegrees",
  "stack.scrollWeight",
  "card.width",
  "card.height",
  "card.curveRadius",
  "card.cornerRadius",
  "shadow.blur",
  "shadow.offset",
  "depth.tiltDegrees",
  "depth.focusFalloff",
  "depth.focusFloor",
  "depth.scaleFalloff",
  "depth.minScale",
  "physics.wheelSpeed",
  "physics.dragSpeed",
  "physics.keyStep",
  "physics.inertia",
  "physics.flexStrength",
  "physics.flexResponse",
  "physics.snapStrength",
  "interaction.pressDepth",
  "interaction.pressShrink",
  "interaction.parallax",
  "view.perspective",
  "view.cameraDistance",
  "view.sceneOffset",
  "view.portraitScale",
] as const;

export const spiralChangeTargets = [
  "layout.mode",
  "interaction.invertDirection",
  "appearance.background",
  "export.includeBackground",
  "shadow.color",
] as const;

export const spiralExportSettingTargets = [
  "export.image.format",
  "export.image.resolution",
] as const;

export const spiralGalleryPipelineRegistration =
  registerToolcraftRendererPipeline<SpiralGalleryPipelineContracts>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: ["spiral.webgl-resource", "spiral.preview"],
        mustNotInvalidate: ["spiral.export"],
        targets: ["runtime.initial-render"],
      },
      {
        interaction: "media-import",
        invalidates: ["spiral.preview"],
        mustNotInvalidate: ["spiral.webgl-resource", "spiral.export"],
        targets: ["source.images"],
      },
      {
        interaction: "control-drag",
        invalidates: ["spiral.preview"],
        mustNotInvalidate: ["spiral.webgl-resource", "spiral.export"],
        targets: spiralSliderTargets,
      },
      {
        interaction: "control-change",
        invalidates: ["spiral.preview"],
        mustNotInvalidate: ["spiral.webgl-resource", "spiral.export"],
        targets: spiralChangeTargets,
      },
      {
        interaction: "control-change",
        invalidates: [],
        mustNotInvalidate: [
          "spiral.webgl-resource",
          "spiral.preview",
          "spiral.export",
        ],
        targets: spiralExportSettingTargets,
      },
      {
        interaction: "animation-frame",
        invalidates: ["spiral.preview"],
        mustNotInvalidate: ["spiral.webgl-resource", "spiral.export"],
        targets: ["runtime.gallery-interaction"],
      },
      {
        interaction: "viewport-drag",
        invalidates: [],
        mustNotInvalidate: [
          "spiral.webgl-resource",
          "spiral.preview",
          "spiral.export",
        ],
        targets: ["canvas.viewport"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: [],
        mustNotInvalidate: [
          "spiral.webgl-resource",
          "spiral.preview",
          "spiral.export",
        ],
        targets: ["canvas.viewport"],
      },
      {
        interaction: "export",
        invalidates: ["spiral.export"],
        mustNotInvalidate: ["spiral.webgl-resource", "spiral.preview"],
        targets: [
          "export.png",
          "export.code",
          ...spiralExportSettingTargets,
          "export.includeBackground",
          "appearance.background",
        ],
      },
    ],
    passes: [
      {
        cacheKey: ["canvas.element"],
        cost: { dimensions: [], frequency: "once", relationship: "constant" },
        id: "spiral.webgl-resource",
        inputs: ["canvas.element"],
        invalidatedBy: ["canvas.element"],
        kind: "preprocess",
        lifecycle: { cache: "retained-resource", resourceScope: "renderer" },
        output: "intermediate",
        quality: "full",
        runsOn: "gpu",
      },
      {
        cost: {
          dimensions: ["repetition-count"],
          frequency: "frame",
          relationship: "linear",
        },
        id: "spiral.preview",
        inputs: [
          "spiral.webgl-resource",
          "source.images",
          ...spiralSliderTargets,
          ...spiralChangeTargets,
          "canvas.size",
          "canvas.renderScale",
          "runtime.gallery-interaction",
        ],
        invalidatedBy: [
          "source.images",
          ...spiralSliderTargets,
          ...spiralChangeTargets,
          "canvas.size",
          "canvas.renderScale",
          "runtime.gallery-interaction",
        ],
        kind: "vector-build",
        lifecycle: { cache: "none", resourceScope: "renderer" },
        output: "preview",
        quality: "retina",
        runsOn: "gpu",
      },
      {
        cost: {
          dimensions: ["repetition-count"],
          frequency: "batch",
          relationship: "linear",
        },
        id: "spiral.export",
        inputs: [
          "spiral.webgl-resource",
          "source.images",
          ...spiralSliderTargets,
          ...spiralChangeTargets,
          ...spiralExportSettingTargets,
          "canvas.size",
        ],
        invalidatedBy: ["export.png"],
        kind: "export",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "export",
        quality: "export",
        runsOn: "export-only",
      },
    ],
    runtimeId: "spiral-infinite-gallery.renderer@1",
  });

export const spiralGalleryPipelinePasses = {
  export: spiralGalleryPipelineRegistration.getPass("spiral.export"),
  preview: spiralGalleryPipelineRegistration.getPass("spiral.preview"),
  resource: spiralGalleryPipelineRegistration.getPass("spiral.webgl-resource"),
} as const;

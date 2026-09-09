import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import type { SpherePoint } from "./logo-sphere-model";

type LogoSpherePipelinePasses = {
  "sphere-composite": ToolcraftRendererPipelinePassContract<void>;
  "sphere-export": ToolcraftRendererPipelinePassContract<void>;
  "sphere-layout": ToolcraftRendererPipelinePassContract<readonly SpherePoint[]>;
};

export const logoSpherePipelineRegistration =
  registerToolcraftRendererPipeline<LogoSpherePipelinePasses>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: ["sphere-layout", "sphere-composite"],
        mustNotInvalidate: ["sphere-export"],
        targets: ["canvas.initial-render"],
      },
      {
        interaction: "animation-frame",
        invalidates: ["sphere-composite"],
        mustNotInvalidate: ["sphere-layout", "sphere-export"],
        targets: ["runtime.animation-frame"],
      },
      {
        interaction: "timeline-playback",
        invalidates: ["sphere-composite"],
        mustNotInvalidate: ["sphere-layout", "sphere-export"],
        targets: ["timeline.playback"],
      },
      {
        interaction: "timeline-scrub",
        invalidates: ["sphere-composite"],
        mustNotInvalidate: ["sphere-layout", "sphere-export"],
        targets: ["timeline.playback"],
      },
      {
        interaction: "control-drag",
        invalidates: ["sphere-layout", "sphere-composite"],
        mustNotInvalidate: ["sphere-export"],
        targets: ["sphere.visibleCount"],
      },
      {
        interaction: "control-change",
        invalidates: ["sphere-layout", "sphere-composite"],
        mustNotInvalidate: ["sphere-export"],
        targets: ["sphere.distribution"],
      },
      {
        interaction: "control-drag",
        invalidates: ["sphere-composite"],
        mustNotInvalidate: ["sphere-layout", "sphere-export"],
        targets: [
          "card.cornerRadius",
          "card.shadowBlur",
          "card.shadowOffset",
          "card.shadowOpacity",
          "card.strokeWidth",
          "fade.feather",
          "fade.maskSize",
          "fade.rearOpacity",
          "motion.inertia",
          "motion.spinAmount",
          "sphere.depth",
          "sphere.fisheye",
          "sphere.logoSize",
          "sphere.perspective",
          "sphere.radius",
          "view.orbit",
        ],
      },
      {
        interaction: "control-change",
        invalidates: ["sphere-composite"],
        mustNotInvalidate: ["sphere-layout", "sphere-export"],
        targets: ["card.shadowColor", "card.strokeColor", "motion.spinAxis"],
      },
      {
        interaction: "control-change",
        invalidates: ["sphere-composite"],
        mustNotInvalidate: ["sphere-layout", "sphere-export"],
        targets: ["appearance.background", "export.includeBackground"],
      },
      {
        interaction: "control-change",
        invalidates: [],
        mustNotInvalidate: [
          "sphere-layout",
          "sphere-composite",
          "sphere-export",
        ],
        targets: [
          "export.image.format",
          "export.image.resolution",
        ],
      },
      {
        interaction: "media-import",
        invalidates: ["sphere-composite"],
        mustNotInvalidate: ["sphere-layout", "sphere-export"],
        targets: ["logos.defaults", "logos.sources"],
      },
      {
        interaction: "viewport-drag",
        invalidates: [],
        mustNotInvalidate: [
          "sphere-layout",
          "sphere-composite",
          "sphere-export",
        ],
        targets: ["canvas.viewport"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: [],
        mustNotInvalidate: [
          "sphere-layout",
          "sphere-composite",
          "sphere-export",
        ],
        targets: ["canvas.viewport"],
      },
      {
        interaction: "export",
        invalidates: ["sphere-export"],
        mustNotInvalidate: ["sphere-layout", "sphere-composite"],
        targets: ["actions.output"],
      },
    ],
    passes: [
      {
        cacheKey: ["sphere.visibleCount", "sphere.distribution"],
        cost: {
          dimensions: ["distribution-complexity", "visible-logos"],
          frequency: "discrete",
          relationship: "linear",
        },
        id: "sphere-layout",
        inputs: ["sphere.visibleCount", "sphere.distribution"],
        invalidatedBy: ["sphere.visibleCount", "sphere.distribution"],
        kind: "preprocess",
        lifecycle: { cache: "memoized", resourceScope: "renderer" },
        output: "intermediate",
        quality: "full",
        runsOn: "main",
      },
      {
        cost: {
          dimensions: ["distribution-complexity", "visible-logos"],
          frequency: "frame",
          relationship: "linear",
        },
        id: "sphere-composite",
        inputs: [
          "sphere-layout",
          "logos.defaults",
          "logos.sources",
          "card-style",
          "sphere",
          "fade",
          "motion",
          "view.orbit",
          "timeline.playback",
          "canvas.product-scene-frame",
          "canvas.renderScale",
          "appearance.background",
          "export.includeBackground",
        ],
        invalidatedBy: [
          "runtime.animation-frame",
          "timeline.playback",
          "timeline.scrub",
          "logos.defaults",
          "logos.sources",
          "card-style",
          "sphere",
          "fade",
          "motion",
          "view.orbit",
          "canvas.product-scene-frame",
          "canvas.renderScale",
          "appearance.background",
          "export.includeBackground",
        ],
        kind: "composite",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "preview",
        quality: "retina",
        runsOn: "main",
      },
      {
        cost: {
          dimensions: ["distribution-complexity", "visible-logos"],
          frequency: "batch",
          relationship: "linear",
        },
        id: "sphere-export",
        inputs: [
          "sphere-layout",
          "logos.defaults",
          "logos.sources",
          "card-style",
          "sphere",
          "fade",
          "motion",
          "view.orbit",
          "timeline.progress",
          "export.frame",
        ],
        invalidatedBy: ["actions.output"],
        kind: "export",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "export",
        quality: "export",
        runsOn: "export-only",
      },
    ],
    runtimeId: "logo-sphere-canvas-2d-v1",
  });

export const logoSphereLayoutPass =
  logoSpherePipelineRegistration.getPass("sphere-layout");
export const logoSphereCompositePass =
  logoSpherePipelineRegistration.getPass("sphere-composite");
export const logoSphereExportPass =
  logoSpherePipelineRegistration.getPass("sphere-export");

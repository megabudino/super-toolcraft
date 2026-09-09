import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import type { MeshGlResource } from "./mesh-model";

type MeshRendererPassContracts = {
  "mesh-export": ToolcraftRendererPipelinePassContract<void>;
  "mesh-handles": ToolcraftRendererPipelinePassContract<void>;
  "mesh-preview": ToolcraftRendererPipelinePassContract<void>;
  "mesh-webgl-resource": ToolcraftRendererPipelinePassContract<
    MeshGlResource,
    MeshGlResource,
    readonly [HTMLCanvasElement]
  >;
};

const previewTargets = [
  "appearance.background",
  "color.contrast",
  "color.exposure",
  "color.hue",
  "color.lightness",
  "color.saturation",
  "export.includeBackground",
  "mesh.colors",
  "mesh.columns",
  "mesh.pinEdges",
  "mesh.points",
  "mix.grain",
  "mix.interpolation",
  "mix.opacity",
  "mix.spread",
  "mix.swirl",
  "mix.warp",
  "motion.colorDrift",
  "motion.cycles",
  "motion.positionDrift",
  "motion.randomness",
  "motion.scale",
] as const;

export const meshRendererPipelineRegistration =
  registerToolcraftRendererPipeline<MeshRendererPassContracts>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: ["mesh-webgl-resource", "mesh-preview", "mesh-handles"],
        mustNotInvalidate: ["mesh-export"],
        targets: ["canvas.initial-render", "mesh.colors"],
      },
      {
        interaction: "control-drag",
        invalidates: ["mesh-preview", "mesh-handles"],
        mustNotInvalidate: ["mesh-webgl-resource", "mesh-export"],
        targets: ["mesh.colors", "mesh.points"],
      },
      {
        interaction: "control-drag",
        invalidates: ["mesh-preview"],
        mustNotInvalidate: ["mesh-webgl-resource", "mesh-handles", "mesh-export"],
        targets: previewTargets.filter(
          (target) => target !== "mesh.colors" && target !== "mesh.points",
        ),
      },
      {
        interaction: "control-change",
        invalidates: ["mesh-preview", "mesh-handles"],
        mustNotInvalidate: ["mesh-webgl-resource", "mesh-export"],
        targets: ["mesh.colors", "mesh.columns", "mesh.pinEdges", "mesh.points"],
      },
      {
        interaction: "control-change",
        invalidates: ["mesh-handles"],
        mustNotInvalidate: ["mesh-webgl-resource", "mesh-preview", "mesh-export"],
        targets: ["mesh.editing", "mesh.guides"],
      },
      {
        interaction: "control-change",
        invalidates: ["mesh-preview"],
        mustNotInvalidate: ["mesh-webgl-resource", "mesh-handles", "mesh-export"],
        targets: previewTargets.filter(
          (target) =>
            target !== "mesh.colors" &&
            target !== "mesh.columns" &&
            target !== "mesh.pinEdges" &&
            target !== "mesh.points",
        ),
      },
      {
        interaction: "timeline-playback",
        invalidates: ["mesh-preview"],
        mustNotInvalidate: ["mesh-webgl-resource", "mesh-handles", "mesh-export"],
        targets: ["timeline.currentTimeSeconds"],
      },
      {
        interaction: "timeline-scrub",
        invalidates: ["mesh-preview"],
        mustNotInvalidate: ["mesh-webgl-resource", "mesh-handles", "mesh-export"],
        targets: ["timeline.currentTimeSeconds"],
      },
      {
        interaction: "viewport-drag",
        invalidates: [],
        mustNotInvalidate: [
          "mesh-webgl-resource",
          "mesh-preview",
          "mesh-handles",
          "mesh-export",
        ],
        targets: ["canvas.viewport"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: ["mesh-preview"],
        mustNotInvalidate: [
          "mesh-webgl-resource",
          "mesh-handles",
          "mesh-export",
        ],
        targets: ["canvas.viewport"],
      },
      {
        interaction: "export",
        invalidates: ["mesh-export"],
        mustNotInvalidate: ["mesh-webgl-resource", "mesh-preview", "mesh-handles"],
        targets: ["export.actions"],
      },
    ],
    passes: [
      {
        cacheKey: ["canvas.element"],
        cost: { dimensions: [], frequency: "once", relationship: "constant" },
        id: "mesh-webgl-resource",
        inputs: ["canvas.element"],
        invalidatedBy: ["canvas.element"],
        kind: "preprocess",
        lifecycle: { cache: "retained-resource", resourceScope: "renderer" },
        output: "intermediate",
        quality: "full",
        runsOn: "gpu",
      },
      {
        cost: { dimensions: [], frequency: "frame", relationship: "constant" },
        id: "mesh-preview",
        inputs: ["mesh-webgl-resource", ...previewTargets, "timeline.currentTimeSeconds"],
        invalidatedBy: [...previewTargets, "timeline.currentTimeSeconds", "canvas.size"],
        kind: "vector-build",
        lifecycle: { cache: "none", resourceScope: "interaction" },
        output: "preview",
        quality: "full",
        runsOn: "main",
      },
      {
        cost: {
          dimensions: ["mesh-point-count"],
          frequency: "interaction",
          relationship: "linear",
        },
        id: "mesh-handles",
        inputs: ["mesh.colors", "mesh.points", "mesh.columns", "mesh.editing", "mesh.guides"],
        invalidatedBy: ["mesh.colors", "mesh.points", "mesh.columns", "mesh.editing", "mesh.guides"],
        kind: "handles",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "overlay",
        quality: "preview",
        runsOn: "main",
      },
      {
        cost: { dimensions: [], frequency: "batch", relationship: "constant" },
        id: "mesh-export",
        inputs: [...previewTargets, "timeline.durationSeconds", "export.image.resolution", "export.video.resolution"],
        invalidatedBy: ["export.actions"],
        kind: "export",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "export",
        quality: "export",
        runsOn: "export-only",
      },
    ],
    runtimeId: "mesh-gradient-renderer-v2",
  });

export const meshWebGlResourcePass =
  meshRendererPipelineRegistration.getPass("mesh-webgl-resource");
export const meshPreviewPass =
  meshRendererPipelineRegistration.getPass("mesh-preview");
export const meshHandlesPass =
  meshRendererPipelineRegistration.getPass("mesh-handles");
export const meshExportPass =
  meshRendererPipelineRegistration.getPass("mesh-export");

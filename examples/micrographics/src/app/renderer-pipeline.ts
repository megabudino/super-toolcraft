import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
  type ToolcraftState,
} from "@/toolcraft/runtime";

import type { PosterScene } from "./poster-types";

type MicrographicsPipelinePasses = {
  "export-png": ToolcraftRendererPipelinePassContract<HTMLCanvasElement>;
  "poster-scene": ToolcraftRendererPipelinePassContract<PosterScene>;
};

const posterTargets = [
  "composition.seed",
  "composition.count",
  "composition.kit",
  "composition.templateTier",
  "composition.layout",
  "elements.scale",
  "elements.opacity",
  "ink.color",
  "ink.glow",
  "appearance.background",
  "export.includeBackground",
] as const;

const dragTargets = [
  "composition.seed",
  "composition.count",
  "elements.scale",
  "elements.opacity",
  "ink.glow",
] as const;

const changeTargets = posterTargets.filter(
  (target) => !dragTargets.includes(target as (typeof dragTargets)[number]),
);

const posterCacheKeys = [...posterTargets, "canvas.size"] as const;

export const rendererPipelineRegistration =
  registerToolcraftRendererPipeline<MicrographicsPipelinePasses>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: ["poster-scene"],
        mustNotInvalidate: ["export-png"],
        targets: ["canvas.initial-render"],
      },
      {
        interaction: "control-drag",
        invalidates: ["poster-scene"],
        mustNotInvalidate: ["export-png"],
        targets: dragTargets,
      },
      {
        interaction: "control-change",
        invalidates: ["poster-scene"],
        mustNotInvalidate: ["export-png"],
        targets: changeTargets,
      },
      {
        interaction: "mask-drag",
        invalidates: ["poster-scene"],
        mustNotInvalidate: ["export-png"],
        targets: ["composition.layout"],
      },
      {
        interaction: "media-import",
        invalidates: [],
        mustNotInvalidate: ["poster-scene", "export-png"],
        targets: ["source.image"],
      },
      {
        interaction: "viewport-drag",
        invalidates: [],
        mustNotInvalidate: ["poster-scene", "export-png"],
        targets: ["canvas.viewport"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: [],
        mustNotInvalidate: ["poster-scene", "export-png"],
        targets: ["canvas.viewport"],
      },
      {
        interaction: "export",
        invalidates: ["export-png"],
        mustNotInvalidate: ["poster-scene"],
        targets: [
          "output.export",
          "export.image.format",
          "export.image.resolution",
        ],
      },
    ],
    passes: [
      {
        cacheKey: posterCacheKeys,
        cost: {
          dimensions: ["element-count", "template-tier-weight"],
          frequency: "interaction",
          relationship: "product",
        },
        id: "poster-scene",
        inputs: posterCacheKeys,
        invalidatedBy: posterCacheKeys,
        kind: "vector-build",
        lifecycle: { cache: "memoized", resourceScope: "renderer" },
        output: "preview",
        quality: "full",
        runsOn: "main",
      },
      {
        cost: {
          dimensions: ["element-count", "template-tier-weight"],
          frequency: "batch",
          relationship: "product",
        },
        id: "export-png",
        inputs: ["poster-scene", "export.image.resolution"],
        invalidatedBy: [
          "output.export",
          "export.image.format",
          "export.image.resolution",
        ],
        kind: "export",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "export",
        quality: "export",
        runsOn: "export-only",
      },
    ],
    runtimeId: "micrographics-v3",
  });

export const posterScenePass = rendererPipelineRegistration.getPass("poster-scene");
export const exportPngPass = rendererPipelineRegistration.getPass("export-png");

export function createPosterSceneCacheInput(state: ToolcraftState) {
  return {
    "appearance.background": state.values["appearance.background"],
    "canvas.size": `${state.canvas.size.width}x${state.canvas.size.height}:${state.canvas.size.unit}`,
    "composition.count": state.values["composition.count"],
    "composition.kit": state.values["composition.kit"],
    "composition.layout": state.values["composition.layout"],
    "composition.seed": state.values["composition.seed"],
    "composition.templateTier": state.values["composition.templateTier"],
    "elements.opacity": state.values["elements.opacity"],
    "elements.scale": state.values["elements.scale"],
    "export.includeBackground": state.values["export.includeBackground"],
    "ink.color": state.values["ink.color"],
    "ink.glow": state.values["ink.glow"],
  };
}

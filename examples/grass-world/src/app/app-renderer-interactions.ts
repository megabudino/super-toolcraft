import type {
  ToolcraftInteractionInvalidation,
  ToolcraftPipelineInteraction,
} from "@/toolcraft/runtime";

import {
  grassRendererPassIds,
  type GrassRendererPassId,
} from "./app-renderer-pass-definitions";
import {
  grassCloverBlendChangeTargets,
  grassCloverBlendTargets,
  grassButterflyLayoutTargets,
  grassDistributionChangeTargets,
  grassDistributionTargets,
  grassEnvironmentChangeTargets,
  grassEnvironmentMediaTargets,
  grassGroundGeometryOnlyTargets,
  grassLayoutChangeTargets,
  grassLayoutTargets,
  grassRenderChangeTargets,
  grassRenderSliderTargets,
  grassScanEnabledTargets,
  grassScanLayoutTargets,
  grassSharedLayoutChangeTargets,
  grassSharedLayoutTargets,
  lawnDistributionChangeTargets,
  lawnDistributionTargets,
  lawnLayoutChangeTargets,
  lawnLayoutTargets,
} from "./grass/grass-render-targets";

type GrassInteractionInput = Readonly<{
  interaction: ToolcraftPipelineInteraction;
  invalidates: readonly GrassRendererPassId[];
  targets: readonly string[];
}>;

function defineGrassInteraction({
  interaction,
  invalidates,
  targets,
}: GrassInteractionInput): ToolcraftInteractionInvalidation {
  const invalidatedPasses = new Set<GrassRendererPassId>(invalidates);
  return {
    interaction,
    invalidates,
    mustNotInvalidate: grassRendererPassIds.filter(
      (passId) => !invalidatedPasses.has(passId),
    ),
    targets,
  };
}

const scanInteractions = (
  [
    ["tufted", "grass-tufted-layout-build"],
    ["wild", "grass-wild-layout-build"],
    ["white", "grass-white-layout-build"],
    ["yellow", "grass-yellow-layout-build"],
    ["rocks", "grass-rock-layout-build"],
  ] as const
).flatMap(([kind, passId]) => [
  defineGrassInteraction({
    interaction: "control-drag",
    invalidates: [passId, "grass-scene-render"],
    targets: grassScanLayoutTargets[kind],
  }),
  defineGrassInteraction({
    interaction: "control-change",
    invalidates: [passId, "grass-scene-render"],
    targets: grassScanEnabledTargets[kind],
  }),
]);

const defineControlInteraction = (
  interaction: "control-change" | "control-drag",
  targets: readonly string[],
  invalidates: readonly GrassRendererPassId[],
): ToolcraftInteractionInvalidation =>
  defineGrassInteraction({ interaction, invalidates, targets });

export const grassRendererInteractionInvalidation = [
  defineGrassInteraction({
    interaction: "initial-render",
    invalidates: grassRendererPassIds.filter(
      (passId) => passId !== "grass-export-frame",
    ),
    targets: ["runtime.initialRender", "field.densityMax", "lawn.densityMax"],
  }),
  ...scanInteractions,
  defineControlInteraction("control-drag", grassCloverBlendTargets, [
    "grass-noise-preview",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-drag", grassDistributionTargets, [
    "grass-noise-preview",
    "grass-layout-build",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-drag", lawnDistributionTargets, [
    "grass-noise-preview",
    "grass-lawn-layout-build",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-drag", grassLayoutTargets, [
    "grass-layout-build",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-drag", lawnLayoutTargets, [
    "grass-lawn-layout-build",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-drag", grassButterflyLayoutTargets, [
    "grass-butterfly-layout-build",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-drag", grassSharedLayoutTargets, [
    "grass-noise-preview",
    "grass-ground-geometry-build",
    "grass-layout-build",
    "grass-lawn-layout-build",
    "grass-butterfly-layout-build",
    "grass-tufted-layout-build",
    "grass-wild-layout-build",
    "grass-white-layout-build",
    "grass-yellow-layout-build",
    "grass-rock-layout-build",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-drag", grassGroundGeometryOnlyTargets, [
    "grass-ground-geometry-build",
    "grass-butterfly-layout-build",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-drag", grassRenderSliderTargets, [
    "grass-scene-render",
  ]),
  defineControlInteraction("control-change", grassCloverBlendChangeTargets, [
    "grass-noise-preview",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-change", grassDistributionChangeTargets, [
    "grass-noise-preview",
    "grass-layout-build",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-change", lawnDistributionChangeTargets, [
    "grass-noise-preview",
    "grass-lawn-layout-build",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-change", grassLayoutChangeTargets, [
    "grass-layout-build",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-change", lawnLayoutChangeTargets, [
    "grass-lawn-layout-build",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-change", ["butterflies.enabled"], [
    "grass-butterfly-resource",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-change", grassSharedLayoutChangeTargets, [
    "grass-noise-preview",
    "grass-layout-build",
    "grass-lawn-layout-build",
    "grass-butterfly-layout-build",
    "grass-tufted-layout-build",
    "grass-wild-layout-build",
    "grass-white-layout-build",
    "grass-yellow-layout-build",
    "grass-rock-layout-build",
    "grass-scene-render",
  ]),
  defineControlInteraction("control-change", grassEnvironmentChangeTargets, [
    "grass-environment-resource",
    "grass-scene-render",
  ]),
  defineGrassInteraction({
    interaction: "media-import",
    invalidates: ["grass-environment-resource", "grass-scene-render"],
    targets: grassEnvironmentMediaTargets,
  }),
  defineControlInteraction("control-change", grassRenderChangeTargets, [
    "grass-scene-render",
  ]),
  defineControlInteraction(
    "control-change",
    [
      "export.image.format",
      "export.image.resolution",
      "export.video.format",
      "export.video.resolution",
      "wind.audioVolume",
    ],
    [],
  ),
  defineGrassInteraction({
    interaction: "timeline-playback",
    invalidates: ["grass-scene-render"],
    targets: ["timeline.currentTimeSeconds"],
  }),
  defineGrassInteraction({
    interaction: "timeline-scrub",
    invalidates: ["grass-scene-render"],
    targets: ["timeline.currentTimeSeconds"],
  }),
  defineGrassInteraction({
    interaction: "animation-frame",
    invalidates: ["grass-scene-render"],
    targets: [
      "renderer.pointerDirection",
      "renderer.pointerTerrainHit",
      "renderer.butterflyHover",
    ],
  }),
  defineGrassInteraction({
    interaction: "viewport-drag",
    invalidates: [],
    targets: ["canvas.viewport.offset"],
  }),
  defineGrassInteraction({
    interaction: "viewport-zoom",
    invalidates: [],
    targets: ["canvas.viewport.zoom"],
  }),
  defineGrassInteraction({
    interaction: "export",
    invalidates: ["grass-export-frame"],
    targets: [
      "actions.output",
      "field.densityMax",
      "lawn.densityMax",
      "scan.tufted.count",
      "scan.wild.count",
      "scan.white.count",
      "scan.yellow.count",
      "scan.rocks.count",
      "butterflies.count",
    ],
  }),
] as const satisfies readonly ToolcraftInteractionInvalidation[];

import type {
  ToolcraftControlSchema,
  ToolcraftControlSectionSchema,
} from "@/toolcraft/runtime";

import {
  grassResponsive as responsive,
  grassSlider as slider,
} from "./grass-control-builders";
import { grassDefaults } from "./grass-defaults";

function numericInput(
  options: Readonly<{
    defaultValue: number;
    description: string;
    label: string;
    max: number;
    min: number;
    performanceReason: string;
    target: string;
  }>,
): ToolcraftControlSchema {
  return {
    commitMode: "setting",
    defaultValue: options.defaultValue,
    description: options.description,
    label: options.label,
    max: options.max,
    min: options.min,
    orderRole: "input",
    performanceReason: options.performanceReason,
    performanceRole: "responsiveness",
    target: options.target,
    textValueKind: "single-line",
    type: "text",
  };
}

export const grassFieldSection = {
  controls: {
    width: numericInput({
      defaultValue: grassDefaults["field.width"],
      description:
        "Sets the generated field width in metres without changing output resolution.",
      label: "Width",
      max: 20,
      min: 2,
      performanceReason:
        "Changes deterministic instance placement while the density cap bounds total work.",
      target: "field.width",
    }),
    depth: numericInput({
      defaultValue: grassDefaults["field.depth"],
      description:
        "Sets the generated field length in metres away from the camera.",
      label: "Length",
      max: 20,
      min: 2,
      performanceReason:
        "Changes deterministic instance placement while the density cap bounds total work.",
      target: "field.depth",
    }),
    shapeRoundness: slider({
      defaultValue: grassDefaults["field.shapeRoundness"],
      description:
        "Moves the complete field outline from a softly rounded rectangle at 0% to an ellipse at 100%.",
      label: "Roundness",
      max: 100,
      min: 0,
      performanceReason:
        "Remaps the existing bounded ground and placement samples without changing their count.",
      step: 1,
      target: "field.shapeRoundness",
      unit: "%",
    }),
    edgeIrregularity: slider({
      defaultValue: grassDefaults["field.edgeIrregularity"],
      description:
        "Controls deterministic low-frequency unevenness along the complete field perimeter.",
      label: "Irregularity",
      max: 30,
      min: 0,
      performanceReason:
        "Adds fixed-cost boundary arithmetic to existing bounded samples without changing their count.",
      step: 1,
      target: "field.edgeIrregularity",
      unit: "%",
    }),
  },
  layoutGroups: [
    { columns: 2, controls: ["width", "depth"], layout: "inline" },
  ],
  title: "Field",
} satisfies ToolcraftControlSectionSchema;

export const grassTallLayerSection = {
  controls: {
    enabled: {
      defaultValue: grassDefaults["grass.enabled"],
      description:
        "Shows the taller grass stratum in preview and export without changing its authored settings.",
      label: "Visible",
      orderRole: "mode",
      ...responsive("Toggles the retained upper grass mesh."),
      target: "grass.enabled",
      type: "switch",
    },
    densityMax: slider({
      defaultValue: grassDefaults["field.densityMax"],
      description:
        "Sets the target number of Tall Grass roots; only unavailable mask area or minimum spacing can reduce the actual result.",
      label: "Density max",
      max: 24_000,
      min: 500,
      performanceReason:
        "This hard cap owns the maximum instanced blade count rendered per frame.",
      performanceRole: "workload",
      step: 100,
      target: "field.densityMax",
      visibleWhen: { equals: true, target: "grass.enabled" },
    }),
    distanceMin: slider({
      defaultValue: grassDefaults["field.distanceMin"],
      description:
        "Keeps a real minimum root spacing; if the selected mask cannot physically fit the target, the actual count stops at the available positions.",
      label: "Distance min",
      max: 0.35,
      min: 0.02,
      performanceReason:
        "Filters the deterministic placement set below the independently enforced density cap.",
      step: 0.01,
      target: "field.distanceMin",
      unit: "m",
      visibleWhen: { equals: true, target: "grass.enabled" },
    }),
    depthOffset: slider({
      defaultValue: grassDefaults["grass.depthOffset"],
      description:
        "Moves blade roots above or below the generated ground surface.",
      label: "Blade offset",
      max: 0.3,
      min: -0.3,
      performanceReason:
        "Updates a retained shader offset without changing geometry size.",
      step: 0.01,
      target: "grass.depthOffset",
      unit: "m",
      visibleWhen: { equals: true, target: "grass.enabled" },
    }),
    seed: slider({
      defaultValue: grassDefaults["field.seed"],
      description:
        "Sets the deterministic world sequence identity and grass placement pattern.",
      label: "Seed",
      max: 197_567,
      min: 0,
      performanceReason:
        "Rebuilds the bounded deterministic instance attributes.",
      step: 1,
      target: "field.seed",
      visibleWhen: { equals: true, target: "grass.enabled" },
    }),
  },
  title: "Tall Grass",
} satisfies ToolcraftControlSectionSchema;

export const grassTallDistributionSection = {
  controls: {
    preview: {
      defaultValue: grassDefaults["field.distributionOffset"],
      description:
        "Shows the procedural growth mask; white attracts Tall Grass and black excludes it. Click or drag to move the sampled region.",
      keyframeable: false,
      label: "Distribution map",
      orderRole: "spatial",
      performanceReason:
        "Redraws a fixed-size grayscale Voronoi preview and rebuilds the bounded Tall layout when its offset changes.",
      performanceRole: "responsiveness",
      target: "field.distributionOffset",
      type: "grassNoisePreview",
    },
    scale: slider({
      defaultValue: grassDefaults["field.distributionScale"],
      description: "Sets the size and spacing of the Voronoi growth regions.",
      label: "Scale",
      max: 2.5,
      min: 0.08,
      performanceReason:
        "Re-evaluates the bounded procedural mask for every Tall placement candidate.",
      step: 0.01,
      target: "field.distributionScale",
    }),
    detail: slider({
      defaultValue: grassDefaults["field.distributionDetail"],
      description:
        "Sets how many Voronoi layers combine into the growth mask.",
      label: "Detail",
      max: 6,
      min: 1,
      performanceReason:
        "Directly controls the bounded number of mask octaves evaluated per Tall placement candidate.",
      performanceRole: "workload",
      step: 1,
      target: "field.distributionDetail",
    }),
    roughness: slider({
      defaultValue: grassDefaults["field.distributionRoughness"],
      description:
        "Controls how strongly smaller Voronoi regions affect the mask.",
      label: "Roughness",
      max: 90,
      min: 10,
      performanceReason:
        "Changes fixed-octave mask weighting without changing candidate bounds.",
      step: 1,
      target: "field.distributionRoughness",
      unit: "%",
    }),
    seed: slider({
      defaultValue: grassDefaults["field.distributionSeed"],
      description:
        "Chooses the Voronoi mask independently from the Tall root variation seed.",
      label: "Seed",
      max: 100,
      min: 0,
      performanceReason:
        "Re-evaluates the bounded procedural mask and deterministic Tall layout.",
      step: 1,
      target: "field.distributionSeed",
    }),
    levels: {
      defaultValue: grassDefaults["field.distributionLevels"],
      description:
        "Maps mask values below the black point to no grass and values above the white point to maximum placement weight.",
      label: "Black / white",
      max: 100,
      min: 0,
      orderRole: "strength",
      ...responsive(
        "Remaps the bounded Voronoi samples before deterministic weighted placement.",
      ),
      step: 1,
      target: "field.distributionLevels",
      type: "rangeSlider",
      unit: "%",
    },
  },
  title: "Tall Grass Distribution",
  visibleWhen: { equals: true, target: "grass.enabled" },
} satisfies ToolcraftControlSectionSchema;

export const grassTerrainSection = {
  controls: {
    visible: {
      defaultValue: grassDefaults["field.showGround"],
      description:
        "Shows the terrain surface in preview and export without affecting vegetation placement.",
      label: "Visible",
      orderRole: "mode",
      semanticGroup: "terrain-surface",
      ...responsive(
        "Toggles the retained terrain draw call without rebuilding geometry.",
      ),
      target: "field.showGround",
      type: "switch",
    },
    noisePreview: {
      defaultValue: grassDefaults["terrain.noiseOffset"],
      description:
        "Shows the generated height map; click or drag the map to move the sampled terrain region.",
      keyframeable: false,
      label: "Height map",
      orderRole: "spatial",
      performanceReason:
        "Redraws a fixed-size grayscale preview and rebuilds the bounded terrain layout when its offset changes.",
      performanceRole: "responsiveness",
      semanticGroup: "terrain-surface",
      target: "terrain.noiseOffset",
      type: "grassNoisePreview",
    },
    noiseScale: slider({
      defaultValue: grassDefaults["terrain.noiseScale"],
      description:
        "Sets the spatial frequency of hills and valleys in the height map.",
      label: "Scale",
      max: 1.4,
      min: 0.08,
      performanceReason:
        "Re-evaluates deterministic noise for the bounded grass layout and ground mesh.",
      semanticGroup: "terrain-surface",
      step: 0.01,
      target: "terrain.noiseScale",
    }),
    detail: slider({
      defaultValue: grassDefaults["terrain.detail"],
      description:
        "Sets how many fractal noise layers shape the terrain surface.",
      label: "Detail",
      max: 6,
      min: 1,
      performanceReason:
        "Directly controls the number of noise octaves evaluated for every terrain sample.",
      performanceRole: "workload",
      semanticGroup: "terrain-surface",
      step: 1,
      target: "terrain.detail",
    }),
    roughness: slider({
      defaultValue: grassDefaults["terrain.roughness"],
      description:
        "Controls how strongly small noise layers affect the height map.",
      label: "Roughness",
      max: 90,
      min: 10,
      performanceReason:
        "Changes octave weighting without changing the bounded number of samples.",
      semanticGroup: "terrain-surface",
      step: 1,
      target: "terrain.roughness",
      unit: "%",
    }),
    seed: slider({
      defaultValue: grassDefaults["terrain.seed"],
      description:
        "Chooses a deterministic terrain shape independently of grass placement.",
      label: "Seed",
      max: 100,
      min: 0,
      performanceReason:
        "Re-evaluates deterministic noise for the bounded grass layout and ground mesh.",
      semanticGroup: "terrain-surface",
      step: 1,
      target: "terrain.seed",
    }),
    heightLevels: {
      defaultValue: grassDefaults["terrain.heightLevels"],
      description:
        "Sets which noise values become the lowest black point and the highest white point of the ground relief.",
      label: "Black / white",
      max: 100,
      min: 0,
      orderRole: "strength",
      semanticGroup: "terrain-surface",
      ...responsive(
        "Smoothly remaps bounded terrain samples without changing their count or output resolution.",
      ),
      step: 1,
      target: "terrain.heightLevels",
      type: "rangeSlider",
      unit: "%",
    },
    maxHeight: slider({
      defaultValue: grassDefaults["terrain.maxHeight"],
      description:
        "Scales the completed black-to-white height mask from flat ground to its tallest point.",
      label: "Max height",
      max: 3,
      min: 0,
      semanticGroup: "terrain-surface",
      performanceReason:
        "Scales existing bounded terrain samples without changing sample count or output resolution.",
      step: 0.05,
      target: "terrain.maxHeight",
      unit: "m",
    }),
  },
  title: "Terrain",
} satisfies ToolcraftControlSectionSchema;

export const grassPreviewSection = {
  controls: {
    bladeCount: slider({
      defaultValue: grassDefaults["preview.bladeCount"],
      description:
        "Sets the detailed Tall Grass sample used by the live PBR preview; export keeps the complete authored density.",
      label: "Tall detail",
      max: 6000,
      min: 300,
      performanceReason:
        "Directly controls the bounded number of detailed Tall Grass instances submitted by the live preview.",
      performanceRole: "workload",
      step: 100,
      target: "preview.bladeCount",
    }),
    lawnBladeCount: slider({
      defaultValue: grassDefaults["preview.lawnBladeCount"],
      description:
        "Sets the detailed Lawn Cover share in the live PBR preview; lightweight clumps preserve the remaining authored coverage.",
      label: "Lawn detail",
      max: 12_000,
      min: 1000,
      performanceReason:
        "Maps six equivalent blades to each retained live Lawn clump while export keeps full geometry.",
      performanceRole: "workload",
      step: 250,
      target: "preview.lawnBladeCount",
    }),
    orientation: {
      defaultValue: grassDefaults["view.orientation"],
      keyframeable: false,
      label: false,
      performanceReason:
        "Updates the retained camera pose and full-quality field render without rebuilding layout buffers.",
      performanceRole: "responsiveness",
      target: "view.orientation",
      type: "orientationGizmo",
    },
  },
  title: "Preview Quality",
} satisfies ToolcraftControlSectionSchema;

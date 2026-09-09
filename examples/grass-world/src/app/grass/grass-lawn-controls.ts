import type { ToolcraftControlSectionSchema } from "@/toolcraft/runtime";

import {
  grassResponsive as responsive,
  grassSlider as slider,
} from "./grass-control-builders";
import { grassDefaults } from "./grass-defaults";

const lawnEnabled = { equals: true, target: "lawn.enabled" } as const;

export const grassLawnLayerSection = {
  controls: {
    enabled: {
      defaultValue: grassDefaults["lawn.enabled"],
      description:
        "Shows the short lawn carpet in preview and export without changing its authored settings.",
      label: "Visible",
      orderRole: "mode",
      ...responsive("Toggles the retained lower grass mesh."),
      target: "lawn.enabled",
      type: "switch",
    },
    densityMax: slider({
      defaultValue: grassDefaults["lawn.densityMax"],
      description:
        "Caps the authored number of short lawn blades across the complete terrain.",
      label: "Cover density",
      max: 36_000,
      min: 1000,
      performanceReason:
        "Owns the full-density Lawn Cover layout used by deterministic export.",
      performanceRole: "workload",
      step: 250,
      target: "lawn.densityMax",
      visibleWhen: lawnEnabled,
    }),
    distanceMin: slider({
      defaultValue: grassDefaults["lawn.distanceMin"],
      description: "Keeps minimum spacing between short lawn blades.",
      label: "Cover spacing",
      max: 0.18,
      min: 0.0075,
      performanceReason:
        "Filters the deterministic Lawn Cover placement below its independent count cap.",
      step: 0.0025,
      target: "lawn.distanceMin",
      unit: "m",
      visibleWhen: lawnEnabled,
    }),
    depthOffset: slider({
      defaultValue: grassDefaults["lawn.depthOffset"],
      description:
        "Moves the lawn roots above the terrain to avoid surface intersections.",
      label: "Cover offset",
      max: 0.2,
      min: -0.1,
      performanceReason:
        "Updates the retained Lawn Cover root offset without rebuilding its layout.",
      step: 0.005,
      target: "lawn.depthOffset",
      unit: "m",
      visibleWhen: lawnEnabled,
    }),
    seed: slider({
      defaultValue: grassDefaults["lawn.seed"],
      description:
        "Chooses the deterministic placement and variation pattern for Lawn Cover.",
      label: "Cover seed",
      max: 100,
      min: 0,
      performanceReason:
        "Rebuilds only the bounded Lawn Cover instance attributes.",
      step: 1,
      target: "lawn.seed",
      visibleWhen: lawnEnabled,
    }),
  },
  title: "Lawn Cover",
} satisfies ToolcraftControlSectionSchema;

export const grassLawnDistributionSection = {
  controls: {
    preview: {
      defaultValue: grassDefaults["lawn.distributionOffset"],
      description:
        "Shows the Lawn growth mask; white attracts short grass and black excludes it. Click or drag to move the sampled region.",
      keyframeable: false,
      label: "Distribution map",
      orderRole: "spatial",
      performanceReason:
        "Redraws a fixed-size grayscale Voronoi preview and rebuilds only the bounded Lawn layout when its offset changes.",
      performanceRole: "responsiveness",
      target: "lawn.distributionOffset",
      type: "grassNoisePreview",
    },
    scale: slider({
      defaultValue: grassDefaults["lawn.distributionScale"],
      description: "Sets the size and spacing of Lawn growth regions.",
      label: "Scale",
      max: 2.5,
      min: 0.08,
      performanceReason:
        "Re-evaluates the bounded Lawn mask for every Lawn placement candidate.",
      step: 0.01,
      target: "lawn.distributionScale",
    }),
    detail: slider({
      defaultValue: grassDefaults["lawn.distributionDetail"],
      description: "Sets how many Voronoi layers combine into the Lawn mask.",
      label: "Detail",
      max: 6,
      min: 1,
      performanceReason:
        "Directly controls the bounded number of mask octaves evaluated per Lawn placement candidate.",
      performanceRole: "workload",
      step: 1,
      target: "lawn.distributionDetail",
    }),
    roughness: slider({
      defaultValue: grassDefaults["lawn.distributionRoughness"],
      description: "Controls how strongly smaller regions affect the Lawn mask.",
      label: "Roughness",
      max: 90,
      min: 10,
      performanceReason:
        "Changes fixed-octave Lawn mask weighting without changing candidate bounds.",
      step: 1,
      target: "lawn.distributionRoughness",
      unit: "%",
    }),
    seed: slider({
      defaultValue: grassDefaults["lawn.distributionSeed"],
      description:
        "Chooses the Lawn mask independently from Lawn root variation and Tall Grass.",
      label: "Seed",
      max: 100,
      min: 0,
      performanceReason:
        "Re-evaluates only the bounded Lawn mask and deterministic Lawn layout.",
      step: 1,
      target: "lawn.distributionSeed",
    }),
    levels: {
      defaultValue: grassDefaults["lawn.distributionLevels"],
      description:
        "Maps Lawn mask values below the black point to no grass and values above the white point to maximum placement weight.",
      label: "Black / white",
      max: 100,
      min: 0,
      orderRole: "strength",
      ...responsive(
        "Remaps the bounded Lawn Voronoi samples before deterministic placement.",
      ),
      step: 1,
      target: "lawn.distributionLevels",
      type: "rangeSlider",
      unit: "%",
    },
  },
  title: "Lawn Distribution",
} satisfies ToolcraftControlSectionSchema;

export const grassLawnBladeSection = {
  controls: {
    curveResolution: slider({
      defaultValue: grassDefaults["lawn.curveResolution"],
      description: "Sets bend points along each short lawn blade.",
      label: "Cover segments",
      max: 6,
      min: 2,
      performanceReason:
        "Changes only the shared Lawn Cover blade-strip topology.",
      step: 1,
      target: "lawn.curveResolution",
    }),
    thickness: slider({
      defaultValue: grassDefaults["lawn.thickness"],
      description: "Sets the base width of short lawn blades.",
      label: "Cover thickness",
      max: 0.09,
      min: 0.01,
      performanceReason:
        "Updates the retained Lawn Cover width uniform without rebuilding placement.",
      step: 0.0025,
      target: "lawn.thickness",
      unit: "m",
    }),
    heightRange: {
      defaultValue: grassDefaults["lawn.heightRange"],
      description:
        "Sets the minimum and maximum height of the lawn carpet independently from Tall Grass.",
      label: "Cover height",
      max: 0.55,
      min: 0.03,
      orderRole: "detail",
      ...responsive(
        "Updates bounded per-instance Lawn Cover height interpolation.",
      ),
      step: 0.01,
      target: "lawn.heightRange",
      type: "rangeSlider",
      unit: "m",
    },
    taperEnd: slider({
      defaultValue: grassDefaults["lawn.taperEnd"],
      description: "Narrows the short lawn tips.",
      label: "Cover taper",
      max: 100,
      min: 0,
      performanceReason:
        "Updates fixed-cost Lawn Cover tapering in the shader.",
      step: 1,
      target: "lawn.taperEnd",
      unit: "%",
    }),
    tilt2d: slider({
      defaultValue: grassDefaults["lawn.tilt2d"],
      description:
        "Adds a fixed lean to Lawn Cover without connecting it to wind or timeline playback.",
      label: "Cover tilt",
      max: 30,
      min: -30,
      performanceReason: "Updates one retained Lawn Cover rest-tilt uniform.",
      step: 1,
      target: "lawn.tilt2d",
      unit: "°",
    }),
    use3d: {
      defaultValue: grassDefaults["lawn.use3d"],
      description: "Crosses two ribbons for a fuller lawn carpet.",
      label: "Cover 3D",
      orderRole: "mode",
      ...responsive("Switches between two bounded Lawn Cover topologies."),
      target: "lawn.use3d",
      type: "switch",
    },
  },
  title: "Lawn Blade",
  visibleWhen: lawnEnabled,
} satisfies ToolcraftControlSectionSchema;

export const grassLawnAppearanceSection = {
  controls: {
    pbrRoughness: slider({
      defaultValue: grassDefaults["lawn.pbrRoughness"],
      description: "Controls physical highlight softness on Lawn Cover.",
      label: "Cover roughness",
      max: 100,
      min: 5,
      performanceReason:
        "Updates one retained physical parameter on the Lawn Cover material.",
      semanticGroup: "material",
      step: 1,
      target: "lawn.pbrRoughness",
      unit: "%",
    }),
    colorVariation: slider({
      defaultValue: grassDefaults["lawn.colorVariation"],
      description:
        "Blends deterministic cool, warm, light, and deep green variation between neighboring Lawn Cover blades.",
      label: "Color variation",
      max: 100,
      min: 0,
      performanceReason:
        "Updates one retained color-variation uniform on Lawn Cover.",
      semanticGroup: "color",
      step: 1,
      target: "lawn.colorVariation",
      unit: "%",
    }),
    colorContrast: slider({
      defaultValue: grassDefaults["lawn.colorContrast"],
      description:
        "Expands or compresses Lawn Cover base-color separation without changing lighting or geometry.",
      label: "Cover contrast",
      max: 200,
      min: 0,
      performanceReason:
        "Updates one retained Lawn Cover material-color uniform.",
      semanticGroup: "color",
      step: 1,
      target: "lawn.colorContrast",
      unit: "%",
    }),
    colorSaturation: slider({
      defaultValue: grassDefaults["lawn.colorSaturation"],
      description:
        "Controls Lawn Cover chroma in both physical and stylized material modes.",
      label: "Cover saturation",
      max: 200,
      min: 0,
      performanceReason:
        "Updates one retained Lawn Cover material-color uniform.",
      semanticGroup: "color",
      step: 1,
      target: "lawn.colorSaturation",
      unit: "%",
    }),
    bladeGradient: {
      defaultValue: grassDefaults["lawn.bladeGradient"],
      description:
        "Maps an independent root, mid, and tip color ramp along Lawn Cover.",
      label: "Cover gradient",
      orderRole: "color",
      semanticGroup: "color",
      ...responsive("Updates only the retained Lawn Cover gradient uniforms."),
      target: "lawn.bladeGradient",
      type: "gradient",
    },
  },
  title: "Lawn Appearance",
  visibleWhen: lawnEnabled,
} satisfies ToolcraftControlSectionSchema;

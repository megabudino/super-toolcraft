import type { ToolcraftControlSectionSchema } from "@/toolcraft/runtime";

import {
  grassAppearanceSection,
  grassGroundShadowSection,
  grassSurfaceBendSection,
  grassSurfaceFadeSection,
  grassSurfaceSection,
} from "./grass-appearance-controls";
import {
  grassResponsive as responsive,
  grassSlider as slider,
} from "./grass-control-builders";
import { grassButterflyLayerSection } from "./grass-butterfly-controls";
import {
  grassFieldSection,
  grassPreviewSection,
  grassTallDistributionSection,
  grassTallLayerSection,
  grassTerrainSection,
} from "./grass-core-controls";
import { grassDefaults } from "./grass-defaults";
import {
  grassLawnInstanceColorSection,
  grassTallInstanceColorSection,
} from "./grass-instance-color-controls";
import {
  grassColorGradeSection,
  grassLightBalanceSection,
  grassSceneEnvironmentSection,
  grassSceneLightingSection,
  grassSunPatchesSection,
} from "./grass-environment-controls";
import {
  grassLawnAppearanceSection,
  grassLawnBladeSection,
  grassLawnDistributionSection,
  grassLawnLayerSection,
} from "./grass-lawn-controls";
import {
  grassRockControlSections,
  grassScannedVegetationControlSections,
} from "./grass-scan-controls";
import { grassWindControlSections } from "./grass-wind-controls";

const distributionVisibility = {
  equals: true,
  target: "field.topFacingOnly",
} as const;

const distributionSection = {
  controls: {
    alignToNormals: slider({
      defaultValue: grassDefaults["field.alignToNormals"],
      description:
        "Blends each blade from world-up toward the procedural surface normal.",
      label: "Align to normals",
      max: 100,
      min: 0,
      performanceReason:
        "Updates fixed-cost blade orientation in the vertex shader.",
      step: 1,
      target: "field.alignToNormals",
      unit: "%",
    }),
    randomRotation: slider({
      defaultValue: grassDefaults["field.randomRotation"],
      description: "Randomizes the azimuth of each grass blade.",
      label: "Random rotation",
      max: 100,
      min: 0,
      performanceReason:
        "Updates retained per-instance orientation without changing count.",
      step: 1,
      target: "field.randomRotation",
      unit: "%",
    }),
    topFacingOnly: {
      defaultValue: grassDefaults["field.topFacingOnly"],
      description:
        "Restricts grass to upward-facing regions of the procedural surface.",
      label: "Top facing only",
      orderRole: "mode",
      ...responsive(
        "Filters bounded instances during deterministic layout generation.",
      ),
      target: "field.topFacingOnly",
      type: "switch",
    },
    topFacingCoverage: slider({
      defaultValue: grassDefaults["field.topFacingCoverage"],
      description:
        "Sets the upward-facing slope threshold that can grow grass.",
      label: "Coverage",
      max: 100,
      min: 0,
      performanceReason:
        "Filters bounded instances during deterministic layout generation.",
      step: 1,
      target: "field.topFacingCoverage",
      unit: "%",
      visibleWhen: distributionVisibility,
    }),
    topFacingFade: slider({
      defaultValue: grassDefaults["field.topFacingFade"],
      description:
        "Shortens blades as surface slopes approach the coverage threshold.",
      label: "Fade",
      max: 100,
      min: 0,
      performanceReason:
        "Updates retained instance height factors without changing count.",
      step: 1,
      target: "field.topFacingFade",
      unit: "%",
      visibleWhen: distributionVisibility,
    }),
  },
  title: "Tall Grass Placement",
  visibleWhen: { equals: true, target: "grass.enabled" },
} satisfies ToolcraftControlSectionSchema;

const bladeSection = {
  controls: {
    curveResolution: slider({
      defaultValue: grassDefaults["blade.curveResolution"],
      description: "Sets the number of bend points along every blade curve.",
      label: "Curve resolution",
      max: 8,
      min: 2,
      performanceReason:
        "Changes the shared blade strip topology while instance count stays bounded.",
      step: 1,
      target: "blade.curveResolution",
    }),
    thickness: slider({
      defaultValue: grassDefaults["blade.thickness"],
      description: "Sets the maximum width at the base of each blade.",
      label: "Thickness",
      max: 0.14,
      min: 0.015,
      performanceReason: "Updates blade width in the retained vertex shader.",
      step: 0.005,
      target: "blade.thickness",
      unit: "m",
    }),
    heightRange: {
      defaultValue: grassDefaults["blade.heightRange"],
      description: "Sets the minimum and maximum height for full-grown blades.",
      label: "Height",
      max: 2.4,
      min: 0.2,
      orderRole: "detail",
      ...responsive("Updates bounded per-instance height interpolation."),
      step: 0.05,
      target: "blade.heightRange",
      type: "rangeSlider",
      unit: "m",
    },
    taperEnd: slider({
      defaultValue: grassDefaults["blade.taperEnd"],
      description: "Narrows blade tips from ribbon-like to needle-sharp.",
      label: "Taper end",
      max: 100,
      min: 0,
      performanceReason:
        "Updates fixed-cost tapering in the retained vertex shader.",
      step: 1,
      target: "blade.taperEnd",
      unit: "%",
    }),
    tilt2d: slider({
      defaultValue: grassDefaults["blade.tilt2d"],
      description: "Adds a fixed lean angle to flat ribbon grass.",
      label: "2D grass tilt",
      max: 45,
      min: -45,
      performanceReason: "Updates a retained blade tilt uniform.",
      step: 1,
      target: "blade.tilt2d",
      unit: "°",
    }),
    use3d: {
      defaultValue: grassDefaults["blade.use3d"],
      description:
        "Crosses two ribbons for volumetric blades instead of flat cards.",
      label: "3D grass",
      orderRole: "mode",
      ...responsive("Switches between two bounded shared blade topologies."),
      target: "blade.use3d",
      type: "switch",
    },
  },
  title: "Tall Grass Blade",
  visibleWhen: { equals: true, target: "grass.enabled" },
} satisfies ToolcraftControlSectionSchema;

const backgroundSection = {
  controls: {
    includeBackground: {
      defaultValue: grassDefaults["export.includeBackground"],
      description:
        "Includes the selected background in preview and still export.",
      label: "Include",
      orderRole: "detail",
      ...responsive(
        "Updates preview clear alpha and still export compositing.",
      ),
      target: "export.includeBackground",
      type: "switch",
    },
    background: {
      defaultValue: grassDefaults["scene.background"],
      label: false,
      orderRole: "color",
      ...responsive("Updates preview and export clear color."),
      target: "scene.background",
      type: "color",
    },
  },
  layoutGroups: [
    {
      columns: 2,
      controls: ["includeBackground", "background"],
      layout: "inline",
    },
  ],
  title: "Background",
} satisfies ToolcraftControlSectionSchema;

export const grassSceneSetupSection = {
  controls: {
    startingPoint: {
      actions: [
        { label: "Randomize", value: "randomize.scene" },
        { label: "Scratch", value: "scratch.scene" },
      ],
      description:
        "Randomize builds a new full scene by varying terrain, quantity, scale, seeds, and distribution while preserving every active Ground, Clover, grass, plant, flower, and stone color exactly. Generated height and object scale stay within 75–120% of the active source scene. It also keeps HDRI, light, color grade, material response, masks, fade, wind, and view exact. Scratch keeps Surface visible and hides every grass, plant, and rock layer without clearing its settings.",
      label: "Starting point",
      ...responsive(
        "Uses the existing generated-world and layer-visibility paths without adding renderer work.",
      ),
      target: "actions.sceneSetup",
      type: "actions",
    },
  },
  title: "Scene Setup",
} satisfies ToolcraftControlSectionSchema;

const imageExportSection = {
  controls: {
    format: {
      defaultValue: grassDefaults["export.image.format"],
      label: "Format",
      options: [
        { label: "PNG", value: "png" },
        { label: "JPG", value: "jpg" },
      ],
      orderRole: "mode",
      ...responsive("Changes only the final image encoder."),
      target: "export.image.format",
      type: "select",
    },
    resolution: {
      defaultValue: grassDefaults["export.image.resolution"],
      label: "Resolution",
      options: [
        { label: "2K", value: "2k" },
        { label: "4K", value: "4k" },
        { label: "8K", value: "8k" },
      ],
      orderRole: "mode",
      ...responsive("Selects the batch still-output dimensions."),
      target: "export.image.resolution",
      type: "select",
    },
  },
  layoutGroups: [
    { columns: 2, controls: ["format", "resolution"], layout: "inline" },
  ],
  title: "Image Export",
} satisfies ToolcraftControlSectionSchema;

export const grassVideoExportSection = {
  controls: {
    format: {
      defaultValue: grassDefaults["export.video.format"],
      label: "Format",
      options: [
        { label: "MP4", value: "mp4" },
        { label: "WebM", value: "webm" },
      ],
      orderRole: "mode",
      ...responsive("Selects the first browser-supported video container."),
      target: "export.video.format",
      type: "select",
    },
    resolution: {
      defaultValue: grassDefaults["export.video.resolution"],
      label: "Resolution",
      options: [
        { label: "Current", value: "current" },
        { label: "4K", value: "4k" },
      ],
      orderRole: "mode",
      ...responsive("Selects current canvas size or the bounded 4K target."),
      target: "export.video.resolution",
      type: "select",
    },
  },
  layoutGroups: [
    { columns: 2, controls: ["format", "resolution"], layout: "inline" },
  ],
  title: "Video Export",
} satisfies ToolcraftControlSectionSchema;

export const grassHiddenVideoExportAction = {
  icon: "upload-simple",
  label: "Export Video",
  role: "export-video",
  value: "export.video",
} as const;

const outputActionsSection = {
  actionGroup: "secondary",
  controls: {
    outputActions: {
      actions: [
        {
          icon: "upload-simple",
          label: "Export PNG",
          role: "export-image",
          value: "export.png",
        },
      ],
      target: "actions.output",
      type: "panelActions",
    },
  },
} satisfies ToolcraftControlSectionSchema;

export const grassControlSections = [
  grassPreviewSection,
  grassSceneSetupSection,
  grassSceneEnvironmentSection,
  grassSceneLightingSection,
  grassLightBalanceSection,
  grassSunPatchesSection,
  grassColorGradeSection,
  grassFieldSection,
  grassTerrainSection,
  grassSurfaceSection,
  grassSurfaceBendSection,
  grassSurfaceFadeSection,
  grassGroundShadowSection,
  grassLawnLayerSection,
  grassLawnDistributionSection,
  grassLawnBladeSection,
  grassLawnAppearanceSection,
  grassLawnInstanceColorSection,
  grassTallLayerSection,
  grassTallDistributionSection,
  distributionSection,
  bladeSection,
  grassAppearanceSection,
  grassTallInstanceColorSection,
  ...grassScannedVegetationControlSections,
  ...grassRockControlSections,
  grassButterflyLayerSection,
  ...grassWindControlSections,
  backgroundSection,
  imageExportSection,
  outputActionsSection,
] satisfies readonly ToolcraftControlSectionSchema[];

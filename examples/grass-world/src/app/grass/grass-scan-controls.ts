import type { ToolcraftControlSectionSchema } from "@/toolcraft/runtime";

import { grassResponsive, grassSlider } from "./grass-control-builders";
import { grassDefaults } from "./grass-defaults";
import {
  grassScanLayerContracts,
  grassScanLayerKinds,
  type GrassScanLayerKind,
} from "./grass-scan-contract";

function createScanSection(
  id: GrassScanLayerKind,
): ToolcraftControlSectionSchema {
  const { countMax, noun, sizeMax, sizeMin, title } =
    grassScanLayerContracts[id];
  const enabledTarget = `scan.${id}.enabled` as keyof typeof grassDefaults;
  const visibleWhen = { equals: true, target: enabledTarget } as const;
  const sizeRangeTarget = `scan.${id}.sizeRange` as keyof typeof grassDefaults;
  return {
    controls: {
      enabled: {
        defaultValue: grassDefaults[enabledTarget],
        description: `Shows the scanned ${noun} layer in preview and export without changing its authored settings.`,
        label: "Visible",
        orderRole: "mode",
        semanticGroup: "visibility",
        ...grassResponsive(`Toggles retained ${noun} instanced meshes.`),
        target: enabledTarget,
        type: "switch",
      },
      count: grassSlider({
        defaultValue: Number(grassDefaults[`scan.${id}.count`]),
        description: `Sets the authored number of scanned ${noun} instances across the field.`,
        label: "Count",
        max: countMax,
        min: 0,
        performanceReason: `Owns the hard ${noun} instance-count boundary rendered in preview and export.`,
        performanceRole: "workload",
        semanticGroup: "distribution",
        step: 1,
        target: `scan.${id}.count`,
        visibleWhen,
      }),
      sizeRange: {
        defaultValue: grassDefaults[sizeRangeTarget],
        description: `Sets the minimum and maximum relative size of scanned ${noun}.`,
        label: "Size range",
        max: sizeMax,
        min: sizeMin,
        orderRole: "detail",
        semanticGroup: "placement",
        ...grassResponsive(`Updates retained ${noun} instance transforms.`),
        sliderValueKind: "continuous",
        step: 0.05,
        target: sizeRangeTarget,
        type: "rangeSlider",
        visibleWhen,
      },
      clumping: grassSlider({
        defaultValue: Number(grassDefaults[`scan.${id}.clumping`]),
        description: `Biases ${noun} into natural patches instead of uniform coverage.`,
        label: "Clumping",
        max: 100,
        min: 0,
        performanceReason: `Rebuilds the bounded deterministic ${noun} placement mask.`,
        semanticGroup: "distribution",
        step: 1,
        target: `scan.${id}.clumping`,
        unit: "%",
        visibleWhen,
      }),
      seed: grassSlider({
        defaultValue: Number(grassDefaults[`scan.${id}.seed`]),
        description: `Chooses deterministic ${noun} placement and scan variants.`,
        label: "Seed",
        max: 100,
        min: 0,
        performanceReason: `Rebuilds only the bounded ${noun} instance transforms.`,
        semanticGroup: "distribution",
        step: 1,
        target: `scan.${id}.seed`,
        visibleWhen,
      }),
      surfaceOffset: grassSlider({
        defaultValue: Number(grassDefaults[`scan.${id}.surfaceOffset`]),
        description: `Lifts or sinks ${noun} at the generated terrain surface.`,
        label: "Surface offset",
        max: 0.15,
        min: -0.15,
        performanceReason: `Updates the terrain contact position for retained ${noun} instances.`,
        semanticGroup: "placement",
        step: 0.005,
        target: `scan.${id}.surfaceOffset`,
        unit: "m",
        visibleWhen,
      }),
      pbrTint: {
        defaultValue: grassDefaults[`scan.${id}.pbrTint`],
        description: `Multiplies the decoded ${noun} BaseColor without changing its physical maps.`,
        label: "Tint",
        semanticGroup: "material-color",
        ...grassResponsive(`Updates the retained ${noun} material tint.`),
        target: `scan.${id}.pbrTint`,
        type: "color",
        visibleWhen,
      },
      ...(id === "rocks"
        ? {
            shadowColor: {
              defaultValue: grassDefaults["scan.rocks.shadowColor"],
              description:
                "Tints only Small Rocks pixels darkened by received cast shadows; it does not recolor shadows cast onto other layers.",
              label: "Shadow color",
              semanticGroup: "material-color",
              ...grassResponsive(
                "Updates one retained received-shadow color uniform for Small Rocks.",
              ),
              target: "scan.rocks.shadowColor",
              type: "color" as const,
              visibleWhen,
            },
          }
        : {}),
      pbrBrightness: grassSlider({
        defaultValue: Number(grassDefaults[`scan.${id}.pbrBrightness`]),
        description: `Scales ${noun} BaseColor brightness before physical lighting.`,
        label: "Brightness",
        max: 200,
        min: 0,
        performanceReason: `Updates the retained ${noun} material brightness multiplier.`,
        semanticGroup: "material-color",
        step: 1,
        target: `scan.${id}.pbrBrightness`,
        unit: "%",
        visibleWhen,
      }),
      colorContrast: grassSlider({
        defaultValue: Number(grassDefaults[`scan.${id}.colorContrast`]),
        description: `Expands or compresses ${noun} base-color separation without changing physical maps.`,
        label: "Contrast",
        max: 200,
        min: 0,
        performanceReason: `Updates one retained ${noun} material-color uniform.`,
        semanticGroup: "material-color",
        step: 1,
        target: `scan.${id}.colorContrast`,
        unit: "%",
        visibleWhen,
      }),
      colorSaturation: grassSlider({
        defaultValue: Number(grassDefaults[`scan.${id}.colorSaturation`]),
        description: `Controls ${noun} chroma without changing normals, roughness, shadows, or alpha.`,
        label: "Saturation",
        max: 200,
        min: 0,
        performanceReason: `Updates one retained ${noun} material-color uniform.`,
        semanticGroup: "material-color",
        step: 1,
        target: `scan.${id}.colorSaturation`,
        unit: "%",
        visibleWhen,
      }),
      pbrRoughness: grassSlider({
        defaultValue: Number(grassDefaults[`scan.${id}.pbrRoughness`]),
        description: `Scales the decoded ${noun} Roughness map.`,
        label: "Roughness",
        max: 125,
        min: 0,
        performanceReason: `Updates one retained ${noun} roughness scalar.`,
        semanticGroup: "material-surface",
        step: 1,
        target: `scan.${id}.pbrRoughness`,
        unit: "%",
        visibleWhen,
      }),
      pbrNormalStrength: grassSlider({
        defaultValue: Number(grassDefaults[`scan.${id}.pbrNormalStrength`]),
        description: `Scales the decoded DirectX ${noun} normal map.`,
        label: "Normal",
        max: 200,
        min: 0,
        performanceReason: `Updates the retained ${noun} normal-map scale.`,
        semanticGroup: "material-surface",
        step: 1,
        target: `scan.${id}.pbrNormalStrength`,
        unit: "%",
        visibleWhen,
      }),
    },
    title,
  };
}

const boulderEnabled = {
  equals: true,
  target: "scan.boulder.enabled",
} as const;

export const grassBoulderControlSection = {
  controls: {
    enabled: {
      defaultValue: grassDefaults["scan.boulder.enabled"],
      description:
        "Shows the Tundra Mossy Boulder in preview and export without changing its authored settings.",
      label: "Visible",
      orderRole: "mode",
      semanticGroup: "visibility",
      ...grassResponsive("Toggles one retained Tundra boulder mesh."),
      target: "scan.boulder.enabled",
      type: "switch",
    },
    size: grassSlider({
      defaultValue: grassDefaults["scan.boulder.size"],
      description: "Sets the longest dimension of the hero boulder.",
      label: "Size",
      max: 3.2,
      min: 0.6,
      performanceReason:
        "Updates one retained Tundra boulder transform without rebuilding geometry.",
      semanticGroup: "placement",
      step: 0.05,
      target: "scan.boulder.size",
      unit: "m",
      visibleWhen: boulderEnabled,
    }),
    seed: grassSlider({
      defaultValue: grassDefaults["scan.boulder.seed"],
      description:
        "Chooses a deterministic field position and yaw for the hero boulder.",
      label: "Seed",
      max: 100,
      min: 0,
      performanceReason:
        "Rebuilds one bounded deterministic Tundra boulder transform.",
      semanticGroup: "placement",
      step: 1,
      target: "scan.boulder.seed",
      visibleWhen: boulderEnabled,
    }),
    surfaceOffset: grassSlider({
      defaultValue: grassDefaults["scan.boulder.surfaceOffset"],
      description:
        "Lifts or sinks the boulder relative to the generated terrain surface.",
      label: "Surface offset",
      max: 0.3,
      min: -0.6,
      performanceReason:
        "Updates the terrain contact position of one retained Tundra boulder.",
      semanticGroup: "placement",
      step: 0.01,
      target: "scan.boulder.surfaceOffset",
      unit: "m",
      visibleWhen: boulderEnabled,
    }),
    pbrTint: {
      defaultValue: grassDefaults["scan.boulder.pbrTint"],
      description:
        "Multiplies the decoded Boulder BaseColor without changing its physical maps.",
      label: "Tint",
      semanticGroup: "material-color",
      ...grassResponsive("Updates the retained Tundra Boulder material tint."),
      target: "scan.boulder.pbrTint",
      type: "color",
      visibleWhen: boulderEnabled,
    },
    shadowColor: {
      defaultValue: grassDefaults["scan.boulder.shadowColor"],
      description:
        "Tints only Boulder pixels darkened by received cast shadows; it does not recolor shadows cast onto other layers.",
      label: "Shadow color",
      semanticGroup: "material-color",
      ...grassResponsive(
        "Updates one retained received-shadow color uniform for the Boulder.",
      ),
      target: "scan.boulder.shadowColor",
      type: "color",
      visibleWhen: boulderEnabled,
    },
    pbrBrightness: grassSlider({
      defaultValue: grassDefaults["scan.boulder.pbrBrightness"],
      description:
        "Scales Boulder BaseColor brightness before physical lighting.",
      label: "Brightness",
      max: 200,
      min: 0,
      performanceReason:
        "Updates the retained Tundra Boulder material brightness multiplier.",
      semanticGroup: "material-color",
      step: 1,
      target: "scan.boulder.pbrBrightness",
      unit: "%",
      visibleWhen: boulderEnabled,
    }),
    colorContrast: grassSlider({
      defaultValue: grassDefaults["scan.boulder.colorContrast"],
      description:
        "Expands or compresses Boulder base-color separation without changing its physical maps.",
      label: "Contrast",
      max: 200,
      min: 0,
      performanceReason:
        "Updates one retained Tundra Boulder material-color uniform.",
      semanticGroup: "material-color",
      step: 1,
      target: "scan.boulder.colorContrast",
      unit: "%",
      visibleWhen: boulderEnabled,
    }),
    colorSaturation: grassSlider({
      defaultValue: grassDefaults["scan.boulder.colorSaturation"],
      description:
        "Controls Boulder chroma without changing normals, roughness, or shadows.",
      label: "Saturation",
      max: 200,
      min: 0,
      performanceReason:
        "Updates one retained Tundra Boulder material-color uniform.",
      semanticGroup: "material-color",
      step: 1,
      target: "scan.boulder.colorSaturation",
      unit: "%",
      visibleWhen: boulderEnabled,
    }),
    pbrRoughness: grassSlider({
      defaultValue: grassDefaults["scan.boulder.pbrRoughness"],
      description: "Scales the decoded Boulder Roughness map.",
      label: "Roughness",
      max: 125,
      min: 0,
      performanceReason: "Updates one retained Boulder roughness scalar.",
      semanticGroup: "material-surface",
      step: 1,
      target: "scan.boulder.pbrRoughness",
      unit: "%",
      visibleWhen: boulderEnabled,
    }),
    pbrNormalStrength: grassSlider({
      defaultValue: grassDefaults["scan.boulder.pbrNormalStrength"],
      description: "Scales the decoded DirectX Boulder normal map.",
      label: "Normal",
      max: 200,
      min: 0,
      performanceReason: "Updates the retained Boulder normal-map scale.",
      semanticGroup: "material-surface",
      step: 1,
      target: "scan.boulder.pbrNormalStrength",
      unit: "%",
      visibleWhen: boulderEnabled,
    }),
  },
  title: "Tundra Boulder",
} satisfies ToolcraftControlSectionSchema;

export const grassScannedVegetationControlSections = grassScanLayerKinds
  .filter((kind) => kind !== "rocks")
  .map((kind) =>
    createScanSection(kind),
  ) satisfies readonly ToolcraftControlSectionSchema[];

export const grassRockControlSections = [
  createScanSection("rocks"),
  grassBoulderControlSection,
] satisfies readonly ToolcraftControlSectionSchema[];

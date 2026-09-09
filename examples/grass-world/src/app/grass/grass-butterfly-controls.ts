import type { ToolcraftControlSectionSchema } from "@/toolcraft/runtime";

import {
  grassResponsive,
  grassSlider,
} from "./grass-control-builders";
import { grassDefaults } from "./grass-defaults";

const visibleWhen = {
  equals: true,
  target: "butterflies.enabled",
} as const;

export const grassButterflyLayerSection = {
  controls: {
    enabled: {
      defaultValue: grassDefaults["butterflies.enabled"],
      description:
        "Shows the complete flying butterfly flock in preview and export without clearing its authored settings.",
      label: "Visible",
      orderRole: "mode",
      semanticGroup: "distribution",
      ...grassResponsive("Toggles one retained instanced PBR flock."),
      target: "butterflies.enabled",
      type: "switch",
    },
    count: grassSlider({
      defaultValue: grassDefaults["butterflies.count"],
      description:
        "Sets the actual number of independently animated butterfly instances.",
      label: "Count",
      max: 64,
      min: 0,
      performanceReason:
        "Owns the hard butterfly instance boundary used by preview and export.",
      performanceRole: "workload",
      semanticGroup: "distribution",
      sliderValueKind: "discrete",
      step: 1,
      target: "butterflies.count",
      visibleWhen,
    }),
    sizeRange: {
      defaultValue: grassDefaults["butterflies.sizeRange"],
      description: "Sets the minimum and maximum butterfly wingspan.",
      label: "Size",
      max: 0.45,
      min: 0.05,
      orderRole: "detail",
      semanticGroup: "distribution",
      ...grassResponsive("Updates retained butterfly instance transforms."),
      sliderValueKind: "continuous",
      step: 0.01,
      target: "butterflies.sizeRange",
      type: "rangeSlider",
      unit: "m",
      visibleWhen,
    },
    seed: grassSlider({
      defaultValue: grassDefaults["butterflies.seed"],
      description:
        "Chooses deterministic positions, species, headings, sizes, and phases.",
      label: "Seed",
      max: 100,
      min: 0,
      performanceReason:
        "Rebuilds only the bounded butterfly layout and instance attributes.",
      semanticGroup: "distribution",
      sliderValueKind: "continuous",
      step: 1,
      target: "butterflies.seed",
      visibleWhen,
    }),
    heightRange: {
      defaultValue: grassDefaults["butterflies.heightRange"],
      description:
        "Sets the minimum and maximum flight height above the current Terrain.",
      label: "Height",
      max: 2.4,
      min: 0.1,
      orderRole: "detail",
      semanticGroup: "motion",
      ...grassResponsive(
        "Updates retained flight transforms without rebuilding the flock.",
      ),
      sliderValueKind: "continuous",
      step: 0.05,
      target: "butterflies.heightRange",
      type: "rangeSlider",
      unit: "m",
      visibleWhen,
    },
    flightCycles: grassSlider({
      defaultValue: grassDefaults["butterflies.flightCycles"],
      description:
        "Sets how many complete flight paths occur during one Timeline loop.",
      label: "Flight cycles",
      max: 6,
      min: 1,
      performanceReason:
        "Updates fixed-cost harmonic flight math for retained instances.",
      semanticGroup: "motion",
      sliderValueKind: "discrete",
      step: 1,
      target: "butterflies.flightCycles",
      variant: "discrete",
      visibleWhen,
    }),
    wingCycles: grassSlider({
      defaultValue: grassDefaults["butterflies.wingCycles"],
      description:
        "Sets how many complete wing beats occur during one Timeline loop.",
      label: "Wing cycles",
      max: 36,
      min: 6,
      performanceReason:
        "Updates one retained wing-deformation shader uniform.",
      semanticGroup: "motion",
      sliderValueKind: "continuous",
      step: 1,
      target: "butterflies.wingCycles",
      visibleWhen,
    }),
    landingTime: grassSlider({
      defaultValue: grassDefaults["butterflies.landingTime"],
      description:
        "Sets the complete first-to-last staggered Terrain landing or takeoff wave.",
      label: "Landing time",
      max: 2.5,
      min: 0.2,
      performanceReason:
        "Changes the bounded preview transition duration without changing instance count.",
      semanticGroup: "motion",
      step: 0.05,
      target: "butterflies.landingTime",
      unit: "s",
      visibleWhen,
    }),
  },
  title: "Butterflies",
} satisfies ToolcraftControlSectionSchema;

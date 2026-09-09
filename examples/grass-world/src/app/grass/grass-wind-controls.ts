import type { ToolcraftControlSectionSchema } from "@/toolcraft/runtime";

import { grassResponsive, grassSlider } from "./grass-control-builders";
import { grassDefaults } from "./grass-defaults";
import { grassSurfaceTiltMaximumDegrees } from "./grass-surface-tilt";

const animatedWind = {
  oneOf: ["sway", "wind", "simulation"],
  target: "wind.mode",
} as const;
const directedWind = {
  oneOf: ["wind", "simulation"],
  target: "wind.mode",
} as const;
const simulationWind = { equals: "simulation", target: "wind.mode" } as const;

export const grassWindModeSection = {
  controls: {
    mode: {
      defaultValue: grassDefaults["wind.mode"],
      description:
        "Static freezes the scene, Sway isolates idle motion, Wind isolates the authored gust, and Simulate blends idle motion with terrain-hover wind.",
      label: "Mode",
      options: [
        { label: "Static", value: "static" },
        { label: "Sway", value: "sway" },
        { label: "Wind", value: "wind" },
        { label: "Simulate", value: "simulation" },
      ],
      orderRole: "mode",
      ...grassResponsive(
        "Selects a fixed-cost blend of the retained ambient and gust deformation.",
      ),
      target: "wind.mode",
      type: "segmented",
    },
    directionAngle: grassSlider({
      defaultValue: grassDefaults["wind.directionAngle"],
      description:
        "Sets the fallback flow direction for authored preview and export; pointer travel temporarily targets another direction over the terrain.",
      label: "Direction",
      max: 360,
      min: 0,
      performanceReason: "Updates one normalized retained wind uniform.",
      step: 1,
      target: "wind.directionAngle",
      unit: "°",
      visibleWhen: directedWind,
    }),
  },
  title: "Wind Mode",
} satisfies ToolcraftControlSectionSchema;

export const grassAmbientSwaySection = {
  controls: {
    swayStrength: grassSlider({
      defaultValue: grassDefaults["wind.swayStrength"],
      description:
        "Sets the gentle root-anchored motion that remains when no gust is active.",
      label: "Strength",
      max: 40,
      min: 0,
      performanceReason:
        "Updates the amplitude of a bounded ambient harmonic stack.",
      semanticGroup: "idle-motion",
      step: 1,
      target: "wind.swayStrength",
      unit: "%",
    }),
    swayCycles: grassSlider({
      defaultValue: grassDefaults["wind.swayCycles"],
      description:
        "Sets how many complete ambient sway waves occur during one timeline loop.",
      label: "Tempo",
      max: 4,
      min: 1,
      performanceReason:
        "Changes an integer shader harmonic without changing instruction count.",
      semanticGroup: "idle-motion",
      sliderValueKind: "discrete",
      step: 1,
      target: "wind.swayCycles",
      variant: "discrete",
    }),
    swayVariation: grassSlider({
      defaultValue: grassDefaults["wind.swayVariation"],
      description:
        "Offsets neighboring blades so the idle field does not move as one rigid sheet.",
      label: "Variation",
      max: 100,
      min: 0,
      performanceReason:
        "Blends bounded spatial phase offsets in the retained vertex shader.",
      semanticGroup: "idle-motion",
      step: 1,
      target: "wind.swayVariation",
      unit: "%",
    }),
  },
  title: "Ambient Sway",
  visibleWhen: animatedWind,
} satisfies ToolcraftControlSectionSchema;

export const grassGustDynamicsSection = {
  controls: {
    strength: grassSlider({
      defaultValue: grassDefaults["wind.strength"],
      description:
        "Sets the peak aerodynamic load reached by the travelling gust.",
      label: "Strength",
      max: 100,
      min: 0,
      performanceReason:
        "Updates fixed-cost directional bend amplitude in the vertex shader.",
      semanticGroup: "pressure",
      step: 1,
      target: "wind.strength",
      unit: "%",
    }),
    flow: grassSlider({
      defaultValue: grassDefaults["wind.flow"],
      description:
        "Sets the sustained downwind pressure between the strongest gust fronts.",
      label: "Flow",
      max: 100,
      min: 0,
      performanceReason:
        "Blends the bounded gust toward its sustained flow floor.",
      semanticGroup: "pressure",
      step: 1,
      target: "wind.flow",
      unit: "%",
    }),
    gustCycles: grassSlider({
      defaultValue: grassDefaults["wind.gustCycles"],
      description:
        "Sets how many travelling pressure fronts cross the field per timeline loop.",
      label: "Gust rate",
      max: 4,
      min: 1,
      performanceReason:
        "Changes an integer shader harmonic without changing instruction count.",
      semanticGroup: "pulse",
      sliderValueKind: "discrete",
      step: 1,
      target: "wind.gustCycles",
      variant: "discrete",
    }),
    gustWidth: grassSlider({
      defaultValue: grassDefaults["wind.gustWidth"],
      description:
        "Controls whether each gust arrives as a short impulse or a broad pressure wave.",
      label: "Gust width",
      max: 90,
      min: 10,
      performanceReason: "Changes the exponent of one bounded gust carrier.",
      semanticGroup: "pulse",
      step: 1,
      target: "wind.gustWidth",
      unit: "%",
    }),
    noiseStrength: grassSlider({
      defaultValue: grassDefaults["wind.noiseStrength"],
      description:
        "Controls variation between the main pressure front and elastic rebound.",
      label: "Variation",
      max: 100,
      min: 0,
      performanceReason: "Updates a fixed harmonic stack in the vertex shader.",
      semanticGroup: "heterogeneity",
      step: 1,
      target: "wind.noiseStrength",
      unit: "%",
    }),
    noiseScale: grassSlider({
      defaultValue: grassDefaults["wind.noiseScale"],
      description:
        "Sets the spatial width of coherent pressure fronts moving through the field.",
      label: "Field scale",
      max: 5,
      min: 0.25,
      performanceReason: "Updates fixed-cost spatial wind frequency.",
      semanticGroup: "heterogeneity",
      step: 0.05,
      target: "wind.noiseScale",
    }),
    noiseDetail: grassSlider({
      defaultValue: grassDefaults["wind.noiseDetail"],
      description:
        "Adds smaller crosswind eddies and faster tip flutter to the flow.",
      label: "Turbulence",
      max: 100,
      min: 0,
      performanceReason:
        "Blends already bounded harmonic terms without changing their count.",
      semanticGroup: "heterogeneity",
      step: 1,
      target: "wind.noiseDetail",
      unit: "%",
    }),
    seed: grassSlider({
      defaultValue: grassDefaults["wind.seed"],
      description:
        "Chooses a deterministic spatial pressure pattern without changing flow direction.",
      label: "Seed",
      max: 128,
      min: 1,
      performanceReason:
        "Offsets bounded shader harmonics without changing their count.",
      semanticGroup: "heterogeneity",
      step: 1,
      target: "wind.seed",
    }),
  },
  title: "Gust Dynamics",
  visibleWhen: directedWind,
} satisfies ToolcraftControlSectionSchema;

export const grassSimulationSection = {
  controls: {
    rampUp: grassSlider({
      defaultValue: grassDefaults["wind.rampUp"],
      description:
        "Sets how gradually terrain hover builds the configured gust to full strength.",
      label: "Ramp up",
      max: 4,
      min: 0.1,
      performanceReason:
        "Updates one frame-rate-independent activation interpolation constant.",
      step: 0.05,
      target: "wind.rampUp",
      unit: "s",
    }),
    release: grassSlider({
      defaultValue: grassDefaults["wind.release"],
      description:
        "Sets how gradually the gust falls back to ambient sway after terrain hover ends.",
      label: "Release",
      max: 5,
      min: 0.1,
      performanceReason:
        "Updates one frame-rate-independent activation interpolation constant.",
      step: 0.05,
      target: "wind.release",
      unit: "s",
    }),
    directionResponse: grassSlider({
      defaultValue: grassDefaults["wind.directionResponse"],
      description:
        "Sets how quickly the wind follows a new terrain-projected pointer direction without snapping.",
      label: "Direction lag",
      max: 2,
      min: 0.1,
      performanceReason:
        "Updates one shortest-arc angular interpolation constant.",
      step: 0.05,
      target: "wind.directionResponse",
      unit: "s",
    }),
    audioVolume: grassSlider({
      defaultValue: grassDefaults["wind.audioVolume"],
      description:
        "Sets the live terrain-hover wind loudness; 0% keeps preview audio paused.",
      label: "Volume",
      max: 100,
      min: 0,
      performanceReason:
        "Updates one retained preview audio-element gain target without invalidating WebGL.",
      step: 1,
      target: "wind.audioVolume",
      unit: "%",
    }),
  },
  title: "Simulation",
  visibleWhen: simulationWind,
} satisfies ToolcraftControlSectionSchema;

export const grassSurfaceTiltSection = {
  controls: {
    left: grassSlider({
      defaultValue: grassDefaults["wind.surfaceTiltLeft"],
      description:
        "Sets the maximum complete-surface lean when the pointer travels left; 0° disables that direction.",
      label: "Left",
      max: grassSurfaceTiltMaximumDegrees,
      min: 0,
      performanceReason:
        "Updates one signed bound of the retained surface-root transform.",
      step: 0.05,
      target: "wind.surfaceTiltLeft",
      unit: "°",
    }),
    right: grassSlider({
      defaultValue: grassDefaults["wind.surfaceTiltRight"],
      description:
        "Sets the maximum complete-surface lean when the pointer travels right; 0° disables that direction.",
      label: "Right",
      max: grassSurfaceTiltMaximumDegrees,
      min: 0,
      performanceReason:
        "Updates one signed bound of the retained surface-root transform.",
      step: 0.05,
      target: "wind.surfaceTiltRight",
      unit: "°",
    }),
    up: grassSlider({
      defaultValue: grassDefaults["wind.surfaceTiltUp"],
      description:
        "Sets the maximum complete-surface lean when the pointer travels upward; 0° disables that direction.",
      label: "Up",
      max: grassSurfaceTiltMaximumDegrees,
      min: 0,
      performanceReason:
        "Updates one signed bound of the retained surface-root transform.",
      step: 0.05,
      target: "wind.surfaceTiltUp",
      unit: "°",
    }),
    down: grassSlider({
      defaultValue: grassDefaults["wind.surfaceTiltDown"],
      description:
        "Sets the maximum complete-surface lean when the pointer travels downward; 0° disables that direction.",
      label: "Down",
      max: grassSurfaceTiltMaximumDegrees,
      min: 0,
      performanceReason:
        "Updates one signed bound of the retained surface-root transform.",
      step: 0.05,
      target: "wind.surfaceTiltDown",
      unit: "°",
    }),
    smoothing: grassSlider({
      defaultValue: grassDefaults["wind.surfaceTiltSmoothing"],
      description:
        "Sets one global response duration for the complete surface while following pointer travel and returning to neutral.",
      label: "Smoothing",
      max: 2,
      min: 0.1,
      performanceReason:
        "Updates one frame-rate-independent root-transform interpolation constant.",
      step: 0.05,
      target: "wind.surfaceTiltSmoothing",
      unit: "s",
    }),
  },
  title: "Surface Tilt",
  visibleWhen: simulationWind,
} satisfies ToolcraftControlSectionSchema;

export const grassWindControlSections = [
  grassWindModeSection,
  grassAmbientSwaySection,
  grassGustDynamicsSection,
  grassSimulationSection,
  grassSurfaceTiltSection,
] as const satisfies readonly ToolcraftControlSectionSchema[];

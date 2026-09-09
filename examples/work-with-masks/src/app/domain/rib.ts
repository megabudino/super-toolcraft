import { waveDefaultValues } from "./wave-default-values";

export type HeroTaperSide = "end" | "start";

export const ribDefaults = {
  corner: waveDefaultValues["rib.corner"],
  depth: waveDefaultValues["rib.depth"],
  taperSide: waveDefaultValues["rib.taperSide"] as HeroTaperSide,
  taperStart: waveDefaultValues["rib.taperStart"],
  taperTip: waveDefaultValues["rib.taperTip"],
  width: waveDefaultValues["rib.width"],
} as const;

const geometryReason =
  "This profile value rebuilds the single merged rib geometry without changing rib count.";

export const ribSection = {
  controls: {
    width: {
      applicability: { mode: "always" },
      defaultValue: ribDefaults.width,
      label: "Width",
      max: 3,
      min: 0.2,
      performanceReason: geometryReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      step: 0.05,
      target: "rib.width",
      type: "slider",
    },
    depth: {
      applicability: { mode: "always" },
      defaultValue: ribDefaults.depth,
      label: "Depth",
      max: 5,
      min: 0.2,
      performanceReason: geometryReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      step: 0.05,
      target: "rib.depth",
      type: "slider",
    },
    corner: {
      applicability: { mode: "always" },
      defaultValue: ribDefaults.corner,
      description: "Rounds the rectangular rib profile up to a capsule edge.",
      label: "Corner",
      max: 0.5,
      min: 0,
      performanceReason: geometryReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      step: 0.01,
      target: "rib.corner",
      type: "slider",
    },
    taperStart: {
      applicability: { mode: "always" },
      defaultValue: ribDefaults.taperStart,
      description: "Sets where along the arc the rib begins narrowing.",
      label: "Taper start",
      max: 1,
      min: 0,
      performanceReason: geometryReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      step: 0.01,
      target: "rib.taperStart",
      type: "slider",
    },
    taperTip: {
      applicability: { mode: "always" },
      defaultValue: ribDefaults.taperTip,
      description: "Sets the final width and depth scale at the tapered tip.",
      label: "Taper tip",
      max: 1,
      min: 0.05,
      performanceReason: geometryReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      step: 0.01,
      target: "rib.taperTip",
      type: "slider",
    },
    taperSide: {
      applicability: { mode: "always" },
      defaultValue: ribDefaults.taperSide,
      label: "Taper side",
      options: [
        { label: "Start", value: "start" },
        { label: "End", value: "end" },
      ],
      performanceReason: geometryReason,
      performanceRole: "responsiveness",
      target: "rib.taperSide",
      type: "segmented",
    },
  },
  id: "rib",
  title: "Rib",
} as const;

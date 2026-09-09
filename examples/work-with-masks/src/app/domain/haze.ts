import type { HeroVector } from "./camera";
import type { HeroGradient } from "./sky";
import { waveDefaultValues } from "./wave-default-values";

export type HeroHazeBlend = "multiply" | "normal" | "screen";

export const hazeDefaults: Readonly<{
  blend: HeroHazeBlend;
  glowColor: string;
  glowPosition: HeroVector;
  glowRadius: number;
  glowStrength: number;
  gradient: HeroGradient;
  strength: number;
}> = {
  blend: waveDefaultValues["haze.blend"],
  glowColor: waveDefaultValues["haze.glowColor"],
  glowPosition: { ...waveDefaultValues["haze.glowPosition"] },
  glowRadius: waveDefaultValues["haze.glowRadius"],
  glowStrength: waveDefaultValues["haze.glowStrength"],
  gradient: {
    ...waveDefaultValues["haze.gradient"],
    stops: waveDefaultValues["haze.gradient"].stops.map((stop) => ({ ...stop })),
  },
  strength: waveDefaultValues["haze.strength"],
};

const hazeReason =
  "Haze edits update one screen-space overlay pass without rebuilding geometry or lighting.";

export const hazeSection = {
  controls: {
    gradient: {
      applicability: { mode: "always" },
      defaultValue: hazeDefaults.gradient,
      description:
        "Screen-space atmospheric tint; stop opacity decides how much of the scene it covers.",
      label: "Tint",
      performanceReason: hazeReason,
      performanceRole: "responsiveness",
      target: "haze.gradient",
      type: "gradient",
    },
    strength: {
      applicability: { mode: "always" },
      defaultValue: hazeDefaults.strength,
      label: "Tint strength",
      max: 100,
      min: 0,
      performanceReason: hazeReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      target: "haze.strength",
      type: "slider",
      unit: "%",
    },
    blend: {
      applicability: { mode: "always" },
      defaultValue: hazeDefaults.blend,
      label: "Tint blend",
      options: [
        { label: "Normal", value: "normal" },
        { label: "Screen", value: "screen" },
        { label: "Multiply", value: "multiply" },
      ],
      performanceReason: hazeReason,
      performanceRole: "responsiveness",
      target: "haze.blend",
      type: "select",
    },
    glowColor: {
      applicability: { mode: "always" },
      defaultValue: hazeDefaults.glowColor,
      label: "Glow",
      performanceReason: hazeReason,
      performanceRole: "responsiveness",
      target: "haze.glowColor",
      type: "color",
    },
    glowPosition: {
      applicability: { mode: "always" },
      defaultValue: hazeDefaults.glowPosition,
      description: "Places the sun glow on the frame; corners are the pad edges.",
      label: "Glow position",
      max: 1,
      min: -1,
      performanceReason: hazeReason,
      performanceRole: "responsiveness",
      target: "haze.glowPosition",
      type: "vector",
      xLabel: "X",
      yLabel: "Y",
    },
    glowRadius: {
      applicability: { mode: "always" },
      defaultValue: hazeDefaults.glowRadius,
      label: "Glow radius",
      max: 2.5,
      min: 0.1,
      performanceReason: hazeReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      step: 0.05,
      target: "haze.glowRadius",
      type: "slider",
    },
    glowStrength: {
      applicability: { mode: "always" },
      defaultValue: hazeDefaults.glowStrength,
      label: "Glow strength",
      max: 100,
      min: 0,
      performanceReason: hazeReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      target: "haze.glowStrength",
      type: "slider",
      unit: "%",
    },
  },
  id: "haze",
  layout: "standalone",
  title: "Haze",
} as const;

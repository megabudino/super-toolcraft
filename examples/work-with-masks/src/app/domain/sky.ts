export type HeroGradientStop = Readonly<{
  color: string;
  opacity: number;
  position: string;
}>;

export type HeroGradient = Readonly<{
  angle: number;
  gradientType: "angular" | "diamond" | "linear" | "radial";
  stops: readonly HeroGradientStop[];
}>;

export const skyDefaults: Readonly<{
  envIntensity: number;
  fogColor: string;
  fogFar: number;
  fogNear: number;
  gradient: HeroGradient;
  lightGradient: HeroGradient;
}> = {
  envIntensity: waveDefaultValues["sky.envIntensity"],
  fogColor: waveDefaultValues["sky.fogColor"],
  fogFar: waveDefaultValues["sky.fogFar"],
  fogNear: waveDefaultValues["sky.fogNear"],
  gradient: {
    ...waveDefaultValues["sky.gradient"],
    stops: waveDefaultValues["sky.gradient"].stops.map((stop) => ({ ...stop })),
  },
  lightGradient: {
    ...waveDefaultValues["sky.lightGradient"],
    stops: waveDefaultValues["sky.lightGradient"].stops.map((stop) => ({
      ...stop,
    })),
  },
};

const skyReason =
  "Atmosphere edits update retained scene uniforms or one environment texture without changing geometry.";

export const skySection = {
  controls: {
    gradient: {
      applicability: { mode: "always" },
      defaultValue: skyDefaults.gradient,
      description: "Defines the visible sky dome between the ribs.",
      label: "Visible sky",
      performanceReason: skyReason,
      performanceRole: "responsiveness",
      target: "sky.gradient",
      type: "gradient",
    },
    lightGradient: {
      applicability: { mode: "always" },
      defaultValue: skyDefaults.lightGradient,
      description: "Defines the separate PMREM environment that lights rib surfaces.",
      label: "Light dome",
      performanceReason: "Changing the light dome rebuilds one memoized PMREM environment texture.",
      performanceRole: "responsiveness",
      target: "sky.lightGradient",
      type: "gradient",
    },
    envIntensity: {
      applicability: { mode: "always" },
      defaultValue: skyDefaults.envIntensity,
      label: "Environment",
      max: 4,
      min: 0,
      performanceReason: skyReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      step: 0.05,
      target: "sky.envIntensity",
      type: "slider",
    },
    fogNear: {
      applicability: { mode: "always" },
      defaultValue: skyDefaults.fogNear,
      label: "Fog near",
      max: 100,
      min: 0,
      performanceReason: skyReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      target: "sky.fogNear",
      type: "slider",
    },
    fogFar: {
      applicability: { mode: "always" },
      defaultValue: skyDefaults.fogFar,
      label: "Fog far",
      max: 400,
      min: 20,
      performanceReason: skyReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      target: "sky.fogFar",
      type: "slider",
    },
    fogColor: {
      applicability: { mode: "always" },
      defaultValue: skyDefaults.fogColor,
      label: "Fog",
      performanceReason: skyReason,
      performanceRole: "responsiveness",
      target: "sky.fogColor",
      type: "color",
    },
  },
  id: "sky",
  layout: "standalone",
  title: "Sky",
} as const;
import { waveDefaultValues } from "./wave-default-values";

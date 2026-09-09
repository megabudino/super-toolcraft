import {
  FINE_DETAILS_TRAIL_DEFAULTS,
  fineDetailsTrailTargets,
} from "./fine-details-trail-values";
import { fineDetailsCarouselTargets } from "./fine-details-carousel-values";

const trailModeActive = {
  all: [{ equals: "trail", target: fineDetailsCarouselTargets.imagesMode }],
  mode: "conditional",
} as const;
const trailActive = {
  all: [
    { equals: "trail", target: fineDetailsCarouselTargets.imagesMode },
    { equals: true, target: fineDetailsTrailTargets.enabled },
  ],
  mode: "conditional",
} as const;
const trailBorderActive = {
  all: [
    { equals: "trail", target: fineDetailsCarouselTargets.imagesMode },
    { equals: true, target: fineDetailsTrailTargets.enabled },
    { equals: true, target: fineDetailsTrailTargets.borderEnabled },
  ],
  mode: "conditional",
} as const;
const trailShadowActive = {
  all: [
    { equals: "trail", target: fineDetailsCarouselTargets.imagesMode },
    { equals: true, target: fineDetailsTrailTargets.enabled },
    { equals: true, target: fineDetailsTrailTargets.shadowEnabled },
  ],
  mode: "conditional",
} as const;

function trailSlider(options: {
  applicability:
    | typeof trailModeActive
    | typeof trailActive
    | typeof trailBorderActive
    | typeof trailShadowActive;
  defaultValue: number;
  label: string;
  max: number;
  min: number;
  step: number;
  target: string;
  unit?: "%" | "deg" | "ms" | "px";
}) {
  return {
    ...options,
    orderRole: "strength" as const,
    performanceReason: `${options.label} must update the website trail immediately.`,
    performanceRole: "responsiveness" as const,
    sliderValueKind: "continuous" as const,
    type: "slider" as const,
    variant: "continuous" as const,
  };
}

export const fineDetailsTrailControlSections = [
  {
    controls: {
      images: {
        applicability: trailModeActive,
        assetKind: "image" as const,
        defaultValue: [],
        description:
          "Uploaded images cycle in media order through the cursor trail; originals stay runtime-only.",
        label: "Images",
        multiple: true,
        performanceReason:
          "Each image gets one display-sized website-preview derivative and is reused by the trail renderer.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsTrailTargets.images,
        type: "fileDrop" as const,
      },
    },
    id: "trail-images",
    title: "Trail Images",
  },
  {
    controls: {
      enabled: {
        applicability: trailModeActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.enabled,
        label: "Active",
        orderRole: "mode" as const,
        performanceReason:
          "Trail spawning must start or stop immediately without rebuilding the section.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsTrailTargets.enabled,
        type: "switch" as const,
      },
      cardSize: trailSlider({
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.cardSize,
        label: "Card size",
        max: 400,
        min: 40,
        step: 1,
        target: fineDetailsTrailTargets.cardSize,
        unit: "px",
      }),
      cardRadius: trailSlider({
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.cardRadius,
        label: "Card radius",
        max: 100,
        min: 0,
        step: 1,
        target: fineDetailsTrailTargets.cardRadius,
        unit: "px",
      }),
      length: trailSlider({
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.length,
        label: "Length",
        max: 24,
        min: 2,
        step: 1,
        target: fineDetailsTrailTargets.length,
      }),
      sizeFalloff: trailSlider({
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.sizeFalloff,
        label: "Size falloff",
        max: 60,
        min: 0,
        step: 1,
        target: fineDetailsTrailTargets.sizeFalloff,
        unit: "%",
      }),
      spacing: trailSlider({
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.spacing,
        label: "Spacing",
        max: 300,
        min: 10,
        step: 1,
        target: fineDetailsTrailTargets.spacing,
        unit: "px",
      }),
      tilt: trailSlider({
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.tilt,
        label: "Tilt",
        max: 30,
        min: 0,
        step: 1,
        target: fineDetailsTrailTargets.tilt,
        unit: "deg",
      }),
    },
    id: "trail",
    title: "Trail",
  },
  {
    controls: {
      smoothness: trailSlider({
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.smoothness,
        label: "Smoothness",
        max: 1000,
        min: 0,
        step: 10,
        target: fineDetailsTrailTargets.smoothness,
        unit: "ms",
      }),
      lifetime: trailSlider({
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.lifetime,
        label: "Lifetime",
        max: 10_000,
        min: 200,
        step: 50,
        target: fineDetailsTrailTargets.lifetime,
        unit: "ms",
      }),
      fadeIn: trailSlider({
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.fadeIn,
        label: "Fade in",
        max: 1000,
        min: 0,
        step: 10,
        target: fineDetailsTrailTargets.fadeIn,
        unit: "ms",
      }),
      fadeOut: trailSlider({
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.fadeOut,
        label: "Fade out",
        max: 2000,
        min: 100,
        step: 10,
        target: fineDetailsTrailTargets.fadeOut,
        unit: "ms",
      }),
      resumeDelay: trailSlider({
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.resumeDelay,
        label: "Resume delay",
        max: 2000,
        min: 0,
        step: 10,
        target: fineDetailsTrailTargets.resumeDelay,
        unit: "ms",
      }),
      resumeRamp: trailSlider({
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.resumeRamp,
        label: "Resume ramp",
        max: 2000,
        min: 0,
        step: 10,
        target: fineDetailsTrailTargets.resumeRamp,
        unit: "ms",
      }),
    },
    id: "trail-motion",
    title: "Trail Motion",
  },
  {
    controls: {
      borderEnabled: {
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.border.enabled,
        label: "Border",
        orderRole: "mode" as const,
        performanceReason:
          "The shared trail-card border must appear or disappear immediately.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsTrailTargets.borderEnabled,
        type: "switch" as const,
      },
      borderWidth: trailSlider({
        applicability: trailBorderActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.border.width,
        label: "Border width",
        max: 20,
        min: 1,
        step: 1,
        target: fineDetailsTrailTargets.borderWidth,
        unit: "px",
      }),
      borderColor: {
        applicability: trailBorderActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.border.color,
        label: "Border color",
        performanceReason:
          "The shared trail-card border color must update immediately.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsTrailTargets.borderColor,
        type: "color" as const,
      },
    },
    id: "trail-border",
    title: "Trail Border",
  },
  {
    controls: {
      shadowEnabled: {
        applicability: trailActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.shadow.enabled,
        label: "Shadow",
        orderRole: "mode" as const,
        performanceReason:
          "The shared trail-card shadow must appear or disappear immediately.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsTrailTargets.shadowEnabled,
        type: "switch" as const,
      },
      shadowOffset: {
        applicability: trailShadowActive,
        coordinateMode: "screen" as const,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.shadow.offset,
        description: "Moves the shared shadow on every trail card.",
        label: "Shadow offset",
        performanceReason:
          "Two-axis trail shadow placement must remain live throughout pad gestures.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsTrailTargets.shadowOffset,
        type: "vector" as const,
      },
      shadowBlur: trailSlider({
        applicability: trailShadowActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.shadow.blur,
        label: "Shadow blur",
        max: 100,
        min: 0,
        step: 1,
        target: fineDetailsTrailTargets.shadowBlur,
        unit: "px",
      }),
      shadowSpread: trailSlider({
        applicability: trailShadowActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.shadow.spread,
        label: "Shadow spread",
        max: 32,
        min: -32,
        step: 1,
        target: fineDetailsTrailTargets.shadowSpread,
        unit: "px",
      }),
      shadowColorOpacity: {
        applicability: trailShadowActive,
        defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.shadow.colorOpacity,
        label: "Shadow color",
        performanceReason:
          "Trail shadow color and opacity must update every retained card immediately.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsTrailTargets.shadowColorOpacity,
        type: "colorOpacity" as const,
      },
    },
    id: "trail-shadow",
    title: "Trail Shadow",
  },
] as const;

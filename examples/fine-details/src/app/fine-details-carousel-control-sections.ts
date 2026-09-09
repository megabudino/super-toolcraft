import {
  FINE_DETAILS_CAROUSEL_DEFAULTS,
  FINE_DETAILS_IMAGES_MODE_DEFAULT,
  fineDetailsCarouselTargets,
} from "./fine-details-carousel-values";

const always = { mode: "always" } as const;
const carouselActive = {
  all: [{ equals: "carousel", target: fineDetailsCarouselTargets.imagesMode }],
  mode: "conditional",
} as const;
const carouselGeometryActive = {
  all: [
    {
      oneOf: ["loading", "carousel"],
      target: fineDetailsCarouselTargets.imagesMode,
    },
  ],
  mode: "conditional",
} as const;
const carouselBorderActive = {
  all: [
    { equals: "carousel", target: fineDetailsCarouselTargets.imagesMode },
    { equals: true, target: fineDetailsCarouselTargets.borderEnabled },
  ],
  mode: "conditional",
} as const;
const carouselShadowActive = {
  all: [
    { equals: "carousel", target: fineDetailsCarouselTargets.imagesMode },
    { equals: true, target: fineDetailsCarouselTargets.shadowEnabled },
  ],
  mode: "conditional",
} as const;

function carouselSlider(options: {
  applicability:
    | typeof carouselActive
    | typeof carouselGeometryActive
    | typeof carouselBorderActive
    | typeof carouselShadowActive;
  defaultValue: number;
  label: string;
  max: number;
  min: number;
  step: number;
  target: string;
  unit?: "px" | "px/s";
}) {
  return {
    ...options,
    orderRole: "strength" as const,
    performanceReason: `${options.label} must update the website carousel immediately.`,
    performanceRole: "responsiveness" as const,
    sliderValueKind: "continuous" as const,
    type: "slider" as const,
    variant: "continuous" as const,
  };
}

export const fineDetailsCarouselControlSections = [
  {
    controls: {
      imagesMode: {
        applicability: always,
        defaultValue: FINE_DETAILS_IMAGES_MODE_DEFAULT,
        label: "Images",
        options: [
          { label: "Trail", value: "trail" },
          { label: "Loading", value: "loading" },
          { label: "Carousel", value: "carousel" },
        ],
        orderRole: "mode" as const,
        performanceReason:
          "Switching image mode must replace the active website renderer immediately.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsCarouselTargets.imagesMode,
        type: "segmented" as const,
      },
      count: {
        applicability: carouselActive,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.count,
        description: "How many of the four authored images appear, in order.",
        label: "Images shown",
        max: 4,
        min: 1,
        orderRole: "detail" as const,
        performanceReason:
          "Changing the authored image count must update the carousel without rebuilding the preview bridge.",
        performanceRole: "responsiveness" as const,
        sliderValueKind: "discrete" as const,
        step: 1,
        target: fineDetailsCarouselTargets.count,
        type: "slider" as const,
        variant: "discrete" as const,
      },
      textGap: carouselSlider({
        applicability: carouselGeometryActive,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.textGap,
        label: "Text gap",
        max: 200,
        min: 0,
        step: 1,
        target: fineDetailsCarouselTargets.textGap,
        unit: "px",
      }),
      radius: carouselSlider({
        applicability: carouselGeometryActive,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.radius,
        label: "Corner radius",
        max: 48,
        min: 0,
        step: 1,
        target: fineDetailsCarouselTargets.radius,
        unit: "px",
      }),
      gap: carouselSlider({
        applicability: carouselGeometryActive,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.gap,
        label: "Gap",
        max: 120,
        min: 0,
        step: 1,
        target: fineDetailsCarouselTargets.gap,
        unit: "px",
      }),
      speed: carouselSlider({
        applicability: carouselActive,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.speed,
        label: "Speed",
        max: 300,
        min: 10,
        step: 1,
        target: fineDetailsCarouselTargets.speed,
        unit: "px/s",
      }),
    },
    id: "carousel",
    title: "Carousel",
  },
  {
    controls: {
      borderEnabled: {
        applicability: carouselActive,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.border.enabled,
        label: "Border",
        orderRole: "mode" as const,
        performanceReason:
          "The shared carousel border must appear or disappear immediately.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsCarouselTargets.borderEnabled,
        type: "switch" as const,
      },
      borderWidth: carouselSlider({
        applicability: carouselBorderActive,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.border.width,
        label: "Border width",
        max: 20,
        min: 1,
        step: 1,
        target: fineDetailsCarouselTargets.borderWidth,
        unit: "px",
      }),
      borderColorOpacity: {
        applicability: carouselBorderActive,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.border.colorOpacity,
        label: "Border color",
        performanceReason:
          "Carousel border color and opacity must update every visible image immediately.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsCarouselTargets.borderColorOpacity,
        type: "colorOpacity" as const,
      },
    },
    id: "carousel-border",
    title: "Carousel Border",
  },
  {
    controls: {
      shadowEnabled: {
        applicability: carouselActive,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.shadow.enabled,
        label: "Shadow",
        orderRole: "mode" as const,
        performanceReason:
          "The shared carousel shadow must appear or disappear immediately.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsCarouselTargets.shadowEnabled,
        type: "switch" as const,
      },
      shadowOffset: {
        applicability: carouselShadowActive,
        coordinateMode: "screen" as const,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.shadow.offset,
        description: "Moves the shared shadow on every carousel image.",
        label: "Shadow offset",
        performanceReason:
          "Two-axis carousel shadow placement must remain live throughout pad gestures.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsCarouselTargets.shadowOffset,
        type: "vector" as const,
      },
      shadowBlur: carouselSlider({
        applicability: carouselShadowActive,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.shadow.blur,
        label: "Shadow blur",
        max: 100,
        min: 0,
        step: 1,
        target: fineDetailsCarouselTargets.shadowBlur,
        unit: "px",
      }),
      shadowSpread: carouselSlider({
        applicability: carouselShadowActive,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.shadow.spread,
        label: "Shadow spread",
        max: 32,
        min: -32,
        step: 1,
        target: fineDetailsCarouselTargets.shadowSpread,
        unit: "px",
      }),
      shadowColorOpacity: {
        applicability: carouselShadowActive,
        defaultValue: FINE_DETAILS_CAROUSEL_DEFAULTS.shadow.colorOpacity,
        label: "Shadow color",
        performanceReason:
          "Carousel shadow color and opacity must update every visible image immediately.",
        performanceRole: "responsiveness" as const,
        target: fineDetailsCarouselTargets.shadowColorOpacity,
        type: "colorOpacity" as const,
      },
    },
    id: "carousel-shadow",
    title: "Carousel Shadow",
  },
] as const;

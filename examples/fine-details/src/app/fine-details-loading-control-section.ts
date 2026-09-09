import { fineDetailsCarouselTargets } from "./fine-details-carousel-values";
import {
  FINE_DETAILS_LOADING_DEFAULTS,
  fineDetailsLoadingTargets,
} from "./fine-details-loading-values";

const loadingModeActive = {
  all: [{ equals: "loading", target: fineDetailsCarouselTargets.imagesMode }],
  mode: "conditional",
} as const;
const loadingWaveActive = {
  all: [
    { equals: "loading", target: fineDetailsCarouselTargets.imagesMode },
    { equals: true, target: fineDetailsLoadingTargets.enabled },
  ],
  mode: "conditional",
} as const;

function loadingWaveSlider(options: {
  defaultValue: number;
  description: string;
  label: string;
  max: number;
  min: number;
  semanticGroup: "band" | "pattern" | "shine" | "timing";
  step: number;
  target: string;
  unit?: "%" | "deg" | "ms" | "px";
}) {
  return {
    ...options,
    applicability: loadingWaveActive,
    orderRole: "strength" as const,
    performanceReason: `${options.label} must restyle the website loading placeholders immediately.`,
    performanceRole: "responsiveness" as const,
    sliderValueKind: "continuous" as const,
    type: "slider" as const,
    variant: "continuous" as const,
  };
}

export const fineDetailsLoadingControlSections = [
  {
    controls: {
      enabled: {
        applicability: loadingModeActive,
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.enabled,
        description:
          "When off, the generation placeholders keep the plain vertical shimmer without the checker wave.",
        label: "Active",
        orderRole: "mode" as const,
        performanceReason:
          "The wave gate must swap the placeholder surface treatment immediately.",
        performanceRole: "responsiveness" as const,
        semanticGroup: "pattern" as const,
        target: fineDetailsLoadingTargets.enabled,
        type: "switch" as const,
      },
      cell: loadingWaveSlider({
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.cell,
        description: "Sets the checker cell size on the placeholder cards.",
        label: "Cell size",
        max: 64,
        min: 8,
        semanticGroup: "pattern",
        step: 1,
        target: fineDetailsLoadingTargets.cell,
        unit: "px",
      }),
      contrast: loadingWaveSlider({
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.contrast,
        description:
          "Sets how much darker the checker cells are than the card surface.",
        label: "Contrast",
        max: 60,
        min: 0,
        semanticGroup: "pattern",
        step: 1,
        target: fineDetailsLoadingTargets.contrast,
        unit: "%",
      }),
      baseTone: loadingWaveSlider({
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.baseTone,
        description:
          "Lightens the card surface from the base gray toward white.",
        label: "Base tone",
        max: 100,
        min: 0,
        semanticGroup: "pattern",
        step: 1,
        target: fineDetailsLoadingTargets.baseTone,
        unit: "%",
      }),
      glare: loadingWaveSlider({
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.glare,
        description:
          "Whitens the flipped cells inside the band into a glossy sheen.",
        label: "Glare",
        max: 100,
        min: 0,
        semanticGroup: "shine",
        step: 1,
        target: fineDetailsLoadingTargets.glare,
        unit: "%",
      }),
      distort: loadingWaveSlider({
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.distort,
        description:
          "Shifts the checker under the band so the wave refracts the pattern as it passes.",
        label: "Distortion",
        max: 24,
        min: 0,
        semanticGroup: "shine",
        step: 1,
        target: fineDetailsLoadingTargets.distort,
        unit: "px",
      }),
      borderWidth: {
        applicability: loadingModeActive,
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.border.width,
        description:
          "Outlines every placeholder card; zero removes the outline. Applies with the wave on or off.",
        label: "Border width",
        max: 8,
        min: 0,
        orderRole: "strength" as const,
        performanceReason:
          "Border width must restyle the website loading placeholders immediately.",
        performanceRole: "responsiveness" as const,
        semanticGroup: "edge" as const,
        sliderValueKind: "continuous" as const,
        step: 0.5,
        target: fineDetailsLoadingTargets.borderWidth,
        type: "slider" as const,
        unit: "px",
        variant: "continuous" as const,
      },
      borderColorOpacity: {
        applicability: loadingModeActive,
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.border.colorOpacity,
        label: "Border color",
        performanceReason:
          "Border color and opacity must restyle the website loading placeholders immediately.",
        performanceRole: "responsiveness" as const,
        semanticGroup: "edge" as const,
        target: fineDetailsLoadingTargets.borderColorOpacity,
        type: "colorOpacity" as const,
      },
    },
    id: "loading-wave",
    title: "Loading Wave",
  },
  {
    controls: {
      waveWidth: loadingWaveSlider({
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.waveWidth,
        description:
          "Sets the sweeping band's span as a share of the card diagonal.",
        label: "Wave width",
        max: 100,
        min: 10,
        semanticGroup: "band",
        step: 1,
        target: fineDetailsLoadingTargets.waveWidth,
        unit: "%",
      }),
      softness: loadingWaveSlider({
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.softness,
        description:
          "Feathers the band edges; zero flips cells with a hard edge.",
        label: "Softness",
        max: 100,
        min: 0,
        semanticGroup: "band",
        step: 1,
        target: fineDetailsLoadingTargets.softness,
        unit: "%",
      }),
      angle: loadingWaveSlider({
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.angle,
        description: "Sets the band's direction of travel across the cards.",
        label: "Angle",
        max: 360,
        min: 0,
        semanticGroup: "band",
        step: 5,
        target: fineDetailsLoadingTargets.angle,
        unit: "deg",
      }),
      passTime: loadingWaveSlider({
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.passTime,
        description: "Sets how long one sweep takes to cross a card.",
        label: "Pass time",
        max: 4000,
        min: 600,
        semanticGroup: "timing",
        step: 50,
        target: fineDetailsLoadingTargets.passTime,
        unit: "ms",
      }),
      pause: loadingWaveSlider({
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.pause,
        description: "Sets the dead time between consecutive sweeps.",
        label: "Pause",
        max: 2000,
        min: 0,
        semanticGroup: "timing",
        step: 50,
        target: fineDetailsLoadingTargets.pause,
        unit: "ms",
      }),
      stagger: loadingWaveSlider({
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.stagger,
        description:
          "Offsets each card's wave so the sweep ripples across the placeholders.",
        label: "Stagger",
        max: 800,
        min: 0,
        semanticGroup: "timing",
        step: 10,
        target: fineDetailsLoadingTargets.stagger,
        unit: "ms",
      }),
      desync: loadingWaveSlider({
        defaultValue: FINE_DETAILS_LOADING_DEFAULTS.desync,
        description:
          "Lengthens each next card's cycle so the waves drift apart instead of ticking in lockstep; zero keeps them synchronized.",
        label: "Desync",
        max: 50,
        min: 0,
        semanticGroup: "timing",
        step: 1,
        target: fineDetailsLoadingTargets.desync,
        unit: "%",
      }),
    },
    id: "loading-wave-motion",
    title: "Wave Motion",
  },
] as const;

import {
  FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS,
  FINE_DETAILS_PROMPT_FLIGHT_LIMITS,
  fineDetailsPromptFlightTargets,
} from "./fine-details-prompt-flight-values";
import {
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
} from "./fine-details-prompt-flight-command-contract";

const always = { mode: "always" } as const;
const flightActive = {
  all: [{ equals: true, target: fineDetailsPromptFlightTargets.enabled }],
  mode: "conditional",
} as const;
const ghostsActive = {
  all: [
    { equals: true, target: fineDetailsPromptFlightTargets.enabled },
    { equals: true, target: fineDetailsPromptFlightTargets.ghosts },
  ],
  mode: "conditional",
} as const;

function flightSlider(options: {
  applicability: typeof flightActive | typeof ghostsActive;
  defaultValue: number;
  description: string;
  label: string;
  max: number;
  min: number;
  orderRole?: "spatial" | "strength";
  semanticGroup: "flight" | "ghosts" | "landing" | "vanish";
  step: number;
  target: string;
  unit?: "%" | "ms" | "px";
}) {
  return {
    ...options,
    orderRole: options.orderRole ?? ("strength" as const),
    performanceReason: `${options.label} must update the one-shot website prompt transition immediately.`,
    performanceRole: "responsiveness" as const,
    sliderValueKind: "continuous" as const,
    type: "slider" as const,
    variant: "continuous" as const,
  };
}

export const fineDetailsPromptFlightControlSections = [
  {
    controls: {
      active: {
        applicability: always,
        defaultValue: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.enabled,
        description:
          "When off, state changes snap the prompt between its base and corner landing positions without breadcrumbs.",
        label: "Active",
        orderRole: "mode" as const,
        performanceReason:
          "The prompt transition gate must update immediately without rebuilding the website preview.",
        performanceRole: "responsiveness" as const,
        semanticGroup: "mode" as const,
        target: fineDetailsPromptFlightTargets.enabled,
        type: "switch" as const,
      },
      offsetX: flightSlider({
        applicability: flightActive,
        defaultValue: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.offset.x,
        description:
          "Offsets the prompt window's touchdown left edge in pixels from the upper-left typography's exact left edge.",
        label: "Offset X",
        max: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.offset.maximum,
        min: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.offset.minimum,
        orderRole: "spatial" as const,
        semanticGroup: "landing",
        step: 1,
        target: fineDetailsPromptFlightTargets.offsetX,
        unit: "px",
      }),
      offsetY: flightSlider({
        applicability: flightActive,
        defaultValue: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.offset.y,
        description:
          "Offsets the prompt window's touchdown bottom edge in pixels from the lower-right typography's exact bottom edge.",
        label: "Offset Y",
        max: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.offset.maximum,
        min: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.offset.minimum,
        orderRole: "spatial" as const,
        semanticGroup: "landing",
        step: 1,
        target: fineDetailsPromptFlightTargets.offsetY,
        unit: "px",
      }),
      startDelay: flightSlider({
        applicability: flightActive,
        defaultValue: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.startDelay,
        description: "Wait before the prompt begins flying into Carousel.",
        label: "Start delay",
        max: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.startDelay.maximum,
        min: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.startDelay.minimum,
        semanticGroup: "flight",
        step: 10,
        target: fineDetailsPromptFlightTargets.startDelay,
        unit: "ms",
      }),
      flightTime: flightSlider({
        applicability: flightActive,
        defaultValue: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.flightTime,
        description: "Travel time from the current prompt position to its landing point.",
        label: "Flight time",
        max: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.flightTime.maximum,
        min: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.flightTime.minimum,
        semanticGroup: "flight",
        step: 10,
        target: fineDetailsPromptFlightTargets.flightTime,
        unit: "ms",
      }),
      bounce: flightSlider({
        applicability: flightActive,
        defaultValue: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.bounce,
        description: "Adds a proportional overshoot before the prompt settles.",
        label: "Bounce",
        max: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.bounce.maximum,
        min: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.bounce.minimum,
        semanticGroup: "flight",
        step: 1,
        target: fineDetailsPromptFlightTargets.bounce,
        unit: "%",
      }),
    },
    id: "prompt-flight",
    title: "Prompt Flight",
  },
  {
    controls: {
      active: {
        applicability: flightActive,
        defaultValue: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.ghosts,
        description: "Shows or hides stationary breadcrumb copies during outbound and return flights.",
        label: "Active",
        orderRole: "mode" as const,
        performanceReason:
          "The breadcrumb visibility gate must update the next one-shot prompt transition immediately.",
        performanceRole: "responsiveness" as const,
        semanticGroup: "mode" as const,
        target: fineDetailsPromptFlightTargets.ghosts,
        type: "switch" as const,
      },
      spacing: flightSlider({
        applicability: ghostsActive,
        defaultValue: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.ghostSpacing,
        description: "Sets the stationary center-to-center distance between dropped copies.",
        label: "Spacing",
        max: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.ghostSpacing.maximum,
        min: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.ghostSpacing.minimum,
        semanticGroup: "ghosts",
        step: 1,
        target: fineDetailsPromptFlightTargets.ghostSpacing,
        unit: "px",
      }),
      opacity: flightSlider({
        applicability: ghostsActive,
        defaultValue: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.ghostOpacity,
        description: "Scales the visible opacity of the complete breadcrumb chain.",
        label: "Opacity",
        max: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.ghostOpacity.maximum,
        min: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.ghostOpacity.minimum,
        semanticGroup: "ghosts",
        step: 1,
        target: fineDetailsPromptFlightTargets.ghostOpacity,
        unit: "%",
      }),
      falloff: flightSlider({
        applicability: ghostsActive,
        defaultValue: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.ghostFalloff,
        description: "Dims successive breadcrumbs toward the takeoff point; zero keeps them uniform.",
        label: "Falloff",
        max: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.ghostFalloff.maximum,
        min: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.ghostFalloff.minimum,
        semanticGroup: "ghosts",
        step: 1,
        target: fineDetailsPromptFlightTargets.ghostFalloff,
        unit: "%",
      }),
      vanishStagger: flightSlider({
        applicability: ghostsActive,
        defaultValue: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.vanishStagger,
        description:
          "Delays each breadcrumb fade after landing so first-dropped copies vanish first.",
        label: "Vanish stagger",
        max: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.vanishStagger.maximum,
        min: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.vanishStagger.minimum,
        semanticGroup: "vanish",
        step: 10,
        target: fineDetailsPromptFlightTargets.vanishStagger,
        unit: "ms",
      }),
      vanishTime: flightSlider({
        applicability: ghostsActive,
        defaultValue: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.vanishTime,
        description: "Sets the fade duration of each stationary breadcrumb after landing.",
        label: "Vanish time",
        max: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.vanishTime.maximum,
        min: FINE_DETAILS_PROMPT_FLIGHT_LIMITS.vanishTime.minimum,
        semanticGroup: "vanish",
        step: 10,
        target: fineDetailsPromptFlightTargets.vanishTime,
        unit: "ms",
      }),
    },
    id: "prompt-ghosts",
    title: "Prompt Ghosts",
  },
  {
    controls: {
      playback: {
        actions: [
          {
            label: "Run",
            value: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.actionId,
          },
          {
            label: "Reset",
            value: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.reset.actionId,
            variant: "outline" as const,
          },
        ],
        applicability: always,
        label: false,
        orderRole: "action" as const,
        semanticGroup: "playback" as const,
        target: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
        type: "actions" as const,
      },
    },
    id: "prompt-flight-playback",
    title: "Playback",
  },
] as const;

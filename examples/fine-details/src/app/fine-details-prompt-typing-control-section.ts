import { fineDetailsCarouselTargets } from "./fine-details-carousel-values";
import {
  FINE_DETAILS_PROMPT_DEFAULTS,
  FINE_DETAILS_PROMPT_PHRASE_MAX_ITEMS,
  fineDetailsPromptTargets,
} from "./fine-details-prompt-values";

const trailModeActive = {
  all: [{ equals: "trail", target: fineDetailsCarouselTargets.imagesMode }],
  mode: "conditional",
} as const;

const typingActive = {
  all: [
    { equals: "trail", target: fineDetailsCarouselTargets.imagesMode },
    { equals: true, target: fineDetailsPromptTargets.typingEnabled },
  ],
  mode: "conditional",
} as const;

const typingBackspaceActive = {
  all: [
    ...typingActive.all,
    {
      equals: "backspace",
      target: fineDetailsPromptTargets.typingDeleteStyle,
    },
  ],
  mode: "conditional",
} as const;

function typingSlider(options: {
  applicability: typeof typingActive | typeof typingBackspaceActive;
  defaultValue: number;
  label: string;
  max: number;
  min: number;
  semanticGroup: string;
  step: number;
  target: string;
  unit?: "chars/s" | "s";
}) {
  return {
    ...options,
    orderRole: "strength" as const,
    performanceReason: `${options.label} changes must reach the website-owned idle prompt animation immediately.`,
    performanceRole: "responsiveness" as const,
    sliderValueKind: "continuous" as const,
    type: "slider" as const,
    variant: "continuous" as const,
  };
}

export const fineDetailsPromptTypingControlSection = {
  controls: {
    typingEnabled: {
      applicability: trailModeActive,
      defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.typing.enabled,
      label: "Typing animation",
      orderRole: "mode" as const,
      performanceReason:
        "Typing animation must start or stop immediately without rebuilding the embedded website preview.",
      performanceRole: "responsiveness" as const,
      semanticGroup: "prompt-typing-mode",
      target: fineDetailsPromptTargets.typingEnabled,
      type: "switch" as const,
    },
    typingPhrases: {
      applicability: typingActive,
      defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.typing.phrases,
      hardMaxItems: FINE_DETAILS_PROMPT_PHRASE_MAX_ITEMS,
      itemControl: {
        commitMode: "content" as const,
        label: false,
        textValueKind: "single-line" as const,
        type: "text" as const,
      },
      itemDefaultValue: "",
      itemLabel: "Phrase",
      label: "Phrases",
      minItems: 1,
      orderRole: "primary" as const,
      performanceReason:
        "Ordered phrase edits must update the website-owned typing cycle while content is entered.",
      performanceRole: "responsiveness" as const,
      semanticGroup: "prompt-typing-content",
      target: fineDetailsPromptTargets.typingPhrases,
      type: "collectionActions" as const,
    },
    typingTypeSpeed: typingSlider({
      applicability: typingActive,
      defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.typing.typeSpeed,
      label: "Type speed",
      max: 30,
      min: 3,
      semanticGroup: "prompt-typing-timing",
      step: 1,
      target: fineDetailsPromptTargets.typingTypeSpeed,
      unit: "chars/s",
    }),
    typingDeleteSpeed: typingSlider({
      applicability: typingBackspaceActive,
      defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.typing.deleteSpeed,
      label: "Delete speed",
      max: 60,
      min: 5,
      semanticGroup: "prompt-typing-deletion",
      step: 1,
      target: fineDetailsPromptTargets.typingDeleteSpeed,
      unit: "chars/s",
    }),
    typingHold: typingSlider({
      applicability: typingActive,
      defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.typing.hold,
      label: "Hold",
      max: 6,
      min: 0.2,
      semanticGroup: "prompt-typing-timing",
      step: 0.1,
      target: fineDetailsPromptTargets.typingHold,
      unit: "s",
    }),
    typingGap: typingSlider({
      applicability: typingActive,
      defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.typing.gap,
      label: "Gap",
      max: 3,
      min: 0,
      semanticGroup: "prompt-typing-timing",
      step: 0.1,
      target: fineDetailsPromptTargets.typingGap,
      unit: "s",
    }),
    typingHumanize: typingSlider({
      applicability: typingActive,
      defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.typing.humanize,
      label: "Humanize",
      max: 1,
      min: 0,
      semanticGroup: "prompt-typing-timing",
      step: 0.1,
      target: fineDetailsPromptTargets.typingHumanize,
    }),
    typingDeleteStyle: {
      applicability: typingActive,
      defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.typing.deleteStyle,
      label: "Delete style",
      options: [
        { label: "Backspace", value: "backspace" },
        { label: "Instant", value: "instant" },
      ],
      orderRole: "advanced" as const,
      performanceReason:
        "Deletion mode changes must update the website-owned typing cycle immediately.",
      performanceRole: "responsiveness" as const,
      semanticGroup: "prompt-typing-deletion",
      target: fineDetailsPromptTargets.typingDeleteStyle,
      type: "segmented" as const,
    },
  },
  id: "fine-details-prompt-typing",
  title: "Prompt Typing",
} as const;

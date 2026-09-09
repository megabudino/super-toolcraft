export const fineDetailsPromptTargets = {
  position: "prompt.position",
  shadowBlur: "prompt.shadow.blur",
  shadowColorOpacity: "prompt.shadow.colorOpacity",
  shadowEnabled: "prompt.shadow.enabled",
  shadowOffset: "prompt.shadow.offset",
  shadowSpread: "prompt.shadow.spread",
  typingDeleteSpeed: "prompt.typing.deleteSpeed",
  typingDeleteStyle: "prompt.typing.deleteStyle",
  typingEnabled: "prompt.typing.enabled",
  typingGap: "prompt.typing.gap",
  typingHold: "prompt.typing.hold",
  typingHumanize: "prompt.typing.humanize",
  typingPhrases: "prompt.typing.phrases",
  typingTypeSpeed: "prompt.typing.typeSpeed",
} as const;

export const FINE_DETAILS_PROMPT_PHRASE_MAX_ITEMS = 8;
export const FINE_DETAILS_PROMPT_PHRASE_MAX_LENGTH = 200;

export type FineDetailsPromptDeleteStyle = "backspace" | "instant";

export type FineDetailsPromptTypingSettings = Readonly<{
  deleteSpeed: number;
  deleteStyle: FineDetailsPromptDeleteStyle;
  enabled: boolean;
  gap: number;
  hold: number;
  humanize: number;
  phrases: readonly string[];
  typeSpeed: number;
}>;

export type FineDetailsColorOpacity = Readonly<{
  hex: string;
  opacity: number;
}>;

export type FineDetailsPromptSettings = Readonly<{
  position: Readonly<{ x: number; y: number }>;
  shadow: Readonly<{
    blur: number;
    colorOpacity: FineDetailsColorOpacity;
    enabled: boolean;
    offset: Readonly<{ x: number; y: number }>;
    spread: number;
  }>;
  typing: FineDetailsPromptTypingSettings;
}>;

export const FINE_DETAILS_PROMPT_DEFAULTS: FineDetailsPromptSettings = {
  position: { x: 0, y: -0.06 },
  shadow: {
    blur: 33,
    colorOpacity: { hex: "#000000", opacity: 35 },
    enabled: true,
    offset: { x: 0, y: 0.48 },
    spread: 5,
  },
  typing: {
    deleteSpeed: 30,
    deleteStyle: "backspace",
    enabled: false,
    gap: 0.6,
    hold: 1.8,
    humanize: 0.6,
    phrases: [
      "Create a surreal fashion campaign set in a blooming desert.",
      "Design a playful 3D mascot for a futuristic coffee brand.",
      "Generate a cinematic portrait lit by neon signs at night.",
      "Illustrate a cozy glass house hidden deep in the forest.",
      "Create a bold poster for an experimental music festival.",
      "Design a minimal perfume bottle inspired by ocean waves.",
    ],
    typeSpeed: 12,
  },
};

function numberValue(value: unknown, fallback: number, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function deleteStyleValue(
  value: unknown,
  fallback: FineDetailsPromptDeleteStyle,
): FineDetailsPromptDeleteStyle {
  return value === "backspace" || value === "instant" ? value : fallback;
}

function phraseValues(value: unknown, fallback: readonly string[]): readonly string[] {
  if (!Array.isArray(value)) return [...fallback];

  const phrases = value
    .filter((phrase): phrase is string => typeof phrase === "string")
    .slice(0, FINE_DETAILS_PROMPT_PHRASE_MAX_ITEMS)
    .map((phrase) => phrase.slice(0, FINE_DETAILS_PROMPT_PHRASE_MAX_LENGTH));

  return phrases.length > 0 ? phrases : [...fallback];
}

function vectorValue(value: unknown, fallback: Readonly<{ x: number; y: number }>) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fallback;
  }

  const vector = value as Record<string, unknown>;
  return {
    x: numberValue(vector.x, fallback.x, -1, 1),
    y: numberValue(vector.y, fallback.y, -1, 1),
  };
}

function colorOpacityValue(value: unknown, fallback: FineDetailsColorOpacity) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fallback;
  }

  const colorOpacity = value as Record<string, unknown>;
  return {
    hex:
      typeof colorOpacity.hex === "string" && /^#[0-9A-F]{6}$/.test(colorOpacity.hex)
        ? colorOpacity.hex
        : fallback.hex,
    opacity: numberValue(colorOpacity.opacity, fallback.opacity, 0, 100),
  };
}

export function createFineDetailsPromptFromValues(
  values: Readonly<Record<string, unknown>>,
): FineDetailsPromptSettings {
  return {
    position: vectorValue(
      values[fineDetailsPromptTargets.position],
      FINE_DETAILS_PROMPT_DEFAULTS.position,
    ),
    shadow: {
      blur: numberValue(
        values[fineDetailsPromptTargets.shadowBlur],
        FINE_DETAILS_PROMPT_DEFAULTS.shadow.blur,
        0,
        100,
      ),
      colorOpacity: colorOpacityValue(
        values[fineDetailsPromptTargets.shadowColorOpacity],
        FINE_DETAILS_PROMPT_DEFAULTS.shadow.colorOpacity,
      ),
      enabled: booleanValue(
        values[fineDetailsPromptTargets.shadowEnabled],
        FINE_DETAILS_PROMPT_DEFAULTS.shadow.enabled,
      ),
      offset: vectorValue(
        values[fineDetailsPromptTargets.shadowOffset],
        FINE_DETAILS_PROMPT_DEFAULTS.shadow.offset,
      ),
      spread: numberValue(
        values[fineDetailsPromptTargets.shadowSpread],
        FINE_DETAILS_PROMPT_DEFAULTS.shadow.spread,
        -32,
        32,
      ),
    },
    typing: {
      deleteSpeed: numberValue(
        values[fineDetailsPromptTargets.typingDeleteSpeed],
        FINE_DETAILS_PROMPT_DEFAULTS.typing.deleteSpeed,
        5,
        60,
      ),
      deleteStyle: deleteStyleValue(
        values[fineDetailsPromptTargets.typingDeleteStyle],
        FINE_DETAILS_PROMPT_DEFAULTS.typing.deleteStyle,
      ),
      enabled: booleanValue(
        values[fineDetailsPromptTargets.typingEnabled],
        FINE_DETAILS_PROMPT_DEFAULTS.typing.enabled,
      ),
      gap: numberValue(
        values[fineDetailsPromptTargets.typingGap],
        FINE_DETAILS_PROMPT_DEFAULTS.typing.gap,
        0,
        3,
      ),
      hold: numberValue(
        values[fineDetailsPromptTargets.typingHold],
        FINE_DETAILS_PROMPT_DEFAULTS.typing.hold,
        0.2,
        6,
      ),
      humanize: numberValue(
        values[fineDetailsPromptTargets.typingHumanize],
        FINE_DETAILS_PROMPT_DEFAULTS.typing.humanize,
        0,
        1,
      ),
      phrases: phraseValues(
        values[fineDetailsPromptTargets.typingPhrases],
        FINE_DETAILS_PROMPT_DEFAULTS.typing.phrases,
      ),
      typeSpeed: numberValue(
        values[fineDetailsPromptTargets.typingTypeSpeed],
        FINE_DETAILS_PROMPT_DEFAULTS.typing.typeSpeed,
        3,
        30,
      ),
    },
  };
}

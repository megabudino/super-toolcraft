export const fineDetailsPromptFlightTargets = {
  enabled: "prompt.flight.enabled",
  offsetX: "prompt.flight.offset.x",
  offsetY: "prompt.flight.offset.y",
  startDelay: "prompt.flight.startDelay",
  flightTime: "prompt.flight.flightTime",
  bounce: "prompt.flight.bounce",
  ghosts: "prompt.flight.ghosts",
  ghostSpacing: "prompt.flight.ghostSpacing",
  ghostOpacity: "prompt.flight.ghostOpacity",
  ghostFalloff: "prompt.flight.ghostFalloff",
  vanishStagger: "prompt.flight.vanishStagger",
  vanishTime: "prompt.flight.vanishTime",
} as const;

export type FineDetailsPromptFlightSettings = Readonly<{
  bounce: number;
  enabled: boolean;
  flightTime: number;
  ghostFalloff: number;
  ghostOpacity: number;
  ghostSpacing: number;
  ghosts: boolean;
  offset: Readonly<{ x: number; y: number }>;
  startDelay: number;
  vanishStagger: number;
  vanishTime: number;
}>;

export const FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS: FineDetailsPromptFlightSettings = {
  bounce: 12,
  enabled: true,
  flightTime: 550,
  ghostFalloff: 8,
  ghostOpacity: 55,
  ghostSpacing: 56,
  ghosts: true,
  offset: { x: 0, y: 0 },
  startDelay: 150,
  vanishStagger: 70,
  vanishTime: 260,
};

export const FINE_DETAILS_PROMPT_FLIGHT_LIMITS = {
  bounce: { maximum: 50, minimum: 0 },
  flightTime: { maximum: 2000, minimum: 150 },
  ghostFalloff: { maximum: 40, minimum: 0 },
  ghostOpacity: { maximum: 100, minimum: 5 },
  ghostSpacing: { maximum: 240, minimum: 16 },
  offset: { maximum: 120, minimum: -120 },
  startDelay: { maximum: 2000, minimum: 0 },
  vanishStagger: { maximum: 400, minimum: 0 },
  vanishTime: { maximum: 1200, minimum: 80 },
} as const;

function numberValue(
  value: unknown,
  fallback: number,
  limits: Readonly<{ maximum: number; minimum: number }>,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;

  return Math.min(limits.maximum, Math.max(limits.minimum, value));
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function createFineDetailsPromptFlightFromValues(
  values: Readonly<Record<string, unknown>>,
): FineDetailsPromptFlightSettings {
  return {
    bounce: numberValue(
      values[fineDetailsPromptFlightTargets.bounce],
      FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.bounce,
      FINE_DETAILS_PROMPT_FLIGHT_LIMITS.bounce,
    ),
    enabled: booleanValue(
      values[fineDetailsPromptFlightTargets.enabled],
      FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.enabled,
    ),
    flightTime: numberValue(
      values[fineDetailsPromptFlightTargets.flightTime],
      FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.flightTime,
      FINE_DETAILS_PROMPT_FLIGHT_LIMITS.flightTime,
    ),
    ghostFalloff: numberValue(
      values[fineDetailsPromptFlightTargets.ghostFalloff],
      FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.ghostFalloff,
      FINE_DETAILS_PROMPT_FLIGHT_LIMITS.ghostFalloff,
    ),
    ghostOpacity: numberValue(
      values[fineDetailsPromptFlightTargets.ghostOpacity],
      FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.ghostOpacity,
      FINE_DETAILS_PROMPT_FLIGHT_LIMITS.ghostOpacity,
    ),
    ghostSpacing: numberValue(
      values[fineDetailsPromptFlightTargets.ghostSpacing],
      FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.ghostSpacing,
      FINE_DETAILS_PROMPT_FLIGHT_LIMITS.ghostSpacing,
    ),
    ghosts: booleanValue(
      values[fineDetailsPromptFlightTargets.ghosts],
      FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.ghosts,
    ),
    offset: {
      x: numberValue(
        values[fineDetailsPromptFlightTargets.offsetX],
        FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.offset.x,
        FINE_DETAILS_PROMPT_FLIGHT_LIMITS.offset,
      ),
      y: numberValue(
        values[fineDetailsPromptFlightTargets.offsetY],
        FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.offset.y,
        FINE_DETAILS_PROMPT_FLIGHT_LIMITS.offset,
      ),
    },
    startDelay: numberValue(
      values[fineDetailsPromptFlightTargets.startDelay],
      FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.startDelay,
      FINE_DETAILS_PROMPT_FLIGHT_LIMITS.startDelay,
    ),
    vanishStagger: numberValue(
      values[fineDetailsPromptFlightTargets.vanishStagger],
      FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.vanishStagger,
      FINE_DETAILS_PROMPT_FLIGHT_LIMITS.vanishStagger,
    ),
    vanishTime: numberValue(
      values[fineDetailsPromptFlightTargets.vanishTime],
      FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.vanishTime,
      FINE_DETAILS_PROMPT_FLIGHT_LIMITS.vanishTime,
    ),
  };
}

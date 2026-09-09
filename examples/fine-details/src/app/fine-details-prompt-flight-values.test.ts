import { describe, expect, it } from "vitest";

import {
  createFineDetailsPromptFlightFromValues,
  FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS,
  FINE_DETAILS_PROMPT_FLIGHT_LIMITS,
  fineDetailsPromptFlightTargets,
} from "./fine-details-prompt-flight-values";

describe("Fine Details prompt flight values", () => {
  it("uses website-mirrored defaults and targets", () => {
    expect(Object.values(fineDetailsPromptFlightTargets)).toEqual([
      "prompt.flight.enabled",
      "prompt.flight.offset.x",
      "prompt.flight.offset.y",
      "prompt.flight.startDelay",
      "prompt.flight.flightTime",
      "prompt.flight.bounce",
      "prompt.flight.ghosts",
      "prompt.flight.ghostSpacing",
      "prompt.flight.ghostOpacity",
      "prompt.flight.ghostFalloff",
      "prompt.flight.vanishStagger",
      "prompt.flight.vanishTime",
    ]);
    expect(createFineDetailsPromptFlightFromValues({})).toEqual(
      FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS,
    );
    expect(FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.offset).toEqual({ x: 0, y: 0 });
    expect(FINE_DETAILS_PROMPT_FLIGHT_LIMITS).toEqual({
      bounce: { maximum: 50, minimum: 0 },
      flightTime: { maximum: 2000, minimum: 150 },
      ghostFalloff: { maximum: 40, minimum: 0 },
      ghostOpacity: { maximum: 100, minimum: 5 },
      ghostSpacing: { maximum: 240, minimum: 16 },
      offset: { maximum: 120, minimum: -120 },
      startDelay: { maximum: 2000, minimum: 0 },
      vanishStagger: { maximum: 400, minimum: 0 },
      vanishTime: { maximum: 1200, minimum: 80 },
    });
  });

  it("clamps every numeric field and keeps booleans strict", () => {
    expect(
      createFineDetailsPromptFlightFromValues({
        [fineDetailsPromptFlightTargets.bounce]: 90,
        [fineDetailsPromptFlightTargets.enabled]: false,
        [fineDetailsPromptFlightTargets.flightTime]: 40,
        [fineDetailsPromptFlightTargets.ghosts]: false,
        [fineDetailsPromptFlightTargets.ghostFalloff]: 90,
        [fineDetailsPromptFlightTargets.ghostOpacity]: 0,
        [fineDetailsPromptFlightTargets.ghostSpacing]: -20,
        [fineDetailsPromptFlightTargets.offsetX]: -500,
        [fineDetailsPromptFlightTargets.offsetY]: 300,
        [fineDetailsPromptFlightTargets.startDelay]: -100,
        [fineDetailsPromptFlightTargets.vanishStagger]: 900,
        [fineDetailsPromptFlightTargets.vanishTime]: 20,
      }),
    ).toEqual({
      bounce: 50,
      enabled: false,
      flightTime: 150,
      ghostFalloff: 40,
      ghostOpacity: 5,
      ghostSpacing: 16,
      ghosts: false,
      offset: { x: -120, y: 120 },
      startDelay: 0,
      vanishStagger: 400,
      vanishTime: 80,
    });
  });

  it("falls back field-by-field for non-finite values and non-boolean switches", () => {
    expect(
      createFineDetailsPromptFlightFromValues({
        [fineDetailsPromptFlightTargets.bounce]: Number.NaN,
        [fineDetailsPromptFlightTargets.enabled]: "yes",
        [fineDetailsPromptFlightTargets.flightTime]: Number.POSITIVE_INFINITY,
        [fineDetailsPromptFlightTargets.ghosts]: 1,
        [fineDetailsPromptFlightTargets.ghostFalloff]: undefined,
        [fineDetailsPromptFlightTargets.ghostOpacity]: null,
        [fineDetailsPromptFlightTargets.ghostSpacing]: 72,
        [fineDetailsPromptFlightTargets.offsetX]: Number.NaN,
        [fineDetailsPromptFlightTargets.offsetY]: -40,
        [fineDetailsPromptFlightTargets.startDelay]: Number.NaN,
        [fineDetailsPromptFlightTargets.vanishStagger]: 120,
        [fineDetailsPromptFlightTargets.vanishTime]: "slow",
      }),
    ).toEqual({
      ...FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS,
      ghostSpacing: 72,
      offset: {
        x: FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS.offset.x,
        y: -40,
      },
      vanishStagger: 120,
    });
  });

  it("ignores stale persisted targets and emits only protocol v17 breadcrumb fields", () => {
    const flight = createFineDetailsPromptFlightFromValues({
      "prompt.flight.position": { x: 1, y: -1 },
      "prompt.flight.ghostCount": 10,
      "prompt.flight.ghostStep": 80,
      "prompt.flight.ghostSettle": 1500,
    });

    expect(flight).toEqual(FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS);
    expect(flight).not.toHaveProperty("position");
    expect(flight).not.toHaveProperty("ghostCount");
    expect(flight).not.toHaveProperty("ghostStep");
    expect(flight).not.toHaveProperty("ghostSettle");
  });
});

import { describe, expect, it } from "vitest";

import {
  createFineDetailsPromptFromValues,
  FINE_DETAILS_PROMPT_DEFAULTS,
  FINE_DETAILS_PROMPT_PHRASE_MAX_LENGTH,
  fineDetailsPromptTargets,
} from "./fine-details-prompt-values";

describe("Fine Details prompt typing values", () => {
  it("publishes the shared prompt typing defaults", () => {
    expect(FINE_DETAILS_PROMPT_DEFAULTS.typing).toEqual({
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
    });
  });

  it("clamps finite timing values and falls back for NaN and non-numbers", () => {
    expect(
      createFineDetailsPromptFromValues({
        [fineDetailsPromptTargets.typingDeleteSpeed]: 120,
        [fineDetailsPromptTargets.typingGap]: -2,
        [fineDetailsPromptTargets.typingHold]: Number.NaN,
        [fineDetailsPromptTargets.typingHumanize]: 2,
        [fineDetailsPromptTargets.typingTypeSpeed]: "30",
      }).typing,
    ).toMatchObject({
      deleteSpeed: 60,
      gap: 0,
      hold: 1.8,
      humanize: 1,
      typeSpeed: 12,
    });
  });

  it("accepts only strict booleans and the declared delete-style union", () => {
    expect(
      createFineDetailsPromptFromValues({
        [fineDetailsPromptTargets.typingDeleteStyle]: "instant",
        [fineDetailsPromptTargets.typingEnabled]: true,
      }).typing,
    ).toMatchObject({ deleteStyle: "instant", enabled: true });

    expect(
      createFineDetailsPromptFromValues({
        [fineDetailsPromptTargets.typingDeleteStyle]: "erase",
        [fineDetailsPromptTargets.typingEnabled]: 1,
      }).typing,
    ).toMatchObject({ deleteStyle: "backspace", enabled: false });
  });

  it("filters nonstrings, preserves phrase order, caps length, and keeps at most eight", () => {
    const longPhrase = "x".repeat(FINE_DETAILS_PROMPT_PHRASE_MAX_LENGTH + 25);
    const phrases = createFineDetailsPromptFromValues({
      [fineDetailsPromptTargets.typingPhrases]: [
        "first",
        42,
        "second",
        null,
        longPhrase,
        "fourth",
        "fifth",
        "sixth",
        "seventh",
        "eighth",
        "ninth",
      ],
    }).typing.phrases;

    expect(phrases).toEqual([
      "first",
      "second",
      "x".repeat(FINE_DETAILS_PROMPT_PHRASE_MAX_LENGTH),
      "fourth",
      "fifth",
      "sixth",
      "seventh",
      "eighth",
    ]);
  });

  it("preserves leading and trailing phrase spaces", () => {
    expect(
      createFineDetailsPromptFromValues({
        [fineDetailsPromptTargets.typingPhrases]: ["  keep these spaces  "],
      }).typing.phrases,
    ).toEqual(["  keep these spaces  "]);
  });

  it("uses the default phrase when an input has no string items", () => {
    expect(
      createFineDetailsPromptFromValues({
        [fineDetailsPromptTargets.typingPhrases]: [1, null, false],
      }).typing.phrases,
    ).toEqual(FINE_DETAILS_PROMPT_DEFAULTS.typing.phrases);
    expect(
      createFineDetailsPromptFromValues({
        [fineDetailsPromptTargets.typingPhrases]: "not-an-array",
      }).typing.phrases,
    ).toEqual(FINE_DETAILS_PROMPT_DEFAULTS.typing.phrases);
  });

  it("copies default phrases for every invalid-input fallback", () => {
    const defaultsBefore = [...FINE_DETAILS_PROMPT_DEFAULTS.typing.phrases];
    const nonArrayFallback = createFineDetailsPromptFromValues({
      [fineDetailsPromptTargets.typingPhrases]: "not-an-array",
    }).typing.phrases;
    const noStringsFallback = createFineDetailsPromptFromValues({
      [fineDetailsPromptTargets.typingPhrases]: [1, null, false],
    }).typing.phrases;

    expect(nonArrayFallback).not.toBe(FINE_DETAILS_PROMPT_DEFAULTS.typing.phrases);
    expect(noStringsFallback).not.toBe(FINE_DETAILS_PROMPT_DEFAULTS.typing.phrases);
    expect(noStringsFallback).not.toBe(nonArrayFallback);

    (nonArrayFallback as string[]).push("payload-only mutation");
    expect(FINE_DETAILS_PROMPT_DEFAULTS.typing.phrases).toEqual(defaultsBefore);
  });
});

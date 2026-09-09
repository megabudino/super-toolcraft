import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  appControlSectionInventory,
  appTransferMode,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appSchema } from "./app-schema";
import { appPerformance } from "./app-performance";
import { fineDetailsCarouselTargets } from "./fine-details-carousel-values";
import {
  FINE_DETAILS_PROMPT_DEFAULTS,
  fineDetailsPromptTargets,
} from "./fine-details-prompt-values";
import { fineDetailsPreviewPipelineRegistration } from "./fine-details-preview-pipeline";
import {
  createFineDetailsPreviewSettingsFromValues,
  createFineDetailsPreviewSettingsMessage,
  FINE_DETAILS_PREVIEW_VERSION,
} from "./fine-details-preview-protocol";

const typingTargets = [
  fineDetailsPromptTargets.typingEnabled,
  fineDetailsPromptTargets.typingPhrases,
  fineDetailsPromptTargets.typingTypeSpeed,
  fineDetailsPromptTargets.typingDeleteSpeed,
  fineDetailsPromptTargets.typingHold,
  fineDetailsPromptTargets.typingGap,
  fineDetailsPromptTargets.typingHumanize,
  fineDetailsPromptTargets.typingDeleteStyle,
] as const;

describe("Fine Details prompt typing Toolcraft contract", () => {
  it("publishes one cohesive eight-control Prompt Typing section", () => {
    const section = appSchema.panels.controls?.sections.find(
      (candidate) => candidate.id === "fine-details-prompt-typing",
    );

    expect(section?.title).toBe("Prompt Typing");
    expect(Object.keys(section?.controls ?? {})).toEqual([
      "typingEnabled",
      "typingPhrases",
      "typingTypeSpeed",
      "typingDeleteSpeed",
      "typingHold",
      "typingGap",
      "typingHumanize",
      "typingDeleteStyle",
    ]);
    expect(Object.values(section?.controls ?? {})).toHaveLength(8);
    expect(
      Object.values(section?.controls ?? {}).every(
        (control) => Boolean(control.semanticGroup),
      ),
    ).toBe(true);

    expect(
      appControlSectionInventory.find(
        (entry) => entry.id === "fine-details-prompt-typing",
      ),
    ).toEqual({
      entity: "Fine Details prompt typing",
      entityId: "fine-details-prompt-typing",
      groupingReason:
        "The switch, ordered phrase collection, timing, humanization, and deletion mode define one idle prompt animation.",
      id: "fine-details-prompt-typing",
      targets: typingTargets,
      title: "Prompt Typing",
    });
  });

  it("uses built-ins with exact domains and phrase cardinality", () => {
    const controls = appSchema.panels.controls?.sections.find(
      (candidate) => candidate.id === "fine-details-prompt-typing",
    )?.controls;

    expect(controls?.typingEnabled).toMatchObject({
      defaultValue: false,
      label: "Typing animation",
      target: "prompt.typing.enabled",
      type: "switch",
    });
    expect(controls?.typingPhrases).toMatchObject({
      defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.typing.phrases,
      hardMaxItems: 8,
      itemControl: {
        commitMode: "content",
        label: false,
        textValueKind: "single-line",
        type: "text",
      },
      itemDefaultValue: "",
      itemLabel: "Phrase",
      label: "Phrases",
      minItems: 1,
      target: "prompt.typing.phrases",
      type: "collectionActions",
    });
    expect(controls?.typingTypeSpeed).toMatchObject({
      defaultValue: 12,
      label: "Type speed",
      max: 30,
      min: 3,
      sliderValueKind: "continuous",
      target: "prompt.typing.typeSpeed",
      type: "slider",
      unit: "chars/s",
    });
    expect(controls?.typingDeleteSpeed).toMatchObject({
      defaultValue: 30,
      label: "Delete speed",
      max: 60,
      min: 5,
      sliderValueKind: "continuous",
      target: "prompt.typing.deleteSpeed",
      type: "slider",
      unit: "chars/s",
    });
    expect(controls?.typingHold).toMatchObject({
      defaultValue: 1.8,
      label: "Hold",
      max: 6,
      min: 0.2,
      target: "prompt.typing.hold",
      unit: "s",
    });
    expect(controls?.typingGap).toMatchObject({
      defaultValue: 0.6,
      label: "Gap",
      max: 3,
      min: 0,
      target: "prompt.typing.gap",
      unit: "s",
    });
    expect(controls?.typingHumanize).toMatchObject({
      defaultValue: 0.6,
      label: "Humanize",
      max: 1,
      min: 0,
      target: "prompt.typing.humanize",
    });
    expect(controls?.typingDeleteStyle).toMatchObject({
      defaultValue: "backspace",
      label: "Delete style",
      options: [
        { label: "Backspace", value: "backspace" },
        { label: "Instant", value: "instant" },
      ],
      target: "prompt.typing.deleteStyle",
      type: "segmented",
    });
  });

  it("shows the switch only in Trail and gates every dependent control", () => {
    const controls = appSchema.panels.controls?.sections.find(
      (candidate) => candidate.id === "fine-details-prompt-typing",
    )?.controls;
    const trailPredicate = {
      equals: "trail",
      target: fineDetailsCarouselTargets.imagesMode,
    };
    const enabledPredicate = {
      equals: true,
      target: fineDetailsPromptTargets.typingEnabled,
    };

    expect(controls?.typingEnabled.applicability).toEqual({
      all: [trailPredicate],
      mode: "conditional",
      origin: "explicit",
    });

    for (const target of typingTargets.slice(1)) {
      const control = Object.values(controls ?? {}).find(
        (candidate) => candidate.target === target,
      );
      expect(control?.applicability).toMatchObject({
        all: expect.arrayContaining([trailPredicate, enabledPredicate]),
        mode: "conditional",
        origin: "explicit",
      });
    }

    expect(controls?.typingDeleteSpeed.applicability).toMatchObject({
      all: expect.arrayContaining([
        {
          equals: "backspace",
          target: fineDetailsPromptTargets.typingDeleteStyle,
        },
      ]),
    });
  });

  it("declares autonomous idle animation without timeline transport", () => {
    expect(appTransferMode.animationIntent).toEqual({
      behaviorCoverage: [
        "no-duration-control",
        "no-export-at-time",
        "no-loop-control",
        "no-play-pause",
        "no-scrub",
        "no-user-facing-transport",
      ],
      mode: "autonomous",
      reason:
        "Trail prompt typing is an idle decorative website animation; Toolcraft authors configuration without playback, scrubbing, duration, loop, or export-at-time controls.",
    });
    expect(appSchema.panels.timeline).toBeUndefined();
  });

  it("covers every typing control and collection part in product acceptance", () => {
    expect(
      typingTargets.map((target) => {
        const entry = appAcceptance.find(
          (candidate) => candidate.target === target,
        );
        return [target, entry?.componentType, entry?.evidence];
      }),
    ).toEqual([
      [typingTargets[0], "switch", "product-output"],
      [typingTargets[1], "collectionActions", "product-output"],
      [typingTargets[2], "slider", "product-output"],
      [typingTargets[3], "slider", "product-output"],
      [typingTargets[4], "slider", "product-output"],
      [typingTargets[5], "slider", "product-output"],
      [typingTargets[6], "slider", "product-output"],
      [typingTargets[7], "segmented", "product-output"],
    ]);
    expect(
      appAcceptance.find(
        (entry) => entry.target === fineDetailsPromptTargets.typingPhrases,
      )?.controlPartCoverage,
    ).toEqual([
      "collectionActions.add",
      "collectionActions.items",
      "collectionActions.remove",
    ]);
    expect(
      validateProductAcceptanceCoverage().filter(
        (error) =>
          error.includes("Prompt Typing") ||
          typingTargets.some((target) => error.includes(target)),
      ),
    ).toEqual([]);
  });

  it("covers every typing target in settings-sync invalidation and performance", () => {
    const controlChange =
      fineDetailsPreviewPipelineRegistration.interactionInvalidation.find(
        (entry) => entry.interaction === "control-change",
      );
    const previewPass = fineDetailsPreviewPipelineRegistration.passes.find(
      (pass) => pass.id === "preview-sync",
    );
    const performanceScenario = appPerformance.scenarios.find(
      (scenario) => scenario.interaction === "control-change",
    );

    expect(fineDetailsPreviewPipelineRegistration.runtimeId).toBe(
      "fine-details-external-preview-v17",
    );
    for (const target of typingTargets) {
      expect(controlChange?.targets).toContain(target);
      expect(previewPass?.inputs).toContain(target);
      expect(previewPass?.invalidatedBy).toContain(target);
      expect(performanceScenario?.coversTargets).toContain(target);
    }
  });

  it("publishes nondefault ordered typing values in a protocol v17 message", () => {
    const settings = createFineDetailsPreviewSettingsFromValues(
      {
        [fineDetailsPromptTargets.typingDeleteSpeed]: 54,
        [fineDetailsPromptTargets.typingDeleteStyle]: "instant",
        [fineDetailsPromptTargets.typingEnabled]: true,
        [fineDetailsPromptTargets.typingGap]: 1.2,
        [fineDetailsPromptTargets.typingHold]: 2.4,
        [fineDetailsPromptTargets.typingHumanize]: 0.25,
        [fineDetailsPromptTargets.typingPhrases]: ["Third", "First", "Second"],
        [fineDetailsPromptTargets.typingTypeSpeed]: 18,
      },
      1080,
    );

    expect(FINE_DETAILS_PREVIEW_VERSION).toBe(17);
    expect(settings.prompt.typing).toEqual({
      deleteSpeed: 54,
      deleteStyle: "instant",
      enabled: true,
      gap: 1.2,
      hold: 2.4,
      humanize: 0.25,
      phrases: ["Third", "First", "Second"],
      typeSpeed: 18,
    });
    expect(createFineDetailsPreviewSettingsMessage(settings)).toMatchObject({
      payload: { prompt: { typing: settings.prompt.typing } },
      type: "settings",
      version: 17,
    });
  });
});

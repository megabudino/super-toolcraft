import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  appControlSectionInventory,
} from "./app-acceptance-data";
import { validateProductAcceptanceCoverage } from "./app-acceptance";
import { appSchema } from "./app-schema";
import { heroEffectsControlSections } from "./hero-effects-control-sections";
import {
  createHeroEffectsSettingsFromValues,
  HERO_EFFECTS_DEFAULTS,
  heroEffectsTargets,
} from "./hero-effects-values";
import { heroGalleryTargets } from "./hero-gallery-values";
import {
  HERO_PREVIEW_CONTROL_CHANGE_TARGETS,
  HERO_PREVIEW_CONTROL_DRAG_TARGETS,
} from "./hero-preview-pipeline";
import { HERO_PREVIEW_PROTOCOL_VERSION } from "./hero-preview-protocol";

describe("hero motion effects Toolcraft declarations", () => {
  it("maps panel percentages to normalized settings and clamps invalid ranges", () => {
    expect(createHeroEffectsSettingsFromValues({})).toEqual(
      HERO_EFFECTS_DEFAULTS,
    );
    expect(
      createHeroEffectsSettingsFromValues({
        [heroEffectsTargets.crtChroma]: 99,
        [heroEffectsTargets.crtEnabled]: true,
        [heroEffectsTargets.crtFade]: 9,
        [heroEffectsTargets.crtFlicker]: -10,
        [heroEffectsTargets.crtPitch]: 30,
        [heroEffectsTargets.crtScanlines]: 82,
        [heroEffectsTargets.grainAmount]: 72,
        [heroEffectsTargets.grainEnabled]: true,
        [heroEffectsTargets.grainSize]: 0,
      }),
    ).toEqual({
      crt: {
        chroma: 8,
        enabled: true,
        fade: 3,
        flicker: 0,
        pitch: 16,
        scanlines: 0.82,
      },
      grain: { amount: 0.72, enabled: true, size: 1 },
    });
    expect(
      createHeroEffectsSettingsFromValues({
        [heroEffectsTargets.crtFade]: -1,
      }).crt.fade,
    ).toBe(0.05);
  });

  it("declares sphere-only sections with parameters gated by their switches", () => {
    const grain = heroEffectsControlSections.find(
      (section) => section.id === "motion-grain",
    );
    const crt = heroEffectsControlSections.find(
      (section) => section.id === "motion-crt",
    );

    expect(Object.keys(grain?.controls ?? {})).toEqual([
      "enabled",
      "amount",
      "size",
    ]);
    expect(Object.keys(crt?.controls ?? {})).toEqual([
      "enabled",
      "scanlines",
      "pitch",
      "chroma",
      "flicker",
      "fade",
    ]);
    expect(grain?.controls.enabled.applicability).toEqual({
      all: [{ equals: "sphere", target: heroGalleryTargets.type }],
      mode: "conditional",
    });
    expect(grain?.controls.amount?.applicability).toEqual({
      all: [
        { equals: "sphere", target: heroGalleryTargets.type },
        { equals: true, target: heroEffectsTargets.grainEnabled },
      ],
      mode: "conditional",
    });
    expect(crt?.controls.chroma?.applicability).toEqual({
      all: [
        { equals: "sphere", target: heroGalleryTargets.type },
        { equals: true, target: heroEffectsTargets.crtEnabled },
      ],
      mode: "conditional",
    });
    expect(crt?.controls.fade).toMatchObject({
      defaultValue: 0.6,
      description:
        "Controls how many seconds CRT remains visible while fading after scroll stops.",
      label: "Fade out",
      max: 3,
      min: 0.05,
      semanticGroup: "crt",
      step: 0.05,
      target: heroEffectsTargets.crtFade,
      type: "slider",
      unit: "s",
    });
    expect(
      Object.values(crt?.controls ?? {}).map(
        (control) => control.semanticGroup,
      ),
    ).toEqual(Array(6).fill("crt"));
  });

  it("registers both effect entities and routes them through preview v23", () => {
    const schemaIds =
      appSchema.panels.controls?.sections.map((section) => section.id) ?? [];
    const dispersionIndex = schemaIds.indexOf("aura-gate");

    expect(schemaIds.slice(dispersionIndex + 1, dispersionIndex + 3)).toEqual([
      "motion-grain",
      "motion-crt",
    ]);
    expect(
      appControlSectionInventory.find((entry) => entry.id === "motion-grain")
        ?.targets,
    ).toEqual([
      heroEffectsTargets.grainEnabled,
      heroEffectsTargets.grainAmount,
      heroEffectsTargets.grainSize,
    ]);
    expect(
      appControlSectionInventory.find((entry) => entry.id === "motion-crt")
        ?.targets,
    ).toEqual([
      heroEffectsTargets.crtEnabled,
      heroEffectsTargets.crtScanlines,
      heroEffectsTargets.crtPitch,
      heroEffectsTargets.crtChroma,
      heroEffectsTargets.crtFlicker,
      heroEffectsTargets.crtFade,
    ]);
    expect(HERO_PREVIEW_CONTROL_CHANGE_TARGETS).toEqual(
      expect.arrayContaining([
        heroEffectsTargets.grainEnabled,
        heroEffectsTargets.crtEnabled,
      ]),
    );
    expect(HERO_PREVIEW_CONTROL_DRAG_TARGETS).toEqual(
      expect.arrayContaining([
        heroEffectsTargets.grainAmount,
        heroEffectsTargets.grainSize,
        heroEffectsTargets.crtScanlines,
        heroEffectsTargets.crtPitch,
        heroEffectsTargets.crtChroma,
        heroEffectsTargets.crtFlicker,
        heroEffectsTargets.crtFade,
      ]),
    );
    expect(HERO_PREVIEW_PROTOCOL_VERSION).toBe(23);
  });

  it("documents observable CRT fade timing and persistence coverage", () => {
    expect(
      appAcceptance.find((entry) => entry.id === heroEffectsTargets.crtFade),
    ).toMatchObject({
      expectedObservable:
        "After drag stops, CRT fades over the chosen duration: 0.05 seconds clears almost immediately, while 3 seconds leaves a long visible tail.",
      target: heroEffectsTargets.crtFade,
    });
    expect(
      appAcceptance.find((entry) => entry.id === "persistence.reload")
        ?.userAction,
    ).toContain("edit Fade out");
  });

  it("does not claim unsupported interaction ownership for built-in effect controls", () => {
    const effectTargets = Object.values(heroEffectsTargets);
    const effectOwnershipDiagnostics =
      validateProductAcceptanceCoverage().filter((diagnostic) =>
        effectTargets.some(
          (target) =>
            diagnostic.includes(target) &&
            diagnostic.includes("interactionId") &&
            diagnostic.includes("interactionOwnership"),
        ),
      );

    expect(effectOwnershipDiagnostics).toEqual([]);
  });
});

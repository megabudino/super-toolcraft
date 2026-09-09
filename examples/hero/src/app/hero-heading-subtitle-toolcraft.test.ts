import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  appControlSectionInventory,
} from "./app-acceptance-data";
import { appSchema } from "./app-schema";
import {
  HERO_HEADING_SUBTITLE_DEFAULTS,
  heroHeadingSubtitleTargets,
} from "./hero-heading-subtitle-values";
import {
  HERO_PREVIEW_CONTROL_CHANGE_TARGETS,
  HERO_PREVIEW_CONTROL_DRAG_TARGETS,
} from "./hero-preview-pipeline";
import {
  createHeroPreviewSettingsFromValues,
  HERO_PREVIEW_PROTOCOL_VERSION,
} from "./hero-preview-protocol";

const subtitleTargets = Object.values(heroHeadingSubtitleTargets);
const shadowDetailTargets = [
  heroHeadingSubtitleTargets.shadowOffset,
  heroHeadingSubtitleTargets.shadowBlur,
  heroHeadingSubtitleTargets.shadowSpread,
  heroHeadingSubtitleTargets.shadowColorOpacity,
] as const;

function findControl(target: string) {
  return appSchema.panels.controls?.sections
    .flatMap((section) => Object.values(section.controls))
    .find((control) => control.target === target);
}

describe("hero heading subtitle Toolcraft contract", () => {
  it("uses the approved subtitle placement and shadow as canonical defaults", () => {
    expect(HERO_HEADING_SUBTITLE_DEFAULTS).toEqual({
      fontSize: 28,
      gap: 0,
      shadow: {
        blur: 12,
        colorOpacity: { hex: "#000000", opacity: 40 },
        enabled: true,
        offset: { x: 0, y: 0.125 },
        spread: 1,
      },
    });
  });

  it("maps every subtitle value into the protocol v23 preview payload", () => {
    const settings = createHeroPreviewSettingsFromValues({
      [heroHeadingSubtitleTargets.fontSize]: 40,
      [heroHeadingSubtitleTargets.gap]: 40,
      [heroHeadingSubtitleTargets.shadowBlur]: 18,
      [heroHeadingSubtitleTargets.shadowColorOpacity]: {
        hex: "#123456",
        opacity: 60,
      },
      [heroHeadingSubtitleTargets.shadowEnabled]: true,
      [heroHeadingSubtitleTargets.shadowOffset]: { x: -0.25, y: 0.5 },
      [heroHeadingSubtitleTargets.shadowSpread]: 4,
    });

    expect(HERO_PREVIEW_PROTOCOL_VERSION).toBe(23);
    expect(settings.heading.subtitle).toEqual({
      fontSize: 40,
      gap: 40,
      shadow: {
        blur: 18,
        colorOpacity: { hex: "#123456", opacity: 60 },
        enabled: true,
        offset: { x: -0.25, y: 0.5 },
        spread: 4,
      },
    });
  });

  it("declares one focused subtitle stage on the shared heading entity", () => {
    expect(
      appControlSectionInventory.find(
        (section) => section.id === "heading-subtitle",
      ),
    ).toMatchObject({
      entityId: "hero-heading-group",
      targets: subtitleTargets,
      title: "Hero Subtitle",
      workflowStage: "subtitle",
    });
  });

  it("uses built-in controls and hides shadow details until enabled", () => {
    expect(findControl(heroHeadingSubtitleTargets.fontSize)).toMatchObject({
      max: 64,
      min: 10,
      sliderValueKind: "continuous",
      type: "slider",
      unit: "px",
    });
    expect(findControl(heroHeadingSubtitleTargets.gap)).toMatchObject({
      sliderValueKind: "continuous",
      type: "slider",
      unit: "px",
    });
    expect(findControl(heroHeadingSubtitleTargets.shadowEnabled)?.type).toBe(
      "switch",
    );
    expect(findControl(heroHeadingSubtitleTargets.shadowOffset)?.type).toBe(
      "vector",
    );
    expect(findControl(heroHeadingSubtitleTargets.shadowBlur)?.type).toBe(
      "slider",
    );
    expect(findControl(heroHeadingSubtitleTargets.shadowSpread)?.type).toBe(
      "slider",
    );
    expect(
      findControl(heroHeadingSubtitleTargets.shadowColorOpacity)?.type,
    ).toBe("colorOpacity");

    for (const target of shadowDetailTargets) {
      expect(findControl(target)?.applicability).toMatchObject({
        all: [
          { equals: true, target: heroHeadingSubtitleTargets.shadowEnabled },
        ],
        mode: "conditional",
      });
    }
  });

  it("registers every subtitle target in acceptance and preview invalidation", () => {
    const pipelineTargets = [
      ...HERO_PREVIEW_CONTROL_CHANGE_TARGETS,
      ...HERO_PREVIEW_CONTROL_DRAG_TARGETS,
    ];

    for (const target of subtitleTargets) {
      expect(appAcceptance.some((entry) => entry.id === target)).toBe(true);
      expect(findControl(target)).toBeDefined();
      expect(pipelineTargets).toContain(target);
    }
  });
});

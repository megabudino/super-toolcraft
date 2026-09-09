import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  appControlSectionInventory,
} from "./app-acceptance-data";
import { appSchema } from "./app-schema";
import {
  HERO_HEADING_CTA_DEFAULTS,
  heroHeadingCtaTargets,
} from "./hero-heading-cta-values";
import { HERO_HEADING_DEFAULTS } from "./hero-heading-values";
import {
  HERO_PREVIEW_CONTROL_CHANGE_TARGETS,
  HERO_PREVIEW_CONTROL_DRAG_TARGETS,
} from "./hero-preview-pipeline";
import {
  createHeroPreviewSettingsFromValues,
  HERO_PREVIEW_PROTOCOL_VERSION,
} from "./hero-preview-protocol";

const buttonTargets = [
  heroHeadingCtaTargets.text,
  heroHeadingCtaTargets.fontSize,
  heroHeadingCtaTargets.horizontalPadding,
  heroHeadingCtaTargets.verticalPadding,
  heroHeadingCtaTargets.textColor,
  heroHeadingCtaTargets.backgroundColor,
  heroHeadingCtaTargets.gap,
] as const;

const shadowTargets = [
  heroHeadingCtaTargets.shadowEnabled,
  heroHeadingCtaTargets.shadowOffset,
  heroHeadingCtaTargets.shadowBlur,
  heroHeadingCtaTargets.shadowSpread,
  heroHeadingCtaTargets.shadowColorOpacity,
] as const;

function findControl(target: string) {
  return appSchema.panels.controls?.sections
    .flatMap((section) => Object.values(section.controls))
    .find((control) => control.target === target);
}

describe("hero heading CTA Toolcraft contract", () => {
  it("uses the website-applied button values as canonical defaults", () => {
    expect(HERO_HEADING_CTA_DEFAULTS).toEqual({
      backgroundColor: "#E6E6E6",
      fontSize: 22,
      gap: 39,
      horizontalPadding: 32,
      shadow: {
        blur: 16,
        colorOpacity: { hex: "#000000", opacity: 20 },
        enabled: true,
        offset: { x: 0, y: 0.2 },
        spread: 8,
      },
      text: "See How it Works",
      textColor: "#000000",
      verticalPadding: 20,
    });
  });

  it("keeps every heading-group distance aligned with the approved settings", () => {
    expect({
      badgeGap: HERO_HEADING_DEFAULTS.badgeGap,
      ctaGap: HERO_HEADING_DEFAULTS.cta.gap,
      lineGap: HERO_HEADING_DEFAULTS.lineGap,
      subtitleGap: HERO_HEADING_DEFAULTS.subtitle.gap,
    }).toEqual({
      badgeGap: 28,
      ctaGap: 39,
      lineGap: -24,
      subtitleGap: 0,
    });
  });

  it("maps all CTA values into a protocol v23 preview payload", () => {
    const settings = createHeroPreviewSettingsFromValues({
      [heroHeadingCtaTargets.backgroundColor]: "#112233",
      [heroHeadingCtaTargets.fontSize]: 27,
      [heroHeadingCtaTargets.gap]: 48,
      [heroHeadingCtaTargets.horizontalPadding]: 36,
      [heroHeadingCtaTargets.shadowBlur]: 18,
      [heroHeadingCtaTargets.shadowColorOpacity]: {
        hex: "#445566",
        opacity: 72,
      },
      [heroHeadingCtaTargets.shadowEnabled]: true,
      [heroHeadingCtaTargets.shadowOffset]: { x: -0.5, y: 0.25 },
      [heroHeadingCtaTargets.shadowSpread]: 6,
      [heroHeadingCtaTargets.text]: "Open Recraft",
      [heroHeadingCtaTargets.textColor]: "#F0F0F0",
      [heroHeadingCtaTargets.verticalPadding]: 22,
    });

    expect(HERO_PREVIEW_PROTOCOL_VERSION).toBe(23);
    expect(settings.heading.cta).toEqual({
      backgroundColor: "#112233",
      fontSize: 27,
      gap: 48,
      horizontalPadding: 36,
      shadow: {
        blur: 18,
        colorOpacity: { hex: "#445566", opacity: 72 },
        enabled: true,
        offset: { x: -0.5, y: 0.25 },
        spread: 6,
      },
      text: "Open Recraft",
      textColor: "#F0F0F0",
      verticalPadding: 22,
    });
  });

  it("declares balanced CTA sections on the shared heading entity", () => {
    const buttonSection = appControlSectionInventory.find(
      (section) => section.id === "heading-cta",
    );
    const shadowSection = appControlSectionInventory.find(
      (section) => section.id === "heading-cta-shadow",
    );

    expect(buttonSection).toMatchObject({
      entityId: "hero-heading-group",
      targets: buttonTargets,
      title: "CTA Button",
      workflowStage: "cta",
    });
    expect(shadowSection).toMatchObject({
      entityId: "hero-heading-group",
      targets: shadowTargets,
      title: "CTA Shadow",
      workflowStage: "cta-shadow",
    });
  });

  it("uses built-in controls and hides shadow details until enabled", () => {
    expect(findControl(heroHeadingCtaTargets.text)).toMatchObject({
      commitMode: "content",
      textValueKind: "single-line",
      type: "text",
    });
    expect(findControl(heroHeadingCtaTargets.fontSize)?.type).toBe("slider");
    expect(findControl(heroHeadingCtaTargets.horizontalPadding)?.type).toBe(
      "slider",
    );
    expect(findControl(heroHeadingCtaTargets.verticalPadding)?.type).toBe(
      "slider",
    );
    expect(findControl(heroHeadingCtaTargets.textColor)?.type).toBe("color");
    expect(findControl(heroHeadingCtaTargets.backgroundColor)?.type).toBe(
      "color",
    );
    expect(findControl(heroHeadingCtaTargets.gap)?.type).toBe("slider");
    expect(findControl(heroHeadingCtaTargets.shadowEnabled)?.type).toBe(
      "switch",
    );

    for (const target of shadowTargets.slice(1)) {
      expect(findControl(target)?.applicability).toMatchObject({
        all: [{ equals: true, target: heroHeadingCtaTargets.shadowEnabled }],
        mode: "conditional",
      });
    }
  });

  it("registers every CTA target in acceptance and preview invalidation", () => {
    const pipelineTargets = [
      ...HERO_PREVIEW_CONTROL_CHANGE_TARGETS,
      ...HERO_PREVIEW_CONTROL_DRAG_TARGETS,
    ];

    for (const target of [...buttonTargets, ...shadowTargets]) {
      expect(appAcceptance.some((entry) => entry.id === target)).toBe(true);
      expect(findControl(target)).toBeDefined();
      expect(pipelineTargets).toContain(target);
    }
  });
});

import { describe, expect, it } from "vitest";

import { appAcceptance } from "./app-acceptance-data";
import { appSchema } from "./app-schema";
import { heroBackgroundPatternTargets } from "./hero-background-pattern-values";
import { heroDispersionTargets } from "./hero-dispersion-values";
import { heroEffectsPreviewCases } from "./hero-effects-preview-cases";
import { heroGalleryTargets } from "./hero-gallery-values";
import { heroHeadingTargets } from "./hero-heading-values";
import {
  HERO_PREVIEW_CONTROL_CHANGE_TARGETS,
  HERO_PREVIEW_CONTROL_DRAG_TARGETS,
} from "./hero-preview-pipeline";
import {
  createHeroPreviewSettingsFromValues,
  HERO_PREVIEW_DEFAULTS,
  HERO_PREVIEW_PROTOCOL_VERSION,
} from "./hero-preview-protocol";
import {
  type HeroPreviewCase,
  heroVisualPreviewCases,
} from "./hero-visual-preview-cases";

const previewCases: readonly HeroPreviewCase[] = [
  {
    acceptanceId: "background.enabled",
    read: (settings) => settings.backgroundEnabled,
    target: "export.includeBackground",
    value: false,
  },
  {
    acceptanceId: "background.color",
    read: (settings) => settings.background,
    target: "appearance.background",
    value: "#AA00FF",
  },
  {
    acceptanceId: heroBackgroundPatternTargets.enabled,
    read: (settings) => settings.pattern.enabled,
    target: heroBackgroundPatternTargets.enabled,
    value: false,
  },
  {
    acceptanceId: heroBackgroundPatternTargets.colorOpacity,
    read: (settings) => settings.pattern.colorOpacity,
    target: heroBackgroundPatternTargets.colorOpacity,
    value: { hex: "#FFCC00", opacity: 64 },
  },
  {
    acceptanceId: heroBackgroundPatternTargets.squareSize,
    read: (settings) => settings.pattern.squareSize,
    target: heroBackgroundPatternTargets.squareSize,
    value: 72,
  },
  {
    acceptanceId: "scene.perspective",
    read: (settings) => settings.perspective,
    target: "scene.perspective",
    value: 800,
  },
  {
    acceptanceId: heroHeadingTargets.recraftSize,
    read: (settings) => settings.heading.recraftSize,
    target: heroHeadingTargets.recraftSize,
    value: 132,
  },
  {
    acceptanceId: heroHeadingTargets.color,
    read: (settings) => settings.heading.color,
    target: heroHeadingTargets.color,
    value: "#FF22AA",
  },
  {
    acceptanceId: heroHeadingTargets.stylesSize,
    read: (settings) => settings.heading.stylesSize,
    target: heroHeadingTargets.stylesSize,
    value: 64,
  },
  {
    acceptanceId: heroHeadingTargets.lineGap,
    read: (settings) => settings.heading.lineGap,
    target: heroHeadingTargets.lineGap,
    value: 28,
  },
  {
    acceptanceId: heroHeadingTargets.badgeVisible,
    read: (settings) => settings.heading.badgeVisible,
    target: heroHeadingTargets.badgeVisible,
    value: false,
  },
  ...heroVisualPreviewCases,
  {
    acceptanceId: heroHeadingTargets.position,
    read: (settings) => settings.heading.position,
    target: heroHeadingTargets.position,
    value: { x: 0.5, y: -0.4 },
  },
  {
    acceptanceId: "cards.gap",
    read: (settings) => settings.gallery.cardGap,
    target: "cards.gap",
    value: -80,
  },
  {
    acceptanceId: "cards.roll",
    read: (settings) => settings.gallery.rows.roll,
    target: "cards.roll",
    value: 72,
  },
  {
    acceptanceId: "cards.safetyWidth",
    read: (settings) => settings.gallery.rows.safetyWidth,
    target: "cards.safetyWidth",
    value: 1040,
  },
  {
    acceptanceId: heroGalleryTargets.cardHeight,
    read: (settings) => settings.gallery.cardHeight,
    target: heroGalleryTargets.cardHeight,
    value: 420,
  },
  {
    acceptanceId: heroGalleryTargets.type,
    read: (settings) => settings.gallery.type,
    target: heroGalleryTargets.type,
    value: "rows",
  },
  {
    acceptanceId: heroGalleryTargets.sphereRows,
    read: (settings) => settings.gallery.sphere.rows,
    target: heroGalleryTargets.sphereRows,
    value: [
      { height: 420, offset: 30, speed: -6 },
      { height: 200, offset: 0, speed: 3 },
    ],
  },
  {
    acceptanceId: heroGalleryTargets.sphereDepth,
    read: (settings) => settings.gallery.sphere.depth,
    target: heroGalleryTargets.sphereDepth,
    value: 1400,
  },
  {
    acceptanceId: heroGalleryTargets.sphereBendX,
    read: (settings) => settings.gallery.sphere.bendX,
    target: heroGalleryTargets.sphereBendX,
    value: -40,
  },
  {
    acceptanceId: heroGalleryTargets.sphereBendY,
    read: (settings) => settings.gallery.sphere.bendY,
    target: heroGalleryTargets.sphereBendY,
    value: 25,
  },
  {
    acceptanceId: heroGalleryTargets.rowGap,
    read: (settings) => settings.gallery.sphere.rowGap,
    target: heroGalleryTargets.rowGap,
    value: 80,
  },
  {
    acceptanceId: heroGalleryTargets.sphereWidth,
    read: (settings) => settings.gallery.sphere.width,
    target: heroGalleryTargets.sphereWidth,
    value: 1800,
  },
  {
    acceptanceId: heroGalleryTargets.sphereHeight,
    read: (settings) => settings.gallery.sphere.height,
    target: heroGalleryTargets.sphereHeight,
    value: 500,
  },
  {
    acceptanceId: heroGalleryTargets.autoScrollEnabled,
    read: (settings) => settings.gallery.sphere.autoScroll.enabled,
    target: heroGalleryTargets.autoScrollEnabled,
    value: false,
  },
  {
    acceptanceId: heroGalleryTargets.autoScrollInterval,
    read: (settings) => settings.gallery.sphere.autoScroll.interval,
    target: heroGalleryTargets.autoScrollInterval,
    value: 1,
  },
  {
    acceptanceId: heroGalleryTargets.autoScrollDuration,
    read: (settings) => settings.gallery.sphere.autoScroll.duration,
    target: heroGalleryTargets.autoScrollDuration,
    value: 0.6,
  },
  {
    acceptanceId: heroGalleryTargets.pan,
    read: (settings) => settings.gallery.sphere.pan,
    target: heroGalleryTargets.pan,
    value: { x: 0.25, y: -0.5 },
  },
  {
    acceptanceId: heroGalleryTargets.position,
    read: (settings) => settings.gallery.position,
    target: heroGalleryTargets.position,
    value: { x: 0.5, y: -0.4 },
  },
  {
    acceptanceId: heroDispersionTargets.edgeWidth,
    read: (settings) => settings.dispersion.edgeWidth,
    target: heroDispersionTargets.edgeWidth,
    value: 42,
  },
  {
    acceptanceId: heroDispersionTargets.curve,
    read: (settings) => settings.dispersion.curve,
    target: heroDispersionTargets.curve,
    value: 2.2,
  },
  {
    acceptanceId: heroDispersionTargets.edgeFade,
    read: (settings) => settings.dispersion.edgeFade,
    target: heroDispersionTargets.edgeFade,
    value: 0.8,
  },
  {
    acceptanceId: heroDispersionTargets.turbulence,
    read: (settings) => settings.dispersion.turbulence,
    target: heroDispersionTargets.turbulence,
    value: 0.2,
  },
  {
    acceptanceId: heroDispersionTargets.turbulenceScale,
    read: (settings) => settings.dispersion.turbulenceScale,
    target: heroDispersionTargets.turbulenceScale,
    value: 220,
  },
  {
    acceptanceId: heroDispersionTargets.warp,
    read: (settings) => settings.dispersion.warp,
    target: heroDispersionTargets.warp,
    value: 72,
  },
  {
    acceptanceId: heroDispersionTargets.warpStyle,
    read: (settings) => settings.dispersion.warpStyle,
    target: heroDispersionTargets.warpStyle,
    value: "stretch",
  },
  {
    acceptanceId: heroDispersionTargets.warpOffset,
    read: (settings) => settings.dispersion.warpOffset,
    target: heroDispersionTargets.warpOffset,
    value: 18,
  },
  {
    acceptanceId: heroDispersionTargets.warpWaveEnabled,
    read: (settings) => settings.dispersion.warpWaveEnabled,
    target: heroDispersionTargets.warpWaveEnabled,
    value: true,
  },
  {
    acceptanceId: heroDispersionTargets.warpWaveKind,
    read: (settings) => settings.dispersion.warpWaveKind,
    target: heroDispersionTargets.warpWaveKind,
    value: "ripple",
  },
  {
    acceptanceId: heroDispersionTargets.warpWave,
    read: (settings) => settings.dispersion.warpWave,
    target: heroDispersionTargets.warpWave,
    value: 36,
  },
  {
    acceptanceId: heroDispersionTargets.warpWaveLength,
    read: (settings) => settings.dispersion.warpWaveLength,
    target: heroDispersionTargets.warpWaveLength,
    value: 260,
  },
  {
    acceptanceId: heroDispersionTargets.warpWaveBlur,
    read: (settings) => settings.dispersion.warpWaveBlur,
    target: heroDispersionTargets.warpWaveBlur,
    value: 14,
  },
  {
    acceptanceId: heroDispersionTargets.warpFace,
    read: (settings) => settings.dispersion.warpFace,
    target: heroDispersionTargets.warpFace,
    value: 92,
  },
  {
    acceptanceId: heroDispersionTargets.warpSharpness,
    read: (settings) => settings.dispersion.warpSharpness,
    target: heroDispersionTargets.warpSharpness,
    value: 3.2,
  },
  {
    acceptanceId: heroDispersionTargets.amount,
    read: (settings) => settings.dispersion.amount,
    target: heroDispersionTargets.amount,
    value: 150,
  },
  {
    acceptanceId: heroDispersionTargets.count,
    read: (settings) => settings.dispersion.count,
    target: heroDispersionTargets.count,
    value: 44,
  },
  {
    acceptanceId: heroDispersionTargets.spectrum,
    read: (settings) => settings.dispersion.spectrum,
    target: heroDispersionTargets.spectrum,
    value: 0.25,
  },
  {
    acceptanceId: heroDispersionTargets.hue,
    read: (settings) => settings.dispersion.hue,
    target: heroDispersionTargets.hue,
    value: 180,
  },
  {
    acceptanceId: heroDispersionTargets.blur,
    read: (settings) => settings.dispersion.blur,
    target: heroDispersionTargets.blur,
    value: 40,
  },
  {
    acceptanceId: heroDispersionTargets.aura,
    read: (settings) => settings.dispersion.aura,
    target: heroDispersionTargets.aura,
    value: 0.9,
  },
  {
    acceptanceId: heroDispersionTargets.velocity,
    read: (settings) => settings.dispersion.velocity,
    target: heroDispersionTargets.velocity,
    value: 0.85,
  },
  {
    acceptanceId: heroDispersionTargets.gateOffset,
    read: (settings) => settings.dispersion.gateOffset,
    target: heroDispersionTargets.gateOffset,
    value: 32,
  },
  {
    acceptanceId: heroDispersionTargets.gateWidth,
    read: (settings) => settings.dispersion.gateWidth,
    target: heroDispersionTargets.gateWidth,
    value: 180,
  },
  {
    acceptanceId: heroDispersionTargets.gateGlow,
    read: (settings) => settings.dispersion.gateGlow,
    target: heroDispersionTargets.gateGlow,
    value: 0.95,
  },
  {
    acceptanceId: heroDispersionTargets.gateRefraction,
    read: (settings) => settings.dispersion.gateRefraction,
    target: heroDispersionTargets.gateRefraction,
    value: 48,
  },
  ...heroEffectsPreviewCases,
];

function findControl(target: string) {
  return appSchema.panels.controls?.sections
    .flatMap((section) => Object.values(section.controls))
    .find((control) => control.target === target);
}

describe("external hero preview mapping", () => {
  it("does not expose an Apply action", () => {
    expect(findControl("website.settings")?.actions?.some(action => typeof action !== "string" && action.value === "website.apply")).toBe(false);
  });

  it("maps signed Bend X and Bend Y percentages into protocol fractions", () => {
    const settings = createHeroPreviewSettingsFromValues({
      [heroGalleryTargets.sphereBendX]: -40,
      [heroGalleryTargets.sphereBendY]: 25,
    });

    expect(settings.gallery.sphere.bendX).toBe(-0.4);
    expect(settings.gallery.sphere.bendY).toBe(0.25);
    expect(HERO_PREVIEW_PROTOCOL_VERSION).toBe(23);
  });

  it("maps representative first and last row image collections into sphere rows", () => {
    const firstRowImage = {
      height: 800,
      id: "row-1-image",
      ref: "media://row-1-image",
      transform: {
        flipHorizontal: false,
        flipVertical: false,
        rotationDeg: 0 as const,
      },
      width: 600,
    };
    const lastRowImage = {
      ...firstRowImage,
      id: "row-6-image",
      ref: "media://row-6-image",
    };
    const settings = createHeroPreviewSettingsFromValues(
      {
        [heroGalleryTargets.sphereRows]: Array.from(
          { length: 6 },
          () => ({ offset: 0, speed: 3 }),
        ),
      },
      [],
      [[firstRowImage], [], [], [], [], [lastRowImage]],
    );

    expect(findControl(heroGalleryTargets.rowImages0)).toBeDefined();
    expect(findControl(heroGalleryTargets.rowImages5)).toBeDefined();
    expect(settings.gallery.sphere.rows[0]?.images).toEqual([firstRowImage]);
    expect(settings.gallery.sphere.rows[5]?.images).toEqual([lastRowImage]);
  });

  for (const previewCase of previewCases) {
    const acceptance = appAcceptance.find(
      (entry) => entry.id === previewCase.acceptanceId,
    );

    if (!acceptance) {
      throw new Error(`Missing acceptance row ${previewCase.acceptanceId}.`);
    }

    it(acceptance.automatedTestName, () => {
      const control = findControl(previewCase.target);
      const defaultSettings = createHeroPreviewSettingsFromValues({});
      const changedSettings = createHeroPreviewSettingsFromValues({
        [previewCase.target]: previewCase.value,
      });
      const pipelineTargets = [
        ...HERO_PREVIEW_CONTROL_CHANGE_TARGETS,
        ...HERO_PREVIEW_CONTROL_DRAG_TARGETS,
      ];

      expect(control).toBeDefined();
      expect(previewCase.read(changedSettings)).not.toEqual(
        previewCase.read(defaultSettings),
      );
      expect(pipelineTargets).toContain(previewCase.target);
    });
  }

  const websiteSettingsAcceptance = appAcceptance.find(
    (entry) => entry.id === "website.settings",
  );

  if (!websiteSettingsAcceptance) {
    throw new Error("Missing acceptance row website.settings.");
  }

  it(websiteSettingsAcceptance.automatedTestName, () => {
    const control = findControl("website.settings");
    expect(control?.type).toBe("panelActions");
    expect(control?.actions).toEqual([
      { label: "Reset", value: "website.reset", variant: "outline" },
    ]);
  });
});

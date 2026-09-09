import {
  createHeroShadowSettingsFromValues,
  type HeroShadowSettings,
} from "./hero-shadow-values";
import { HERO_WEBSITE_DEFAULTS } from "./hero-website-defaults";

export const heroHeadingSubtitleTargets = {
  fontSize: "heading.subtitle.fontSize",
  gap: "heading.subtitle.gap",
  shadowEnabled: "heading.subtitle.shadow.enabled",
  shadowOffset: "heading.subtitle.shadow.offset",
  shadowBlur: "heading.subtitle.shadow.blur",
  shadowSpread: "heading.subtitle.shadow.spread",
  shadowColorOpacity: "heading.subtitle.shadow.colorOpacity",
} as const;

export type HeroHeadingSubtitleSettings = Readonly<{
  fontSize: number;
  gap: number;
  shadow: HeroShadowSettings;
}>;

export const HERO_HEADING_SUBTITLE_DEFAULTS: HeroHeadingSubtitleSettings =
  HERO_WEBSITE_DEFAULTS.heading.subtitle;

function clampNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

export function createHeroHeadingSubtitleSettingsFromValues(
  values: Readonly<Record<string, unknown>>,
): HeroHeadingSubtitleSettings {
  return {
    fontSize: clampNumber(
      values[heroHeadingSubtitleTargets.fontSize],
      10,
      64,
      HERO_HEADING_SUBTITLE_DEFAULTS.fontSize,
    ),
    gap: clampNumber(
      values[heroHeadingSubtitleTargets.gap],
      0,
      160,
      HERO_HEADING_SUBTITLE_DEFAULTS.gap,
    ),
    shadow: createHeroShadowSettingsFromValues(
      values,
      {
        blur: heroHeadingSubtitleTargets.shadowBlur,
        colorOpacity: heroHeadingSubtitleTargets.shadowColorOpacity,
        enabled: heroHeadingSubtitleTargets.shadowEnabled,
        offset: heroHeadingSubtitleTargets.shadowOffset,
        spread: heroHeadingSubtitleTargets.shadowSpread,
      },
      HERO_HEADING_SUBTITLE_DEFAULTS.shadow,
    ),
  };
}

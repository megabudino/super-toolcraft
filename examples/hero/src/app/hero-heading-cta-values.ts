import {
  createHeroShadowSettingsFromValues,
  type HeroShadowSettings,
} from "./hero-shadow-values";
import { HERO_WEBSITE_DEFAULTS } from "./hero-website-defaults";

export const heroHeadingCtaTargets = {
  backgroundColor: "heading.cta.backgroundColor",
  fontSize: "heading.cta.fontSize",
  gap: "heading.cta.gap",
  horizontalPadding: "heading.cta.horizontalPadding",
  shadowBlur: "heading.cta.shadow.blur",
  shadowColorOpacity: "heading.cta.shadow.colorOpacity",
  shadowEnabled: "heading.cta.shadow.enabled",
  shadowOffset: "heading.cta.shadow.offset",
  shadowSpread: "heading.cta.shadow.spread",
  text: "heading.cta.text",
  textColor: "heading.cta.textColor",
  verticalPadding: "heading.cta.verticalPadding",
} as const;

export type HeroHeadingCtaSettings = Readonly<{
  backgroundColor: string;
  fontSize: number;
  gap: number;
  horizontalPadding: number;
  shadow: HeroShadowSettings;
  text: string;
  textColor: string;
  verticalPadding: number;
}>;

export const HERO_HEADING_CTA_DEFAULTS: HeroHeadingCtaSettings =
  HERO_WEBSITE_DEFAULTS.heading.cta;

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

function colorValue(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9A-F]{6}$/.test(value)
    ? value
    : fallback;
}

function textValue(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/\s+/g, " ").trim().slice(0, 80);
  return normalized.length > 0 ? normalized : fallback;
}

export function createHeroHeadingCtaSettingsFromValues(
  values: Readonly<Record<string, unknown>>,
): HeroHeadingCtaSettings {
  return {
    backgroundColor: colorValue(
      values[heroHeadingCtaTargets.backgroundColor],
      HERO_HEADING_CTA_DEFAULTS.backgroundColor,
    ),
    fontSize: clampNumber(
      values[heroHeadingCtaTargets.fontSize],
      10,
      64,
      HERO_HEADING_CTA_DEFAULTS.fontSize,
    ),
    gap: clampNumber(
      values[heroHeadingCtaTargets.gap],
      0,
      160,
      HERO_HEADING_CTA_DEFAULTS.gap,
    ),
    horizontalPadding: clampNumber(
      values[heroHeadingCtaTargets.horizontalPadding],
      0,
      120,
      HERO_HEADING_CTA_DEFAULTS.horizontalPadding,
    ),
    shadow: createHeroShadowSettingsFromValues(
      values,
      {
        blur: heroHeadingCtaTargets.shadowBlur,
        colorOpacity: heroHeadingCtaTargets.shadowColorOpacity,
        enabled: heroHeadingCtaTargets.shadowEnabled,
        offset: heroHeadingCtaTargets.shadowOffset,
        spread: heroHeadingCtaTargets.shadowSpread,
      },
      HERO_HEADING_CTA_DEFAULTS.shadow,
    ),
    text: textValue(
      values[heroHeadingCtaTargets.text],
      HERO_HEADING_CTA_DEFAULTS.text,
    ),
    textColor: colorValue(
      values[heroHeadingCtaTargets.textColor],
      HERO_HEADING_CTA_DEFAULTS.textColor,
    ),
    verticalPadding: clampNumber(
      values[heroHeadingCtaTargets.verticalPadding],
      0,
      80,
      HERO_HEADING_CTA_DEFAULTS.verticalPadding,
    ),
  };
}

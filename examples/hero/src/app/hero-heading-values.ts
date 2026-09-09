import type { HeroShadowSettings } from "./hero-shadow-values";
import type { HeroHeadingCtaSettings } from "./hero-heading-cta-values";
import type { HeroHeadingSubtitleSettings } from "./hero-heading-subtitle-values";
import { HERO_WEBSITE_DEFAULTS } from "./hero-website-defaults";

export const heroHeadingTargets = {
  badgeColor: "heading.badgeColor",
  badgeGap: "heading.badgeGap",
  badgeScale: "heading.badgeScale",
  badgeShadowBlur: "heading.badgeShadow.blur",
  badgeShadowColorOpacity: "heading.badgeShadow.colorOpacity",
  badgeShadowEnabled: "heading.badgeShadow.enabled",
  badgeShadowOffset: "heading.badgeShadow.offset",
  badgeShadowSpread: "heading.badgeShadow.spread",
  badgeVisible: "heading.badgeVisible",
  color: "heading.color",
  lineGap: "heading.lineGap",
  position: "heading.position",
  recraftSize: "heading.recraftSize",
  shadowBlur: "heading.shadow.blur",
  shadowColorOpacity: "heading.shadow.colorOpacity",
  shadowEnabled: "heading.shadow.enabled",
  shadowOffset: "heading.shadow.offset",
  shadowSpread: "heading.shadow.spread",
  stylesSize: "heading.stylesSize",
} as const;

export type HeroHeadingSettings = Readonly<{
  badgeColor: string;
  badgeGap: number;
  badgeScale: number;
  badgeShadow: HeroShadowSettings;
  badgeVisible: boolean;
  color: string;
  cta: HeroHeadingCtaSettings;
  lineGap: number;
  position: Readonly<{
    x: number;
    y: number;
  }>;
  recraftSize: number;
  shadow: HeroShadowSettings;
  stylesSize: number;
  subtitle: HeroHeadingSubtitleSettings;
}>;

export const HERO_HEADING_DEFAULTS: HeroHeadingSettings =
  HERO_WEBSITE_DEFAULTS.heading;

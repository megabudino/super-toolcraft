import { heroGalleryTargets } from "./hero-gallery-values";
import { heroHeadingTargets } from "./hero-heading-values";
import { heroHeadingCtaTargets } from "./hero-heading-cta-values";
import { heroHeadingSubtitleTargets } from "./hero-heading-subtitle-values";
import type { HeroPreviewSettings } from "./hero-preview-protocol";

export type HeroPreviewCase = Readonly<{
  acceptanceId: string;
  read: (settings: HeroPreviewSettings) => unknown;
  target: string;
  value: unknown;
}>;

export const heroVisualPreviewCases: readonly HeroPreviewCase[] = [
  {
    acceptanceId: heroHeadingSubtitleTargets.fontSize,
    read: (settings) => settings.heading.subtitle.fontSize,
    target: heroHeadingSubtitleTargets.fontSize,
    value: 40,
  },
  {
    acceptanceId: heroHeadingSubtitleTargets.gap,
    read: (settings) => settings.heading.subtitle.gap,
    target: heroHeadingSubtitleTargets.gap,
    value: 48,
  },
  {
    acceptanceId: heroHeadingSubtitleTargets.shadowEnabled,
    read: (settings) => settings.heading.subtitle.shadow.enabled,
    target: heroHeadingSubtitleTargets.shadowEnabled,
    value: false,
  },
  {
    acceptanceId: heroHeadingSubtitleTargets.shadowOffset,
    read: (settings) => settings.heading.subtitle.shadow.offset,
    target: heroHeadingSubtitleTargets.shadowOffset,
    value: { x: -0.5, y: 0.25 },
  },
  {
    acceptanceId: heroHeadingSubtitleTargets.shadowBlur,
    read: (settings) => settings.heading.subtitle.shadow.blur,
    target: heroHeadingSubtitleTargets.shadowBlur,
    value: 36,
  },
  {
    acceptanceId: heroHeadingSubtitleTargets.shadowSpread,
    read: (settings) => settings.heading.subtitle.shadow.spread,
    target: heroHeadingSubtitleTargets.shadowSpread,
    value: 8,
  },
  {
    acceptanceId: heroHeadingSubtitleTargets.shadowColorOpacity,
    read: (settings) => settings.heading.subtitle.shadow.colorOpacity,
    target: heroHeadingSubtitleTargets.shadowColorOpacity,
    value: { hex: "#112233", opacity: 64 },
  },
  {
    acceptanceId: heroHeadingCtaTargets.text,
    read: (settings) => settings.heading.cta.text,
    target: heroHeadingCtaTargets.text,
    value: "Open Recraft",
  },
  {
    acceptanceId: heroHeadingCtaTargets.fontSize,
    read: (settings) => settings.heading.cta.fontSize,
    target: heroHeadingCtaTargets.fontSize,
    value: 28,
  },
  {
    acceptanceId: heroHeadingCtaTargets.horizontalPadding,
    read: (settings) => settings.heading.cta.horizontalPadding,
    target: heroHeadingCtaTargets.horizontalPadding,
    value: 42,
  },
  {
    acceptanceId: heroHeadingCtaTargets.verticalPadding,
    read: (settings) => settings.heading.cta.verticalPadding,
    target: heroHeadingCtaTargets.verticalPadding,
    value: 24,
  },
  {
    acceptanceId: heroHeadingCtaTargets.textColor,
    read: (settings) => settings.heading.cta.textColor,
    target: heroHeadingCtaTargets.textColor,
    value: "#FF00AA",
  },
  {
    acceptanceId: heroHeadingCtaTargets.backgroundColor,
    read: (settings) => settings.heading.cta.backgroundColor,
    target: heroHeadingCtaTargets.backgroundColor,
    value: "#102030",
  },
  {
    acceptanceId: heroHeadingCtaTargets.gap,
    read: (settings) => settings.heading.cta.gap,
    target: heroHeadingCtaTargets.gap,
    value: 48,
  },
  {
    acceptanceId: heroHeadingCtaTargets.shadowEnabled,
    read: (settings) => settings.heading.cta.shadow.enabled,
    target: heroHeadingCtaTargets.shadowEnabled,
    value: false,
  },
  {
    acceptanceId: heroHeadingCtaTargets.shadowOffset,
    read: (settings) => settings.heading.cta.shadow.offset,
    target: heroHeadingCtaTargets.shadowOffset,
    value: { x: -0.5, y: 0.25 },
  },
  {
    acceptanceId: heroHeadingCtaTargets.shadowBlur,
    read: (settings) => settings.heading.cta.shadow.blur,
    target: heroHeadingCtaTargets.shadowBlur,
    value: 36,
  },
  {
    acceptanceId: heroHeadingCtaTargets.shadowSpread,
    read: (settings) => settings.heading.cta.shadow.spread,
    target: heroHeadingCtaTargets.shadowSpread,
    value: 12,
  },
  {
    acceptanceId: heroHeadingCtaTargets.shadowColorOpacity,
    read: (settings) => settings.heading.cta.shadow.colorOpacity,
    target: heroHeadingCtaTargets.shadowColorOpacity,
    value: { hex: "#112233", opacity: 64 },
  },
  {
    acceptanceId: heroHeadingTargets.badgeColor,
    read: (settings) => settings.heading.badgeColor,
    target: heroHeadingTargets.badgeColor,
    value: "#FF00AA",
  },
  {
    acceptanceId: heroHeadingTargets.badgeScale,
    read: (settings) => settings.heading.badgeScale,
    target: heroHeadingTargets.badgeScale,
    value: 160,
  },
  {
    acceptanceId: heroHeadingTargets.badgeGap,
    read: (settings) => settings.heading.badgeGap,
    target: heroHeadingTargets.badgeGap,
    value: 32,
  },
  {
    acceptanceId: heroHeadingTargets.badgeShadowEnabled,
    read: (settings) => settings.heading.badgeShadow.enabled,
    target: heroHeadingTargets.badgeShadowEnabled,
    value: false,
  },
  {
    acceptanceId: heroHeadingTargets.badgeShadowOffset,
    read: (settings) => settings.heading.badgeShadow.offset,
    target: heroHeadingTargets.badgeShadowOffset,
    value: { x: -0.5, y: 0.25 },
  },
  {
    acceptanceId: heroHeadingTargets.badgeShadowBlur,
    read: (settings) => settings.heading.badgeShadow.blur,
    target: heroHeadingTargets.badgeShadowBlur,
    value: 28,
  },
  {
    acceptanceId: heroHeadingTargets.badgeShadowSpread,
    read: (settings) => settings.heading.badgeShadow.spread,
    target: heroHeadingTargets.badgeShadowSpread,
    value: 6,
  },
  {
    acceptanceId: heroHeadingTargets.badgeShadowColorOpacity,
    read: (settings) => settings.heading.badgeShadow.colorOpacity,
    target: heroHeadingTargets.badgeShadowColorOpacity,
    value: { hex: "#112233", opacity: 60 },
  },
  {
    acceptanceId: heroHeadingTargets.shadowEnabled,
    read: (settings) => settings.heading.shadow.enabled,
    target: heroHeadingTargets.shadowEnabled,
    value: false,
  },
  {
    acceptanceId: heroHeadingTargets.shadowOffset,
    read: (settings) => settings.heading.shadow.offset,
    target: heroHeadingTargets.shadowOffset,
    value: { x: -0.5, y: 0.25 },
  },
  {
    acceptanceId: heroHeadingTargets.shadowBlur,
    read: (settings) => settings.heading.shadow.blur,
    target: heroHeadingTargets.shadowBlur,
    value: 24,
  },
  {
    acceptanceId: heroHeadingTargets.shadowSpread,
    read: (settings) => settings.heading.shadow.spread,
    target: heroHeadingTargets.shadowSpread,
    value: 8,
  },
  {
    acceptanceId: heroHeadingTargets.shadowColorOpacity,
    read: (settings) => settings.heading.shadow.colorOpacity,
    target: heroHeadingTargets.shadowColorOpacity,
    value: { hex: "#102030", opacity: 55 },
  },
  {
    acceptanceId: heroGalleryTargets.cardRadius,
    read: (settings) => settings.gallery.cardRadius,
    target: heroGalleryTargets.cardRadius,
    value: 48,
  },
];

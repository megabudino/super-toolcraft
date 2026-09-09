import { HERO_WEBSITE_DEFAULTS } from "./hero-website-defaults";

export const heroBackgroundPatternTargets = {
  colorOpacity: "background.pattern.colorOpacity",
  enabled: "background.pattern.enabled",
  squareSize: "background.pattern.squareSize",
} as const;

export type HeroBackgroundPatternSettings = Readonly<{
  colorOpacity: Readonly<{
    hex: string;
    opacity: number;
  }>;
  enabled: boolean;
  squareSize: number;
}>;

export const HERO_BACKGROUND_PATTERN_DEFAULTS: HeroBackgroundPatternSettings =
  HERO_WEBSITE_DEFAULTS.pattern;

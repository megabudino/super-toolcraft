import { HERO_WEBSITE_DEFAULTS } from "./hero-website-defaults";

export const heroEffectsTargets = {
  crtChroma: "effects.crt.chroma",
  crtEnabled: "effects.crt.enabled",
  crtFade: "effects.crt.fade",
  crtFlicker: "effects.crt.flicker",
  crtPitch: "effects.crt.pitch",
  crtScanlines: "effects.crt.scanlines",
  grainAmount: "effects.grain.amount",
  grainEnabled: "effects.grain.enabled",
  grainSize: "effects.grain.size",
} as const;

export type HeroEffectsSettings = Readonly<{
  crt: Readonly<{
    chroma: number;
    enabled: boolean;
    fade: number;
    flicker: number;
    pitch: number;
    scanlines: number;
  }>;
  grain: Readonly<{
    amount: number;
    enabled: boolean;
    size: number;
  }>;
}>;

export const HERO_EFFECTS_DEFAULTS: HeroEffectsSettings =
  HERO_WEBSITE_DEFAULTS.effects;

export const HERO_EFFECTS_CONTROL_DEFAULTS = {
  crt: {
    ...HERO_EFFECTS_DEFAULTS.crt,
    flicker: HERO_EFFECTS_DEFAULTS.crt.flicker * 100,
    scanlines: HERO_EFFECTS_DEFAULTS.crt.scanlines * 100,
  },
  grain: {
    ...HERO_EFFECTS_DEFAULTS.grain,
    amount: HERO_EFFECTS_DEFAULTS.grain.amount * 100,
  },
} as const;

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readNumber(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

export function createHeroEffectsSettingsFromValues(
  values: Readonly<Record<string, unknown>>,
): HeroEffectsSettings {
  const target = heroEffectsTargets;
  const defaults = HERO_EFFECTS_CONTROL_DEFAULTS;

  return {
    crt: {
      chroma: readNumber(values[target.crtChroma], defaults.crt.chroma, 0, 8),
      enabled: readBoolean(values[target.crtEnabled], defaults.crt.enabled),
      fade: readNumber(values[target.crtFade], defaults.crt.fade, 0.05, 3),
      flicker:
        readNumber(values[target.crtFlicker], defaults.crt.flicker, 0, 100) /
        100,
      pitch: readNumber(values[target.crtPitch], defaults.crt.pitch, 2, 16),
      scanlines:
        readNumber(
          values[target.crtScanlines],
          defaults.crt.scanlines,
          0,
          100,
        ) / 100,
    },
    grain: {
      amount:
        readNumber(values[target.grainAmount], defaults.grain.amount, 0, 100) /
        100,
      enabled: readBoolean(values[target.grainEnabled], defaults.grain.enabled),
      size: readNumber(values[target.grainSize], defaults.grain.size, 1, 8),
    },
  };
}

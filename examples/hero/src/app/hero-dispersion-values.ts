import { HERO_WEBSITE_DEFAULTS } from "./hero-website-defaults";

export const heroDispersionTargets = {
  amount: "dispersion.amount",
  aura: "dispersion.aura",
  blur: "dispersion.blur",
  count: "dispersion.count",
  curve: "edgeZone.curve",
  edgeFade: "edgeZone.fade",
  edgeWidth: "edgeZone.width",
  gateGlow: "auraGate.glow",
  gateOffset: "auraGate.offset",
  gateRefraction: "auraGate.refraction",
  gateWidth: "auraGate.width",
  hue: "dispersion.hue",
  spectrum: "dispersion.spectrum",
  turbulence: "edgeZone.turbulence",
  turbulenceScale: "edgeZone.turbulenceScale",
  velocity: "dispersion.velocity",
  warp: "edgeZone.warp",
  warpFace: "edgeZone.warpFace",
  warpOffset: "edgeZone.warpOffset",
  warpSharpness: "edgeZone.warpSharpness",
  warpStyle: "edgeZone.warpStyle",
  warpWave: "edgeZone.warpWave",
  warpWaveBlur: "edgeZone.warpWaveBlur",
  warpWaveEnabled: "edgeZone.warpWaveEnabled",
  warpWaveKind: "edgeZone.warpWaveKind",
  warpWaveLength: "edgeZone.warpWaveLength",
} as const;

export type HeroDispersionWarpStyle = "prism" | "stretch";
export type HeroDispersionWaveKind = "glass" | "ripple";

export type HeroDispersionSettings = Readonly<{
  amount: number;
  aura: number;
  blur: number;
  count: number;
  curve: number;
  edgeFade: number;
  edgeWidth: number;
  gateGlow: number;
  gateOffset: number;
  gateRefraction: number;
  gateWidth: number;
  hue: number;
  spectrum: number;
  turbulence: number;
  turbulenceScale: number;
  velocity: number;
  warp: number;
  warpFace: number;
  warpOffset: number;
  warpSharpness: number;
  warpStyle: HeroDispersionWarpStyle;
  warpWave: number;
  warpWaveBlur: number;
  warpWaveEnabled: boolean;
  warpWaveKind: HeroDispersionWaveKind;
  warpWaveLength: number;
}>;

export const HERO_DISPERSION_DEFAULTS: HeroDispersionSettings =
  HERO_WEBSITE_DEFAULTS.dispersion;

function readNumber(
  values: Readonly<Record<string, unknown>>,
  target: string,
  fallback: number,
): number {
  const value = values[target];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

export function createHeroDispersionSettingsFromValues(
  values: Readonly<Record<string, unknown>>,
): HeroDispersionSettings {
  const target = heroDispersionTargets;
  const defaults = HERO_DISPERSION_DEFAULTS;
  const warpStyle = values[target.warpStyle];

  return {
    amount: readNumber(values, target.amount, defaults.amount),
    aura: readNumber(values, target.aura, defaults.aura),
    blur: readNumber(values, target.blur, defaults.blur),
    count: readNumber(values, target.count, defaults.count),
    curve: readNumber(values, target.curve, defaults.curve),
    edgeFade: readNumber(values, target.edgeFade, defaults.edgeFade),
    edgeWidth: readNumber(values, target.edgeWidth, defaults.edgeWidth),
    gateGlow: readNumber(values, target.gateGlow, defaults.gateGlow),
    gateOffset: readNumber(values, target.gateOffset, defaults.gateOffset),
    gateRefraction: readNumber(
      values,
      target.gateRefraction,
      defaults.gateRefraction,
    ),
    gateWidth: readNumber(values, target.gateWidth, defaults.gateWidth),
    hue: readNumber(values, target.hue, defaults.hue),
    spectrum: readNumber(values, target.spectrum, defaults.spectrum),
    turbulence: readNumber(
      values,
      target.turbulence,
      defaults.turbulence,
    ),
    turbulenceScale: readNumber(
      values,
      target.turbulenceScale,
      defaults.turbulenceScale,
    ),
    velocity: readNumber(values, target.velocity, defaults.velocity),
    warp: readNumber(values, target.warp, defaults.warp),
    warpFace: readNumber(values, target.warpFace, defaults.warpFace),
    warpOffset: readNumber(values, target.warpOffset, defaults.warpOffset),
    warpSharpness: readNumber(
      values,
      target.warpSharpness,
      defaults.warpSharpness,
    ),
    warpStyle:
      warpStyle === "prism" || warpStyle === "stretch"
        ? warpStyle
        : defaults.warpStyle,
    warpWave: readNumber(values, target.warpWave, defaults.warpWave),
    warpWaveBlur: readNumber(
      values,
      target.warpWaveBlur,
      defaults.warpWaveBlur,
    ),
    warpWaveEnabled: values[target.warpWaveEnabled] === true,
    warpWaveKind:
      values[target.warpWaveKind] === "ripple" ? "ripple" : "glass",
    warpWaveLength: readNumber(
      values,
      target.warpWaveLength,
      defaults.warpWaveLength,
    ),
  };
}

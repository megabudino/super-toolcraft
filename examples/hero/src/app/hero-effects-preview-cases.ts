import type { HeroPreviewCase } from "./hero-visual-preview-cases";
import { heroEffectsTargets } from "./hero-effects-values";

export const heroEffectsPreviewCases: readonly HeroPreviewCase[] = [
  {
    acceptanceId: heroEffectsTargets.grainEnabled,
    read: (settings) => settings.effects.grain.enabled,
    target: heroEffectsTargets.grainEnabled,
    value: false,
  },
  {
    acceptanceId: heroEffectsTargets.grainAmount,
    read: (settings) => settings.effects.grain.amount,
    target: heroEffectsTargets.grainAmount,
    value: 72,
  },
  {
    acceptanceId: heroEffectsTargets.grainSize,
    read: (settings) => settings.effects.grain.size,
    target: heroEffectsTargets.grainSize,
    value: 5,
  },
  {
    acceptanceId: heroEffectsTargets.crtEnabled,
    read: (settings) => settings.effects.crt.enabled,
    target: heroEffectsTargets.crtEnabled,
    value: false,
  },
  {
    acceptanceId: heroEffectsTargets.crtScanlines,
    read: (settings) => settings.effects.crt.scanlines,
    target: heroEffectsTargets.crtScanlines,
    value: 80,
  },
  {
    acceptanceId: heroEffectsTargets.crtPitch,
    read: (settings) => settings.effects.crt.pitch,
    target: heroEffectsTargets.crtPitch,
    value: 9,
  },
  {
    acceptanceId: heroEffectsTargets.crtChroma,
    read: (settings) => settings.effects.crt.chroma,
    target: heroEffectsTargets.crtChroma,
    value: 4,
  },
  {
    acceptanceId: heroEffectsTargets.crtFlicker,
    read: (settings) => settings.effects.crt.flicker,
    target: heroEffectsTargets.crtFlicker,
    value: 65,
  },
  {
    acceptanceId: heroEffectsTargets.crtFade,
    read: (settings) => settings.effects.crt.fade,
    target: heroEffectsTargets.crtFade,
    value: 2.4,
  },
];

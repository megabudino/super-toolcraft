export const HERO_MOTION_EFFECTS_ATTACK_SECONDS = 0.12;
export const HERO_MOTION_EFFECTS_DECAY_SECONDS = 0.25;
export const HERO_MOTION_EFFECTS_ENVELOPE_V0 = 0.025;
export const HERO_MOTION_EFFECTS_ENVELOPE_V1 = 0.75;
export const HERO_MOTION_EFFECTS_EPSILON = 0.001;

export interface HeroMotionEffectsRate {
  phi: number;
  theta: number;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep01(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

export function getHeroMotionEffectsEnvelopeTarget(
  panRate: Readonly<HeroMotionEffectsRate>,
  reducedMotion: boolean,
) {
  if (reducedMotion) return 0;
  const magnitude = Math.hypot(panRate.theta, panRate.phi);
  const normalized =
    (magnitude - HERO_MOTION_EFFECTS_ENVELOPE_V0) /
    (HERO_MOTION_EFFECTS_ENVELOPE_V1 - HERO_MOTION_EFFECTS_ENVELOPE_V0);
  return smoothstep01(normalized);
}

export function stepHeroMotionEffectsEnvelope(
  current: number,
  panRate: Readonly<HeroMotionEffectsRate>,
  frameDt: number,
  reducedMotion: boolean,
  decaySeconds: number,
) {
  if (reducedMotion) return 0;
  const target = getHeroMotionEffectsEnvelopeTarget(panRate, false);
  const safeCurrent = clamp01(Number.isFinite(current) ? current : 0);
  const safeFrameDt = Math.max(0, Math.min(0.05, Number.isFinite(frameDt) ? frameDt : 0));
  const safeDecaySeconds =
    Number.isFinite(decaySeconds) && decaySeconds > 0
      ? decaySeconds
      : HERO_MOTION_EFFECTS_DECAY_SECONDS;
  const timeConstant = target > safeCurrent ? HERO_MOTION_EFFECTS_ATTACK_SECONDS : safeDecaySeconds;
  const blend = 1 - Math.exp(-safeFrameDt / timeConstant);
  const next = safeCurrent + (target - safeCurrent) * blend;
  return next < HERO_MOTION_EFFECTS_EPSILON && target === 0 ? 0 : clamp01(next);
}

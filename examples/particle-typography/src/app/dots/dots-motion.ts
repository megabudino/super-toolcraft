import type {
  DotMotionProfile,
  DotParticle,
  DotPoint,
  DotsSettings,
} from "./dots-types";
import {
  DOTS_CALM_CYCLES_PER_SECOND,
  DOTS_CALM_FADE_SECONDS,
} from "./dots-timing";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function hashUnit(value: number): number {
  const x = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function createDotMotionProfile(seed: number): DotMotionProfile {
  const delayed = hashUnit(seed + 71) < 0.08;
  return {
    curlFrequency: 11 + hashUnit(seed + 5) * 13,
    delay: delayed
      ? 0.035 + hashUnit(seed + 72) * 0.13
      : hashUnit(seed + 73) * 0.025,
    holdCos: Math.cos(seed),
    holdSin: Math.sin(seed * 1.37),
    massScale: 0.72 + hashUnit(seed + 4) * 0.56,
    releaseDirection: hashUnit(seed + 90) > 0.5 ? 1 : -1,
  };
}

function formationPoint(
  particle: DotParticle,
  rawProgress: number,
  settings: DotsSettings,
): DotPoint {
  const motion = particle.motion ?? createDotMotionProfile(particle.seed);
  const { delay } = motion;
  const u = clamp01((rawProgress - delay) / Math.max(0.01, 1 - delay));
  const massVariation = settings.physics.mass * motion.massScale;
  const omega = (5 + settings.physics.attraction * 8.5) / Math.sqrt(massVariation);
  const decay = (2 + settings.physics.damping * 3.5) / Math.max(0.45, massVariation);
  const settle = 1 - smoothstep((u - 0.78) / 0.22);
  const response = Math.exp(-decay * u) * Math.cos(omega * u) * settle;
  const dx = particle.start.x - particle.target.x;
  const dy = particle.start.y - particle.target.y;
  const distance = Math.hypot(dx, dy) || 1;
  const turbulencePulse = Math.sin(Math.PI * u);
  const turbulenceEnvelope =
    turbulencePulse * turbulencePulse * (1 - u * 0.35);
  const curl =
    Math.sin(u * motion.curlFrequency + particle.seed) *
    settings.physics.turbulence *
    0.09 *
    turbulenceEnvelope;
  const radial =
    Math.sin(u * Math.PI * 2 + particle.seed * 0.03) *
    settings.physics.turbulence *
    0.018 *
    turbulenceEnvelope;

  return {
    x: particle.target.x + dx * response + (-dy / distance) * curl + (dx / distance) * radial,
    y: particle.target.y + dy * response + (dx / distance) * curl + (dy / distance) * radial,
  };
}

export function dotPositionAt(
  particle: DotParticle,
  progress: number,
  settings: DotsSettings,
): DotPoint {
  const motion = particle.motion ?? createDotMotionProfile(particle.seed);
  const phase = ((progress % 1) + 1) % 1;
  const timing = settings.motion;

  if (phase < timing.formationEnd) {
    return formationPoint(particle, phase / timing.formationEnd, settings);
  }

  if (phase < timing.calmEnd) {
    const holdProgress =
      (phase - timing.formationEnd) /
      (timing.calmEnd - timing.formationEnd);
    const calmElapsedSeconds =
      holdProgress * timing.calmTimelineSeconds;
    const fadeSeconds = Math.min(
      DOTS_CALM_FADE_SECONDS,
      timing.calmTimelineSeconds / 2,
    );
    const fadeIn = smoothstep(calmElapsedSeconds / fadeSeconds);
    const fadeOut = smoothstep(
      (timing.calmTimelineSeconds - calmElapsedSeconds) / fadeSeconds,
    );
    const holdEnvelope = fadeIn * fadeOut;
    const breathe =
      Math.sin(
        calmElapsedSeconds *
          Math.PI *
          2 *
          DOTS_CALM_CYCLES_PER_SECOND +
          particle.seed,
      ) *
      settings.physics.turbulence *
      0.0022 *
      holdEnvelope;
    return {
      x: particle.target.x + breathe * motion.holdCos,
      y: particle.target.y + breathe * motion.holdSin,
    };
  }

  const u = (phase - timing.calmEnd) / (1 - timing.calmEnd);
  const eased = smoothstep(u);
  const dx = particle.start.x - particle.target.x;
  const dy = particle.start.y - particle.target.y;
  const distance = Math.hypot(dx, dy) || 1;
  const arc =
    Math.sin(Math.PI * eased) *
    (0.08 + settings.physics.turbulence * 0.06) *
    motion.releaseDirection;

  return {
    x: mix(particle.target.x, particle.start.x, eased) + (-dy / distance) * arc,
    y: mix(particle.target.y, particle.start.y, eased) + (dx / distance) * arc,
  };
}

import { GLOBE_BAND_ROWS } from "./globe-band-order";
import type { GlobeBandLogoSettings } from "./globe-model";

export const LOGO_LOOP_APPROACH_DURATION_MS = 760;
export const LOGO_LOOP_STAGGER_MS = 840;
export const LOGO_LOOP_ORBIT_DISTANCE = 200;
export const LOGO_LOOP_ORBIT_DURATION_MS = 2520;
export const LOGO_LOOP_FINAL_INERTIA_BLEND = 0.35;
export const LOGO_LOOP_FINAL_INERTIA_START_PROGRESS = 0.78;
export const LOGO_LOOP_RESET_START_PROGRESS =
  1 - LOGO_LOOP_APPROACH_DURATION_MS / LOGO_LOOP_ORBIT_DURATION_MS;
export const LOGO_LOOP_RESET_START_PHASE_MS =
  LOGO_LOOP_ORBIT_DURATION_MS * LOGO_LOOP_RESET_START_PROGRESS;
export const LOGO_LOOP_RESET_START_OFFSET =
  LOGO_LOOP_ORBIT_DISTANCE -
  getLogoLoopPositionOffsetForOrbit(
    LOGO_LOOP_RESET_START_PHASE_MS,
    LOGO_LOOP_ORBIT_DURATION_MS,
  );

export type LogoLoopTiming = {
  approachDurationMs: number;
  orbitDurationMs: number;
  resetStartOffset: number;
  resetStartPhaseMs: number;
  staggerMs: number;
};

function easeDefaultPositionSlowdown(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  const smoother = clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
  const inertiaProgress = Math.min(
    1,
    Math.max(
      0,
      (clamped - LOGO_LOOP_FINAL_INERTIA_START_PROGRESS) /
        (1 - LOGO_LOOP_FINAL_INERTIA_START_PROGRESS),
    ),
  );
  const inertiaWeight =
    LOGO_LOOP_FINAL_INERTIA_BLEND *
    inertiaProgress *
    inertiaProgress *
    (3 - 2 * inertiaProgress);
  const lateInertia = 1 - (1 - clamped) * (1 - clamped);
  return smoother * (1 - inertiaWeight) + lateInertia * inertiaWeight;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function normalizeLogoLoopSpeed(speed: number): number {
  return Number.isFinite(speed) ? Math.max(0.1, speed) : 1;
}

function getLogoLoopPositionOffsetForOrbit(
  cyclePhaseMs: number,
  orbitDurationMs: number,
): number {
  if (cyclePhaseMs >= orbitDurationMs) {
    return 0;
  }

  const progress = cyclePhaseMs / orbitDurationMs;
  return easeDefaultPositionSlowdown(progress) * LOGO_LOOP_ORBIT_DISTANCE;
}

export function getLogoLoopTiming(speed = 1): LogoLoopTiming {
  const normalizedSpeed = normalizeLogoLoopSpeed(speed);
  const orbitDurationMs = LOGO_LOOP_ORBIT_DURATION_MS / normalizedSpeed;
  const approachDurationMs = LOGO_LOOP_APPROACH_DURATION_MS / normalizedSpeed;
  const staggerMs = LOGO_LOOP_STAGGER_MS / normalizedSpeed;
  const resetStartPhaseMs = orbitDurationMs - approachDurationMs;
  const resetStartOffset =
    LOGO_LOOP_ORBIT_DISTANCE -
    getLogoLoopPositionOffsetForOrbit(resetStartPhaseMs, orbitDurationMs);

  return {
    approachDurationMs,
    orbitDurationMs,
    resetStartOffset,
    resetStartPhaseMs,
    staggerMs,
  };
}

export function getLogoLoopCycleDurationMs(holdSeconds: number, speed = 1): number {
  return getLogoLoopTiming(speed).orbitDurationMs + Math.max(0, holdSeconds) * 1000;
}

export function getLogoLoopPositionOffset(cyclePhaseMs: number, speed = 1): number {
  return getLogoLoopPositionOffsetForOrbit(
    cyclePhaseMs,
    getLogoLoopTiming(speed).orbitDurationMs,
  );
}

export function getLoopingLogoPosition(
  finalPosition: number,
  elapsedMs: number,
  bandIndex: number,
  holdSeconds: number,
  speed = 1,
): number {
  const timing = getLogoLoopTiming(speed);
  const delayedElapsedMs = elapsedMs - Math.max(0, bandIndex) * timing.staggerMs;
  const initialArrivalPhaseMs = timing.resetStartPhaseMs;
  const timelineMs = initialArrivalPhaseMs + delayedElapsedMs;
  const cyclePhaseMs = positiveModulo(
    timelineMs,
    getLogoLoopCycleDurationMs(holdSeconds, speed),
  );

  return finalPosition + getLogoLoopPositionOffset(cyclePhaseMs, speed);
}

export function getLoopingLogos(
  logos: readonly GlobeBandLogoSettings[],
  elapsedMs: number,
  holdSeconds: number,
  speed = 1,
): readonly GlobeBandLogoSettings[] {
  return logos.map((logo) => ({
    ...logo,
    position: getLoopingLogoPosition(
      logo.position,
      elapsedMs,
      GLOBE_BAND_ROWS.findIndex((row) => row.bandId === logo.bandId),
      holdSeconds,
      speed,
    ),
  }));
}

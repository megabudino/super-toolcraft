export const DOTS_DEFAULT_ACTIVE_SECONDS = 4;
export const DOTS_DEFAULT_CALM_SECONDS = 1;
export const DOTS_DEFAULT_CYCLE_SECONDS = 10;
export const DOTS_ACTIVE_FORMATION_SHARE = 0.75;
export const DOTS_CALM_CYCLES_PER_SECOND = 1;
export const DOTS_CALM_FADE_SECONDS = 0.2;

export type DotMotionPhase = "formation" | "rest" | "release";

export type DotsLoopTiming = Readonly<{
  activeSeconds: number;
  calmEnd: number;
  calmSeconds: number;
  calmTimelineSeconds: number;
  formationEnd: number;
  formationSeconds: number;
  loopDurationSeconds: number;
  releaseSeconds: number;
  totalSeconds: number;
}>;

function positive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getDotsLoopTiming(
  activeSeconds = DOTS_DEFAULT_ACTIVE_SECONDS,
  calmSeconds = DOTS_DEFAULT_CALM_SECONDS,
  loopDurationSeconds = activeSeconds + calmSeconds,
): DotsLoopTiming {
  const active = positive(activeSeconds, DOTS_DEFAULT_ACTIVE_SECONDS);
  const calm = positive(calmSeconds, DOTS_DEFAULT_CALM_SECONDS);
  const total = active + calm;
  const formationSeconds = active * DOTS_ACTIVE_FORMATION_SHARE;
  const releaseSeconds = active - formationSeconds;
  const formationEnd = formationSeconds / total;
  const calmEnd = (formationSeconds + calm) / total;
  const runtimeDuration = positive(loopDurationSeconds, total);

  return Object.freeze({
    activeSeconds: active,
    calmEnd,
    calmSeconds: calm,
    calmTimelineSeconds: runtimeDuration * (calm / total),
    formationEnd,
    formationSeconds,
    loopDurationSeconds: runtimeDuration,
    releaseSeconds,
    totalSeconds: total,
  });
}

export const DOTS_DEFAULT_TIMING = getDotsLoopTiming(
  DOTS_DEFAULT_ACTIVE_SECONDS,
  DOTS_DEFAULT_CALM_SECONDS,
  DOTS_DEFAULT_CYCLE_SECONDS,
);

export function dotMotionPhaseAt(
  progress: number,
  timing: DotsLoopTiming = DOTS_DEFAULT_TIMING,
): DotMotionPhase {
  const phase = ((progress % 1) + 1) % 1;
  if (phase < timing.formationEnd) return "formation";
  if (phase < timing.calmEnd) return "rest";
  return "release";
}

import type { FineDetailsPromptFlightSettings } from './fine-details-settings';

export interface FineDetailsFlightRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface FineDetailsFlightSafeBounds {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface FineDetailsFlightOvershoot {
  amount: number;
  offset: number;
}

export interface FineDetailsFlightEase {
  curve: { x1: 0.3; x2: 0.2; y1: 0.9; y2: 1 };
  overshoot: FineDetailsFlightOvershoot | null;
}

export interface FineDetailsBreadcrumbCruiseFrame {
  dropped: boolean[];
  opacities: number[];
}

export interface FineDetailsBreadcrumbVanishFrame {
  isComplete: boolean;
  opacities: number[];
}

export interface FineDetailsFlightSchedule {
  ease: FineDetailsFlightEase;
  flightTime: number;
  startDelay: number;
}

export type FineDetailsFlightDirection = 'outbound' | 'return';

export const MAX_PROMPT_FLIGHT_GHOSTS = 32;

export function resolveFlightTarget(
  settings: FineDetailsPromptFlightSettings,
  sectionRect: FineDetailsFlightRect,
  promptRect: FineDetailsFlightRect,
  safeBounds?: FineDetailsFlightSafeBounds,
) {
  const sectionRight = sectionRect.left + sectionRect.width;
  const sectionBottom = sectionRect.top + sectionRect.height;
  const boundsLeft = safeBounds?.left ?? sectionRect.left;
  const boundsBottom = safeBounds?.bottom ?? sectionBottom;
  const maximumLeft = Math.max(sectionRect.left, sectionRight - promptRect.width);
  const maximumTop = Math.max(sectionRect.top, sectionBottom - promptRect.height);
  const targetLeft = Math.max(
    sectionRect.left,
    Math.min(boundsLeft + settings.offset.x, maximumLeft),
  );
  const targetTop = Math.max(
    sectionRect.top,
    Math.min(boundsBottom - promptRect.height + settings.offset.y, maximumTop),
  );

  return {
    x: targetLeft - promptRect.left,
    y: targetTop - promptRect.top,
  };
}

export function createFlightSchedule(
  settings: FineDetailsPromptFlightSettings,
  _direction: FineDetailsFlightDirection,
): FineDetailsFlightSchedule {
  return {
    ease: {
      curve: { x1: 0.3, x2: 0.2, y1: 0.9, y2: 1 },
      overshoot: settings.bounce > 0 ? { amount: settings.bounce / 100, offset: 0.82 } : null,
    },
    flightTime: settings.flightTime,
    startDelay: settings.startDelay,
  };
}

export function resolveFlightDistance(easedProgress: number, pathLength: number) {
  return Math.max(0, easedProgress * Math.max(pathLength, 0));
}

export function resolveBreadcrumbDropPlan(
  settings: FineDetailsPromptFlightSettings,
  pathLength: number,
): number[] {
  if (pathLength <= 0) return [];

  const effectiveSpacing = Math.max(settings.ghostSpacing, pathLength / MAX_PROMPT_FLIGHT_GHOSTS);
  const lastDropDistance = pathLength - effectiveSpacing / 2;
  const plan: number[] = [];
  while (
    plan.length < MAX_PROMPT_FLIGHT_GHOSTS &&
    plan.length * effectiveSpacing <= lastDropDistance
  ) {
    plan.push(plan.length * effectiveSpacing);
  }
  return plan;
}

export function resolveBreadcrumbCruiseFrame(
  plan: readonly number[],
  settings: FineDetailsPromptFlightSettings,
  distance: number,
  previouslyDropped: readonly boolean[],
): FineDetailsBreadcrumbCruiseFrame {
  const dropped = plan.map(
    (dropDistance, index) => Boolean(previouslyDropped[index]) || distance >= dropDistance,
  );
  const newestDroppedIndex = dropped.lastIndexOf(true);
  const baseOpacity = settings.ghostOpacity / 100;
  const falloff = 1 - settings.ghostFalloff / 100;
  return {
    dropped,
    opacities: dropped.map((isDropped, index) =>
      isDropped ? baseOpacity * falloff ** (newestDroppedIndex - index) : 0,
    ),
  };
}

export function resolveBreadcrumbVanishFrame(
  plan: readonly number[],
  settings: FineDetailsPromptFlightSettings,
  elapsed: number,
): FineDetailsBreadcrumbVanishFrame {
  const newestDroppedIndex = plan.length - 1;
  const baseOpacity = settings.ghostOpacity / 100;
  const falloff = 1 - settings.ghostFalloff / 100;
  let isComplete = true;
  const opacities = plan.map((_, index) => {
    const progress = Math.min(
      1,
      Math.max(0, (elapsed - index * settings.vanishStagger) / settings.vanishTime),
    );
    if (progress < 1) isComplete = false;
    const easedProgress = progress * progress * (3 - 2 * progress);
    const landedOpacity = baseOpacity * falloff ** (newestDroppedIndex - index);
    return landedOpacity * (1 - easedProgress);
  });

  return { isComplete, opacities };
}

export function resolveFlightProgress(progress: number, ease: FineDetailsFlightEase) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const sample = (time: number, first: number, second: number) => {
    const inverse = 1 - time;
    return 3 * inverse ** 2 * time * first + 3 * inverse * time ** 2 * second + time ** 3;
  };
  const settle = (value: number) => {
    let low = 0;
    let high = 1;
    for (let iteration = 0; iteration < 12; iteration += 1) {
      const time = (low + high) / 2;
      if (sample(time, ease.curve.x1, ease.curve.x2) < value) low = time;
      else high = time;
    }
    return sample((low + high) / 2, ease.curve.y1, ease.curve.y2);
  };
  if (!ease.overshoot) return settle(clampedProgress);

  if (clampedProgress <= ease.overshoot.offset) {
    return settle(clampedProgress / ease.overshoot.offset) * (1 + ease.overshoot.amount);
  }

  const settleProgress = (clampedProgress - ease.overshoot.offset) / (1 - ease.overshoot.offset);
  return 1 + ease.overshoot.amount * (1 - settle(settleProgress));
}

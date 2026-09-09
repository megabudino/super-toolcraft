/**
 * Pure placement math for the Deck layout: upcoming cards rest in a receding
 * stack above the active card, while the passed card tips over, drops below,
 * and fades as the next image moves into the front slot.
 */

export type StackPlacementSettings = Readonly<{
  backTiltRadians: number;
  depthStep: number;
  fallDistance: number;
  fallTiltRadians: number;
  focusFalloff: number;
  gap: number;
  minScale: number;
  scaleFalloff: number;
}>;

export type StackCardPlacement = Readonly<{
  flatten: number;
  focus: number;
  opacity: number;
  position: readonly [number, number, number];
  renderOrder: number;
  rotationX: number;
  scale: number;
}>;

/** Behind-cards drawn per frame stays bounded regardless of source count. */
export const stackMaxVisibleDepth = 14;

/** Passed cards are fully faded out beyond this wrapped distance. */
export const stackFallCutoff = 0.99;

/** Deck mode always settles onto a whole image card. */
export const stackMinimumSnapStrength = 0.1;

/** The active Deck card reads larger than cards in the curved Flow. */
export const stackSceneScale = 1.42;

/** The Deck center sits below the canvas center. */
export const stackSceneVerticalOffset = -0.6;

/** Deck cards use softened shared depth falloffs to keep images legible. */
export const stackDistanceSoftening = 0.55;

/** Default user-facing Deck scroll weight; higher reads heavier. */
export const stackScrollWeightDefault = 1;

/**
 * Per-frame spring stiffness endpoints mapped from scroll weight. `light`
 * approximates the immediate legacy response; `heavy` is the slowest allowed
 * mass so the deck still settles within a couple of seconds.
 */
export const stackScrollStiffnessRange = {
  heavy: 0.011,
  light: 0.09,
} as const;

export type StackScrollSpring = Readonly<{
  damping: number;
  stiffness: number;
}>;

export type StackScrollState = Readonly<{
  offset: number;
  velocity: number;
}>;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Maps the user-facing scroll weight (0 = immediate, 1 = heaviest) to a
 * critically damped spring. Lower stiffness lets the deck accelerate and
 * settle gradually, which reads as a heavier card stack instead of an
 * instant velocity jump.
 */
export function resolveStackScrollSpring(weight: number): StackScrollSpring {
  const clamped = clamp(weight, 0, 1);
  const stiffness =
    stackScrollStiffnessRange.light +
    (stackScrollStiffnessRange.heavy - stackScrollStiffnessRange.light) *
      clamped;
  return { damping: 2 * Math.sqrt(stiffness), stiffness };
}

/**
 * Advances the weighted Deck scroll by one frame step. Semi-implicit Euler
 * with exponential damping stays stable for the renderer's clamped frame
 * scales, and critical damping approaches the target without overshooting.
 * Once both the remaining distance and velocity are negligible the state
 * lands exactly on the target so the frame loop can suspend.
 */
export function advanceStackScroll(
  state: StackScrollState,
  targetOffset: number,
  spring: StackScrollSpring,
  deltaScale: number,
): StackScrollState {
  const velocity =
    (state.velocity +
      (targetOffset - state.offset) * spring.stiffness * deltaScale) *
    Math.exp(-spring.damping * deltaScale);
  const offset = state.offset + velocity * deltaScale;
  if (
    Math.abs(targetOffset - offset) < 0.00001 &&
    Math.abs(velocity) < 0.00001
  ) {
    return { offset: targetOffset, velocity: 0 };
  }
  return { offset, velocity };
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / Math.max(edge1 - edge0, 0.0001), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Wrapped distance for the deck. Unlike the Flow's centered modulo, the
 * stack keeps every upcoming card above the front slot (positive) and
 * reserves only a short negative window for the card that is falling away —
 * the passed card disappears before re-entering at the top.
 */
export function computeStackRelative(
  index: number,
  offset: number,
  count: number,
): number {
  if (count <= 0) return 0;
  const raw = (((index - offset) % count) + count) % count;
  const threshold = Math.max(count - stackFallCutoff, count * 0.5);
  return raw >= threshold ? raw - count : raw;
}

/**
 * Computes one card's transform from its wrapped distance to the front slot.
 * `relative` is positive for upcoming cards stacked behind/above, `0` for the
 * active card, and negative for the card that was just passed.
 */
export function computeStackCardPlacement(
  relative: number,
  settings: StackPlacementSettings,
): StackCardPlacement {
  const orderBase = stackMaxVisibleDepth + 2;

  if (relative >= 0) {
    const depth = Math.min(relative, stackMaxVisibleDepth);
    const hidden = relative > stackMaxVisibleDepth;
    const focus = clamp(1 - depth * settings.focusFalloff, 0, 1);
    const scale = clamp(
      1 - (1 - focus) * settings.scaleFalloff,
      settings.minScale,
      1,
    );
    // The card untilts and slides down/forward while approaching the front.
    const settle = Math.min(depth, 1);
    return {
      flatten: 0,
      focus,
      opacity: hidden ? 0 : 1,
      position: [0, depth * settings.gap, 0 - depth * settings.depthStep],
      renderOrder: Math.round((orderBase - depth) * 100),
      rotationX: 0 - settings.backTiltRadians * settle,
      scale,
    };
  }

  // The passed card tips over, drops below the front slot, and fades out.
  // The incoming card remains above it so the image sequence reads clearly.
  const t = Math.min(-relative, stackFallCutoff);
  const progress = clamp(t, 0, 1);
  const eased = 1 - (1 - progress) * (1 - progress);
  return {
    flatten: eased,
    focus: 1,
    opacity:
      t >= stackFallCutoff ? 0 : 1 - smoothstep(0.58, stackFallCutoff, t),
    position: [
      0,
      -eased * settings.fallDistance,
      0.3 * eased,
    ],
    renderOrder: Math.round((orderBase - progress * 0.5 - 0.02) * 100),
    rotationX: settings.fallTiltRadians * eased,
    scale: 1,
  };
}

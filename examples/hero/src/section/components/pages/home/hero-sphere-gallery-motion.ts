import {
  HERO_LENS_NEAR,
  projectHeroLensPoint,
  type HeroLensProjectionParams,
} from './hero-sphere-layout';

const TWO_PI = Math.PI * 2;
const MAX_SCREEN_MOTION = 140;
const MAX_LATITUDE = (85 * Math.PI) / 180;
const MIN_PAN_FRAME_MS = 8;
const MAX_PAN_FRAME_MS = 50;
const PAN_RATE_WINDOW_SIZE = 4;

export const MIN_X = 0.1;
export const MAX_X = 0.45;
export const MIN_LONG_X = 1;
export const MAX_LONG_X = 1.5;

export type HeroAutoScrollGlideKind = 'long' | 'short';

export interface HeroAutoScrollCadenceState {
  shortGlidesRemaining: number | null;
}

export interface HeroAutoScrollOffset {
  x: number;
  y: number;
}

export interface HeroAutoScrollState {
  elapsed: number;
  from: HeroAutoScrollOffset;
  mode: 'gliding' | 'idle';
  offset: HeroAutoScrollOffset;
  target: HeroAutoScrollOffset;
}

export interface HeroAngularRate {
  phi: number;
  theta: number;
}

interface HeroPanRateSample {
  delta: HeroAngularRate;
  dtMs: number;
}

export interface HeroPanRateWindow {
  readonly capacity: number;
  readonly samples: HeroPanRateSample[];
}

export interface HeroFieldAngle {
  phi: number;
  theta: number;
  valid: boolean;
}

export interface HeroFieldGradient {
  x: number;
  y: number;
}

export interface HeroFieldGradients {
  phi: HeroFieldGradient;
  theta: HeroFieldGradient;
}

export interface HeroPanelZoneBounds {
  phiBottom: number;
  phiTop: number;
  thetaLeft: number;
  thetaRight: number;
}

export interface HeroRepeatedRowSample {
  center: number;
  cycle: number;
  index: number;
  local: number;
}

function wrapAngleDelta(value: number) {
  return Math.atan2(Math.sin(value), Math.cos(value));
}

function clampVector(vector: { x: number; y: number }, limit: number) {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (!Number.isFinite(magnitude) || magnitude <= 0) return { x: 0, y: 0 };
  if (magnitude <= limit) return vector;
  const scale = limit / magnitude;
  return { x: vector.x * scale, y: vector.y * scale };
}

function clampRandomSample(random: () => number) {
  const sample = random();
  return Number.isFinite(sample) ? Math.max(0, Math.min(1, sample)) : 0;
}

function wrapHeroAutoScrollOffset(value: number) {
  if (value >= 0 && value < 2) return value;
  return ((value % 2) + 2) % 2;
}

export function createHeroAutoScrollState(): HeroAutoScrollState {
  return {
    elapsed: 0,
    from: { x: 0, y: 0 },
    mode: 'idle',
    offset: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
  };
}

export function createHeroAutoScrollCadenceState(): HeroAutoScrollCadenceState {
  return { shortGlidesRemaining: null };
}

function getRandomShortGlideCount(random: () => number) {
  return clampRandomSample(random) < 0.5 ? 1 : 2;
}

export function consumeHeroAutoScrollCadence(
  state: HeroAutoScrollCadenceState,
  random: () => number,
): { glideKind: HeroAutoScrollGlideKind; state: HeroAutoScrollCadenceState } {
  const shortGlidesRemaining =
    state.shortGlidesRemaining ?? getRandomShortGlideCount(random);

  if (shortGlidesRemaining > 0) {
    return {
      glideKind: 'short',
      state: { shortGlidesRemaining: shortGlidesRemaining - 1 },
    };
  }

  return {
    glideKind: 'long',
    state: { shortGlidesRemaining: getRandomShortGlideCount(random) },
  };
}

export function getHeroAutoScrollStep(rowCount: number) {
  return 2 / Math.max(1, Math.floor(rowCount));
}

function getShortestHeroPanDelta(current: number, previous: number) {
  const delta = current - previous;
  if (!Number.isFinite(delta)) return 0;
  if (delta >= -1 && delta < 1) return delta;
  return ((((delta + 1) % 2) + 2) % 2) - 1;
}

export function getHeroPeriodicPanDelta(
  current: Readonly<HeroAutoScrollOffset>,
  previous: Readonly<HeroAutoScrollOffset>,
): HeroAutoScrollOffset {
  return {
    x: getShortestHeroPanDelta(current.x, previous.x),
    y: getShortestHeroPanDelta(current.y, previous.y),
  };
}

export function beginHeroAutoScrollGlide(
  state: HeroAutoScrollState,
  rowCount: number,
  random: () => number,
  glideKind: HeroAutoScrollGlideKind = 'short',
): HeroAutoScrollState {
  const count = Math.max(1, Math.floor(rowCount));
  const step = getHeroAutoScrollStep(count);
  const currentRow = Math.round(state.offset.y / step);
  let rowDelta = 0;

  if (count > 1) {
    const alternative =
      1 + Math.min(count - 2, Math.floor(clampRandomSample(random) * (count - 1)));
    if (alternative * 2 === count) {
      rowDelta = clampRandomSample(random) < 0.5 ? -alternative : alternative;
    } else {
      rowDelta = alternative * 2 < count ? alternative : alternative - count;
    }
  }

  const horizontalSample = clampRandomSample(random);
  const minimumX = glideKind === 'long' ? MIN_LONG_X : MIN_X;
  const maximumX = glideKind === 'long' ? MAX_LONG_X : MAX_X;
  const horizontalMagnitude =
    horizontalSample === 0
      ? minimumX
      : horizontalSample === 1
        ? maximumX
        : minimumX + (maximumX - minimumX) * horizontalSample;
  const horizontalSign = clampRandomSample(random) < 0.5 ? -1 : 1;
  const offset = { ...state.offset };

  return {
    elapsed: 0,
    from: offset,
    mode: 'gliding',
    offset: { ...offset },
    target: {
      x: offset.x + horizontalMagnitude * horizontalSign,
      y: (currentRow + rowDelta) * step,
    },
  };
}

export function getHeroAutoScrollDurationMultiplier(state: HeroAutoScrollState) {
  const horizontalDistance = Math.abs(state.target.x - state.from.x);
  return horizontalDistance >= MIN_LONG_X ? horizontalDistance / MAX_X : 1;
}

export function getHeroAutoScrollEasedProgress(progress: number) {
  const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  return 1 - (1 - clamped) ** 3;
}

export function advanceHeroAutoScrollGlide(
  state: HeroAutoScrollState,
  dtSeconds: number,
  durationSeconds: number,
): HeroAutoScrollState {
  if (state.mode !== 'gliding') return state;
  const dt = Number.isFinite(dtSeconds) ? Math.max(0, dtSeconds) : 0;
  if (dt === 0) return state;

  const duration = Number.isFinite(durationSeconds) ? Math.max(0.05, durationSeconds) : 0.05;
  const elapsed = Math.min(duration, state.elapsed + dt);
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  const eased = getHeroAutoScrollEasedProgress(progress);
  const offset = {
    x: state.from.x + (state.target.x - state.from.x) * eased,
    y: state.from.y + (state.target.y - state.from.y) * eased,
  };

  if (progress < 1) return { ...state, elapsed, offset };

  const wrapped = {
    x: state.target.x,
    y: wrapHeroAutoScrollOffset(state.target.y),
  };
  return {
    elapsed,
    from: wrapped,
    mode: 'idle',
    offset: { ...wrapped },
    target: { ...wrapped },
  };
}

export function cancelHeroAutoScrollGlide(state: HeroAutoScrollState): HeroAutoScrollState {
  if (state.mode === 'idle') return state;
  const offset = { ...state.offset };
  return {
    elapsed: 0,
    from: offset,
    mode: 'idle',
    offset: { ...offset },
    target: { ...offset },
  };
}

export function createHeroAngularMotionState(): HeroAngularRate {
  return { phi: 0, theta: 0 };
}

export function getHeroRowAngularRates(
  rows: readonly Readonly<{ speed: number }>[],
  reducedMotion: boolean,
) {
  const rates = new Float32Array(6);
  if (reducedMotion) return rates;
  rows.slice(0, 6).forEach((row, index) => {
    rates[index] = (row.speed * Math.PI) / 180;
  });
  return rates;
}

export function getHeroRepeatedRowSample(
  panelV: number,
  pitch: number,
  rowCount: number,
): HeroRepeatedRowSample {
  const safePitch = Math.max(1, pitch);
  const count = Math.max(1, Math.floor(rowCount));
  const ordinal = Math.floor(panelV / safePitch + count * 0.5);
  const index = ((ordinal % count) + count) % count;
  const cycle = (ordinal - index) / count;
  const center = (ordinal - (count - 1) * 0.5) * safePitch;
  return { center, cycle, index, local: panelV - center };
}

export function createHeroPanRateWindow(capacity = PAN_RATE_WINDOW_SIZE): HeroPanRateWindow {
  return {
    capacity: Math.max(1, Math.floor(capacity)),
    samples: [],
  };
}

export function pushHeroPanFrameDelta(
  window: HeroPanRateWindow,
  delta: Readonly<HeroAngularRate>,
  dtMs: number,
) {
  const finiteDtMs = Number.isFinite(dtMs) ? dtMs : 1000 / 60;
  window.samples.push({
    delta: {
      phi: Number.isFinite(delta.phi) ? delta.phi : 0,
      theta: Number.isFinite(delta.theta) ? delta.theta : 0,
    },
    dtMs: Math.max(MIN_PAN_FRAME_MS, Math.min(MAX_PAN_FRAME_MS, finiteDtMs)),
  });
  if (window.samples.length > window.capacity) {
    window.samples.splice(0, window.samples.length - window.capacity);
  }
}

export function readHeroPanRate(window: Readonly<HeroPanRateWindow>): HeroAngularRate {
  if (window.samples.length === 0) return createHeroAngularMotionState();
  const totals = window.samples.reduce(
    (result, sample) => ({
      dtMs: result.dtMs + sample.dtMs,
      phi: result.phi + sample.delta.phi,
      theta: result.theta + sample.delta.theta,
    }),
    { dtMs: 0, phi: 0, theta: 0 },
  );
  const dtSeconds = Math.max(MIN_PAN_FRAME_MS, totals.dtMs) / 1000;
  return {
    phi: Math.abs(totals.phi) < 1e-12 ? 0 : totals.phi / dtSeconds,
    theta: Math.abs(totals.theta) < 1e-12 ? 0 : totals.theta / dtSeconds,
  };
}

export function stepHeroAngularMotionState(
  current: Readonly<HeroAngularRate>,
  target: Readonly<HeroAngularRate>,
  smoothing = 0.3,
): HeroAngularRate {
  const amount = Math.max(0, Math.min(1, smoothing));
  const next = {
    phi: current.phi + (target.phi - current.phi) * amount,
    theta: current.theta + (target.theta - current.theta) * amount,
  };
  return {
    phi: Math.abs(next.phi) < 1e-5 ? 0 : next.phi,
    theta: Math.abs(next.theta) < 1e-5 ? 0 : next.theta,
  };
}

function finiteDifference(
  center: number,
  negative: HeroFieldAngle,
  positive: HeroFieldAngle,
  step: number,
  angular: boolean,
) {
  const delta = (to: number, from: number) => (angular ? wrapAngleDelta(to - from) : to - from);
  if (negative.valid && positive.valid) {
    return (
      delta(positive[angular ? 'theta' : 'phi'], negative[angular ? 'theta' : 'phi']) / (2 * step)
    );
  }
  if (positive.valid) {
    return delta(positive[angular ? 'theta' : 'phi'], center) / step;
  }
  if (negative.valid) {
    return delta(center, negative[angular ? 'theta' : 'phi']) / step;
  }
  return 0;
}

export function sampleHeroFieldGradients(
  samples: Readonly<{
    bottom: HeroFieldAngle;
    center: HeroFieldAngle;
    left: HeroFieldAngle;
    right: HeroFieldAngle;
    top: HeroFieldAngle;
  }>,
  pixelStep: number,
): HeroFieldGradients {
  const step = Math.max(1e-6, pixelStep);
  return {
    phi: {
      x: finiteDifference(samples.center.phi, samples.left, samples.right, step, false),
      y: finiteDifference(samples.center.phi, samples.top, samples.bottom, step, false),
    },
    theta: {
      x: finiteDifference(samples.center.theta, samples.left, samples.right, step, true),
      y: finiteDifference(samples.center.theta, samples.top, samples.bottom, step, true),
    },
  };
}

export function getHeroScreenMotionFromField(
  gradients: Readonly<HeroFieldGradients>,
  angularRate: Readonly<HeroAngularRate>,
  dtSeconds: number,
) {
  const thetaDelta = angularRate.theta * Math.max(0, Math.min(0.05, dtSeconds));
  const phiDelta = angularRate.phi * Math.max(0, Math.min(0.05, dtSeconds));
  const determinant = gradients.theta.x * gradients.phi.y - gradients.theta.y * gradients.phi.x;

  if (Number.isFinite(determinant) && Math.abs(determinant) > 1e-8) {
    return clampVector(
      {
        x: (thetaDelta * gradients.phi.y - gradients.theta.y * phiDelta) / determinant,
        y: (gradients.theta.x * phiDelta - thetaDelta * gradients.phi.x) / determinant,
      },
      MAX_SCREEN_MOTION,
    );
  }

  // A silhouette or a locally flat encoded field can make the matrix singular.
  // Project each angular delta onto its available gradient and keep the fallback bounded.
  const project = (delta: number, gradient: HeroFieldGradient) => {
    const lengthSquared = gradient.x * gradient.x + gradient.y * gradient.y;
    if (lengthSquared <= 1e-10) return { x: 0, y: 0 };
    return {
      x: (delta * gradient.x) / lengthSquared,
      y: (delta * gradient.y) / lengthSquared,
    };
  };
  const thetaMotion = project(thetaDelta, gradients.theta);
  const phiMotion = project(phiDelta, gradients.phi);
  return clampVector(
    { x: thetaMotion.x + phiMotion.x, y: thetaMotion.y + phiMotion.y },
    MAX_SCREEN_MOTION,
  );
}

function findProjectionBoundary({
  end,
  evaluate,
  target,
}: {
  end: number;
  evaluate: (angle: number) => number | null;
  target: number;
}) {
  const segments = 48;
  let innerAngle = 0;
  let innerValue = evaluate(0);
  if (innerValue === null) return end;
  const progressDirection = target >= innerValue ? 1 : -1;
  let extremumAngle = innerAngle;
  let extremumValue = innerValue;
  let extremumBracketStart = innerAngle;

  const crossesTarget = (first: number, second: number) =>
    (first - target) * (second - target) <= 0;
  const bisectTarget = (start: number, finish: number, startValue: number) => {
    let low = start;
    let high = finish;
    for (let iteration = 0; iteration < 24; iteration += 1) {
      const middle = (low + high) / 2;
      const middleValue = evaluate(middle);
      if (middleValue === null || crossesTarget(startValue, middleValue)) high = middle;
      else low = middle;
    }
    return (low + high) / 2;
  };
  const refineExtremum = (start: number, finish: number) => {
    let low = 0;
    let high = 1;
    const score = (progress: number) => {
      const value = evaluate(start + (finish - start) * progress);
      return value === null ? -Infinity : value * progressDirection;
    };
    for (let iteration = 0; iteration < 24; iteration += 1) {
      const first = low + (high - low) / 3;
      const second = high - (high - low) / 3;
      if (score(first) < score(second)) low = first;
      else high = second;
    }
    return start + (finish - start) * ((low + high) / 2);
  };

  for (let index = 1; index <= segments; index += 1) {
    const outerAngle = (end * index) / segments;
    const outerValue = evaluate(outerAngle);
    if (outerValue === null) {
      let validAngle = innerAngle;
      let validValue = innerValue;
      let invalidAngle = outerAngle;
      for (let iteration = 0; iteration < 24; iteration += 1) {
        const middle = (validAngle + invalidAngle) / 2;
        const middleValue = evaluate(middle);
        if (middleValue === null) invalidAngle = middle;
        else {
          validAngle = middle;
          validValue = middleValue;
        }
      }
      if (crossesTarget(innerValue, validValue)) {
        return bisectTarget(innerAngle, validAngle, innerValue);
      }
      if (validValue * progressDirection > extremumValue * progressDirection) {
        extremumAngle = validAngle;
      }
      return extremumAngle;
    }
    if (crossesTarget(innerValue, outerValue)) {
      return bisectTarget(innerAngle, outerAngle, innerValue);
    }
    if (outerValue * progressDirection > extremumValue * progressDirection) {
      extremumBracketStart = innerAngle;
      extremumAngle = outerAngle;
      extremumValue = outerValue;
    } else if (outerValue * progressDirection < extremumValue * progressDirection) {
      const refinedExtremumAngle = refineExtremum(extremumBracketStart, outerAngle);
      const refinedExtremumValue = evaluate(refinedExtremumAngle);
      const preExtremumValue = evaluate(extremumBracketStart);
      if (
        refinedExtremumValue !== null &&
        preExtremumValue !== null &&
        crossesTarget(preExtremumValue, refinedExtremumValue)
      ) {
        return bisectTarget(extremumBracketStart, refinedExtremumAngle, preExtremumValue);
      }
      return refinedExtremumAngle;
    }
    innerAngle = outerAngle;
    innerValue = outerValue;
  }
  return extremumAngle;
}

export function getHeroPanelZoneBounds(
  projection: Omit<HeroLensProjectionParams, 'near' | 'phi0' | 'theta0'>,
  viewport: Readonly<{ height: number; width: number }>,
): HeroPanelZoneBounds {
  const params: HeroLensProjectionParams = {
    ...projection,
    near: HERO_LENS_NEAR,
    phi0: 0,
    theta0: 0,
  };
  const projectTheta = (theta: number) => {
    const point = projectHeroLensPoint(theta * params.rx, 0, params);
    return point.w > HERO_LENS_NEAR ? point.x : null;
  };
  const projectPhi = (phi: number) => {
    const point = projectHeroLensPoint(0, -phi * params.ry, params);
    return point.w > HERO_LENS_NEAR ? point.y : null;
  };

  return {
    phiBottom: findProjectionBoundary({
      end: -MAX_LATITUDE,
      evaluate: projectPhi,
      target: viewport.height,
    }),
    phiTop: findProjectionBoundary({ end: MAX_LATITUDE, evaluate: projectPhi, target: 0 }),
    thetaLeft: findProjectionBoundary({ end: -Math.PI, evaluate: projectTheta, target: 0 }),
    thetaRight: findProjectionBoundary({
      end: Math.PI,
      evaluate: projectTheta,
      target: viewport.width,
    }),
  };
}

export function getHeroContinuousPanTheta(pan: Readonly<{ turns: number; x: number }>) {
  return (pan.x + pan.turns * 2) * Math.PI;
}

export function wrapHeroTheta(theta: number) {
  return ((((theta + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI;
}

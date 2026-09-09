import {
  createDotColorSampler,
  type DotColor,
} from "./dots-color";
import { dotPositionAt } from "./dots-motion";
import { getDotPlan } from "./dots-shape";
import type {
  DotParticle,
  DotPlan,
  DotsSettings,
} from "./dots-types";

export type RenderDotsFrameOptions = Readonly<{
  clear?: boolean;
  includeBackground: boolean;
}>;

export type RenderDotsFrameInChunksOptions = Readonly<{
  batchSize?: number;
  clear?: boolean;
  includeBackground: boolean;
  yieldControl?: () => Promise<void>;
}>;

type PreparedDot = Readonly<{
  color: DotColor;
  index: number;
  point: { x: number; y: number };
  radius: number;
}>;

type PreparedTrail = Readonly<{
  color: DotColor;
  points: readonly [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ];
}>;

type DotsFrameState = Readonly<{
  context: CanvasRenderingContext2D;
  glowStride: number;
  height: number;
  maxSize: number;
  minDimension: number;
  minSize: number;
  particles: readonly DotParticle[];
  particleColors: readonly DotColor[];
  preparedDots: PreparedDot[];
  preparedTrails: PreparedTrail[];
  progress: number;
  settings: DotsSettings;
  trailStep: number;
  trails: number;
  trailStride: number;
  width: number;
}>;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function denseParticleSpeed(
  particle: DotParticle,
  progress: number,
  settings: DotsSettings,
  minDimension: number,
): number {
  const timing = settings.motion;
  const phase = ((progress % 1) + 1) % 1;
  const massScale = particle.motion?.massScale ?? 1;

  if (phase < timing.formationEnd) {
    const rawProgress = phase / timing.formationEnd;
    const delay = particle.motion?.delay ?? 0;
    const u = clamp01((rawProgress - delay) / Math.max(0.01, 1 - delay));
    return (
      Math.sin(Math.PI * u) *
      (14 + settings.physics.attraction * 10) *
      (1.12 - massScale * 0.18)
    );
  }

  if (phase < timing.calmEnd) {
    const calmElapsedSeconds =
      (phase - timing.formationEnd) * timing.loopDurationSeconds;
    const fadeSeconds = Math.min(0.2, timing.calmTimelineSeconds / 2);
    const fade =
      clamp01(calmElapsedSeconds / fadeSeconds) *
      clamp01(
        (timing.calmTimelineSeconds - calmElapsedSeconds) / fadeSeconds,
      );
    return (
      Math.abs(Math.cos(calmElapsedSeconds * Math.PI * 2 + particle.seed)) *
      settings.physics.turbulence *
      0.0022 *
      Math.PI *
      2 *
      minDimension *
      fade
    );
  }

  const releaseProgress =
    (phase - timing.calmEnd) / (1 - timing.calmEnd);
  const distanceScale = clamp01(
    Math.hypot(
      particle.start.x - particle.target.x,
      particle.start.y - particle.target.y,
    ) * 1.6,
  );
  return (
    Math.sin(Math.PI * releaseProgress) *
    (16 + settings.physics.attraction * 8) *
    (0.82 + distanceScale * 0.18)
  );
}

const particleColorCache = new Map<string, readonly DotColor[]>();

function getParticleColors(
  plan: DotPlan,
  settings: DotsSettings,
): readonly DotColor[] {
  const key = JSON.stringify({
    palette: settings.appearance.palette,
    plan: plan.key,
    tint: settings.typography.color,
  });
  const cached = particleColorCache.get(key);
  if (cached) return cached;

  const sampleColor = createDotColorSampler(
    settings.appearance.palette,
    settings.typography.color,
  );
  const colors = plan.particles.map((particle) =>
    sampleColor(
      particle.target.x,
      particle.target.y,
      particle.seed,
    ),
  );
  particleColorCache.set(key, colors);
  if (particleColorCache.size > 12) {
    particleColorCache.delete(particleColorCache.keys().next().value ?? key);
  }
  return colors;
}

function beginDotsFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: DotsSettings,
  progress: number,
  options: RenderDotsFrameOptions,
  plan: DotPlan = getDotPlan(settings),
): DotsFrameState {
  const { clear = true, includeBackground } = options;
  if (clear) context.clearRect(0, 0, width, height);
  if (includeBackground) {
    context.fillStyle = settings.appearance.background;
    context.fillRect(0, 0, width, height);
  }

  const trails = settings.appearance.trails;
  const minDimension = Math.min(width, height);
  const [minSize, maxSize] = settings.particles.size;
  const particleColors = getParticleColors(plan, settings);
  const preparedDots: PreparedDot[] = [];
  const preparedTrails: PreparedTrail[] = [];
  const trailStep =
    (0.035 + trails * 0.13) / settings.motion.loopDurationSeconds;
  const trailStride = settings.particles.count >= 1_600
    ? 6
    : settings.particles.count >= 900
      ? 3
      : settings.particles.count >= 500
        ? 2
        : 1;
  const glowStride = settings.particles.count >= 1_600
    ? 3
    : settings.particles.count >= 900
      ? 2
      : 1;
  if (trails > 0.002) {
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = Math.max(0.45, settings.particles.size[0] * 0.18);
  }

  return {
    context,
    glowStride,
    height,
    maxSize,
    minDimension,
    minSize,
    particles: plan.particles,
    particleColors,
    preparedDots,
    preparedTrails,
    progress,
    settings,
    trailStep,
    trails,
    trailStride,
    width,
  };
}

function prepareParticle(state: DotsFrameState, particle: DotParticle): void {
  const {
    maxSize,
    minDimension,
    minSize,
    particleColors,
    preparedDots,
    preparedTrails,
    progress,
    settings,
    trailStep,
    trails,
    trailStride,
  } = state;
  const point = dotPositionAt(particle, progress, settings);
  let speed: number;
  if (settings.particles.count >= 1_600) {
    speed = denseParticleSpeed(
      particle,
      progress,
      settings,
      minDimension,
    );
  } else {
    const speedSample = 0.0125 / settings.motion.loopDurationSeconds;
    const speedPoint = dotPositionAt(
      particle,
      progress - speedSample,
      settings,
    );
    speed =
      Math.hypot(point.x - speedPoint.x, point.y - speedPoint.y) *
      minDimension;
  }
  const timelineSeconds = progress * settings.motion.loopDurationSeconds;
  const pulse =
    0.5 + 0.5 * Math.sin(timelineSeconds * Math.PI * 2 + particle.seed);
  const motion = clamp01(
    (speed / 14) * settings.appearance.sizeMotion +
      pulse * 0.12 * settings.appearance.sizeMotion,
  );
  const color = particleColors[particle.index]!;
  preparedDots.push({
    color,
    index: particle.index,
    point,
    radius: minSize + (maxSize - minSize) * motion,
  });

  if (trails <= 0.002 || particle.index % trailStride !== 0) return;
  const previous1 = dotPositionAt(particle, progress - trailStep, settings);
  if (Math.hypot(point.x - previous1.x, point.y - previous1.y) * minDimension < 0.16) {
    return;
  }
  const previous2 = dotPositionAt(particle, progress - trailStep * 2, settings);
  const previous3 = dotPositionAt(particle, progress - trailStep * 3, settings);
  preparedTrails.push({
    color,
    points: [previous3, previous2, previous1, point],
  });
}

function drawPreparedTrails(state: DotsFrameState): void {
  const { context, height, preparedTrails, settings, trails, width } = state;
  const groups = new Map<DotColor, PreparedTrail[]>();
  for (const trail of preparedTrails) {
    const group = groups.get(trail.color);
    if (group) group.push(trail);
    else groups.set(trail.color, [trail]);
  }

  for (const group of groups.values()) {
    const color = group[0]!.color;
    context.strokeStyle = color.css;
    context.globalAlpha =
      color.alpha * settings.typography.opacity * trails * 0.56;
    context.beginPath();
    for (const trail of group) {
      const [previous3, previous2, previous1, point] = trail.points;
      context.moveTo(previous3.x * width, previous3.y * height);
      context.lineTo(previous2.x * width, previous2.y * height);
      context.lineTo(previous1.x * width, previous1.y * height);
      context.lineTo(point.x * width, point.y * height);
    }
    context.stroke();
  }
}

function drawPreparedDots(
  state: DotsFrameState,
  startIndex = 0,
  endIndex = state.preparedDots.length,
): void {
  const { context, glowStride, height, preparedDots, settings, width } = state;
  const groups = new Map<DotColor, PreparedDot[]>();
  for (let index = startIndex; index < endIndex; index += 1) {
    const dot = preparedDots[index]!;
    const group = groups.get(dot.color);
    if (group) group.push(dot);
    else groups.set(dot.color, [dot]);
  }

  context.globalCompositeOperation = "source-over";
  if (settings.appearance.glow > 0.002) {
    for (const group of groups.values()) {
      const color = group[0]!.color;
      context.fillStyle = color.css;
      context.globalAlpha =
        color.alpha * settings.typography.opacity * settings.appearance.glow * 0.22;
      context.beginPath();
      let hasGlowDot = false;
      for (const dot of group) {
        if (dot.index % glowStride !== 0) continue;
        hasGlowDot = true;
        context.moveTo(
          dot.point.x * width + dot.radius * (1.35 + settings.appearance.glow * 0.95),
          dot.point.y * height,
        );
        context.arc(
          dot.point.x * width,
          dot.point.y * height,
          dot.radius * (1.35 + settings.appearance.glow * 0.95),
          0,
          Math.PI * 2,
        );
      }
      if (hasGlowDot) context.fill();
    }
  }

  for (const group of groups.values()) {
    const color = group[0]!.color;
    context.fillStyle = color.css;
    context.globalAlpha =
      color.alpha * settings.typography.opacity;
    context.beginPath();
    for (const dot of group) {
      context.moveTo(dot.point.x * width + dot.radius, dot.point.y * height);
      context.arc(
        dot.point.x * width,
        dot.point.y * height,
        dot.radius,
        0,
        Math.PI * 2,
      );
    }
    context.fill();
  }
}

function finishDotsFrame(context: CanvasRenderingContext2D): void {
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
}

export function renderDotsFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: DotsSettings,
  progress: number,
  options: RenderDotsFrameOptions,
): void {
  const state = beginDotsFrame(context, width, height, settings, progress, options);
  for (const particle of state.particles) prepareParticle(state, particle);
  drawPreparedTrails(state);
  drawPreparedDots(state);
  finishDotsFrame(context);
}

export function renderDotsFrameFromPlan(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: DotsSettings,
  progress: number,
  plan: DotPlan,
  options: RenderDotsFrameOptions,
): void {
  const state = beginDotsFrame(
    context,
    width,
    height,
    settings,
    progress,
    options,
    plan,
  );
  for (const particle of state.particles) prepareParticle(state, particle);
  drawPreparedTrails(state);
  drawPreparedDots(state);
  finishDotsFrame(context);
}

function yieldToAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function renderDotsFrameInChunks(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: DotsSettings,
  progress: number,
  options: RenderDotsFrameInChunksOptions,
): Promise<void> {
  const {
    batchSize = 240,
    yieldControl = yieldToAnimationFrame,
    ...renderOptions
  } = options;
  const state = beginDotsFrame(
    context,
    width,
    height,
    settings,
    progress,
    renderOptions,
  );
  const normalizedBatchSize = Math.max(1, Math.floor(batchSize));

  for (let index = 0; index < state.particles.length; index += 1) {
    prepareParticle(state, state.particles[index]!);
    if ((index + 1) % normalizedBatchSize === 0) await yieldControl();
  }
  drawPreparedTrails(state);
  for (let index = 0; index < state.preparedDots.length; index += normalizedBatchSize) {
    drawPreparedDots(
      state,
      index,
      Math.min(state.preparedDots.length, index + normalizedBatchSize),
    );
    await yieldControl();
  }
  finishDotsFrame(context);
}

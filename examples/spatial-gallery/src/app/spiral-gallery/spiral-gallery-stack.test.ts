import { describe, expect, it } from "vitest";

import {
  advanceStackScroll,
  computeStackCardPlacement,
  computeStackRelative,
  resolveStackScrollSpring,
  stackFallCutoff,
  stackMaxVisibleDepth,
  stackMinimumSnapStrength,
  stackScrollWeightDefault,
  type StackPlacementSettings,
  type StackScrollState,
} from "./spiral-gallery-stack";

const settings: StackPlacementSettings = {
  backTiltRadians: (10 * Math.PI) / 180,
  depthStep: 0.62,
  fallDistance: 1.7,
  fallTiltRadians: (76 * Math.PI) / 180,
  focusFalloff: 0.16,
  gap: 0.24,
  minScale: 0.72,
  scaleFalloff: 0.28,
};

describe("stack layout placement", () => {
  it("keeps the active card front, straight, focused, and fully opaque", () => {
    const active = computeStackCardPlacement(0, settings);
    expect(active.position).toEqual([0, 0, 0]);
    expect(active.rotationX).toBe(0);
    expect(active.scale).toBe(1);
    expect(active.focus).toBe(1);
    expect(active.opacity).toBe(1);
  });

  it("stacks upcoming cards upward and backward with tapering scale and focus", () => {
    const near = computeStackCardPlacement(1, settings);
    const far = computeStackCardPlacement(6, settings);
    expect(near.position[1]).toBeCloseTo(settings.gap);
    expect(near.position[2]).toBeCloseTo(-settings.depthStep);
    expect(near.rotationX).toBeCloseTo(-settings.backTiltRadians);
    expect(far.position[1]).toBeGreaterThan(near.position[1]);
    expect(far.position[2]).toBeLessThan(near.position[2]);
    expect(far.focus).toBeLessThan(near.focus);
    expect(far.scale).toBeLessThan(near.scale);
    expect(far.scale).toBeGreaterThanOrEqual(settings.minScale);
    expect(near.opacity).toBe(1);
  });

  it("interpolates the incoming card between the first sliver and the front slot", () => {
    const halfway = computeStackCardPlacement(0.5, settings);
    expect(halfway.position[1]).toBeCloseTo(settings.gap * 0.5);
    expect(halfway.rotationX).toBeCloseTo(-settings.backTiltRadians * 0.5);
    expect(halfway.opacity).toBe(1);
  });

  it("hides upcoming cards beyond the bounded visible depth", () => {
    const hidden = computeStackCardPlacement(stackMaxVisibleDepth + 1, settings);
    expect(hidden.opacity).toBe(0);
  });

  it("tips the passed card over, drops it below, and fades it out", () => {
    const falling = computeStackCardPlacement(-0.8, settings);
    expect(falling.rotationX).toBeGreaterThan(0);
    expect(falling.flatten).toBeGreaterThan(0);
    expect(falling.position[1]).toBeLessThan(0);
    expect(falling.opacity).toBeGreaterThan(0);
    expect(falling.opacity).toBeLessThan(1);
    const gone = computeStackCardPlacement(-stackFallCutoff, settings);
    expect(gone.opacity).toBe(0);
  });

  it("keeps every upcoming card in the deck and reserves a short fall window", () => {
    const count = 10;
    expect(computeStackRelative(0, 0, count)).toBe(0);
    expect(computeStackRelative(9, 0, count)).toBe(9);
    expect(computeStackRelative(0, 0.4, count)).toBeCloseTo(-0.4);
    expect(computeStackRelative(1, 0.4, count)).toBeCloseTo(0.6);
    expect(computeStackRelative(0, 0.9, count)).toBeCloseTo(-0.9);
    // Once the passed card has fully faded it re-enters as the deepest sliver.
    expect(computeStackRelative(0, 1, count)).toBeCloseTo(9);
    expect(computeStackRelative(0, 2, count)).toBeCloseTo(8);
    expect(computeStackRelative(0, 0, 0)).toBe(0);
  });

  it("draws far cards first, the falling card above the slivers, and the active card last", () => {
    const far = computeStackCardPlacement(6, settings);
    const near = computeStackCardPlacement(1, settings);
    const falling = computeStackCardPlacement(-0.4, settings);
    const active = computeStackCardPlacement(0, settings);
    expect(far.renderOrder).toBeLessThan(near.renderOrder);
    expect(near.renderOrder).toBeLessThan(falling.renderOrder);
    expect(falling.renderOrder).toBeLessThan(active.renderOrder);
  });

  it("keeps the deck settling onto a whole card", () => {
    expect(stackMinimumSnapStrength).toBeGreaterThan(0);
  });
});

function settleFrames(weight: number, deltaScale = 1): number {
  const spring = resolveStackScrollSpring(weight);
  let state: StackScrollState = { offset: 0, velocity: 0 };
  for (let frame = 1; frame <= 2000; frame += 1) {
    state = advanceStackScroll(state, 1, spring, deltaScale);
    if (state.offset === 1 && state.velocity === 0) return frame;
  }
  return Number.POSITIVE_INFINITY;
}

describe("weighted deck scroll", () => {
  it("maps heavier weights to softer springs and clamps the weight range", () => {
    const light = resolveStackScrollSpring(0);
    const medium = resolveStackScrollSpring(0.55);
    const heavy = resolveStackScrollSpring(1);
    expect(medium.stiffness).toBeLessThan(light.stiffness);
    expect(heavy.stiffness).toBeLessThan(medium.stiffness);
    expect(heavy.stiffness).toBeGreaterThan(0);
    expect(resolveStackScrollSpring(-3)).toEqual(light);
    expect(resolveStackScrollSpring(7)).toEqual(heavy);
    expect(light.damping).toBeCloseTo(2 * Math.sqrt(light.stiffness));
  });

  it("ramps velocity up gradually instead of jumping on the first frame", () => {
    const spring = resolveStackScrollSpring(stackScrollWeightDefault);
    let state: StackScrollState = { offset: 0, velocity: 0 };
    const speeds: number[] = [];
    for (let frame = 0; frame < 12; frame += 1) {
      state = advanceStackScroll(state, 1, spring, 1);
      speeds.push(Math.abs(state.velocity));
    }
    // The first frame moves only a small part of the distance, and the next
    // frames keep accelerating: a weighted launch, not an instant jump.
    expect(speeds[0]!).toBeLessThan(0.08);
    expect(speeds[1]!).toBeGreaterThan(speeds[0]!);
    expect(speeds[2]!).toBeGreaterThan(speeds[1]!);
  });

  it("approaches the target without overshooting and settles exactly", () => {
    for (const weight of [0, 0.25, stackScrollWeightDefault, 0.8, 1]) {
      const spring = resolveStackScrollSpring(weight);
      let state: StackScrollState = { offset: 0, velocity: 0 };
      for (let frame = 0; frame < 2000; frame += 1) {
        state = advanceStackScroll(state, 1, spring, 1);
        expect(state.offset).toBeLessThanOrEqual(1 + 0.0001);
      }
      expect(state.offset).toBe(1);
      expect(state.velocity).toBe(0);
    }
  });

  it("takes visibly longer to settle as the weight increases", () => {
    const light = settleFrames(0);
    const medium = settleFrames(0.55);
    const heavy = settleFrames(1);
    expect(light).toBeLessThan(medium);
    expect(medium).toBeLessThan(heavy);
    expect(heavy).toBeLessThan(600);
  });

  it("stays stable at the renderer's clamped frame-scale extremes", () => {
    for (const deltaScale of [0.001, 0.5, 2]) {
      const spring = resolveStackScrollSpring(1);
      const steps = Math.ceil(400 / deltaScale);
      let state: StackScrollState = { offset: 0, velocity: 0 };
      let finite = true;
      let bounded = true;
      for (let step = 0; step < steps; step += 1) {
        state = advanceStackScroll(state, 1, spring, deltaScale);
        finite &&= Number.isFinite(state.offset) && Number.isFinite(state.velocity);
        bounded &&= state.offset >= 0 && state.offset <= 1 + 0.0001;
      }
      // The same simulated duration converges without oscillation or
      // divergence at the smallest and largest clamped frame scales.
      expect(finite).toBe(true);
      expect(bounded).toBe(true);
      expect(state.offset).toBe(1);
      expect(state.velocity).toBe(0);
    }
  });

  it("redirects an in-flight glide smoothly when the target moves back", () => {
    const spring = resolveStackScrollSpring(stackScrollWeightDefault);
    let state: StackScrollState = { offset: 0, velocity: 0 };
    for (let frame = 0; frame < 6; frame += 1) {
      state = advanceStackScroll(state, 1, spring, 1);
    }
    const outboundVelocity = state.velocity;
    expect(outboundVelocity).toBeGreaterThan(0);
    for (let frame = 0; frame < 2000; frame += 1) {
      state = advanceStackScroll(state, 0, spring, 1);
      if (state.offset === 0 && state.velocity === 0) break;
    }
    expect(state.offset).toBe(0);
    expect(state.velocity).toBe(0);
  });
});

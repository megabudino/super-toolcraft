import { afterEach, describe, expect, test, vi } from "vitest";

import {
  createToolcraftState,
  type ToolcraftState,
} from "@/toolcraft/runtime";

import { appSchema } from "../app-schema";
import { dotColorAt } from "./dots-color";
import { dotPositionAt } from "./dots-motion";
import { areDotsRenderStatesEqual } from "./dots-renderer";
import { getDotsSceneBounds } from "./dots-scene-bounds";
import { clearDotPlanCache, getDotPlan } from "./dots-shape";
import { installOpaqueMaskDocument } from "./dots-test-utils";
import {
  DOTS_DEFAULT_ACTIVE_SECONDS,
  DOTS_DEFAULT_CALM_SECONDS,
  DOTS_DEFAULT_CYCLE_SECONDS,
  dotMotionPhaseAt,
  getDotsLoopTiming,
} from "./dots-timing";
import type { DotParticle, DotsSettings } from "./dots-types";
import { readDotsSettings } from "./dots-values";

const settings: DotsSettings = {
  appearance: {
    background: "#050505",
    glow: 0.34,
    palette: {
      angle: 0,
      gradientType: "linear",
      stops: [
        { color: "#FF0000", opacity: 1, position: 0 },
        { color: "#0000FF", opacity: 1, position: 1 },
      ],
    },
    sizeMotion: 0.82,
    trails: 0.68,
  },
  canvas: { height: 1350, width: 1080 },
  motion: getDotsLoopTiming(),
  particles: {
    count: 1200,
    distribution: "mixed",
    edgeSpill: 0.55,
    launch: "ring",
    size: [4, 11],
  },
  physics: {
    attraction: 0.72,
    damping: 0.66,
    mass: 0.9,
    turbulence: 0.34,
  },
  text: "N",
  typography: {
    color: "#FFFFFF",
    family: "Inter",
    fontId: "inter",
    fontSize: 760,
    fontWeight: "700",
    letterSpacing: "normal",
    lineHeight: "none",
    opacity: 1,
    textCase: "uppercase",
  },
};

const particle: DotParticle = {
  index: 7,
  seed: 198.34,
  start: { x: 0.08, y: 0.52 },
  target: { x: 0.61, y: 0.36 },
};

afterEach(() => {
  clearDotPlanCache();
  vi.unstubAllGlobals();
});

describe("Dot Formation product", () => {
  test("does not invalidate product rendering for viewport-only state changes", () => {
    const state = createToolcraftState(appSchema, { canvas: { mode: "finite" } });
    const viewportChange = {
      ...state,
      canvas: {
        ...state.canvas,
        offset: {
          x: state.canvas.offset.x + 96,
          y: state.canvas.offset.y - 64,
        },
        zoom: state.canvas.zoom + 0.25,
      },
    };
    expect(areDotsRenderStatesEqual(state, viewportChange)).toBe(true);
    expect(
      areDotsRenderStatesEqual(state, {
        ...state,
        canvas: { ...state.canvas, mode: "infinite" },
      }),
    ).toBe(false);
    expect(
      areDotsRenderStatesEqual(state, {
        ...state,
        timeline: {
          ...state.timeline,
          currentTimeSeconds: state.timeline.currentTimeSeconds + 0.5,
        },
      }),
    ).toBe(false);
    expect(
      areDotsRenderStatesEqual(state, {
        ...state,
        values: { ...state.values, "particles.count": 1600 },
      }),
    ).toBe(false);

    const infiniteState = {
      ...state,
      canvas: { ...state.canvas, mode: "infinite" as const },
    };
    expect(
      areDotsRenderStatesEqual(infiniteState, {
        ...infiniteState,
        values: {
          ...infiniteState.values,
          "appearance.background": { hex: "#CB9672" },
        },
      }),
    ).toBe(true);
    expect(
      areDotsRenderStatesEqual(state, {
        ...state,
        values: {
          ...state.values,
          "appearance.background": { hex: "#CB9672" },
        },
      }),
    ).toBe(false);
  });

  test("Dot Formation product contract updates deterministic output", () => {
    const defaults = readDotsSettings(createToolcraftState(appSchema));

    expect(defaults.text).toBe("Hi!");
    expect(defaults.particles).toMatchObject({
      count: 1800,
      distribution: "outline",
      edgeSpill: 0.23,
      launch: "ring",
      size: [4, 11],
    });
    expect(defaults.appearance).toMatchObject({
      background: "#CFBCB0",
      glow: 0,
      sizeMotion: 0.82,
      trails: 0.68,
    });
    expect(defaults.motion).toMatchObject({
      activeSeconds: 4,
      calmSeconds: 1,
      loopDurationSeconds: 10,
      totalSeconds: 5,
    });

    expect(dotPositionAt(particle, 0, settings).x).toBeCloseTo(particle.start.x, 12);
    expect(dotPositionAt(particle, 0, settings).y).toBeCloseTo(particle.start.y, 12);
    const settled = dotPositionAt(particle, 0.65, settings);
    expect(Math.hypot(settled.x - particle.target.x, settled.y - particle.target.y)).toBeLessThan(
      0.004,
    );
    const seam = dotPositionAt(particle, 1, settings);
    expect(seam.x).toBeCloseTo(particle.start.x, 8);
    expect(seam.y).toBeCloseTo(particle.start.y, 8);

    const stronger = dotPositionAt(particle, 0.12, {
      ...settings,
      physics: { ...settings.physics, attraction: 1.45 },
    });
    const defaultMotion = dotPositionAt(particle, 0.12, settings);
    expect(stronger).not.toEqual(defaultMotion);

    const first = dotColorAt(settings.appearance.palette, 0.2, 0.5, "#FFFFFF", 17);
    expect(dotColorAt(settings.appearance.palette, 0.2, 0.5, "#FFFFFF", 17)).toEqual(
      first,
    );

    installOpaqueMaskDocument();
    const state = createToolcraftState(appSchema, {
      canvas: { mode: "infinite" },
    });
    const sceneBounds = getDotsSceneBounds({
      state,
      timeRange: {
        endSeconds: state.timeline.durationSeconds,
        startSeconds: 0,
      },
    });
    expect(sceneBounds).toHaveLength(1);
    expect(sceneBounds[0]?.width).toBeGreaterThan(0);
    expect(sceneBounds[0]?.height).toBeGreaterThan(0);
  });

  test("derives adjustable active and calm phases without breaking continuity", () => {
    const epsilon = 0.000_001;
    const timing = getDotsLoopTiming(6, 2, 8);
    const customSettings = { ...settings, motion: timing };
    const targetDistance = (progress: number): number => {
      const point = dotPositionAt(particle, progress, customSettings);
      return Math.hypot(
        point.x - particle.target.x,
        point.y - particle.target.y,
      );
    };

    expect(DOTS_DEFAULT_CYCLE_SECONDS).toBeCloseTo(10, 12);
    expect(DOTS_DEFAULT_ACTIVE_SECONDS).toBe(4);
    expect(DOTS_DEFAULT_CALM_SECONDS).toBe(1);
    expect(timing.formationSeconds).toBeCloseTo(4.5, 12);
    expect(timing.calmTimelineSeconds).toBeCloseTo(2, 12);
    expect(timing.releaseSeconds).toBeCloseTo(1.5, 12);
    expect(timing.totalSeconds).toBeCloseTo(8, 12);
    expect(dotMotionPhaseAt(timing.formationEnd - epsilon, timing)).toBe(
      "formation",
    );
    expect(dotMotionPhaseAt(timing.formationEnd, timing)).toBe("rest");
    expect(dotMotionPhaseAt(timing.calmEnd - epsilon, timing)).toBe("rest");
    expect(dotMotionPhaseAt(timing.calmEnd, timing)).toBe("release");

    expect(targetDistance(timing.formationEnd - epsilon)).toBeLessThan(
      0.000_000_01,
    );
    expect(targetDistance(timing.formationEnd)).toBeCloseTo(0, 12);
    expect(targetDistance(timing.formationEnd + epsilon)).toBeLessThan(
      0.000_000_01,
    );
    expect(targetDistance(timing.calmEnd - epsilon)).toBeLessThan(
      0.000_000_01,
    );
    expect(targetDistance(timing.calmEnd)).toBeCloseTo(0, 12);
    expect(targetDistance(timing.calmEnd + epsilon)).toBeLessThan(
      0.000_000_01,
    );
  });

  test("keeps calm animation speed fixed when only calm duration changes", () => {
    const shortTiming = getDotsLoopTiming(4, 1, 5);
    const longTiming = getDotsLoopTiming(4, 3, 7);
    const progressAtCalmSecond = (
      timing: ReturnType<typeof getDotsLoopTiming>,
      elapsedSeconds: number,
    ): number =>
      timing.formationEnd +
      (elapsedSeconds / timing.calmTimelineSeconds) *
        (timing.calmEnd - timing.formationEnd);

    for (const elapsedSeconds of [0.1, 0.35, 0.6]) {
      const shortPoint = dotPositionAt(
        particle,
        progressAtCalmSecond(shortTiming, elapsedSeconds),
        { ...settings, motion: shortTiming },
      );
      const longPoint = dotPositionAt(
        particle,
        progressAtCalmSecond(longTiming, elapsedSeconds),
        { ...settings, motion: longTiming },
      );
      expect(shortPoint.x).toBeCloseTo(longPoint.x, 12);
      expect(shortPoint.y).toBeCloseTo(longPoint.y, 12);
    }
  });

  test("assigns deterministic discrete colors from the editable bank", () => {
    const colorBank = {
      angle: 12,
      gradientType: "angular" as const,
      stops: [
        { color: "#FF4F22", opacity: 1, position: 0 },
        { color: "#FF8A1E", opacity: 1, position: 0.1 },
        { color: "#F1F20D", opacity: 1, position: 0.2 },
        { color: "#5C771A", opacity: 1, position: 0.3 },
        { color: "#0B5A86", opacity: 1, position: 0.4 },
        { color: "#8DB5C8", opacity: 1, position: 0.5 },
        { color: "#887CE8", opacity: 1, position: 0.6 },
        { color: "#F3A0C3", opacity: 1, position: 0.7 },
        { color: "#B28F73", opacity: 1, position: 0.8 },
        { color: "#D7D9D3", opacity: 1, position: 0.9 },
        { color: "#FF4F22", opacity: 1, position: 1 },
      ],
    };
    const allowed = new Set([
      "rgb(255 79 34)",
      "rgb(255 138 30)",
      "rgb(241 242 13)",
      "rgb(92 119 26)",
      "rgb(11 90 134)",
      "rgb(141 181 200)",
      "rgb(136 124 232)",
      "rgb(243 160 195)",
      "rgb(178 143 115)",
      "rgb(215 217 211)",
    ]);
    const assigned = Array.from({ length: 160 }, (_, index) =>
      dotColorAt(colorBank, 0.48, 0.52, "#FFFFFF", index * 13.71).css,
    );

    expect(new Set(assigned).size).toBeGreaterThanOrEqual(8);
    expect(assigned.every((color) => allowed.has(color))).toBe(true);
  });

  test("reads the runtime color-control object used for the background", () => {
    const state = {
      canvas: { size: { height: 1350, width: 1080 } },
      values: { "appearance.background": { hex: "#101820" } },
    } as unknown as ToolcraftState;

    expect(readDotsSettings(state).appearance.background).toBe("#101820");
  });

  test("keeps all high-count targets distinct and extends the existing plan", () => {
    installOpaqueMaskDocument();

    for (const distribution of ["fill", "outline", "mixed"] as const) {
      clearDotPlanCache();
      const fullPlan = getDotPlan({
        ...settings,
        particles: { ...settings.particles, count: 2400, distribution },
      });
      const distinctTargets = new Set(
        fullPlan.particles.map(({ target }) => `${target.x.toFixed(8)}:${target.y.toFixed(8)}`),
      );
      expect(fullPlan.particles).toHaveLength(2400);
      expect(distinctTargets.size).toBe(2400);
    }

    clearDotPlanCache();
    const smaller = getDotPlan({
      ...settings,
      particles: { ...settings.particles, count: 1200 },
    });
    const larger = getDotPlan({
      ...settings,
      particles: { ...settings.particles, count: 2400 },
    });
    expect(
      larger.particles.slice(0, smaller.particles.length).map(({ seed, target }) => ({
        seed,
        target,
      })),
    ).toEqual(smaller.particles.map(({ seed, target }) => ({ seed, target })));
  });

  test("lets settled circles spill beyond strict mask bounds deterministically", () => {
    installOpaqueMaskDocument();
    const strictSettings: DotsSettings = {
      ...settings,
      particles: { ...settings.particles, edgeSpill: 0 },
    };
    const looseSettings: DotsSettings = {
      ...settings,
      particles: { ...settings.particles, edgeSpill: 1 },
    };

    const strict = getDotPlan(strictSettings);
    const strictBounds = strict.particles.reduce(
      (bounds, { target }) => ({
        maxX: Math.max(bounds.maxX, target.x),
        maxY: Math.max(bounds.maxY, target.y),
        minX: Math.min(bounds.minX, target.x),
        minY: Math.min(bounds.minY, target.y),
      }),
      { maxX: 0, maxY: 0, minX: 1, minY: 1 },
    );
    const loose = getDotPlan(looseSettings);
    const outsideStrictBounds = loose.particles.filter(
      ({ target }) =>
        target.x < strictBounds.minX - 0.00001 ||
        target.x > strictBounds.maxX + 0.00001 ||
        target.y < strictBounds.minY - 0.00001 ||
        target.y > strictBounds.maxY + 0.00001,
    );

    expect(outsideStrictBounds.length).toBeGreaterThan(40);
    expect(getDotPlan(looseSettings)).toEqual(loose);
  });
});

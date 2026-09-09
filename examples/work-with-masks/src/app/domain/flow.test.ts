import { describe, expect, it } from "vitest";
import { createToolcraftState } from "@/toolcraft/runtime";
import { appSchema } from "../app-schema";
import { heroEnvironmentKey, heroStructureKey, readHeroParams } from "./hero-params";
import { evaluateHeroFlow, flowDefaults, readHeroFlow } from "./flow";
import { waveDefaultValues } from "./wave-default-values";

const state = createToolcraftState(appSchema);
const base = readHeroParams(state);

describe("Hero Flow", () => {
  it("preserves authored scene settings while moving ribs monotonically", () => {
    const original = structuredClone(base);
    for (const direction of ["toward", "away"] as const) {
      for (const travel of [1, 3, 6]) {
        const flow = { ...flowDefaults, direction, travel };
        for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
          const frame = evaluateHeroFlow(base, flow, progress);
          expect(frame.structure.travel).toBeCloseTo((direction === "toward" ? 1 : -1) * travel * base.structure.spacing * progress, 10);
          expect({ ...frame, structure: { ...frame.structure, travel: 0 } }).toEqual(original);
        }
      }
    }
    expect(base).toEqual(original);
    expect(evaluateHeroFlow(base, flowDefaults, 0)).toBe(base);
  });

  it("retains every imported scene default and stored authoring value", () => {
    for (const [target, value] of Object.entries(waveDefaultValues)) {
      if (!target.startsWith("motion.")) expect(state.values[target], target).toEqual(value);
    }
    const saved = createToolcraftState(appSchema, {
      values: { "camera.roll": 17, "rib.width": 2.15, "light.color": "#123456", "wave.frame.position": { x: 0.2, y: -0.1 } },
      timeline: { durationSeconds: 40, currentTimeSeconds: 3, isPlaying: false },
    });
    const before = structuredClone(saved);
    evaluateHeroFlow(readHeroParams(saved), readHeroFlow(saved), 0.5);
    expect(saved).toEqual(before);
    expect(saved.timeline.durationSeconds).toBe(40);
  });

  it("closes the optional glow orbit without changing authored light", () => {
    const flow = { ...flowDefaults, glowOrbit: 2 };
    const frames = [0, 0.125, 0.25, 0.375, 1].map(p => evaluateHeroFlow(base, flow, p));
    expect(frames[4]!.haze.glowPosition).toEqual(frames[0]!.haze.glowPosition);
    expect(frames[1]!.haze.glowPosition.y).toBeGreaterThan(frames[0]!.haze.glowPosition.y);
    expect(frames[2]!.haze.glowPosition.x).toBeLessThan(frames[0]!.haze.glowPosition.x);
    expect(frames[3]!.haze.glowPosition.y).toBeLessThan(frames[0]!.haze.glowPosition.y);
    for (const frame of frames) expect(frame.light).toBe(base.light);
  });

  it("keeps flow settings stable when the loop duration changes", () => {
    for (const durationSeconds of [6, 10, 12, 15]) {
      const resized = { ...state, timeline: { ...state.timeline, durationSeconds } };
      expect(readHeroFlow(resized)).toEqual(flowDefaults);
      expect(evaluateHeroFlow(base, readHeroFlow(resized), 0.5)).toEqual(evaluateHeroFlow(base, flowDefaults, 0.5));
    }
  });

  it("leaves the frame static at zero travel and orbit", () => {
    for (const progress of [0, 0.25, 0.75, 1]) {
      expect(evaluateHeroFlow(base, { ...flowDefaults, travel: 0 }, progress)).toBe(base);
    }
  });

  it("reads Flow defaults and keeps retained resource keys independent of time", () => {
    expect(readHeroFlow(state)).toEqual(flowDefaults);
    expect(state.timeline.durationSeconds).toBe(8);
    for (const progress of [0, 0.2, 0.9, 1]) {
      const frame = evaluateHeroFlow(base, flowDefaults, progress);
      expect(heroStructureKey(frame)).toBe(heroStructureKey(base));
      expect(heroEnvironmentKey(frame)).toBe(heroEnvironmentKey(base));
    }
  });
});

import { createToolcraftState } from "@/toolcraft/runtime";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { appSchema } from "../app-schema";
import {
  getDotsSceneBounds,
  getDotsWorldOrigin,
} from "./dots-scene-bounds";
import { clearDotPlanCache } from "./dots-shape";
import { installOpaqueMaskDocument } from "./dots-test-utils";

beforeEach(() => {
  installOpaqueMaskDocument();
});

afterEach(() => {
  clearDotPlanCache();
  vi.unstubAllGlobals();
});

function createInfiniteState(
  values: Record<string, unknown> = {},
  currentTimeSeconds = 2.5,
) {
  return createToolcraftState(appSchema, {
    canvas: { mode: "infinite" },
    timeline: { currentTimeSeconds },
    values,
  });
}

function getOnlyBounds(
  result: ReturnType<typeof getDotsSceneBounds>,
) {
  expect(result).toHaveLength(1);
  return result[0]!;
}

describe("Dots Animation scene bounds", () => {
  it("returns deterministic positive world-space bounds for the current frame", () => {
    const state = createInfiniteState();
    const first = getOnlyBounds(getDotsSceneBounds({ state }));
    const second = getOnlyBounds(getDotsSceneBounds({ state }));

    expect(first).toEqual(second);
    expect(first.width).toBeGreaterThan(0);
    expect(first.height).toBeGreaterThan(0);
    expect(first.width).not.toBe(state.canvas.size.width);
    expect(first.height).not.toBe(state.canvas.size.height);
    expect(first.x).toBeLessThan(0);
    expect(first.y).toBeLessThan(0);
  });

  it("uses a centered origin only while the runtime canvas is infinite", () => {
    const infinite = createInfiniteState();
    const finite = createToolcraftState(appSchema, { canvas: { mode: "finite" } });

    expect(getDotsWorldOrigin(infinite)).toEqual({ x: -540, y: -675 });
    expect(getDotsWorldOrigin(finite)).toEqual({ x: 0, y: 0 });
  });

  it("unions one stable envelope across the requested video time range", () => {
    const state = createInfiniteState();
    const still = getOnlyBounds(getDotsSceneBounds({ state }));
    const video = getOnlyBounds(
      getDotsSceneBounds({
        state,
        timeRange: {
          endSeconds: state.timeline.durationSeconds,
          startSeconds: 0,
        },
      }),
    );

    expect(video.width).toBeGreaterThanOrEqual(still.width);
    expect(video.height).toBeGreaterThanOrEqual(still.height);
    expect(getDotsSceneBounds({
      state,
      timeRange: {
        endSeconds: state.timeline.durationSeconds,
        startSeconds: 0,
      },
    })).toEqual([video]);
  });

  it("never shrinks bounds when visible glow and trails increase", () => {
    const minimal = getOnlyBounds(
      getDotsSceneBounds({
        state: createInfiniteState({
          "appearance.glow": 0,
          "appearance.trails": 0,
        }),
      }),
    );
    const expanded = getOnlyBounds(
      getDotsSceneBounds({
        state: createInfiniteState({
          "appearance.glow": 1,
          "appearance.trails": 1,
        }),
      }),
    );

    expect(expanded.x).toBeLessThanOrEqual(minimal.x);
    expect(expanded.y).toBeLessThanOrEqual(minimal.y);
    expect(expanded.x + expanded.width).toBeGreaterThanOrEqual(
      minimal.x + minimal.width,
    );
    expect(expanded.y + expanded.height).toBeGreaterThanOrEqual(
      minimal.y + minimal.height,
    );
  });
});

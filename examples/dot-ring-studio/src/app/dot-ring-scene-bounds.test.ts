import { createToolcraftState } from "@/toolcraft/runtime";
import { describe, expect, it } from "vitest";

import { appSchema } from "./app-schema";
import { getDefaultDotRingAudioProfile } from "./dot-ring-audio";
import {
  createDotRingSceneBoundsSnapshot,
  getDotRingSceneBoundsForAudio,
  getDotRingSceneBoundsForSnapshot,
  getDotRingWorldOrigin,
  unionDotRingSceneRects,
} from "./dot-ring-scene-bounds";

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
  result: ReturnType<typeof getDotRingSceneBoundsForAudio>,
) {
  expect(result).toHaveLength(1);
  return result[0]!;
}

describe("Dot Ring Studio scene bounds", () => {
  it("returns deterministic positive world-space bounds", () => {
    const state = createInfiniteState();
    const audio = getDefaultDotRingAudioProfile();
    const first = getOnlyBounds(getDotRingSceneBoundsForAudio({ state }, audio));
    const second = getOnlyBounds(getDotRingSceneBoundsForAudio({ state }, audio));

    expect(first).toEqual(second);
    expect(first.width).toBeGreaterThan(0);
    expect(first.height).toBeGreaterThan(0);
    expect(first.x).toBeLessThan(0);
    expect(first.y).toBeLessThan(0);
  });

  it("preserves exact bounds through the serializable worker snapshot", () => {
    const state = createInfiniteState({
      "ring.density": 96,
      "ring.rows": 4,
    });
    const audio = getDefaultDotRingAudioProfile();
    const direct = getDotRingSceneBoundsForAudio({ state }, audio);
    const snapshot = getDotRingSceneBoundsForSnapshot(
      { snapshot: createDotRingSceneBoundsSnapshot(state) },
      audio,
    );

    expect(snapshot).toEqual(direct);
  });

  it("unions immediate and completed envelopes without losing either edge", () => {
    expect(
      unionDotRingSceneRects(
        { height: 80, width: 100, x: -40, y: -30 },
        { height: 120, width: 70, x: -10, y: -60 },
      ),
    ).toEqual({
      height: 120,
      width: 100,
      x: -40,
      y: -60,
    });
  });

  it("centers product coordinates only in infinity mode", () => {
    const infinite = createInfiniteState();
    const finite = createToolcraftState(appSchema, {
      canvas: { mode: "finite" },
    });

    expect(getDotRingWorldOrigin(infinite)).toEqual({ x: -512, y: -512 });
    expect(getDotRingWorldOrigin(finite)).toEqual({ x: 0, y: 0 });
  });

  it("unions one stable envelope over the video time range", () => {
    const state = createInfiniteState();
    const audio = getDefaultDotRingAudioProfile();
    const still = getOnlyBounds(getDotRingSceneBoundsForAudio({ state }, audio));
    const video = getOnlyBounds(
      getDotRingSceneBoundsForAudio(
        {
          state,
          timeRange: {
            endSeconds: state.timeline.durationSeconds,
            startSeconds: 0,
          },
        },
        audio,
      ),
    );

    expect(video.width).toBeGreaterThanOrEqual(still.width);
    expect(video.height).toBeGreaterThanOrEqual(still.height);
  });

  it("does not shrink when visible amplitude increases", () => {
    const audio = getDefaultDotRingAudioProfile();
    const minimal = getOnlyBounds(
      getDotRingSceneBoundsForAudio(
        {
          state: createInfiniteState({
            "wave.affectedAmplitude": 0,
            "wave.calmAmplitude": 0,
          }),
        },
        audio,
      ),
    );
    const expanded = getOnlyBounds(
      getDotRingSceneBoundsForAudio(
        {
          state: createInfiniteState({
            "wave.affectedAmplitude": 160,
            "wave.calmAmplitude": 64,
          }),
        },
        audio,
      ),
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

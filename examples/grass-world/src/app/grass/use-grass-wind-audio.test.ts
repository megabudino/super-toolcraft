import { describe, expect, it, vi } from "vitest";

import {
  GrassWindAudioController,
  grassWindAudioFadeInMs,
  grassWindAudioFadeOutMs,
  grassWindAudioVolume,
  isGrassWindAudioActive,
} from "./use-grass-wind-audio";

function createHarness() {
  let now = 0;
  let nextFrame = 1;
  const callbacks = new Map<number, FrameRequestCallback>();
  const audio = {
    loop: true,
    pause: vi.fn(function pause() {
      audio.paused = true;
    }),
    paused: true,
    play: vi.fn(async function play() {
      audio.paused = false;
    }),
    preload: "auto",
    volume: 0,
  };
  const states: string[] = [];
  const controller = new GrassWindAudioController(
    audio as unknown as HTMLAudioElement,
    {
      onStateChange: (state) => states.push(state),
      scheduler: {
        cancelFrame: (frame) => callbacks.delete(frame),
        now: () => now,
        requestFrame: (callback) => {
          const frame = nextFrame++;
          callbacks.set(frame, callback);
          return frame;
        },
      },
    },
  );
  const advance = (durationMs: number): void => {
    now += durationMs;
    const pending = [...callbacks.entries()];
    callbacks.clear();
    for (const [, callback] of pending) callback(now);
  };
  return { advance, audio, controller, states };
}

describe("grass wind audio", () => {
  it("gates hover audio to Simulation", () => {
    expect(isGrassWindAudioActive("simulation", true)).toBe(true);
    expect(isGrassWindAudioActive("simulation", false)).toBe(false);
    expect(isGrassWindAudioActive("wind", true)).toBe(false);
    expect(isGrassWindAudioActive("sway", true)).toBe(false);
    expect(isGrassWindAudioActive("static", true)).toBe(false);
  });

  it("Hover wind audio follows Simulation terrain presence", async () => {
    const { advance, audio, controller, states } = createHarness();
    controller.setActive(true);
    await Promise.resolve();
    advance(grassWindAudioFadeInMs);
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.volume).toBeCloseTo(grassWindAudioVolume);
    expect(states).toContain("playing");

    controller.setActive(false);
    advance(grassWindAudioFadeOutMs);
    expect(audio.volume).toBe(0);
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(states.at(-1)).toBe("idle");
  });

  it("retries a blocked hover after a trusted unlock", async () => {
    const { audio, controller, states } = createHarness();
    audio.play.mockRejectedValueOnce(
      new DOMException("Blocked", "NotAllowedError"),
    );
    controller.setActive(true);
    await Promise.resolve();
    expect(states.at(-1)).toBe("blocked");

    controller.unlock();
    await Promise.resolve();
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(states.at(-1)).toBe("fading-in");
  });

  it("mutes at zero and resumes an active hover at the new gain", async () => {
    const { advance, audio, controller } = createHarness();
    controller.setActive(true);
    await Promise.resolve();
    advance(grassWindAudioFadeInMs);

    controller.setVolume(0);
    expect(audio.volume).toBe(0);
    expect(audio.paused).toBe(true);

    controller.setVolume(0.25);
    await Promise.resolve();
    advance(grassWindAudioFadeInMs);
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(audio.volume).toBeCloseTo(0.25);
  });
});

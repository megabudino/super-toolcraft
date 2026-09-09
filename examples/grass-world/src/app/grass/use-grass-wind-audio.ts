import * as React from "react";

import mountainWindGustsUrl from "./assets/audio/mountain-wind-gusts.mp3?url";
import type { GrassWindMode } from "./grass-defaults";

export const grassWindAudioFadeInMs = 420;
export const grassWindAudioFadeOutMs = 650;
export const grassWindAudioVolume = 0.6;
export const grassWindAudioVolumeChangeMs = 160;

export type GrassWindAudioState =
  "blocked" | "fading-in" | "fading-out" | "idle" | "playing" | "starting";

type GrassWindAudioScheduler = Readonly<{
  cancelFrame: (frame: number) => void;
  now: () => number;
  requestFrame: (callback: FrameRequestCallback) => number;
}>;

type GrassWindAudioControllerOptions = Readonly<{
  onStateChange?: (state: GrassWindAudioState) => void;
  scheduler?: GrassWindAudioScheduler;
}>;

const defaultScheduler: GrassWindAudioScheduler = {
  cancelFrame: (frame) => cancelAnimationFrame(frame),
  now: () => performance.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
};

function clampVolume(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function isGrassWindAudioActive(
  mode: GrassWindMode,
  pointerWindActive: boolean,
): boolean {
  return mode === "simulation" && pointerWindActive;
}

export class GrassWindAudioController {
  private active = false;
  private disposed = false;
  private fadeInMs = grassWindAudioFadeInMs;
  private fadeFrame = 0;
  private fadeOutMs = grassWindAudioFadeOutMs;
  private maximumVolume = grassWindAudioVolume;
  private playPending = false;
  private state: GrassWindAudioState = "idle";
  private unlocked = false;

  constructor(
    private readonly audio: HTMLAudioElement,
    private readonly options: GrassWindAudioControllerOptions = {},
  ) {}

  setActive(active: boolean): void {
    if (this.disposed || this.active === active) return;
    this.active = active;
    if (active) {
      if (this.maximumVolume === 0) {
        this.audio.pause();
        this.audio.volume = 0;
        this.setState("idle");
        return;
      }
      this.startPlayback();
      return;
    }
    this.fadeOut();
  }

  unlock(): void {
    if (this.disposed || this.unlocked || this.playPending) return;
    this.startPlayback();
  }

  setTransitionDurations(fadeInMs: number, fadeOutMs: number): void {
    this.fadeInMs = Math.max(50, fadeInMs);
    this.fadeOutMs = Math.max(50, fadeOutMs);
  }

  setVolume(volume: number): void {
    const nextVolume = clampVolume(volume);
    if (this.maximumVolume === nextVolume) return;
    this.maximumVolume = nextVolume;
    if (!this.active) return;
    if (nextVolume === 0) {
      this.cancelFade();
      this.audio.pause();
      this.audio.volume = 0;
      this.setState("idle");
      return;
    }
    if (this.audio.paused) {
      this.startPlayback();
      return;
    }
    this.fadeTo(nextVolume, grassWindAudioVolumeChangeMs, "fading-in");
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelFade();
    this.audio.pause();
    this.audio.volume = 0;
  }

  private setState(state: GrassWindAudioState): void {
    if (this.state === state) return;
    this.state = state;
    this.options.onStateChange?.(state);
  }

  private startPlayback(): void {
    if (this.disposed || this.playPending) return;
    this.cancelFade();
    this.playPending = true;
    this.setState(this.active ? "starting" : "idle");
    this.audio.volume = this.active ? clampVolume(this.audio.volume) : 0;
    void this.audio.play().then(
      () => {
        this.playPending = false;
        this.unlocked = true;
        if (this.disposed || !this.active || this.maximumVolume === 0) {
          this.audio.pause();
          this.audio.volume = 0;
          this.setState("idle");
          return;
        }
        this.fadeTo(this.maximumVolume, this.fadeInMs, "fading-in");
      },
      () => {
        this.playPending = false;
        this.setState(this.active ? "blocked" : "idle");
      },
    );
  }

  private fadeOut(): void {
    if (this.audio.paused || this.audio.volume <= 0.001) {
      this.cancelFade();
      this.audio.pause();
      this.audio.volume = 0;
      this.setState("idle");
      return;
    }
    this.fadeTo(0, this.fadeOutMs, "fading-out");
  }

  private fadeTo(
    targetVolume: number,
    durationMs: number,
    transitionState: GrassWindAudioState,
  ): void {
    this.cancelFade();
    const scheduler = this.options.scheduler ?? defaultScheduler;
    const startTime = scheduler.now();
    const startVolume = this.audio.volume;
    const target = clampVolume(targetVolume);
    this.setState(transitionState);

    const update = (time: number): void => {
      if (this.disposed) return;
      const progress = Math.min(
        1,
        Math.max(0, (time - startTime) / durationMs),
      );
      const eased = progress * progress * (3 - 2 * progress);
      this.audio.volume = clampVolume(
        startVolume + (target - startVolume) * eased,
      );
      if (progress < 1) {
        this.fadeFrame = scheduler.requestFrame(update);
        return;
      }
      this.fadeFrame = 0;
      if (target === 0) {
        this.audio.pause();
        this.setState("idle");
      } else {
        this.setState("playing");
      }
    };

    this.fadeFrame = scheduler.requestFrame(update);
  }

  private cancelFade(): void {
    if (this.fadeFrame === 0) return;
    (this.options.scheduler ?? defaultScheduler).cancelFrame(this.fadeFrame);
    this.fadeFrame = 0;
  }
}

export function useGrassWindAudio(
  options: Readonly<{
    enabled: boolean;
    fadeInMs: number;
    fadeOutMs: number;
    hostRef: React.RefObject<HTMLDivElement | null>;
    volume: number;
  }>,
): void {
  const enabledRef = React.useRef(options.enabled);
  const fadeInMsRef = React.useRef(options.fadeInMs);
  const fadeOutMsRef = React.useRef(options.fadeOutMs);
  const volumeRef = React.useRef(options.volume);
  const syncRef = React.useRef<(() => void) | null>(null);
  enabledRef.current = options.enabled;
  fadeInMsRef.current = options.fadeInMs;
  fadeOutMsRef.current = options.fadeOutMs;
  volumeRef.current = options.volume;

  React.useEffect(() => {
    syncRef.current?.();
  }, [options.enabled, options.fadeInMs, options.fadeOutMs, options.volume]);

  React.useEffect(() => {
    const host = options.hostRef.current;
    if (!host) return;
    const audio = new Audio(mountainWindGustsUrl);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    const controller = new GrassWindAudioController(audio, {
      onStateChange: (state) => {
        host.dataset.grassWindAudioState = state;
      },
    });

    const sync = (): void => {
      const active =
        enabledRef.current && host.dataset.grassPointerWindActive === "true";
      host.dataset.grassWindAudioActive = String(active);
      host.dataset.grassWindAudioVolume = volumeRef.current.toFixed(3);
      controller.setTransitionDurations(
        fadeInMsRef.current,
        fadeOutMsRef.current,
      );
      controller.setVolume(volumeRef.current);
      controller.setActive(active);
    };
    syncRef.current = sync;
    const observer = new MutationObserver(sync);
    observer.observe(host, {
      attributeFilter: ["data-grass-pointer-wind-active"],
      attributes: true,
    });
    const unlock = (): void => controller.unlock();
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    host.dataset.grassWindAudioActive = "false";
    host.dataset.grassWindAudioState = "idle";
    host.dataset.grassWindAudioVolume = volumeRef.current.toFixed(3);
    sync();

    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      syncRef.current = null;
      controller.dispose();
      audio.removeAttribute("src");
      audio.load();
      host.dataset.grassWindAudioActive = "false";
      host.dataset.grassWindAudioState = "idle";
      host.dataset.grassWindAudioVolume = "0.000";
    };
  }, [options.hostRef]);
}

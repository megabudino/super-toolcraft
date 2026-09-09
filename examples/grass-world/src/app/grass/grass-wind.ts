import type { GrassSettings } from "./grass-settings-types";
import type { GrassWindMode } from "./grass-defaults";
import type { GrassWindUniformSettings } from "./grass-wind-material";

export const GRASS_LAWN_WIND_RESPONSE = 0.45;

const MAX_INTERACTIVE_FRAME_DELTA_SECONDS = 0.1;

export type GrassWindFrameSettings = Readonly<{
  activation: number;
  ambientStrength: number;
  directionAngle: number;
  directionVector: readonly [number, number];
  flow: number;
  gustCycles: number;
  gustWidth: number;
  noiseDetail: number;
  noiseScale: number;
  noiseStrength: number;
  pointerActive: boolean;
  progress: number;
  seed: number;
  strength: number;
  swayCycles: number;
  swayVariation: number;
}>;

function cleanDirectionComponent(value: number): number {
  if (Math.abs(value) < 1e-10) return 0;
  if (Math.abs(value - 1) < 1e-10) return 1;
  if (Math.abs(value + 1) < 1e-10) return -1;
  return value;
}

function normalizeAngle(angleDegrees: number): number {
  return ((angleDegrees % 360) + 360) % 360;
}

function shortestAngleDelta(fromDegrees: number, toDegrees: number): number {
  return ((toDegrees - fromDegrees + 540) % 360) - 180;
}

function exponentialAlpha(deltaSeconds: number, responseSeconds: number): number {
  if (deltaSeconds <= 0) return 0;
  return 1 - Math.exp(-deltaSeconds / Math.max(0.001, responseSeconds));
}

export function getGrassWindDirectionVector(
  angleDegrees: number,
): readonly [number, number] {
  const radians = (normalizeAngle(angleDegrees) * Math.PI) / 180;
  return [
    cleanDirectionComponent(Math.cos(radians)),
    cleanDirectionComponent(Math.sin(radians)),
  ];
}

export function interpolateGrassWindAngle(
  currentDegrees: number,
  targetDegrees: number,
  deltaSeconds: number,
  responseSeconds: number,
): number {
  const delta = shortestAngleDelta(currentDegrees, targetDegrees);
  return normalizeAngle(
    currentDegrees + delta * exponentialAlpha(deltaSeconds, responseSeconds),
  );
}

export function approachGrassWindActivation(
  current: number,
  target: number,
  deltaSeconds: number,
  responseSeconds: number,
): number {
  const next =
    current +
    (target - current) * exponentialAlpha(deltaSeconds, responseSeconds);
  return Math.max(0, Math.min(1, next));
}

export class GrassWindFrameController {
  private activation = 0;
  private currentDirectionAngle = 0;
  private directionInitialized = false;
  private lastFrameTimeMs: number | null = null;
  private pointerActive = false;
  private pointerDirectionAngle: number | null = null;
  private previousMode: GrassWindMode | null = null;

  setPointerState(active: boolean, directionAngle?: number): void {
    this.pointerActive = active;
    if (directionAngle !== undefined && Number.isFinite(directionAngle)) {
      this.pointerDirectionAngle = normalizeAngle(directionAngle);
    }
  }

  resetInteraction(): void {
    this.pointerActive = false;
    this.pointerDirectionAngle = null;
  }

  resolve(
    wind: GrassSettings["wind"],
    progress: number,
    purpose: "export" | "interactive-preview",
    nowMs = performance.now(),
  ): GrassWindFrameSettings {
    const previousTimeMs = this.lastFrameTimeMs;
    this.lastFrameTimeMs = nowMs;
    const deltaSeconds =
      previousTimeMs === null
        ? 0
        : Math.min(
            MAX_INTERACTIVE_FRAME_DELTA_SECONDS,
            Math.max(0, (nowMs - previousTimeMs) / 1_000),
          );
    const modeChanged = this.previousMode !== wind.mode;
    this.previousMode = wind.mode;
    if (modeChanged) {
      this.activation = wind.mode === "wind" ? 1 : 0;
    }
    if (!this.directionInitialized) {
      this.currentDirectionAngle = wind.directionAngle;
      this.directionInitialized = true;
    }

    const acceptsPointer = wind.mode === "wind" || wind.mode === "simulation";
    const pointerDirectionActive = acceptsPointer && this.pointerActive;
    const directionTarget =
      pointerDirectionActive && this.pointerDirectionAngle !== null
        ? this.pointerDirectionAngle
        : wind.directionAngle;

    if (purpose === "export") {
      this.currentDirectionAngle = normalizeAngle(wind.directionAngle);
    } else if (pointerDirectionActive) {
      this.currentDirectionAngle = interpolateGrassWindAngle(
        this.currentDirectionAngle,
        directionTarget,
        deltaSeconds,
        wind.directionResponse,
      );
    } else if (wind.mode === "simulation" && this.activation > 0.001) {
      this.currentDirectionAngle = interpolateGrassWindAngle(
        this.currentDirectionAngle,
        wind.directionAngle,
        deltaSeconds,
        wind.directionResponse,
      );
    } else {
      this.currentDirectionAngle = normalizeAngle(wind.directionAngle);
    }

    if (wind.mode === "static" || wind.mode === "sway") {
      this.activation = 0;
    } else if (wind.mode === "wind" || purpose === "export") {
      this.activation = 1;
    } else {
      const target = pointerDirectionActive ? 1 : 0;
      this.activation = approachGrassWindActivation(
        this.activation,
        target,
        deltaSeconds,
        target > this.activation ? wind.rampUp : wind.release,
      );
    }

    const ambientStrength = wind.mode === "static" ? 0 : wind.swayStrength;
    const frameProgress = wind.mode === "static" ? 0 : progress;
    return {
      activation: this.activation,
      ambientStrength,
      directionAngle: this.currentDirectionAngle,
      directionVector: getGrassWindDirectionVector(
        this.currentDirectionAngle,
      ),
      flow: wind.flow,
      gustCycles: wind.gustCycles,
      gustWidth: wind.gustWidth,
      noiseDetail: wind.noiseDetail,
      noiseScale: wind.noiseScale,
      noiseStrength: wind.noiseStrength,
      pointerActive: pointerDirectionActive,
      progress: frameProgress,
      seed: wind.seed,
      strength: wind.strength,
      swayCycles: wind.swayCycles,
      swayVariation: wind.swayVariation,
    };
  }
}

export function createGrassWindUniformSettings(
  wind: GrassWindFrameSettings,
  response: number,
): GrassWindUniformSettings {
  return {
    activation: wind.activation,
    ambientStrength: wind.ambientStrength,
    direction: wind.directionVector,
    flow: wind.flow,
    gustCycles: wind.gustCycles,
    gustWidth: wind.gustWidth,
    noiseDetail: wind.noiseDetail,
    noiseScale: wind.noiseScale,
    noiseStrength: wind.noiseStrength,
    progress: wind.progress,
    response,
    seed: wind.seed,
    strength: wind.strength,
    swayCycles: wind.swayCycles,
    swayVariation: wind.swayVariation,
  };
}

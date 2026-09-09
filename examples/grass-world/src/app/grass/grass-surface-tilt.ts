const MAX_TILT_FRAME_DELTA_SECONDS = 0.1;
const SURFACE_TILT_SETTLE_EPSILON_RADIANS = 0.00005;

export const grassSurfaceTiltMaximumDegrees = 20;

const MAX_SURFACE_TILT_RADIANS =
  (grassSurfaceTiltMaximumDegrees * Math.PI) / 180;

export const grassSurfaceTiltPointerHoldMs = 120;

export type GrassSurfaceTiltSettings = Readonly<{
  downDegrees: number;
  leftDegrees: number;
  rightDegrees: number;
  smoothingSeconds: number;
  upDegrees: number;
}>;

export type GrassSurfaceTiltSnapshot = Readonly<{
  active: boolean;
  magnitudeDegrees: number;
  rotationX: number;
  rotationZ: number;
  settled: boolean;
}>;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export class GrassSurfaceTiltTransform {
  private renderedX = 0;
  private renderedZ = 0;
  private x = 0;
  private z = 0;

  set(rotationX: number, rotationZ: number): void {
    this.x = clamp(
      Number.isFinite(rotationX) ? rotationX : 0,
      -MAX_SURFACE_TILT_RADIANS,
      MAX_SURFACE_TILT_RADIANS,
    );
    this.z = clamp(
      Number.isFinite(rotationZ) ? rotationZ : 0,
      -MAX_SURFACE_TILT_RADIANS,
      MAX_SURFACE_TILT_RADIANS,
    );
  }

  resolve(
    purpose: "export" | "interactive-preview",
  ): readonly [number, number] {
    this.renderedX = purpose === "interactive-preview" ? this.x : 0;
    this.renderedZ = purpose === "interactive-preview" ? this.z : 0;
    return [this.renderedX, this.renderedZ];
  }

  getRenderDiagnostics(): Readonly<{
    surfaceTiltX: number;
    surfaceTiltZ: number;
  }> {
    return {
      surfaceTiltX: this.renderedX,
      surfaceTiltZ: this.renderedZ,
    };
  }
}

export function publishGrassSurfaceTiltDiagnostics(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  rotationX: number,
  rotationZ: number,
): readonly [number, number] {
  const degrees = [
    (rotationX * 180) / Math.PI,
    (rotationZ * 180) / Math.PI,
  ] as const;
  const serialized = JSON.stringify(
    degrees.map((value) => Number(value.toFixed(3))),
  );
  canvas.dataset.grassSurfaceTiltRotation = serialized;
  host.dataset.grassSurfaceTiltRotation = serialized;
  return degrees;
}

function smoothingAlpha(deltaSeconds: number, durationSeconds: number): number {
  if (deltaSeconds <= 0) return 0;
  return 1 - Math.exp((-4.6 * deltaSeconds) / Math.max(0.001, durationSeconds));
}

function normalizeDirection(
  direction: readonly [number, number],
): readonly [number, number] {
  const length = Math.hypot(direction[0], direction[1]);
  if (length <= 0.000001) return [0, 0];
  return [direction[0] / length, direction[1] / length];
}

export class GrassSurfaceTiltController {
  private currentX = 0;
  private currentZ = 0;
  private direction: readonly [number, number] = [0, 0];
  private lastFrameAtMs: number | null = null;
  private motionHoldSeconds = 0;

  setMotion(direction: readonly [number, number], nowMs: number): void {
    if (!Number.isFinite(nowMs)) return;
    const normalized = normalizeDirection(direction);
    if (normalized[0] === 0 && normalized[1] === 0) return;
    this.direction = normalized;
    this.motionHoldSeconds = grassSurfaceTiltPointerHoldMs / 1_000;
  }

  leave(): void {
    this.motionHoldSeconds = 0;
  }

  reset(): GrassSurfaceTiltSnapshot {
    this.currentX = 0;
    this.currentZ = 0;
    this.direction = [0, 0];
    this.lastFrameAtMs = null;
    this.motionHoldSeconds = 0;
    return this.snapshot(false, true);
  }

  resolve(
    settings: GrassSurfaceTiltSettings,
    nowMs: number,
  ): GrassSurfaceTiltSnapshot {
    const safeNowMs = Number.isFinite(nowMs) ? nowMs : 0;
    const previousFrameAtMs = this.lastFrameAtMs;
    this.lastFrameAtMs = safeNowMs;
    const deltaSeconds =
      previousFrameAtMs === null
        ? 1 / 60
        : clamp(
            (safeNowMs - previousFrameAtMs) / 1_000,
            0,
            MAX_TILT_FRAME_DELTA_SECONDS,
          );
    const motionActive = this.motionHoldSeconds > 0;
    const verticalDegrees = clamp(
      this.direction[1] < 0 ? settings.upDegrees : settings.downDegrees,
      0,
      grassSurfaceTiltMaximumDegrees,
    );
    const horizontalDegrees = clamp(
      this.direction[0] < 0 ? settings.leftDegrees : settings.rightDegrees,
      0,
      grassSurfaceTiltMaximumDegrees,
    );
    const targetX = motionActive
      ? this.direction[1] * ((verticalDegrees * Math.PI) / 180)
      : 0;
    const targetZ = motionActive
      ? -this.direction[0] * ((horizontalDegrees * Math.PI) / 180)
      : 0;
    const active = motionActive && Math.hypot(targetX, targetZ) > 0;
    const alpha = smoothingAlpha(deltaSeconds, settings.smoothingSeconds);
    this.currentX += (targetX - this.currentX) * alpha;
    this.currentZ += (targetZ - this.currentZ) * alpha;
    this.motionHoldSeconds = Math.max(
      0,
      this.motionHoldSeconds - deltaSeconds,
    );

    const targetMagnitude = Math.hypot(targetX, targetZ);
    const currentMagnitude = Math.hypot(this.currentX, this.currentZ);
    const settled =
      targetMagnitude <= SURFACE_TILT_SETTLE_EPSILON_RADIANS &&
      currentMagnitude <= SURFACE_TILT_SETTLE_EPSILON_RADIANS;
    if (settled) {
      this.currentX = 0;
      this.currentZ = 0;
    }
    return this.snapshot(active, settled);
  }

  private snapshot(
    active: boolean,
    settled: boolean,
  ): GrassSurfaceTiltSnapshot {
    return {
      active,
      magnitudeDegrees:
        (Math.hypot(this.currentX, this.currentZ) * 180) / Math.PI,
      rotationX: this.currentX,
      rotationZ: this.currentZ,
      settled,
    };
  }
}

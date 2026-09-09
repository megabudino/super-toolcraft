const MIN_POINTER_DIRECTION_DISTANCE = 0.01;
const MIN_SCREEN_POINTER_DIRECTION_DISTANCE = 2;

export type GrassPointerPoint = readonly [number, number];

export type GrassPointerDirectionSnapshot = Readonly<{
  active: boolean;
  angle: number;
  direction: readonly [number, number];
}>;

export class GrassPointerInputController {
  private activeTouchPointerId: number | null = null;

  beginTouch(pointerId: number, terrainHit: boolean): boolean {
    if (!terrainHit || this.activeTouchPointerId !== null) return false;
    this.activeTouchPointerId = pointerId;
    return true;
  }

  acceptsTouch(pointerId: number): boolean {
    return this.activeTouchPointerId === pointerId;
  }

  endTouch(pointerId: number): boolean {
    if (!this.acceptsTouch(pointerId)) return false;
    this.activeTouchPointerId = null;
    return true;
  }

  getActiveTouchPointerId(): number | null {
    return this.activeTouchPointerId;
  }

  hasActiveTouch(): boolean {
    return this.activeTouchPointerId !== null;
  }

  reset(): void {
    this.activeTouchPointerId = null;
  }
}

export function getGrassScreenPointerDirection(
  previousPoint: GrassPointerPoint | null,
  point: GrassPointerPoint,
): GrassPointerPoint {
  if (!previousPoint) return [0, 0];
  const deltaX = point[0] - previousPoint[0];
  const deltaY = point[1] - previousPoint[1];
  const distance = Math.hypot(deltaX, deltaY);
  return distance >= MIN_SCREEN_POINTER_DIRECTION_DISTANCE
    ? [deltaX / distance, deltaY / distance]
    : [0, 0];
}

function normalizeDirection(
  x: number,
  y: number,
  fallback: readonly [number, number],
): readonly [number, number] {
  const length = Math.hypot(x, y);
  return length > 0.000001 ? [x / length, y / length] : fallback;
}

function directionAngle(direction: readonly [number, number]): number {
  return ((Math.atan2(direction[1], direction[0]) * 180) / Math.PI + 360) % 360;
}

export class GrassPointerDirectionController {
  private direction: readonly [number, number] = [1, 0];
  private previousPoint: readonly [number, number] | null = null;

  sample(point: readonly [number, number]): GrassPointerDirectionSnapshot {
    const previousPoint = this.previousPoint;
    this.previousPoint = point;
    if (!previousPoint) return this.snapshot(false);
    const deltaX = point[0] - previousPoint[0];
    const deltaY = point[1] - previousPoint[1];
    if (Math.hypot(deltaX, deltaY) < MIN_POINTER_DIRECTION_DISTANCE) {
      return this.snapshot(false);
    }
    this.direction = normalizeDirection(deltaX, deltaY, this.direction);
    return this.snapshot(true);
  }

  leave(): GrassPointerDirectionSnapshot {
    this.previousPoint = null;
    return this.snapshot(false);
  }

  reset(): GrassPointerDirectionSnapshot {
    this.direction = [1, 0];
    this.previousPoint = null;
    return this.snapshot(false);
  }

  snapshot(active = false): GrassPointerDirectionSnapshot {
    return {
      active,
      angle: directionAngle(this.direction),
      direction: this.direction,
    };
  }
}

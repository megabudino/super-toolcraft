import type { HeroMask, HeroMaskRecord } from "../domain/masks";

export type MaskPoint = Readonly<{ x: number; y: number }>;
export type MaskHandleKind = "move" | "rotate" | "size" | "stretch";

export type ArtboardMask = Readonly<{
  center: MaskPoint;
  cos: number;
  enabled: boolean;
  feather: number;
  opacity: number;
  rx: number;
  ry: number;
  sin: number;
}>;

function rotate(point: MaskPoint, cos: number, sin: number): MaskPoint {
  return {
    x: cos * point.x - sin * point.y,
    y: sin * point.x + cos * point.y,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snap(value: number, step: number): number {
  const precision = Math.max(0, String(step).split(".")[1]?.length ?? 0);
  return Number((Math.round(value / step) * step).toFixed(precision));
}

function cleanFloat(value: number): number {
  return Number(value.toFixed(9));
}

function wrapDegrees(value: number): number {
  const wrapped = ((((value + 180) % 360) + 360) % 360) - 180;
  return wrapped === -180 ? 180 : wrapped;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function cssToArtboard(point: MaskPoint, cssHeight: number): MaskPoint {
  return { x: point.x / cssHeight, y: (cssHeight - point.y) / cssHeight };
}

export function artboardToCss(point: MaskPoint, cssHeight: number): MaskPoint {
  return { x: point.x * cssHeight, y: (1 - point.y) * cssHeight };
}

export function toArtboardMask(mask: HeroMask, aspect: number, fullHeight: number): ArtboardMask {
  const theta = (mask.rotation * Math.PI) / 180;
  return {
    center: {
      x: ((mask.position.x + 1) / 2) * aspect,
      y: (mask.position.y + 1) / 2,
    },
    cos: Math.cos(theta),
    enabled: mask.enabled,
    feather: Math.max(mask.feather * mask.radius, 0.75 / fullHeight),
    opacity: mask.opacity,
    rx: mask.radius,
    ry: mask.radius * mask.stretch,
    sin: Math.sin(theta),
  };
}

export function maskDistance(mask: ArtboardMask, point: MaskPoint): number {
  const offset = {
    x: point.x - mask.center.x,
    y: point.y - mask.center.y,
  };
  const local = rotate(offset, mask.cos, -mask.sin);
  const gx = local.x / mask.rx;
  const gy = local.y / mask.ry;
  const g = Math.hypot(gx, gy);
  if (g < 1e-4) return -Math.min(mask.rx, mask.ry);
  const gradient = Math.max(
    Math.hypot(local.x / (mask.rx * mask.rx), local.y / (mask.ry * mask.ry)),
    1e-6,
  );
  return ((g - 1) * g) / gradient;
}

export function maskCoverage(mask: ArtboardMask, point: MaskPoint): number {
  if (!mask.enabled) return 0;
  const distance = maskDistance(mask, point);
  return mask.opacity * (1 - smoothstep(-mask.feather, mask.feather, distance));
}

export function unionCoverage(masks: readonly ArtboardMask[], point: MaskPoint): number {
  const enabled = masks.filter((mask) => mask.enabled);
  if (enabled.length === 0) return 1;
  let outside = 1;
  for (const mask of enabled) outside *= 1 - maskCoverage(mask, point);
  return 1 - outside;
}

export function getMaskPinPositions(
  mask: ArtboardMask,
  rotateOffset: number,
): Readonly<Record<MaskHandleKind, MaskPoint>> {
  const at = (local: MaskPoint): MaskPoint => {
    const offset = rotate(local, mask.cos, mask.sin);
    return { x: mask.center.x + offset.x, y: mask.center.y + offset.y };
  };
  return {
    move: mask.center,
    rotate: at({ x: mask.rx + rotateOffset, y: 0 }),
    size: at({ x: mask.rx, y: 0 }),
    stretch: at({ x: 0, y: mask.ry }),
  };
}

export function applyMaskHandleDrag({
  aspect,
  currentPoint,
  kind,
  record,
  startPoint,
}: Readonly<{
  aspect: number;
  currentPoint: MaskPoint;
  kind: MaskHandleKind;
  record: HeroMaskRecord;
  startPoint: MaskPoint;
}>): HeroMaskRecord {
  const mask = toArtboardMask(
    {
      ...record,
      feather: record.feather / 100,
      opacity: record.opacity / 100,
      radius: record.radius / 100,
    },
    aspect,
    Number.POSITIVE_INFINITY,
  );
  const local = (point: MaskPoint) =>
    rotate({ x: point.x - mask.center.x, y: point.y - mask.center.y }, mask.cos, -mask.sin);

  if (kind === "move") {
    return {
      ...record,
      position: {
        x: clamp(
          cleanFloat(record.position.x + ((currentPoint.x - startPoint.x) / aspect) * 2),
          -1.5,
          1.5,
        ),
        y: clamp(cleanFloat(record.position.y + (currentPoint.y - startPoint.y) * 2), -1.5, 1.5),
      },
    };
  }

  if (kind === "size") {
    const start = local(startPoint);
    const current = local(currentPoint);
    const direction = Math.sign(start.x) || 1;
    const radius = (mask.rx + (current.x - start.x) * direction) * 100;
    return { ...record, radius: snap(clamp(radius, 2, 150), 0.5) };
  }

  if (kind === "stretch") {
    const start = local(startPoint);
    const current = local(currentPoint);
    const direction = Math.sign(start.y) || 1;
    const ry = mask.ry + (current.y - start.y) * direction;
    return {
      ...record,
      stretch: snap(clamp(ry / mask.rx, 0.2, 5), 0.01),
    };
  }

  const angle = (point: MaskPoint) => Math.atan2(point.y - mask.center.y, point.x - mask.center.x);
  const delta = angle(currentPoint) - angle(startPoint);
  const shortestDelta = Math.atan2(Math.sin(delta), Math.cos(delta));
  return {
    ...record,
    rotation: snap(wrapDegrees(record.rotation + (shortestDelta * 180) / Math.PI), 0.5),
  };
}

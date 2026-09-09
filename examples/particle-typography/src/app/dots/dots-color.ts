import type { DotGradient } from "./dots-types";

type Rgb = Readonly<{ b: number; g: number; r: number }>;
export type DotColor = Readonly<{ alpha: number; css: string }>;
export type DotColorSampler = (
  x: number,
  y: number,
  particleSeed?: number,
) => DotColor;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function parseHex(value: string): Rgb {
  const normalized = value.trim().replace(/^#/, "");
  const hex = normalized.length === 3
    ? normalized.split("").map((part) => `${part}${part}`).join("")
    : normalized.padEnd(6, "0").slice(0, 6);
  return {
    b: Number.parseInt(hex.slice(4, 6), 16) || 0,
    g: Number.parseInt(hex.slice(2, 4), 16) || 0,
    r: Number.parseInt(hex.slice(0, 2), 16) || 0,
  };
}

function mix(from: number, to: number, amount: number): number {
  return Math.round(from + (to - from) * amount);
}

function hashUnit(value: number): number {
  const hashed = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return hashed - Math.floor(hashed);
}

function gradientCoordinate(
  gradient: DotGradient,
  x: number,
  y: number,
  cosine: number,
  radians: number,
  sine: number,
): number {
  const centeredX = x - 0.5;
  const centeredY = y - 0.5;
  if (gradient.gradientType === "radial") {
    return clamp01(Math.hypot(centeredX, centeredY) * 1.45);
  }
  if (gradient.gradientType === "angular") {
    const angle = Math.atan2(centeredY, centeredX) - radians;
    return ((angle / (Math.PI * 2)) % 1 + 1) % 1;
  }
  if (gradient.gradientType === "diamond") {
    return clamp01((Math.abs(centeredX) + Math.abs(centeredY)) * 1.08);
  }
  return clamp01(0.5 + centeredX * cosine + centeredY * sine);
}

export function createDotColorSampler(
  gradient: DotGradient,
  tint: string,
): DotColorSampler {
  const radians = (gradient.angle * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const tintRgb = parseHex(tint);
  const tintAmount =
    tintRgb.r === 255 && tintRgb.g === 255 && tintRgb.b === 255 ? 0 : 0.14;
  const preparedStops = gradient.stops.map((stop) => {
    const selectedRgb = parseHex(stop.color);
    const r = mix(selectedRgb.r, tintRgb.r, tintAmount);
    const g = mix(selectedRgb.g, tintRgb.g, tintAmount);
    const b = mix(selectedRgb.b, tintRgb.b, tintAmount);
    return {
      alpha: stop.opacity,
      css: `rgb(${r} ${g} ${b})`,
      position: stop.position,
    } as const;
  });

  return (x, y, particleSeed = 0) => {
    const spatialPhase =
      gradientCoordinate(gradient, x, y, cosine, radians, sine) * 0.18;
    const coordinate =
      (hashUnit(particleSeed * 0.017 + 19.7) + spatialPhase) % 1;
    let low = 0;
    let high = preparedStops.length - 1;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (preparedStops[middle]!.position < coordinate) low = middle + 1;
      else high = middle;
    }
    const right = preparedStops[low]!;
    const left = preparedStops[Math.max(0, low - 1)]!;
    const selected =
      Math.abs(left.position - coordinate) <=
      Math.abs(right.position - coordinate)
        ? left
        : right;
    return selected;
  };
}

export function dotColorAt(
  gradient: DotGradient,
  x: number,
  y: number,
  tint: string,
  particleSeed = 0,
): DotColor {
  return createDotColorSampler(gradient, tint)(x, y, particleSeed);
}

import type { ToolcraftState } from "@/toolcraft/runtime";

import type {
  DotDistribution,
  DotFontStyle,
  DotGradient,
  DotGradientStop,
  DotLaunch,
  DotsSettings,
} from "./dots-types";
import { getDotsLoopTiming } from "./dots-timing";

const fallbackStops: readonly DotGradientStop[] = [
  { color: "#FF2D20", opacity: 1, position: 0 },
  { color: "#FF8A1E", opacity: 1, position: 0.18 },
  { color: "#FFE23B", opacity: 1, position: 0.34 },
  { color: "#49E0B7", opacity: 1, position: 0.52 },
  { color: "#42B8FF", opacity: 1, position: 0.68 },
  { color: "#9370E8", opacity: 1, position: 0.84 },
  { color: "#FF2D20", opacity: 1, position: 1 },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function numberValue(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function colorValue(value: unknown, fallback: string): string {
  if (typeof value === "string") return stringValue(value, fallback);
  if (!isRecord(value)) return fallback;
  return stringValue(value.hex, fallback);
}

function readRange(value: unknown): readonly [number, number] {
  if (!Array.isArray(value) || value.length < 2) return [4, 11];
  const lower = clamp(numberValue(value[0], 4), 1, 24);
  const upper = clamp(numberValue(value[1], 11), 1, 24);
  return lower <= upper ? [lower, upper] : [upper, lower];
}

function fontFamilyFromId(fontId: string): string {
  return fontId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Inter";
}

function readTypography(value: unknown): DotFontStyle {
  const input = isRecord(value) ? value : {};
  const fontId = stringValue(input.fontId, "inter");
  const letterSpacingValues = [
    "tight",
    "tighter",
    "normal",
    "wide",
    "wider",
    "widest",
  ] as const;
  const lineHeightValues = [
    "loose",
    "none",
    "normal",
    "relaxed",
    "snug",
    "tight",
  ] as const;
  const textCaseValues = [
    "capitalize",
    "lowercase",
    "original",
    "titleCase",
    "uppercase",
  ] as const;
  const letterSpacing = letterSpacingValues.includes(
    input.letterSpacing as (typeof letterSpacingValues)[number],
  )
    ? (input.letterSpacing as DotFontStyle["letterSpacing"])
    : "normal";
  const lineHeight = lineHeightValues.includes(
    input.lineHeight as (typeof lineHeightValues)[number],
  )
    ? (input.lineHeight as DotFontStyle["lineHeight"])
    : "none";
  const textCase = textCaseValues.includes(
    input.textCase as (typeof textCaseValues)[number],
  )
    ? (input.textCase as DotFontStyle["textCase"])
    : "uppercase";

  return {
    color: stringValue(input.color, "#FFFFFF"),
    family: fontFamilyFromId(fontId),
    fontId,
    fontSize: clamp(numberValue(input.fontSize, 760), 1, 2400),
    fontWeight: stringValue(input.fontWeight, "700"),
    letterSpacing,
    lineHeight,
    opacity: clamp(numberValue(input.opacity, 100) / 100, 0, 1),
    textCase,
  };
}

function parsePosition(value: unknown): number {
  if (typeof value === "number") return clamp(value, 0, 1);
  const parsed = Number.parseFloat(String(value ?? "0"));
  return clamp(Number.isFinite(parsed) ? parsed / 100 : 0, 0, 1);
}

function readGradient(value: unknown): DotGradient {
  const input = isRecord(value) ? value : {};
  const gradientTypes = ["angular", "diamond", "linear", "radial"] as const;
  const gradientType = gradientTypes.includes(
    input.gradientType as (typeof gradientTypes)[number],
  )
    ? (input.gradientType as DotGradient["gradientType"])
    : "angular";
  const stops = Array.isArray(input.stops)
    ? input.stops
        .filter(isRecord)
        .map((stop) => ({
          color: stringValue(stop.color, "#FFFFFF"),
          opacity: clamp(numberValue(stop.opacity, 100) / 100, 0, 1),
          position: parsePosition(stop.position),
        }))
        .sort((left, right) => left.position - right.position)
    : [];

  return {
    angle: numberValue(input.angle, 12),
    gradientType,
    stops: stops.length >= 2 ? stops : fallbackStops,
  };
}

function readDistribution(value: unknown): DotDistribution {
  return value === "fill" || value === "outline" || value === "mixed"
    ? value
    : "outline";
}

function readLaunch(value: unknown): DotLaunch {
  return value === "grid" || value === "ring" || value === "scatter"
    ? value
    : "ring";
}

export function readDotsSettings(state: ToolcraftState): DotsSettings {
  const values = state.values;
  const activeDuration = clamp(
    numberValue(values["motion.activeDuration"], 4),
    1,
    12,
  );
  const calmDuration = clamp(
    numberValue(values["motion.calmDuration"], 1),
    0.25,
    6,
  );
  return {
    appearance: {
      background: colorValue(values["appearance.background"], "#CFBCB0"),
      glow: clamp(numberValue(values["appearance.glow"], 0), 0, 1),
      palette: readGradient(values["appearance.palette"]),
      sizeMotion: clamp(numberValue(values["appearance.sizeMotion"], 0.82), 0, 1.5),
      trails: clamp(numberValue(values["appearance.trails"], 0.68), 0, 1),
    },
    canvas: {
      height: Math.max(1, state.canvas.size.height),
      width: Math.max(1, state.canvas.size.width),
    },
    motion: getDotsLoopTiming(
      activeDuration,
      calmDuration,
      state.timeline?.durationSeconds ?? activeDuration + calmDuration,
    ),
    particles: {
      count: Math.round(clamp(numberValue(values["particles.count"], 1800), 240, 2400)),
      distribution: readDistribution(values["particles.distribution"]),
      edgeSpill: clamp(numberValue(values["particles.edgeSpill"], 23) / 100, 0, 1),
      launch: readLaunch(values["particles.launch"]),
      size: readRange(values["particles.size"]),
    },
    physics: {
      attraction: clamp(numberValue(values["physics.attraction"], 0.72), 0.1, 1.5),
      damping: clamp(numberValue(values["physics.damping"], 0.66), 0.05, 1),
      mass: clamp(numberValue(values["physics.mass"], 0.9), 0.2, 3),
      turbulence: clamp(numberValue(values["physics.turbulence"], 0.34), 0, 1.2),
    },
    text: stringValue(values["text.content"], "Hi!").slice(0, 80),
    typography: readTypography(values["text.typography"]),
  };
}

import type { ToolcraftState } from "@/toolcraft/runtime";

import type {
  DotRingColorMode,
  DotRingColorStop,
  DotRingSettings,
  DotRingVideoSettings,
  DotRingWaveFormula,
} from "./dot-ring-types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readColorHex(value: unknown, fallback: string): string {
  if (typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value)) {
    return value;
  }

  if (isRecord(value) && typeof value.hex === "string") {
    return readColorHex(value.hex, fallback);
  }

  return fallback;
}

function readVideoFormat(value: unknown): DotRingVideoSettings["format"] {
  return value === "webm" ? "webm" : "mp4";
}

function readVideoResolution(
  value: unknown,
): DotRingVideoSettings["resolution"] {
  return value === "4k" ? "4k" : "current";
}

function readColorMode(value: unknown): DotRingColorMode {
  if (value === "conic" || value === "energy" || value === "rows") {
    return value;
  }

  return "spread";
}

function readWaveFormula(value: unknown): DotRingWaveFormula {
  if (
    value === "audio" ||
    value === "complex" ||
    value === "pulse" ||
    value === "turbulent"
  ) {
    return value;
  }

  return "organic";
}

const defaultPalette = [
  "#dfff1a",
  "#8cff3a",
  "#f4ff5a",
  "#b8ff2e",
  "#ecff68",
] as const;

function readDotRingPalette(state: ToolcraftState): DotRingColorStop[] {
  return defaultPalette.map((fallback, index) => ({
    color: readColorHex(state.values[`ring.color${index + 1}`], fallback),
    opacity: 100,
    position: index / Math.max(1, defaultPalette.length - 1),
  }));
}

export function getDotRingSettingsFromState(
  state: ToolcraftState,
): DotRingSettings {
  return {
    affectedAmplitude: clamp(
      readNumber(state.values["wave.affectedAmplitude"], 72),
      0,
      160,
    ),
    background: readColorHex(
      state.values["appearance.background"],
      "#0C1A32",
    ),
    calmAmplitude: clamp(
      readNumber(state.values["wave.calmAmplitude"], 12),
      0,
      64,
    ),
    colorMode: readColorMode(state.values["ring.colorMode"]),
    colorSpread: clamp(
      readNumber(state.values["ring.colorSpread"], 34),
      0,
      100,
    ),
    density: Math.round(
      clamp(readNumber(state.values["ring.density"], 160), 48, 280),
    ),
    dotSize: clamp(readNumber(state.values["ring.dotSize"], 1), 0.6, 1.8),
    formula: readWaveFormula(state.values["wave.formula"]),
    globalRotationSpeed: clamp(
      readNumber(state.values["wave.globalRotationSpeed"], 0.12),
      -0.5,
      0.5,
    ),
    glow: clamp(readNumber(state.values["ring.glow"], 0), 0, 100),
    palette: readDotRingPalette(state),
    radius: clamp(readNumber(state.values["ring.radius"], 315), 180, 420),
    rotationSpeed: clamp(
      readNumber(state.values["wave.rotationSpeed"], 2),
      0,
      4,
    ),
    rowEchoSeconds:
      clamp(readNumber(state.values["wave.rowEcho"], 0), 0, 400) / 1000,
    rows: Math.round(
      clamp(readNumber(state.values["ring.rows"], 1), 1, 12),
    ),
    sectorAngle: clamp(
      readNumber(state.values["wave.sectorAngle"], 108),
      30,
      180,
    ),
    sizeResponse: clamp(
      readNumber(state.values["ring.sizeResponse"], 0),
      0,
      100,
    ),
    speed: clamp(readNumber(state.values["wave.speed"], 1), 0.2, 1.6),
  };
}

export function getDotRingVideoSettingsFromState(
  state: ToolcraftState,
): DotRingVideoSettings {
  return {
    format: readVideoFormat(state.values["export.video.format"]),
    resolution: readVideoResolution(state.values["export.video.resolution"]),
  };
}

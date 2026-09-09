import {
  ditherAsciiGlyphSets,
  ditherAsciiModes,
  ditherBlendModes,
  ditherDuotonePresets,
  ditherEffectStyles,
  type DitherImageExportFormat,
  type DitherRenderSettings,
} from "./dither-types";
import { clamp } from "./dither-utils";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringOption<const T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function asHexColor(value: unknown, fallback: string): string {
  if (typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value)) {
    return value;
  }

  if (isRecord(value) && typeof value.hex === "string" && /^#[0-9a-f]{3,8}$/i.test(value.hex)) {
    return value.hex;
  }

  return fallback;
}

export function getDitherSettingsFromValues(
  values: Record<string, unknown>,
): DitherRenderSettings {
  return {
    asciiCustomGlyphs: String(values["effect.ascii.customGlyphs"] ?? ""),
    asciiGlyphs: asStringOption(values["effect.ascii.glyphs"], ditherAsciiGlyphSets, "classic"),
    asciiMode: asStringOption(values["effect.ascii.mode"], ditherAsciiModes, "uniform"),
    background: asHexColor(values["appearance.background"], "#050505"),
    blend: asStringOption(values["effect.layer.blend"], ditherBlendModes, "source-over"),
    density: clamp(asNumber(values["effect.density"], 5), 1, 10),
    duotoneBase: asHexColor(values["duotone.base"], "#090A13"),
    duotonePixels: asHexColor(values["duotone.pixels"], "#F7C66C"),
    duotonePreset: asStringOption(values["duotone.preset"], ditherDuotonePresets, "off"),
    exposure: clamp(asNumber(values["effect.exposure"], 100), 0, 200),
    fill: clamp(asNumber(values["effect.fill"], 50), 0, 100),
    finishGlow: clamp(asNumber(values["finish.glow"], 0), 0, 100),
    finishGrain: clamp(asNumber(values["finish.grain"], 0), 0, 100),
    finishNoise: clamp(asNumber(values["finish.noise"], 0), 0, 100),
    finishVignette: clamp(asNumber(values["finish.vignette"], 0), 0, 100),
    imageFormat: asStringOption(values["export.image.format"], ["jpg", "png"], "png"),
    imageResolution: asStringOption(
      values["export.image.resolution"],
      ["2k", "4k", "8k", "current"],
      "4k",
    ),
    includeBackground: asBoolean(values["export.includeBackground"], true),
    layerOpacity: clamp(asNumber(values["effect.layer.opacity"], 100), 0, 100),
    scatter: clamp(asNumber(values["effect.scatter"], 0), 0, 100),
    seed: Math.round(clamp(asNumber(values["effect.seed"], 37), 1, 999)),
    size: clamp(asNumber(values["effect.size"], 10), 1, 100),
    style: asStringOption(values["effect.style"], ditherEffectStyles, "dither-blend"),
    toneBrightness: clamp(asNumber(values["tone.brightness"], 100), 0, 200),
    toneContrast: clamp(asNumber(values["tone.contrast"], 100), 0, 200),
    toneHue: clamp(asNumber(values["tone.hue"], 0), -180, 180),
    toneSaturation: clamp(asNumber(values["tone.saturation"], 100), 0, 200),
  };
}

export function getDitherExportMimeType(format: DitherImageExportFormat): string {
  return format === "jpg" ? "image/jpeg" : "image/png";
}

export function getDitherExportExtension(format: DitherImageExportFormat): string {
  return format === "jpg" ? "jpg" : "png";
}


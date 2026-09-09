import type { ToolcraftFontPickerValueSchema } from "@/toolcraft/runtime";
import { getFontPickerFontById } from "@/toolcraft/ui";

import { heroPreviewDefaults, heroPreviewTargets } from "./hero-preview-controls";

const letterSpacingValues = ["tight", "tighter", "normal", "wide", "wider", "widest"] as const;
const lineHeightValues = ["loose", "none", "normal", "relaxed", "snug", "tight"] as const;
const textCaseValues = ["capitalize", "lowercase", "original", "titleCase", "uppercase"] as const;

type CompleteFontPickerValue = Required<ToolcraftFontPickerValueSchema>;

export type HeroPreviewTypography = CompleteFontPickerValue & {
  family: string;
  stylesheetHref?: string;
};

export type HeroPreviewSettings = {
    headingTypography: HeroPreviewTypography;
    layout: {
      copyToLogos: number;
      logosToMedia: number;
      topInset: number;
    };
    right: {
      bodyTypography: HeroPreviewTypography;
      leadTypography: HeroPreviewTypography;
      offsetY: number;
      paragraphGap: number;
    };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readEnumValue<Value extends string>(
  value: unknown,
  allowed: readonly Value[],
  fallback: Value,
): Value {
  if (typeof value !== "string") return fallback;
  return allowed.find((candidate) => candidate === value) ?? fallback;
}

function readNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function buildGoogleFontStylesheetHref(family: string, weights: readonly string[]): string {
  const familyToken = family.trim().replace(/\s+/g, "+");
  const weightAxis = Array.from(new Set(weights)).join(";");
  return `https://fonts.googleapis.com/css2?family=${familyToken}:wght@${weightAxis}&display=swap`;
}

function readTypography(
  value: unknown,
  fallback: CompleteFontPickerValue,
): HeroPreviewTypography {
  const record = isRecord(value) ? value : {};
  const requestedFontId = typeof record.fontId === "string" ? record.fontId : fallback.fontId;
  const font = getFontPickerFontById(requestedFontId) ?? getFontPickerFontById(fallback.fontId);
  const fontId = font?.id ?? fallback.fontId;
  const requestedWeight =
    typeof record.fontWeight === "string" ? record.fontWeight : fallback.fontWeight;
  const fontWeight = font?.weights.includes(requestedWeight)
    ? requestedWeight
    : font?.weights.includes(fallback.fontWeight)
      ? fallback.fontWeight
      : (font?.weights[0] ?? fallback.fontWeight);
  const color =
    typeof record.color === "string" && /^#[\dA-Fa-f]{6}$/.test(record.color)
      ? record.color.toUpperCase()
      : fallback.color;
  const family = font?.family ?? (fontId === "figtree" ? "Figtree" : "Inter");

  return {
    color,
    family,
    fontId,
    fontSize: readNumber(record.fontSize, fallback.fontSize, 1, 400),
    fontWeight,
    letterSpacing: readEnumValue(record.letterSpacing, letterSpacingValues, fallback.letterSpacing),
    lineHeight: readEnumValue(record.lineHeight, lineHeightValues, fallback.lineHeight),
    opacity: readNumber(record.opacity, fallback.opacity, 0, 100),
    ...(fontId === "inter" || fontId === "figtree"
      ? {}
      : { stylesheetHref: buildGoogleFontStylesheetHref(family, font?.weights ?? [fontWeight]) }),
    textCase: readEnumValue(record.textCase, textCaseValues, fallback.textCase),
  };
}

export function createHeroPreviewSettings(
  values: Readonly<Record<string, unknown>>,
): HeroPreviewSettings {
  return {
      headingTypography: readTypography(
        values[heroPreviewTargets.headingTypography],
        heroPreviewDefaults.headingTypography,
      ),
      layout: {
        copyToLogos: readNumber(
          values[heroPreviewTargets.copyToLogos],
          heroPreviewDefaults.copyToLogos,
          0,
          480,
        ),
        logosToMedia: readNumber(
          values[heroPreviewTargets.logosToMedia],
          heroPreviewDefaults.logosToMedia,
          0,
          240,
        ),
        topInset: readNumber(
          values[heroPreviewTargets.topInset],
          heroPreviewDefaults.topInset,
          0,
          320,
        ),
      },
      right: {
        bodyTypography: readTypography(
          values[heroPreviewTargets.bodyTypography],
          heroPreviewDefaults.bodyTypography,
        ),
        leadTypography: readTypography(
          values[heroPreviewTargets.leadTypography],
          heroPreviewDefaults.leadTypography,
        ),
        offsetY: readNumber(
          values[heroPreviewTargets.offsetY],
          heroPreviewDefaults.offsetY,
          -120,
          240,
        ),
        paragraphGap: readNumber(
          values[heroPreviewTargets.paragraphGap],
          heroPreviewDefaults.paragraphGap,
          0,
          160,
        ),
      },
  };
}

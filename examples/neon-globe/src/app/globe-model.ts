import type { ToolcraftOrientationPose } from "@/toolcraft/runtime/react";

import { GLOBE_BAND_WIDTH_MAX, GLOBE_DEFAULTS, GLOBE_LOGO_SCALE, GLOBE_SCENE_SIZE, GLOBE_TARGETS } from "./globe-constants";
import type { GlobeLogoId } from "./globe-logo-assets";

export type GlobeSettings = {
  background: string;
  bandColumnSpacing: number;
  bandDistance: number;
  bandDotSize: number;
  bands: readonly GlobeBandSettings[];
  crtIntensity: number;
  includeBackground: boolean;
  latitudeCount: number;
  lineColor: string;
  lineWidth: number;
  logoHoldSeconds: number;
  logoSpeed: number;
  logos: readonly GlobeBandLogoSettings[];
  meridianCount: number;
  orientation: ToolcraftOrientationPose;
  outline: boolean;
  sphereColor: string;
};

export type GlobeBandSettings = {
  id: 1 | 2 | 3 | 4;
  position: number;
  width: number;
};

export type GlobeBandLogoSettings = {
  bandId: 1 | 2 | 3 | 4;
  logoId: GlobeLogoId;
  position: number;
  scale: number;
};

export type GlobeLinePath = {
  points: readonly [number, number, number][];
};

export type GlobeGeometryData = {
  latitudes: readonly GlobeLinePath[];
  meridians: readonly GlobeLinePath[];
};

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/u;

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === "number" ? value : fallback;
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, numeric));
}

export function readHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.toUpperCase();
  return HEX_COLOR_PATTERN.test(normalized) ? normalized : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isFiniteVector(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((part) => typeof part === "number" && Number.isFinite(part))
  );
}

export function readOrientation(value: unknown): ToolcraftOrientationPose {
  if (
    typeof value === "object" &&
    value !== null &&
    isFiniteVector((value as { position?: unknown }).position) &&
    isFiniteVector((value as { up?: unknown }).up)
  ) {
    return {
      position: (value as { position: [number, number, number] }).position,
      up: (value as { up: [number, number, number] }).up,
    };
  }
  return GLOBE_DEFAULTS.orientation;
}

export function readGlobeSettings(values: Readonly<Record<string, unknown>>): GlobeSettings {
  return {
    background: readHexColor(values[GLOBE_TARGETS.background], GLOBE_DEFAULTS.background),
    bandColumnSpacing: clampNumber(
      values[GLOBE_TARGETS.bandColumnSpacing],
      3,
      18,
      GLOBE_DEFAULTS.bandColumnSpacing,
    ),
    bandDistance: clampNumber(
      values[GLOBE_TARGETS.bandDistance],
      0,
      24,
      GLOBE_DEFAULTS.bandDistance,
    ),
    bandDotSize: clampNumber(
      values[GLOBE_TARGETS.bandDotSize],
      1,
      6,
      GLOBE_DEFAULTS.bandDotSize,
    ),
    bands: [
      {
        id: 1,
        position: clampNumber(
          values[GLOBE_TARGETS.band1Position],
          -76,
          76,
          GLOBE_DEFAULTS.band1Position,
        ),
        width: clampNumber(
          values[GLOBE_TARGETS.band1Width],
          4,
          GLOBE_BAND_WIDTH_MAX,
          GLOBE_DEFAULTS.band1Width,
        ),
      },
      {
        id: 2,
        position: clampNumber(
          values[GLOBE_TARGETS.band2Position],
          -76,
          76,
          GLOBE_DEFAULTS.band2Position,
        ),
        width: clampNumber(
          values[GLOBE_TARGETS.band2Width],
          4,
          GLOBE_BAND_WIDTH_MAX,
          GLOBE_DEFAULTS.band2Width,
        ),
      },
      {
        id: 3,
        position: clampNumber(
          values[GLOBE_TARGETS.band3Position],
          -76,
          76,
          GLOBE_DEFAULTS.band3Position,
        ),
        width: clampNumber(
          values[GLOBE_TARGETS.band3Width],
          4,
          GLOBE_BAND_WIDTH_MAX,
          GLOBE_DEFAULTS.band3Width,
        ),
      },
      {
        id: 4,
        position: clampNumber(
          values[GLOBE_TARGETS.band4Position],
          -76,
          76,
          GLOBE_DEFAULTS.band4Position,
        ),
        width: clampNumber(
          values[GLOBE_TARGETS.band4Width],
          4,
          GLOBE_BAND_WIDTH_MAX,
          GLOBE_DEFAULTS.band4Width,
        ),
      },
    ],
    crtIntensity: clampNumber(
      values[GLOBE_TARGETS.crtIntensity],
      0,
      100,
      GLOBE_DEFAULTS.crtIntensity,
    ),
    includeBackground: readBoolean(
      values[GLOBE_TARGETS.includeBackground],
      GLOBE_DEFAULTS.includeBackground,
    ),
    latitudeCount: Math.round(
      clampNumber(values[GLOBE_TARGETS.latitudeCount], 3, 25, GLOBE_DEFAULTS.latitudeCount),
    ),
    lineColor: readHexColor(values[GLOBE_TARGETS.lineColor], GLOBE_DEFAULTS.lineColor),
    lineWidth: clampNumber(values[GLOBE_TARGETS.lineWidth], 0.5, 8, GLOBE_DEFAULTS.lineWidth),
    logoHoldSeconds: clampNumber(
      values[GLOBE_TARGETS.logoHoldSeconds],
      0,
      8,
      GLOBE_DEFAULTS.logoHoldSeconds,
    ),
    logoSpeed: clampNumber(
      values[GLOBE_TARGETS.logoSpeed],
      0.5,
      2.5,
      GLOBE_DEFAULTS.logoSpeed,
    ),
    logos: [
      {
        bandId: 1,
        logoId: "dxc",
        scale: clampNumber(
          values[GLOBE_TARGETS.logoDxcScale],
          GLOBE_LOGO_SCALE.min,
          GLOBE_LOGO_SCALE.max,
          GLOBE_LOGO_SCALE.defaultValue,
        ),
        position: clampNumber(
          values[GLOBE_TARGETS.logoDxcFinalPosition],
          0,
          100,
          GLOBE_DEFAULTS.logoDxcFinalPosition,
        ),
      },
      {
        bandId: 2,
        logoId: "meta",
        scale: clampNumber(
          values[GLOBE_TARGETS.logoMetaScale],
          GLOBE_LOGO_SCALE.min,
          GLOBE_LOGO_SCALE.max,
          GLOBE_LOGO_SCALE.defaultValue,
        ),
        position: clampNumber(
          values[GLOBE_TARGETS.logoMetaFinalPosition],
          0,
          100,
          GLOBE_DEFAULTS.logoMetaFinalPosition,
        ),
      },
      {
        bandId: 3,
        logoId: "prada",
        scale: clampNumber(
          values[GLOBE_TARGETS.logoPradaScale],
          GLOBE_LOGO_SCALE.min,
          GLOBE_LOGO_SCALE.max,
          GLOBE_LOGO_SCALE.defaultValue,
        ),
        position: clampNumber(
          values[GLOBE_TARGETS.logoPradaFinalPosition],
          0,
          100,
          GLOBE_DEFAULTS.logoPradaFinalPosition,
        ),
      },
      {
        bandId: 4,
        logoId: "zillow",
        scale: clampNumber(
          values[GLOBE_TARGETS.logoZillowScale],
          GLOBE_LOGO_SCALE.min,
          GLOBE_LOGO_SCALE.max,
          GLOBE_LOGO_SCALE.defaultValue,
        ),
        position: clampNumber(
          values[GLOBE_TARGETS.logoZillowFinalPosition],
          0,
          100,
          GLOBE_DEFAULTS.logoZillowFinalPosition,
        ),
      },
    ],
    meridianCount: Math.round(
      clampNumber(values[GLOBE_TARGETS.meridianCount], 4, 48, GLOBE_DEFAULTS.meridianCount),
    ),
    orientation: readOrientation(values[GLOBE_TARGETS.orientation]),
    outline: readBoolean(values[GLOBE_TARGETS.outline], GLOBE_DEFAULTS.outline),
    sphereColor: readHexColor(values[GLOBE_TARGETS.sphereColor], GLOBE_DEFAULTS.sphereColor),
  };
}

function buildRing(samples: number, pointAt: (step: number) => [number, number, number]): GlobeLinePath {
  return {
    points: Array.from({ length: samples + 1 }, (_, index) => pointAt(index / samples)),
  };
}

export function createGlobeGeometry({
  latitudeCount,
  meridianCount,
}: Pick<GlobeSettings, "latitudeCount" | "meridianCount">): GlobeGeometryData {
  const samples = 160;
  const latitudes = Array.from({ length: latitudeCount }, (_, index) => {
    const t = (index + 1) / (latitudeCount + 1);
    const phi = -Math.PI / 2 + t * Math.PI;
    const y = Math.sin(phi);
    const radius = Math.cos(phi);
    return buildRing(samples, (step) => {
      const theta = step * Math.PI * 2;
      return [Math.cos(theta) * radius, y, Math.sin(theta) * radius];
    });
  });

  const meridians = Array.from({ length: meridianCount }, (_, index) => {
    const theta = (index / meridianCount) * Math.PI * 2;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    return buildRing(samples, (step) => {
      const phi = -Math.PI / 2 + step * Math.PI;
      const radius = Math.cos(phi);
      return [cosTheta * radius, Math.sin(phi), sinTheta * radius];
    });
  });

  return { latitudes, meridians };
}

export function getGlobeSceneRect() {
  return {
    height: GLOBE_SCENE_SIZE.height,
    width: GLOBE_SCENE_SIZE.width,
    x: -GLOBE_SCENE_SIZE.width / 2,
    y: -GLOBE_SCENE_SIZE.height / 2,
  };
}

export const fineDetailsLoadingTargets = {
  angle: "loading.angle",
  baseTone: "loading.baseTone",
  borderColorOpacity: "loading.border.colorOpacity",
  borderWidth: "loading.border.width",
  cell: "loading.cell",
  contrast: "loading.contrast",
  desync: "loading.desync",
  distort: "loading.distort",
  enabled: "loading.enabled",
  glare: "loading.glare",
  passTime: "loading.passTime",
  pause: "loading.pause",
  softness: "loading.softness",
  stagger: "loading.stagger",
  waveWidth: "loading.waveWidth",
} as const;

export type FineDetailsLoadingSettings = Readonly<{
  angle: number;
  baseTone: number;
  border: Readonly<{
    colorOpacity: Readonly<{ hex: string; opacity: number }>;
    width: number;
  }>;
  cell: number;
  contrast: number;
  desync: number;
  distort: number;
  enabled: boolean;
  glare: number;
  passTime: number;
  pause: number;
  softness: number;
  stagger: number;
  waveWidth: number;
}>;

export const FINE_DETAILS_LOADING_DEFAULTS: FineDetailsLoadingSettings = {
  angle: 45,
  baseTone: 85,
  border: { colorOpacity: { hex: "#000000", opacity: 12 }, width: 1 },
  cell: 20,
  contrast: 14,
  desync: 12,
  distort: 6,
  enabled: true,
  glare: 55,
  passTime: 1600,
  pause: 300,
  softness: 60,
  stagger: 180,
  waveWidth: 45,
};

function numberValue(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function colorOpacityValue(
  value: unknown,
  fallback: Readonly<{ hex: string; opacity: number }>,
) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fallback;
  }

  const colorOpacity = value as Record<string, unknown>;
  const hex =
    typeof colorOpacity.hex === "string" && /^#[0-9A-F]{6}$/i.test(colorOpacity.hex)
      ? colorOpacity.hex.toUpperCase()
      : fallback.hex;

  return {
    hex,
    opacity: numberValue(colorOpacity.opacity, fallback.opacity, 0, 100),
  };
}

export function createFineDetailsLoadingFromValues(
  values: Readonly<Record<string, unknown>>,
): FineDetailsLoadingSettings {
  return {
    angle: numberValue(
      values[fineDetailsLoadingTargets.angle],
      FINE_DETAILS_LOADING_DEFAULTS.angle,
      0,
      360,
    ),
    baseTone: numberValue(
      values[fineDetailsLoadingTargets.baseTone],
      FINE_DETAILS_LOADING_DEFAULTS.baseTone,
      0,
      100,
    ),
    border: {
      colorOpacity: colorOpacityValue(
        values[fineDetailsLoadingTargets.borderColorOpacity],
        FINE_DETAILS_LOADING_DEFAULTS.border.colorOpacity,
      ),
      width: numberValue(
        values[fineDetailsLoadingTargets.borderWidth],
        FINE_DETAILS_LOADING_DEFAULTS.border.width,
        0,
        8,
      ),
    },
    cell: Math.round(
      numberValue(
        values[fineDetailsLoadingTargets.cell],
        FINE_DETAILS_LOADING_DEFAULTS.cell,
        8,
        64,
      ),
    ),
    contrast: numberValue(
      values[fineDetailsLoadingTargets.contrast],
      FINE_DETAILS_LOADING_DEFAULTS.contrast,
      0,
      60,
    ),
    desync: numberValue(
      values[fineDetailsLoadingTargets.desync],
      FINE_DETAILS_LOADING_DEFAULTS.desync,
      0,
      50,
    ),
    distort: numberValue(
      values[fineDetailsLoadingTargets.distort],
      FINE_DETAILS_LOADING_DEFAULTS.distort,
      0,
      24,
    ),
    enabled: booleanValue(
      values[fineDetailsLoadingTargets.enabled],
      FINE_DETAILS_LOADING_DEFAULTS.enabled,
    ),
    glare: numberValue(
      values[fineDetailsLoadingTargets.glare],
      FINE_DETAILS_LOADING_DEFAULTS.glare,
      0,
      100,
    ),
    passTime: numberValue(
      values[fineDetailsLoadingTargets.passTime],
      FINE_DETAILS_LOADING_DEFAULTS.passTime,
      600,
      4000,
    ),
    pause: numberValue(
      values[fineDetailsLoadingTargets.pause],
      FINE_DETAILS_LOADING_DEFAULTS.pause,
      0,
      2000,
    ),
    softness: numberValue(
      values[fineDetailsLoadingTargets.softness],
      FINE_DETAILS_LOADING_DEFAULTS.softness,
      0,
      100,
    ),
    stagger: numberValue(
      values[fineDetailsLoadingTargets.stagger],
      FINE_DETAILS_LOADING_DEFAULTS.stagger,
      0,
      800,
    ),
    waveWidth: numberValue(
      values[fineDetailsLoadingTargets.waveWidth],
      FINE_DETAILS_LOADING_DEFAULTS.waveWidth,
      10,
      100,
    ),
  };
}

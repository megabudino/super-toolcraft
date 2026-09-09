export const fineDetailsTargets = {
  background: "appearance.background",
  gridOpacity: "appearance.gridOpacity",
  gridSize: "appearance.gridSize",
} as const;

export const FINE_DETAILS_APPEARANCE_DEFAULTS = {
  background: "#F2F2F2",
  gridOpacity: 80,
  gridSize: 50,
} as const;

export const FINE_DETAILS_GRID_SIZE_MIN = 10;
export const FINE_DETAILS_GRID_SIZE_MAX = 200;

function numericValue(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

function colorValue(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9A-F]{6}$/.test(value)
    ? value
    : fallback;
}

export function createFineDetailsAppearanceFromValues(
  values: Readonly<Record<string, unknown>>,
) {
  return {
    background: colorValue(
      values[fineDetailsTargets.background],
      FINE_DETAILS_APPEARANCE_DEFAULTS.background,
    ),
    gridOpacity: numericValue(
      values[fineDetailsTargets.gridOpacity],
      FINE_DETAILS_APPEARANCE_DEFAULTS.gridOpacity,
      0,
      100,
    ),
    gridSize: Math.round(
      numericValue(
        values[fineDetailsTargets.gridSize],
        FINE_DETAILS_APPEARANCE_DEFAULTS.gridSize,
        FINE_DETAILS_GRID_SIZE_MIN,
        FINE_DETAILS_GRID_SIZE_MAX,
      ),
    ),
  };
}

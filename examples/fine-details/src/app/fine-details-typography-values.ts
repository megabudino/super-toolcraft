export const fineDetailsTypographyTargets = {
  lowerRightBodyFontSize: "typography.lowerRight.bodyFontSize",
  lowerRightBottom: "typography.lowerRight.bottom",
  lowerRightGap: "typography.lowerRight.gap",
  lowerRightHeadingFontSize: "typography.lowerRight.headingFontSize",
  lowerRightRight: "typography.lowerRight.right",
  upperLeftFontSize: "typography.upperLeft.fontSize",
  upperLeftLeft: "typography.upperLeft.left",
  upperLeftTop: "typography.upperLeft.top",
} as const;

export const FINE_DETAILS_TYPOGRAPHY_INSET_MAX = 8192;
export const FINE_DETAILS_TYPOGRAPHY_SIZE_MIN = 8;
export const FINE_DETAILS_TYPOGRAPHY_SIZE_MAX = 512;
export const FINE_DETAILS_TYPOGRAPHY_GAP_MAX = 512;

export type FineDetailsTypographySettings = Readonly<{
  lowerRight: Readonly<{
    bodyFontSize: number;
    bottom: number;
    gap: number;
    headingFontSize: number;
    right: number;
  }>;
  upperLeft: Readonly<{
    fontSize: number;
    left: number;
    top: number;
  }>;
}>;

export const FINE_DETAILS_TYPOGRAPHY_DEFAULTS: FineDetailsTypographySettings = {
  lowerRight: {
    bodyFontSize: 24,
    bottom: 96,
    gap: 8,
    headingFontSize: 88,
    right: 96,
  },
  upperLeft: {
    fontSize: 120,
    left: 96,
    top: 96,
  },
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

export function createFineDetailsTypographyFromValues(
  values: Readonly<Record<string, unknown>>,
): FineDetailsTypographySettings {
  return {
    lowerRight: {
      bodyFontSize: numberValue(
        values[fineDetailsTypographyTargets.lowerRightBodyFontSize],
        FINE_DETAILS_TYPOGRAPHY_DEFAULTS.lowerRight.bodyFontSize,
        FINE_DETAILS_TYPOGRAPHY_SIZE_MIN,
        FINE_DETAILS_TYPOGRAPHY_SIZE_MAX,
      ),
      bottom: numberValue(
        values[fineDetailsTypographyTargets.lowerRightBottom],
        FINE_DETAILS_TYPOGRAPHY_DEFAULTS.lowerRight.bottom,
        0,
        FINE_DETAILS_TYPOGRAPHY_INSET_MAX,
      ),
      gap: numberValue(
        values[fineDetailsTypographyTargets.lowerRightGap],
        FINE_DETAILS_TYPOGRAPHY_DEFAULTS.lowerRight.gap,
        0,
        FINE_DETAILS_TYPOGRAPHY_GAP_MAX,
      ),
      headingFontSize: numberValue(
        values[fineDetailsTypographyTargets.lowerRightHeadingFontSize],
        FINE_DETAILS_TYPOGRAPHY_DEFAULTS.lowerRight.headingFontSize,
        FINE_DETAILS_TYPOGRAPHY_SIZE_MIN,
        FINE_DETAILS_TYPOGRAPHY_SIZE_MAX,
      ),
      right: numberValue(
        values[fineDetailsTypographyTargets.lowerRightRight],
        FINE_DETAILS_TYPOGRAPHY_DEFAULTS.lowerRight.right,
        0,
        FINE_DETAILS_TYPOGRAPHY_INSET_MAX,
      ),
    },
    upperLeft: {
      fontSize: numberValue(
        values[fineDetailsTypographyTargets.upperLeftFontSize],
        FINE_DETAILS_TYPOGRAPHY_DEFAULTS.upperLeft.fontSize,
        FINE_DETAILS_TYPOGRAPHY_SIZE_MIN,
        FINE_DETAILS_TYPOGRAPHY_SIZE_MAX,
      ),
      left: numberValue(
        values[fineDetailsTypographyTargets.upperLeftLeft],
        FINE_DETAILS_TYPOGRAPHY_DEFAULTS.upperLeft.left,
        0,
        FINE_DETAILS_TYPOGRAPHY_INSET_MAX,
      ),
      top: numberValue(
        values[fineDetailsTypographyTargets.upperLeftTop],
        FINE_DETAILS_TYPOGRAPHY_DEFAULTS.upperLeft.top,
        0,
        FINE_DETAILS_TYPOGRAPHY_INSET_MAX,
      ),
    },
  };
}

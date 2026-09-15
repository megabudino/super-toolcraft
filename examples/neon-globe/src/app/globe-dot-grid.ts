import { GLOBE_BAND_WIDTH_MAX, GLOBE_SCENE_SIZE } from "./globe-constants";

import { GLOBE_SCREEN_RADIUS_RATIO } from "./globe-renderer-settings";

const BAND_DOT_MAX_COLUMNS = 720;
const BAND_DOT_MIN_COLUMNS = 48;
const BAND_DOT_MIN_COLUMN_SPACING_PX = 1;
const BAND_DOT_MIN_DIAMETER_PX = 0.8;
const BAND_DOT_ROW_PITCH_RATIO = 1.55;
const BAND_DOT_MAX_ROWS = Math.ceil(
  (GLOBE_BAND_WIDTH_MAX / 100 * GLOBE_SCENE_SIZE.height * GLOBE_SCREEN_RADIUS_RATIO) /
    (BAND_DOT_MIN_DIAMETER_PX * BAND_DOT_ROW_PITCH_RATIO),
);

export type GlobeBandDotMetrics = {
  columnCount: number;
  dotRadius: number;
  rowCount: number;
};

export function getGlobeFrameScaleFromRadius(radius: number): number {
  return radius / (GLOBE_SCENE_SIZE.height * GLOBE_SCREEN_RADIUS_RATIO);
}

export function getBandDotMetrics({
  bandHeight,
  columnSpacing,
  dotSize,
  outerRadius,
  radius,
}: {
  bandHeight: number;
  columnSpacing: number;
  dotSize: number;
  outerRadius: number;
  radius: number;
}): GlobeBandDotMetrics {
  const frameScale = getGlobeFrameScaleFromRadius(radius);
  const dotDiameter = Math.max(
    BAND_DOT_MIN_DIAMETER_PX * frameScale,
    dotSize * frameScale,
  );
  const rowPitch = dotDiameter * BAND_DOT_ROW_PITCH_RATIO;
  const bandHeightPixels = Math.max(0, bandHeight * radius);
  const columnSpacingPixels = Math.max(
    BAND_DOT_MIN_COLUMN_SPACING_PX * frameScale,
    columnSpacing * frameScale,
  );
  const circumferencePixels = Math.max(0, Math.PI * 2 * outerRadius * radius);
  const columnCount = Math.max(
    BAND_DOT_MIN_COLUMNS,
    Math.min(
      BAND_DOT_MAX_COLUMNS,
      Math.round(circumferencePixels / columnSpacingPixels),
    ),
  );
  const rowCount = Math.max(
    1,
    Math.min(BAND_DOT_MAX_ROWS, Math.round(bandHeightPixels / rowPitch)),
  );

  return {
    columnCount,
    dotRadius: dotDiameter / 2,
    rowCount,
  };
}

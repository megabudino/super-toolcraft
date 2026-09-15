import type { GlobeBandLogoSettings } from "./globe-model";
import {
  getGlobeLogoAsset,
  type GlobeLogoAsset,
  type GlobeLogoId,
} from "./globe-logo-assets";

const LOGO_HEIGHT_ROW_RATIO = 0.74;
const LOGO_MAX_COLUMN_RATIO = 0.48;

let logoMaskContext: CanvasRenderingContext2D | null | undefined;
const logoPathCache = new Map<GlobeLogoId, Path2D[]>();

function getLogoMaskContext(): CanvasRenderingContext2D | null {
  if (logoMaskContext !== undefined) {
    return logoMaskContext;
  }

  if (typeof document === "undefined") {
    logoMaskContext = null;
    return logoMaskContext;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  logoMaskContext = canvas.getContext("2d", { willReadFrequently: true });
  return logoMaskContext;
}

function getLogoPaths(asset: GlobeLogoAsset): readonly Path2D[] {
  const cached = logoPathCache.get(asset.id);
  if (cached) {
    return cached;
  }

  if (typeof Path2D === "undefined") {
    logoPathCache.set(asset.id, []);
    return [];
  }

  try {
    const paths = asset.paths.map((path) => new Path2D(path));
    logoPathCache.set(asset.id, paths);
    return paths;
  } catch {
    logoPathCache.set(asset.id, []);
    return [];
  }
}

function getCircularColumnDelta(
  columnIndex: number,
  centerColumn: number,
  columnCount: number,
): number {
  let delta = columnIndex - centerColumn;
  const halfColumns = columnCount / 2;
  while (delta > halfColumns) delta -= columnCount;
  while (delta < -halfColumns) delta += columnCount;
  return delta;
}

export function getLogoMaskLayout({
  aspectRatio,
  columnCount,
  columnPitchPixels,
  rowCount,
  rowPitchPixels,
  scale,
}: {
  aspectRatio: number;
  columnCount: number;
  columnPitchPixels: number;
  rowCount: number;
  rowPitchPixels: number;
  scale: number;
}) {
  const baseRows = Math.max(2, Math.min(rowCount, Math.round(rowCount * LOGO_HEIGHT_ROW_RATIO)));
  const centerRow = Math.floor((rowCount - baseRows) / 2) + baseRows / 2;
  const columnsPerRow = rowPitchPixels * aspectRatio / columnPitchPixels;
  // Fit both axes uniformly while keeping the existing logo center at every scale.
  const rows = Math.min(
    baseRows * scale / 100,
    centerRow * 2,
    (rowCount - centerRow) * 2,
    columnCount * LOGO_MAX_COLUMN_RATIO / columnsPerRow,
  );
  return {
    firstRow: centerRow - rows / 2,
    rows,
    widthColumns: rows * columnsPerRow,
  };
}

export function isDotInsideLogoMask({
  columnCount,
  columnIndex,
  columnPitchPixels,
  logo,
  rowCount,
  rowIndex,
  rowPitchPixels,
}: {
  columnCount: number;
  columnIndex: number;
  columnPitchPixels: number;
  logo: GlobeBandLogoSettings | undefined;
  rowCount: number;
  rowIndex: number;
  rowPitchPixels: number;
}): boolean {
  if (!logo || rowCount < 2 || columnCount < 2 || columnPitchPixels <= 0 || rowPitchPixels <= 0) {
    return false;
  }

  const asset = getGlobeLogoAsset(logo.logoId);
  const maskContext = getLogoMaskContext();
  if (!asset || !maskContext) {
    return false;
  }

  const { rows: logoRows, firstRow, widthColumns: logoWidthColumns } = getLogoMaskLayout({
    aspectRatio: asset.aspectRatio,
    columnCount,
    columnPitchPixels,
    rowCount,
    rowPitchPixels,
    scale: logo.scale,
  });
  const rowOffset = rowIndex + 0.5 - firstRow;
  if (rowOffset < 0 || rowOffset >= logoRows) {
    return false;
  }
  const centerColumn = ((100 - logo.position) / 100) * (columnCount / 2);
  const columnDelta = getCircularColumnDelta(columnIndex, centerColumn, columnCount);
  if (Math.abs(columnDelta) > logoWidthColumns / 2) {
    return false;
  }

  const logoX = (0.5 - columnDelta / logoWidthColumns) * asset.width;
  const logoY = (1 - rowOffset / logoRows) * asset.height;
  return getLogoPaths(asset).some((path) =>
    maskContext.isPointInPath(path, logoX, logoY),
  );
}

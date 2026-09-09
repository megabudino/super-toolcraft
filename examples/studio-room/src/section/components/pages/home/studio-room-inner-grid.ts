export type StudioRoomInnerGridLines = {
  horizontal: number[];
  vertical: number[];
};

export type StudioRoomInnerGridMaskStop = {
  alpha: number;
  offset: number;
};

export type StudioRoomInnerGridMaskDepths = {
  depthX: number;
  depthY: number;
};

const VIEWBOX_SIZE = 1000;

function resolveInteriorFractions(divisions: number) {
  return Array.from({ length: Math.max(0, divisions - 1) }, (_, index) => (index + 1) / divisions);
}

export function resolveInnerGridLines(columns: number, rows: number): StudioRoomInnerGridLines {
  return {
    horizontal: resolveInteriorFractions(rows),
    vertical: resolveInteriorFractions(columns),
  };
}

export function resolveInnerGridMaskStops(
  falloff: number,
  stopCount = 6,
): StudioRoomInnerGridMaskStop[] {
  const count = Math.max(2, Math.round(stopCount));

  return Array.from({ length: count }, (_, index) => {
    const offset = index / (count - 1);
    return { alpha: (1 - offset) ** falloff, offset };
  });
}

export function resolveInnerGridMaskDepths(
  panelWidth: number,
  panelHeight: number,
  depthPercent: number,
): StudioRoomInnerGridMaskDepths {
  const width = Number.isFinite(panelWidth) && panelWidth > 0 ? panelWidth : VIEWBOX_SIZE;
  const height = Number.isFinite(panelHeight) && panelHeight > 0 ? panelHeight : VIEWBOX_SIZE;
  const depth = Number.isFinite(depthPercent) ? Math.max(0, depthPercent) : 0;
  const physicalDepth = Math.min(width, height) * (depth / 100);

  return {
    depthX: (physicalDepth / width) * VIEWBOX_SIZE,
    depthY: (physicalDepth / height) * VIEWBOX_SIZE,
  };
}

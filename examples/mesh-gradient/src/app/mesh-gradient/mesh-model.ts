export const MESH_MAX_POINTS = 16;
export const MESH_MIN_POINTS = 4;
export const MESH_MAX_COLUMNS = MESH_MAX_POINTS / 2;

export type MeshPoint = Readonly<{
  x: number;
  y: number;
}>;

export type MeshHandleMode = "smooth" | "corner";
export type MeshHandleDirection = "left" | "right" | "up" | "down";

export type MeshPointHandles = Readonly<{
  handleDown: MeshPoint;
  handleLeft: MeshPoint;
  handleRight: MeshPoint;
  handleUp: MeshPoint;
  type: MeshHandleMode;
}>;

export type MeshInsertedPoint = Readonly<{
  column: number;
  pointIndex: number;
  row: number;
  u: number;
  v: number;
}>;

export type MeshPointLayout = Readonly<{
  baseColumns?: number;
  basePointCount?: number;
  handles: readonly MeshPointHandles[];
  insertedPoints?: readonly MeshInsertedPoint[];
  points: readonly MeshPoint[];
  presetTransition?: MeshPresetTransition;
  selectedIndex: number;
  selectedIndices: readonly number[];
  topologySnapshot?: MeshTopologySnapshot;
}>;

export type MeshTopologySnapshot = Readonly<{
  colors: readonly string[];
  columns: number;
  revision: string;
}>;

export type MeshPresetTransition = Readonly<{
  fromPreset: string;
  previous: Readonly<{
    colors: readonly string[];
    columns: number;
    layoutValue: unknown;
  }>;
  toPreset: string;
}>;

export type MeshGlResource = Readonly<{
  canvas: HTMLCanvasElement;
  colorBuffer: WebGLBuffer;
  gl: WebGL2RenderingContext;
  indexBuffer: WebGLBuffer;
  positionBuffer: WebGLBuffer;
  program: WebGLProgram;
  uniforms: Readonly<Record<string, WebGLUniformLocation | null>>;
  vertexArray: WebGLVertexArrayObject;
}>;

export const DEFAULT_MESH_COLORS = [
  "#F7D6FF",
  "#A78BFA",
  "#4F46E5",
  "#F9A8D4",
  "#22D3EE",
  "#FB7185",
  "#FDE68A",
  "#34D399",
  "#0F172A",
  "#60A5FA",
  "#C084FC",
  "#F472B6",
] as const;

const zeroHandle: MeshPoint = { x: 0, y: 0 };

export function createZeroMeshHandles(): MeshPointHandles {
  return {
    handleDown: zeroHandle,
    handleLeft: zeroHandle,
    handleRight: zeroHandle,
    handleUp: zeroHandle,
    type: "corner",
  };
}

export function createGridPoints(count: number, columns = 3): MeshPoint[] {
  const safeCount = Math.max(MESH_MIN_POINTS, Math.min(MESH_MAX_POINTS, Math.round(count)));
  const safeColumns = Math.max(2, Math.min(MESH_MAX_COLUMNS, Math.round(columns)));
  const rows = Math.max(2, Math.ceil(safeCount / safeColumns));

  return Array.from({ length: safeCount }, (_, index) => {
    const column = index % safeColumns;
    const row = Math.floor(index / safeColumns);
    const rowLength = Math.min(safeColumns, safeCount - row * safeColumns);

    return {
      x: rowLength === 1 ? 0.5 : column / Math.max(1, rowLength - 1),
      y: rows === 1 ? 0.5 : row / Math.max(1, rows - 1),
    };
  });
}

function subtractPoint(to: MeshPoint, from: MeshPoint): MeshPoint {
  return { x: (to.x - from.x) / 3, y: (to.y - from.y) / 3 };
}

export function createMeshHandles(
  points: readonly MeshPoint[],
  columns: number,
): MeshPointHandles[] {
  return points.map((point, index) => {
    const column = index % columns;
    const rowStart = index - column;
    const rowLength = Math.min(columns, points.length - rowStart);
    const left = column > 0 ? points[index - 1] : undefined;
    const right = column + 1 < rowLength ? points[index + 1] : undefined;
    const up = index >= columns ? points[index - columns] : undefined;
    const down = index + columns < points.length ? points[index + columns] : undefined;

    return {
      handleDown: down ? subtractPoint(down, point) : zeroHandle,
      handleLeft: left ? subtractPoint(left, point) : zeroHandle,
      handleRight: right ? subtractPoint(right, point) : zeroHandle,
      handleUp: up ? subtractPoint(up, point) : zeroHandle,
      type: "smooth",
    };
  });
}

export function createMeshPointLayout(
  points: readonly MeshPoint[],
  columns: number,
  selectedIndex = -1,
): MeshPointLayout {
  const baseColumns = Math.max(2, Math.min(MESH_MAX_COLUMNS, Math.round(columns)));
  const safeSelectedIndex = Math.max(-1, Math.min(points.length - 1, selectedIndex));
  return {
    baseColumns,
    basePointCount: points.length,
    handles: createMeshHandles(points, baseColumns),
    insertedPoints: [],
    points,
    selectedIndex: safeSelectedIndex,
    selectedIndices: safeSelectedIndex < 0 ? [] : [safeSelectedIndex],
  };
}

export const DEFAULT_MESH_POINT_LAYOUT: MeshPointLayout = {
  ...createMeshPointLayout(createGridPoints(DEFAULT_MESH_COLORS.length, 4), 4),
};

export function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function readFinitePoint(value: unknown, fallback: MeshPoint): MeshPoint {
  if (typeof value !== "object" || value === null) return fallback;
  const candidate = value as { x?: unknown; y?: unknown };
  return {
    x:
      typeof candidate.x === "number" && Number.isFinite(candidate.x)
        ? candidate.x
        : fallback.x,
    y:
      typeof candidate.y === "number" && Number.isFinite(candidate.y)
        ? candidate.y
        : fallback.y,
  };
}

export function readMeshColors(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_MESH_COLORS];

  const colors = value
    .slice(0, MESH_MAX_POINTS)
    .map((item) => readColorHex(item, ""))
    .filter((color) => color.length > 0);

  return colors.length >= MESH_MIN_POINTS ? colors : [...DEFAULT_MESH_COLORS];
}

export function readMeshTopologySnapshot(value: unknown): MeshTopologySnapshot | null {
  if (typeof value !== "object" || value === null || !("topologySnapshot" in value)) {
    return null;
  }
  const snapshot = (value as { topologySnapshot?: unknown }).topologySnapshot;
  if (typeof snapshot !== "object" || snapshot === null) return null;
  const candidate = snapshot as {
    colors?: unknown;
    columns?: unknown;
    revision?: unknown;
  };
  if (
    !Array.isArray(candidate.colors) ||
    candidate.colors.length < MESH_MIN_POINTS ||
    candidate.colors.length > MESH_MAX_POINTS ||
    !candidate.colors.every((color) => typeof color === "string") ||
    typeof candidate.columns !== "number" ||
    !Number.isInteger(candidate.columns) ||
    candidate.columns < 2 ||
    candidate.columns > MESH_MAX_COLUMNS ||
    typeof candidate.revision !== "string" ||
    candidate.revision.length === 0
  ) {
    return null;
  }
  return {
    colors: candidate.colors,
    columns: candidate.columns,
    revision: candidate.revision,
  };
}

function readMeshPresetTransition(value: unknown): MeshPresetTransition | null {
  if (typeof value !== "object" || value === null || !("presetTransition" in value)) {
    return null;
  }
  const transition = (value as { presetTransition?: unknown }).presetTransition;
  if (typeof transition !== "object" || transition === null) return null;
  const candidate = transition as {
    fromPreset?: unknown;
    previous?: unknown;
    toPreset?: unknown;
  };
  if (
    typeof candidate.fromPreset !== "string" ||
    typeof candidate.toPreset !== "string" ||
    typeof candidate.previous !== "object" ||
    candidate.previous === null
  ) {
    return null;
  }
  const previous = candidate.previous as {
    colors?: unknown;
    columns?: unknown;
    layoutValue?: unknown;
  };
  if (
    !Array.isArray(previous.colors) ||
    previous.colors.length < MESH_MIN_POINTS ||
    previous.colors.length > MESH_MAX_POINTS ||
    !previous.colors.every((color) => typeof color === "string") ||
    typeof previous.columns !== "number" ||
    !Number.isInteger(previous.columns) ||
    previous.columns < 2 ||
    previous.columns > MESH_MAX_COLUMNS ||
    typeof previous.layoutValue !== "object" ||
    previous.layoutValue === null
  ) {
    return null;
  }
  return {
    fromPreset: candidate.fromPreset,
    previous: {
      colors: previous.colors,
      columns: previous.columns,
      layoutValue: previous.layoutValue,
    },
    toPreset: candidate.toPreset,
  };
}

export function readColorHex(value: unknown, fallback = "#09090B"): string {
  const candidate =
    typeof value === "string"
      ? value
      : typeof value === "object" && value !== null && "hex" in value
        ? (value as { hex?: unknown }).hex
        : undefined;
  return typeof candidate === "string" && /^#[0-9a-f]{6}$/iu.test(candidate)
    ? candidate
    : fallback;
}

function migrateAxisTangents(
  value: unknown,
  fallback: MeshPointHandles,
): MeshPointHandles | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as { horizontal?: unknown; vertical?: unknown };
  if (!("horizontal" in candidate) && !("vertical" in candidate)) return null;
  const horizontal = readFinitePoint(candidate.horizontal, fallback.handleRight);
  const vertical = readFinitePoint(candidate.vertical, fallback.handleDown);
  return {
    handleDown: { ...vertical },
    handleLeft: { x: -horizontal.x, y: -horizontal.y },
    handleRight: { ...horizontal },
    handleUp: { x: -vertical.x, y: -vertical.y },
    type: "smooth",
  };
}

function readPointHandles(value: unknown, fallback: MeshPointHandles): MeshPointHandles {
  const migrated = migrateAxisTangents(value, fallback);
  if (migrated) return migrated;
  if (typeof value !== "object" || value === null) return fallback;
  const candidate = value as Partial<Record<keyof MeshPointHandles, unknown>>;
  return {
    handleDown: readFinitePoint(candidate.handleDown, fallback.handleDown),
    handleLeft: readFinitePoint(candidate.handleLeft, fallback.handleLeft),
    handleRight: readFinitePoint(candidate.handleRight, fallback.handleRight),
    handleUp: readFinitePoint(candidate.handleUp, fallback.handleUp),
    type: candidate.type === "corner" ? "corner" : "smooth",
  };
}

export function readMeshPointLayout(
  value: unknown,
  pointCount: number = DEFAULT_MESH_COLORS.length,
  columns: number = 3,
): MeshPointLayout {
  const fallbackPoints = createGridPoints(pointCount, columns);
  if (typeof value !== "object" || value === null) {
    return createMeshPointLayout(fallbackPoints, columns);
  }

  const record = value as {
    baseColumns?: unknown;
    basePointCount?: unknown;
    handles?: unknown;
    insertedPoints?: unknown;
    points?: unknown;
    selectedIndex?: unknown;
    selectedIndices?: unknown;
    tangents?: unknown;
  };
  const sourcePoints = Array.isArray(record.points) ? record.points : [];
  const points = Array.from({ length: Math.min(MESH_MAX_POINTS, pointCount) }, (_, index) =>
    readFinitePoint(sourcePoints[index], fallbackPoints[index] ?? { x: 0.5, y: 0.5 }),
  );
  const storedPointCount =
    sourcePoints.length > 0
      ? Math.min(points.length, sourcePoints.length)
      : points.length;
  const safeColumns = Math.max(2, Math.min(MESH_MAX_COLUMNS, Math.round(columns)));
  const storedBasePointCount =
    typeof record.basePointCount === "number" && Number.isInteger(record.basePointCount)
      ? Math.max(MESH_MIN_POINTS, Math.min(points.length, record.basePointCount))
      : null;
  const storedBaseColumns =
    typeof record.baseColumns === "number" &&
    Number.isInteger(record.baseColumns) &&
    record.baseColumns >= 2 &&
    record.baseColumns <= MESH_MAX_COLUMNS &&
    storedBasePointCount !== null &&
    storedBasePointCount % record.baseColumns === 0 &&
    storedBasePointCount / record.baseColumns >= 2
      ? record.baseColumns
      : null;
  const topologyColumns = storedBaseColumns ?? safeColumns;
  const requestedBasePointCount =
    storedBasePointCount !== null
      ? storedBasePointCount
      : storedPointCount % topologyColumns === 0
        ? storedPointCount
        : Math.floor(storedPointCount / topologyColumns) * topologyColumns;
  const basePointCount = Math.max(
    MESH_MIN_POINTS,
    Math.min(
      points.length,
      requestedBasePointCount >= MESH_MIN_POINTS &&
          requestedBasePointCount % topologyColumns === 0
        ? requestedBasePointCount
        : storedPointCount >= MESH_MIN_POINTS
          ? storedPointCount
          : points.length,
    ),
  );
  const sourceInsertedPoints = Array.isArray(record.insertedPoints)
    ? record.insertedPoints
    : [];
  const baseColumns =
    basePointCount % topologyColumns === 0 && basePointCount / topologyColumns >= 2
      ? topologyColumns
      : safeColumns;
  const rows = Math.max(2, Math.floor(basePointCount / baseColumns));
  const insertionSlots = [
    { u: 0.5, v: 0.5 },
    { u: 0.32, v: 0.28 },
    { u: 0.72, v: 0.34 },
    { u: 0.66, v: 0.76 },
    { u: 0.27, v: 0.68 },
  ] as const;
  const insertedPoints = points.slice(basePointCount).map((_, offset) => {
    const pointIndex = basePointCount + offset;
    const source = sourceInsertedPoints.find(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        (item as { pointIndex?: unknown }).pointIndex === pointIndex,
    ) as Partial<MeshInsertedPoint> | undefined;
    const fallbackSlot = insertionSlots[offset % insertionSlots.length]!;
    return {
      column:
        typeof source?.column === "number" && Number.isInteger(source.column)
          ? Math.max(0, Math.min(baseColumns - 2, source.column))
          : Math.max(0, Math.min(baseColumns - 2, Math.floor((baseColumns - 1) / 2))),
      pointIndex,
      row:
        typeof source?.row === "number" && Number.isInteger(source.row)
          ? Math.max(0, Math.min(rows - 2, source.row))
          : Math.max(0, Math.min(rows - 2, Math.floor((rows - 1) / 2))),
      u: clampUnit(typeof source?.u === "number" ? source.u : fallbackSlot.u),
      v: clampUnit(typeof source?.v === "number" ? source.v : fallbackSlot.v),
    };
  });
  const legacySelectedIndex =
    typeof record.selectedIndex === "number" && Number.isFinite(record.selectedIndex)
      ? Math.max(-1, Math.min(points.length - 1, Math.round(record.selectedIndex)))
      : -1;
  const selectedIndices = Array.isArray(record.selectedIndices)
    ? Array.from(
        new Set(
          record.selectedIndices
            .filter(
              (index): index is number =>
                typeof index === "number" &&
                Number.isFinite(index) &&
                index >= 0 &&
                index < points.length,
            )
            .map((index) => Math.round(index)),
        ),
      ).sort((left, right) => left - right)
    : legacySelectedIndex < 0
      ? []
      : [legacySelectedIndex];
  const selectedIndex = selectedIndices[0] ?? -1;
  const structuralFallbackHandles = createMeshHandles(
    points.slice(0, basePointCount),
    baseColumns,
  );
  const fallbackHandles = points.map((_, index) =>
    index < basePointCount
      ? structuralFallbackHandles[index]!
      : createZeroMeshHandles(),
  );
  const sourceHandles = Array.isArray(record.handles)
    ? record.handles
    : Array.isArray(record.tangents)
      ? record.tangents
      : [];
  const handles = points.map((_, index) =>
    readPointHandles(sourceHandles[index], fallbackHandles[index]!),
  );
  const topologySnapshot = readMeshTopologySnapshot(value);
  const presetTransition = readMeshPresetTransition(value);

  return {
    baseColumns,
    basePointCount,
    handles,
    insertedPoints,
    points,
    selectedIndex,
    selectedIndices,
    ...(presetTransition ? { presetTransition } : {}),
    ...(topologySnapshot ? { topologySnapshot } : {}),
  };
}

export function getMeshBasePointCount(layout: MeshPointLayout): number {
  const candidate = layout.basePointCount;
  return typeof candidate === "number" && Number.isInteger(candidate)
    ? Math.max(MESH_MIN_POINTS, Math.min(layout.points.length, candidate))
    : layout.points.length;
}

export function isInsertedMeshPoint(layout: MeshPointLayout, index: number): boolean {
  return index >= getMeshBasePointCount(layout) && index < layout.points.length;
}

export function isMeshEdgePoint(index: number, count: number, columns: number): boolean {
  const row = Math.floor(index / columns);
  const column = index % columns;
  const rowCount = Math.ceil(count / columns);
  const rowLength = Math.min(columns, count - row * columns);
  return row === 0 || row === rowCount - 1 || column === 0 || column === rowLength - 1;
}

export function createShuffledPointLayout(
  pointCount: number,
  columns: number,
  seed: number,
): MeshPointLayout {
  const base = createGridPoints(pointCount, columns);
  const jitter = (index: number, axis: number) => {
    const value = Math.sin(seed * 12.9898 + index * 78.233 + axis * 37.719) * 43758.5453;
    return value - Math.floor(value);
  };

  const points = base.map((point, index) => ({
    x: clampUnit(point.x + (jitter(index, 0) - 0.5) * 0.28),
    y: clampUnit(point.y + (jitter(index, 1) - 0.5) * 0.28),
  }));

  return createMeshPointLayout(points, columns);
}

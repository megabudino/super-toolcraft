import type { ToolcraftCommand } from "@/toolcraft/runtime";

import {
  clampUnit,
  getMeshBasePointCount,
  isMeshEdgePoint,
  MESH_MAX_POINTS,
  readColorHex,
  type MeshHandleDirection,
  type MeshPoint,
  type MeshPointHandles,
  type MeshPointLayout,
  readMeshPointLayout,
} from "./mesh-model";

function isPinnedMeshPoint(
  layout: MeshPointLayout,
  index: number,
  columns: number,
  pinEdges: boolean,
): boolean {
  const basePointCount = getMeshBasePointCount(layout);
  return (
    pinEdges &&
    index < basePointCount &&
    isMeshEdgePoint(index, basePointCount, columns)
  );
}

const handleKeyByDirection = {
  down: "handleDown",
  left: "handleLeft",
  right: "handleRight",
  up: "handleUp",
} as const satisfies Record<MeshHandleDirection, keyof MeshPointHandles>;

const oppositeDirection = {
  down: "up",
  left: "right",
  right: "left",
  up: "down",
} as const satisfies Record<MeshHandleDirection, MeshHandleDirection>;

export type MeshSelectionMode = "add" | "replace" | "toggle";

export type MeshSelectionBounds = Readonly<{
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}>;

export type MeshTopologyDeletion = Readonly<{
  colors: readonly string[];
  columns: number;
  kind: "column" | "row";
  layout: MeshPointLayout;
}>;

export type MeshTopologyInsertion = Readonly<{
  colors: readonly string[];
  columns: number;
  kind: "column" | "row";
  layout: MeshPointLayout;
}>;

function withSelectedIndices(
  layout: MeshPointLayout,
  selectedIndices: readonly number[],
): MeshPointLayout {
  const safeSelectedIndices = Array.from(
    new Set(
      selectedIndices.filter(
        (index) => Number.isInteger(index) && index >= 0 && index < layout.points.length,
      ),
    ),
  ).sort((left, right) => left - right);
  return {
    ...layout,
    selectedIndex: safeSelectedIndices[0] ?? -1,
    selectedIndices: safeSelectedIndices,
  };
}

export function updateMeshPointLayout({
  columns,
  count,
  index,
  layoutValue,
  pinEdges,
  x,
  y,
}: {
  columns: number;
  count: number;
  index: number;
  layoutValue: unknown;
  pinEdges: boolean;
  x: number;
  y: number;
}): MeshPointLayout {
  const layout = readMeshPointLayout(layoutValue, count, columns);
  if (
    !layout.points[index] ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    isPinnedMeshPoint(layout, index, columns, pinEdges)
  ) {
    return layout;
  }

  const points = layout.points.map((point, pointIndex) =>
    pointIndex === index ? { x, y } : point,
  );
  return { ...layout, points };
}

export function updateMeshPointHandle({
  columns,
  count,
  direction,
  index,
  layoutValue,
  x,
  y,
}: {
  columns: number;
  count: number;
  direction: MeshHandleDirection;
  index: number;
  layoutValue: unknown;
  x: number;
  y: number;
}): MeshPointLayout {
  const layout = readMeshPointLayout(layoutValue, count, columns);
  const point = layout.points[index];
  const pointHandles = layout.handles[index];
  if (!point || !pointHandles || !Number.isFinite(x) || !Number.isFinite(y)) {
    return layout;
  }

  const vector: MeshPoint = { x: x - point.x, y: y - point.y };
  const key = handleKeyByDirection[direction];
  const oppositeKey = handleKeyByDirection[oppositeDirection[direction]];
  const nextPointHandles: MeshPointHandles = {
    ...pointHandles,
    [key]: vector,
    ...(pointHandles.type === "smooth"
      ? { [oppositeKey]: { x: -vector.x, y: -vector.y } }
      : {}),
  };
  const handles = layout.handles.map((current, pointIndex) =>
    pointIndex === index ? nextPointHandles : current,
  );

  return { ...layout, handles };
}

export function toggleMeshPointHandleMode({
  columns,
  count,
  index,
  layoutValue,
}: {
  columns: number;
  count: number;
  index: number;
  layoutValue: unknown;
}): MeshPointLayout {
  const layout = readMeshPointLayout(layoutValue, count, columns);
  const pointHandles = layout.handles[index];
  if (!pointHandles) return layout;

  const type = pointHandles.type === "smooth" ? "corner" : "smooth";
  let nextPointHandles: MeshPointHandles = { ...pointHandles, type };
  if (type === "smooth") {
    const horizontalLength =
      (Math.abs(pointHandles.handleLeft.x) + Math.abs(pointHandles.handleRight.x)) / 2;
    const verticalLength =
      (Math.abs(pointHandles.handleUp.y) + Math.abs(pointHandles.handleDown.y)) / 2;
    nextPointHandles = {
      handleDown: { x: 0, y: verticalLength },
      handleLeft: { x: -horizontalLength, y: 0 },
      handleRight: { x: horizontalLength, y: 0 },
      handleUp: { x: 0, y: -verticalLength },
      type,
    };
  }

  const handles = layout.handles.map((current, pointIndex) =>
    pointIndex === index ? nextPointHandles : current,
  );
  return { ...layout, handles };
}

export function selectMeshPoint({
  columns,
  count,
  index,
  layoutValue,
  mode = "replace",
}: {
  columns: number;
  count: number;
  index: number;
  layoutValue: unknown;
  mode?: MeshSelectionMode;
}): MeshPointLayout {
  const layout = readMeshPointLayout(layoutValue, count, columns);
  if (!layout.points[index]) return layout;

  const selected = layout.selectedIndices.includes(index);
  if (mode === "add") {
    return selected
      ? layout
      : withSelectedIndices(layout, [...layout.selectedIndices, index]);
  }
  if (mode === "toggle") {
    return withSelectedIndices(
      layout,
      selected
        ? layout.selectedIndices.filter((selectedIndex) => selectedIndex !== index)
        : [...layout.selectedIndices, index],
    );
  }
  return withSelectedIndices(layout, [index]);
}

export function clearMeshPointSelection({
  columns,
  count,
  layoutValue,
}: {
  columns: number;
  count: number;
  layoutValue: unknown;
}): MeshPointLayout {
  return withSelectedIndices(
    readMeshPointLayout(layoutValue, count, columns),
    [],
  );
}

export function selectMeshPointsInBounds({
  bounds,
  columns,
  count,
  layoutValue,
  mode,
  pinEdges,
}: {
  bounds: MeshSelectionBounds;
  columns: number;
  count: number;
  layoutValue: unknown;
  mode: "add" | "replace";
  pinEdges: boolean;
}): MeshPointLayout {
  const layout = readMeshPointLayout(layoutValue, count, columns);
  const matches = layout.points.flatMap((point, index) =>
    !isPinnedMeshPoint(layout, index, columns, pinEdges) &&
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
      ? [index]
      : [],
  );
  return withSelectedIndices(
    layout,
    mode === "add" ? [...layout.selectedIndices, ...matches] : matches,
  );
}

export function moveSelectedMeshPoints({
  columns,
  count,
  deltaX,
  deltaY,
  layoutValue,
  pinEdges,
}: {
  columns: number;
  count: number;
  deltaX: number;
  deltaY: number;
  layoutValue: unknown;
  pinEdges: boolean;
}): MeshPointLayout {
  const layout = readMeshPointLayout(layoutValue, count, columns);
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return layout;
  const selected = new Set(layout.selectedIndices);
  return {
    ...layout,
    points: layout.points.map((point, index) =>
      selected.has(index) && !isPinnedMeshPoint(layout, index, columns, pinEdges)
        ? { x: point.x + deltaX, y: point.y + deltaY }
        : point,
    ),
  };
}

function evaluateCubicPoint(
  start: MeshPoint,
  startHandle: MeshPoint,
  endHandle: MeshPoint,
  end: MeshPoint,
  value: number,
): MeshPoint {
  const t = clampUnit(value);
  const inverse = 1 - t;
  const inverseSquared = inverse * inverse;
  const squared = t * t;
  return {
    x:
      inverseSquared * inverse * start.x +
      3 * inverseSquared * t * (start.x + startHandle.x) +
      3 * inverse * squared * (end.x + endHandle.x) +
      squared * t * end.x,
    y:
      inverseSquared * inverse * start.y +
      3 * inverseSquared * t * (start.y + startHandle.y) +
      3 * inverse * squared * (end.y + endHandle.y) +
      squared * t * end.y,
  };
}

function interpolateHexColor(leftValue: string, rightValue: string, value: number): string {
  const left = readColorHex(leftValue, "#000000").slice(1);
  const right = readColorHex(rightValue, "#000000").slice(1);
  const t = clampUnit(value);
  return `#${[0, 2, 4]
    .map((offset) => {
      const start = Number.parseInt(left.slice(offset, offset + 2), 16);
      const end = Number.parseInt(right.slice(offset, offset + 2), 16);
      return Math.round(start + (end - start) * t)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`.toUpperCase();
}

function createInsertedPointHandles({
  column,
  columns,
  row,
  rows,
}: {
  column: number;
  columns: number;
  row: number;
  rows: number;
}): MeshPointHandles {
  const horizontalLength = 1 / Math.max(1, columns - 1) / 3;
  const verticalLength = 1 / Math.max(1, rows - 1) / 3;
  return {
    handleDown: row < rows - 1 ? { x: 0, y: verticalLength } : { x: 0, y: 0 },
    handleLeft: column > 0 ? { x: -horizontalLength, y: 0 } : { x: 0, y: 0 },
    handleRight: column < columns - 1 ? { x: horizontalLength, y: 0 } : { x: 0, y: 0 },
    handleUp: row > 0 ? { x: 0, y: -verticalLength } : { x: 0, y: 0 },
    type: "smooth",
  };
}

function readRectangularMesh({
  colors,
  columns,
  layoutValue,
}: {
  colors: readonly string[];
  columns: number;
  layoutValue: unknown;
}): Readonly<{ columns: number; layout: MeshPointLayout; rows: number }> | null {
  const safeColumns = Math.max(2, Math.round(columns));
  const layout = readMeshPointLayout(layoutValue, colors.length, safeColumns);
  const rows = layout.points.length / safeColumns;
  if (
    !Number.isInteger(rows) ||
    rows < 2 ||
    layout.points.length !== colors.length ||
    layout.handles.length !== layout.points.length
  ) {
    return null;
  }
  return { columns: safeColumns, layout, rows };
}

export function insertMeshColumn({
  colors,
  column,
  columns,
  layoutValue,
  t,
}: {
  colors: readonly string[];
  column: number;
  columns: number;
  layoutValue: unknown;
  t: number;
}): MeshTopologyInsertion | null {
  const mesh = readRectangularMesh({ colors, columns, layoutValue });
  if (
    !mesh ||
    !Number.isInteger(column) ||
    column < 0 ||
    column >= mesh.columns - 1 ||
    mesh.rows * (mesh.columns + 1) > MESH_MAX_POINTS
  ) {
    return null;
  }

  const nextColumns = mesh.columns + 1;
  const nextPoints: MeshPoint[] = [];
  const nextColors: string[] = [];
  const nextHandles: MeshPointHandles[] = [];
  for (let row = 0; row < mesh.rows; row += 1) {
    for (let currentColumn = 0; currentColumn < mesh.columns; currentColumn += 1) {
      const index = row * mesh.columns + currentColumn;
      nextPoints.push(mesh.layout.points[index]!);
      nextColors.push(colors[index]!);
      nextHandles.push(mesh.layout.handles[index]!);
      if (currentColumn !== column) continue;

      const rightIndex = index + 1;
      nextPoints.push(
        evaluateCubicPoint(
          mesh.layout.points[index]!,
          mesh.layout.handles[index]!.handleRight,
          mesh.layout.handles[rightIndex]!.handleLeft,
          mesh.layout.points[rightIndex]!,
          t,
        ),
      );
      nextColors.push(interpolateHexColor(colors[index]!, colors[rightIndex]!, t));
      nextHandles.push(
        createInsertedPointHandles({
          column: column + 1,
          columns: nextColumns,
          row,
          rows: mesh.rows,
        }),
      );
    }
  }

  return {
    colors: nextColors,
    columns: nextColumns,
    kind: "column",
    layout: {
      baseColumns: nextColumns,
      basePointCount: nextPoints.length,
      handles: nextHandles,
      points: nextPoints,
      selectedIndex: -1,
      selectedIndices: [],
    },
  };
}

export function insertMeshRow({
  colors,
  columns,
  layoutValue,
  row,
  t,
}: {
  colors: readonly string[];
  columns: number;
  layoutValue: unknown;
  row: number;
  t: number;
}): MeshTopologyInsertion | null {
  const mesh = readRectangularMesh({ colors, columns, layoutValue });
  if (
    !mesh ||
    !Number.isInteger(row) ||
    row < 0 ||
    row >= mesh.rows - 1 ||
    (mesh.rows + 1) * mesh.columns > MESH_MAX_POINTS
  ) {
    return null;
  }

  const nextRows = mesh.rows + 1;
  const nextPoints: MeshPoint[] = [];
  const nextColors: string[] = [];
  const nextHandles: MeshPointHandles[] = [];
  for (let currentRow = 0; currentRow < mesh.rows; currentRow += 1) {
    for (let column = 0; column < mesh.columns; column += 1) {
      const index = currentRow * mesh.columns + column;
      nextPoints.push(mesh.layout.points[index]!);
      nextColors.push(colors[index]!);
      nextHandles.push(mesh.layout.handles[index]!);
    }
    if (currentRow !== row) continue;

    for (let column = 0; column < mesh.columns; column += 1) {
      const index = currentRow * mesh.columns + column;
      const downIndex = index + mesh.columns;
      nextPoints.push(
        evaluateCubicPoint(
          mesh.layout.points[index]!,
          mesh.layout.handles[index]!.handleDown,
          mesh.layout.handles[downIndex]!.handleUp,
          mesh.layout.points[downIndex]!,
          t,
        ),
      );
      nextColors.push(interpolateHexColor(colors[index]!, colors[downIndex]!, t));
      nextHandles.push(
        createInsertedPointHandles({
          column,
          columns: mesh.columns,
          row: row + 1,
          rows: nextRows,
        }),
      );
    }
  }

  return {
    colors: nextColors,
    columns: mesh.columns,
    kind: "row",
    layout: {
      baseColumns: mesh.columns,
      basePointCount: nextPoints.length,
      handles: nextHandles,
      points: nextPoints,
      selectedIndex: -1,
      selectedIndices: [],
    },
  };
}

export function deleteSelectedMeshLine({
  colors,
  columns,
  layoutValue,
}: {
  colors: readonly string[];
  columns: number;
  layoutValue: unknown;
}): MeshTopologyDeletion | null {
  const safeColumns = Math.max(2, Math.round(columns));
  const layout = readMeshPointLayout(layoutValue, colors.length, safeColumns);
  const selectedIndex = layout.selectedIndices[0];
  if (selectedIndex === undefined) return null;

  const rows = Math.ceil(layout.points.length / safeColumns);
  const row = Math.floor(selectedIndex / safeColumns);
  const column = selectedIndex % safeColumns;
  let kind: MeshTopologyDeletion["kind"] | null = null;
  let lineIndex = -1;

  if (row === 0 && rows > 2) {
    kind = "row";
    lineIndex = 0;
  } else if (row === rows - 1 && rows > 2) {
    kind = "row";
    lineIndex = row;
  } else if (column === 0 && safeColumns > 2) {
    kind = "column";
    lineIndex = 0;
  } else if (column === safeColumns - 1 && safeColumns > 2) {
    kind = "column";
    lineIndex = column;
  } else if (rows > 2) {
    kind = "row";
    lineIndex = row;
  }

  if (!kind) return null;
  const keepIndex = (index: number) =>
    kind === "row"
      ? Math.floor(index / safeColumns) !== lineIndex
      : index % safeColumns !== lineIndex;
  const points = layout.points.filter((_, index) => keepIndex(index));
  if (points.length < 4) return null;
  const handles = layout.handles.filter((_, index) => keepIndex(index));

  return {
    colors: colors.filter((_, index) => keepIndex(index)),
    columns: kind === "column" ? safeColumns - 1 : safeColumns,
    kind,
    layout: {
      baseColumns: kind === "column" ? safeColumns - 1 : safeColumns,
      basePointCount: points.length,
      handles,
      points,
      selectedIndex: -1,
      selectedIndices: [],
    },
  };
}

export function createMeshPointCommand({
  historyGroup,
  label = "Move mesh point",
  layout,
  record,
}: {
  historyGroup?: string;
  label?: string;
  layout: MeshPointLayout;
  record: boolean;
}): ToolcraftCommand {
  return {
    ...(historyGroup ? { historyGroup } : {}),
    history: record ? "merge" : "skip",
    label: record ? label : "Select mesh point",
    target: "mesh.points",
    type: "controls.setValue",
    value: layout,
  };
}

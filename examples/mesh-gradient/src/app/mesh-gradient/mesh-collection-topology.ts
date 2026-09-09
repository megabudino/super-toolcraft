import {
  clampUnit,
  createGridPoints,
  createMeshPointLayout,
  createZeroMeshHandles,
  getMeshBasePointCount,
  MESH_MAX_COLUMNS,
  MESH_MAX_POINTS,
  readMeshPointLayout,
  readMeshTopologySnapshot,
  type MeshInsertedPoint,
  type MeshPoint,
  type MeshPointLayout,
} from "./mesh-model";

export type MeshCollectionTopologyReconciliation = Readonly<{
  colors: readonly string[];
  columns: number;
  label: string;
  layout: MeshPointLayout;
}>;

function readStoredPointCount(value: unknown): number | null {
  if (typeof value !== "object" || value === null) return null;
  const points = (value as { points?: unknown }).points;
  return Array.isArray(points) ? points.length : null;
}

function hasRectangularColumnCount(pointCount: number): boolean {
  return Array.from({ length: MESH_MAX_COLUMNS - 1 }, (_, index) => index + 2).some(
    (columns) => pointCount % columns === 0 && pointCount / columns >= 2,
  );
}

function readStoredBasePointCount(
  value: unknown,
  pointCount: number,
  columns: number,
): number {
  if (typeof value === "object" && value !== null) {
    const candidate = (value as { basePointCount?: unknown }).basePointCount;
    if (
      typeof candidate === "number" &&
      Number.isInteger(candidate) &&
      candidate >= 4 &&
      candidate <= pointCount &&
      hasRectangularColumnCount(candidate)
    ) {
      return candidate;
    }
  }
  const completePrefix = Math.floor(pointCount / columns) * columns;
  return completePrefix >= 4 ? completePrefix : pointCount;
}

function readStoredBaseColumns(value: unknown, basePointCount: number): number | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = (value as { baseColumns?: unknown }).baseColumns;
  return typeof candidate === "number" &&
    Number.isInteger(candidate) &&
    candidate >= 2 &&
    candidate <= MESH_MAX_COLUMNS &&
    basePointCount % candidate === 0 &&
    basePointCount / candidate >= 2
    ? candidate
    : null;
}

function findClosestCompleteColumnCount(pointCount: number, requested: number): number | null {
  const candidates = Array.from(
    { length: MESH_MAX_COLUMNS - 1 },
    (_, index) => index + 2,
  ).filter((columns) => pointCount % columns === 0 && pointCount / columns >= 2);
  candidates.sort(
    (left, right) => Math.abs(left - requested) - Math.abs(right - requested) || left - right,
  );
  return candidates[0] ?? null;
}

function reflowCompleteBaseGrid({
  basePointCount,
  columns,
  layoutValue,
  pointCount,
}: {
  basePointCount: number;
  columns: number;
  layoutValue: unknown;
  pointCount: number;
}): MeshPointLayout {
  const structural = createMeshPointLayout(createGridPoints(basePointCount, columns), columns);
  const sourceLayout = readMeshPointLayout(layoutValue, pointCount, columns);
  const rows = basePointCount / columns;
  const insertedPoints = sourceLayout.points.slice(basePointCount).map((point, offset) => {
    const scaledX = clampUnit(point.x) * (columns - 1);
    const scaledY = clampUnit(point.y) * (rows - 1);
    const column = Math.max(0, Math.min(columns - 2, Math.floor(scaledX)));
    const row = Math.max(0, Math.min(rows - 2, Math.floor(scaledY)));
    return {
      column,
      pointIndex: basePointCount + offset,
      row,
      u: clampUnit(scaledX - column),
      v: clampUnit(scaledY - row),
    };
  });
  return {
    ...structural,
    handles: [
      ...structural.handles,
      ...insertedPoints.map(() => createZeroMeshHandles()),
    ],
    insertedPoints,
    points: [
      ...structural.points,
      ...sourceLayout.points.slice(basePointCount),
    ],
    selectedIndex: sourceLayout.selectedIndex,
    selectedIndices: sourceLayout.selectedIndices,
  };
}

const insertionSlots = [
  { u: 0.5, v: 0.5 },
  { u: 0.32, v: 0.28 },
  { u: 0.72, v: 0.34 },
  { u: 0.66, v: 0.76 },
  { u: 0.27, v: 0.68 },
  { u: 0.5, v: 0.22 },
  { u: 0.78, v: 0.55 },
  { u: 0.48, v: 0.82 },
  { u: 0.2, v: 0.46 },
] as const;

function interpolateCellPoint({
  columns,
  column,
  layout,
  row,
  u,
  v,
}: {
  columns: number;
  column: number;
  layout: MeshPointLayout;
  row: number;
  u: number;
  v: number;
}): MeshPoint | null {
  const topLeft = layout.points[row * columns + column];
  const topRight = layout.points[row * columns + column + 1];
  const bottomLeft = layout.points[(row + 1) * columns + column];
  const bottomRight = layout.points[(row + 1) * columns + column + 1];
  if (!topLeft || !topRight || !bottomLeft || !bottomRight) return null;
  return {
    x:
      topLeft.x * (1 - u) * (1 - v) +
      topRight.x * u * (1 - v) +
      bottomLeft.x * (1 - u) * v +
      bottomRight.x * u * v,
    y:
      topLeft.y * (1 - u) * (1 - v) +
      topRight.y * u * (1 - v) +
      bottomLeft.y * (1 - u) * v +
      bottomRight.y * u * v,
  };
}

function chooseCell(layout: MeshPointLayout, columns: number) {
  const basePointCount = getMeshBasePointCount(layout);
  const rows = basePointCount / columns;
  if (!Number.isInteger(rows) || rows < 2) return null;
  const selectedIndex = layout.selectedIndices.length === 1
    ? layout.selectedIndices[0]!
    : -1;
  const selectedInsertion = layout.insertedPoints?.find(
    (item) => item.pointIndex === selectedIndex,
  );
  if (selectedInsertion) {
    return { column: selectedInsertion.column, row: selectedInsertion.row };
  }
  if (selectedIndex >= 0 && selectedIndex < basePointCount) {
    return {
      column: Math.max(0, Math.min(columns - 2, selectedIndex % columns)),
      row: Math.max(0, Math.min(rows - 2, Math.floor(selectedIndex / columns))),
    };
  }
  return {
    column: Math.max(0, Math.min(columns - 2, Math.floor((columns - 1) / 2))),
    row: Math.max(0, Math.min(rows - 2, Math.floor((rows - 1) / 2))),
  };
}

function addOnePoint(layout: MeshPointLayout, columns: number): MeshPointLayout | null {
  if (layout.points.length >= MESH_MAX_POINTS) return null;
  const cell = chooseCell(layout, columns);
  if (!cell) return null;
  const usedSlots = (layout.insertedPoints ?? []).filter(
    (item) => item.column === cell.column && item.row === cell.row,
  ).length;
  const slot = insertionSlots[usedSlots % insertionSlots.length]!;
  const point = interpolateCellPoint({ ...cell, columns, layout, ...slot });
  if (!point) return null;
  const pointIndex = layout.points.length;
  const insertedPoint: MeshInsertedPoint = {
    ...cell,
    pointIndex,
    ...slot,
  };
  return {
    ...layout,
    basePointCount: getMeshBasePointCount(layout),
    handles: [...layout.handles, createZeroMeshHandles()],
    insertedPoints: [...(layout.insertedPoints ?? []), insertedPoint],
    points: [...layout.points, point],
    selectedIndex: pointIndex,
    selectedIndices: [pointIndex],
  };
}

function removeSelectedInsertedPoint(layout: MeshPointLayout): MeshPointLayout | null {
  if (layout.selectedIndices.length !== 1) return null;
  const selectedIndex = layout.selectedIndices[0]!;
  if (selectedIndex < getMeshBasePointCount(layout)) return null;
  if (!(layout.insertedPoints ?? []).some((item) => item.pointIndex === selectedIndex)) {
    return null;
  }
  return {
    ...layout,
    handles: layout.handles.filter((_, index) => index !== selectedIndex),
    insertedPoints: (layout.insertedPoints ?? [])
      .filter((item) => item.pointIndex !== selectedIndex)
      .map((item) => ({
        ...item,
        pointIndex: item.pointIndex > selectedIndex ? item.pointIndex - 1 : item.pointIndex,
      })),
    points: layout.points.filter((_, index) => index !== selectedIndex),
    selectedIndex: -1,
    selectedIndices: [],
  };
}

export function reconcileMeshCollectionTopology({
  colors,
  columns,
  layoutValue,
}: {
  colors: readonly string[];
  columns: number;
  layoutValue: unknown;
}): MeshCollectionTopologyReconciliation | null {
  if (readMeshTopologySnapshot(layoutValue)) {
    return null;
  }

  const safeColumns = Math.max(2, Math.min(MESH_MAX_COLUMNS, Math.round(columns)));
  const storedPointCount = readStoredPointCount(layoutValue);
  if (storedPointCount === null) return null;
  const storedBasePointCount = readStoredBasePointCount(
    layoutValue,
    storedPointCount,
    safeColumns,
  );
  const completeColumns = findClosestCompleteColumnCount(
    storedBasePointCount,
    safeColumns,
  );
  const targetColumns = completeColumns ?? safeColumns;
  const storedBaseColumns = readStoredBaseColumns(layoutValue, storedBasePointCount);
  if (storedBaseColumns === null && targetColumns === safeColumns) {
    return {
      colors,
      columns: safeColumns,
      label: "Migrate mesh columns",
      layout: {
        ...readMeshPointLayout(layoutValue, storedPointCount, safeColumns),
        baseColumns: safeColumns,
      },
    };
  }
  if (storedBaseColumns !== targetColumns || targetColumns !== safeColumns) {
    return {
      colors,
      columns: targetColumns,
      label: "Reflow mesh columns",
      layout:
        storedBaseColumns === targetColumns
          ? readMeshPointLayout(layoutValue, storedPointCount, targetColumns)
          : reflowCompleteBaseGrid({
              basePointCount: storedBasePointCount,
              columns: targetColumns,
              layoutValue,
              pointCount: storedPointCount,
            }),
    };
  }
  const layout = readMeshPointLayout(layoutValue, storedPointCount, safeColumns);
  if (storedPointCount === colors.length) return null;

  if (colors.length > storedPointCount) {
    let nextLayout: MeshPointLayout | null = layout;
    while (nextLayout.points.length < colors.length) {
      nextLayout = addOnePoint(nextLayout, safeColumns);
      if (!nextLayout) break;
    }
    if (nextLayout && nextLayout.points.length === colors.length) {
      return {
        colors,
        columns: safeColumns,
        label: "Add mesh point",
        layout: nextLayout,
      };
    }
  }

  if (colors.length < storedPointCount) {
    let nextLayout: MeshPointLayout | null = layout;
    while (nextLayout.points.length > colors.length) {
      const selectedRemoval = removeSelectedInsertedPoint(nextLayout);
      const fallbackIndex: number = nextLayout.insertedPoints?.at(-1)?.pointIndex ?? -1;
      nextLayout = selectedRemoval ?? (
        fallbackIndex >= 0
          ? removeSelectedInsertedPoint({
              ...nextLayout,
              selectedIndex: fallbackIndex,
              selectedIndices: [fallbackIndex],
            })
          : null
      );
      if (!nextLayout) break;
    }
    if (nextLayout && nextLayout.points.length === colors.length) {
      return {
        colors,
        columns: safeColumns,
        label: "Remove mesh point",
        layout: nextLayout,
      };
    }
  }

  return null;
}

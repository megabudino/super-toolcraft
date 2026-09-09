import type { MeshPointLayout } from "./mesh-model";

export type MeshCellVertex = Readonly<{
  pointIndex: number;
  u: number;
  v: number;
}>;

export type MeshCellTriangle = readonly [MeshCellVertex, MeshCellVertex, MeshCellVertex];

export type MeshCellConnectorEdge = Readonly<{
  endIndex: number;
  startIndex: number;
}>;

function signedArea(
  first: MeshCellVertex,
  second: MeshCellVertex,
  third: MeshCellVertex,
): number {
  return (
    (second.u - first.u) * (third.v - first.v) -
    (second.v - first.v) * (third.u - first.u)
  );
}

function containsPoint(triangle: MeshCellTriangle, point: MeshCellVertex): boolean {
  const [first, second, third] = triangle;
  const area = signedArea(first, second, third);
  if (Math.abs(area) < 1e-8) return false;
  const firstWeight = signedArea(point, second, third) / area;
  const secondWeight = signedArea(first, point, third) / area;
  const thirdWeight = signedArea(first, second, point) / area;
  const epsilon = 1e-7;
  return (
    firstWeight >= -epsilon &&
    secondWeight >= -epsilon &&
    thirdWeight >= -epsilon
  );
}

export function createMeshCellTriangles(
  layout: MeshPointLayout,
  columns: number,
  row: number,
  column: number,
): MeshCellTriangle[] {
  const topLeft: MeshCellVertex = { pointIndex: row * columns + column, u: 0, v: 0 };
  const topRight: MeshCellVertex = { pointIndex: row * columns + column + 1, u: 1, v: 0 };
  const bottomLeft: MeshCellVertex = {
    pointIndex: (row + 1) * columns + column,
    u: 0,
    v: 1,
  };
  const bottomRight: MeshCellVertex = {
    pointIndex: (row + 1) * columns + column + 1,
    u: 1,
    v: 1,
  };
  const insertions = (layout.insertedPoints ?? [])
    .filter((item) => item.row === row && item.column === column)
    .map((item): MeshCellVertex => ({
      pointIndex: item.pointIndex,
      u: item.u,
      v: item.v,
    }));
  const firstInsertion = insertions[0];
  if (!firstInsertion) return [];

  let triangles: MeshCellTriangle[] = [
    [topLeft, topRight, firstInsertion],
    [topRight, bottomRight, firstInsertion],
    [bottomRight, bottomLeft, firstInsertion],
    [bottomLeft, topLeft, firstInsertion],
  ];

  for (const insertion of insertions.slice(1)) {
    const triangleIndex = triangles.findIndex((triangle) => containsPoint(triangle, insertion));
    if (triangleIndex < 0) continue;
    const [first, second, third] = triangles[triangleIndex]!;
    triangles = [
      ...triangles.slice(0, triangleIndex),
      [first, second, insertion],
      [second, third, insertion],
      [third, first, insertion],
      ...triangles.slice(triangleIndex + 1),
    ];
  }

  return triangles.filter(
    (triangle) => Math.abs(signedArea(triangle[0], triangle[1], triangle[2])) > 1e-8,
  );
}

export function createMeshCellConnectorEdges(
  layout: MeshPointLayout,
  columns: number,
): MeshCellConnectorEdge[] {
  const basePointCount = layout.basePointCount ?? layout.points.length;
  const rows = Math.floor(basePointCount / columns);
  const edges = new Map<string, MeshCellConnectorEdge>();

  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      for (const triangle of createMeshCellTriangles(layout, columns, row, column)) {
        const pairs = [
          [triangle[0], triangle[1]],
          [triangle[1], triangle[2]],
          [triangle[2], triangle[0]],
        ] as const;
        for (const [start, end] of pairs) {
          if (start.pointIndex < basePointCount && end.pointIndex < basePointCount) continue;
          const startIndex = Math.min(start.pointIndex, end.pointIndex);
          const endIndex = Math.max(start.pointIndex, end.pointIndex);
          edges.set(`${startIndex}-${endIndex}`, { endIndex, startIndex });
        }
      }
    }
  }

  return [...edges.values()];
}

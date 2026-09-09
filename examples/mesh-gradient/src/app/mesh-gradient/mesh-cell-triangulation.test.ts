import { describe, expect, it } from "vitest";

import { createMeshCellConnectorEdges, createMeshCellTriangles } from "./mesh-cell-triangulation";
import { createGridPoints, createMeshPointLayout, type MeshPointLayout } from "./mesh-model";

function createInsertedLayout(count: number): MeshPointLayout {
  const base = createMeshPointLayout(createGridPoints(12, 4), 4);
  const slots = [
    { u: 0.5, v: 0.5 },
    { u: 0.32, v: 0.28 },
  ];
  return {
    ...base,
    handles: [...base.handles, ...slots.slice(0, count).map(() => base.handles[5]!)],
    insertedPoints: slots.slice(0, count).map((slot, offset) => ({
      column: 1,
      pointIndex: 12 + offset,
      row: 1,
      ...slot,
    })),
    points: [...base.points, ...slots.slice(0, count).map(() => ({ x: 0.5, y: 0.75 }))],
  };
}

describe("mesh cell triangulation", () => {
  it("splits one host cell into four triangles around the inserted point", () => {
    const triangles = createMeshCellTriangles(createInsertedLayout(1), 4, 1, 1);

    expect(triangles).toHaveLength(4);
    expect(triangles.every((triangle) => triangle.some((vertex) => vertex.pointIndex === 12))).toBe(true);
  });

  it("adds one local split for each additional point and returns unique connector edges", () => {
    const layout = createInsertedLayout(2);
    const triangles = createMeshCellTriangles(layout, 4, 1, 1);
    const edges = createMeshCellConnectorEdges(layout, 4);

    expect(triangles).toHaveLength(6);
    expect(edges.length).toBe(new Set(edges.map((edge) => `${edge.startIndex}-${edge.endIndex}`)).size);
    expect(edges.every((edge) => edge.startIndex >= 12 || edge.endIndex >= 12)).toBe(true);
  });
});

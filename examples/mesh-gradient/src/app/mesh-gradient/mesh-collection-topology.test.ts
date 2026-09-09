import { describe, expect, it } from "vitest";

import { reconcileMeshCollectionTopology } from "./mesh-collection-topology";
import {
  createGridPoints,
  createMeshPointLayout,
  type MeshPointLayout,
} from "./mesh-model";

const createColors = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    `#${(index + 1).toString(16).padStart(6, "0")}`.toUpperCase(),
  );

describe("reconcileMeshCollectionTopology", () => {
  it("adds exactly one point without changing columns or existing positions", () => {
    const colors = createColors(12);
    const layout = createMeshPointLayout(createGridPoints(12, 4), 4);
    const result = reconcileMeshCollectionTopology({
      colors: [...colors, "#7C3AED"],
      columns: 4,
      layoutValue: layout,
    });

    expect(result?.colors).toHaveLength(13);
    expect(result?.columns).toBe(4);
    expect(result?.layout.points).toHaveLength(13);
    expect(result?.layout.points.slice(0, 12)).toEqual(layout.points);
    expect(result?.layout.basePointCount).toBe(12);
    expect(result?.layout.insertedPoints).toEqual([
      expect.objectContaining({ column: 1, pointIndex: 12, row: 1 }),
    ]);
    expect(result?.layout.selectedIndices).toEqual([12]);
  });

  it("reconciles rapid additions as independent points instead of a new grid", () => {
    const colors = createColors(12);
    const result = reconcileMeshCollectionTopology({
      colors: [...colors, "#7C3AED", "#22D3EE", "#FB7185"],
      columns: 4,
      layoutValue: createMeshPointLayout(createGridPoints(12, 4), 4),
    });

    expect(result?.layout.basePointCount).toBe(12);
    expect(result?.layout.points).toHaveLength(15);
    expect(result?.layout.insertedPoints).toHaveLength(3);
    expect(result?.columns).toBe(4);
  });

  it("removes exactly the selected inserted point", () => {
    const baseColors = createColors(12);
    const inserted = reconcileMeshCollectionTopology({
      colors: [...baseColors, "#7C3AED"],
      columns: 4,
      layoutValue: createMeshPointLayout(createGridPoints(12, 4), 4),
    });

    const result = reconcileMeshCollectionTopology({
      colors: baseColors,
      columns: 4,
      layoutValue: inserted?.layout,
    });

    expect(result?.colors).toHaveLength(12);
    expect(result?.columns).toBe(4);
    expect(result?.layout.points).toHaveLength(12);
    expect(result?.layout.points).toEqual(createGridPoints(12, 4));
    expect(result?.layout.insertedPoints).toEqual([]);
    expect(result?.layout.selectedIndices).toEqual([]);
  });

  it("ignores a synchronized rectangular topology", () => {
    const colors = createColors(12);

    expect(
      reconcileMeshCollectionTopology({
        colors,
        columns: 4,
        layoutValue: createMeshPointLayout(createGridPoints(12, 4), 4),
      }),
    ).toBeNull();
  });

  it("reflows a complete mesh when the requested column count changes", () => {
    const colors = createColors(12);
    const layout = {
      ...createMeshPointLayout(createGridPoints(12, 4), 4),
      baseColumns: 4,
    };
    const result = reconcileMeshCollectionTopology({
      colors,
      columns: 2,
      layoutValue: layout,
    });

    expect(result?.colors).toEqual(colors);
    expect(result?.columns).toBe(2);
    expect(result?.layout.basePointCount).toBe(12);
    expect(result?.layout.points).toEqual(createGridPoints(12, 2));
  });

  it("migrates a legacy layout without moving its points", () => {
    const colors = createColors(12);
    const { baseColumns: _baseColumns, ...legacyLayout } = createMeshPointLayout(
      createGridPoints(12, 4),
      4,
    );
    const result = reconcileMeshCollectionTopology({
      colors,
      columns: 4,
      layoutValue: legacyLayout,
    });

    expect(result?.label).toBe("Migrate mesh columns");
    expect(result?.columns).toBe(4);
    expect(result?.layout.baseColumns).toBe(4);
    expect(result?.layout.points).toEqual(legacyLayout.points);
  });

  it("preserves an independently inserted point while reflowing columns", () => {
    const colors = createColors(12);
    const inserted = reconcileMeshCollectionTopology({
      colors: [...colors, "#7C3AED"],
      columns: 4,
      layoutValue: createMeshPointLayout(createGridPoints(12, 4), 4),
    });
    const insertedPoint = inserted?.layout.points[12];
    const result = reconcileMeshCollectionTopology({
      colors: inserted?.colors ?? [],
      columns: 2,
      layoutValue: inserted?.layout,
    });

    expect(result?.columns).toBe(2);
    expect(result?.layout.baseColumns).toBe(2);
    expect(result?.layout.basePointCount).toBe(12);
    expect(result?.layout.points.slice(0, 12)).toEqual(createGridPoints(12, 2));
    expect(result?.layout.points[12]).toEqual(insertedPoint);
    expect(result?.layout.insertedPoints).toEqual([
      expect.objectContaining({ pointIndex: 12 }),
    ]);
    expect(result?.layout.selectedIndices).toEqual([12]);
  });

  it("settles an incompatible column choice on the closest complete grid", () => {
    const colors = createColors(12);
    const result = reconcileMeshCollectionTopology({
      colors,
      columns: 7,
      layoutValue: createMeshPointLayout(createGridPoints(12, 4), 4),
    });

    expect(result?.columns).toBe(6);
    expect(result?.layout.basePointCount).toBe(12);
    expect(result?.layout.points).toEqual(createGridPoints(12, 6));
  });

  it("preserves legacy topology snapshots while their update is in flight", () => {
    const colors = createColors(12);
    const layout: MeshPointLayout = {
      ...createMeshPointLayout(createGridPoints(15, 5), 5),
      topologySnapshot: {
        colors: createColors(15),
        columns: 5,
        revision: "test-snapshot",
      },
    };

    expect(
      reconcileMeshCollectionTopology({
        colors,
        columns: 4,
        layoutValue: layout,
      }),
    ).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import {
  createGridPoints,
  createMeshPointLayout,
  readMeshPointLayout,
} from "./mesh-model";
import {
  deleteSelectedMeshLine,
  insertMeshColumn,
  insertMeshRow,
  moveSelectedMeshPoints,
  selectMeshPointsInBounds,
  selectMeshPoint,
  toggleMeshPointHandleMode,
  updateMeshPointHandle,
  updateMeshPointLayout,
} from "./mesh-point-interaction";

describe("ColorFlow canvas point mechanics", () => {
  it("starts with no selected node and reveals handles only after selection", () => {
    expect(createMeshPointLayout(createGridPoints(9, 3), 3).selectedIndex).toBe(-1);
    expect(createMeshPointLayout(createGridPoints(9, 3), 3).selectedIndices).toEqual([]);
    expect(readMeshPointLayout(undefined, 9, 3).selectedIndex).toBe(-1);
  });

  it("migrates the legacy selected index and preserves ColorFlow modifier selection", () => {
    const legacy = readMeshPointLayout(
      { points: createGridPoints(9, 3), selectedIndex: 4 },
      9,
      3,
    );
    const added = selectMeshPoint({
      columns: 3,
      count: 9,
      index: 8,
      layoutValue: legacy,
      mode: "add",
    });
    const toggled = selectMeshPoint({
      columns: 3,
      count: 9,
      index: 4,
      layoutValue: added,
      mode: "toggle",
    });

    expect(legacy.selectedIndices).toEqual([4]);
    expect(added.selectedIndices).toEqual([4, 8]);
    expect(toggled.selectedIndices).toEqual([8]);
    expect(toggled.selectedIndex).toBe(8);
  });

  it("selects an unbounded marquee and adds with Shift semantics", () => {
    const initial = createMeshPointLayout(createGridPoints(9, 3), 3, 8);
    const selected = selectMeshPointsInBounds({
      bounds: { maxX: 0.6, maxY: 0.6, minX: -0.1, minY: -0.1 },
      columns: 3,
      count: 9,
      layoutValue: initial,
      mode: "replace",
      pinEdges: false,
    });
    const added = selectMeshPointsInBounds({
      bounds: { maxX: 1.2, maxY: 1.2, minX: 0.9, minY: 0.9 },
      columns: 3,
      count: 9,
      layoutValue: selected,
      mode: "add",
      pinEdges: false,
    });

    expect(selected.selectedIndices).toEqual([0, 1, 3, 4]);
    expect(added.selectedIndices).toEqual([0, 1, 3, 4, 8]);
  });

  it("moves every selected point by the same unbounded delta", () => {
    const initial = readMeshPointLayout(
      {
        points: createGridPoints(9, 3),
        selectedIndices: [0, 4, 8],
      },
      9,
      3,
    );
    const moved = moveSelectedMeshPoints({
      columns: 3,
      count: 9,
      deltaX: -0.3,
      deltaY: 0.4,
      layoutValue: initial,
      pinEdges: false,
    });

    expect(moved.points[0]).toEqual({ x: -0.3, y: 0.4 });
    expect(moved.points[4]).toEqual({ x: 0.2, y: 0.9 });
    expect(moved.points[8]).toEqual({ x: 0.7, y: 1.4 });
    expect(moved.selectedIndices).toEqual([0, 4, 8]);
  });

  it("stores four directional handles and omits unavailable perimeter directions", () => {
    const layout = readMeshPointLayout(
      { points: createGridPoints(9, 3), selectedIndex: 4 },
      9,
      3,
    );

    expect(layout.handles).toHaveLength(9);
    expect(layout.handles[0]?.handleLeft).toEqual({ x: 0, y: 0 });
    expect(layout.handles[0]?.handleUp).toEqual({ x: 0, y: 0 });
    expect(layout.handles[4]?.handleRight.x).toBeGreaterThan(0);
    expect(layout.handles[4]?.handleDown.y).toBeGreaterThan(0);
  });

  it("moves an interior point freely beyond the output without changing its handles", () => {
    const initial = createMeshPointLayout(createGridPoints(9, 3), 3, 4);
    const moved = updateMeshPointLayout({
      columns: 3,
      count: 9,
      index: 4,
      layoutValue: initial,
      pinEdges: false,
      x: 1.18,
      y: -0.22,
    });

    expect(moved.points[4]).toEqual({ x: 1.18, y: -0.22 });
    expect(moved.handles[4]).toEqual(initial.handles[4]);
  });

  it("locks the entire perimeter point when Fix edges is enabled", () => {
    const initial = createMeshPointLayout(createGridPoints(9, 3), 3, 4);
    const moved = updateMeshPointLayout({
      columns: 3,
      count: 9,
      index: 1,
      layoutValue: initial,
      pinEdges: true,
      x: 0.7,
      y: 0.4,
    });

    expect(moved.points[1]).toEqual(initial.points[1]);
  });

  it("mirrors the complete opposite vector in smooth mode", () => {
    const initial = createMeshPointLayout(createGridPoints(9, 3), 3, 4);
    const changed = updateMeshPointHandle({
      columns: 3,
      count: 9,
      direction: "right",
      index: 4,
      layoutValue: initial,
      x: 0.78,
      y: 0.39,
    });

    expect(changed.handles[4]?.handleRight).toEqual({
      x: 0.28,
      y: -0.10999999999999999,
    });
    expect(changed.handles[4]?.handleLeft).toEqual({
      x: -0.28,
      y: 0.10999999999999999,
    });
  });

  it("leaves the opposite vector unchanged in corner mode", () => {
    const initial = createMeshPointLayout(createGridPoints(9, 3), 3, 4);
    const corner = toggleMeshPointHandleMode({
      columns: 3,
      count: 9,
      index: 4,
      layoutValue: initial,
    });
    const changed = updateMeshPointHandle({
      columns: 3,
      count: 9,
      direction: "up",
      index: 4,
      layoutValue: corner,
      x: 0.42,
      y: 0.2,
    });

    expect(changed.handles[4]?.type).toBe("corner");
    expect(changed.handles[4]?.handleDown).toEqual(corner.handles[4]?.handleDown);
    expect(changed.handles[4]?.handleUp).toEqual({ x: -0.08000000000000002, y: -0.3 });
  });

  it("restores the reference axis-aligned pairs when smooth mode is re-enabled", () => {
    const initial = createMeshPointLayout(createGridPoints(9, 3), 3, 4);
    const corner = toggleMeshPointHandleMode({
      columns: 3,
      count: 9,
      index: 4,
      layoutValue: initial,
    });
    const changed = updateMeshPointHandle({
      columns: 3,
      count: 9,
      direction: "right",
      index: 4,
      layoutValue: corner,
      x: 0.84,
      y: 0.64,
    });
    const smooth = toggleMeshPointHandleMode({
      columns: 3,
      count: 9,
      index: 4,
      layoutValue: changed,
    });

    expect(smooth.handles[4]).toEqual({
      handleDown: { x: 0, y: 1 / 6 },
      handleLeft: { x: -0.2533333333333333, y: 0 },
      handleRight: { x: 0.2533333333333333, y: 0 },
      handleUp: { x: 0, y: -1 / 6 },
      type: "smooth",
    });
  });

  it("inserts a ColorFlow column on every matching cubic and interpolates its colors", () => {
    const initial = createMeshPointLayout(createGridPoints(12, 4), 4, 5);
    const curved = {
      ...initial,
      handles: initial.handles.map((handles, index) =>
        index === 0
          ? { ...handles, handleRight: { x: 0, y: 1 / 3 } }
          : index === 1
            ? { ...handles, handleLeft: { x: 0, y: 1 / 3 } }
            : handles,
      ),
    };
    const inserted = insertMeshColumn({
      colors: [
        "#000000", "#FFFFFF", "#FF0000", "#00FF00",
        "#000000", "#FFFFFF", "#FF0000", "#00FF00",
        "#000000", "#FFFFFF", "#FF0000", "#00FF00",
      ],
      column: 0,
      columns: 4,
      layoutValue: curved,
      t: 0.5,
    });

    expect(inserted?.kind).toBe("column");
    expect(inserted?.columns).toBe(5);
    expect(inserted?.layout.points).toHaveLength(15);
    expect(inserted?.layout.points[1]).toEqual({ x: 1 / 6, y: 0.25 });
    expect(inserted?.colors[1]).toBe("#808080");
    expect(inserted?.layout.handles[0]).toEqual(curved.handles[0]);
    expect(inserted?.layout.handles[2]).toEqual(curved.handles[1]);
    expect(inserted?.layout.handles[1]).toEqual({
      handleDown: { x: 0, y: 1 / 6 },
      handleLeft: { x: -1 / 12, y: 0 },
      handleRight: { x: 1 / 12, y: 0 },
      handleUp: { x: 0, y: 0 },
      type: "smooth",
    });
    expect(inserted?.layout.selectedIndices).toEqual([]);
  });

  it("inserts a ColorFlow row across every column at one cubic parameter", () => {
    const initial = createMeshPointLayout(createGridPoints(9, 3), 3, 4);
    const inserted = insertMeshRow({
      colors: [
        "#000000", "#FF0000", "#00FF00",
        "#FFFFFF", "#0000FF", "#FFFFFF",
        "#FF00FF", "#00FFFF", "#FFFF00",
      ],
      columns: 3,
      layoutValue: initial,
      row: 0,
      t: 0.25,
    });

    expect(inserted?.kind).toBe("row");
    expect(inserted?.columns).toBe(3);
    expect(inserted?.layout.points).toHaveLength(12);
    expect(inserted?.layout.points[3]).toEqual({ x: 0, y: 0.125 });
    expect(inserted?.colors[3]).toBe("#404040");
    expect(inserted?.layout.handles[3]).toEqual({
      handleDown: { x: 0, y: 1 / 9 },
      handleLeft: { x: 0, y: 0 },
      handleRight: { x: 1 / 6, y: 0 },
      handleUp: { x: 0, y: -1 / 9 },
      type: "smooth",
    });
    expect(inserted?.layout.selectedIndex).toBe(-1);
  });

  it("rejects divider insertion for ragged meshes and beyond sixteen points", () => {
    expect(
      insertMeshColumn({
        colors: Array.from({ length: 10 }, () => "#000000"),
        column: 1,
        columns: 4,
        layoutValue: createMeshPointLayout(createGridPoints(10, 4), 4),
        t: 0.5,
      }),
    ).toBeNull();
    expect(
      insertMeshRow({
        colors: Array.from({ length: 16 }, () => "#000000"),
        columns: 4,
        layoutValue: createMeshPointLayout(createGridPoints(16, 4), 4),
        row: 1,
        t: 0.5,
      }),
    ).toBeNull();
  });

  it("deletes the selected top row before considering its column", () => {
    const layout = readMeshPointLayout(
      { points: createGridPoints(12, 4), selectedIndices: [0] },
      12,
      4,
    );
    const deleted = deleteSelectedMeshLine({
      colors: Array.from({ length: 12 }, (_, index) => `color-${index}`),
      columns: 4,
      layoutValue: layout,
    });

    expect(deleted?.kind).toBe("row");
    expect(deleted?.columns).toBe(4);
    expect(deleted?.colors).toEqual([
      "color-4",
      "color-5",
      "color-6",
      "color-7",
      "color-8",
      "color-9",
      "color-10",
      "color-11",
    ]);
    expect(deleted?.layout.points).toHaveLength(8);
    expect(deleted?.layout.selectedIndices).toEqual([]);
  });

  it("deletes a selected side column when only two rows remain", () => {
    const layout = readMeshPointLayout(
      { points: createGridPoints(8, 4), selectedIndices: [4] },
      8,
      4,
    );
    const deleted = deleteSelectedMeshLine({
      colors: Array.from({ length: 8 }, (_, index) => `color-${index}`),
      columns: 4,
      layoutValue: layout,
    });

    expect(deleted?.kind).toBe("column");
    expect(deleted?.columns).toBe(3);
    expect(deleted?.colors).toEqual([
      "color-1",
      "color-2",
      "color-3",
      "color-5",
      "color-6",
      "color-7",
    ]);
    expect(deleted?.layout.points).toHaveLength(6);
  });

  it("does not delete below the ColorFlow two-by-two topology minimum", () => {
    const layout = readMeshPointLayout(
      { points: createGridPoints(4, 2), selectedIndices: [0] },
      4,
      2,
    );

    expect(
      deleteSelectedMeshLine({
        colors: ["a", "b", "c", "d"],
        columns: 2,
        layoutValue: layout,
      }),
    ).toBeNull();
  });
});

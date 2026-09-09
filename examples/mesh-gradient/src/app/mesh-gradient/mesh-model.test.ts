import { describe, expect, it } from "vitest";

import {
  createGridPoints,
  createMeshPointLayout,
  readMeshColors,
  readMeshPointLayout,
} from "./mesh-model";

describe("readMeshColors", () => {
  it("keeps edited color-control objects in their original mesh positions", () => {
    expect(
      readMeshColors([
        "#24102F",
        { hex: "#FFFFFF" },
        "#FFD166",
        "#FF7A1A",
      ]),
    ).toEqual(["#24102F", "#FFFFFF", "#FFD166", "#FF7A1A"]);
  });
});

describe("readMeshPointLayout", () => {
  it("keeps the stored structural column count until topology reconciliation", () => {
    const stored = createMeshPointLayout(createGridPoints(12, 4), 4);
    const read = readMeshPointLayout(stored, 12, 2);

    expect(read.baseColumns).toBe(4);
    expect(read.basePointCount).toBe(12);
    expect(read.points).toEqual(stored.points);
  });
});

import { describe, expect, it } from "vitest";

import {
  getTypographyCornerOffset,
  orderGhostSnapshotsAlongPath,
} from "./fine-details-evidence-geometry";

describe("Fine Details prompt flight browser evidence geometry", () => {
  it("measures the landed prompt from the two exact typography corner anchors", () => {
    expect(
      getTypographyCornerOffset(
        { height: 100, width: 240, x: 140, y: 290 },
        { height: 80, width: 260, x: 100, y: 60 },
        { height: 100, width: 320, x: 580, y: 320 },
      ),
    ).toEqual({ x: 40, y: -30 });
  });

  it("orders breadcrumb snapshots by path geometry rather than DOM index", () => {
    const takeoff = { height: 100, width: 200, x: 0, y: 0 };
    const landing = { height: 100, width: 200, x: 300, y: 200 };
    const domOrdered = [
      { height: 100, id: "landing-side", opacity: 0.8, width: 200, x: 240, y: 160 },
      { height: 100, id: "takeoff-side", opacity: 0, width: 200, x: 30, y: 20 },
      { height: 100, id: "middle", opacity: 0.8, width: 200, x: 150, y: 100 },
    ];

    expect(orderGhostSnapshotsAlongPath(domOrdered, takeoff, landing).map(({ id }) => id)).toEqual([
      "takeoff-side",
      "middle",
      "landing-side",
    ]);
  });
});

import { describe, expect, it } from "vitest";

import { GLOBE_DEFAULTS, GLOBE_SCENE_SIZE } from "./globe-constants";
import { getBandDotMetrics } from "./globe-dot-grid";
import { GLOBE_SCREEN_RADIUS_RATIO } from "./globe-renderer-settings";

describe("wide band dot grid", () => {
  it.each([1, 2, 3])("keeps dot size %s density when widening bands beyond 22 percent", (dotSize) => {
    const radius = GLOBE_SCENE_SIZE.height * GLOBE_SCREEN_RADIUS_RATIO;
    const metrics = [22, 40, 60].map((width) => {
      const bandHeight = width / 100;
      const grid = getBandDotMetrics({
        bandHeight,
        columnSpacing: GLOBE_DEFAULTS.bandColumnSpacing,
        dotSize,
        outerRadius: 1.03,
        radius,
      });
      expect(grid.rowCount).toBe(Math.round(bandHeight * radius / (dotSize * 1.55)));
      expect(grid.dotRadius).toBe(dotSize / 2);
      return grid;
    });
    expect(metrics[1].rowCount).toBeGreaterThan(metrics[0].rowCount);
    expect(metrics[2].rowCount).toBeGreaterThan(metrics[1].rowCount);
    expect(metrics.map((grid) => grid.columnCount)).toEqual([
      metrics[0].columnCount, metrics[0].columnCount, metrics[0].columnCount,
    ]);
  });
});

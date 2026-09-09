import { describe, expect, it } from "vitest";

import type { GrassLayout } from "./grass-layout";
import {
  createGrassLawnClumpGeometry,
  getGrassLawnClumpCount,
  GRASS_LAWN_BLADES_PER_CLUMP,
} from "./grass-lawn-clump-geometry";

function layout(count: number): GrassLayout {
  return {
    angles: Float32Array.from({ length: count }, (_, index) => index * 0.1),
    count,
    heights: Float32Array.from({ length: count }, () => 0.1),
    offsets: Float32Array.from(
      { length: count * 3 },
      (_, index) => index * 0.01,
    ),
    phases: Float32Array.from({ length: count }, (_, index) => index * 0.2),
    slopes: Float32Array.from({ length: count * 2 }, () => 0),
    visibility: Float32Array.from({ length: count }, () => 1),
  };
}

describe("live Lawn clump geometry", () => {
  it("maps equivalent blade limits to six-blade draw instances", () => {
    expect(GRASS_LAWN_BLADES_PER_CLUMP).toBe(6);
    expect(getGrassLawnClumpCount(0)).toBe(0);
    expect(getGrassLawnClumpCount(1)).toBe(1);
    expect(getGrassLawnClumpCount(6)).toBe(1);
    expect(getGrassLawnClumpCount(7)).toBe(2);
  });

  it("keeps independent per-blade shape attributes inside every clump", () => {
    const geometry = createGrassLawnClumpGeometry(layout(18));

    expect(geometry.instanceCount).toBe(3);
    expect(geometry.getAttribute("position").count).toBe(24);
    expect(geometry.getIndex()?.count).toBe(36);
    expect(geometry.getAttribute("aOffset").count).toBe(3);
    expect(
      new Set(Array.from(geometry.getAttribute("aLocalAngle").array)).size,
    ).toBe(GRASS_LAWN_BLADES_PER_CLUMP);
    expect(
      new Set(Array.from(geometry.getAttribute("aLocalPhase").array)).size,
    ).toBe(GRASS_LAWN_BLADES_PER_CLUMP);
    expect(
      new Set(Array.from(geometry.getAttribute("aLocalStiffness").array)).size,
    ).toBeGreaterThan(1);

    geometry.dispose();
  });

  it("keeps all six visible blades in lightweight clumps", () => {
    const geometry = createGrassLawnClumpGeometry(layout(18), {
      quality: "lightweight",
    });

    expect(geometry.instanceCount).toBe(3);
    expect(geometry.getAttribute("position").count).toBe(24);
    expect(geometry.getIndex()?.count).toBe(36);
    expect(
      new Set(Array.from(geometry.getAttribute("aLocalAngle").array)).size,
    ).toBe(GRASS_LAWN_BLADES_PER_CLUMP);

    geometry.dispose();
  });
});

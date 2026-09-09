import { describe, expect, it } from "vitest";

import type { GrassSettings } from "./grass-values";
import {
  getGrassReferenceSurfaceHeight,
  getGrassTerrainMaskValue,
} from "./grass-reference-composition";

const baseSettings = {
  field: { depth: 5, width: 7 },
  terrain: {
    detail: 4,
    heightLevels: [0, 1],
    maxHeight: 1.6,
    noiseOffset: [2, 0],
    noiseScale: 0.61,
    roughness: 0.68,
    seed: 4,
  },
} as unknown as GrassSettings;

function withTerrain(
  terrain: Partial<GrassSettings["terrain"]>,
): GrassSettings {
  return {
    ...baseSettings,
    terrain: { ...baseSettings.terrain, ...terrain },
  } as GrassSettings;
}

describe("terrain height mask", () => {
  it("maps the dominant noise controls to one continuous surface", () => {
    const samples = [
      [-1.8, -0.9],
      [-0.8, 0.4],
      [0.2, -0.7],
      [1.15, 0.5],
      [0.55, 1.25],
    ] as const;
    const variants = [
      withTerrain({ noiseScale: 0.13 }),
      withTerrain({ roughness: 0.15 }),
      withTerrain({ seed: 77 }),
      withTerrain({ detail: 1 }),
    ];
    const baseline = samples.map(([x, z]) =>
      getGrassTerrainMaskValue(x, z, baseSettings),
    );

    for (const variant of variants) {
      const changed = samples.filter(
        ([x, z], index) =>
          Math.abs(
            getGrassTerrainMaskValue(x, z, variant) - baseline[index]!,
          ) > 0.015,
      );
      expect(changed.length).toBeGreaterThanOrEqual(2);
    }

    for (let x = -2.4; x <= 2.4; x += 0.12) {
      const current = getGrassReferenceSurfaceHeight(x, 0, baseSettings);
      const next = getGrassReferenceSurfaceHeight(x + 0.12, 0, baseSettings);
      expect(current).toBeGreaterThanOrEqual(0);
      expect(current).toBeLessThanOrEqual(baseSettings.terrain.maxHeight);
      expect(Math.abs(next - current)).toBeLessThan(0.34);
    }

    expect(getGrassReferenceSurfaceHeight(3.5, 0, baseSettings)).toBe(0);
    expect(getGrassReferenceSurfaceHeight(0, 2.5, baseSettings)).toBe(0);
  });

  it("maximum height scales the completed mask without changing it", () => {
    const low = withTerrain({ maxHeight: 0.75 });
    const high = withTerrain({ maxHeight: 2.25 });
    const mask = getGrassTerrainMaskValue(0.35, -0.4, low);

    expect(mask).toBeGreaterThan(0);
    expect(getGrassTerrainMaskValue(0.35, -0.4, high)).toBeCloseTo(mask);
    expect(getGrassReferenceSurfaceHeight(0.35, -0.4, high)).toBeCloseTo(
      getGrassReferenceSurfaceHeight(0.35, -0.4, low) * 3,
    );
  });
});

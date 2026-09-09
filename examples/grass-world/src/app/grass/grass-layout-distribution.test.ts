import type { ToolcraftState } from "@/toolcraft/runtime";
import { describe, expect, it } from "vitest";

import { createGrassLayout } from "./grass-layout";
import { readGrassSettings } from "./grass-values";

function settingsWith(values: Record<string, unknown>) {
  return readGrassSettings({
    canvas: { size: { height: 1080, width: 1920 } },
    mediaAssets: [],
    timeline: {
      currentTimeSeconds: 0,
      durationSeconds: 6,
      isLooping: true,
      isPlaying: false,
    },
    values,
  } as unknown as ToolcraftState);
}

describe("grass layout distribution", () => {
  it("treats density as capacity and preserves it for an all-white mask", () => {
    const whiteSettings = settingsWith({
      "field.depth": 5,
      "field.densityMax": 10_000,
      "field.distanceMin": 0.04,
      "field.distributionLevels": [0, 0],
      "field.width": 7,
    });
    const blackSettings = settingsWith({
      "field.depth": 5,
      "field.densityMax": 10_000,
      "field.distanceMin": 0.04,
      "field.distributionLevels": [100, 100],
      "field.width": 7,
    });
    const layout = createGrassLayout(whiteSettings);

    expect(layout.count).toBe(10_000);
    expect(createGrassLayout(whiteSettings).offsets).toEqual(layout.offsets);
    expect(createGrassLayout(blackSettings).count).toBe(0);
  });

  it("keeps Tall and Lawn distribution maps independent", () => {
    const initialSettings = settingsWith({
      "field.densityMax": 800,
      "field.distanceMin": 0.02,
      "field.distributionLevels": [20, 80],
      "lawn.densityMax": 800,
      "lawn.distanceMin": 0.02,
      "lawn.distributionLevels": [20, 80],
    });
    const shiftedTallSettings = settingsWith({
      "field.densityMax": 800,
      "field.distanceMin": 0.02,
      "field.distributionLevels": [20, 80],
      "field.distributionOffset": [3, -2],
      "field.distributionSeed": 71,
      "lawn.densityMax": 800,
      "lawn.distanceMin": 0.02,
      "lawn.distributionLevels": [20, 80],
    });
    const shiftedLawnSettings = settingsWith({
      "field.densityMax": 800,
      "field.distanceMin": 0.02,
      "field.distributionLevels": [20, 80],
      "lawn.densityMax": 800,
      "lawn.distanceMin": 0.02,
      "lawn.distributionLevels": [20, 80],
      "lawn.distributionOffset": [-4, 2],
      "lawn.distributionSeed": 88,
    });

    expect(createGrassLayout(shiftedTallSettings).offsets).not.toEqual(
      createGrassLayout(initialSettings).offsets,
    );
    expect(createGrassLayout(shiftedTallSettings, "lawn").offsets).toEqual(
      createGrassLayout(initialSettings, "lawn").offsets,
    );
    expect(createGrassLayout(shiftedLawnSettings, "lawn").offsets).not.toEqual(
      createGrassLayout(initialSettings, "lawn").offsets,
    );
    expect(createGrassLayout(shiftedLawnSettings).offsets).toEqual(
      createGrassLayout(initialSettings).offsets,
    );
  });

  it("enforces real minimum root spacing", () => {
    const minimumDistance = 0.2;
    const layout = createGrassLayout(
      settingsWith({
        "lawn.densityMax": 100,
        "lawn.distanceMin": minimumDistance,
      }),
      "lawn",
    );

    expect(layout.count).toBeGreaterThan(0);
    expect(layout.count).toBeLessThanOrEqual(100);
    for (let index = 0; index < layout.count; index += 1) {
      const x = layout.offsets[index * 3] ?? 0;
      const z = layout.offsets[index * 3 + 2] ?? 0;
      for (let other = index + 1; other < layout.count; other += 1) {
        const otherX = layout.offsets[other * 3] ?? 0;
        const otherZ = layout.offsets[other * 3 + 2] ?? 0;
        expect(Math.hypot(x - otherX, z - otherZ)).toBeGreaterThanOrEqual(
          minimumDistance - 0.000_01,
        );
      }
    }
  });

  it("fills density from the bounded pool while preserving the mask", () => {
    const shared = {
      "field.depth": 5,
      "field.densityMax": 4_000,
      "field.distanceMin": 0.02,
      "field.distributionDetail": 3,
      "field.distributionRoughness": 58,
      "field.distributionScale": 0.3,
      "field.distributionSeed": 42,
      "field.width": 7,
    };
    const white = createGrassLayout(
      settingsWith({ ...shared, "field.distributionLevels": [0, 0] }),
    );
    const masked = createGrassLayout(
      settingsWith({ ...shared, "field.distributionLevels": [0, 100] }),
    );

    expect(white.count).toBe(4_000);
    expect(masked.count).toBe(4_000);
    expect(masked.offsets).not.toEqual(white.offsets);
  });
});

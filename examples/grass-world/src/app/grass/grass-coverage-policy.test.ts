import { describe, expect, it } from "vitest";
import type { ToolcraftState } from "@/toolcraft/runtime";

import {
  calculateGrassBladeCount,
  calculateLawnBladeCount,
} from "./grass-layout";
import {
  calculateGrassCoverageCount,
  partitionGrassCoverage,
} from "./grass-coverage-policy";
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

describe("grass coverage policy", () => {
  it("reaches requested bounded density at the advertised minimum spacing", () => {
    const settings = settingsWith({
      "field.depth": 5,
      "field.densityMax": 12_500,
      "field.distanceMin": 0.02,
      "field.width": 7,
      "lawn.densityMax": 36_000,
      "lawn.distanceMin": 0.0075,
    });

    expect(calculateGrassBladeCount(settings)).toBe(12_500);
    expect(calculateLawnBladeCount(settings)).toBe(36_000);
  });

  it("keeps coverage count monotonic and partitions detail without deleting roots", () => {
    const counts = [5000, 10_000, 24_000, 30_000].map((densityMax) =>
      calculateGrassCoverageCount({
        densityMax,
        layer: "tall",
      }),
    );

    expect(counts).toEqual([5000, 10_000, 24_000, 24_000]);
    expect(partitionGrassCoverage(20_000, 1800)).toEqual({
      detailed: 1800,
      lightweight: 18_200,
      total: 20_000,
    });
  });
});

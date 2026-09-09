import type { ToolcraftState } from "@/toolcraft/runtime";
import { describe, expect, it } from "vitest";

import { grassDefaults } from "./grass-defaults";
import { readGrassSettings } from "./grass-values";
import {
  combineGrassLayoutSignatures,
  createGrassCoordinateSignature,
  sampleGrassWorldCoverage,
} from "./grass-world-coverage";
import {
  advanceGrassWorldId,
  compileGrassWorldPatch,
} from "./grass-world-generator";

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

describe("grass world coverage", () => {
  it("keeps direct Tall and Lawn masks deterministic and other channels neutral", () => {
    const settings = settingsWith({
      "field.distributionLevels": [20, 80],
      "lawn.distributionLevels": [25, 75],
    });

    for (const channel of ["tall", "lawn"] as const) {
      const first = sampleGrassWorldCoverage(channel, 0.73, -1.21, settings);
      expect(sampleGrassWorldCoverage(channel, 0.73, -1.21, settings)).toBe(
        first,
      );
      expect(first).toBeGreaterThanOrEqual(0);
      expect(first).toBeLessThanOrEqual(1);
    }
    for (const channel of [
      "boulder",
      "rocks",
      "tufted",
      "white",
      "wild",
      "yellow",
    ] as const) {
      expect(sampleGrassWorldCoverage(channel, 0.73, -1.21, settings)).toBe(1);
    }
  });

  it("does not hide a second world pattern behind the visible map controls", () => {
    const shared = {
      "field.distributionDetail": 3,
      "field.distributionLevels": [30, 70],
      "field.distributionOffset": [1.5, -0.75],
      "field.distributionRoughness": 60,
      "field.distributionScale": 0.28,
      "field.distributionSeed": 42,
      "lawn.distributionDetail": 4,
      "lawn.distributionLevels": [18, 76],
      "lawn.distributionOffset": [-2, 1],
      "lawn.distributionRoughness": 55,
      "lawn.distributionScale": 0.45,
      "lawn.distributionSeed": 71,
    };
    const first = settingsWith({ ...shared, "field.seed": 0 });
    const second = settingsWith({ ...shared, "field.seed": 175_417 });

    for (const channel of ["tall", "lawn"] as const) {
      expect(sampleCoverageGrid(channel, second)).toEqual(
        sampleCoverageGrid(channel, first),
      );
    }
  });

  it("changes Tall coverage without changing Lawn or scans", () => {
    const initial = settingsWith({
      "field.distributionLevels": [20, 80],
      "lawn.distributionLevels": [15, 75],
    });
    const changed = settingsWith({
      "field.distributionLevels": [20, 80],
      "field.distributionOffset": [3, -2],
      "field.distributionSeed": 71,
      "lawn.distributionLevels": [15, 75],
    });

    expect(sampleCoverageGrid("tall", changed)).not.toEqual(
      sampleCoverageGrid("tall", initial),
    );
    expect(sampleCoverageGrid("lawn", changed)).toEqual(
      sampleCoverageGrid("lawn", initial),
    );
    expect(sampleGrassWorldCoverage("tufted", 1, -1, changed)).toBe(1);
  });

  it("changes Lawn coverage without changing Tall", () => {
    const initial = settingsWith({
      "field.distributionLevels": [20, 80],
      "lawn.distributionLevels": [15, 75],
    });
    const changed = settingsWith({
      "field.distributionLevels": [20, 80],
      "lawn.distributionLevels": [15, 75],
      "lawn.distributionOffset": [-4, 2],
      "lawn.distributionSeed": 88,
    });

    expect(sampleCoverageGrid("lawn", changed)).not.toEqual(
      sampleCoverageGrid("lawn", initial),
    );
    expect(sampleCoverageGrid("tall", changed)).toEqual(
      sampleCoverageGrid("tall", initial),
    );
  });

  it("uses explicit all-white and all-black endpoints for both grass maps", () => {
    for (const [channel, target] of [
      ["tall", "field.distributionLevels"],
      ["lawn", "lawn.distributionLevels"],
    ] as const) {
      const white = settingsWith({ [target]: [0, 0] });
      const black = settingsWith({ [target]: [100, 100] });
      expect(sampleGrassWorldCoverage(channel, 0.4, -1.2, white)).toBe(1);
      expect(sampleGrassWorldCoverage(channel, 0.4, -1.2, black)).toBe(0);
    }
  });

  it("writes visible Tall and Lawn map parameters into generated worlds", () => {
    const firstId = advanceGrassWorldId(Number(grassDefaults["field.seed"]));
    const secondId = advanceGrassWorldId(firstId);
    const firstPatch = compileGrassWorldPatch(firstId, grassDefaults);
    const secondPatch = compileGrassWorldPatch(secondId, grassDefaults);

    for (const target of [
      "field.distributionDetail",
      "field.distributionLevels",
      "field.distributionOffset",
      "field.distributionRoughness",
      "field.distributionScale",
      "field.distributionSeed",
      "lawn.distributionDetail",
      "lawn.distributionLevels",
      "lawn.distributionOffset",
      "lawn.distributionRoughness",
      "lawn.distributionScale",
      "lawn.distributionSeed",
    ] as const) {
      expect(firstPatch).toHaveProperty(target);
    }
    expect(secondPatch).not.toEqual(firstPatch);
  });

  it("creates compact coordinate signatures that detect layout changes", () => {
    const base = {
      count: 2,
      offsets: new Float32Array([0, 0, 0, 1, 0, 1]),
    };
    const changed = {
      count: 2,
      offsets: new Float32Array([0, 0, 0, 1.1, 0, 1]),
    };
    const first = createGrassCoordinateSignature("lawn", base);
    const second = createGrassCoordinateSignature("lawn", changed);

    expect(second).not.toBe(first);
    expect(combineGrassLayoutSignatures({ tall: "a", lawn: first })).toBe(
      `lawn=${first}|tall=a`,
    );
  });
});

function sampleCoverageGrid(
  channel: "lawn" | "tall",
  settings: ReturnType<typeof settingsWith>,
): number[] {
  return Array.from({ length: 121 }, (_, index) => {
    const x = ((index % 11) - 5) * 0.4;
    const z = (Math.floor(index / 11) - 5) * 0.4;
    return sampleGrassWorldCoverage(channel, x, z, settings);
  });
}

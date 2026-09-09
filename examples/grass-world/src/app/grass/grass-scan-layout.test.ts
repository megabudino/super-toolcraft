import { describe, expect, it } from "vitest";
import type { ToolcraftState } from "@/toolcraft/runtime";

import {
  createGrassBoulderLayout,
  createGrassScanLayout,
} from "./grass-scan-layout";
import { createGrassLayout } from "./grass-layout";
import { grassDefaults } from "./grass-defaults";
import {
  grassScanLayerContracts,
  grassScanLayerKinds,
} from "./grass-scan-contract";
import { readGrassSettings } from "./grass-values";
import { getGrassReferenceSurfaceHeight } from "./grass-reference-composition";
import {
  advanceGrassWorldId,
  compileGrassWorldPatch,
} from "./grass-world-generator";
import {
  getGrassFieldShapeSettings,
  isGrassFieldFootprintInside,
} from "./grass-field-shape";

function settingsWith(values: Record<string, unknown> = {}) {
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

function meanNearestDistance(offsets: Float32Array): number {
  const count = offsets.length / 3;
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    let nearest = Number.POSITIVE_INFINITY;
    const x = offsets[index * 3] ?? 0;
    const z = offsets[index * 3 + 2] ?? 0;
    for (let other = 0; other < count; other += 1) {
      if (other === index) continue;
      const dx = x - (offsets[other * 3] ?? 0);
      const dz = z - (offsets[other * 3 + 2] ?? 0);
      nearest = Math.min(nearest, Math.hypot(dx, dz));
    }
    total += nearest;
  }
  return total / Math.max(1, count);
}

describe("Megascans terrain layouts", () => {
  it("honors enabled state and keeps Count exact", () => {
    const enabled = createGrassScanLayout(
      "tufted",
      settingsWith({ "scan.tufted.count": 127 }),
    );
    const disabled = createGrassScanLayout(
      "tufted",
      settingsWith({ "scan.tufted.count": 127, "scan.tufted.enabled": false }),
    );
    const clamped = createGrassScanLayout(
      "tufted",
      settingsWith({ "scan.tufted.count": 99_999 }),
    );
    expect(enabled.count).toBe(127);
    expect(disabled.count).toBe(0);
    expect(clamped.count).toBe(1000);
  });

  it("is deterministic for equal seeds and changes for a new seed", () => {
    const first = createGrassScanLayout(
      "white",
      settingsWith({ "scan.white.count": 48, "scan.white.seed": 12 }),
    );
    const repeated = createGrassScanLayout(
      "white",
      settingsWith({ "scan.white.count": 48, "scan.white.seed": 12 }),
    );
    const changed = createGrassScanLayout(
      "white",
      settingsWith({ "scan.white.count": 48, "scan.white.seed": 13 }),
    );
    expect(repeated.offsets).toEqual(first.offsets);
    expect(repeated.variants).toEqual(first.variants);
    expect(changed.offsets).not.toEqual(first.offsets);
  });

  it("does not move scans or the boulder when either grass map changes", () => {
    const initial = settingsWith({
      "field.distributionLevels": [20, 80],
      "lawn.distributionLevels": [25, 75],
      "scan.rocks.count": 48,
      "scan.tufted.count": 120,
    });
    const changed = settingsWith({
      "field.distributionLevels": [45, 55],
      "field.distributionOffset": [5, -4],
      "field.distributionSeed": 88,
      "lawn.distributionLevels": [35, 65],
      "lawn.distributionOffset": [-6, 3],
      "lawn.distributionSeed": 91,
      "scan.rocks.count": 48,
      "scan.tufted.count": 120,
    });

    for (const kind of grassScanLayerKinds) {
      expect(createGrassScanLayout(kind, changed).offsets).toEqual(
        createGrassScanLayout(kind, initial).offsets,
      );
    }
    expect(createGrassBoulderLayout(changed).offset).toEqual(
      createGrassBoulderLayout(initial).offset,
    );
  });

  it("keeps scale and terrain contact inside authored bounds", () => {
    const settings = settingsWith({
      "scan.yellow.count": 64,
      "scan.yellow.sizeRange": [0.55, 1.35],
      "scan.yellow.surfaceOffset": 0.035,
    });
    const layout = createGrassScanLayout("yellow", settings);
    for (let index = 0; index < layout.count; index += 1) {
      const x = layout.offsets[index * 3] ?? 0;
      const y = layout.offsets[index * 3 + 1] ?? 0;
      const z = layout.offsets[index * 3 + 2] ?? 0;
      expect(layout.scales[index]).toBeGreaterThanOrEqual(0.55);
      expect(layout.scales[index]).toBeLessThanOrEqual(1.35);
      expect(y).toBeCloseTo(
        getGrassReferenceSurfaceHeight(x, z, settings) + 0.035,
        5,
      );
    }
  });

  it("concentrates instances as clumping increases", () => {
    const uniform = createGrassScanLayout(
      "wild",
      settingsWith({ "scan.wild.clumping": 0, "scan.wild.count": 80 }),
    );
    const clustered = createGrassScanLayout(
      "wild",
      settingsWith({ "scan.wild.clumping": 100, "scan.wild.count": 80 }),
    );
    expect(meanNearestDistance(clustered.offsets)).toBeLessThan(
      meanNearestDistance(uniform.offsets),
    );
  });

  it("keeps the complete boulder and rock footprints inside the organic field edge", () => {
    const settings = settingsWith({
      "field.edgeIrregularity": 24,
      "field.shapeRoundness": 12,
      "scan.boulder.size": 3.2,
      "scan.rocks.count": 180,
      "scan.rocks.sizeRange": [1.8, 2.2],
    });
    const shape = getGrassFieldShapeSettings(settings);
    const boulder = createGrassBoulderLayout(settings);
    const rocks = createGrassScanLayout("rocks", settings);

    expect(boulder.count).toBe(1);
    expect(
      isGrassFieldFootprintInside(
        boulder.offset[0],
        boulder.offset[2],
        boulder.scale * 0.5,
        shape,
      ),
    ).toBe(true);
    for (let index = 0; index < rocks.count; index += 1) {
      expect(
        isGrassFieldFootprintInside(
          rocks.offsets[index * 3] ?? 0,
          rocks.offsets[index * 3 + 2] ?? 0,
          (rocks.scales[index] ?? 0) * 0.22 * 0.5,
          shape,
        ),
      ).toBe(true);
    }
  });

  it("keeps every generated layer present across a full topology-pattern cycle", () => {
    let worldId = Number(grassDefaults["field.seed"]);

    for (let index = 0; index < 112; index += 1) {
      worldId = advanceGrassWorldId(worldId);
      const settings = settingsWith({
        ...grassDefaults,
        ...compileGrassWorldPatch(worldId, grassDefaults),
      });
      expect(
        createGrassLayout(settings, "tall").count,
        `tall grass was empty for generated world ${worldId}`,
      ).toBeGreaterThan(0);
      expect(
        createGrassLayout(settings, "lawn").count,
        `lawn was empty for generated world ${worldId}`,
      ).toBeGreaterThan(0);
      for (const kind of grassScanLayerKinds) {
        const requested = settings.scans[kind].count;
        expect(
          createGrassScanLayout(kind, settings).count,
          `${kind} count drifted for generated world ${worldId}`,
        ).toBe(requested);
      }
      expect(
        createGrassBoulderLayout(settings).count,
        `boulder was empty for generated world ${worldId}`,
      ).toBe(1);
    }
  }, 90_000);

  it("keeps every requested rock footprint in the empty edge-crescent regression", () => {
    const worldId = 175_417;
    const settings = settingsWith({
      ...grassDefaults,
      ...compileGrassWorldPatch(worldId, grassDefaults),
    });
    expect(settings.scans.rocks.count).toBe(912);

    const layout = createGrassScanLayout("rocks", settings);
    const shape = getGrassFieldShapeSettings(settings);
    expect(layout.count).toBe(settings.scans.rocks.count);
    for (let index = 0; index < layout.count; index += 1) {
      const x = layout.offsets[index * 3] ?? 0;
      const y = layout.offsets[index * 3 + 1] ?? 0;
      const z = layout.offsets[index * 3 + 2] ?? 0;
      expect(y).toBeCloseTo(
        getGrassReferenceSurfaceHeight(x, z, settings) +
          settings.scans.rocks.surfaceOffset,
        5,
      );
      expect(
        isGrassFieldFootprintInside(
          x,
          z,
          (layout.scales[index] ?? 0) *
            grassScanLayerContracts.rocks.baseSize *
            0.5,
          shape,
        ),
      ).toBe(true);
    }
  });
});

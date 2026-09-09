import type { ToolcraftState } from "@/toolcraft/runtime";
import { describe, expect, it } from "vitest";

import { grassDefaults } from "./grass-defaults";
import { readGrassSettings } from "./grass-values";
import { GRASS_WORLD_COLOR_TARGETS } from "./grass-world-colors";
import {
  GRASS_FORCED_VISIBLE_TARGETS,
  GRASS_GENERATED_WORLD_TARGETS,
  GRASS_PRESERVED_TARGETS,
  GRASS_WORLD_COUNT,
  advanceGrassWorldId,
  compileGrassWorldPatch,
  decodeGrassWorldId,
  normalizeGrassWorldId,
} from "./grass-world-generator";

describe("grass world generator", () => {
  it("visits the complete qualitative cycle without repetition", () => {
    const identities = new Set<number>();
    const tuples = new Set<string>();
    let current = 0;

    for (let index = 0; index < GRASS_WORLD_COUNT; index += 1) {
      expect(identities.has(current)).toBe(false);
      identities.add(current);
      const currentAxes = decodeGrassWorldId(current);
      tuples.add(JSON.stringify(currentAxes));
      const next = advanceGrassWorldId(current);
      const nextAxes = decodeGrassWorldId(next);
      const changedAxes = Object.keys(currentAxes).filter(
        (axis) =>
          currentAxes[axis as keyof typeof currentAxes] !==
          nextAxes[axis as keyof typeof nextAxes],
      );
      expect(nextAxes.coverageTopology).not.toBe(currentAxes.coverageTopology);
      expect(changedAxes.length).toBeGreaterThanOrEqual(4);
      current = next;
    }

    expect(identities.size).toBe(GRASS_WORLD_COUNT);
    expect(tuples.size).toBe(GRASS_WORLD_COUNT);
    expect(current).toBe(0);
  }, 60_000);

  it("normalizes imported identity values deterministically", () => {
    expect(normalizeGrassWorldId(Number.NaN)).toBe(0);
    expect(normalizeGrassWorldId(-1)).toBe(GRASS_WORLD_COUNT - 1);
    expect(normalizeGrassWorldId(GRASS_WORLD_COUNT)).toBe(0);
    expect(normalizeGrassWorldId(47.8)).toBe(48);
  });

  it("partitions every setting into generated or preserved ownership", () => {
    const partitions = [
      ...GRASS_GENERATED_WORLD_TARGETS,
      ...GRASS_PRESERVED_TARGETS,
    ];
    expect(new Set(partitions).size).toBe(partitions.length);
    expect([...partitions].sort()).toEqual(Object.keys(grassDefaults).sort());
  });

  it("changes composition while preserving active colors and forcing every layer visible", () => {
    const patch = compileGrassWorldPatch(12_163);

    expect(Object.keys(patch).sort()).toEqual(
      [...GRASS_GENERATED_WORLD_TARGETS].sort(),
    );
    for (const target of GRASS_PRESERVED_TARGETS) {
      expect(patch).not.toHaveProperty(target);
    }
    for (const target of GRASS_FORCED_VISIBLE_TARGETS) {
      expect(patch[target]).toBe(true);
    }
    expect(patch).not.toHaveProperty("field.width");
    expect(patch).not.toHaveProperty("field.depth");
    expect(patch).not.toHaveProperty("surface.edgeFadeStrength");
    expect(patch).not.toHaveProperty("surface.edgeFadeWidth");
    for (const target of GRASS_WORLD_COLOR_TARGETS) {
      expect(patch).not.toHaveProperty(target);
      expect(GRASS_PRESERVED_TARGETS).toContain(target);
    }
    expect(Object.keys(patch).some(isForbiddenVisualTarget)).toBe(false);
  });

  it("recomputes every non-visibility spatial target from identity", () => {
    const samples = Array.from({ length: 64 }, (_, index) =>
      compileGrassWorldPatch(index * 3_077),
    );
    const forced = new Set<string>(GRASS_FORCED_VISIBLE_TARGETS);

    for (const target of GRASS_GENERATED_WORLD_TARGETS) {
      if (forced.has(target)) continue;
      const values = new Set(samples.map((patch) => JSON.stringify(patch[target])));
      expect(values.size, `${target} remained constant`).toBeGreaterThan(1);
    }
  });

  it("reproduces byte-equal patches for the same identity", () => {
    expect(compileGrassWorldPatch(91_337)).toEqual(
      compileGrassWorldPatch(91_337),
    );
  });

  it("feeds authored PBR and texture-mask values through the canonical reader", () => {
    const settings = readGrassSettings({
      canvas: { size: { height: 1080, width: 1920 } },
      mediaAssets: [],
      timeline: {
        currentTimeSeconds: 0,
        durationSeconds: 6,
        isLooping: true,
        isPlaying: false,
      },
      values: {
        ...grassDefaults,
        "appearance.pbrSheen": 73,
        "appearance.textureMaskLevels": [23, 81],
        "appearance.textureMaskScale": 2.4,
        "appearance.textureMaskSeed": 61,
        "scan.tufted.pbrAoStrength": 79,
        "scan.tufted.pbrBacklight": 37,
        "scan.tufted.pbrSheen": 48,
      },
    } as unknown as ToolcraftState);

    expect(settings.appearance.pbrSheen).toBe(0.73);
    expect(settings.appearance.textureMask).toEqual({
      levels: [0.23, 0.81],
      scale: 2.4,
      seed: 61,
    });
    expect(settings.scans.tufted.pbrAoStrength).toBe(0.79);
    expect(settings.scans.tufted.pbrBacklight).toBe(0.37);
    expect(settings.scans.tufted.pbrSheen).toBe(0.48);
  });
});

function isForbiddenVisualTarget(target: string): boolean {
  return (
    target.startsWith("environment.") ||
    target === "scene.background" ||
    target.startsWith("appearance.") ||
    target.startsWith("surface.") ||
    /\.(?:colorContrast|colorSaturation|pbr[A-Z]|shadowColor|textureMask)/u.test(
      target,
    ) ||
    target === "lawn.bladeGradient" ||
    target.startsWith("lawn.instanceColor")
  );
}

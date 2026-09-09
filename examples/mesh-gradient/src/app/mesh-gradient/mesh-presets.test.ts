import { describe, expect, it } from "vitest";

import {
  getMeshPreset,
  getMeshTopologySignature,
  MESH_PRESETS,
  MESH_PRESET_PICKER_ITEMS,
} from "./mesh-presets";

describe("mesh preset gallery", () => {
  it("defines twelve distinct rectangular mesh-only scenes", () => {
    expect(MESH_PRESETS).toHaveLength(12);
    expect(new Set(MESH_PRESETS.map((preset) => preset.id)).size).toBe(12);
    expect(new Set(MESH_PRESETS.map((preset) => preset.name)).size).toBe(12);
    expect(
      new Set(MESH_PRESETS.map((preset) => getMeshTopologySignature(preset))),
    ).toHaveProperty("size", 12);

    for (const preset of MESH_PRESETS) {
      const rows = preset.colors.length / preset.columns;
      expect(Number.isInteger(rows)).toBe(true);
      expect(rows).toBeGreaterThanOrEqual(2);
      expect(preset.colors.length).toBeGreaterThanOrEqual(4);
      expect(preset.colors.length).toBeLessThanOrEqual(16);
      expect(preset.layout.points).toHaveLength(preset.colors.length);
      expect(preset.layout.handles).toHaveLength(preset.colors.length);
      expect(preset.layout.selectedIndices).toEqual([]);

      const topLeft = preset.layout.points[0];
      const topRight = preset.layout.points[preset.columns - 1];
      const bottomLeft = preset.layout.points[preset.colors.length - preset.columns];
      const bottomRight = preset.layout.points[preset.colors.length - 1];
      expect(topLeft).toEqual({ x: 0, y: 0 });
      expect(topRight).toEqual({ x: 1, y: 0 });
      expect(bottomLeft).toEqual({ x: 0, y: 1 });
      expect(bottomRight).toEqual({ x: 1, y: 1 });
    }
  });

  it("builds one deterministic rectangular thumbnail for every scene", () => {
    expect(MESH_PRESET_PICKER_ITEMS).toHaveLength(12);

    MESH_PRESET_PICKER_ITEMS.forEach((item, index) => {
      const preset = MESH_PRESETS[index]!;
      expect(item).toEqual({
        alt: preset.name,
        src: preset.thumbnail,
        value: preset.id,
      });
      expect(item.src).toMatch(/^data:image\/svg\+xml,/u);
      expect(decodeURIComponent(item.src)).toContain('viewBox="0 0 320 240"');
    });
  });

  it("resolves only known preset values", () => {
    expect(getMeshPreset("aurora")?.name).toBe("Aurora");
    expect(getMeshPreset("custom")).toBeNull();
    expect(getMeshPreset(undefined)).toBeNull();
  });
});

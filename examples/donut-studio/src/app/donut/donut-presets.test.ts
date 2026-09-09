import { describe, expect, it } from "vitest";

import {
  DONUT_PRESET_CUSTOM,
  DONUT_PRESET_DEFAULT,
  DONUT_PRESET_TARGET,
  DONUT_PRESETS,
  findDonutPreset,
} from "./donut-presets";
import presetDefaultsSource from "./donut-preset-defaults.json";
import { donutControlSections } from "./donut-schema-sections";

type SchemaControl = Readonly<{
  max?: number;
  min?: number;
  options?: readonly Readonly<{ value: string }>[];
  target?: string;
  type: string;
}>;

function controlByTarget(): ReadonlyMap<string, SchemaControl> {
  const controls = new Map<string, SchemaControl>([
    ["canvas.infinity", { type: "switch" }],
    ["export.includeBackground", { type: "switch" }],
  ]);
  for (const section of donutControlSections) {
    for (const control of Object.values(section.controls)) {
      const candidate = control as SchemaControl;
      if (typeof candidate.target === "string") {
        controls.set(candidate.target, candidate);
      }
    }
  }
  return controls;
}

describe("donut flavor presets", () => {
  it("exposes ten uniquely named tasty presets plus a custom sentinel", () => {
    expect(DONUT_PRESETS).toHaveLength(10);
    expect(new Set(DONUT_PRESETS.map((preset) => preset.id)).size).toBe(10);
    expect(new Set(DONUT_PRESETS.map((preset) => preset.label)).size).toBe(10);
    expect(
      DONUT_PRESETS.some((preset) => preset.id === DONUT_PRESET_CUSTOM),
    ).toBe(false);
    expect(findDonutPreset(DONUT_PRESET_CUSTOM)).toBeNull();
    expect(DONUT_PRESET_DEFAULT).toBe("strawberry-party");
    expect(DONUT_PRESETS[0]?.id).toBe(DONUT_PRESET_DEFAULT);
    expect(findDonutPreset(DONUT_PRESET_DEFAULT)?.label).toBe(
      "Strawberry Party",
    );
    expect(findDonutPreset("classic-glazed")?.label).toBe("Classic Glazed");
    expect(findDonutPreset(42)).toBeNull();
  });

  it("uses every supplied preset scene as its exact curated default", () => {
    expect(DONUT_PRESETS).toEqual(presetDefaultsSource.presets);
  });

  it("writes one identical curated key set through every preset", () => {
    const keySets = DONUT_PRESETS.map((preset) =>
      Object.keys(preset.values).sort().join("|"),
    );
    expect(new Set(keySets).size).toBe(1);
    expect(Object.keys(DONUT_PRESETS[0]!.values).length).toBeGreaterThanOrEqual(
      24,
    );
  });

  it("targets only reachable schema controls within their authored bounds", () => {
    const controls = controlByTarget();
    expect(controls.has(DONUT_PRESET_TARGET)).toBe(true);
    for (const preset of DONUT_PRESETS) {
      for (const [target, value] of Object.entries(preset.values)) {
        const control = controls.get(target);
        expect(control, `${preset.id}: ${target}`).toBeDefined();
        if (!control) continue;
        if (control.type === "slider") {
          expect(typeof value).toBe("number");
          const numeric = Number(value);
          expect(numeric).toBeGreaterThanOrEqual(control.min ?? -Infinity);
          expect(numeric).toBeLessThanOrEqual(control.max ?? Infinity);
        } else if (control.type === "select" || control.type === "segmented") {
          const allowed = (control.options ?? []).map(
            (option) => option.value,
          );
          expect(allowed).toContain(String(value));
        } else if (control.type === "color") {
          expect(String(value)).toMatch(/^#[\dA-F]{6}$/i);
        } else if (control.type === "switch") {
          expect(typeof value).toBe("boolean");
        }
      }
    }
  });

  it("keeps every flavor distinct through icing color or topping identity", () => {
    const signatures = DONUT_PRESETS.map((preset) =>
      [
        preset.values["icing.color"],
        preset.values["sprinkles.palette"],
        preset.values["sprinkles.flow"],
        preset.values["material.icing.glaze"],
      ].join(":"),
    );
    expect(new Set(signatures).size).toBe(10);
  });

  it("keeps every flavor on its supplied colored infinite canvas", () => {
    for (const preset of DONUT_PRESETS) {
      expect(preset.values).toMatchObject({
        "canvas.infinity": true,
        "export.includeBackground": true,
        "sprinkles.surfaceOffset": 0,
      });
      expect(preset.values["appearance.background"]).toMatch(
        /^#[\dA-F]{6}$/i,
      );
    }
  });

  it("uses the supplied restrained Classic Glazed icing shell", () => {
    expect(findDonutPreset("classic-glazed")?.values).toMatchObject({
      "icing.coverage": 0.86,
      "icing.thickness": 1.04,
    });
  });
});

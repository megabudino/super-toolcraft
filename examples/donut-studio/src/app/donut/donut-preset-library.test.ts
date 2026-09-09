import { describe, expect, it } from "vitest";

import {
  DONUT_DEFAULT_PRESET_LIBRARY_JSON,
  DONUT_FACTORY_PRESET_LIBRARY,
  DONUT_PRESET_LIBRARY_FORMAT,
  DONUT_PRESET_LIBRARY_VERSION,
  findDonutLibraryPreset,
  parseDonutPresetLibrary,
  readCurrentDonutPresetValues,
  resetDonutLibraryPreset,
  serializeDonutPresetLibrary,
  shouldApplyDonutPresetOnInitialMount,
  updateDonutPresetLibrary,
} from "./donut-preset-library";
import presetDefaultsSource from "./donut-preset-defaults.json";

describe("editable donut preset library", () => {
  it("expands every factory flavor to the same complete visual key set", () => {
    expect(DONUT_FACTORY_PRESET_LIBRARY).toMatchObject({
      format: DONUT_PRESET_LIBRARY_FORMAT,
      version: DONUT_PRESET_LIBRARY_VERSION,
    });
    expect(DONUT_FACTORY_PRESET_LIBRARY.presets).toHaveLength(10);

    const keySets = DONUT_FACTORY_PRESET_LIBRARY.presets.map((preset) =>
      Object.keys(preset.values).sort().join("|"),
    );
    expect(new Set(keySets).size).toBe(1);
    expect(
      Object.keys(DONUT_FACTORY_PRESET_LIBRARY.presets[0]!.values).length,
    ).toBeGreaterThanOrEqual(60);
  });

  it("round-trips its default versioned JSON document", () => {
    const result = parseDonutPresetLibrary(
      DONUT_DEFAULT_PRESET_LIBRARY_JSON,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(serializeDonutPresetLibrary(result.library)).toBe(
      DONUT_DEFAULT_PRESET_LIBRARY_JSON,
    );
  });

  it("promotes the complete supplied source library with Strawberry first", () => {
    expect(DONUT_FACTORY_PRESET_LIBRARY).toEqual(presetDefaultsSource);
    expect(DONUT_FACTORY_PRESET_LIBRARY.presets[0]).toMatchObject({
      id: "strawberry-party",
      values: {
        "appearance.background": "#C8B1BD",
        "material.icing.glaze": 0.55,
        "scene.orientation": {
          position: [-2.8292787171709213, 5.543043574797161, 5.590156515560591],
          up: [0.29922053998704756, 0.7489601052954004, -0.5912070949555345],
        },
        "sprinkles.flow": 1.25,
      },
    });
    const sharedOrientation =
      DONUT_FACTORY_PRESET_LIBRARY.presets[0]!.values["scene.orientation"];
    expect(
      DONUT_FACTORY_PRESET_LIBRARY.presets.every(
        (preset) => preset.values["scene.orientation"] === sharedOrientation ||
          JSON.stringify(preset.values["scene.orientation"]) ===
            JSON.stringify(sharedOrientation),
      ),
    ).toBe(true);
  });

  it("applies a partial known-preset update without replacing other presets", () => {
    const chocolateBefore = findDonutLibraryPreset(
      DONUT_FACTORY_PRESET_LIBRARY,
      "dark-chocolate",
    );
    const result = parseDonutPresetLibrary({
      format: DONUT_PRESET_LIBRARY_FORMAT,
      presets: [
        {
          id: "strawberry-party",
          label: "Untrusted imported label",
          values: {
            "icing.color": "#123456",
            "sprinkles.flow": 2.5,
          },
        },
      ],
      version: DONUT_PRESET_LIBRARY_VERSION,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(
      findDonutLibraryPreset(result.library, "strawberry-party"),
    ).toMatchObject({
      label: "Strawberry Party",
      values: {
        "icing.color": "#123456",
        "sprinkles.flow": 2,
      },
    });
    expect(
      findDonutLibraryPreset(result.library, "dark-chocolate"),
    ).toEqual(chocolateBefore);
  });

  it("rejects malformed and incompatible documents", () => {
    expect(parseDonutPresetLibrary("{nope")).toMatchObject({
      code: "preset-json-invalid",
      ok: false,
    });
    expect(
      parseDonutPresetLibrary({
        format: DONUT_PRESET_LIBRARY_FORMAT,
        presets: [],
        version: 99,
      }),
    ).toMatchObject({
      code: "preset-library-format-invalid",
      ok: false,
    });
  });

  it("updates and resets only the requested named preset", () => {
    const strawberryBefore = findDonutLibraryPreset(
      DONUT_FACTORY_PRESET_LIBRARY,
      "strawberry-party",
    );
    const edited = updateDonutPresetLibrary(
      DONUT_FACTORY_PRESET_LIBRARY,
      "classic-glazed",
      {
        ...findDonutLibraryPreset(
          DONUT_FACTORY_PRESET_LIBRARY,
          "classic-glazed",
        )!.values,
        "icing.color": "#112233",
      },
    );
    expect(
      findDonutLibraryPreset(edited, "classic-glazed")?.values[
        "icing.color"
      ],
    ).toBe("#112233");
    expect(findDonutLibraryPreset(edited, "strawberry-party")).toEqual(
      strawberryBefore,
    );

    const reset = resetDonutLibraryPreset(edited, "classic-glazed");
    expect(findDonutLibraryPreset(reset, "classic-glazed")).toEqual(
      findDonutLibraryPreset(
        DONUT_FACTORY_PRESET_LIBRARY,
        "classic-glazed",
      ),
    );
    expect(findDonutLibraryPreset(reset, "strawberry-party")).toEqual(
      strawberryBefore,
    );
  });

  it("captures appearance while normalizing the shared preset viewport", () => {
    const values = readCurrentDonutPresetValues({
      canvas: { mode: "finite" } as never,
      values: {
        "icing.color": "#ABCDEF",
        "material.donut.roughness": 0.42,
        "scene.orientation": {
          position: [1, 2, 3],
          up: [0, 1, 0],
        },
      },
    });

    expect(values).toMatchObject({
      "canvas.infinity": true,
      "icing.color": "#ABCDEF",
      "material.donut.roughness": 0.42,
      "scene.orientation": {
        position: [-2.8292787171709213, 5.543043574797161, 5.590156515560591],
        up: [0.29922053998704756, 0.7489601052954004, -0.5912070949555345],
      },
    });
    expect(values).not.toHaveProperty("donut.preset");
    expect(values).not.toHaveProperty("donut.presetLibrary");
  });

  it("upgrades legacy scene snapshots to the shared preset viewport", () => {
    const result = parseDonutPresetLibrary({
      format: DONUT_PRESET_LIBRARY_FORMAT,
      presets: [
        {
          id: "classic-glazed",
          label: "Classic Glazed",
          values: {
            "canvas.infinity": false,
            "material.donut.roughness": 0.42,
            "scene.orientation": {
              position: [1, 2, 3],
              up: [0, 1, 0],
            },
          },
        },
      ],
      version: DONUT_PRESET_LIBRARY_VERSION,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(
      findDonutLibraryPreset(result.library, "classic-glazed")?.values,
    ).toMatchObject({
      "canvas.infinity": true,
      "material.donut.roughness": 0.42,
      "scene.orientation": findDonutLibraryPreset(
        DONUT_FACTORY_PRESET_LIBRARY,
        "strawberry-party",
      )?.values["scene.orientation"],
    });
  });

  it("does not overwrite a newer restored default scene on initial mount", () => {
    const stored = findDonutLibraryPreset(
      DONUT_FACTORY_PRESET_LIBRARY,
      "strawberry-party",
    )!.values;

    expect(
      shouldApplyDonutPresetOnInitialMount(
        "strawberry-party",
        stored,
        stored,
      ),
    ).toBe(true);
    expect(
      shouldApplyDonutPresetOnInitialMount(
        "strawberry-party",
        {
          ...stored,
          "donut.majorRadius": 0.93,
        },
        stored,
      ),
    ).toBe(false);
  });
});

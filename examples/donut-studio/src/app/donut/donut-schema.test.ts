import { describe, expect, it } from "vitest";

import {
  appControlSectionInventory,
  appProductReadiness,
} from "../app-acceptance-data";
import { appSchema } from "../app-schema";
import {
  DONUT_DEFAULT_PRESET_ORIENTATION,
  DONUT_PRESET_CUSTOM,
  DONUT_PRESET_DEFAULT,
  DONUT_PRESETS,
} from "./donut-presets";

function productSections() {
  return (
    appSchema.panels.controls?.sections.filter(
      (section) => section.title !== "Setup",
    ) ?? []
  );
}

describe("donut product schema", () => {
  it("declares the spatial product before renderer implementation", () => {
    expect(appProductReadiness).toMatchObject({
      mode: "product",
      productName: "Donut Studio",
      viewInteraction: {
        mode: "orbit",
        orientationTargets: ["scene.orientation"],
      },
    });
  });

  it("uses the exact product section order and source-backed controls", () => {
    expect(productSections().map((section) => section.title)).toEqual([
      "Presets",
      "Donut Shape",
      "Donut Material",
      "Donut Surface",
      "Icing Shape",
      "Icing Flow",
      "Icing Material",
      "Sprinkles",
      "Distribution",
      "Sprinkle Material",
      "Plate",
      "Environment",
      "Shadows",
      "Key Light",
      "Warm Light",
      "Cool Light",
      "Image Export",
      "Export",
    ]);

    const controls =
      appSchema.panels.controls?.sections.flatMap((section) =>
        Object.values(section.controls),
      ) ?? [];
    expect(controls.map((control) => control.target)).toEqual(
      expect.arrayContaining([
        "donut.preset",
        "donut.presetLibrary",
        "scene.plateVisible",
        "scene.orientation",
        "donut.majorRadius",
        "donut.thickness",
        "donut.height",
        "donut.organic",
        "icing.enabled",
        "icing.coverage",
        "icing.thickness",
        "icing.flow",
        "icing.dripAmount",
        "icing.dripFrequency",
        "icing.detail",
        "icing.color",
        "icing.clearMode",
        "sprinkles.flow",
        "sprinkles.scale",
        "sprinkles.shape",
        "sprinkles.palette",
        "sprinkles.metallic",
        "sprinkles.solidColor",
        "sprinkles.clear",
        "sprinkles.seed",
        "sprinkles.coverage",
        "sprinkles.sizeVariation",
        "sprinkles.rotation",
        "sprinkles.surfaceOffset",
        "material.donut.color",
        "material.donut.bake",
        "material.donut.pores",
        "material.donut.moisture",
        "material.donut.variation",
        "material.icing.roughness",
        "material.icing.glaze",
        "material.icing.texture",
        "material.sprinkle.coat",
        "material.plate.color",
        "studio.hdriVisible",
        "studio.environmentBlur",
        "studio.environmentStrength",
        "studio.shadowsEnabled",
        "studio.shadowStrength",
        "studio.shadowSoftness",
        "studio.key.power",
        "studio.warm.color",
        "studio.cool.size",
        "export.includeBackground",
        "appearance.background",
        "export.image.format",
        "export.image.resolution",
        "actions.output",
      ]),
    );
    expect(
      controls.find((control) => control.target === "sprinkles.solidColor"),
    ).toMatchObject({
      type: "color",
      visibleWhen: { equals: "1", target: "sprinkles.palette" },
    });
    expect(
      controls.find((control) => control.target === "donut.presetLibrary"),
    ).toMatchObject({
      actions: [
        {
          label: "Reset flavor",
          value: "presets.reset-current",
        },
      ],
      label: false,
      type: "actions",
      visibleWhen: {
        notEquals: "custom",
        target: "donut.preset",
      },
    });
    const flavor = controls.find(
      (control) => control.target === "donut.preset",
    );
    expect(flavor).toMatchObject({
      defaultValue: DONUT_PRESET_DEFAULT,
    });
    expect(
      (flavor as { options?: readonly { value: string }[] }).options?.map(
        (option) => option.value,
      ),
    ).toEqual([
      ...DONUT_PRESETS.map((preset) => preset.id),
      DONUT_PRESET_CUSTOM,
    ]);
    expect(
      controls.find(
        (control) => control.target === "sprinkles.surfaceOffset",
      ),
    ).toMatchObject({
      max: 0.15,
      min: -0.15,
      type: "slider",
    });
    expect(
      controls.find((control) => control.target === "scene.orientation"),
    ).toMatchObject({
      defaultValue: {
        position: [...DONUT_DEFAULT_PRESET_ORIENTATION.position],
        up: [...DONUT_DEFAULT_PRESET_ORIENTATION.up],
      },
    });
  });

  it("keeps the runtime surface neutral except for editable raster output", () => {
    expect(appSchema.canvas).toMatchObject({
      enabled: true,
      renderScale: {
        defaultValue: 2,
        enabled: true,
        max: 2,
        min: 1,
      },
      size: { height: 1080, width: 1920 },
      sizing: { mode: "editable-output" },
      upload: false,
    });
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appSchema.persistence).toMatchObject({
      include: ["canvas", "panels", "values"],
      storage: "localStorage",
    });
  });

  it("inventories every product section exactly once", () => {
    expect(appControlSectionInventory.map((section) => section.title)).toEqual([
      "Presets",
      "Donut Shape",
      "Donut Material",
      "Donut Surface",
      "Icing Shape",
      "Icing Flow",
      "Icing Material",
      "Sprinkles",
      "Distribution",
      "Sprinkle Material",
      "Plate",
      "Environment",
      "Shadows",
      "Key Light",
      "Warm Light",
      "Cool Light",
      "Image Export",
    ]);
    expect(
      appControlSectionInventory.flatMap((section) => section.targets),
    ).toEqual(
      expect.arrayContaining([
        "donut.majorRadius",
        "material.donut.color",
        "material.donut.bake",
        "icing.coverage",
        "icing.flow",
        "material.icing.roughness",
        "material.icing.glaze",
        "sprinkles.flow",
        "sprinkles.seed",
        "material.sprinkle.coat",
        "material.plate.color",
        "studio.hdriVisible",
        "studio.environmentStrength",
        "studio.shadowsEnabled",
        "studio.shadowStrength",
        "studio.key.power",
        "studio.warm.color",
        "studio.cool.size",
        "export.image.format",
      ]),
    );
  });
});

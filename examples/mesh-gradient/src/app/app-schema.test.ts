import { describe, expect, it } from "vitest";

import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

describe("appSchema", () => {
  it("publishes the Mesh Gradient Toolcraft product contract", () => {
    expect(appSchema.canvas).toMatchObject({
      draggable: true,
      enabled: true,
      renderScale: { enabled: true },
      sizing: { mode: "editable-output" },
      upload: false,
    });
    expect(appSchema.canvas.size).toEqual({ height: 600, unit: "px", width: 800 });
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toMatchObject({
      defaultDurationSeconds: 6,
      enabled: true,
      mode: "playback",
    });
    expect(appSchema.persistence).toMatchObject({
      storage: "localStorage",
      version: 4,
    });
    expect(appSchema.assembly.capabilities).toEqual(
      expect.arrayContaining([
        "canvas.draggable",
        "canvas.editableSize",
        "controls.defaults",
        "controls.panel",
        "timeline.playback",
        "toolbar.history",
        "toolbar.radar",
        "toolbar.theme",
        "toolbar.zoom",
      ]),
    );
  });

  it("groups controls by mesh workflow and keeps export settings last", () => {
    const titles =
      appSchema.panels.controls?.sections.flatMap((section) =>
        section.title ? [section.title] : [],
      ) ?? [];

    expect(titles).toEqual([
      "Setup",
      "Presets",
      "Color Points",
      "Topology",
      "Mixing",
      "Color Correction",
      "Motion",
      "Background",
      "Image Export",
      "Video Export",
      "Export",
    ]);
    expect(titles.indexOf("Image Export")).toBeLessThan(titles.indexOf("Video Export"));
    expect(
      appSchema.panels.controls?.sections
        .flatMap((section) => Object.values(section.controls))
        .find((control) => control.target === "mesh.editing"),
    ).toMatchObject({ defaultValue: true, type: "switch" });
    expect(
      appSchema.panels.controls?.sections
        .flatMap((section) => Object.values(section.controls))
        .find((control) => control.target === "export.actions"),
    ).toMatchObject({ target: "export.actions", type: "panelActions" });
  });

  it("declares the bounded mesh point workload and canonical renderer", () => {
    expect(appPerformance.workloadEnvelope.dimensions).toEqual([
      expect.objectContaining({
        defaultValue: 12,
        id: "mesh-point-count",
        interactiveMax: 16,
        source: { kind: "schema-target", target: "mesh.colors" },
      }),
    ]);
    expect(appPerformance.rendererPipeline?.runtimeId).toBe(
      "mesh-gradient-renderer-v2",
    );
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
  });
});

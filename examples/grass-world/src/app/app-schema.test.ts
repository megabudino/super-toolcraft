import { describe, expect, it } from "vitest";

import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

describe("Grass Studio schema", () => {
  it("publishes editable raster output without user-facing timeline", () => {
    expect(appSchema.canvas).toMatchObject({
      draggable: true,
      enabled: true,
      sizing: { mode: "editable-output" },
      upload: false,
    });
    expect(appSchema.canvas.renderScale).toMatchObject({
      defaultValue: 2,
      enabled: true,
      max: 2,
    });
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appSchema.toolbar).toEqual({
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    });
    expect(appSchema.assembly.components).toEqual(
      expect.arrayContaining([
        "canvas",
        "controlsPanel",
        "toolbar",
      ]),
    );
    expect(appSchema.assembly.capabilities).toEqual(
      expect.arrayContaining([
        "canvas.draggable",
        "canvas.editableSize",
        "controls.defaults",
        "controls.panel",
        "toolbar.history",
        "toolbar.radar",
        "toolbar.theme",
        "toolbar.zoom",
      ]),
    );
  });

  it("injects runtime Setup before the semantic grass sections", () => {
    const sections = appSchema.panels.controls?.sections ?? [];
    expect(sections[0]?.title).toBe("Setup");
    expect(sections[0]?.controls.settingsTransfer).toMatchObject({
      target: "runtime.settingsTransfer",
      type: "settingsTransfer",
    });
    expect(sections[0]?.controls.canvasAspectRatio).toMatchObject({
      target: "canvas.aspectRatio",
      type: "aspectRatio",
    });
    expect(sections.map((section) => section.title)).toEqual([
      "Setup",
      "Preview Quality",
      "Scene Setup",
      "Scene Environment",
      "Scene Lighting",
      "Light Balance",
      "Sun Patches",
      "Color Grade",
      "Field",
      "Terrain",
      "Surface",
      "Surface Bend",
      "Surface Fade",
      "Ground Shadow",
      "Lawn Cover",
      "Lawn Distribution",
      "Lawn Blade",
      "Lawn Appearance",
      "Cover gradient",
      "Lawn Instance Colors",
      "Tall Grass",
      "Tall Grass Distribution",
      "Tall Grass Placement",
      "Tall Grass Blade",
      "Tall Grass Appearance",
      "Blade gradient",
      "Tall Grass Instance Colors",
      "Tufted Grass",
      "Wild Grass",
      "White Flowers",
      "Yellow Flowers",
      "Small Rocks",
      "Tundra Boulder",
      "Butterflies",
      "Wind Mode",
      "Ambient Sway",
      "Gust Dynamics",
      "Simulation",
      "Surface Tilt",
      "Background",
      "Image Export",
      "Export",
    ]);
  });

  it("keeps autonomous animation internal and exposes PNG only", () => {
    expect(appSchema.assembly.commands).toEqual(
      expect.arrayContaining([
        "canvas.center",
        "canvas.setSize",
        "canvas.setViewport",
        "controls.reset",
        "controls.setValue",
        "history.undo",
      ]),
    );
    expect(appSchema.assembly.components).not.toContain("timelinePanel");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    const footer = appSchema.panels.controls?.sections.at(-1);
    expect(footer?.controls.footer.actions).toEqual([
      expect.objectContaining({ role: "export-image", value: "export.png" }),
    ]);
  });

  it("declares bounded renderer paths for blades and preview scale", () => {
    expect(appPerformance.rendererStrategy).toBe("webgl");
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
    expect(appPerformance.workloadEnvelope.dimensions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "blade-count",
          interactiveMax: 24_000,
        }),
        expect.objectContaining({
          id: "lawn-blade-count",
          interactiveMax: 36_000,
        }),
        expect.objectContaining({
          id: "preview-render-scale",
          interactiveMax: 2,
        }),
      ]),
    );
  });
});

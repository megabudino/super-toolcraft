import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

describe("Dispersion Carousel schema", () => {
  it("publishes the editable product canvas and runtime shell", () => {
    expect(appSchema.canvas).toMatchObject({
      draggable: true,
      enabled: true,
      renderScale: {
        defaultValue: 2,
        enabled: true,
        max: 2,
        min: 1,
      },
      size: { height: 1034, width: 1920 },
      sizing: { mode: "editable-output" },
      upload: false,
    });
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appSchema.toolbar).toEqual({
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    });
    expect(appSchema.assembly.components).toEqual([
      "canvas",
      "controlsPanel",
      "toolbar",
    ]);
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
    expect(appSchema.assembly.capabilities).not.toContain("canvas.upload");
  });

  it("exposes the complete edge-dispersion and still-export workflow", () => {
    const sectionIds =
      appSchema.panels.controls?.sections.map((section) => section.id) ?? [];
    expect(sectionIds).toEqual(
      expect.arrayContaining([
        "runtime.setup",
        "edge-zone",
        "edge-warp",
        "edge-dispersion",
        "aura-gate",
        "image-export",
        "runtime.export",
      ]),
    );
  });

  it("omits time-based behavior for the user-driven still carousel", () => {
    expect(appSchema.assembly.capabilities).not.toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appSchema.assembly.commands).not.toContain(
      "timeline.toggleControlKeyframes",
    );
  });

  it("derives non-empty canonical workload paths from the renderer pipeline", () => {
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
    expect(
      appPerformance.workloadEnvelope.dimensions.map((entry) => entry.id),
    ).toEqual(["edge-blur-radius", "image-long-edge", "lens-samples"]);
  });

  it("declares production reload coverage for every persisted slice", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("Dispersion Carousel must persist its workspace locally.");
    }
    expect(appSchema.persistence.include).toEqual([
      "canvas",
      "panels",
      "values",
    ]);
    expect(
      appAcceptance.find((entry) => entry.id === "runtime.persistence.reload"),
    ).toMatchObject({
      automated: true,
      browser: true,
      evidence: "persistence-state",
      kind: "runtime",
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
      target: "canvas.size.width",
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { createToolcraftState } from "@/toolcraft/runtime";

import {
  appAcceptance,
  appControlSectionInventory,
  appProductReadiness,
  appTransferMode,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

describe("Logo Sphere product schema", () => {
  it("uses the supplied Grid settings as fresh-workspace and reset defaults", () => {
    const state = createToolcraftState(appSchema);
    const expected = {
      "sphere.visibleCount": 63,
      "sphere.distribution": "grid",
      "sphere.radius": 360,
      "sphere.logoSize": 110,
      "sphere.depth": 66,
      "sphere.perspective": 2.2,
      "sphere.fisheye": 46,
      "fade.maskSize": 109,
      "fade.feather": 30,
      "fade.rearOpacity": 10,
      "card.strokeWidth": 0.5,
      "view.orbit": {
        position: [0.033405701706035754, 4.839599778675587, -1.25584952973559],
        up: [-0.02573764723262314, 0.2512587496779799, 0.967577704489509],
      },
    };
    expect(state.defaults).toMatchObject(expected);
    expect(state.values).toMatchObject(expected);
    expect(state.canvas).toMatchObject({
      mode: "infinite",
      size: { width: 1920, height: 1080, unit: "px" },
    });
    expect(state.values["canvas.renderScale"]).toBe(2);
    expect(state.timeline.durationSeconds).toBe(12);
  });

  it("assembles the editable SVG-card product through Toolcraft runtime surfaces", () => {
    expect(appSchema.canvas).toMatchObject({
      draggable: true,
      enabled: true,
      sizing: { mode: "editable-output" },
      upload: true,
    });
    expect(appSchema.canvas.renderScale).toMatchObject({
      defaultValue: 2,
      enabled: true,
      max: 2,
      min: 1,
    });
    expect(appSchema.media.defaultAssets).toHaveLength(1);
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toMatchObject({
      defaultDurationSeconds: 12,
      enabled: true,
      mode: "playback",
    });
    expect(appSchema.assembly.components).toEqual([
      "canvas",
      "controlsPanel",
      "timelinePanel",
      "toolbar",
    ]);
    expect(appSchema.assembly.capabilities).toEqual(
      expect.arrayContaining([
        "canvas.editableSize",
        "canvas.infinity",
        "canvas.renderScale",
        "canvas.upload",
        "timeline.duration",
        "timeline.playback",
      ]),
    );
  });

  it("publishes runtime Setup followed by cohesive product sections and sticky export", () => {
    const sections = appSchema.panels.controls?.sections ?? [];

    expect(sections.map(({ title }) => title)).toEqual([
      "Setup",
      "Logos",
      "Sphere",
      "Fade Mask",
      "Card Style",
      "Motion",
      "Image Export",
      "Export",
    ]);
    expect(sections[0]?.controls).toHaveProperty("settingsTransfer");
    expect(sections[0]?.controls).toHaveProperty("includeBackground");
    expect(Object.values(sections[0]?.controls ?? {})).toContainEqual(
      expect.objectContaining({ target: "appearance.background", type: "color" }),
    );
    expect(Object.values(sections[0]?.controls ?? {})).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ target: "canvas.infinity" }),
        expect.objectContaining({ target: "canvas.renderScale" }),
        expect.objectContaining({ target: "panels.timeline.extended" }),
      ]),
    );
    expect(appControlSectionInventory.map(({ id }) => id)).toEqual([
      "logos",
      "sphere",
      "fade-mask",
      "card-style",
      "motion",
      "background",
      "image-export",
    ]);
  });

  it("declares product, orbit, playback, and image-only delivery intent", () => {
    expect(appProductReadiness).toMatchObject({
      exportIntent: {
        image: { mode: "toolcraft-default" },
        video: { mode: "not-requested" },
      },
      mode: "product",
      viewInteraction: {
        mode: "orbit",
        orientationTargets: ["view.orbit"],
      },
    });
    expect(appTransferMode.animationIntent).toMatchObject({
      loopDuration: { seconds: 12, source: "product-derived" },
      mode: "timeline-playback",
    });
  });

  it("declares a WebGL renderer envelope and canonical performance paths", () => {
    expect(appPerformance).toMatchObject({
      rendererStrategy: "webgl",
      usesCustomRenderer: true,
    });
    expect(appPerformance.workloadEnvelope.dimensions).toContainEqual(
      expect.objectContaining({
        defaultValue: 63,
        id: "visible-logos",
        interactiveMax: 500,
      }),
    );
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
  });

  it("covers the complete product and resolved persistence plan", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("Logo Sphere must persist its Toolcraft workspace.");
    }
    expect(appSchema.persistence.include).toEqual([
      "canvas",
      "media",
      "panels",
      "timeline",
      "values",
    ]);
    expect(
      appAcceptance.find((entry) => entry.id === "persistence.reload"),
    ).toMatchObject({
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
      target: "sphere.visibleCount",
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});

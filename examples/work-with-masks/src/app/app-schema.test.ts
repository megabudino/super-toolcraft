import { describe, expect, it } from "vitest";
import { createToolcraftState } from "@/toolcraft/runtime";

import {
  appAcceptance,
  appControlSectionInventory,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import { readHeroParams } from "./domain/hero-params";
import { readWavePlacement } from "./domain/wave-placement";

function control(target: string) {
  return appSchema.panels.controls?.sections
    .flatMap((section) => Object.values(section.controls))
    .find((candidate) => candidate.target === target);
}

describe("Percent Hero composition schema", () => {
  it("maps stage-one 3d controls into renderer parameters", () => {
    const state = createToolcraftState(appSchema, {
      values: {
        "camera.position": { x: 0.25, y: -0.5 },
        "light.intensity": 3,
        "rib.depth": 4,
        "structure.count": 300,
        "structure.shape": "dome",
      },
    });
    const params = readHeroParams(state);

    expect(params.structure).toMatchObject({ count: 300, shape: "dome" });
    expect(params.rib.depth).toBe(4);
    expect(params.camera.position).toEqual({ x: 0.25, y: -0.5 });
    expect(params.light.intensity).toBe(3);
    expect(control("sky.gradient")?.type).toBe("gradient");
    expect(control("structure.arc")?.type).toBe("rangeSlider");
    expect(control("camera.position")?.type).toBe("vector");
  });

  it("uses one scene frame in finite and infinite modes", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.size).toEqual({ height: 1200, unit: "px", width: 2400 });
    expect(appSchema.canvas.upload).toBe(true);
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.toolbar).toEqual({
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    });
    expect(appSchema.assembly.components).toEqual([
      "canvas",
      "controlsPanel",
      "timelinePanel",
      "toolbar",
    ]);
    expect(appSchema.assembly.capabilities).toEqual(
      expect.arrayContaining([
        "canvas.draggable",
        "canvas.editableSize",
        "canvas.infinity",
        "canvas.upload",
        "controls.defaults",
        "controls.panel",
        "timeline.playback",
        "toolbar.history",
        "toolbar.radar",
        "toolbar.theme",
        "toolbar.zoom",
      ]),
    );
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appSchema.assembly.commands).toEqual(
      expect.arrayContaining([
        "canvas.center",
        "canvas.setSize",
        "canvas.setViewport",
        "canvas.zoomIn",
        "controls.reset",
        "controls.setValue",
        "history.undo",
        "media.delete",
        "media.import",
        "timeline.setCurrentTime",
      ]),
    );
    expect(
      appAcceptance.find(({ id }) => id === "hero.runtime.infinity"),
    ).toMatchObject({
      infinityCanvasCoverage: "mode-continuity-and-restoration",
    });
  });

  it("publishes the existing hero controls followed by the transferred wave controls", () => {
    const productSections =
      appSchema.panels.controls?.sections.filter((section) => section.title !== "Setup") ?? [];

    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(productSections.map((section) => section.title)).toEqual([
      "Hero heading",
      "Hero spacing",
      "Right lead",
      "Right body",
      "Right copy layout",
      "Wave placement",
      "Presets",
      "Structure",
      "Rib",
      "Camera",
      "Light",
      "Sky",
      "Material",
      "Post-processing",
      "Haze",
      "Flow",
      "Masks",
    ]);
    expect(appSchema.panels.layers).toBeUndefined();
  });

  it("maps wave frame controls to the approved renderer rectangle", () => {
    const placement = readWavePlacement({});

    expect(placement).toEqual({
      height: 1080,
      position: { x: -336, y: 0 },
      width: 2826,
    });
    expect(control("wave.frame.width")).toMatchObject({
      defaultValue: 2826,
      type: "slider",
    });
    expect(control("wave.frame.height")).toMatchObject({
      defaultValue: 1080,
      type: "slider",
    });
    expect(control("wave.frame.position")).toMatchObject({
      defaultValue: { x: -0.14, y: 0 },
      type: "vector",
    });
  });

  it("retains the transferred WebGL renderer across value updates", () => {
    expect(appPerformance.rendererStrategy).toBe("webgl");
    expect(appPerformance.usesCustomRenderer).toBe(true);
    expect(appPerformance.rendererTechnique).toMatchObject({
      exportRenderer: "none",
      previewRenderer: "webgl",
      productRepresentation: "mixed",
    });
  });

  it("uses selected render-scale backing pixels", () => {
    expect(appSchema.canvas.renderScale).toMatchObject({
      defaultValue: 2,
      enabled: true,
      max: 2,
      min: 1,
    });
    expect(
      appAcceptance.find(({ id }) => id === "hero.runtime.render-scale"),
    ).toMatchObject({
      renderScaleCoverage: {
        kind: "selected-backing-pixels",
        states: ["interaction", "playback", "steady"],
      },
    });
  });

  it("declares an eight-second playback timeline and forward Flow controls", () => {
    expect(appSchema.panels.timeline).toEqual({
      defaultDurationSeconds: 8,
      enabled: true,
      mode: "playback",
    });
    expect(control("flow.travel")?.sliderValueKind).toBe("discrete");
    expect(control("flow.direction")?.type).toBe("segmented");
    expect(control("flow.glowOrbit")?.defaultValue).toBe(0);
    expect(control("flow.glowOrbitRadius")?.type).toBe("slider");
    expect(control("motion.amount")).toBeUndefined();
  });

  it("declares production reload coverage for the hero preview schema", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("The hero preview must persist user settings in localStorage.");
    }
    expect(appSchema.persistence.include).toContain("canvas");
    expect(appAcceptance.find((entry) => entry.id === "persistence.reload")).toMatchObject({
      automated: true,
      browser: {
        budget: "extended-io",
        file: "e2e/product-hero-persistence.spec.ts",
        testName: "browser hero preview: top inset persists after reload",
      },
      evidence: "persistence-state",
      kind: "runtime",
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
      target: "hero.layout.topInset",
    });
    expect(appAcceptance.some(({ id }) => id.startsWith("hero.export."))).toBe(false);
    expect(appControlSectionInventory).toHaveLength(18);
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  appControlSectionInventory,
  appProductReadiness,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import { GLOBE_DEFAULTS, GLOBE_SCENE_SIZE, GLOBE_TARGETS } from "./globe-constants";

describe("appSchema", () => {
  it("publishes the landing globe Toolcraft product contract", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.size).toEqual({
      height: GLOBE_SCENE_SIZE.height,
      unit: "px",
      width: GLOBE_SCENE_SIZE.width,
    });
    expect(appSchema.canvas.upload).toBe(false);
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
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
        "canvas.infinity",
        "canvas.renderScale",
        "controls.defaults",
        "controls.panel",
        "toolbar.history",
        "toolbar.radar",
        "toolbar.theme",
        "toolbar.zoom",
      ]),
    );
    expect(appSchema.assembly.capabilities).not.toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
  });

  it("declares the requested globe controls and export settings", () => {
    const sections = appSchema.panels.controls?.sections ?? [];
    const bands = sections.find((section) => section.id === "bands");
    const bandLayout = sections.find((section) => section.id === "band-layout");
    const crt = sections.find((section) => section.id === "crt");
    const globe = sections.find((section) => section.id === "globe");
    const globeOutline = sections.find((section) => section.id === "globe-outline");
    const imageExport = sections.find((section) => section.id === "image-export");
    const logos = sections.find((section) => section.id === "logos");
    const actions = sections.find((section) => section.id === "runtime.export");

    expect(globe?.controls.latitudeCount).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.latitudeCount,
      max: 25,
      min: 3,
      target: GLOBE_TARGETS.latitudeCount,
      type: "slider",
    });
    expect(globe?.controls.meridianCount).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.meridianCount,
      max: 48,
      min: 4,
      target: GLOBE_TARGETS.meridianCount,
      type: "slider",
    });
    expect(globe?.controls.lineWidth).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.lineWidth,
      target: GLOBE_TARGETS.lineWidth,
      type: "slider",
      unit: "px",
    });
    expect(globeOutline?.controls.outline).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.outline,
      target: GLOBE_TARGETS.outline,
      type: "switch",
    });
    expect(crt?.controls.crtIntensity).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.crtIntensity,
      target: GLOBE_TARGETS.crtIntensity,
      type: "slider",
      unit: "%",
    });
    expect(bands?.controls.bandDistance).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.bandDistance,
      target: GLOBE_TARGETS.bandDistance,
      type: "slider",
      unit: "%",
    });
    expect(bands?.controls.bandDotSize).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.bandDotSize,
      target: GLOBE_TARGETS.bandDotSize,
      type: "slider",
      unit: "px",
    });
    expect(bands?.controls.bandColumnSpacing).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.bandColumnSpacing,
      target: GLOBE_TARGETS.bandColumnSpacing,
      type: "slider",
      unit: "px",
    });
    expect(bandLayout?.controls.band1Position).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.band1Position,
      target: GLOBE_TARGETS.band1Position,
      type: "slider",
    });
    expect(bandLayout?.controls.band4Width).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.band4Width,
      target: GLOBE_TARGETS.band4Width,
      type: "slider",
    });
    expect(logos?.controls.dxcFinalPosition).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.logoDxcFinalPosition,
      target: GLOBE_TARGETS.logoDxcFinalPosition,
      type: "slider",
      unit: "%",
    });
    expect(logos?.controls.introRun).toMatchObject({
      actions: [
        {
          icon: "rotate-ccw",
          label: "Run logos",
          value: GLOBE_TARGETS.logoIntroRun,
        },
      ],
      description:
        "Restarts the staggered reference-paced logo orbit cycle.",
      label: "Loop",
      target: GLOBE_TARGETS.logoIntroRun,
      type: "actions",
    });
    expect(logos?.controls.holdSeconds).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.logoHoldSeconds,
      label: "Hold",
      max: 8,
      min: 0,
      target: GLOBE_TARGETS.logoHoldSeconds,
      type: "slider",
      unit: "s",
    });
    expect(logos?.controls.speed).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.logoSpeed,
      label: "Speed",
      max: 2.5,
      min: 0.5,
      target: GLOBE_TARGETS.logoSpeed,
      type: "slider",
    });
    expect(logos?.controls.zillowFinalPosition).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.logoZillowFinalPosition,
      target: GLOBE_TARGETS.logoZillowFinalPosition,
      type: "slider",
      unit: "%",
    });
    expect(globe?.controls.orientation).toMatchObject({
      keyframeable: false,
      label: false,
      target: GLOBE_TARGETS.orientation,
      type: "orientationGizmo",
    });
    expect(imageExport?.controls.imageFormat).toMatchObject({
      defaultValue: "png",
      target: "export.image.format",
      type: "select",
    });
    expect(imageExport?.controls.imageResolution).toMatchObject({
      defaultValue: "4k",
      target: "export.image.resolution",
      type: "select",
    });
    expect(actions?.controls.footer).toMatchObject({
      target: "actions.output",
      type: "panelActions",
    });
  });

  it("declares product readiness for an orbiting image-export globe", () => {
    expect(appProductReadiness).toMatchObject({
      exportIntent: {
        image: { mode: "toolcraft-default" },
        svg: { mode: "not-requested" },
        video: { mode: "not-requested" },
      },
      mode: "product",
      productName: "Landing Globe",
      viewInteraction: {
        mode: "orbit",
        orientationTargets: [GLOBE_TARGETS.orientation],
      },
    });
    expect(appControlSectionInventory.map((entry) => entry.id)).toEqual([
      "background-inclusion",
      "background-color",
      "globe",
      "globe-outline",
      "crt",
      "bands",
      "band-layout",
      "logos",
      "logo-scale",
      "image-export",
    ]);
  });

  it("declares renderer performance paths for the generated globe", () => {
    expect(appPerformance.usesCustomRenderer).toBe(true);
    expect(appPerformance.rendererStrategy).toBe("canvas-2d");
    expect(appPerformance.workloadEnvelope.dimensions.map((dimension) => dimension.id)).toEqual([
      "latitude-rings",
      "meridian-rings",
      "export-long-edge",
      "line-thickness",
      "band-1-width",
      "band-2-width",
      "band-3-width",
      "band-4-width",
      "band-dot-size",
      "band-column-spacing",
    ]);
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
  });

  it("declares product reload coverage and passes acceptance coverage", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("The product must persist user settings in localStorage.");
    }
    expect(appSchema.persistence.include).toEqual(["canvas", "panels", "values"]);
    expect(
      appAcceptance.find((entry) => entry.id === "persistence.reload"),
    ).toMatchObject({
      automated: true,
      browser: true,
      evidence: "persistence-state",
      kind: "runtime",
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
      target: GLOBE_TARGETS.latitudeCount,
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});

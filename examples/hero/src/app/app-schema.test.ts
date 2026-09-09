import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import { heroEffectsTargets } from "./hero-effects-values";

describe("Recraft Hero schema", () => {
  it("publishes an editable website-preview workspace", () => {
    expect(appSchema.identity.title).toBe("Recraft Hero");
    expect(appSchema.canvas).toMatchObject({
      draggable: true,
      enabled: true,
      size: { height: 1080, unit: "px", width: 1920 },
      sizing: { mode: "editable-output" },
      upload: false,
    });
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(appSchema.panels.controls?.sections[0]?.controls.settingsTransfer).toMatchObject({
      target: "runtime.settingsTransfer",
      type: "settingsTransfer",
    });
    expect(appSchema.panels.controls?.sections[0]?.controls.canvasWidth).toMatchObject({
      target: "canvas.size.width",
      type: "text",
    });
    expect(appSchema.panels.controls?.sections[0]?.controls.canvasHeight).toMatchObject({
      target: "canvas.size.height",
      type: "text",
    });
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
  });

  it("groups heading, gallery, lens, motion and effects by product entity", () => {
    const productSections =
      appSchema.panels.controls?.sections.filter(
        (section) => section.id !== "runtime.setup",
      ) ?? [];

    expect(productSections.map((section) => section.title)).toEqual([
      "Pattern",
      "Hero Heading",
      "Position",
      "Badge",
      "Badge Shadow",
      "Heading Shadow",
      "Hero Subtitle",
      "CTA Button",
      "CTA Shadow",
      "Projection",
      "Gallery",
      "Row Images",
      "Lens",
      "Gallery Placement",
      "Auto Scroll",
      "Edge Zone",
      "Edge Warp",
      "Dispersion & Aura",
      "Boundary Aura",
      "Motion Grain",
      "CRT",
      "Export",
    ]);
    expect(
      Object.values(appSchema.panels.controls?.sections[0]?.controls ?? {}).map(
        (control) => control.target,
      ),
    ).toEqual(
      expect.arrayContaining([
        "export.includeBackground",
        "appearance.background",
      ]),
    );
  });

  it("keeps animation and multi-object editing surfaces disabled", () => {
    expect(appSchema.assembly.capabilities).not.toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appSchema.assembly.components).not.toContain("timeline");
    expect(appSchema.assembly.components).not.toContain("layersPanel");
  });

  it("declares native preview paths and bounded shader workload", () => {
    expect(appPerformance.rendererStrategy).toBe("dom");
    expect(appPerformance.usesCustomRenderer).toBe(true);
    expect(appPerformance.workloadEnvelope.dimensions).toMatchObject([
      { id: "edge-blur-radius", defaultValue: 22, interactiveMax: 48,
        source: { kind: "schema-target", target: "dispersion.blur" } },
      { id: "lens-samples", defaultValue: 6, interactiveMax: 48,
        source: { kind: "schema-target", target: "dispersion.count" } },
    ]);
    expect(appPerformance.scenarios.map((scenario) => scenario.interaction)).toEqual([
      "media-import",
      "initial-render",
      "control-drag",
      "viewport-drag",
      "viewport-zoom",
      "control-change",
    ]);
  });

  it("declares complete product acceptance and reload persistence", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("Hero Scene Lab must persist its Toolcraft workspace.");
    }

    expect(
      appAcceptance.find((entry) => entry.id === "persistence.reload"),
    ).toMatchObject({
      automated: true,
      browser: true,
      evidence: "persistence-state",
      kind: "runtime",
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
      target: heroEffectsTargets.crtFade,
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});

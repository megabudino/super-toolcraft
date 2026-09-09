import { describe, expect, it } from "vitest";

import { getToolcraftControlOrderTargets } from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

function getProductControlDefaults(): Record<string, unknown> {
  return Object.fromEntries(
    (appSchema.panels.controls?.sections ?? []).flatMap((section) =>
      Object.values(section.controls)
        .filter((control) => Boolean(control.target))
        .map((control) => [control.target, control.defaultValue]),
    ),
  );
}

describe("appSchema", () => {
  it("publishes the Dither Toolcraft product contract", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.size).toEqual({ height: 2048, unit: "px", width: 2048 });
    expect(appSchema.canvas.sizing).toEqual({ mode: "intrinsic-media" });
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
    expect(appSchema.canvas.upload).toBe(true);
    expect(appSchema.panels.controls?.title).toBe("Dither Lab");
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appSchema.settingsTransfer.enabled).toBe(true);
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("Dither persistence must use localStorage.");
    }
    expect(appSchema.persistence.key).toBe("toolcraft:dither-lab:state:v3");
    expect(appSchema.persistence.version).toBe(3);
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
        "canvas.renderScale",
        "canvas.draggable",
        "canvas.upload",
        "controls.panel",
        "controls.defaults",
        "history.undoRedo",
        "panels.draggable",
        "panels.snap",
        "panels.doubleClickReset",
        "toolbar.history",
        "toolbar.radar",
        "toolbar.theme",
        "toolbar.zoom",
      ]),
    );
    expect(appSchema.assembly.capabilities).not.toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appSchema.assembly.commands).toEqual(
      expect.arrayContaining([
        "canvas.center",
        "canvas.setViewport",
        "canvas.zoomIn",
        "controls.reset",
        "controls.setValue",
        "history.undo",
        "media.delete",
        "media.import",
      ]),
    );
    expect(appSchema.assembly.commands).not.toContain("timeline.setCurrentTime");
  });

  it("uses the imported Lyonecho settings as product defaults", () => {
    expect(getProductControlDefaults()).toMatchObject({
      "appearance.background": { hex: "#050505" },
      "canvas.renderScale": 2,
      "duotone.base": { hex: "#090A13" },
      "duotone.pixels": { hex: "#F7C66C" },
      "duotone.preset": "off",
      "effect.ascii.customGlyphs": "",
      "effect.ascii.glyphs": "hacker",
      "effect.ascii.mode": "filled",
      "effect.density": 8,
      "effect.exposure": 189,
      "effect.fill": 81,
      "effect.layer.blend": "source-over",
      "effect.layer.opacity": 100,
      "effect.scatter": 66,
      "effect.seed": 999,
      "effect.size": 1,
      "effect.style": "dots",
      "export.image.format": "png",
      "export.image.resolution": "4k",
      "export.includeBackground": true,
      "finish.glow": 0,
      "finish.grain": 22,
      "finish.noise": 0,
      "finish.vignette": 0,
      "source.image": [],
      "tone.brightness": 108,
      "tone.contrast": 100,
      "tone.hue": 0,
      "tone.saturation": 100,
    });
  });

  it("groups controls by product entity and workflow stage", () => {
    expect(appSchema.panels.controls?.sections.map((section) => section.title)).toEqual([
      "Setup",
      "Source",
      "Pixel Effect",
      "ASCII",
      "Tone",
      "Texture & Lens",
      "Duotone",
      "Layer",
      "Background",
      "Image Export",
      "Export",
    ]);
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
  });

  it("keeps the app still-output only", () => {
    expect(appSchema.assembly.capabilities).not.toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appSchema.assembly.commands).not.toContain("timeline.toggleControlKeyframes");
    expect(appSchema.assembly.commands).not.toContain("timeline.moveKeyframe");
  });

  it("publishes the exact visible control order", () => {
    expect(getToolcraftControlOrderTargets(appSchema)).toEqual([
      "runtime.settingsTransfer",
      "canvas.renderScale",
      "source.image",
      "effect.style",
      "effect.size",
      "effect.fill",
      "effect.density",
      "effect.exposure",
      "effect.scatter",
      "effect.seed",
      "effect.ascii.mode",
      "effect.ascii.glyphs",
      "effect.ascii.customGlyphs",
      "tone.brightness",
      "tone.contrast",
      "tone.saturation",
      "tone.hue",
      "finish.glow",
      "finish.noise",
      "finish.grain",
      "finish.vignette",
      "duotone.preset",
      "duotone.pixels",
      "duotone.base",
      "effect.layer.opacity",
      "effect.layer.blend",
      "export.includeBackground",
      "appearance.background",
      "export.image.format",
      "export.image.resolution",
    ]);
  });

  it("declares product performance workload coverage", () => {
    expect(appPerformance.usesCustomRenderer).toBe(true);
    expect(appPerformance.rendererStrategy).toBe("canvas-2d");
    expect(appPerformance.rendererWorkload).toBe("pixel-output");
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
    expect(appPerformance.workloadTargets).toEqual(
      expect.arrayContaining([
        "source.image",
        "effect.style",
        "effect.size",
        "effect.fill",
        "effect.density",
        "finish.glow",
        "export.image.resolution",
        "canvas.renderScale",
      ]),
    );
  });
});

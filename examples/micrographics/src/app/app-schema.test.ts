import { describe, expect, it } from "vitest";

import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import { defaultMicrographicsValues } from "./default-settings";
import { coverPresetSrc, normalizeCoverPresetId } from "./template-covers";

describe("appSchema", () => {
  it("publishes the base Toolcraft template app contract for AI assembly", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.upload).toBe(false);
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(appSchema.panels.controls?.sections[0]?.controls.settingsTransfer).toMatchObject({
      target: "runtime.settingsTransfer",
      type: "settingsTransfer",
    });
    expect(appSchema.panels.controls?.sections[0]?.controls.canvasAspectRatio).toMatchObject({
      target: "canvas.aspectRatio",
      type: "aspectRatio",
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
    expect(appSchema.assembly.capabilities).not.toContain("timeline.playback");
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
      ]),
    );
    expect(appSchema.assembly.commands).not.toContain("timeline.setCurrentTime");
  });

  it("publishes the complete micrographics product control surface", () => {
    const productSections =
      appSchema.panels.controls?.sections.filter((section) => section.title !== "Setup") ??
      [];

    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(productSections.map((section) => section.title)).toEqual([
      "Composition",
      "Template Library",
      "Elements",
      "Global Color",
      "Palette",
      "Source Photo",
      "Background",
      "Image Export",
      "Export",
    ]);
    expect(productSections[5]?.controls.preset).toMatchObject({
      defaultValue: "fitness",
      items: [
        { alt: "Runner", value: "atlas" },
        { alt: "Profile", value: "profile" },
        { alt: "Fitness", value: "fitness" },
        { alt: "Pilates", value: "pilates" },
        { alt: "Mesh", value: "mesh" },
        { alt: "Chaos", value: "chaos" },
        { alt: "Paper", value: "paper" },
        { alt: "Wireframe", value: "wireframe" },
      ],
      target: "source.preset",
      type: "imagePicker",
    });
    expect(productSections.some((section) => section.title === "Format")).toBe(false);
    expect(
      productSections.flatMap((section) =>
        Object.values(section.controls).map((control) => control.target),
      ),
    ).not.toContain("canvas.commands");
    expect(productSections[7]?.controls.format).toMatchObject({
      target: "export.image.format",
      type: "select",
    });
    expect(productSections[3]?.controls.color).toMatchObject({
      defaultValue: "#FFFFFF",
      target: "ink.color",
      type: "color",
    });
    expect(productSections[3]?.controls.glow).toMatchObject({
      defaultValue: 0,
      max: 100,
      min: 0,
      target: "ink.glow",
      type: "slider",
    });
    expect(productSections[4]?.controls.colors).toMatchObject({
      minItems: 1,
      target: "palette.colors",
      type: "collectionActions",
    });
    expect(productSections[1]?.controls.template).toMatchObject({
      defaultValue: "",
      label: false,
      target: "library.template",
      type: "templateLibrary",
    });
    expect(productSections[1]?.controls.commands).toBeUndefined();
    expect(productSections[0]?.controls.kit).toMatchObject({
      options: expect.arrayContaining([
        expect.objectContaining({ value: "full" }),
        expect.objectContaining({ value: "minimal" }),
      ]),
      target: "composition.kit",
      type: "select",
    });
    expect(productSections[0]?.controls.templateTier).toMatchObject({
      defaultValue: "both",
      options: [
        { label: "Simple", value: "simple" },
        { label: "Mega", value: "mega" },
        { label: "Both", value: "both" },
      ],
      target: "composition.templateTier",
      type: "segmented",
    });
    expect(productSections[0]?.controls.count).toMatchObject({
      max: 16,
      min: 3,
      performanceRole: "workload",
      target: "composition.count",
    });
    expect(productSections[0]?.controls.commands).toMatchObject({
      defaultValue: defaultMicrographicsValues["composition.layout"],
      target: "composition.layout",
      type: "actions",
    });
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appSchema.persistence).toMatchObject({
      additionalValueTargets: [],
      storage: "localStorage",
    });
    expect(appSchema.settingsTransfer).toMatchObject({
      additionalValueTargets: [],
      appId: "micrographics",
    });
  });

  it("uses the imported settings as product defaults", () => {
    const productSections =
      appSchema.panels.controls?.sections.filter(
        (section) => section.title !== "Setup",
      ) ?? [];
    const composition = productSections.find(
      (section) => section.title === "Composition",
    );
    const elements = productSections.find(
      (section) => section.title === "Elements",
    );
    const sourcePhoto = productSections.find(
      (section) => section.title === "Source Photo",
    );

    expect(composition?.controls.seed?.defaultValue).toBe(447);
    expect(composition?.controls.count?.defaultValue).toBe(3);
    expect(composition?.controls.kit?.defaultValue).toBe("minimal");
    expect(elements?.controls.scale?.defaultValue).toBe(71);
    expect(sourcePhoto?.controls.preset?.defaultValue).toBe("fitness");
    expect(appSchema.canvas.size).toEqual({
      height: 1350,
      unit: "px",
      width: 1080,
    });
  });

  it("does not imply timeline behavior before a product needs it", () => {
    expect(appSchema.assembly.capabilities).not.toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appSchema.assembly.commands).not.toContain("timeline.toggleControlKeyframes");
    expect(appSchema.assembly.commands).not.toContain("timeline.moveKeyframe");
  });

  it("normalizes removed persisted cover ids to Runner", () => {
    expect(normalizeCoverPresetId("mesh")).toBe("mesh");
    expect(normalizeCoverPresetId("scan")).toBe("atlas");
    expect(coverPresetSrc("scan")).toBe("/covers/runner-close-crop.jpg");
  });

  it("declares assessed workload paths for vector generation and export", () => {
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
    expect(appPerformance.workloadEnvelope.dimensions).toEqual([
      expect.objectContaining({
        id: "element-count",
        interactiveMax: 16,
      }),
      expect.objectContaining({
        id: "template-tier-weight",
        interactiveMax: 3,
      }),
    ]);
    expect(appPerformance.rendererStrategy).toBe("svg");
    expect(appPerformance.usesCustomRenderer).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import type { ToolcraftState } from "@/toolcraft/runtime";

import {
  appAcceptance,
  appProductReadiness,
  appTransferMode,
} from "./app-acceptance-data";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import {
  readSpiralGallerySettings,
  selectSpiralGalleryImages,
} from "./spiral-gallery/spiral-gallery-settings";
import { spiralGalleryPipelineRegistration } from "./spiral-gallery/spiral-gallery-pipeline";

const automatedTestName =
  "image gallery acceptance maps schema, media, and interaction state to product output";

describe("Image Gallery product contract", () => {
  it(automatedTestName, () => {
    const sectionTitles = appSchema.panels.controls?.sections.map(
      (section) => section.title,
    );
    expect(sectionTitles).toEqual(
      expect.arrayContaining([
        "Gallery",
        "Layout",
        "Flow",
        "Deck",
        "Cards",
        "Depth",
        "Physics",
        "Interaction",
        "View",
        "Background",
        "Image Export",
      ]),
    );
    expect(sectionTitles).not.toContain("Overlay");
    expect(sectionTitles).not.toContain("Blinds");
    const sections = appSchema.panels.controls?.sections ?? [];
    const defaultValues = Object.fromEntries(
      sections.flatMap((section) =>
        Object.values(section.controls).flatMap((control) =>
          "defaultValue" in control && "target" in control
            ? [[control.target, control.defaultValue]]
            : [],
        ),
      ),
    );
    expect(defaultValues).toEqual({
      "appearance.background": "#EDEDED",
      "canvas.aspectRatio": {
        height: 9,
        mode: "preset",
        value: "16:9",
        width: 16,
      },
      "canvas.renderScale": 2,
      "canvas.size.height": 1080,
      "canvas.size.width": 1920,
      "card.cornerRadius": 0.055,
      "card.curveRadius": 10,
      "card.height": 1.5,
      "card.width": 2.7,
      "depth.focusFalloff": 0.36,
      "depth.focusFloor": 0.58,
      "depth.minScale": 0.89,
      "depth.scaleFalloff": 0.43,
      "depth.tiltDegrees": 4.01,
      "export.image.format": "png",
      "export.image.resolution": "4k",
      "export.includeBackground": true,
      "interaction.invertDirection": false,
      "interaction.parallax": 0.36,
      "interaction.pressDepth": 0.38,
      "interaction.pressShrink": 0.095,
      "layout.mode": "spiral",
      "physics.dragSpeed": 2.5,
      "physics.flexResponse": 1.35,
      "physics.flexStrength": 0.29,
      "physics.inertia": 0.02,
      "physics.keyStep": 120,
      "physics.snapStrength": 0,
      "physics.wheelSpeed": 1,
      "shadow.blur": 0.31,
      "shadow.color": { hex: "#000000", opacity: 15 },
      "shadow.offset": { x: "0.03", y: "0.12" },
      "source.images": null,
      "spiral.depth": 1.75,
      "spiral.depthOffset": -0.2,
      "spiral.radius": 2.8,
      "spiral.repetitions": 3,
      "spiral.taper": 0.04,
      "spiral.twistDegrees": 20.4,
      "spiral.verticalGap": 0.35,
      "stack.backTiltDegrees": 0,
      "stack.depthStep": 1.4,
      "stack.fallDistance": 0.6,
      "stack.fallTiltDegrees": 74,
      "stack.gap": 0.22,
      "stack.scrollWeight": 1,
      "view.cameraDistance": 8.6,
      "view.perspective": 33,
      "view.portraitScale": 0.82,
      "view.sceneOffset": 0,
    });
    expect(appSchema.canvas).toMatchObject({
      renderScale: { defaultValue: 2 },
      size: { height: 1080, width: 1920 },
    });
    const spiralSection = sections.find((section) => section.title === "Flow");
    const stackSection = sections.find((section) => section.title === "Deck");
    expect(spiralSection?.visibleWhen).toEqual({
      equals: "spiral",
      target: "layout.mode",
    });
    expect(stackSection?.visibleWhen).toEqual({
      equals: "stack",
      target: "layout.mode",
    });
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appSchema.panels.controls?.title).toBe("Spatial Gallery");
    const panelActions = sections
      .flatMap((section) => Object.values(section.controls))
      .find((control) => control.type === "panelActions");
    expect(panelActions).toMatchObject({
      actions: [
        { label: "Export PNG", value: "export.png" },
        { label: "Export Code", value: "export.code" },
      ],
    });
    expect(appSchema.persistence).toMatchObject({
      key: "toolcraft:spatial-gallery:state:v9",
      storage: "localStorage",
      version: 9,
    });
    expect(appSchema.media.defaultAssets).toHaveLength(14);
    expect(
      appSchema.media.defaultAssets.map((asset) => [
        "dataUrl" in asset ? asset.dataUrl : undefined,
        asset.fileName,
      ]),
    ).toEqual([
      [
        "/gallery-presets/woman-white-eyeliner-yellow-jacket.jpg",
        "Woman with White Eyeliner and Yellow Jacket.jpg",
      ],
      [
        "/gallery-presets/white-suv-desert.jpg",
        "White SUV Desert Photo.jpg",
      ],
      [
        "/gallery-presets/aerial-mountain-range.jpg",
        "Aerial Mountain Range.jpg",
      ],
      [
        "/gallery-presets/blue-ice-cave.jpg",
        "Blue Ice Cave.jpg",
      ],
      [
        "/gallery-presets/pink-white-background.jpg",
        "Pink White Background Image.jpg",
      ],
      ["/gallery-presets/desert-dune.jpg", "Desert Dune.jpg"],
      [
        "/gallery-presets/modern-high-rise-buildings.jpg",
        "Modern High-Rise Buildings.jpg",
      ],
      [
        "/gallery-presets/blue-pink-light.jpg",
        "Blue Pink Light Illustration.jpg",
      ],
      [
        "/gallery-presets/snow-capped-mountain.jpg",
        "Snow-capped Mountain.jpg",
      ],
      ["/gallery-presets/turquoise-ocean.jpg", "Turquoise Ocean.jpg"],
      [
        "/gallery-presets/geometric-facade-london.jpg",
        "Geometric Facade London.jpg",
      ],
      [
        "/gallery-presets/abstract-red-orange.jpg",
        "Abstract Red Orange Background.jpg",
      ],
      [
        "/gallery-presets/modern-architecture.jpg",
        "Modern Architecture.jpg",
      ],
      [
        "/gallery-presets/blue-pink-background.jpg",
        "Blue Pink Background Wallpaper.jpg",
      ],
    ]);
    expect(
      appSchema.media.defaultAssets.every(
        (asset) =>
          asset.assetKind === "image" &&
          asset.mimeType === "image/jpeg" &&
          asset.sourceTarget === "source.images",
      ),
    ).toBe(true);
    expect(appProductReadiness).toMatchObject({
      mode: "product",
      productName: "Spatial Gallery",
      viewInteraction: { mode: "fixed-camera" },
    });
    expect(appTransferMode).toMatchObject({
      mode: "new-toolcraft-app",
    });
    const state = {
      canvas: { size: { height: 1080, width: 1920 } },
      mediaAssets: [
        {
          assetKind: "image",
          dataUrl: "data:image/png;base64,AA==",
          id: "image-a",
          name: "image-a.png",
          sourceTarget: "source.images",
          transform: {
            flipHorizontal: true,
            flipVertical: false,
            rotationDeg: 90,
          },
        },
        {
          assetKind: "image",
          dataUrl: "data:image/png;base64,BB==",
          id: "ignored-image",
          name: "ignored.png",
          sourceTarget: "unrelated.source",
        },
      ],
      values: {
        "card.curveRadius": 2.4,
        "interaction.parallax": 0.18,
        "physics.flexStrength": 0.31,
        "shadow.blur": 0.5,
        "shadow.color": { hex: "#FF0000", opacity: 50 },
        "shadow.offset": { x: "0.40", y: "-0.20" },
        "spiral.radius": 4.2,
        "spiral.repetitions": 5,
      },
    } as unknown as ToolcraftState;
    const settings = readSpiralGallerySettings(state);
    expect(settings.spiral).toMatchObject({ radius: 4.2, repetitions: 5 });
    expect(settings.card.curveRadius).toBe(2.4);
    expect(settings.shadow).toMatchObject({
      blur: 0.5,
      colorHex: "#ff0000",
      offsetX: 0.4,
      offsetY: -0.2,
      opacity: 0.5,
    });
    expect(settings.shadow.colorRgb[0]).toBeCloseTo(1);
    expect(settings.shadow.colorRgb[1]).toBeCloseTo(0);
    expect(settings.shadow.colorRgb[2]).toBeCloseTo(0);
    expect(readSpiralGallerySettings({
      ...state,
      values: {},
    } as unknown as ToolcraftState).shadow).toMatchObject({
      blur: 0.31,
      colorHex: "#000000",
      offsetX: 0.03,
      offsetY: 0.12,
      opacity: 0.15,
    });
    expect(settings.physics.flexStrength).toBe(0.31);
    expect(settings.interaction.parallax).toBe(0.18);
    expect(settings.layout.mode).toBe("spiral");
    const stackState = {
      ...state,
      values: {
        ...state.values,
        "layout.mode": "stack",
        "stack.backTiltDegrees": 18,
        "stack.depthStep": 0.9,
        "stack.fallDistance": 2.2,
        "stack.fallTiltDegrees": 90,
        "stack.gap": 0.31,
        "stack.scrollWeight": 0.8,
      },
    } as unknown as ToolcraftState;
    const stackSettings = readSpiralGallerySettings(stackState);
    expect(stackSettings.layout.mode).toBe("stack");
    expect(stackSettings.stack).toMatchObject({
      depthStep: 0.9,
      fallDistance: 2.2,
      gap: 0.31,
      scrollWeight: 0.8,
    });
    expect(readSpiralGallerySettings(state).stack.scrollWeight).toBe(1);
    expect(stackSettings.stack.backTiltRadians).toBeCloseTo((18 * Math.PI) / 180);
    expect(stackSettings.stack.fallTiltRadians).toBeCloseTo((90 * Math.PI) / 180);
    const legacyBlindsState = {
      ...state,
      values: { ...state.values, "layout.mode": "blinds" },
    } as unknown as ToolcraftState;
    expect(readSpiralGallerySettings(legacyBlindsState).layout.mode).toBe(
      "spiral",
    );
    expect(selectSpiralGalleryImages(state).map((asset) => asset.id)).toEqual([
      "image-a",
    ]);

    expect(appAcceptance.every((row) => row.automatedTestName === automatedTestName)).toBe(
      true,
    );
    expect([
      spiralGalleryPipelineRegistration.getPass("spiral.webgl-resource").id,
      spiralGalleryPipelineRegistration.getPass("spiral.preview").id,
      spiralGalleryPipelineRegistration.getPass("spiral.export").id,
    ]).toEqual(["spiral.webgl-resource", "spiral.preview", "spiral.export"]);
    expect(appPerformance.workloadEnvelope.dimensions).toHaveLength(1);
    expect(appPerformance.workloadEnvelope.dimensions[0]).toMatchObject({
      id: "repetition-count",
      interactiveMax: 8,
    });
  });
});

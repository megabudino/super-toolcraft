import { describe, expect, it } from "vitest";

import type { ToolcraftImageAsset } from "@/toolcraft/runtime";

import { appComposition } from "./app-composition";
import { appSchema } from "./app-schema";
import {
  createStudioRoomPreviewMediaMessage,
  createStudioRoomPreviewReadyRequestMessage,
  createStudioRoomPreviewSaveSettingsMessage,
  createStudioRoomPreviewSettingsMessage,
  isStudioRoomPreviewReadyMessage,
  isStudioRoomPreviewSaveResultMessage,
  isStudioRoomPreviewSettingsMessage,
  STUDIO_ROOM_PREVIEW_DEFAULTS,
  STUDIO_ROOM_PREVIEW_VERSION,
} from "./studio-room-preview-protocol";
import { studioRoomPreviewPipelineRegistration } from "./studio-room-preview-pipeline";
import {
  createStudioRoomSettingsFromValues,
  createStudioRoomTileImagesFromMediaAssets,
  studioRoomTargets,
} from "./studio-room-values";

describe("Recraft Studio Room Toolcraft product", () => {
  it("publishes every room control section without website Apply", () => {
    expect(appSchema.panels.controls?.sections.map((section) => section.title)).toEqual([
      "Setup",
      "Room",
      "Inner Grid",
      "Center Composition",
      "Main Grid",
      "Fine Grid",
      "Tiles",
      "Tile Images",
      "Motion",
      "Depth Trail",
    ]);
    const actions = appSchema.panels.controls?.sections.find(
      (section) => section.id === "runtime.export",
    )?.controls.footer;
    expect(actions).toBeUndefined();
    const roomControls = appSchema.panels.controls?.sections.find(
      (section) => section.id === "room",
    )?.controls;
    expect(Object.keys(roomControls ?? {})).toEqual([
      "depth",
      "vanishing",
      "wallFill",
      "borderColor",
      "borderWidth",
    ]);
    expect(roomControls).toMatchObject({
      wallFill: {
        defaultValue: "#F0F4E2",
        label: "Wall fill",
        target: studioRoomTargets.roomWallFill,
        type: "color",
      },
      borderColor: {
        applicability: { mode: "always" },
        defaultValue: { hex: "#6F7946", opacity: 34 },
        label: "Border color",
        orderRole: "color",
        performanceRole: "responsiveness",
        target: studioRoomTargets.roomWallBorderColorOpacity,
        type: "colorOpacity",
      },
      borderWidth: {
        applicability: { mode: "always" },
        defaultValue: 1.3,
        max: 12,
        min: 0,
        orderRole: "strength",
        sliderValueKind: "continuous",
        step: 0.5,
        target: studioRoomTargets.roomWallBorderWidth,
        type: "slider",
        unit: "px",
      },
      depth: { orderRole: "primary", target: studioRoomTargets.roomDepth },
    });
    const innerGridControls = appSchema.panels.controls?.sections.find(
      (section) => section.id === "inner-grid",
    )?.controls;
    expect(Object.keys(innerGridControls ?? {})).toEqual([
      "enabled",
      "depth",
      "falloff",
      "opacity",
    ]);
    expect(innerGridControls).toMatchObject({
      enabled: {
        defaultValue: false,
        orderRole: "mode",
        target: studioRoomTargets.roomInnerGridEnabled,
        type: "switch",
      },
      depth: {
        applicability: {
          all: [{ equals: true, target: studioRoomTargets.roomInnerGridEnabled }],
          mode: "conditional",
        },
        defaultValue: 22,
        max: 60,
        min: 5,
        orderRole: "strength",
        target: studioRoomTargets.roomInnerGridDepth,
        unit: "%",
      },
      falloff: {
        defaultValue: 1.6,
        max: 4,
        min: 0.5,
        orderRole: "strength",
        step: 0.1,
        target: studioRoomTargets.roomInnerGridFalloff,
      },
      opacity: {
        defaultValue: 40,
        max: 100,
        min: 0,
        orderRole: "strength",
        target: studioRoomTargets.roomInnerGridOpacity,
        unit: "%",
      },
    });
    const compositionControls = appSchema.panels.controls?.sections.find(
      (section) => section.id === "center-composition",
    )?.controls;
    expect(compositionControls).toMatchObject({
      firstRowScale: {
        defaultValue: 100,
        max: 150,
        min: 50,
        target: studioRoomTargets.compositionFirstRowScale,
      },
      secondRowScale: {
        defaultValue: 100,
        max: 150,
        min: 50,
        target: studioRoomTargets.compositionSecondRowScale,
      },
      lineGap: {
        defaultValue: -12,
        max: 80,
        min: -40,
        target: studioRoomTargets.compositionLineGap,
      },
      buttonGap: {
        defaultValue: 6,
        max: 160,
        min: 0,
        target: studioRoomTargets.compositionButtonGap,
      },
    });
    const tileControls = appSchema.panels.controls?.sections.find(
      (section) => section.id === "tiles",
    )?.controls;
    expect(tileControls?.perSurface).toMatchObject({
      description:
        "Tiles never share edges, so high densities may place fewer when the grid is small.",
      max: 6,
      target: studioRoomTargets.tilesPerSurface,
      type: "slider",
    });
    const tileImagesControl = appSchema.panels.controls?.sections.find(
      (section) => section.id === "tile-images",
    )?.controls.images;
    expect(tileImagesControl).toBeDefined();
    expect(tileImagesControl).not.toHaveProperty("hardMaxItems");
    expect(tileImagesControl).not.toHaveProperty("recommendedMaxItems");
    expect(appComposition.onPanelAction).toBeUndefined();
  });

  it("uses strict v6 settings, ready, media, and save envelopes", () => {
    expect(STUDIO_ROOM_PREVIEW_VERSION).toBe(6);
    const settings = createStudioRoomPreviewSettingsMessage(STUDIO_ROOM_PREVIEW_DEFAULTS);
    expect(isStudioRoomPreviewSettingsMessage(settings)).toBe(true);
    expect(isStudioRoomPreviewSettingsMessage({ ...settings, extra: true })).toBe(false);
    expect(
      isStudioRoomPreviewSettingsMessage({
        ...settings,
        payload: { ...settings.payload, tiles: { ...settings.payload.tiles, extra: true } },
      }),
    ).toBe(false);
    expect(createStudioRoomPreviewReadyRequestMessage()).toEqual({
      channel: "recraft.studio-room",
      type: "ready-request",
      version: 6,
    });
    expect(
      isStudioRoomPreviewReadyMessage({
        channel: "recraft.studio-room",
        type: "ready",
        version: 6,
      }),
    ).toBe(true);
    const image = {
      blob: new Blob(["tile"], { type: "image/png" }),
      id: "tile",
      mimeType: "image/png",
      ref: "ref",
    };
    expect(createStudioRoomPreviewMediaMessage([image])).toEqual({
      channel: "recraft.studio-room",
      images: [image],
      type: "media",
      version: 6,
    });
    expect(
      createStudioRoomPreviewSaveSettingsMessage({
        intent: "apply",
        payload: STUDIO_ROOM_PREVIEW_DEFAULTS,
        requestId: "request-1",
      }),
    ).toMatchObject({ intent: "apply", requestId: "request-1", type: "save-settings", version: 6 });
    expect(
      isStudioRoomPreviewSaveResultMessage({
        channel: "recraft.studio-room",
        ok: true,
        requestId: "request-1",
        type: "save-result",
        version: 6,
      }),
    ).toBe(true);
    expect(isStudioRoomPreviewSettingsMessage({ ...settings, version: 2 })).toBe(false);
    expect(
      isStudioRoomPreviewSettingsMessage({
        ...settings,
        payload: { ...settings.payload, room: { ...settings.payload.room, wallBorder: {} } },
      }),
    ).toBe(false);
    expect(
      isStudioRoomPreviewSettingsMessage({
        ...settings,
        payload: {
          ...settings.payload,
          room: {
            ...settings.payload.room,
            innerGrid: { ...settings.payload.room.innerGrid, extra: true },
          },
        },
      }),
    ).toBe(false);
  });

  it("invalidates one representative from every section and media", () => {
    expect(studioRoomPreviewPipelineRegistration.runtimeId).toBe("studio-room-external-preview-v6");
    expect(studioRoomPreviewPipelineRegistration.getPass("media-sync")).toBeDefined();
    const targets = studioRoomPreviewPipelineRegistration.interactionInvalidation.flatMap(
      (entry) => entry.targets,
    );
    expect(targets).toEqual(
      expect.arrayContaining([
        studioRoomTargets.roomDepth,
        studioRoomTargets.roomInnerGridEnabled,
        studioRoomTargets.roomInnerGridDepth,
        studioRoomTargets.roomInnerGridFalloff,
        studioRoomTargets.roomInnerGridOpacity,
        studioRoomTargets.compositionFirstRowScale,
        studioRoomTargets.roomWallFill,
        studioRoomTargets.roomWallBorderWidth,
        studioRoomTargets.roomWallBorderColorOpacity,
        studioRoomTargets.gridColumns,
        studioRoomTargets.fineGridOpacity,
        studioRoomTargets.tilesShuffleStyle,
        studioRoomTargets.tilesImages,
        studioRoomTargets.motionParallax,
        studioRoomTargets.trailStrength,
      ]),
    );
  });

  it("builds a v6 payload from non-default controls and ordered transformed media", () => {
    const mediaAssets: ToolcraftImageAsset[] = [
      {
        assetKind: "image",
        fileName: "second.png",
        id: "tile-second",
        layerId: "layer-second",
        lifecycle: "ready",
        mimeType: "image/png",
        position: { x: 0, y: 0 },
        resourceRef: "tile-ref-second",
        size: { height: 900, unit: "px", width: 1200 },
        sourceTarget: studioRoomTargets.tilesImages,
        transform: { flipHorizontal: true, flipVertical: false, rotationDeg: 90 },
      },
      {
        assetKind: "image",
        fileName: "first.png",
        id: "tile-first",
        layerId: "layer-first",
        lifecycle: "ready",
        mimeType: "image/png",
        position: { x: 0, y: 0 },
        resourceRef: "tile-ref-first",
        size: { height: 800, unit: "px", width: 600 },
        sourceTarget: studioRoomTargets.tilesImages,
        transform: { flipHorizontal: false, flipVertical: true, rotationDeg: 270 },
      },
    ];
    const images = createStudioRoomTileImagesFromMediaAssets(mediaAssets);
    const settings = createStudioRoomSettingsFromValues(
      {
        [studioRoomTargets.compositionButtonGap]: 72,
        [studioRoomTargets.compositionFirstRowScale]: 84,
        [studioRoomTargets.compositionLineGap]: 8,
        [studioRoomTargets.compositionSecondRowScale]: 118,
        [studioRoomTargets.fineGridOpacity]: 55,
        [studioRoomTargets.gridColumns]: 12,
        [studioRoomTargets.motionParallax]: 125,
        [studioRoomTargets.roomDepth]: 0.8,
        [studioRoomTargets.roomInnerGridDepth]: 48,
        [studioRoomTargets.roomInnerGridEnabled]: true,
        [studioRoomTargets.roomInnerGridFalloff]: 2.4,
        [studioRoomTargets.roomInnerGridOpacity]: 72,
        [studioRoomTargets.roomWallFill]: "#123abc",
        [studioRoomTargets.roomWallBorderColorOpacity]: { hex: "#abc123", opacity: 65 },
        [studioRoomTargets.roomWallBorderWidth]: 4.5,
        [studioRoomTargets.tilesPerSurface]: 12,
        [studioRoomTargets.tilesShuffleStyle]: "slide",
        [studioRoomTargets.trailFade]: 1.2,
      },
      1440,
      images,
    );

    const message = createStudioRoomPreviewSettingsMessage(settings);

    expect(message.payload.composition).toEqual({
      buttonGap: 72,
      firstRowScale: 84,
      lineGap: 8,
      secondRowScale: 118,
    });
    expect(message.payload.room.depth).toBe(0.8);
    expect(message.payload.room.innerGrid).toEqual({
      depth: 48,
      enabled: true,
      falloff: 2.4,
      opacity: 72,
    });
    expect(message.payload.room.wallFill).toBe("#123ABC");
    expect(message.payload.room.wallBorder).toEqual({
      colorOpacity: { hex: "#ABC123", opacity: 65 },
      width: 4.5,
    });
    expect(message.payload.grid.columns).toBe(12);
    expect(message.payload.fineGrid.opacity).toBe(55);
    expect(message.payload.tiles.shuffleStyle).toBe("slide");
    expect(message.payload.tiles.perSurface).toBe(6);
    expect(message.payload.tiles.images).toEqual([
      expect.objectContaining({
        id: "tile-second",
        order: 0,
        ref: "tile-ref-second",
        transform: { flipHorizontal: true, flipVertical: false, rotationDeg: 90 },
      }),
      expect.objectContaining({
        id: "tile-first",
        order: 1,
        ref: "tile-ref-first",
        transform: { flipHorizontal: false, flipVertical: true, rotationDeg: 270 },
      }),
    ]);
    expect(message.payload.motion.parallax).toBe(125);
    expect(message.payload.trail.fade).toBe(1.2);
  });

  it("preserves more than 12 ordered Tile Images through the preview protocol", () => {
    const mediaAssets: ToolcraftImageAsset[] = Array.from({ length: 20 }, (_, index) => ({
      assetKind: "image",
      fileName: `tile-${index}.png`,
      id: `tile-${index}`,
      layerId: `layer-${index}`,
      lifecycle: "ready",
      mimeType: "image/png",
      position: { x: 0, y: 0 },
      resourceRef: `tile-ref-${index}`,
      size: { height: 800, unit: "px", width: 1200 },
      sourceTarget: studioRoomTargets.tilesImages,
      transform: { flipHorizontal: false, flipVertical: false, rotationDeg: 0 },
    }));
    const images = createStudioRoomTileImagesFromMediaAssets(mediaAssets);
    const settings = createStudioRoomSettingsFromValues({}, 1080, images);
    const message = createStudioRoomPreviewSettingsMessage(settings);

    expect(images).toHaveLength(20);
    expect(message.payload.tiles.images.map((image) => image.order)).toEqual(
      Array.from({ length: 20 }, (_, index) => index),
    );
    expect(isStudioRoomPreviewSettingsMessage(message)).toBe(true);
  });
});

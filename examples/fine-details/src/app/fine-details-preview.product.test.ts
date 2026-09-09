import { describe, expect, it } from "vitest";

import { validateProductAcceptanceCoverage } from "./app-acceptance";
import { appComposition } from "./app-composition";
import { appSchema } from "./app-schema";
import {
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE,
} from "./fine-details-prompt-flight-command-contract";
import {
  createFineDetailsPreviewMediaMessage,
  createFineDetailsPreviewPromptFlightCommandMessage,
  createFineDetailsPreviewPointerMessage,
  createFineDetailsPreviewReadyRequestMessage,
  createFineDetailsPreviewSettingsMessage,
  isFineDetailsPreviewReadyMessage,
  FINE_DETAILS_PREVIEW_DEFAULTS,
  FINE_DETAILS_PREVIEW_VERSION,
} from "./fine-details-preview-protocol";
import { createFineDetailsTrailFromValues } from "./fine-details-trail-values";

describe("Recraft Fine Details Toolcraft product", () => {
  it("publishes the editable section canvas with local Reset", () => {
    expect(appSchema.canvas.size).toEqual({
      height: 1080,
      unit: "px",
      width: 1920,
    });
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.upload).toBe(false);
    expect(appSchema.panels.controls?.sections.map((section) => section.title)).toEqual([
      "Setup",
      "Background",
      "Carousel",
      "Carousel Border",
      "Carousel Shadow",
      "Loading Wave",
      "Wave Motion",
      "Trail Images",
      "Trail",
      "Trail Motion",
      "Trail Border",
      "Trail Shadow",
      "Upper Left Typography",
      "Lower Right Typography",
      "Prompt",
      "Prompt Flight",
      "Prompt Ghosts",
      "Playback",
      "Prompt Shadow",
      "Prompt Typing",
      "Export",
    ]);

    const websiteSection = appSchema.panels.controls?.sections.find(
      (section) => section.id === "runtime.export",
    );
    expect(websiteSection?.controls.footer).toMatchObject({
      actions: [
        { label: "Reset", value: "website.reset", variant: "outline" },
      ],
      target: "website.settings",
      type: "panelActions",
    });
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appComposition.canvasContent).toBeDefined();
    expect(appComposition.onPanelAction).toBeDefined();
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });

  it("keeps the trail image collection unbounded by product code", () => {
    const trailImagesControl = appSchema.panels.controls?.sections.find(
      (section) => section.id === "trail-images",
    )?.controls.images;
    expect(trailImagesControl).toBeDefined();
    expect(trailImagesControl).not.toHaveProperty("hardMaxItems");

    const images = Array.from({ length: 32 }, (_, index) => ({
      height: 1200,
      id: `trail-${index}`,
      ref: `trail-ref-${index}`,
      transform: {
        flipHorizontal: false,
        flipVertical: false,
        rotationDeg: 0 as const,
      },
      width: 800,
    }));

    expect(createFineDetailsTrailFromValues({}, images).images).toEqual(images);
    expect(
      createFineDetailsPreviewMediaMessage(
        images.map((image) => ({
          blob: new Blob([image.id], { type: "image/png" }),
          id: image.id,
          mimeType: "image/png",
          ref: image.ref,
        })),
      ).images,
    ).toHaveLength(32);
  });

  it("sends the canvas height through the versioned website bridge", () => {
    expect(FINE_DETAILS_PREVIEW_VERSION).toBe(17);
    expect(FINE_DETAILS_PREVIEW_DEFAULTS).toEqual({
      background: "#F2F2F2",
      carousel: {
        border: {
          colorOpacity: { hex: "#FFFFFF", opacity: 100 },
          enabled: false,
          width: 2,
        },
        count: 4,
        gap: 24,
        radius: 12,
        shadow: {
          blur: 40,
          colorOpacity: { hex: "#000000", opacity: 35 },
          enabled: false,
          offset: { x: 0, y: 0.125 },
          spread: 0,
        },
        speed: 60,
        textGap: 24,
      },
      gridOpacity: 80,
      gridSize: 50,
      height: 1080,
      imagesMode: "trail",
      loading: {
        angle: 45,
        baseTone: 85,
        border: { colorOpacity: { hex: "#000000", opacity: 12 }, width: 1 },
        cell: 20,
        contrast: 14,
        desync: 12,
        distort: 6,
        enabled: true,
        glare: 55,
        passTime: 1600,
        pause: 300,
        softness: 60,
        stagger: 180,
        waveWidth: 45,
      },
      prompt: {
        flight: {
          bounce: 12,
          enabled: true,
          flightTime: 550,
          ghostFalloff: 8,
          ghostOpacity: 55,
          ghostSpacing: 56,
          ghosts: true,
          offset: { x: 0, y: 0 },
          startDelay: 150,
          vanishStagger: 70,
          vanishTime: 260,
        },
        position: { x: 0, y: -0.06 },
        shadow: {
          blur: 33,
          colorOpacity: { hex: "#000000", opacity: 35 },
          enabled: true,
          offset: { x: 0, y: 0.48 },
          spread: 5,
        },
        typing: {
          deleteSpeed: 30,
          deleteStyle: "backspace",
          enabled: false,
          gap: 0.6,
          hold: 1.8,
          humanize: 0.6,
          phrases: [
            "Create a surreal fashion campaign set in a blooming desert.",
            "Design a playful 3D mascot for a futuristic coffee brand.",
            "Generate a cinematic portrait lit by neon signs at night.",
            "Illustrate a cozy glass house hidden deep in the forest.",
            "Create a bold poster for an experimental music festival.",
            "Design a minimal perfume bottle inspired by ocean waves.",
          ],
          typeSpeed: 12,
        },
      },
      trail: {
        border: { color: "#FFFFFF", enabled: true, width: 2 },
        cardRadius: 14,
        cardSize: 180,
        enabled: true,
        fadeIn: 150,
        fadeOut: 200,
        images: [],
        length: 8,
        lifetime: 600,
        resumeDelay: 300,
        resumeRamp: 500,
        shadow: {
          blur: 40,
          colorOpacity: { hex: "#000000", opacity: 35 },
          enabled: true,
          offset: { x: 0, y: 0.125 },
          spread: 0,
        },
        sizeFalloff: 8,
        smoothness: 200,
        spacing: 64,
        tilt: 8,
      },
      typography: {
        lowerRight: {
          bodyFontSize: 24,
          bottom: 96,
          gap: 8,
          headingFontSize: 88,
          right: 96,
        },
        upperLeft: { fontSize: 120, left: 96, top: 96 },
      },
    });
    expect(createFineDetailsPreviewSettingsMessage(FINE_DETAILS_PREVIEW_DEFAULTS)).toEqual({
      channel: "recraft.fine-details",
      payload: FINE_DETAILS_PREVIEW_DEFAULTS,
      type: "settings",
      version: 17,
    });
    expect(
      isFineDetailsPreviewReadyMessage({
        channel: "recraft.fine-details",
        type: "ready",
        version: 17,
      }),
    ).toBe(true);
    expect(
      isFineDetailsPreviewReadyMessage({
        channel: "recraft.fine-details",
        type: "ready",
        version: 6,
      }),
    ).toBe(false);

    expect(createFineDetailsPreviewPointerMessage({ active: true, x: 960, y: 540 })).toEqual({
      channel: "recraft.fine-details",
      payload: { active: true, x: 960, y: 540 },
      type: "pointer",
      version: 17,
    });
    expect(createFineDetailsPreviewReadyRequestMessage()).toEqual({
      channel: "recraft.fine-details",
      type: "ready-request",
      version: 17,
    });
    const image = {
      blob: new Blob(["trail"], { type: "image/png" }),
      id: "trail-image",
      mimeType: "image/png",
      ref: "trail-ref",
    };
    expect(createFineDetailsPreviewMediaMessage([image])).toEqual({
      channel: "recraft.fine-details",
      images: [image],
      type: "media",
      version: 17,
    });
  });

  it("creates one-shot Prompt Flight commands without changing settings", () => {
    expect(
      createFineDetailsPreviewPromptFlightCommandMessage(
        FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.command,
        "nonce-1",
      ),
    ).toEqual({
      channel: "recraft.fine-details",
      command: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.command,
      nonce: "nonce-1",
      type: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE,
      version: 17,
    });
    expect(
      createFineDetailsPreviewPromptFlightCommandMessage(
        FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.reset.command,
        "nonce-2",
      ),
    ).toEqual({
      channel: "recraft.fine-details",
      command: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.reset.command,
      nonce: "nonce-2",
      type: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE,
      version: 17,
    });
  });

  it("publishes a live 0–100 px trail card radius control", () => {
    const trailSection = appSchema.panels.controls?.sections.find(
      (section) => section.id === "trail",
    );

    expect(trailSection?.controls.cardRadius).toMatchObject({
      defaultValue: 14,
      label: "Card radius",
      max: 100,
      min: 0,
      step: 1,
      target: "trail.cardRadius",
      type: "slider",
      unit: "px",
    });
    expect(createFineDetailsTrailFromValues({ "trail.cardRadius": 140 }).cardRadius).toBe(100);
    expect(createFineDetailsTrailFromValues({}).cardRadius).toBe(14);
  });

  it("publishes conditional trail border controls", () => {
    const borderSection = appSchema.panels.controls?.sections.find(
      (section) => section.id === "trail-border",
    );

    expect(borderSection?.controls.borderEnabled).toMatchObject({
      defaultValue: true,
      label: "Border",
      target: "trail.border.enabled",
      type: "switch",
    });
    expect(borderSection?.controls.borderWidth).toMatchObject({
      defaultValue: 2,
      label: "Border width",
      max: 20,
      min: 1,
      step: 1,
      target: "trail.border.width",
      type: "slider",
      unit: "px",
    });
    expect(borderSection?.controls.borderColor).toMatchObject({
      defaultValue: "#FFFFFF",
      label: "Border color",
      target: "trail.border.color",
      type: "color",
    });
    expect(
      createFineDetailsTrailFromValues({
        "trail.border.color": "#00FF88",
        "trail.border.enabled": true,
        "trail.border.width": 40,
      }).border,
    ).toEqual({ color: "#00FF88", enabled: true, width: 20 });
    expect(createFineDetailsTrailFromValues({}).border).toEqual({
      color: "#FFFFFF",
      enabled: true,
      width: 2,
    });
  });

  it("infinity mode keeps the external preview on its exact scene bounds", () => {
    expect(appComposition.sceneBoundsProvider).toBeDefined();
  });
});

import { describe, expect, it } from "vitest";

import {
  createToolcraftState,
  toolcraftReducer,
} from "@/toolcraft/runtime";

import {
  appAcceptance,
  appProductReadiness,
  appTransferMode,
  getToolcraftControlOrderTargets,
  validateToolcraftAcceptanceCoverage,
} from "./app-acceptance";
import { appComposition } from "./app-composition";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import { getDotRingSceneBounds } from "./dot-ring-scene-bounds";
import { getDotRingSettingsFromState } from "./dot-ring-settings";

describe("Dot Ring Studio schema", () => {
  it("publishes the product and infinity-canvas contracts", () => {
    expect(appProductReadiness.mode).toBe("product");
    if (appProductReadiness.mode !== "product") {
      throw new Error("Dot Ring Studio must declare product readiness.");
    }

    expect(appProductReadiness.productName).toBe("Dot Ring Studio");
    expect(appTransferMode.animationIntent).toEqual({
      loopDuration: {
        evidence:
          "The existing Dot Ring Studio playback timeline and export tests use one deterministic 12-second waveform cycle.",
        seconds: 12,
        source: "product-derived",
      },
      mode: "timeline-playback",
    });
    expect(appSchema.canvas.sizing).toEqual({
      defaultMode: "infinite",
      mode: "editable-output",
    });
    expect(createToolcraftState(appSchema).canvas.mode).toBe("infinite");
    const finiteState = toolcraftReducer(createToolcraftState(appSchema), {
      target: "canvas.infinity",
      type: "controls.setValue",
      value: false,
    });
    expect(
      toolcraftReducer(finiteState, { type: "controls.reset" }).canvas.mode,
    ).toBe("infinite");
    expect(appSchema.canvas.renderScale).toEqual({
      defaultValue: 2,
      enabled: true,
      max: 2,
      min: 1,
      step: 0.25,
    });
    expect(appSchema.panels.timeline).toEqual({
      defaultDurationSeconds: 12,
      enabled: true,
      mode: "playback",
    });
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appComposition.sceneBoundsProvider).toBe(getDotRingSceneBounds);
    expect(appSchema.persistence.storage).toBe("localStorage");
    expect(appSchema.settingsTransfer.mode).toBe("auto");
  });

  it("keeps product controls in workflow order", () => {
    expect(getToolcraftControlOrderTargets(appSchema)).toEqual(
      expect.arrayContaining([
        "audio.source",
        "export.includeBackground",
        "appearance.background",
        "ring.radius",
        "ring.density",
        "ring.rows",
        "export.image.format",
        "export.image.resolution",
        "export.video.format",
        "export.video.resolution",
      ]),
    );
  });

  it("uses the starter fileDrop for source audio", () => {
    const audioControl = appSchema.panels.controls?.sections
      .flatMap((section) => Object.values(section.controls))
      .find((control) => control.target === "audio.source");

    expect(audioControl).toMatchObject({
      accept: "audio/*,.aac,.aif,.aiff,.flac,.m4a,.mp3,.ogg,.wav,.webm",
      assetKind: "file",
      defaultValue: null,
      multiple: false,
      type: "fileDrop",
    });
    expect(appComposition.controlRenderers).toBeUndefined();
  });

  it("defines standard image and video delivery actions", () => {
    const panelActions = appSchema.panels.controls?.sections
      .flatMap((section) => Object.values(section.controls))
      .find((control) => control.type === "panelActions");

    expect(panelActions?.target).toBe("actions.output");
    expect(
      panelActions?.actions?.map((action) =>
        typeof action === "string" ? action : action.value,
      ),
    ).toEqual(["export.video", "export.png"]);
  });

  it("validates acceptance and performance ownership", () => {
    expect(validateToolcraftAcceptanceCoverage(appSchema, appAcceptance)).toEqual(
      [],
    );
    expect(appPerformance.usesCustomRenderer).toBe(true);
    expect(appPerformance.rendererStrategy).toBe("canvas-2d");
    expect(appPerformance.workloadEnvelope.dimensions.map(({ id }) => id)).toEqual([
      "ring-density",
      "ring-rows",
      "image-long-edge",
      "video-long-edge",
    ]);
  });

  it("Dot Ring Studio product contract updates deterministic output", () => {
    expect(appSchema.canvas.size).toEqual({
      height: 1024,
      unit: "px",
      width: 1024,
    });
    expect(appComposition.renderDefaultCanvasMedia).toBe(false);
    expect(appComposition.sceneBoundsProvider).toBe(getDotRingSceneBounds);
  });

  it("uses the approved background for fresh and reset state", () => {
    const initial = createToolcraftState(appSchema);
    const changed = toolcraftReducer(initial, {
      target: "appearance.background",
      type: "controls.setValue",
      value: { hex: "#FFFFFF" },
    });
    const reset = toolcraftReducer(changed, { type: "controls.reset" });

    expect(getDotRingSettingsFromState(initial).background).toBe("#0C1A32");
    expect(getDotRingSettingsFromState(reset).background).toBe("#0C1A32");
  });
});

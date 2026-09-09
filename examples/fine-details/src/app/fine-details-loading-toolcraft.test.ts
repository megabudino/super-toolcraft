import { describe, expect, it } from "vitest";

import { appAcceptance, appControlSectionInventory } from "./app-acceptance";
import { appProductReadiness } from "./app-acceptance-data";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import { fineDetailsCarouselTargets } from "./fine-details-carousel-values";
import {
  FINE_DETAILS_LOADING_DEFAULTS,
  fineDetailsLoadingTargets,
} from "./fine-details-loading-values";
import {
  createFineDetailsPreviewSettingsFromValues,
  FINE_DETAILS_PREVIEW_DEFAULTS,
  FINE_DETAILS_PREVIEW_VERSION,
} from "./fine-details-preview-protocol";

const loadingTargets = Object.values(fineDetailsLoadingTargets);
const surfaceSliderTargets = [
  fineDetailsLoadingTargets.cell,
  fineDetailsLoadingTargets.contrast,
  fineDetailsLoadingTargets.baseTone,
  fineDetailsLoadingTargets.glare,
  fineDetailsLoadingTargets.distort,
] as const;
const motionSliderTargets = [
  fineDetailsLoadingTargets.waveWidth,
  fineDetailsLoadingTargets.softness,
  fineDetailsLoadingTargets.angle,
  fineDetailsLoadingTargets.passTime,
  fineDetailsLoadingTargets.pause,
  fineDetailsLoadingTargets.stagger,
  fineDetailsLoadingTargets.desync,
] as const;
const loadingSliderTargets = [...surfaceSliderTargets, ...motionSliderTargets] as const;

function findSection(id: string) {
  return appSchema.panels.controls?.sections.find((candidate) => candidate.id === id);
}

describe("Fine Details loading wave Toolcraft contract", () => {
  it("publishes two workflow sections for one twelve-control entity", () => {
    const surface = findSection("loading-wave");
    const motion = findSection("loading-wave-motion");

    expect(surface?.title).toBe("Loading Wave");
    expect(motion?.title).toBe("Wave Motion");
    expect(Object.keys(surface?.controls ?? {})).toEqual([
      "enabled",
      "cell",
      "contrast",
      "baseTone",
      "glare",
      "distort",
      "borderWidth",
      "borderColorOpacity",
    ]);
    expect(Object.keys(motion?.controls ?? {})).toEqual([
      "waveWidth",
      "softness",
      "angle",
      "passTime",
      "pause",
      "stagger",
      "desync",
    ]);
    expect(
      Object.values(surface?.controls ?? {}).map((control) => control.orderRole),
    ).toEqual([
      "mode",
      "strength",
      "strength",
      "strength",
      "strength",
      "strength",
      "strength",
      undefined,
    ]);
    expect(
      Object.values(motion?.controls ?? {}).map((control) => control.orderRole),
    ).toEqual([
      "strength",
      "strength",
      "strength",
      "strength",
      "strength",
      "strength",
      "strength",
    ]);
    expect(
      [...Object.values(surface?.controls ?? {}), ...Object.values(motion?.controls ?? {})].every(
        (control) => typeof control.semanticGroup === "string",
      ),
    ).toBe(true);
  });

  it("gates the switch by Loading mode and every slider by the wave switch", () => {
    const loadingModeCondition = {
      equals: "loading",
      target: fineDetailsCarouselTargets.imagesMode,
    };

    for (const key of ["borderWidth", "borderColorOpacity"] as const) {
      expect(findSection("loading-wave")?.controls[key]).toMatchObject({
        applicability: { all: [loadingModeCondition], mode: "conditional" },
      });
    }

    expect(findSection("loading-wave")?.controls.enabled).toMatchObject({
      applicability: { all: [loadingModeCondition], mode: "conditional" },
      defaultValue: true,
      target: fineDetailsLoadingTargets.enabled,
      type: "switch",
    });
    for (const target of loadingSliderTargets) {
      const control = [
        ...Object.values(findSection("loading-wave")?.controls ?? {}),
        ...Object.values(findSection("loading-wave-motion")?.controls ?? {}),
      ].find((candidate) => candidate.target === target);
      expect(control).toMatchObject({
        applicability: {
          all: [
            loadingModeCondition,
            { equals: true, target: fineDetailsLoadingTargets.enabled },
          ],
          mode: "conditional",
        },
        performanceRole: "responsiveness",
        type: "slider",
      });
    }
  });

  it("publishes the mirrored slider domains", () => {
    const surface = findSection("loading-wave")?.controls;
    const motion = findSection("loading-wave-motion")?.controls;

    expect(surface?.cell).toMatchObject({ max: 64, min: 8, step: 1, unit: "px" });
    expect(surface?.contrast).toMatchObject({ max: 60, min: 0, step: 1, unit: "%" });
    expect(surface?.baseTone).toMatchObject({ max: 100, min: 0, step: 1, unit: "%" });
    expect(surface?.glare).toMatchObject({ max: 100, min: 0, step: 1, unit: "%" });
    expect(surface?.distort).toMatchObject({ max: 24, min: 0, step: 1, unit: "px" });
    expect(surface?.borderWidth).toMatchObject({ max: 8, min: 0, step: 0.5, unit: "px" });
    expect(surface?.borderColorOpacity).toMatchObject({
      defaultValue: { hex: "#000000", opacity: 12 },
      type: "colorOpacity",
    });
    expect(motion?.waveWidth).toMatchObject({ max: 100, min: 10, step: 1, unit: "%" });
    expect(motion?.softness).toMatchObject({ max: 100, min: 0, step: 1, unit: "%" });
    expect(motion?.angle).toMatchObject({ max: 360, min: 0, step: 5, unit: "deg" });
    expect(motion?.passTime).toMatchObject({ max: 4000, min: 600, step: 50, unit: "ms" });
    expect(motion?.pause).toMatchObject({ max: 2000, min: 0, step: 50, unit: "ms" });
    expect(motion?.stagger).toMatchObject({ max: 800, min: 0, step: 10, unit: "ms" });
    expect(motion?.desync).toMatchObject({ max: 50, min: 0, step: 1, unit: "%" });
    for (const [controls, key, defaultValue] of [
      [surface, "cell", FINE_DETAILS_LOADING_DEFAULTS.cell],
      [surface, "contrast", FINE_DETAILS_LOADING_DEFAULTS.contrast],
      [surface, "baseTone", FINE_DETAILS_LOADING_DEFAULTS.baseTone],
      [surface, "glare", FINE_DETAILS_LOADING_DEFAULTS.glare],
      [surface, "distort", FINE_DETAILS_LOADING_DEFAULTS.distort],
      [motion, "waveWidth", FINE_DETAILS_LOADING_DEFAULTS.waveWidth],
      [motion, "softness", FINE_DETAILS_LOADING_DEFAULTS.softness],
      [motion, "angle", FINE_DETAILS_LOADING_DEFAULTS.angle],
      [motion, "passTime", FINE_DETAILS_LOADING_DEFAULTS.passTime],
      [motion, "pause", FINE_DETAILS_LOADING_DEFAULTS.pause],
      [motion, "stagger", FINE_DETAILS_LOADING_DEFAULTS.stagger],
      [motion, "desync", FINE_DETAILS_LOADING_DEFAULTS.desync],
    ] as const) {
      expect(controls?.[key]).toMatchObject({ defaultValue });
    }
  });

  it("sends the loading group through the current protocol payload", () => {
    expect(FINE_DETAILS_PREVIEW_VERSION).toBe(17);
    expect(FINE_DETAILS_PREVIEW_DEFAULTS.loading).toEqual(
      FINE_DETAILS_LOADING_DEFAULTS,
    );
    expect(createFineDetailsPreviewSettingsFromValues({}, 1080).loading).toEqual(
      FINE_DETAILS_LOADING_DEFAULTS,
    );
  });

  it("registers the wave switch as control-change and the sliders as control-drag", () => {
    const { rendererPipeline } = appPerformance;
    if (!rendererPipeline) {
      throw new Error("Fine Details must declare its preview pipeline.");
    }

    const controlChange = rendererPipeline.interactionInvalidation.find(
      (entry) => entry.interaction === "control-change",
    );
    const controlDrag = rendererPipeline.interactionInvalidation.find(
      (entry) => entry.interaction === "control-drag",
    );
    expect(controlChange?.targets).toContain(fineDetailsLoadingTargets.enabled);
    expect(controlDrag?.targets).toEqual(
      expect.arrayContaining([...loadingSliderTargets]),
    );
    for (const target of loadingSliderTargets) {
      expect(controlChange?.targets).not.toContain(target);
    }
    expect(controlDrag?.targets).not.toContain(fineDetailsLoadingTargets.enabled);
  });

  it("registers the split Loading Wave inventory, owners, and acceptance rows", () => {
    const entries = appControlSectionInventory.filter(
      (entry) => entry.entityId === "fine-details-loading-wave",
    );
    expect(entries.map((entry) => entry.workflowStage)).toEqual(["surface", "motion"]);
    expect(entries.map((entry) => entry.title)).toEqual(["Loading Wave", "Wave Motion"]);
    expect(entries.every((entry) => typeof entry.splitReason === "string")).toBe(true);
    expect(entries.flatMap((entry) => entry.targets).sort()).toEqual(
      [...loadingTargets].sort(),
    );

    if (appProductReadiness.mode !== "product") {
      throw new Error("Fine Details must use product readiness.");
    }
    const owners = appProductReadiness.interactionOwnership.filter((entry) =>
      loadingTargets.includes(entry.target as (typeof loadingTargets)[number]),
    );
    expect(owners).toHaveLength(15);
    for (const owner of owners) {
      expect(owner).toMatchObject({
        capability: "property-edit",
        selectionScope: { mode: "global" },
        surface: "panel",
      });
    }

    for (const target of loadingTargets) {
      expect(appAcceptance.find((entry) => entry.id === target)).toMatchObject({
        automatedTestName: `${target} maps canonical state into the Fine Details preview payload`,
        browserTestName: `browser: ${target} changes the embedded Fine Details output`,
        evidence: "product-output",
        interactionId: `panel-${target.replaceAll(".", "-")}`,
        kind: "control",
        target,
      });
    }
  });
});

const acceptanceCases = [
  [fineDetailsLoadingTargets.enabled, false, { enabled: false }],
  [fineDetailsLoadingTargets.cell, 32, { cell: 32 }],
  [fineDetailsLoadingTargets.contrast, 40, { contrast: 40 }],
  [fineDetailsLoadingTargets.baseTone, 20, { baseTone: 20 }],
  [fineDetailsLoadingTargets.glare, 90, { glare: 90 }],
  [fineDetailsLoadingTargets.distort, 12, { distort: 12 }],
  [fineDetailsLoadingTargets.waveWidth, 80, { waveWidth: 80 }],
  [fineDetailsLoadingTargets.softness, 10, { softness: 10 }],
  [fineDetailsLoadingTargets.angle, 135, { angle: 135 }],
  [fineDetailsLoadingTargets.passTime, 2400, { passTime: 2400 }],
  [fineDetailsLoadingTargets.pause, 900, { pause: 900 }],
  [fineDetailsLoadingTargets.stagger, 320, { stagger: 320 }],
  [fineDetailsLoadingTargets.desync, 25, { desync: 25 }],
  [fineDetailsLoadingTargets.borderWidth, 3, { border: { width: 3 } }],
  [
    fineDetailsLoadingTargets.borderColorOpacity,
    { hex: "#112233", opacity: 40 },
    { border: { colorOpacity: { hex: "#112233", opacity: 40 } } },
  ],
] as const;

it.each(acceptanceCases)(
  "%s maps canonical state into the Fine Details preview payload",
  (target, value, expected) => {
    const settings = createFineDetailsPreviewSettingsFromValues(
      { [target]: value },
      1080,
    );
    expect(settings.loading).toMatchObject(expected);
  },
);

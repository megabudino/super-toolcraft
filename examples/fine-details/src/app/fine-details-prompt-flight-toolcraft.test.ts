import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  appControlSectionInventory,
  appProductReadiness,
  appTransferMode,
  fineDetailsPromptFlightBrowserTestNames,
} from "./app-acceptance-data";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import {
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_ACCEPTANCE_ID,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_BROWSER_TEST_NAME,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
} from "./fine-details-prompt-flight-command-contract";
import {
  FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS,
  fineDetailsPromptFlightTargets,
} from "./fine-details-prompt-flight-values";
import {
  createFineDetailsPreviewSettingsFromValues,
  FINE_DETAILS_PREVIEW_VERSION,
} from "./fine-details-preview-protocol";

const flightTargets = Object.values(fineDetailsPromptFlightTargets);
const promptFlightTargets = [
  fineDetailsPromptFlightTargets.enabled,
  fineDetailsPromptFlightTargets.offsetX,
  fineDetailsPromptFlightTargets.offsetY,
  fineDetailsPromptFlightTargets.startDelay,
  fineDetailsPromptFlightTargets.flightTime,
  fineDetailsPromptFlightTargets.bounce,
] as const;
const promptGhostTargets = [
  fineDetailsPromptFlightTargets.ghosts,
  fineDetailsPromptFlightTargets.ghostSpacing,
  fineDetailsPromptFlightTargets.ghostOpacity,
  fineDetailsPromptFlightTargets.ghostFalloff,
  fineDetailsPromptFlightTargets.vanishStagger,
  fineDetailsPromptFlightTargets.vanishTime,
] as const;
const promptFlightSliderTargets = [...promptFlightTargets.slice(1), ...promptGhostTargets.slice(1)];

describe("Fine Details prompt flight Toolcraft contract", () => {
  it("publishes protocol v17 with exact prompt.flight breadcrumb settings", () => {
    expect(FINE_DETAILS_PREVIEW_VERSION).toBe(17);
    expect(
      createFineDetailsPreviewSettingsFromValues(
        {
          [fineDetailsPromptFlightTargets.bounce]: 20,
          [fineDetailsPromptFlightTargets.enabled]: false,
          [fineDetailsPromptFlightTargets.ghosts]: false,
          [fineDetailsPromptFlightTargets.offsetX]: -40,
          [fineDetailsPromptFlightTargets.offsetY]: 90,
        },
        1080,
      ).prompt.flight,
    ).toEqual({
      ...FINE_DETAILS_PROMPT_FLIGHT_DEFAULTS,
      bounce: 20,
      enabled: false,
      ghosts: false,
      offset: { x: -40, y: 90 },
    });
  });

  it("publishes six Prompt Flight controls, six Prompt Ghosts controls, and unchanged Playback", () => {
    const sections = appSchema.panels.controls?.sections ?? [];
    const promptIndex = sections.findIndex((section) => section.id === "prompt");
    const flightSection = sections.find((section) => section.id === "prompt-flight");
    const ghostsSection = sections.find((section) => section.id === "prompt-ghosts");
    const playbackSection = sections.find((section) => section.id === "prompt-flight-playback");

    expect(sections[promptIndex + 1]?.id).toBe("prompt-flight");
    expect(sections[promptIndex + 2]?.id).toBe("prompt-ghosts");
    expect(sections[promptIndex + 3]?.id).toBe("prompt-flight-playback");
    expect(flightSection?.title).toBe("Prompt Flight");
    expect(ghostsSection?.title).toBe("Prompt Ghosts");
    expect(playbackSection?.title).toBe("Playback");
    expect(Object.values(flightSection?.controls ?? {})).toHaveLength(6);
    expect(Object.values(ghostsSection?.controls ?? {})).toHaveLength(6);
    expect(Object.values(playbackSection?.controls ?? {})).toHaveLength(1);
    for (const section of [flightSection, ghostsSection, playbackSection]) {
      const visibleLabels = Object.values(section?.controls ?? {})
        .map((control) => control.label)
        .filter((label): label is string => typeof label === "string");
      expect(visibleLabels).not.toContain(section?.title);
    }
    expect(
      Object.values(flightSection?.controls ?? {}).map((control) => control.semanticGroup),
    ).toEqual([
      "mode",
      "landing",
      "landing",
      "flight",
      "flight",
      "flight",
    ]);
    expect(
      Object.values(ghostsSection?.controls ?? {}).map((control) => control.semanticGroup),
    ).toEqual([
      "mode",
      "ghosts",
      "ghosts",
      "ghosts",
      "vanish",
      "vanish",
    ]);
    expect(playbackSection?.controls.playback).toMatchObject({
      actions: [
        {
          label: "Run",
          value: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.actionId,
        },
        {
          label: "Reset",
          value: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.reset.actionId,
          variant: "outline",
        },
      ],
      applicability: { mode: "always" },
      semanticGroup: "playback",
      target: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
      type: "actions",
    });
  });

  it("keeps Active visible and gates flight and ghost controls", () => {
    const flightControls = appSchema.panels.controls?.sections.find(
      (section) => section.id === "prompt-flight",
    )?.controls;
    const ghostControls = appSchema.panels.controls?.sections.find(
      (section) => section.id === "prompt-ghosts",
    )?.controls;

    expect(flightControls?.active).toMatchObject({
      applicability: { mode: "always" },
      defaultValue: true,
      label: "Active",
      orderRole: "mode",
      target: "prompt.flight.enabled",
      type: "switch",
    });
    for (const control of [
      flightControls?.offsetX,
      flightControls?.offsetY,
      flightControls?.startDelay,
      flightControls?.flightTime,
      flightControls?.bounce,
      ghostControls?.active,
    ]) {
      expect(control?.applicability).toMatchObject({
        all: [{ equals: true, target: "prompt.flight.enabled" }],
        mode: "conditional",
      });
    }
    for (const control of [
      ghostControls?.spacing,
      ghostControls?.opacity,
      ghostControls?.falloff,
      ghostControls?.vanishStagger,
      ghostControls?.vanishTime,
    ]) {
      expect(control?.applicability).toMatchObject({
        all: [
          { equals: true, target: "prompt.flight.enabled" },
          { equals: true, target: "prompt.flight.ghosts" },
        ],
        mode: "conditional",
      });
    }
  });

  it("publishes the mirrored switch and slider domains in strict role order", () => {
    const flightControls = appSchema.panels.controls?.sections.find(
      (section) => section.id === "prompt-flight",
    )?.controls;
    const ghostControls = appSchema.panels.controls?.sections.find(
      (section) => section.id === "prompt-ghosts",
    )?.controls;

    expect(flightControls?.offsetX).toMatchObject({
      defaultValue: 0,
      description:
        "Offsets the prompt window's touchdown left edge in pixels from the upper-left typography's exact left edge.",
      label: "Offset X",
      max: 120,
      min: -120,
      orderRole: "spatial",
      sliderValueKind: "continuous",
      step: 1,
      target: "prompt.flight.offset.x",
      type: "slider",
      unit: "px",
    });
    expect(flightControls?.offsetY).toMatchObject({
      defaultValue: 0,
      description:
        "Offsets the prompt window's touchdown bottom edge in pixels from the lower-right typography's exact bottom edge.",
      label: "Offset Y",
      max: 120,
      min: -120,
      orderRole: "spatial",
      sliderValueKind: "continuous",
      step: 1,
      target: "prompt.flight.offset.y",
      type: "slider",
      unit: "px",
    });
    expect(flightControls?.startDelay).toMatchObject({
      defaultValue: 150,
      max: 2000,
      min: 0,
      sliderValueKind: "continuous",
      step: 10,
      unit: "ms",
      variant: "continuous",
    });
    expect(flightControls?.flightTime).toMatchObject({
      defaultValue: 550,
      max: 2000,
      min: 150,
      sliderValueKind: "continuous",
      step: 10,
      unit: "ms",
      variant: "continuous",
    });
    expect(flightControls?.bounce).toMatchObject({
      defaultValue: 12,
      max: 50,
      min: 0,
      sliderValueKind: "continuous",
      step: 1,
      unit: "%",
      variant: "continuous",
    });
    expect(ghostControls?.active).toMatchObject({
      defaultValue: true,
      label: "Active",
      orderRole: "mode",
      target: "prompt.flight.ghosts",
      type: "switch",
    });
    expect(ghostControls?.spacing).toMatchObject({
      defaultValue: 56,
      max: 240,
      min: 16,
      sliderValueKind: "continuous",
      step: 1,
      unit: "px",
    });
    expect(ghostControls?.opacity).toMatchObject({
      defaultValue: 55,
      max: 100,
      min: 5,
      sliderValueKind: "continuous",
      step: 1,
      unit: "%",
    });
    expect(ghostControls?.falloff).toMatchObject({
      defaultValue: 8,
      max: 40,
      min: 0,
      sliderValueKind: "continuous",
      step: 1,
      unit: "%",
    });
    expect(ghostControls?.vanishStagger).toMatchObject({
      defaultValue: 70,
      max: 400,
      min: 0,
      sliderValueKind: "continuous",
      step: 10,
      unit: "ms",
    });
    expect(ghostControls?.vanishTime).toMatchObject({
      defaultValue: 260,
      max: 1200,
      min: 80,
      sliderValueKind: "continuous",
      step: 10,
      unit: "ms",
    });
    expect(Object.values(flightControls ?? {}).map((control) => control.orderRole)).toEqual([
      "mode",
      "spatial",
      "spatial",
      "strength",
      "strength",
      "strength",
    ]);
    expect(Object.values(ghostControls ?? {}).map((control) => control.orderRole)).toEqual([
      "mode",
      "strength",
      "strength",
      "strength",
      "strength",
      "strength",
    ]);
  });

  it("keeps prompt flight as a finite event transition without timeline transport", () => {
    expect(appTransferMode.animationIntent).toMatchObject({
      mode: "autonomous",
    });
    expect(appSchema.panels.timeline).toBeUndefined();
  });

  it("exports every exact prompt flight browser acceptance title for Playwright registration", () => {
    expect(Object.values(fineDetailsPromptFlightBrowserTestNames)).toEqual([
      "browser: prompt.flight.enabled changes the embedded Fine Details output",
      "browser: prompt.flight.offset.x changes the embedded Fine Details output",
      "browser: prompt.flight.offset.y changes the embedded Fine Details output",
      "browser: prompt.flight.startDelay changes the embedded Fine Details output",
      "browser: prompt.flight.flightTime changes the embedded Fine Details output",
      "browser: prompt.flight.bounce changes the embedded Fine Details output",
      "browser: prompt.flight.ghosts changes the embedded Fine Details output",
      "browser: prompt.flight.ghostSpacing changes the embedded Fine Details output",
      "browser: prompt.flight.ghostOpacity changes the embedded Fine Details output",
      "browser: prompt.flight.ghostFalloff changes the embedded Fine Details output",
      "browser: prompt.flight.vanishStagger changes the embedded Fine Details output",
      "browser: prompt.flight.vanishTime changes the embedded Fine Details output",
      "browser: prompt flies between modes with stationary breadcrumbs and a corner landing",
    ]);
    expect(
      appAcceptance
        .filter((entry) =>
          Object.values(fineDetailsPromptFlightBrowserTestNames).includes(
            entry.browserTestName as (typeof fineDetailsPromptFlightBrowserTestNames)[keyof typeof fineDetailsPromptFlightBrowserTestNames],
          ),
        )
        .map((entry) => entry.browserTestName),
    ).toEqual(Object.values(fineDetailsPromptFlightBrowserTestNames));
  });

  it("registers v17 switches as control-change and sliders as control-drag", () => {
    const { rendererPipeline, rendererTechnique } = appPerformance;
    if (!rendererPipeline || !rendererTechnique) {
      throw new Error("Fine Details must declare its preview pipeline and technique.");
    }

    expect(rendererPipeline.runtimeId).toBe("fine-details-external-preview-v17");
    const controlChange = rendererPipeline.interactionInvalidation.find(
      (entry) => entry.interaction === "control-change",
    );
    const controlDrag = rendererPipeline.interactionInvalidation.find(
      (entry) => entry.interaction === "control-drag",
    );
    expect(controlChange?.targets).toEqual(
      expect.arrayContaining([
        fineDetailsPromptFlightTargets.enabled,
        fineDetailsPromptFlightTargets.ghosts,
      ]),
    );
    for (const target of promptFlightSliderTargets) {
      expect(controlChange?.targets).not.toContain(target);
    }
    expect(controlDrag?.targets).toEqual(expect.arrayContaining([...promptFlightSliderTargets]));
    expect(controlDrag?.targets).not.toContain(fineDetailsPromptFlightTargets.enabled);
    expect(controlDrag?.targets).not.toContain(fineDetailsPromptFlightTargets.ghosts);
    expect(
      appPerformance.scenarios.find((scenario) => scenario.interaction === "control-drag")
        ?.coversTargets,
    ).toEqual(expect.arrayContaining(promptFlightSliderTargets));
    expect(rendererTechnique.performanceRisks).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/one-shot.*derived.*capped at 32.*no user-controlled workload/iu),
      ]),
    );
  });

  it("registers the Prompt Flight inventory, owners, and acceptance rows", () => {
    expect(appControlSectionInventory.find((entry) => entry.id === "prompt-flight")).toMatchObject({
      entityId: "fine-details-prompt-flight",
      id: "prompt-flight",
      targets: promptFlightTargets,
      title: "Prompt Flight",
    });
    expect(appControlSectionInventory.find((entry) => entry.id === "prompt-ghosts")).toMatchObject({
      entity: "Fine Details prompt ghost trail",
      entityId: "fine-details-prompt-ghost-trail",
      id: "prompt-ghosts",
      targets: promptGhostTargets,
      title: "Prompt Ghosts",
    });
    expect(
      appControlSectionInventory.find((entry) => entry.id === "prompt-flight-playback"),
    ).toMatchObject({
      entityId: "fine-details-prompt-flight-playback",
      id: "prompt-flight-playback",
      targets: [FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET],
      title: "Playback",
    });

    if (appProductReadiness.mode !== "product") {
      throw new Error("Fine Details must use product readiness.");
    }
    const owners = appProductReadiness.interactionOwnership.filter((entry) =>
      flightTargets.includes(entry.target as (typeof flightTargets)[number]),
    );
    expect(owners).toHaveLength(12);
    expect(owners).toEqual(
      expect.arrayContaining(
        flightTargets.map((target) =>
          expect.objectContaining({
            capability: "property-edit",
            selectionScope: { mode: "global" },
            surface: "panel",
            target,
          }),
        ),
      ),
    );
    const commandOwner = appProductReadiness.interactionOwnership.find(
      (entry) => entry.target === FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
    );
    expect(commandOwner).toMatchObject({
      capability: "command",
      id: "panel-prompt-flight-commands",
      surface: "panel",
      target: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
    });
    expect(commandOwner).not.toHaveProperty("selectionScope");

    expect(
      appAcceptance.filter((entry) =>
        flightTargets.includes(entry.id as (typeof flightTargets)[number]),
      ),
    ).toHaveLength(12);
    for (const target of flightTargets) {
      expect(appAcceptance.find((entry) => entry.id === target)).toMatchObject({
        automatedTestName: `${target} maps canonical state into the Fine Details preview payload`,
        browserTestName: `browser: ${target} changes the embedded Fine Details output`,
        evidence: "product-output",
        kind: "control",
        target,
      });
    }
    expect(
      appAcceptance.find(
        (entry) => entry.id === FINE_DETAILS_PROMPT_FLIGHT_COMMAND_ACCEPTANCE_ID,
      ),
    ).toMatchObject({
      actionCoverage: [
        FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.actionId,
        FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.reset.actionId,
      ],
      automatedTestName:
        "Prompt Flight Run and Reset send one-shot commands without mutating settings",
      browserTestName: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_BROWSER_TEST_NAME,
      componentType: "actions",
      evidence: "command-side-effect",
      interactionId: "panel-prompt-flight-commands",
      kind: "control",
      target: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
    });
    expect(appAcceptance.find((entry) => entry.id === "prompt.flight.transition")).toMatchObject({
      componentType: "iframe",
      evidence: "product-output",
      kind: "runtime",
      target: "images.mode",
    });
  });

  it("records the focused breadcrumb decision and exact verification scope", () => {
    const worklog = readFileSync(
      new URL("../../docs/toolcraft/agent-worklog.md", import.meta.url),
      "utf8",
    );
    const latestDecision = worklog.slice(
      worklog.indexOf("## Decision Trail: Prompt flight breadcrumbs & corner landing"),
    );

    expect(latestDecision).toContain("Protocol v13");
    expect(latestDecision).toContain("32");
    expect(latestDecision).toContain("stale preview");
    expect(latestDecision).toContain("Reset");
    expect(latestDecision).toContain("Playwright discovery");
  });
});

const acceptanceCases = [
  [fineDetailsPromptFlightTargets.enabled, false, { enabled: false }],
  [fineDetailsPromptFlightTargets.offsetX, -20, { offset: { x: -20, y: 0 } }],
  [fineDetailsPromptFlightTargets.offsetY, 40, { offset: { x: 0, y: 40 } }],
  [fineDetailsPromptFlightTargets.startDelay, 400, { startDelay: 400 }],
  [fineDetailsPromptFlightTargets.flightTime, 800, { flightTime: 800 }],
  [fineDetailsPromptFlightTargets.bounce, 30, { bounce: 30 }],
  [fineDetailsPromptFlightTargets.ghosts, false, { ghosts: false }],
  [fineDetailsPromptFlightTargets.ghostSpacing, 48, { ghostSpacing: 48 }],
  [fineDetailsPromptFlightTargets.ghostOpacity, 75, { ghostOpacity: 75 }],
  [fineDetailsPromptFlightTargets.ghostFalloff, 35, { ghostFalloff: 35 }],
  [fineDetailsPromptFlightTargets.vanishStagger, 300, { vanishStagger: 300 }],
  [fineDetailsPromptFlightTargets.vanishTime, 700, { vanishTime: 700 }],
] as const;

it.each(acceptanceCases)(
  "%s maps canonical state into the Fine Details preview payload",
  (target, value, expected) => {
    const settings = createFineDetailsPreviewSettingsFromValues(
      { [target]: value },
      1080,
    );
    expect(settings.prompt.flight).toMatchObject(expected);
  },
);

it("prompt flight transition is driven by the existing Images segmented control", () => {
  const imagesControl = appSchema.panels.controls?.sections.find(
    (section) => section.id === "carousel",
  )?.controls.imagesMode;
  expect(imagesControl).toMatchObject({
    applicability: { mode: "always" },
    options: [
      { label: "Trail", value: "trail" },
      { label: "Loading", value: "loading" },
      { label: "Carousel", value: "carousel" },
    ],
    target: "images.mode",
    type: "segmented",
  });
});

import {
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { rendererPipelineRegistration } from "./dot-ring-pipeline";

const basePerformance = {
  fixtureAdapters: {
    dimensions: {
      "image-long-edge": {
        apply: (value: number) =>
          value === 2048 ? "2k" : value === 8192 ? "8k" : "4k",
        dimensionId: "image-long-edge",
        domain: {
          kind: "schema-options",
          optionValues: ["2k", "4k", "8k"],
          target: "export.image.resolution",
        },
        entries: [
          { appliedValue: "2k", value: 2048 },
          { appliedValue: "4k", value: 4096 },
          { appliedValue: "8k", value: 8192 },
        ],
        kind: "exhaustive-discrete",
        observe: (value: unknown) =>
          value === "2k" ? 2048 : value === "8k" ? 8192 : 4096,
      },
      "ring-density": {
        apply: (value: number) => value,
        dimensionId: "ring-density",
        observe: (value: unknown) => Number(value),
      },
      "ring-rows": {
        apply: (value: number) => value,
        dimensionId: "ring-rows",
        observe: (value: unknown) => Number(value),
      },
      "video-long-edge": {
        apply: (value: number) => (value === 3840 ? "4k" : "current"),
        dimensionId: "video-long-edge",
        domain: {
          kind: "schema-options",
          optionValues: ["current", "4k"],
          target: "export.video.resolution",
        },
        entries: [
          { appliedValue: "current", value: 1024 },
          { appliedValue: "4k", value: 3840 },
        ],
        kind: "exhaustive-discrete",
        observe: (value: unknown) => (value === "4k" ? 3840 : 1024),
      },
    },
  },
  kernelBenchmarkDecisions: [
    {
      candidates: ["canvas-2d"] as const,
      decision:
        "Canvas 2D keeps one deterministic immediate-mode pass for the declared maximum of 280 dots across 12 rows; the protected kernel verifies that exact analytic arc workload.",
      id: "dot-ring.preview-frame",
      selected: "canvas-2d" as const,
    },
  ],
  rendererPipeline: rendererPipelineRegistration,
  rendererStrategy: "canvas-2d",
  rendererTechnique: {
    exportRenderer: "canvas-2d",
    fidelityRisks: [
      "Canvas 2D rasterizes the bead geometry, so selected still and video dimensions must be applied before drawing.",
      "Very high density and row count can visually merge adjacent beads at small output sizes.",
    ],
    intentionalRasterizationReason:
      "The product is an animated audio-reactive field of thousands of circles; Canvas 2D keeps the exact analytic bead geometry while producing image and video pixels efficiently.",
    layers: [
      {
        content: ["geometry", "dense-pattern"],
        exportMode: "included",
        id: "dot-ring-output",
        intentionalRasterizationReason:
          "Background and audio-reactive bead rows are composited into one Canvas 2D product layer.",
        kind: "product-foreground",
        primitiveCount: "high",
        renderer: "canvas-2d",
        uiSelector: "[data-dot-ring-renderer]",
      },
    ],
    performanceRisks: [
      "Density and row count multiply circles drawn on every playback frame.",
      "Resolution scale 2 increases preview backing pixels without changing the visible scene size.",
      "8K still export, 4K video, and the full-timeline infinity envelope multiply fill and encoding work.",
    ],
    previewExportDifferenceReason:
      "Preview uses the selected render-scale backing; export redraws the same analytic frame inside the runtime-resolved finite or infinity scene frame.",
    previewRenderer: "canvas-2d",
    productRepresentation: "pixel",
    rendererStrategy: "canvas-2d",
    sourceRepresentation: "mixed",
    whyNotAlternativeStrategies: [
      "DOM and SVG would retain thousands of animated circle nodes at maximum density and rows.",
      "WebGL adds shader and buffer complexity before Canvas 2D stress evidence shows it is necessary.",
      "A frame-to-frame physics solver would make timeline scrubbing and exact scene bounds nondeterministic.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        batchMax: 280,
        defaultValue: 160,
        id: "ring-density",
        interactiveMax: 280,
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "ring.density",
          workloadBoundary: "maximum",
        },
        unit: "dots",
      },
      {
        batchMax: 12,
        defaultValue: 12,
        id: "ring-rows",
        interactiveMax: 12,
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "ring.rows",
          workloadBoundary: "maximum",
        },
        unit: "rows",
      },
      {
        batchMax: 8192,
        defaultValue: 4096,
        id: "image-long-edge",
        mapping: "quadratic",
        source: {
          kind: "schema-target",
          target: "export.image.resolution",
        },
        unit: "pixels",
      },
      {
        batchMax: 3840,
        defaultValue: 1024,
        id: "video-long-edge",
        mapping: "quadratic",
        source: {
          kind: "schema-target",
          target: "export.video.resolution",
        },
        unit: "pixels",
      },
    ],
  },
} satisfies ToolcraftEnvelopePerformanceConfig;

function createScenario(
  path: ReturnType<typeof deriveToolcraftPerformancePaths>[number],
  index: number,
): ToolcraftPerformanceScenario {
  const base = {
    automated: true,
    automatedTestName: `Dot Ring Studio performance path ${index + 1}: ${path.interaction}`,
    browser: true,
    browserTestName: `browser perf: dot ring path ${path.id}`,
    coversTargets: path.targets,
    expectedObservable:
      "The dotted ring canvas responds while the protected probe measures the declared deterministic renderer path.",
    fixture:
      "Protected compiled fixture at the exact development and maximum workload checkpoints.",
    id: `dot-ring-path-${index + 1}`,
    pathId: path.id,
    ...(path.targets.length === 1 ? { target: path.targets[0] } : {}),
  } as const;

  if (path.interaction === "export") {
    const exportsVideo = path.targets.includes("export.video");
    return {
      ...base,
      actionValue: exportsVideo ? "export.video" : "export.png",
      completionEvidence: "download",
      controlLabel: exportsVideo ? "Export Video" : "Export PNG",
      interaction: "export",
    };
  }

  if (
    path.interaction === "control-change" ||
    path.interaction === "control-drag" ||
    path.interaction === "media-import"
  ) {
    const target = path.targets[0];
    return {
      ...base,
      interaction: path.interaction,
      uiSelector: target
        ? `[data-toolcraft-control-target="${target}"], [data-toolcraft-control-targets*='"${target}"']`
        : "[data-dot-ring-renderer]",
    };
  }

  if (
    path.interaction === "timeline-playback" ||
    path.interaction === "timeline-scrub"
  ) {
    return {
      ...base,
      interaction: path.interaction,
      uiSelector: '[data-slot="timeline-panel"]',
    };
  }

  return { ...base, interaction: path.interaction };
}

const scenarios = deriveToolcraftPerformancePaths(
  appSchema,
  basePerformance,
).map(createScenario);

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({ ...basePerformance, scenarios });

import {
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { rendererPipelineRegistration } from "./dots/dots-pipeline";

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
      "particle-count": {
        apply: (value: number) => Math.round(value / 40) * 40,
        dimensionId: "particle-count",
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
          { appliedValue: "current", value: 1350 },
          { appliedValue: "4k", value: 3840 },
        ],
        kind: "exhaustive-discrete",
        observe: (value: unknown) => (value === "4k" ? 3840 : 1350),
      },
    },
  },
  rendererPipeline: rendererPipelineRegistration,
  rendererStrategy: "canvas-2d",
  rendererTechnique: {
    exportRenderer: "canvas-2d",
    fidelityRisks: [
      "A browser font may render with fallback metrics until its selected webfont is loaded; the renderer resamples after document.fonts settles.",
      "Very long text is fitted into the editable frame and therefore reduces per-glyph detail at a fixed particle count.",
    ],
    intentionalRasterizationReason:
      "The requested output is a dense animated field of circles and fading trajectories; Canvas 2D keeps deterministic vector targets while producing the required raster image and video pixels.",
    layers: [
      {
        content: ["composite"],
        exportMode: "included",
        id: "dot-formation-output",
        intentionalRasterizationReason:
          "Background, trajectories, glow, and dots are composited into one Canvas 2D product layer.",
        kind: "product-foreground",
        primitiveCount: "high",
        renderer: "canvas-2d",
        uiSelector: "[data-dots-renderer]",
      },
    ],
    performanceRisks: [
      "The 2400-particle boundary draws three trail segments and one circle per particle on every playback frame.",
      "Resolution scale 2 increases preview backing pixels without changing visible canvas size.",
      "8K still export and 4K video multiply pixel fill and encoding work while retaining the selected particle count.",
    ],
    previewExportDifferenceReason:
      "Preview uses the current render-scale backing while export redraws the same analytic frame at the selected delivery dimensions.",
    previewRenderer: "canvas-2d",
    productRepresentation: "pixel",
    referenceRendererChangeReason:
      "The supplied reference is an encoded screen recording with no source renderer; deterministic Canvas 2D recreates the observed ring launch, spring trajectories, multicolor dots, and settled glyph without inventing inaccessible implementation details.",
    rendererStrategy: "canvas-2d",
    sourceRepresentation: "reference-runtime",
    whyNotAlternativeStrategies: [
      "DOM and SVG would create thousands of retained nodes and make multi-segment trails and video rasterization more expensive.",
      "WebGL would add shader and buffer complexity for a bounded field of simple circles whose text-mask sampling already lives in Canvas 2D.",
      "A stateful frame-by-frame physics solver would make timeline scrubbing and exact export frames nondeterministic; the selected analytic damped spring preserves the same physical controls with random-access time.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        batchMax: 2400,
        defaultValue: 1800,
        id: "particle-count",
        interactiveMax: 2400,
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "particles.count",
          workloadBoundary: "maximum",
        },
        unit: "particles",
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
        defaultValue: 1350,
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
    automatedTestName: `Dot Formation performance path ${index + 1}: ${path.interaction}`,
    browser: true,
    browserTestName: `browser perf: dot formation path ${path.id}`,
    coversTargets: path.targets,
    expectedObservable:
      "The particle canvas responds while the protected probe measures the declared deterministic renderer path.",
    fixture:
      "Protected compiled fixture at the exact development and maximum workload checkpoints.",
    id: `dot-formation-path-${index + 1}`,
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
    path.interaction === "control-drag"
  ) {
    const target = path.targets[0];
    return {
      ...base,
      interaction: path.interaction,
      uiSelector: target
        ? `[data-toolcraft-control-target="${target}"], [data-toolcraft-control-targets*='"${target}"']`
        : "[data-dots-renderer]",
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

import {
  defineToolcraftFixtureAdapter,
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { wavePlacementDefaults } from "./domain/wave-placement";
import { heroRendererPipelineRegistration } from "./renderer/hero-pipeline";

const waveWidthAdapter = defineToolcraftFixtureAdapter<number>({
  apply(value) {
    return value;
  },
  dimensionId: "wave-width",
  observe(value) {
    return value;
  },
});

const waveHeightAdapter = defineToolcraftFixtureAdapter<number>({
  apply(value) {
    return value;
  },
  dimensionId: "wave-height",
  observe(value) {
    return value;
  },
});

const ribCountAdapter = defineToolcraftFixtureAdapter<number>({
  apply(value) {
    return value;
  },
  dimensionId: "rib-count",
  observe(value) {
    return value;
  },
});

const workloadEnvelope = {
  dimensions: [
    {
      batchMax: 3840,
      defaultValue: wavePlacementDefaults.width,
      id: "wave-width",
      interactiveMax: 3840,
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "wave.frame.width",
        workloadBoundary: "maximum",
      },
      unit: "pixels",
    },
    {
      batchMax: 2160,
      defaultValue: wavePlacementDefaults.height,
      id: "wave-height",
      interactiveMax: 2160,
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "wave.frame.height",
        workloadBoundary: "maximum",
      },
      unit: "pixels",
    },
    {
      batchMax: 400,
      defaultValue: 310,
      id: "rib-count",
      interactiveMax: 400,
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "structure.count",
        workloadBoundary: "maximum",
      },
      unit: "ribs",
    },
  ],
} satisfies ToolcraftEnvelopePerformanceConfig["workloadEnvelope"];

const basePerformance = defineToolcraftPerformance({
  fixtureAdapters: {
    dimensions: {
      "rib-count": ribCountAdapter,
      "wave-height": waveHeightAdapter,
      "wave-width": waveWidthAdapter,
    },
  },
  rendererPipeline: heroRendererPipelineRegistration,
  rendererStrategy: "webgl",
  rendererTechnique: {
    exportRenderer: "none",
    fidelityRisks: [
      "VSM softness and PMREM filtering can vary slightly across GPU implementations.",
      "Native foreground CSS must remain isolated from the editor and resolve breakpoints from the product frame.",
    ],
    gpu: {
      preview: { backend: "webgl", provider: "three" },
    },
    intentionalRasterizationReason:
      "The middle layer is a continuously shaded procedural three-dimensional wave field.",
    layers: [
      {
        content: ["composite"],
        exportMode: "included",
        id: "hero-base",
        kind: "background",
        primitiveCount: "low",
        renderer: "dom",
        uiSelector: '[data-testid="hero-base-layer"]',
      },
      {
        content: ["geometry", "shader", "dense-pattern"],
        exportMode: "included",
        id: "wave",
        kind: "product-foreground",
        primitiveCount: "high",
        renderer: "canvas-2d",
        uiSelector: 'canvas[data-toolcraft-product-output="hero"]',
      },
      {
        content: ["text", "bitmap-media"],
        exportMode: "included",
        id: "hero-foreground",
        kind: "product-foreground",
        primitiveCount: "low",
        renderer: "dom",
        uiSelector: '[data-testid="hero-native-foreground"]',
      },
      {
        content: ["handles"],
        exportMode: "excluded",
        id: "mask-handles",
        kind: "editing-handles",
        primitiveCount: "low",
        renderer: "dom",
        uiSelector: "[data-hero-mask-handles]",
      },
    ],
    performanceRisks: [
      "The default wave scene approaches one million shared vertices and rebuilds when Structure or Rib controls change.",
      "Timeline playback shades the visible window at full selected density, retaining geometry and PMREM resources and coalescing GPU submissions.",
      "The world-space wave may exceed hardware texture size; only the visible window plus filter guard is allocated, never a zoom-sized full-scene buffer.",
      "Circle masks run in the final compositor pass and update without rebuilding geometry, environment maps, or shadows.",
      "The foreground native preview keeps the original hero logos and video alive above the WebGL canvas.",
    ],
    previewRenderer: "canvas-2d",
    productRepresentation: "mixed",
    rendererStrategy: "webgl",
    sourceRepresentation: "mixed",
    whyNotAlternativeStrategies: [
      "Canvas 2D cannot reproduce perspective mesh occlusion, physical materials, VSM shadows, GTAO, and PMREM lighting.",
      "DOM and SVG cannot represent the required three-dimensional depth and physical shading.",
      "WebGPU would change the inspected Three.js WebGL renderer instead of preserving the reference implementation.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope,
} satisfies ToolcraftEnvelopePerformanceConfig);

function createScenarios(): ToolcraftPerformanceScenario[] {
  return deriveToolcraftPerformancePaths(appSchema, basePerformance).flatMap(
    (path): ToolcraftPerformanceScenario[] => {
      if (path.interaction === "export") {
        return [];
      }

      const common = {
        automated: true,
        automatedTestName: `perf: percent hero composition ${path.id}`,
        browser: true,
        browserTestName: `browser perf: percent hero composition ${path.id}`,
        coversTargets: path.targets,
        expectedObservable:
          "The composed hero keeps its foreground fixed while the retained wave renderer reaches the requested state.",
        fixture: "Percents hero with a 2826 by 1080 procedural wave middle layer",
        id: `percent-hero-composition-${path.id}`,
        pathId: path.id,
        ...(path.targets.length === 1 ? { target: path.targets[0] } : {}),
      };

      if (path.interaction === "timeline-playback" || path.interaction === "timeline-scrub") {
        return [
          {
            ...common,
            interaction: path.interaction,
            uiSelector: '[aria-label="Playback position"]',
          },
        ];
      }

      if (path.interaction === "mask-drag") {
        return [
          {
            ...common,
            interaction: path.interaction,
            uiSelector: '[data-toolcraft-canvas-handle][data-testid="hero-mask-0-move"]',
          },
        ];
      }

      return [
        {
          ...common,
          interaction: path.interaction,
          uiSelector: '[data-toolcraft-product-output="hero"]',
        },
      ];
    },
  );
}

export const appPerformance: ToolcraftEnvelopePerformanceConfig = defineToolcraftPerformance({
  ...basePerformance,
  scenarios: createScenarios(),
});

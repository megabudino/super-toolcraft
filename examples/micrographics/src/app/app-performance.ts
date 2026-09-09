import {
  assessToolcraftRenderPlan,
  defineToolcraftSchemaDiscreteFixtureAdapter,
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { defaultMicrographicsValues } from "./default-settings";
import { rendererPipelineRegistration } from "./renderer-pipeline";

const templateTierFixtureAdapter = defineToolcraftSchemaDiscreteFixtureAdapter(
  appSchema,
  {
    dimensionId: "template-tier-weight",
    entries: [
      { appliedValue: "simple", value: 1 },
      { appliedValue: "mega", value: 3 },
      { appliedValue: "both", value: 2 },
    ],
    target: "composition.templateTier",
  },
);

const performanceBase = {
  fixtureAdapters: {
    dimensions: {
      "element-count": {
        apply: (value: number) => value,
        dimensionId: "element-count",
        kind: "continuous" as const,
        observe: (value: unknown) => Number(value),
      },
      "template-tier-weight": templateTierFixtureAdapter,
    },
  },
  kernelBenchmarkDecisions: [
    {
      candidates: ["svg"] as const,
      decision:
        "SVG preserves semantic hit regions and vector fidelity for template micrographics; the protected kernel verifies bounded scene construction at the declared element envelope.",
      id: "poster-scene",
      selected: "svg" as const,
    },
  ],
  rendererPipeline: rendererPipelineRegistration,
  rendererStrategy: "svg" as const,
  rendererTechnique: {
    exportRenderer: "canvas-2d" as const,
    fidelityRisks: [
      "Canvas export must preserve SVG template geometry, mono typography metrics, and source-photo cover cropping.",
      "Very small technical labels must remain legible at the selected poster resolution.",
    ],
    layers: [
      {
        content: ["bitmap-media", "geometry"],
        exportMode: "composited" as const,
        id: "poster-background",
        kind: "background" as const,
        primitiveCount: "low" as const,
        renderer: "svg" as const,
        uiSelector: "[data-micrographics-layer='background']",
      },
      {
        content: ["geometry", "dense-pattern", "text"],
        exportMode: "composited" as const,
        id: "micrographics-foreground",
        kind: "product-foreground" as const,
        primitiveCount: "high" as const,
        renderer: "svg" as const,
        uiSelector: "[data-micrographics-layer='foreground']",
      },
      {
        content: ["handles"],
        exportMode: "excluded" as const,
        id: "selection-handles",
        kind: "editing-handles" as const,
        primitiveCount: "low" as const,
        renderer: "svg" as const,
        uiSelector: "[data-micrographics-layer='handles']",
      },
    ],
    performanceRisks: [
      "Element count multiplies SVG primitive count during seed, count, scale, and canvas drags.",
      "Mega-only random generation uses the densest template grammar pool at the same element count.",
      "8K PNG export rasterizes the complete poster and optional uploaded photo in one batch.",
    ],
    previewExportDifferenceReason:
      "Preview stays semantic SVG for direct editing; PNG delivery uses Canvas 2D only for the final raster artifact.",
    previewRenderer: "svg" as const,
    productRepresentation: "mixed" as const,
    rendererStrategy: "svg" as const,
    sourceRepresentation: "mixed" as const,
    whyNotAlternativeStrategies: [
      "DOM would make dense repeated template geometry verbose and harder to transform as one element.",
      "Canvas 2D would discard semantic hit regions and vector-native preview scaling.",
      "WebGL/WebGPU add pipeline and text-atlas cost without benefit at the enforced primitive boundary.",
    ],
  },
  scenarios: [] as readonly ToolcraftPerformanceScenario[],
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        batchMax: 16,
        defaultValue: defaultMicrographicsValues["composition.count"],
        id: "element-count",
        interactiveMax: 16,
        mapping: "direct" as const,
        source: {
          kind: "schema-target" as const,
          target: "composition.count",
          workloadBoundary: "maximum" as const,
        },
        unit: "elements",
      },
      {
        batchMax: 3,
        defaultValue: 2,
        id: "template-tier-weight",
        interactiveMax: 3,
        mapping: "direct" as const,
        source: {
          kind: "schema-target" as const,
          target: "composition.templateTier",
        },
        unit: "tier-weight",
      },
    ],
  },
} satisfies ToolcraftEnvelopePerformanceConfig;

const performancePaths = deriveToolcraftPerformancePaths(appSchema, performanceBase);

const scenarios: readonly ToolcraftPerformanceScenario[] = performancePaths.map(
  (path, index): ToolcraftPerformanceScenario => {
    const common = {
      automated: true,
      automatedTestName: "app performance gates validate the canonical micrographics path",
      browser: true,
      browserTestName: `browser perf: toolcraft path ${path.id}`,
      coversTargets: path.targets,
      expectedObservable:
        path.interaction === "viewport-drag" || path.interaction === "viewport-zoom"
          ? "The poster viewport changes while the retained SVG scene remains stable."
          : "The visible micrographics poster reflects the applied fixture values.",
      fixture: `compiled-micrographics-${path.id}`,
      id: `micrographics-path-${String(index + 1).padStart(2, "0")}`,
      pathId: path.id,
      target: path.targets.length === 1 ? path.targets[0] : undefined,
      uiSelector: "[data-toolcraft-product-output='micrographics']",
    };

    if (path.interaction === "export") {
      return {
        ...common,
        actionValue: "export-png",
        completionEvidence: "download",
        controlLabel: "Export PNG",
        interaction: "export",
      };
    }

    return {
      ...common,
      interaction: path.interaction,
    };
  },
);

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    ...performanceBase,
    scenarios,
  });

export const appRenderPlanAssessment = assessToolcraftRenderPlan(
  appSchema,
  appPerformance,
);

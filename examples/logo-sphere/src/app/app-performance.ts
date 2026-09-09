import {
  assessToolcraftRenderPlan,
  defineToolcraftSchemaDiscreteFixtureAdapter,
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { logoSpherePipelineRegistration } from "./logo-sphere-pipeline";

const distributionComplexityAdapter =
  defineToolcraftSchemaDiscreteFixtureAdapter(appSchema, {
    dimensionId: "distribution-complexity",
    entries: [
      { appliedValue: "fibonacci", value: 0 },
      { appliedValue: "rings", value: 1 },
      { appliedValue: "grid", value: 2 },
    ],
    target: "sphere.distribution",
  });

const logoSpherePerformanceBase = defineToolcraftPerformance({
  fixtureAdapters: {
    dimensions: {
      "distribution-complexity": distributionComplexityAdapter,
      "visible-logos": {
        apply: (value: number) => value,
        dimensionId: "visible-logos",
        kind: "continuous",
        observe: (value: unknown) => Number(value),
      },
    },
  },
  rendererPipeline: logoSpherePipelineRegistration,
  rendererStrategy: "webgl",
  rendererTechnique: {
    exportRenderer: "webgl",
    fidelityRisks: [
      "Small SVG marks must remain crisp when decoded at the shared atlas resolution and shrink at the rear of the sphere.",
      "Preview and export must use identical projection, rounded clipping, constant-width stroke, depth-scaled shadow, sort, transform, and opacity math.",
    ],
    intentionalRasterizationReason:
      "Authored SVG/image sources are cached as high-resolution textures; one full-quality WebGL mesh composite supplies preview and the runtime-owned image export context.",
    layers: [
      {
        content: ["bitmap-media", "geometry", "composite"],
        exportMode: "included",
        id: "logo-cards",
        intentionalRasterizationReason:
          "Supplied SVG and uploaded images use curved Grid meshes or camera-facing quads with rounded shader clipping, constant-width strokes, cached shadows, and a single silhouette mask.",
        kind: "product-foreground",
        primitiveCount: "high",
        renderer: "webgl",
        uiSelector: "canvas[data-toolcraft-product-output='logo-sphere']",
      },
    ],
    performanceRisks: [
      "Visible logo count increases projection, indexed mesh generation, and translucent GPU overdraw on every frame.",
      "Grid is the maximum-workload distribution because every drawable card uses a curved surface texture mesh, bounded to 81 shared vertices per card.",
      "Rounded shader clipping, shadow sprites, and constant-width outlines preserve full styling through the 500-card limit; overlapping translucent fragments remain the principal fill risk.",
      "Decoded image resources must survive unrelated control and timeline updates without source churn.",
      "Resolution scale at 2x multiplies preview backing pixels while interaction and playback remain live.",
      "Retained source/shadow textures and full-resolution framebuffers must survive timeline-only updates and release GPU resources on unmount or context restoration.",
      "Some browsers silently allocate a smaller drawing buffer than the requested canvas dimensions; exact GPU dimensions are checked and unsupported sizes use the full-resolution Canvas fallback.",
    ],
    previewRenderer: "webgl",
    productRepresentation: "pixel",
    rendererStrategy: "webgl",
    sourceRepresentation: "image-media",
    whyNotAlternativeStrategies: [
      "DOM/CSS 3D would require a separate export implementation and could diverge in sorting, transforms, and masking.",
      "Full Canvas 2D repeatedly clips hundreds of textures and masks a retina backing; capability fallback retains that full kernel, but no interaction/playback quality tiers remain.",
      "A DOM/SVG scene would require a separate serialization/export path and could diverge in depth sort, upload transforms, and pixel-level masking.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        batchMax: 500,
        defaultValue: 63,
        id: "visible-logos",
        interactiveMax: 500,
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "sphere.visibleCount",
          workloadBoundary: "maximum",
        },
        unit: "cards",
      },
      {
        batchMax: 2,
        defaultValue: 2,
        id: "distribution-complexity",
        interactiveMax: 2,
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "sphere.distribution",
        },
        unit: "mode-cost",
      },
    ],
  },
});

export const logoSphereRenderPlanAssessment = assessToolcraftRenderPlan(
  appSchema,
  logoSpherePerformanceBase,
);

export const logoSpherePerformancePaths = deriveToolcraftPerformancePaths(
  appSchema,
  logoSpherePerformanceBase,
);

function scenarioForPath(
  path: (typeof logoSpherePerformancePaths)[number],
): ToolcraftPerformanceScenario {
  const common = {
    automated: true,
    automatedTestName:
      "requires structurally valid performance coverage for functional delivery",
    browser: true,
    browserTestName: `browser perf: toolcraft path ${path.id}`,
    coversTargets: path.targets,
    expectedObservable:
      path.invalidates.length === 0
        ? "The primary operation completes while retained logo layout and composite passes remain unchanged."
        : "The primary operation updates the visible logo sphere at full selected resolution with the declared pass invalidation.",
    fixture:
      path.workloadDimensions.length > 0
        ? "compiled visible-logo development and maximum checkpoints"
        : "default sixty-three-card Grid sphere",
    id: `logo-sphere.${path.id}`,
    pathId: path.id,
  } as const;

  if (path.interaction === "export") {
    return {
      ...common,
      actionValue: "export.png",
      completionEvidence: "download",
      controlLabel: "Export PNG",
      interaction: "export",
      target: "actions.output",
    };
  }

  return {
    ...common,
    interaction: path.interaction,
    ...(path.targets.length === 1 ? { target: path.targets[0] } : {}),
    uiSelector: "canvas[data-toolcraft-product-output='logo-sphere']",
  };
}

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    ...logoSpherePerformanceBase,
    scenarios: logoSpherePerformancePaths.map(scenarioForPath),
  });

import {
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { rendererPipelineRegistration } from "./donut/donut-pipeline";
import { DONUT_DEFAULTS } from "./donut/donut-values";
import { appSchema } from "./app-schema";

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
      "sprinkle-flow": {
        apply: (value: number) => Math.round(value * 100) / 100,
        dimensionId: "sprinkle-flow",
        observe: (value: unknown) => Number(value),
      },
    },
  },
  rendererPipeline: rendererPipelineRegistration,
  rendererStrategy: "webgl",
  rendererTechnique: {
    exportRenderer: "webgl",
    fidelityRisks: [
      "The source palette images were not packed into the Blender file and their original external paths are unavailable, so modes 2, 3, and 5 use documented deterministic palette banks while preserving the five public branches.",
      "Three.js MeshPhysicalMaterial plus user-supplied scanned PBR atlases and deterministic triplanar edible shaders approximate Blender 4 Principled transmission, coat, sheen, and microstructure but cannot reproduce Filmic Medium High Contrast byte-for-byte.",
    ],
    intentionalRasterizationReason:
      "The product is an interactive depth-tested 3D scene whose physically shaded meshes, instanced sprinkles, HDR reflections, and export share one WebGL representation.",
    layers: [
      {
        content: ["geometry", "dense-pattern", "composite"],
        exportMode: "composited",
        id: "donut-product",
        intentionalRasterizationReason:
          "Base, plate, icing, sprinkles, and studio illumination must share one depth buffer and physical material response.",
        kind: "product-foreground",
        primitiveCount: "high",
        renderer: "webgl",
        uiSelector: "[data-donut-renderer]",
      },
    ],
    performanceRisks: [
      "Flow reaches 900 retained sprinkle instances and updates their matrices and colors during live slider interaction.",
      "Resolution scale reaches a full 2x backing buffer and must never clamp quality during orbit or steady state.",
      "8K image export increases WebGL pixel fill and browser encoding work while rebuilding an isolated offscreen scene.",
      "The Blender-derived product geometry and the environment texture converted from the HDRI are retained once and must release on renderer disposal.",
      "Procedural dough and icing microstructure adds bounded constant-complexity fragment work without introducing a user-controlled workload dimension.",
      "Three 2K scanned material maps are retained per scene and sampled through bounded triplanar atlas regions; they must release with the scene.",
      "The 2048 shadow map is retained between material-only frames and explicitly invalidated by geometry, visibility, shadow enablement, or orientation changes.",
    ],
    previewExportDifferenceReason:
      "Preview uses CSS size multiplied by device pixel ratio and Toolcraft Resolution scale; image export rebuilds the identical canonical scene at the selected 2K, 4K, or 8K dimensions with pixel ratio 1.",
    previewRenderer: "webgl",
    productRepresentation: "mixed",
    referenceRendererChangeReason:
      "Blender Geometry Nodes and EEVEE cannot run in a browser, so their public inputs, evaluated base/plate geometry, procedural coating, instance distribution, materials, HDR world, and area-light intent are reconstructed as retained Three.js resources.",
    rendererStrategy: "webgl",
    sourceRepresentation: "reference-runtime",
    whyNotAlternativeStrategies: [
      "A baked GLB result would remove the public Geometry Nodes controls and would not be a simulator.",
      "Remote Blender rendering would make orbit and control feedback network-bound and would not preserve Toolcraft runtime state as the product authority.",
      "DOM, SVG, and Canvas 2D cannot provide shared depth testing, physical materials, HDR reflections, and hundreds of three-dimensional sprinkle instances.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        batchMax: 2,
        defaultValue: DONUT_DEFAULTS.sprinkles.flow,
        id: "sprinkle-flow",
        interactiveMax: 2,
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "sprinkles.flow",
          workloadBoundary: "maximum",
        },
        unit: "flow",
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
    ],
  },
} satisfies ToolcraftEnvelopePerformanceConfig;

function createScenario(
  path: ReturnType<typeof deriveToolcraftPerformancePaths>[number],
  index: number,
): ToolcraftPerformanceScenario {
  const base = {
    automated: true,
    automatedTestName: `performance path ${index + 1}: ${path.interaction}`,
    browser: true,
    browserTestName: `browser perf: donut path ${path.id}`,
    coversTargets: path.targets,
    expectedObservable:
      path.interaction === "export"
        ? "A non-empty donut image download completes at the selected long edge."
        : "The retained donut scene stays visible and its product frame signature matches the changed state.",
    fixture: "Protected compiled donut workload fixture",
    id: `donut-path-${index + 1}`,
    pathId: path.id,
  } as const;

  if (path.interaction === "export") {
    return {
      ...base,
      actionValue: "export.png",
      completionEvidence: "download",
      controlLabel: "Export PNG",
      interaction: "export",
    };
  }

  return {
    ...base,
    interaction: path.interaction,
    uiSelector: "[data-donut-renderer]",
  } as ToolcraftPerformanceScenario;
}

const paths = deriveToolcraftPerformancePaths(appSchema, basePerformance);

export const appPerformance = defineToolcraftPerformance({
  ...basePerformance,
  scenarios: paths.map(createScenario),
});

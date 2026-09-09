import {
  defineToolcraftDiscreteFixtureAdapter,
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
} from "@/toolcraft/runtime";

import { MESH_MAX_POINTS, MESH_MIN_POINTS } from "./mesh-gradient/mesh-model";
import { meshRendererPipelineRegistration } from "./mesh-gradient/renderer-pipeline";
import { appSchema } from "./app-schema";

const basePerformance = {
  fixtureAdapters: {
    dimensions: {
      "mesh-point-count": defineToolcraftDiscreteFixtureAdapter({
        dimensionId: "mesh-point-count",
        domain: {
          kind: "schema-options",
          optionValues: Array.from(
            { length: MESH_MAX_POINTS - MESH_MIN_POINTS + 1 },
            (_, index) => String(MESH_MIN_POINTS + index),
          ),
          target: "mesh.colors",
        },
        entries: Array.from(
          { length: MESH_MAX_POINTS - MESH_MIN_POINTS + 1 },
          (_, index) => {
            const value = MESH_MIN_POINTS + index;
            return { appliedValue: String(value), value };
          },
        ),
      }),
    },
  },
  rendererPipeline: meshRendererPipelineRegistration,
  rendererStrategy: "webgl" as const,
  rendererTechnique: {
    exportRenderer: "webgl" as const,
    fidelityRisks: [
      "Low tessellation can visibly facet strongly curved Coons patches, so the preview matches ColorFlow at 64 steps when idle, temporarily uses 16 during direct manipulation, and restores full preview quality on release; export keeps the reference's fixed 32-step path.",
      "Browser color management may vary slightly after MediaRecorder encoding.",
    ],
    intentionalRasterizationReason:
      "The editable surface is tessellated from Coons patches and composited with raster-only grain and color correction for image and video output.",
    layers: [
      {
        content: ["shader"] as const,
        exportMode: "included" as const,
        id: "mesh-background",
        kind: "background" as const,
        primitiveCount: "low" as const,
        renderer: "webgl" as const,
        uiSelector: '[data-mesh-gradient-background="true"]',
      },
      {
        content: ["geometry", "noise"] as const,
        exportMode: "composited" as const,
        id: "mesh-field",
        kind: "product-foreground" as const,
        primitiveCount: "high" as const,
        renderer: "webgl" as const,
        uiSelector: '[data-mesh-gradient-canvas="true"]',
      },
      {
        content: ["handles"] as const,
        exportMode: "excluded" as const,
        id: "mesh-point-handles",
        kind: "editing-handles" as const,
        primitiveCount: "medium" as const,
        renderer: "svg" as const,
        uiSelector: '[data-mesh-gradient-handles="true"]',
      },
      {
        content: ["composite"] as const,
        exportMode: "included" as const,
        id: "mesh-export-composite",
        kind: "export-composite" as const,
        primitiveCount: "low" as const,
        renderer: "webgl" as const,
      },
    ],
    performanceRisks: [
      "Point-count growth increases the number of locally split triangles and uploaded vertices inside affected Coons cells.",
      "A full Resolution-scale backing buffer and 64-step idle tessellation increase preview cost; direct mesh gestures lower only tessellation to 16 without reducing backing pixels.",
      "Animated playback can contend with canvas pan and zoom if frames are not coalesced.",
      "Video export duration and 4K resolution increase batch cost.",
    ],
    previewExportDifferenceReason:
      "Preview follows ColorFlow's 64-step idle and 16-step drag tessellation; export reruns the same Coons and fragment pipeline with ColorFlow's fixed 32-step export tessellation at the selected image or video dimensions.",
    previewRenderer: "webgl" as const,
    productRepresentation: "pixel" as const,
    rendererStrategy: "webgl" as const,
    sourceRepresentation: "procedural-data" as const,
    whyNotAlternativeStrategies: [
      "CSS gradients cannot deform through four directional Bezier boundaries per grid node.",
      "SVG would reproduce the guide curves but not the same continuously tessellated Coons surface and video pipeline.",
      "Canvas 2D would require CPU triangle rasterization or per-pixel inverse patch evaluation for every playback frame.",
    ],
  },
  scenarios: [] as const,
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        batchMax: MESH_MAX_POINTS,
        defaultValue: 12,
        id: "mesh-point-count",
        interactiveMax: MESH_MAX_POINTS,
        mapping: "direct" as const,
        source: { kind: "schema-target" as const, target: "mesh.colors" },
        unit: "points",
      },
    ],
  },
};

const meshPerformancePaths = deriveToolcraftPerformancePaths(
  appSchema,
  basePerformance,
);

const meshScenarios = meshPerformancePaths.map((path, index) => {
  const browserTestName = `browser perf: mesh path ${index + 1} ${path.interaction}`;
  const base = {
    automated: true,
    automatedTestName: `app performance declares mesh path ${index + 1} ${path.interaction}`,
    browser: true,
    browserTestName,
    coversTargets: path.targets,
    expectedObservable:
      path.interaction === "export"
        ? "A non-empty mesh-gradient export download completes."
        : path.interaction.startsWith("viewport-")
          ? "The mesh field stays rendered while the viewport transform changes."
          : path.invalidates.includes("mesh-handles")
            ? "The visible point count and handle geometry match runtime mesh state."
            : "The WebGL frame signature changes and the mesh remains visibly rendered.",
    fixture: "Compiled mesh-gradient workload fixture",
    id: `mesh-path-${index + 1}`,
    pathId: path.id,
    uiSelector: '[data-mesh-gradient-root="true"]',
  } as const;

  if (path.interaction === "export") {
    return {
      ...base,
      actionValue: "export.png",
      completionEvidence: "download" as const,
      controlLabel: "Export PNG",
      interaction: "export" as const,
    };
  }

  return { ...base, interaction: path.interaction } as Exclude<
    ToolcraftEnvelopePerformanceConfig["scenarios"][number],
    { interaction: "export" }
  >;
});

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    ...basePerformance,
    scenarios: meshScenarios,
  });

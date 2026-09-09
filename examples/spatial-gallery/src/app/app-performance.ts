import {
  defineToolcraftFixtureAdapter,
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { spiralGalleryPipelineRegistration } from "./spiral-gallery/spiral-gallery-pipeline";

const basePerformance = {
  fixtureAdapters: {
    dimensions: {
      "repetition-count": defineToolcraftFixtureAdapter({
        apply: (value: number) => value,
        dimensionId: "repetition-count",
        observe: (value: number) => Number(value),
      }),
    },
  },
  rendererPipeline: spiralGalleryPipelineRegistration,
  rendererStrategy: "webgl" as const,
  rendererTechnique: {
    exportRenderer: "canvas-2d" as const,
    fidelityRisks: [
      "Very small curve radii can self-occlude card edges, so the schema keeps deformation inside a bounded usable range.",
      "Large output dimensions can expose GPU framebuffer limits, so export fails explicitly instead of silently reducing the chosen resolution.",
      "A destination agent could flatten the cards while adapting the code package, so its integration contract explicitly preserves both WebGL bend stages and the tested physics core.",
    ],
    intentionalRasterizationReason:
      "The live product combines textured 3D card geometry, physical vertex deformation, and an optional flat background into WebGL preview pixels.",
    layers: [
      {
        content: ["composite"] as const,
        exportMode: "included" as const,
        id: "image-gallery-background",
        kind: "background" as const,
        primitiveCount: "low" as const,
        renderer: "dom" as const,
        uiSelector: '[data-image-gallery-background="true"]',
      },
      {
        content: ["bitmap-media", "geometry", "shader"] as const,
        exportMode: "included" as const,
        id: "image-gallery-cards",
        kind: "product-foreground" as const,
        primitiveCount: "high" as const,
        renderer: "webgl" as const,
        uiSelector: '[data-image-gallery-canvas="true"]',
      },
    ],
    performanceRisks: [
      "Repetition growth multiplies the number of textured meshes updated and drawn per interaction frame.",
      "Large uploaded images increase decode and GPU texture pressure, so the renderer caps the consumed source set and texture long edge without changing runtime media order.",
      "Continuous pointer, wheel, and inertial frames can contend with viewport transforms unless work remains inside one coalesced requestAnimationFrame loop.",
      "2K, 4K, and 8K exports resize the WebGL backing buffer, rerender every visible card, transfer pixels, and encode the final image asynchronously.",
      "Code export fetches and compresses the bounded current image set, so completion time also scales with admitted source bytes.",
    ],
    previewExportDifferenceReason:
      "Preview uses the retained WebGL canvas; raster export rerenders the same physical card scene at the selected dimensions and encodes PNG/JPG, while code export packages that renderer, the exact settings, and source images for agent-assisted integration.",
    previewRenderer: "webgl" as const,
    productRepresentation: "mixed" as const,
    rendererStrategy: "webgl" as const,
    sourceRepresentation: "image-media" as const,
    whyNotAlternativeStrategies: [
      "DOM/CSS transforms cannot reproduce the two compound per-vertex bends on every textured card.",
      "SVG would not preserve the same perspective, physical deformation, and texture sampling pipeline.",
      "Canvas 2D would require CPU mesh subdivision and affine texture slicing for every inertial frame.",
    ],
  },
  scenarios: [] as const,
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        batchMax: 8,
        defaultValue: 3,
        id: "repetition-count",
        interactiveMax: 8,
        mapping: "direct" as const,
        source: {
          kind: "schema-target" as const,
          target: "spiral.repetitions",
          workloadBoundary: "maximum" as const,
        },
        unit: "repetitions",
      },
    ],
  },
};

const performancePaths = deriveToolcraftPerformancePaths(
  appSchema,
  basePerformance,
);

const scenarios = performancePaths.map((path, index) => {
  const base = {
    automated: true,
    automatedTestName: `app performance declares image gallery path ${index + 1} ${path.interaction}`,
    browser: true,
    browserTestName: `browser perf: image gallery path ${index + 1} ${path.interaction}`,
    coversTargets: path.targets,
    expectedObservable:
      path.interaction === "export"
        ? "A non-empty PNG or JPG downloads with the selected resolution, current gallery state, media transforms, and optional flat background."
        : path.interaction.startsWith("viewport-")
          ? "The rendered gallery remains stable while the Toolcraft viewport changes."
          : "The WebGL frame signature changes while textured cards remain visible.",
    fixture: "Compiled image-gallery workload fixture",
    id: `image-gallery-path-${index + 1}`,
    pathId: path.id,
    uiSelector: '[data-image-gallery-root="true"]',
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
    scenarios,
  });

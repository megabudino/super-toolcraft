import {
  deriveToolcraftPerformancePaths,
  defineToolcraftPerformance,
  type ToolcraftEnvelopePerformanceConfig,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { GLOBE_BAND_WIDTH_MAX, GLOBE_DEFAULTS } from "./globe-constants";
import { globeRendererPipelineRegistration } from "./globe-renderer-pipeline";

const workloadEnvelope = {
  dimensions: [
    {
      batchMax: 25,
      defaultValue: GLOBE_DEFAULTS.latitudeCount,
      id: "latitude-rings",
      interactiveMax: 25,
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "globe.latitudeCount",
        workloadBoundary: "maximum",
      },
      unit: "rings",
    },
    {
      batchMax: 48,
      defaultValue: GLOBE_DEFAULTS.meridianCount,
      id: "meridian-rings",
      interactiveMax: 48,
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "globe.meridianCount",
        workloadBoundary: "maximum",
      },
      unit: "rings",
    },
    {
      batchMax: 8192,
      defaultValue: 4096,
      id: "export-long-edge",
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "export.image.resolution",
      },
      unit: "px",
    },
    {
      batchMax: 8,
      defaultValue: GLOBE_DEFAULTS.lineWidth,
      id: "line-thickness",
      interactiveMax: 8,
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "globe.lineWidth",
        workloadBoundary: "maximum",
      },
      unit: "px",
    },
    {
      batchMax: GLOBE_BAND_WIDTH_MAX,
      defaultValue: GLOBE_DEFAULTS.band1Width,
      id: "band-1-width",
      interactiveMax: GLOBE_BAND_WIDTH_MAX,
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "bands.band1.width",
        workloadBoundary: "maximum",
      },
      unit: "%",
    },
    {
      batchMax: GLOBE_BAND_WIDTH_MAX,
      defaultValue: GLOBE_DEFAULTS.band2Width,
      id: "band-2-width",
      interactiveMax: GLOBE_BAND_WIDTH_MAX,
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "bands.band2.width",
        workloadBoundary: "maximum",
      },
      unit: "%",
    },
    {
      batchMax: GLOBE_BAND_WIDTH_MAX,
      defaultValue: GLOBE_DEFAULTS.band3Width,
      id: "band-3-width",
      interactiveMax: GLOBE_BAND_WIDTH_MAX,
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "bands.band3.width",
        workloadBoundary: "maximum",
      },
      unit: "%",
    },
    {
      batchMax: GLOBE_BAND_WIDTH_MAX,
      defaultValue: GLOBE_DEFAULTS.band4Width,
      id: "band-4-width",
      interactiveMax: GLOBE_BAND_WIDTH_MAX,
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "bands.band4.width",
        workloadBoundary: "maximum",
      },
      unit: "%",
    },
    {
      batchMax: 1,
      defaultValue: GLOBE_DEFAULTS.bandDotSize,
      id: "band-dot-size",
      interactiveMax: 1,
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "bands.dotSize",
        workloadBoundary: "minimum",
      },
      unit: "px",
    },
    {
      batchMax: 3,
      defaultValue: GLOBE_DEFAULTS.bandColumnSpacing,
      id: "band-column-spacing",
      interactiveMax: 3,
      mapping: "direct",
      source: {
        kind: "schema-target",
        target: "bands.columnSpacing",
        workloadBoundary: "minimum",
      },
      unit: "px",
    },
  ],
} as const;

const basePerformance = defineToolcraftPerformance({
  fixtureAdapters: {
    dimensions: {
      "export-long-edge": {
        apply: (value: number) =>
          value === 2048 ? "2k" : value === 8192 ? "8k" : "4k",
        dimensionId: "export-long-edge",
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
        observe: (value: string) =>
          value === "2k" ? 2048 : value === "8k" ? 8192 : 4096,
      },
      "latitude-rings": {
        apply: (value: number) => value,
        dimensionId: "latitude-rings",
        kind: "continuous",
        observe: (value: number) => value,
      },
      "line-thickness": {
        apply: (value: number) => value,
        dimensionId: "line-thickness",
        kind: "continuous",
        observe: (value: number) => value,
      },
      "band-1-width": {
        apply: (value: number) => value,
        dimensionId: "band-1-width",
        kind: "continuous",
        observe: (value: number) => value,
      },
      "band-2-width": {
        apply: (value: number) => value,
        dimensionId: "band-2-width",
        kind: "continuous",
        observe: (value: number) => value,
      },
      "band-3-width": {
        apply: (value: number) => value,
        dimensionId: "band-3-width",
        kind: "continuous",
        observe: (value: number) => value,
      },
      "band-4-width": {
        apply: (value: number) => value,
        dimensionId: "band-4-width",
        kind: "continuous",
        observe: (value: number) => value,
      },
      "band-dot-size": {
        apply: (value: number) => value,
        dimensionId: "band-dot-size",
        kind: "continuous",
        observe: (value: number) => value,
      },
      "band-column-spacing": {
        apply: (value: number) => value,
        dimensionId: "band-column-spacing",
        kind: "continuous",
        observe: (value: number) => value,
      },
      "meridian-rings": {
        apply: (value: number) => value,
        dimensionId: "meridian-rings",
        kind: "continuous",
        observe: (value: number) => value,
      },
    },
  },
  rendererPipeline: globeRendererPipelineRegistration,
  rendererStrategy: "canvas-2d",
  rendererTechnique: {
    exportRenderer: "canvas-2d",
    fidelityRisks: [
      "Canvas preview and export use deterministic front-hemisphere projection to match the semantic globe grid and dotted offset band ribbons.",
      "The adjustable CRT treatment is a source-atop darkening pass, so transparent exports remain transparent and black background pixels stay visually black while foreground lines and dots gain scanline/flicker texture.",
    ],
    intentionalRasterizationReason:
      "The requested landing background is a pixel-based projected globe preview with runtime-owned image export.",
    layers: [
      {
        content: ["geometry"],
        exportMode: "included",
        id: "globe-canvas",
        intentionalRasterizationReason:
          "Dense projected sphere/grid output, width-fitted dotted flat bands, logo masks, and adjustable CRT scanlines are rendered as Canvas 2D pixels in preview.",
        kind: "product-foreground",
        primitiveCount: "medium",
        renderer: "canvas-2d",
        uiSelector: "[data-toolcraft-renderer-layer=\"globe-canvas\"]",
      },
      {
        content: ["geometry"],
        exportMode: "included",
        id: "globe-export",
        intentionalRasterizationReason:
          "Runtime image export receives deterministic Canvas 2D drawing commands for the same globe, dotted band ribbons, logo masks, and fixed-phase adjustable CRT treatment.",
        kind: "export-composite",
        primitiveCount: "medium",
        renderer: "canvas-2d",
      },
    ],
    performanceRisks: [
      "High latitude and meridian counts rebuild visible line geometry, and orientation drag recomputes front-hemisphere segments; the schema caps grid density for interactive use.",
      "Large line widths increase raster fill area but remain capped at 8px.",
      `Band width and dot size change the number of dot rows, with width capped at ${GLOBE_BAND_WIDTH_MAX}% per band and dot size capped to a 1px minimum.`,
      "Column spacing changes the number of dot columns, with the schema capped to a 3px minimum.",
      "Four supplied logo masks add fixed dot classification inside bounded logo rectangles; logo position sliders do not change dot cardinality.",
      "The adjustable CRT pass adds constant-cost source-atop darkening rectangles over the existing raster and uses a fixed export phase; intensity scales alpha only.",
      "The autonomous logo loop updates a cheap reference-paced whole-orbit easing state every frame while existing fixed logo masks slow around their final slider positions with widened row phase offsets and late approach inertia; Hold and Speed change timing only, not dot cardinality.",
    ],
    previewExportDifferenceReason:
      "Preview and export share the same Canvas 2D projection; image export receives a runtime-owned context at the selected artifact dimensions.",
    previewRenderer: "canvas-2d",
    productRepresentation: "pixel",
    rendererStrategy: "canvas-2d",
    sourceRepresentation: "procedural-data",
    whyNotAlternativeStrategies: [
      "DOM cannot represent occluded 3D globe geometry.",
      "SVG would imply editable vector export, which was not requested.",
      "WebGL tube and wide-line preview can introduce horizon clipping artifacts that are undesirable for clean landing-page linework.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope,
} satisfies ToolcraftEnvelopePerformanceConfig);

const derivedPaths = deriveToolcraftPerformancePaths(appSchema, basePerformance);

function scenarioForPath(path: (typeof derivedPaths)[number]) {
  const primaryTarget = path.targets[0] ?? "app.initialRender";
  if (path.interaction === "export") {
    return {
      actionValue: "export.png",
      automated: true,
      automatedTestName: `performance model covers ${path.interaction} for ${primaryTarget}`,
      browser: true,
      browserTestName: `browser perf: landing globe ${path.interaction} ${primaryTarget}`,
      completionEvidence: "download" as const,
      controlLabel: "Export PNG",
      coversTargets: path.targets,
      expectedObservable: "Export downloads a non-empty globe image artifact.",
      fixture: `landing globe ${path.interaction} fixture`,
      id: `performance.${path.interaction}.${primaryTarget}`,
      interaction: path.interaction,
      pathId: path.id,
      target: primaryTarget,
      uiSelector: "[data-toolcraft-renderer-layer=\"globe-canvas\"]",
    };
  }

  return {
    automated: true,
    automatedTestName: `performance model covers ${path.interaction} for ${primaryTarget}`,
    browser: true,
    browserTestName: `browser perf: landing globe ${path.interaction} ${primaryTarget}`,
    coversTargets: path.targets,
    expectedObservable:
      "The rendered globe remains visible while the interaction updates the expected state.",
    fixture: `landing globe ${path.interaction} fixture`,
    id: `performance.${path.interaction}.${primaryTarget}`,
    interaction: path.interaction,
    pathId: path.id,
    target: primaryTarget,
    uiSelector: "[data-toolcraft-renderer-layer=\"globe-canvas\"]",
  };
}

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    ...basePerformance,
    scenarios: derivedPaths.map(scenarioForPath),
  });

import {
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { studioRoomPreviewPipelineRegistration } from "./studio-room-preview-pipeline";
import { studioRoomTargets } from "./studio-room-values";

const studioRoomPerformanceSeed = defineToolcraftPerformance({
  rendererPipeline: studioRoomPreviewPipelineRegistration,
  rendererStrategy: "dom",
  rendererTechnique: {
    exportRenderer: "none",
    fidelityRisks: [
      "The embedded preview depends on the website receiver keeping protocol version 6 compatible.",
      "Cross-origin browser policy prevents Toolcraft from inspecting the website DOM as a fallback.",
      "Uploaded tile images must preserve media order and authored rotate/flip appearance through bounded derivatives.",
    ],
    layers: [
      {
        content: ["bitmap-media", "geometry", "text"],
        exportMode: "excluded",
        id: "external-website-preview",
        kind: "product-foreground",
        primitiveCount: "medium",
        renderer: "dom",
        uiSelector: '[data-toolcraft-product-output="studio-room-external-preview"]',
      },
    ],
    performanceRisks: [
      "The website preview is scheduled independently inside an iframe.",
      "Live edits post one bounded settings payload while the website retains the section DOM.",
      "Tile image collections remain unlimited while preview derivatives cap their longest edge at 1024 pixels.",
      "The inner grid is a static SVG with at most (columns - 1) + (rows - 1) lines, re-rendered only on settings commit.",
      "Canvas pan and zoom do not invalidate the preview settings pass.",
      "Adjacency filtering is O(cells × tiles) only at shuffle ticks.",
    ],
    previewExportDifferenceReason:
      "The user requested only a live website preview, so Toolcraft artifact export is intentionally absent.",
    previewRenderer: "dom",
    productRepresentation: "mixed",
    rendererStrategy: "dom",
    sourceRepresentation: "reference-runtime",
    whyNotAlternativeStrategies: [
      "Rebuilding the section in SVG, Canvas 2D, or WebGL would duplicate the website renderer instead of previewing the real component.",
      "Direct DOM access is unavailable because Toolcraft and the Next.js site run on different origins.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      workloadDimension("grid-columns", studioRoomTargets.gridColumns, 8, 16, "cols"),
      workloadDimension("grid-rows", studioRoomTargets.gridRows, 4, 8, "rows"),
      workloadDimension(
        "grid-depth-divisions",
        studioRoomTargets.gridDepthDivisions,
        4,
        8,
        "divisions",
      ),
      workloadDimension(
        "fine-grid-subdivision",
        studioRoomTargets.fineGridSubdivision,
        3,
        6,
        "subdivisions",
      ),
      workloadDimension("tiles-per-surface", studioRoomTargets.tilesPerSurface, 2, 6, "tiles"),
      workloadDimension("trail-line-amount", studioRoomTargets.trailAmount, 2, 3, "lines"),
      {
        defaultValue: 0,
        id: "tile-image-count",
        batchMax: 64,
        mapping: "direct",
        source: { kind: "schema-target", target: studioRoomTargets.tilesImages },
        unit: "images",
      },
    ],
  },
});

const performancePaths = deriveToolcraftPerformancePaths(appSchema, studioRoomPerformanceSeed);

export const appPerformance: ToolcraftEnvelopePerformanceConfig = defineToolcraftPerformance({
  ...studioRoomPerformanceSeed,
  scenarios: performancePaths.flatMap((path) => {
    if (path.interaction === "export") return [];

    return [
      {
        automated: true,
        automatedTestName: `${path.interaction} follows the declared Studio Room bridge pipeline`,
        browser: true,
        browserTestName: `browser perf: toolcraft path ${path.id}`,
        coversTargets: path.targets,
        expectedObservable:
          path.interaction === "media-import"
            ? "Uploaded ordered tile images reach the website runtime through bounded cached derivatives."
            : path.interaction === "control-change"
              ? "The embedded website section receives and renders the current composition, room, inner-grid, grid, tile, motion, and trail settings."
              : "The Studio Room preview remains synchronized with canonical Toolcraft state.",
        fixture:
          "Recraft Studio Room protocol v6 receiver running at http://localhost:3000/v4styles/toolcraft/studio-room",
        id: `studio-room-preview.${path.interaction}`,
        interaction: path.interaction,
        pathId: path.id,
        uiSelector: '[data-toolcraft-product-output="studio-room-external-preview"]',
      },
    ];
  }),
});

function workloadDimension(
  id: string,
  target: string,
  defaultValue: number,
  interactiveMax: number,
  unit: string,
) {
  return {
    defaultValue,
    id,
    interactiveMax,
    mapping: "direct" as const,
    source: { kind: "schema-target" as const, target, workloadBoundary: "maximum" as const },
    unit,
  };
}

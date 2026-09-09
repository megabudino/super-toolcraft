import {
  defineToolcraftFixtureAdapter,
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
} from "@/toolcraft/runtime";
import { appSchema } from "./app-schema";
import { heroPreviewPipelineRegistration } from "./hero-preview-pipeline";

const heroPreviewPerformanceSeed = defineToolcraftPerformance({
  fixtureAdapters: {
    dimensions: {
      "edge-blur-radius": defineToolcraftFixtureAdapter({
        apply: (value: number) => value,
        dimensionId: "edge-blur-radius",
        observe: (value: number) => value,
      }),
      "lens-samples": defineToolcraftFixtureAdapter({
        apply: (value: number) => Math.round(value),
        dimensionId: "lens-samples",
        observe: (value: number) => value,
      }),
    },
  },
  rendererPipeline: heroPreviewPipelineRegistration,
  rendererStrategy: "dom",
  rendererTechnique: {
    exportRenderer: "none",
    fidelityRisks: [
      "The native preview depends on the website receiver keeping the copied section settings contract compatible.",
      "The section uses canvas dimensions as its viewport, independently of the Toolcraft sidebar.",
      "Per-pixel stratified jitter intentionally adds fine grain, so visual checks assert directional dispersion inside the treated band and clean inner pixels instead of byte identity.",
      "The sixteen bounded roller meshes must share one DOM-measured outward path per side, normalized from the center-facing tangent to the current viewport edge, so gaps, overlaps, and offscreen cards cannot reset or dilute the mirrored cylinder roll.",
      "Cards that cross the camera plane are clipped per triangle on the GPU; classic convex profiles hide content beyond the ball silhouette.",
      "Panel-space zones follow lens longitude/latitude; with extreme bends the band boundary may leave the screen on the equator while remaining visible on other rows.",
    ],
    layers: [
      {
        content: ["bitmap-media", "composite", "geometry", "shader", "text"],
        exportMode: "excluded",
        id: "external-website-preview",
        kind: "product-foreground",
        primitiveCount: "medium",
        renderer: "dom",
        uiSelector: '[data-toolcraft-product-output="hero-native-preview"]',
      },
    ],
    performanceRisks: [
      "Rapid control gestures can enqueue more React settings updates than the child preview can paint.",
      "The copied section retains its original WebGL animation scheduler and cleanup.",
      "The sphere effect runs as one post pass: cost scales with treated-band pixels × samples, not with cards or overlap; scene and field buffers add two RGBA8 viewport-sized framebuffers.",
      "Sample count changes fragment cost linearly up to the bounded 48-tap loop inside treated bands; Rows retain their existing per-card passes.",
      "Defocus radius widens texture-fetch spread inside the bounded 0–48px treated bands without adding taps.",
      "Roll, Safety width, Gap, and Card height update retained Rows geometry and layout uniforms without increasing fixed mesh density; viewport intersection keeps offscreen outer cards from owning active WebGL renderers until wider screens reveal them.",
      "The sphere branch retains one full-viewport WebGL canvas, at most six rows, a bounded 24-image texture set, and no more than 96 card draws into its scene buffer per frame.",
      "Enabled CRT chroma uses three scene texture fetches per blur sample only while the CRT-specific pan-motion envelope is active; Grain uses its separate fixed-decay envelope, and disabled or fully decayed effects keep their uniform-gated branches at zero in the same post pass.",
      "Autonomous row animation remains website-owned and is paused for reduced motion, hidden documents, and offscreen preview output.",
      "Canvas drag writes merged pan values per animation frame; each write updates the retained native scene at constant synchronization cost.",
      "Conservative culling keeps cards that straddle the camera plane; the 96-draw budget prefers cards nearest the viewport centre.",
    ],
    previewExportDifferenceReason:
      "The user explicitly requested independent native apps with no artifact export; the original Hero section mounts directly inside Toolcraft.",
    previewRenderer: "dom",
    productRepresentation: "mixed",
    rendererStrategy: "dom",
    sourceRepresentation: "reference-runtime",
    whyNotAlternativeStrategies: [
      "Rewriting the renderer would risk parity; this app imports an independent local copy of the original DOM and WebGL source.",
      "Native DOM preserves the source markup, styles, events, and WebGL effects in the Toolcraft document.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        batchMax: 48,
        defaultValue: 22,
        id: "edge-blur-radius",
        interactiveMax: 48,
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "dispersion.blur",
          workloadBoundary: "maximum",
        },
        unit: "pixels",
      },
      {
        batchMax: 48,
        defaultValue: 6,
        id: "lens-samples",
        interactiveMax: 48,
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "dispersion.count",
          workloadBoundary: "maximum",
        },
        unit: "samples",
      },
    ],
  },
});

const heroPreviewPaths = deriveToolcraftPerformancePaths(
  appSchema,
  heroPreviewPerformanceSeed,
);

function expectedObservable(interaction: (typeof heroPreviewPaths)[number]["interaction"]): string {
  switch (interaction) {
    case "initial-render":
      return "The embedded website loads and receives the complete default hero settings payload.";
    case "control-change":
    case "control-drag":
      return "The embedded hero visibly reflects the current Toolcraft control values.";
    case "media-import":
      return "Uploaded gallery image blobs, order, transforms, and settings reach the embedded Rows or Sphere renderer.";
    case "viewport-drag":
    case "viewport-zoom":
      return "Toolcraft viewport navigation changes framing without resending or mutating hero settings.";
    default:
      return "The embedded hero remains synchronized with canonical Toolcraft state.";
  }
}

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    ...heroPreviewPerformanceSeed,
    scenarios: heroPreviewPaths.flatMap((path) => {
      if (path.interaction === "export") {
        return [];
      }

      return [
        {
          automated: true,
          automatedTestName: `${path.interaction} follows the declared external preview pipeline`,
          browser: true,
          browserTestName: `browser perf: toolcraft path ${path.id}`,
          coversTargets: path.targets,
          expectedObservable: expectedObservable(path.interaction),
          fixture:
            "Native Hero scene in the standalone Toolcraft app",
          id: `hero-preview.${path.interaction}`,
          interaction: path.interaction,
          pathId: path.id,
          uiSelector: '[data-toolcraft-product-output="hero-native-preview"]',
        },
      ];
    }),
  });

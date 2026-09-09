import {
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { fineDetailsPreviewPipelineRegistration } from "./fine-details-preview-pipeline";

const fineDetailsPerformanceSeed = defineToolcraftPerformance({
  rendererPipeline: fineDetailsPreviewPipelineRegistration,
  rendererStrategy: "dom",
  rendererTechnique: {
    exportRenderer: "none",
    fidelityRisks: [
      "The embedded preview depends on the website receiver keeping the versioned bridge compatible.",
      "The retained grid texture must preserve its native repeated edge pattern as its CSS size changes.",
      "The migrated prompt must retain its existing responsive width, normalized placement, and shadow semantics.",
      "Prompt typing settings must preserve phrase order and exact idle timing while the website owns transient animation state.",
      "The two typography groups must retain exact pixel edge anchors and their registered Gravity and Geist faces.",
      "Uploaded trail images must preserve aspect ratio, media order, and rotate/flip transforms while following the smoothed pointer.",
      "The authored carousel images must preserve intrinsic aspect ratio, centered measured-band placement, and shared border and shadow semantics.",
      "The loading placeholders must keep their measured typography-band geometry while the checker wave restyles only their surface.",
    ],
    layers: [
      {
        content: ["bitmap-media", "geometry"],
        exportMode: "excluded",
        id: "external-website-preview",
        kind: "product-foreground",
        primitiveCount: "medium",
        renderer: "dom",
        uiSelector:
          '[data-toolcraft-product-output="fine-details-external-preview"]',
      },
    ],
    performanceRisks: [
      "The website preview is scheduled independently inside an iframe.",
      "Continuous slider and vector edits post one compact settings payload while the website retains the same grid, typography, and prompt DOM nodes.",
      "Prompt typing controls only synchronize bounded authored configuration; the website owns the self-running requestAnimationFrame lifecycle.",
      "The cursor bridge is coalesced to one scene-coordinate message per animation frame and does not enable pointer events on the iframe.",
      "At most 24 trail cards are retained; media blobs stay runtime-only, decoded presentation URLs are reused, and unused object URLs are revoked after a short grace period.",
      "Trail spawning is disabled for touch input and reduced motion, and naturally stops when the section is not receiving pointer samples.",
      "Carousel mode is bounded to four authored images; CSS transforms own the loop and no extra workload dimension is introduced.",
      "Prompt flight remains a one-shot website transition; breadcrumb count is derived from path length and spacing, capped at 32 blur-free copies, and adds no user-controlled workload dimension or steady-state cost after the bounded vanish sequence completes.",
      "The loading wave is a compositor-driven CSS mask animation on three placeholder cards whose per-frame cost is constant for every slider value; it introduces no workload dimension.",
      "Canvas pan and zoom avoid invalidating the preview settings pass.",
    ],
    previewExportDifferenceReason:
      "The user explicitly removed artifact export; Toolcraft only previews and publishes website settings.",
    previewRenderer: "dom",
    productRepresentation: "mixed",
    rendererStrategy: "dom",
    sourceRepresentation: "reference-runtime",
    whyNotAlternativeStrategies: [
      "Rebuilding the website section in SVG, Canvas 2D, or WebGL would duplicate the real DOM and CSS renderer.",
      "Direct cross-origin DOM access is unavailable between the independently served Toolcraft and Next.js apps.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        defaultValue: 8,
        id: "trail-card-count",
        interactiveMax: 24,
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "trail.length",
          workloadBoundary: "maximum",
        },
        unit: "cards",
      },
    ],
  },
});

const performancePaths = deriveToolcraftPerformancePaths(
  appSchema,
  fineDetailsPerformanceSeed,
);

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    ...fineDetailsPerformanceSeed,
    scenarios: performancePaths.flatMap((path) => {
      if (path.interaction === "export") return [];

      return [
        {
          automated: true,
          automatedTestName: `${path.interaction} follows the declared Fine Details bridge pipeline`,
          browser: true,
          browserTestName: `browser perf: toolcraft path ${path.id}`,
          coversTargets: path.targets,
          expectedObservable:
            path.interaction === "media-import"
              ? "Uploaded images reach the website runtime and become the ordered cursor trail source set."
              : path.interaction === "control-change" || path.interaction === "control-drag"
                ? "The embedded website section receives and renders the current background, selected trail, loading, or carousel mode, image treatment, typography, prompt settings, and bounded one-shot prompt flight breadcrumb transition."
                : "The Fine Details preview remains synchronized with canonical Toolcraft state.",
          fixture:
            "Native Fine Details scene in the standalone Toolcraft app",
          id: `fine-details-preview.${path.interaction}`,
          interaction: path.interaction,
          pathId: path.id,
          uiSelector:
            '[data-toolcraft-product-output="fine-details-external-preview"]',
        },
      ];
    }),
  });

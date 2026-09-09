import {
  assessToolcraftRenderPlan,
  defineToolcraftFixtureAdapter,
  defineToolcraftPerformance,
  defineToolcraftSchemaDiscreteFixtureAdapter,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { dispersionCarouselRendererPipelineRegistration } from "./dispersion-carousel/dispersion-carousel-pipeline";
import { DISPERSION_CAROUSEL_DEFAULTS } from "./dispersion-carousel/dispersion-carousel-values";

const imageResolutionAdapter = defineToolcraftSchemaDiscreteFixtureAdapter(
  appSchema,
  {
    dimensionId: "image-long-edge",
    entries: [
      { appliedValue: "2k", value: 2048 },
      { appliedValue: "4k", value: 4096 },
      { appliedValue: "8k", value: 8192 },
    ],
    target: "export.image.resolution",
  },
);

const lensSamplesAdapter = defineToolcraftFixtureAdapter({
  apply: (value: number) => Math.round(value),
  dimensionId: "lens-samples",
  observe: (value: number) => value,
});

const edgeBlurAdapter = defineToolcraftFixtureAdapter({
  apply: (value: number) => value,
  dimensionId: "edge-blur-radius",
  observe: (value: number) => value,
});

const basePerformance = {
  fixtureAdapters: {
    dimensions: {
      "edge-blur-radius": edgeBlurAdapter,
      "image-long-edge": imageResolutionAdapter,
      "lens-samples": lensSamplesAdapter,
    },
  },
  rendererPipeline: dispersionCarouselRendererPipelineRegistration,
  rendererStrategy: "webgl" as const,
  rendererTechnique: {
    exportRenderer: "canvas-2d" as const,
    fidelityRisks: [
      "Per-pixel stratified jitter gives the smear an intentional film-grain quality, so acceptance proves visible edge separation and clean-center behavior rather than byte identity.",
      "The supplied card images are exact 2x PNG sources assembled once into a retained strip texture; 8K delivery preserves output dimensions but may upscale those fixed source pixels.",
      "Canvas 2D and browser DOM use the same Figtree font and wrapping width for testimonials, but rasterized glyph antialiasing can vary slightly by output backing.",
    ],
    intentionalRasterizationReason:
      "The stationary edge treatment is a multi-tap spectral image filter over retained image and optional testimonial textures and requires raster texture sampling.",
    layers: [
      {
        content: ["text"],
        exportMode: "included" as const,
        id: "carousel-dom-text",
        kind: "product-foreground" as const,
        primitiveCount: "low" as const,
        renderer: "dom" as const,
        uiSelector: '[data-carousel-header="true"]',
      },
      {
        content: ["bitmap-media", "composite", "shader", "text"],
        exportMode: "composited" as const,
        id: "dispersion-rail",
        intentionalRasterizationReason:
          "One screen-space WebGL pass owns every visible card-image pixel and, when selected, testimonial pixels: spectral dispersion, defocus, aura, edge fade, and velocity streaking over two retained strip textures.",
        kind: "product-foreground" as const,
        primitiveCount: "low" as const,
        renderer: "webgl" as const,
        uiSelector: '[data-dispersion-rail="true"]',
      },
      {
        content: ["handles"],
        exportMode: "excluded" as const,
        id: "carousel-interaction-rail",
        kind: "editing-handles" as const,
        primitiveCount: "low" as const,
        renderer: "dom" as const,
        uiSelector: '[data-carousel-base="true"]',
      },
      {
        content: ["handles"],
        exportMode: "excluded" as const,
        id: "carousel-navigation-handles",
        kind: "editing-handles" as const,
        primitiveCount: "low" as const,
        renderer: "dom" as const,
        uiSelector: '[data-carousel-navigation="true"]',
      },
    ],
    performanceRisks: [
      "Sample count changes fragment cost linearly up to the bounded 48-tap loop, and pixels outside the edge zones early-exit to one tap.",
      "Defocus radius widens texture-fetch spread inside the bounded 0–48px range without adding taps.",
      "The full-width rail keeps one retained WebGL canvas at exact CSS × devicePixelRatio × selected Resolution-scale backing.",
      "Carousel motion executes the canonical preview pass with only scroll/velocity uniform uploads; settings uploads and identical full-quality frames are reused, and the velocity loop stops when motion settles.",
      "Exact source-derived text row bounds avoid transparent testimonial reads, and a conservative vertical sample envelope skips fully transparent fragments without changing spectral tap counts or optical reach.",
      "Infinite navigation repeats only lightweight DOM interaction cards; WebGL retains one five-card cycle texture and wraps its horizontal sample coordinate instead of allocating repeated GPU sources.",
      "Text effect changes one boolean uniform; both retained textures remain allocated so switching modes does not upload or rebuild source data.",
      "8K still export re-renders the same pass once at export backing and can create temporary GPU and bitmap memory pressure.",
    ],
    previewExportDifferenceReason:
      "Preview keeps native DOM scrolling over three equivalent interaction cycles driving one wrapped WebGL rail; export draws the heading and a deterministic velocity-free snapshot of the normalized cycle position into the runtime-owned Canvas 2D artifact context.",
    previewRenderer: "webgl" as const,
    productRepresentation: "pixel" as const,
    referenceRendererChangeReason:
      "The inspected reference supplies DOM scroll mechanics but no dispersion renderer; the user explicitly requires a stationary screen-space aura the cards pass through, which needs one custom WebGL pass.",
    rendererStrategy: "webgl" as const,
    sourceRepresentation: "mixed" as const,
    whyNotAlternativeStrategies: [
      "DOM/CSS filters cannot anchor a continuous spectral smear to the viewport while content scrolls beneath it, and stacked backdrop-filter bands produce visible banding.",
      "Canvas 2D cannot run the per-pixel stratified spectral loop at interactive frame rates across the full rail.",
      "A fully WebGL carousel would discard the inspected native scroll-snap and keyboard semantics that the user asked to preserve.",
    ],
  },
  scenarios: [] as readonly ToolcraftPerformanceScenario[],
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        batchMax: 48,
        defaultValue: DISPERSION_CAROUSEL_DEFAULTS.blur,
        id: "edge-blur-radius",
        interactiveMax: 48,
        mapping: "direct" as const,
        source: {
          kind: "schema-target" as const,
          target: "dispersion.blur",
          workloadBoundary: "maximum" as const,
        },
        unit: "pixels",
      },
      {
        batchMax: 8192,
        defaultValue: 4096,
        id: "image-long-edge",
        mapping: "quadratic" as const,
        source: {
          kind: "schema-target" as const,
          target: "export.image.resolution",
        },
        unit: "pixels",
      },
      {
        batchMax: 48,
        defaultValue: DISPERSION_CAROUSEL_DEFAULTS.count,
        id: "lens-samples",
        interactiveMax: 48,
        mapping: "direct" as const,
        source: {
          kind: "schema-target" as const,
          target: "dispersion.count",
          workloadBoundary: "maximum" as const,
        },
        unit: "samples",
      },
    ],
  },
} satisfies ToolcraftEnvelopePerformanceConfig;

const performancePaths = deriveToolcraftPerformancePaths(
  appSchema,
  basePerformance,
);

const scenarios: readonly ToolcraftPerformanceScenario[] = performancePaths.map(
  (path, index): ToolcraftPerformanceScenario => {
    const common = {
      automated: true,
      automatedTestName:
        "dispersion carousel performance config derives every scenario from the canonical pipeline",
      browser: true,
      browserTestName: `browser perf: dispersion carousel path ${path.id}`,
      coversTargets: path.targets,
      expectedObservable: path.interaction.startsWith("viewport-")
        ? "The Toolcraft or carousel viewport moves while the retained dispersion-rail source and selected output quality remain stable."
        : "The preview or delivered still persistently reflects the compiled edge-dispersion fixture values.",
      fixture: `compiled-dispersion-carousel-${path.id}`,
      id: `dispersion-carousel-path-${String(index + 1).padStart(2, "0")}`,
      pathId: path.id,
      target: path.targets.length === 1 ? path.targets[0] : undefined,
      uiSelector: '[data-dispersion-carousel="true"]',
    };

    if (path.interaction === "export") {
      return {
        ...common,
        actionValue: "export.png",
        completionEvidence: "download",
        controlLabel: "Export PNG",
        interaction: "export",
      };
    }

    return { ...common, interaction: path.interaction };
  },
);

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    ...basePerformance,
    scenarios,
  });

export const appRenderPlanAssessment = assessToolcraftRenderPlan(
  appSchema,
  appPerformance,
);

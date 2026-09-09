import type { ToolcraftComponentAcceptance } from "./acceptance/types";
import { appSchema } from "./app-schema";
import { dispersionCarouselTargets } from "./dispersion-carousel/dispersion-carousel-values";
import {
  appControlSectionInventory,
  appProductReadiness,
  appTransferMode,
} from "./dispersion-carousel/dispersion-carousel-readiness";
export const DISPERSION_CAROUSEL_AUTOMATED_TEST = "maps the Figma carousel and dispersion controls to deterministic output";
export const DISPERSION_CAROUSEL_REFERENCE_BROWSER_TEST = "browser: Dispersion Carousel matches the inspected Figma and carousel reference";
export const DISPERSION_CAROUSEL_CANVAS_WIDTH_BROWSER_TEST = "browser: Dispersion Carousel canvas width clips the fixed Figma composition";
export const DISPERSION_CAROUSEL_CANVAS_HEIGHT_BROWSER_TEST = "browser: Dispersion Carousel canvas height clips the fixed Figma composition";
export const DISPERSION_CAROUSEL_EDGE_BROWSER_TEST = "browser: Dispersion Carousel edge zone confines the stationary screen-space aura";
export const DISPERSION_CAROUSEL_BLUR_BROWSER_TEST = "browser: Dispersion Carousel edge defocus grows toward both outside edges";
export const DISPERSION_CAROUSEL_TEXT_EFFECT_BROWSER_TEST = "browser: Dispersion Carousel switches testimonials between shader and clean DOM text";
export const DISPERSION_CAROUSEL_APPEARANCE_BROWSER_TEST = "browser: Dispersion Carousel background color changes product output";
export const DISPERSION_CAROUSEL_FORMAT_BROWSER_TEST = "browser: Dispersion Carousel exports the selected image format";
export const DISPERSION_CAROUSEL_RESOLUTION_BROWSER_TEST = "browser: Dispersion Carousel exports the selected image resolution";
export const DISPERSION_CAROUSEL_ACTION_BROWSER_TEST = "browser: Dispersion Carousel sticky action exports the current still";
export const DISPERSION_CAROUSEL_BACKGROUND_EXPORT_BROWSER_TEST = "browser: Dispersion Carousel excludes background from preview and export";
export const DISPERSION_CAROUSEL_QUALITY_BROWSER_TEST = "browser: Dispersion Carousel preserves selected raster quality";
export const DISPERSION_CAROUSEL_INFINITY_BROWSER_TEST = "browser: Dispersion Carousel switches Infinity canvas and restores the finite crop";
export const DISPERSION_CAROUSEL_INFINITY_EXPORT_BROWSER_TEST = "browser: Dispersion Carousel infinite export uses exact scene bounds";
export const DISPERSION_CAROUSEL_PERSISTENCE_BROWSER_TEST = "browser: Dispersion Carousel restores values, canvas, and panels after reload";
const FIXTURE = "Five exact supplied x2 image sources plus the five exact Figma testimonials composed into a seamless 2320×560 five-card cycle with 12px radii in a white 1920×1034 frame, 160px vertical padding, initial normalized scroll 1856, testimonial dispersion enabled, 13% symmetric edge zones with 1.15 falloff, and the default screen-space dispersion recipe: 85px dispersion, 20 samples, 0.67 spectrum, zero blur, 0.69 aura, 0.51 edge fade, 0.45 motion boost, an 8px stationary Stretch warp offset 1% inward with a 3px Ripple wave at 336px length and zero wave blur, and a 147px boundary light band positioned 9% inward from each edge at 0.49 glow with 7px refraction, with 0.79 halo turbulence at 168px wavelength.";
type ControlAcceptanceEntry = Omit<ToolcraftComponentAcceptance, "automated" | "automatedTestName" | "browser" | "browserTestName" | "fixture" | "kind"> & { browserTestName: string };
function controlAcceptance(entry: ControlAcceptanceEntry): ToolcraftComponentAcceptance {
  return {
    ...entry,
    automated: true, automatedTestName: DISPERSION_CAROUSEL_AUTOMATED_TEST, browser: true,
    browserTestName: entry.browserTestName,
    fixture: FIXTURE, kind: "control",
  };
}
export function getDispersionCarouselControlBrowserTestName(target: string): string {
  return `browser: Dispersion Carousel control ${target} changes the edge-dispersed output`;
}
function effectControl(id: string, label: string, expectedObservable: string): ToolcraftComponentAcceptance {
  return controlAcceptance({
    browserTestName: getDispersionCarouselControlBrowserTestName(id),
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable,
    id,
    target: id,
    userAction: `Drag ${label} through a visibly different value.`,
  });
}
export { appControlSectionInventory, appProductReadiness, appTransferMode };
const target = dispersionCarouselTargets;
const appAcceptanceEntries: readonly ToolcraftComponentAcceptance[] = [
  {
    ...controlAcceptance({
      browserTestName: DISPERSION_CAROUSEL_CANVAS_WIDTH_BROWSER_TEST,
      componentType: "text",
      evidence: "rendered-pixels",
      expectedObservable:
        "Changing canvas width crops the fixed-size title and 448px cards without rescaling the carousel track, and the edge zones follow the new frame.",
      id: "canvas.size.width",
      referenceCoverage: "canvas-sizing",
      target: "canvas.size.width",
      userAction: "Enter a narrower Canvas width and inspect the clipped rail.",
    }),
    kind: "runtime",
  },
  {
    automated: true,
    automatedTestName: DISPERSION_CAROUSEL_AUTOMATED_TEST,
    browser: true,
    browserTestName: DISPERSION_CAROUSEL_INFINITY_BROWSER_TEST,
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity canvas removes the finite clipping frame, preserves viewport navigation, persists across reload, and restores the dormant 1920×1034 size.",
    fixture: FIXTURE,
    id: "canvas.infinity.mode-and-restoration",
    infinityCanvasCoverage: "mode-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction:
      "Enable Infinity canvas, pan, reload, disable it, and prove undo/redo restores each mode.",
  },
  {
    automated: true,
    automatedTestName: DISPERSION_CAROUSEL_AUTOMATED_TEST,
    browser: true,
    browserTestName: DISPERSION_CAROUSEL_INFINITY_EXPORT_BROWSER_TEST,
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "Finite export uses the editable 1920×1034 crop while infinite export uses the exact 2304×1034 scene bounds.",
    fixture: FIXTURE,
    id: "canvas.infinity.scene-bounds-image-export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Export at 2K in finite and infinite modes and decode both sizes.",
  },
  {
    ...controlAcceptance({
      browserTestName: DISPERSION_CAROUSEL_CANVAS_HEIGHT_BROWSER_TEST,
      componentType: "text",
      evidence: "rendered-pixels",
      expectedObservable:
        "Changing canvas height crops the fixed 1034px output, including the 160px top and bottom padding, without changing card dimensions or 12px radii.",
      id: "canvas.size.height",
      target: "canvas.size.height",
      userAction: "Enter a shorter Canvas height and inspect the clipped composition.",
    }),
    kind: "runtime",
  },
  {
    ...controlAcceptance({
      browserTestName: DISPERSION_CAROUSEL_QUALITY_BROWSER_TEST,
      componentType: "slider",
      evidence: "rendered-pixels",
      expectedObservable:
        "Resolution scale preserves CSS geometry and allocates exact dispersion-rail WebGL backing pixels during interaction and steady state.",
      id: "canvas.renderScale",
      renderScaleCoverage: {
        kind: "selected-backing-pixels",
        states: ["interaction", "steady"],
      },
      target: "canvas.renderScale",
      userAction: "Select Resolution scale 2 and compare CSS and WebGL backing dimensions.",
    }),
    kind: "runtime",
  },
  {
    ...controlAcceptance({
      browserTestName: DISPERSION_CAROUSEL_REFERENCE_BROWSER_TEST,
      componentType: "carousel",
      evidence: "rendered-pixels",
      expectedObservable:
        "Next, previous, mouse drag, native touch/wheel, and ArrowLeft/ArrowRight move the exact five-card rail through stationary edge zones indefinitely in both directions. Mouse movement updates full-quality pixels while held, preserves canvas position, continues outside the rail through pointer capture, and retains the exact release position without delayed snapping or rebound. The mouse-selected position survives reload; wheel and keyboard retain their existing card alignment.",
      id: "carousel.scroll",
      interactionId: "carousel-loop-navigation",
      referenceCoverage: "renderer-state",
      target: "controls.setValue",
      userAction:
        "Drag the cards with the primary mouse button in both directions, hold without premature snapping, release outside the rail, and verify the chosen position stays unchanged beyond the old snap delay and after reload. Also continue across the seam with arrows, keyboard and native horizontal scrolling.",
    }),
    kind: "runtime",
  },
  {
    ...effectControl(
      target.edgeWidth,
      "Edge width",
      "The stationary symmetric zones expand or contract while the center of the rail stays clean.",
    ),
    browserTestName: DISPERSION_CAROUSEL_EDGE_BROWSER_TEST,
    interactionId: "edge-zone-width",
    referenceCoverage: "control-mapping",
  },
  {
    ...controlAcceptance({
      browserTestName: DISPERSION_CAROUSEL_TEXT_EFFECT_BROWSER_TEST,
      componentType: "switch",
      evidence: "rendered-pixels",
      expectedObservable:
        "On composites testimonial pixels into the same dispersion, blur, aura, fade, and refraction samples as the images; off leaves a scroll-synchronized clean DOM text overlay without changing card geometry or position.",
      id: target.includeText,
      target: target.includeText,
      userAction: "Toggle Text effect off and on while a testimonial crosses an edge zone.",
    }),
    interactionId: "testimonial-effect-mode",
    referenceCoverage: "control-mapping",
  },
  effectControl(
    target.curve,
    "Falloff",
    "The ramp between the clean center and the fully treated edge visibly steepens or softens.",
  ),
  effectControl(
    target.edgeFade,
    "Edge fade",
    "The outermost pixels dissolve further into the page background at the viewport boundary.",
  ),
  {
    ...effectControl(
      target.turbulence,
      "Turbulence",
      "The edge halos change between a smooth envelope and a visibly ragged organic contour.",
    ),
    referenceCoverage: "control-mapping",
  },
  effectControl(
    target.turbulenceScale,
    "Turbulence size",
    "The wavelength of the ragged halo contour visibly coarsens or tightens.",
  ),
  {
    ...effectControl(
      target.warp,
      "Warp",
      "Cards in the edge zones bend and barrel more or less while the center stays flat.",
    ),
    interactionId: "edge-zone-warp",
    referenceCoverage: "control-mapping",
  },
  {
    ...controlAcceptance({
      browserTestName: getDispersionCarouselControlBrowserTestName(
        target.warpStyle,
      ),
      componentType: "segmented",
      evidence: "rendered-pixels",
      expectedObservable:
        "Stretch keeps the gradual barrel warp; Prism kinks cards at the inner zone face and offsets them after they cross, like a refractive prism edge.",
      id: target.warpStyle,
      target: target.warpStyle,
      userAction: "Select Prism and compare the warp against Stretch.",
    }),
    interactionId: "edge-zone-warp-style",
    optionCoverage: ["stretch", "prism"],
  },
  effectControl(
    target.warpFace,
    "Face width",
    "The prism face thickens or thins, changing how far the kink occupies as cards travel through it.",
  ),
  effectControl(
    target.warpSharpness,
    "Sharpness",
    "The prism-face kink snaps more tightly or softens into a broader entry.",
  ),
  effectControl(
    target.warpOffset,
    "Offset",
    "The warp band slides inward from both viewport edges while Offset 0 keeps cards flush against the rim.",
  ),
  {
    ...controlAcceptance({
      browserTestName: getDispersionCarouselControlBrowserTestName(
        target.warpWaveEnabled,
      ),
      componentType: "switch",
      evidence: "rendered-pixels",
      expectedObservable:
        "Turning Wave on distorts cards in the warp band with the selected Kind; turning it off restores the unrippled Stretch or Prism profile.",
      id: target.warpWaveEnabled,
      target: target.warpWaveEnabled,
      userAction: "Toggle Wave and inspect the warp band.",
    }),
  },
  {
    ...controlAcceptance({
      browserTestName: getDispersionCarouselControlBrowserTestName(
        target.warpWaveKind,
      ),
      componentType: "segmented",
      evidence: "rendered-pixels",
      expectedObservable:
        "Ripple restores the earlier sideways sine; Glass refracts through a rippled slab with lensing folds.",
      id: target.warpWaveKind,
      target: target.warpWaveKind,
      userAction: "Select Ripple and compare the wave against Glass.",
    }),
    optionCoverage: ["glass", "ripple"],
  },
  effectControl(
    target.warpWave,
    "Strength",
    "The selected wave kind pushes or lenses cards more or less inside the warp band.",
  ),
  effectControl(
    target.warpWaveLength,
    "Length",
    "The ripples stack tighter or stretch into slower waves.",
  ),
  effectControl(
    target.warpWaveBlur,
    "Blur",
    "The wave pattern softens and cards inside the warp band go more out of focus.",
  ),
  {
    ...effectControl(
      target.amount,
      "Dispersion",
      "The spectral smear cards reach at the outer edge visibly widens.",
    ),
    interactionId: "dispersion-optics",
    referenceCoverage: "control-mapping",
  },
  effectControl(
    target.count,
    "Samples",
    "The bounded stratified sampling loop changes smear smoothness.",
  ),
  effectControl(
    target.spectrum,
    "Spectrum",
    "The smear blends from a neutral streak into a fully saturated spectrum.",
  ),
  effectControl(
    target.hue,
    "Hue",
    "The generated spectrum rotates through visibly different colors.",
  ),
  {
    ...effectControl(
      target.blur,
      "Blur",
      "Defocus grows toward both outside edges while the center remains sharp.",
    ),
    browserTestName: DISPERSION_CAROUSEL_BLUR_BROWSER_TEST,
    interactionId: "dispersion-blur",
    referenceCoverage: "control-mapping",
  },
  effectControl(
    target.aura,
    "Aura",
    "The additive halo bleeding past the card edges inside the zone visibly strengthens.",
  ),
  effectControl(
    target.velocity,
    "Motion boost",
    "Scrolling produces a visibly stronger or weaker velocity streak across the rail.",
  ),
  effectControl(
    target.gateOffset,
    "Edge offset",
    "Both stationary light bands move symmetrically inward or outward from their nearest canvas edges.",
  ),
  effectControl(
    target.gateWidth,
    "Band width",
    "Each stationary light band visibly widens or narrows around its selected edge offset.",
  ),
  {
    ...effectControl(
      target.gateGlow,
      "Glow",
      "Cards crossing the boundary band flare visibly brighter or dimmer.",
    ),
    interactionId: "aura-gate-band",
    referenceCoverage: "control-mapping",
  },
  effectControl(
    target.gateRefraction,
    "Refraction",
    "Pixels crossing the band bend visibly more or less, like a glass ridge.",
  ),
  controlAcceptance({
    backgroundOutputCoverage: "all-required-background-output",
    browserTestName: DISPERSION_CAROUSEL_BACKGROUND_EXPORT_BROWSER_TEST,
    componentType: "switch",
    evidence: "exported-bytes",
    expectedObservable:
      "Background off hides the bounded preview fill and produces transparent PNG background pixels.",
    id: target.includeBackground,
    target: target.includeBackground,
    userAction: "Toggle Background off and export a PNG.",
  }),
  controlAcceptance({
    browserTestName: DISPERSION_CAROUSEL_APPEARANCE_BROWSER_TEST,
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Background color changes the visible finite product frame and the included still-image background.",
    id: target.background,
    target: target.background,
    userAction: "Enter a contrasting Background color.",
  }),
  {
    ...controlAcceptance({
      browserTestName: DISPERSION_CAROUSEL_FORMAT_BROWSER_TEST,
      componentType: "select",
      evidence: "exported-bytes",
      expectedObservable:
        "PNG preserves optional alpha while JPG produces opaque JPEG bytes.",
      id: target.imageFormat,
      target: target.imageFormat,
      userAction: "Export PNG and JPG and inspect decoded MIME type.",
    }),
    optionCoverage: ["png", "jpg"],
  },
  {
    ...controlAcceptance({
      browserTestName: DISPERSION_CAROUSEL_RESOLUTION_BROWSER_TEST,
      componentType: "select",
      evidence: "exported-bytes",
      expectedObservable:
        "2K, 4K, and 8K choices produce exact aspect-preserving decoded dimensions.",
      id: target.imageResolution,
      target: target.imageResolution,
      userAction: "Export at 2K, 4K, and 8K and inspect decoded dimensions.",
    }),
    optionCoverage: ["2k", "4k", "8k"],
  },
  controlAcceptance({
    actionCoverage: ["export.png"],
    browserTestName: DISPERSION_CAROUSEL_ACTION_BROWSER_TEST,
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "The sticky export action shows real progress and downloads the current clipped carousel with its stationary edge treatment.",
    exportArtifactCoverage: ["all-required-image-export-behavior"],
    id: "export.actions",
    referenceCoverage: "export-copy",
    target: "actions.output",
    userAction: "Run Export PNG and decode the delivered image.",
  }),
  {
    automated: true,
    automatedTestName: DISPERSION_CAROUSEL_AUTOMATED_TEST,
    browser: true,
    browserTestName: DISPERSION_CAROUSEL_PERSISTENCE_BROWSER_TEST,
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Effect values, the normalized position inside the carousel cycle, canvas size, and Controls panel state restore after a real reload.",
    fixture: FIXTURE,
    id: "runtime.persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices:
      appSchema.persistence.storage === "localStorage"
        ? appSchema.persistence.include
        : [],
    target: "canvas.size.width",
    userAction:
      "Change dispersion, move the carousel, resize the canvas, collapse Controls, wait for persistence, and reload.",
  },
];
export const appAcceptance: readonly ToolcraftComponentAcceptance[] =
  appAcceptanceEntries;

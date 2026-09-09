import type {
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "../acceptance/types";

import { dispersionCarouselTargets } from "./dispersion-carousel-values";

const target = dispersionCarouselTargets;

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  behaviorCoverage: ["canvas-sizing", "control-mapping", "export-copy", "renderer-state"],
  mode: "reference-runtime-clone",
  referenceFeatureInventory: [
    {
      acceptanceId: "carousel.scroll",
      behaviorEvidence:
        "The original running carousel scrolls one 448px card per arrow press, snaps horizontally, updates disabled arrow state, and responds to ArrowLeft/ArrowRight.",
      featureName: "Native snap carousel mechanics",
      id: "reference.native-snap-carousel",
      referenceBehavior:
        "The rail uses native horizontal scrolling, mandatory snap, card-width arrow steps, keyboard navigation, and observer-backed previous/next availability.",
      sourceEvidence:
        "Wireframes Aug 12 2026/src/components/ui/snap-slider.tsx and features-cards--slider-column.tsx, verified in the restored Next.js app at localhost:3000.",
      status: "ported",
      toolcraftMapping:
        "The product rail preserves native scroll, card-pitch steps, snap, keyboard input, and delayed persistence, then repeats three equivalent DOM cycles and rebases to the middle copy so navigation continues in both directions; one wrapped WebGL cycle owns every visible card pixel.",
    },
    {
      acceptanceId: "carousel.scroll",
      behaviorEvidence:
        "Figma node 6811:7821 exposes five 448×560 customer-story cards in a 2304px track with 16px gaps, 24px padding, and bottom-aligned 20px/1.3 Figtree Regular testimonials.",
      featureName: "Figma customer-story composition",
      id: "reference.figma-composition",
      referenceBehavior:
        "The heading, Figtree typography, arrow pill, revised card order, exact testimonials, card dimensions, and rail spacing match the supplied Figma frames.",
      sourceEvidence:
        "Figma design BZvXRLFX2bR57Gza4vhyxI nodes 6737:6662 and 6811:7821 supplied the composition, live testimonials and type metrics. The user subsequently requested: перегенерируй все изображения в этом же стиле просто чтобы они выглядели по другому и были по факту другими и разными. Five new imagegen photographs replace the supplied sources at the same 896×1120 dimensions; docs/image-refresh-prompts.md records the art-direction references and prompts.",
      status: "intentionally-changed",
      toolcraftMapping:
        "Each DOM card combines a distinct regenerated photograph with rewritten live copy at the user’s request: поменяй все текста сохраняя объем текста. напиши осмысленные текста. The headline keeps two lines; paragraphs preserve their original 3/3/4/4/3 line counts. Retained image and text textures preserve the composition, brand marks, card alpha and 160px vertical inset.",
    },
    {
      acceptanceId: "canvas.size.width",
      behaviorEvidence:
        "The requested sandbox treats the editable Toolcraft canvas as the visible window around the wider carousel track.",
      featureName: "Editable clipping frame",
      id: "toolcraft.canvas-clipping",
      referenceBehavior:
        "The reference carousel is clipped by its containing section viewport.",
      sourceEvidence:
        "The source SnapSlider uses overflow-x-auto in a bounded parent; the user explicitly requested that changing canvas size crop the carousel.",
      status: "toolcraft-native",
      toolcraftMapping:
        "Editable canvas width and height clip the fixed Figma composition without rescaling its cards, and the stationary edge zones follow the visible frame.",
    },
    {
      acceptanceId: target.includeText,
      behaviorEvidence:
        "The user explicitly requested that the optical effect always apply to the cards and optionally apply to their testimonial text.",
      featureName: "Optional testimonial dispersion",
      id: "toolcraft.optional-text-dispersion",
      referenceBehavior:
        "Text is one laid-out card component with the image; its selected mode either enters the identical edge shader or stays optically clean above the distorted card.",
      sourceEvidence:
        "Figma node 6811:7821 supplies the exact text and typography; the user explicitly requested an option to apply the effect to text too.",
      status: "toolcraft-native",
      toolcraftMapping:
        "One canonical testimonial array renders the accessible DOM paragraphs and a retained transparent text texture. Text effect selects that texture inside the same shader; off exposes a scroll-synchronized clean DOM text track.",
    },
    {
      acceptanceId: target.edgeWidth,
      behaviorEvidence:
        "Across both supplied still references and the user's iteration feedback, the aura is anchored to the viewport sides while card content moves through it; the user explicitly rejected curved geometry and rejected the previous content-anchored composite because cards carried a frozen distortion instead of passing through the zone.",
      featureName: "Stationary screen-space edge aura",
      id: "toolcraft.screen-space-edge-dispersion",
      referenceBehavior:
        "Broad color-separated dispersion, defocus, and a soft halo occupy fixed regions at both viewport sides; every card progressively enters, saturates, and exits that treatment while the center stays clean.",
      sourceEvidence:
        "Two supplied PNG references re-reviewed at original resolution plus the user's explicit description that cards must pass through a stationary aura.",
      status: "toolcraft-native",
      toolcraftMapping:
        "One WebGL pass computes the effect field from the canvas coordinate while the strip texture translates underneath with native scroll, so dispersion, blur, aura, and fade stay anchored to the viewport edges.",
    },
    {
      acceptanceId: target.turbulence,
      behaviorEvidence:
        "In both supplied still references the edge halos are ragged and organic — uneven tongues of color with varying reach — and the user explicitly asked for configurable irregular halos like those references.",
      featureName: "Irregular edge halos",
      id: "toolcraft.irregular-edge-halos",
      referenceBehavior:
        "The dissolving edges are not straight washes: the smear and halo reach varies row by row in soft organic waves, strongest at the outside boundary.",
      sourceEvidence:
        "The two originally supplied PNG references re-reviewed for halo contour, plus the user's explicit request for configurable irregular halos at the edges.",
      status: "toolcraft-native",
      toolcraftMapping:
        "A deterministic two-octave value-noise field, sampled per row and morphing slowly with scroll, modulates the smear span, the halo reach, its gain, and a vertical waviness; Turbulence sets the strength and Turbulence size the wavelength, and zero restores the smooth envelope.",
    },
    {
      acceptanceId: target.warp,
      behaviorEvidence:
        "The user asked for warp distortion on top of the exported edge recipe so cards geometrically bend while they travel through the stationary field.",
      featureName: "Stationary edge warp",
      id: "toolcraft.stationary-edge-warp",
      referenceBehavior:
        "Cards stretch and barrel as they enter the viewport-anchored edge zones; the center stays flat; zero warp restores the previous sampling.",
      sourceEvidence:
        "User request to include warp distortion with the exported settings as the new default recipe.",
      status: "toolcraft-native",
      toolcraftMapping:
        "edgeZone.warp, warpStyle, warpOffset, warpWaveEnabled, warpWaveKind, warpWave, warpWaveLength, warpWaveBlur, warpFace, and warpSharpness displace the screen-space sample coordinate. Offset 0 pins the band flush to the rim; Wave Kind selects the earlier sine ripple or refractive glass; Blur softens and defocuses that band.",
    },
    {
      acceptanceId: target.blur,
      behaviorEvidence:
        "In both supplied still references, the center cards retain readable detail while the outside cards lose high-frequency detail continuously toward the viewport boundary.",
      featureName: "Progressive edge defocus",
      id: "toolcraft.progressive-edge-blur",
      referenceBehavior:
        "Defocus strength approaches zero at the inner edge-zone boundary and reaches its maximum at each outside edge, integrated with the chromatic smear rather than layered after it.",
      sourceEvidence:
        "The two supplied PNG references were reviewed at original resolution; the previous stacked backdrop-filter bands were rejected for visible banding and a hard inner boundary.",
      status: "toolcraft-native",
      toolcraftMapping:
        "The dispersion shader integrates defocus into the same stratified spectral sampling loop with per-pixel jitter, so preview and export blur are continuous and identical.",
    },
    {
      acceptanceId: target.gateGlow,
      behaviorEvidence:
        "The user marked the zone boundary with a vertical line on the running product and asked for the aura as a light band there that cards pass through.",
      featureName: "Stationary boundary light band",
      id: "toolcraft.boundary-light-band",
      referenceBehavior:
        "A vertical light curtain stands at the inner boundary of each edge zone; crossing cards flare, pick up prism rims, and refract as through a glass ridge, and scroll speed briefly intensifies the flash.",
      sourceEvidence:
        "The user's annotated screenshot of the running product with the marked vertical boundary plus the confirmed \"light band on the boundary\" choice.",
      status: "toolcraft-native",
      toolcraftMapping:
        "The dispersion shader evaluates a gaussian band around an independently adjustable edge-offset coordinate: a monotonic glass-ridge displacement refracts crossing pixels, and a neutral-core prism-rimmed glow lifts them, with offset, width, glow, and refraction as auraGate targets.",
    },
    {
      acceptanceId: target.amount,
      behaviorEvidence:
        "The request explicitly requires adjustable dispersion, blur, and aura strength for the edge treatment.",
      featureName: "Dispersion parameter sandbox",
      id: "toolcraft.dispersion-controls",
      referenceBehavior:
        "The reference look combines spectral smear width, spectrum saturation, halo strength, edge fade, and motion streaking.",
      sourceEvidence:
        "The two supplied PNG references and the user's explicit request for configurable dispersion with blur and aura.",
      status: "toolcraft-native",
      toolcraftMapping:
        "Built-in Toolcraft sliders write the shader uniforms directly: dispersion width, sample count, spectrum, hue, blur, aura, edge zone width, falloff, edge fade, and motion boost.",
    },
    {
      acceptanceId: "export.actions",
      behaviorEvidence:
        "A sandbox output needs a reusable still artifact of the current clipped carousel and dispersion recipe.",
      featureName: "Still-image delivery",
      id: "toolcraft.image-export",
      referenceBehavior:
        "The current visible carousel state is the authored result.",
      sourceEvidence:
        "Toolcraft image-export contract and the user-requested canvas-clipped sandbox output.",
      status: "toolcraft-native",
      toolcraftMapping:
        "The shared Export Image action draws the heading and a deterministic velocity-free snapshot of the dispersion rail rendered at export resolution.",
    },
  ],
  referenceInputs: [],
  referenceName:
    "Wireframes Aug 12 2026 snap carousel plus Figma nodes 6737:6662 and 6811:7821",
  referenceStudy: {
    behaviorEvidence:
      "The original app was restored and exercised: native wheel/track scrolling, single-card arrow steps, snap behavior, keyboard navigation, and viewport clipping were checked against its DOM and source.",
    referenceLocation: "/Users/kusnizza/Desktop/Wireframes Aug 12 2026/",
    reproductionSteps:
      "Run pnpm install --frozen-lockfile and pnpm dev in the supplied folder, open localhost:3000, inspect the features card slider, click its arrows, horizontally scroll the rail, and press ArrowLeft/ArrowRight while focused.",
    sourceEvidence:
      "features-cards--slider-column.tsx composes the cards; snap-slider.tsx owns scrollBy, thresholds, key handling, passive scroll, ResizeObserver, MutationObserver, and the 150ms state refresh.",
    status: "ran-original",
  },
  referenceTimeline: { behaviorCoverage: [], mode: "none" },
  sourceOfTruth: "reference-runtime",
};
export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: { mode: "toolcraft-default" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [
    {
      alternative: {
        reason:
          "Panel navigation would detach browsing from the visible rail and duplicate the canvas arrows, wheel, drag, and keyboard operations.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail:
          "The user explicitly requested an infinitely cyclic carousel and mouse dragging on its cards, extending the existing canvas-owned browsing interaction.",
        source: "user-request",
      },
      id: "carousel-loop-navigation",
      reason:
        "The canvas rail owns continuous previous/next, wheel, free mouse dragging and keyboard navigation with immediate spatial feedback. Mouse release preserves position; wheel and keyboard keep card alignment.",
      surface: "canvas",
      target: "controls.setValue",
    },
    {
      alternative: {
        reason:
          "A draggable edge handle would duplicate the exact percentage slider and cover the region whose distortion is being judged.",
        surface: "canvas",
      },
      capability: "precise-value-entry",
      evidence: {
        detail:
          "The user explicitly requested control over the width of the effect at both edges.",
        source: "user-request",
      },
      id: "edge-zone-width",
      reason:
        "A panel slider makes the symmetric percentage exact, persistent, resettable, and exportable.",
      surface: "panel",
      target: target.edgeWidth,
    },
    {
      alternative: {
        reason:
          "A canvas warp handle would cover the bending edge pixels being judged and duplicate a scalar optical property.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user explicitly requested warp distortion as a tunable edge-field property.",
        source: "user-request",
      },
      id: "edge-zone-warp",
      reason:
        "A panel slider makes the geometric warp amount exact, persistent, resettable, and exportable.",
      surface: "panel",
      target: target.warp,
    },
    {
      alternative: {
        reason:
          "A canvas prism-face handle would cover the crossing being judged and could not keep Stretch and Prism as exact resettable styles.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user asked for warp settings that can be configured as movement through refraction at a prism edge.",
        source: "user-request",
      },
      id: "edge-zone-warp-style",
      reason:
        "A panel style switch plus Prism-only face sliders keep the refractive crossing exact, persistent, and resettable.",
      surface: "panel",
      target: target.warpStyle,
    },
    {
      alternative: {
        reason:
          "A canvas blur handle would obscure the exact edge pixels being judged and would duplicate a scalar optical property.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The supplied references show focus falling progressively toward the outside edges, and the user explicitly requested adjustable blur.",
        source: "user-request",
      },
      id: "dispersion-blur",
      reason:
        "A panel slider makes the maximum defocus radius exact, persistent, resettable, and exportable.",
      surface: "panel",
      target: target.blur,
    },
    {
      alternative: {
        reason:
          "Clicking testimonial copy on the canvas would conflict with carousel navigation and would not communicate the global mode consistently.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user explicitly requested an option that applies the card effect to testimonial text too.",
        source: "user-request",
      },
      id: "testimonial-effect-mode",
      reason:
        "A panel switch makes the global clean-or-dispersed text mode explicit, persistent, resettable, and exportable.",
      surface: "panel",
      target: target.includeText,
    },
    {
      alternative: {
        reason:
          "A draggable band handle on the canvas would cover the exact boundary pixels being judged and duplicate scalar band properties.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user marked the boundary position on a screenshot and chose a stationary light band that cards pass through.",
        source: "user-request",
      },
      id: "aura-gate-band",
      reason:
        "Panel sliders make the edge offset, band width, glow, and refraction exact, persistent, resettable, and exportable without duplicating carousel navigation.",
      surface: "panel",
      target: target.gateGlow,
    },
    {
      alternative: {
        reason:
          "Direct canvas gestures cannot expose the spectral, halo, fade, and motion parameters without ambiguous overlapping gestures.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user asked for an adjustable aura and dispersion treatment at the edges.",
        source: "user-request",
      },
      id: "dispersion-optics",
      reason:
        "The panel provides precise named values while leaving the carousel itself available for navigation.",
      surface: "panel",
      target: target.amount,
    },
  ],
  mode: "product",
  productName: "Aura Carousel",
  productSummary:
    "A seamless infinitely cyclic customer-story snap carousel with five distinct regenerated x2 editorial photographs, live bottom-aligned testimonial text, optional text dispersion, 12px card radii, 160px vertical canvas padding, a white background, and a stationary screen-space edge treatment that cards visibly travel through.",
  requestedBehavior:
    "Reuse the supplied carousel mechanics as an endlessly cyclic rail in both directions, regenerate all five card photographs in the established style with distinct new subjects and scenes, retain the brand marks, rewrite the headline and live card copy with meaningful text of the same volume, optionally include text in the edge effect, crop the flat composition with the editable canvas, and export the current still result.",
  viewInteraction: {
    mode: "non-spatial",
    reason:
      "The product is a flat two-dimensional card carousel with no model, camera, or three-dimensional orientation.",
  },
};
export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Stationary edge-aura zone",
    entityId: "dispersion-edge-zone",
    groupingReason:
      "Width, falloff, outer fade, and the ragged-halo pair define the stationary envelope cards travel through before geometric warp is applied.",
    id: "edge-zone",
    splitReason:
      "The zone envelope is authored before the geometric warp stage of the same edge entity.",
    targets: [
      target.edgeWidth,
      target.curve,
      target.edgeFade,
      target.turbulence,
      target.turbulenceScale,
    ],
    title: "Edge Zone",
    workflowStage: "field",
  },
  {
    entity: "Stationary edge-aura zone",
    entityId: "dispersion-edge-zone",
    groupingReason:
      "Warp amount, style, inward offset, wave kind, blur, and the Prism-only face controls shape the geometric distortion inside that envelope.",
    id: "edge-warp",
    splitReason:
      "Warp offset, style, and wave are authored after the zone envelope of the same edge entity.",
    targets: [
      target.warp,
      target.warpStyle,
      target.warpOffset,
      target.warpWaveEnabled,
      target.warpWaveKind,
      target.warpWave,
      target.warpWaveLength,
      target.warpWaveBlur,
      target.warpFace,
      target.warpSharpness,
    ],
    title: "Edge Warp",
    workflowStage: "warp",
  },
  {
    entity: "Testimonial rendering",
    entityId: "carousel-testimonial-rendering",
    groupingReason:
      "The one global switch decides whether the authored testimonial layer participates in the card shader or stays clean above it.",
    id: "card-content",
    targets: [target.includeText],
    title: "Card Content",
  },
  {
    entity: "Edge dispersion optics",
    entityId: "edge-dispersion-optics",
    groupingReason:
      "Dispersion width, sampling, spectrum, hue, defocus, aura gain, and motion boost tune the one screen-space shader that renders the treatment cards pass through.",
    id: "edge-dispersion",
    targets: [
      target.amount,
      target.count,
      target.spectrum,
      target.hue,
      target.blur,
      target.aura,
      target.velocity,
    ],
    title: "Dispersion & Aura",
  },
  {
    entity: "Stationary boundary light band",
    entityId: "aura-gate-band",
    groupingReason:
      "Edge offset, band width, glow, and refraction tune the paired light curtains that crossing cards flare and refract through.",
    id: "aura-gate",
    targets: [
      target.gateOffset,
      target.gateWidth,
      target.gateGlow,
      target.gateRefraction,
    ],
    title: "Boundary Aura",
  },
  {
    entity: "Product background",
    entityId: "carousel-background",
    groupingReason:
      "The include switch owns the finite preview and export background; its color is meaningful only while included.",
    id: "background",
    targets: [target.includeBackground, target.background],
    title: "Background",
  },
  {
    entity: "Still-image delivery",
    entityId: "carousel-image-export",
    groupingReason:
      "Format and resolution jointly define the runtime-owned still artifact.",
    id: "image-export",
    targets: [target.imageFormat, target.imageResolution],
    title: "Image Export",
  },
];

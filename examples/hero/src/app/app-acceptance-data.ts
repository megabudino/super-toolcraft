import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";
import { heroBackgroundPatternTargets } from "./hero-background-pattern-values";
import { heroDispersionTargets } from "./hero-dispersion-values";
import { heroEffectsSectionInventory } from "./hero-effects-acceptance";
import { heroEffectsTargets } from "./hero-effects-values";
import { heroGalleryTargets } from "./hero-gallery-values";
import { heroHeadingTargets } from "./hero-heading-values";
import { heroHeadingCtaTargets } from "./hero-heading-cta-values";
import { heroHeadingSubtitleTargets } from "./hero-heading-subtitle-values";
import { heroProductControlAcceptance } from "./hero-product-control-acceptance";

const starterPersistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    behaviorCoverage: [
      "no-user-facing-transport",
      "no-play-pause",
      "no-scrub",
      "no-duration-control",
      "no-loop-control",
      "no-export-at-time",
    ],
    mode: "autonomous",
    reason:
      "Each row conveyor and the optional timed gallery jumps run autonomously inside the website; Interval and Jump time tune the self-starting cycle rather than exposing timeline transport, and there is no play, pause, scrub, product-loop duration, loop control, or video export.",
  },
  behaviorCoverage: ["control-mapping", "renderer-state"],
  mode: "reference-runtime-clone",
  referenceFeatureInventory: [
    {
      acceptanceId: "hero.reference-header",
      behaviorEvidence:
        "The original header is 64px tall, with a 40px logo, API/Docs links and guest actions. Native inspection found exactly 64px of unoccupied canvas below a 1016px Hero in a 1080px viewport when the header was missing.",
      featureName: "Recraft guest header and complete Hero viewport",
      id: "reference.recraft-header",
      referenceBehavior:
        "Header precedes the Hero whose height already subtracts 4rem. Resource links and Sign in are hidden below 768px; the Studio action stays visible.",
      sourceEvidence:
        "recraft-v4-styles/src/components/header/index.tsx, header-actions-client.tsx, header-sign-in-button.tsx, src/configs/website-config.ts and public/logo-mark.svg.",
      status: "ported",
      toolcraftMapping:
        "Product-owned guest header inside ReferenceSurface, using the original layout and canvas-scoped breakpoints. Guest actions link to Recraft login; the standalone editor does not own website sessions.",
    },
    {
      acceptanceId: heroHeadingSubtitleTargets.gap,
      behaviorEvidence:
        "Figma node 6057:643 defines one centered white Geist Medium subtitle at 24px, 1.25 line height, and -0.48px tracking.",
      featureName: "Hero heading subtitle",
      id: "figma.hero-heading-subtitle",
      referenceBehavior:
        "The exact text Style it once, every image matches sits below the hero heading as a single centered line.",
      sourceEvidence:
        "Figma design Zdk7j8qu8hvslsrEFYsL9z, node 6057:643, inspected through get_design_context and get_screenshot.",
      status: "ported",
      toolcraftMapping:
        "The website renders the Figma typography while Toolcraft owns subtitle size, the exact heading gap, and an independent optional shadow with offset, blur, spread, and color opacity.",
    },
    {
      acceptanceId: heroGalleryTargets.sphereRows,
      behaviorEvidence:
        "The approved plan defines uniform rows on one infinite image panel drawn through a fixed separable lens with signed horizontal and vertical bends, with direct canvas drag and a panel pad moving the panel through the lens.",
      featureName: "Uploadable multi-row sphere gallery",
      id: "requested.hero-sphere-gallery",
      referenceBehavior:
        "Uploaded or authored images keep their aspect ratio while rows loop continuously around the inside surface.",
      sourceEvidence:
        "The user explicitly asked to execute the approved 2026-08-21 hero sphere gallery plan.",
      status: "ported",
      toolcraftMapping:
        "Gallery upload, type, uniform card height and radius, row collection, shared gap, lens width, height, depth and signed profile, canvas/panel pan, and placement feed the website-owned retained WebGL renderer through protocol v23 while rows cycle vertically.",
    },
    {
      acceptanceId: heroDispersionTargets.edgeWidth,
      behaviorEvidence:
        "The running reference confines falloff, fade, and organic turbulence to a configurable stationary edge envelope.",
      featureName: "Directional edge zone",
      id: "reference.hero-edge-zone",
      referenceBehavior:
        "Edge width, falloff, fade, turbulence, and turbulence size shape one optical envelope.",
      sourceEvidence:
        "dispersion-carousel-schema-sections.ts and dispersion-carousel-webgl.ts in the supplied repository, exercised at 127.0.0.1:3029.",
      status: "ported",
      toolcraftMapping:
        "Sphere uses one full-screen post pass with bands defined on the lens surface; Rows retain their existing per-card viewport bands.",
    },
    {
      acceptanceId: heroDispersionTargets.warp,
      behaviorEvidence:
        "The running reference exposes Stretch and Prism geometry plus optional Glass or Ripple wave branches.",
      featureName: "Edge warp",
      id: "reference.hero-edge-warp",
      referenceBehavior:
        "Warp amount, style, offset, optional wave, and Prism-only face settings geometrically bend content inside the edge zone.",
      sourceEvidence:
        "The reference schema conditional branches and fragment-shader warp equations were inspected directly.",
      status: "ported",
      toolcraftMapping:
        "The same ten controls and conditions feed warp equations only where content enters the selected treated bands.",
    },
    {
      acceptanceId: heroDispersionTargets.amount,
      behaviorEvidence:
        "The running reference combines a bounded spectral loop, progressive defocus, additive aura, hue rotation, and motion-dependent streaking.",
      featureName: "Dispersion and aura optics",
      id: "reference.hero-dispersion-optics",
      referenceBehavior:
        "Dispersion, Samples, Spectrum, Hue, Blur, Aura, and Motion boost control one retained WebGL pass.",
      sourceEvidence:
        "The reference 48-tap shader loop, 12-tap aura loop, defaults, and live controls were inspected and exercised.",
      status: "ported",
      toolcraftMapping:
        "In Sphere, all cards render into one scene buffer and the bounded loops run once per pixel inside the treated bands; Motion boost derives per-pixel velocity from row speed and 2D pan rate through the lens field. Rows remain unchanged.",
    },
    {
      acceptanceId: heroDispersionTargets.gateGlow,
      behaviorEvidence:
        "The running reference renders a configurable light curtain with prism rims and glass-ridge refraction at the zone boundary.",
      featureName: "Boundary aura",
      id: "reference.hero-boundary-aura",
      referenceBehavior:
        "Edge offset, band width, glow, and refraction tune the stationary boundary light band.",
      sourceEvidence:
        "The reference aura-gate uniforms and flare/refraction shader equations were inspected directly.",
      status: "ported",
      toolcraftMapping:
        "The same four controls position and tune the light band inside each treated-zone boundary.",
    },
    {
      acceptanceId: "cards.roll",
      behaviorEvidence:
        "The supplied static reference shows a flat image row whose outer card edge enlarges and bows toward the viewer as if wrapped around a vertical roller.",
      featureName: "Progressive mirrored roller geometry",
      id: "requested.hero-card-roller",
      referenceBehavior:
        "Cards stay in one row while curvature increases toward the outer viewport edge.",
      sourceEvidence:
        "The supplied annotated hero reference at codex-clipboard-9f0e7b30-bd7c-4c79-af15-176c189f2048.png and the user's composition clarification.",
      status: "intentionally-changed",
      toolcraftMapping:
        "Gap and Card height place eight ordered cards per side while preserving source aspect; Roll projects every card through one shared vertical-cylinder path measured from the center-facing tangent to the current viewport edge. Positive gaps remain empty arc distance and negative gaps overlap intervals on that same path, so offscreen inventory cannot dilute the requested edge roll and wider viewports reveal additional outer cards without resetting curvature.",
      userApprovedChangeReason:
        "The user kept the single-row hero composition, then explicitly requested that wider viewports reveal more images while preserving a clear roller at the viewport edge; the original five center-near cards on each side retain their order and three images extend each outer end.",
    },
    {
      acceptanceId: heroDispersionTargets.edgeWidth,
      behaviorEvidence:
        "The user initially requested outward treatment for the left and right card groups, and the approved post-pass plan preserves that Rows behavior while making Sphere zone ownership scene-level.",
      featureName: "Outward treated-zone mapping",
      id: "requested.hero-outward-edge-mapping",
      referenceBehavior:
        "The reference shader evaluates both viewport edges symmetrically.",
      sourceEvidence:
        "The approved lens-zone plan preserves the symmetric Rows field while making Sphere evaluate its bands on the lens surface.",
      status: "intentionally-changed",
      toolcraftMapping:
        "Rows retain their per-card viewport mapping; Sphere derives per-pixel side and direction from lens-surface bands.",
      userApprovedChangeReason:
        "Rows keep separate left and right card groups with viewport ownership; Sphere owns one scene-level treated-zone boundary.",
    },
  ],
  referenceInputs: [],
  referenceName: "Dispersion Carousel v2 edge-effect runtime",
  referenceStudy: {
    behaviorEvidence:
      "The original app was opened locally and its Edge Zone, Edge Warp, Dispersion & Aura, and Boundary Aura controls were compared with the shader response.",
    referenceLocation: "/Users/alex/Projects/dispersion-carousel-v2",
    reproductionSteps:
      "Run pnpm dev in the supplied repository, open its local server, and vary every effect section while cards occupy the left and right edge zones.",
    sourceEvidence:
      "dispersion-carousel-values.ts, dispersion-carousel-schema-sections.ts, dispersion-carousel-renderer.tsx, and dispersion-carousel-webgl.ts.",
    status: "ran-original",
  },
  referenceTimeline: { behaviorCoverage: [], mode: "none" },
  sourceOfTruth: "reference-runtime",
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: {
      evidence:
        "The user explicitly requested the three independent native apps with no export.",
      mode: "user-removed",
    },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [
    {
      alternative: {
        reason:
          "The canvas preview cannot safely own a local checkpoint command or expose editor chrome inside website output.",
        surface: "canvas",
      },
      capability: "command",
      evidence: {
        detail:
          "The user explicitly requested adjacent Reset and Apply commands for locally testing Toolcraft settings before committing them to Git.",
        source: "user-request",
      },
      id: "panel-website-settings-sync",
      reason:
        "Deliberate panel actions separate live preview edits from local persisted Apply checkpoints and runtime Reset operations.",
      surface: "panel",
      target: "website.settings",
    },
    {
      alternative: {
        reason:
          "Canvas upload chrome would obscure the website-owned hero output.",
        surface: "canvas",
      },
      capability: "collection-edit",
      evidence: {
        detail:
          "The approved plan assigns gallery upload, order, removal, and transforms to FileDrop.",
        source: "user-request",
      },
      id: "panel-gallery-images",
      reason:
        "The panel owns the ordered source-image collection and its runtime media lifecycle.",
      surface: "panel",
      target: heroGalleryTargets.images,
    },
    {
      alternative: {
        reason:
          "Canvas add/remove controls would duplicate the row collection workflow over output.",
        surface: "canvas",
      },
      capability: "collection-edit",
      evidence: {
        detail:
          "The approved plan keeps one to six user-owned row records in Collection Actions while an empty-to-nonempty Row Images upload may complementarily grow the collection through its own row.",
        source: "user-request",
      },
      id: "panel-sphere-rows",
      reason:
        "Rows remains the user-owned cardinality authority and owns each row's offset and speed; Row Images is only a complementary activation writer for its empty-to-nonempty transition.",
      surface: "panel",
      target: heroGalleryTargets.sphereRows,
    },
    ...[
      heroGalleryTargets.rowImages0,
      heroGalleryTargets.rowImages1,
      heroGalleryTargets.rowImages2,
      heroGalleryTargets.rowImages3,
      heroGalleryTargets.rowImages4,
      heroGalleryTargets.rowImages5,
    ].map((target) => ({
      alternative: {
        reason:
          "Canvas upload chrome would obscure the website-owned hero output.",
        surface: "canvas" as const,
      },
      capability: "collection-edit" as const,
      evidence: {
        detail:
          "The approved per-row gallery request assigns each sphere row's image lifecycle to FileDrop and lets its empty-to-nonempty transition activate that row without replacing Rows as the cardinality authority.",
        source: "user-request" as const,
      },
      id: `panel-${target.replaceAll(".", "-")}`,
      reason:
        "The panel owns each bounded sphere-row image collection and complementarily grows Rows through that row when the drop first becomes nonempty; removing a row does not clear or reactivate its retained assets.",
      surface: "panel" as const,
      target,
    })),
    {
      alternative: {
        reason:
          "A pad alone separates the drag from the visible output and cannot follow the pointer across the lens.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail:
          "The user asked to drag the image projection directly on the canvas instead of rotating a sphere from the panel.",
        source: "user-request",
      },
      id: "canvas-sphere-pan",
      reason:
        "Dragging over the live website preview keeps the panel under the pointer and gives immediate lens feedback.",
      surface: "canvas",
      target: heroGalleryTargets.pan,
    },
    {
      alternative: {
        reason:
          "The canvas drag is direct but cannot expose exact resettable values or keyboard editing.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "Precise, persistent, resettable pan values are read and edited in the panel while the canvas owns the drag.",
        source: "usability-analysis",
      },
      id: "panel-sphere-pan",
      reason:
        "The panel keeps precise pan values discoverable while the canvas remains the direct manipulation surface.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: heroGalleryTargets.pan,
    },
    ...[
      "export.includeBackground",
      "appearance.background",
      ...Object.values(heroBackgroundPatternTargets),
      "scene.perspective",
      heroGalleryTargets.type,
      heroGalleryTargets.gap,
      heroGalleryTargets.cardHeight,
      heroGalleryTargets.cardRadius,
      heroGalleryTargets.roll,
      heroGalleryTargets.safetyWidth,
      heroGalleryTargets.rowGap,
      heroGalleryTargets.sphereWidth,
      heroGalleryTargets.sphereHeight,
      heroGalleryTargets.sphereDepth,
      heroGalleryTargets.sphereBendX,
      heroGalleryTargets.sphereBendY,
      heroGalleryTargets.position,
      heroGalleryTargets.autoScrollEnabled,
      heroGalleryTargets.autoScrollInterval,
      heroGalleryTargets.autoScrollDuration,
      ...Object.values(heroHeadingTargets),
      ...Object.values(heroHeadingSubtitleTargets),
      ...Object.values(heroDispersionTargets),
    ].map((target) => ({
      alternative: {
        reason:
          "A canvas copy would intercept website interactions and duplicate the requested Toolcraft controls.",
        surface: "canvas" as const,
      },
      capability: "property-edit" as const,
      evidence: {
        detail:
          "The user explicitly asked Toolcraft to own the UI props passed into the website preview.",
        source: "user-request" as const,
      },
      id: `panel-${target.replaceAll(".", "-")}`,
      reason:
        "The controls panel provides precise, persistent values while the native section remains the website-owned preview.",
      selectionScope: { mode: "global" as const },
      surface: "panel" as const,
      target,
    })),
  ],
  mode: "product",
  productName: "Hero Scene Lab",
  productSummary:
    "A Toolcraft controller for the Figma-styled hero heading subtitle and uploaded or authored images in mirrored rows or a multi-row panel gallery seen through a fixed signed-profile lens, pannable directly on the canvas, with local website Apply and shared Reset.",
  requestedBehavior:
    "Render the local Recraft website in Toolcraft; preserve the exact Figma hero subtitle while editing its heading gap and optional shadow; upload and reorder gallery images; switch between mirrored rows and a one-to-six-row infinite panel seen through a fixed lens; edit shared card height, row offset and signed speed, lens shape and bowl-or-ball profile, direct pan and placement; preserve Rows viewport bands while defining Sphere treated bands on the lens surface; and keep Apply and Reset synchronized with the neighboring website tab.",
  viewInteraction: {
    evidence:
      "The camera stays fixed; the canvas handle pans the image panel through the lens and never orbits or moves the website camera.",
    mode: "fixed-camera",
    source: "explicit-user-request",
  },
};

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  ...heroProductControlAcceptance,
  {
    automated: true,
    automatedTestName: "mounts the Hero section directly and writes native gestures into runtime history",
    browser: true,
    browserTestName: "browser: Recraft header fills the Hero viewport and follows canvas breakpoints",
    componentType: "canvas",
    evidence: "product-output",
    expectedObservable:
      "At 1920×1080, a 64px Recraft header precedes the unchanged 1016px Hero and the ticker reaches the canvas bottom. Resizing the canvas across 768px hides/shows resource links and Sign in, while the logo and Studio action remain visible.",
    fixture: "Native Hero with a 1920×1080 finite canvas and default guest website header",
    id: "hero.reference-header",
    kind: "runtime",
    target: "canvas.size.width",
    userAction: "Change Canvas width through the real Setup input and inspect the header, logo and lower canvas boundary.",
  },
  {
    automated: true,
    automatedTestName:
      "activates Row 5 once and does not reactivate it after Remove Row",
    browser: true,
    browserTestName:
      "browser: Row 5 upload activates its row and preserves retained images across remove reload and add",
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable:
      "Starting with three rows, the first upload into the empty Row 5 drop grows Rows to five and shows Row 5 content. Remove Row hides it without clearing the drop, reload does not reactivate it, and Add Row shows the retained images again.",
    fixture:
      "Three Sphere rows and one checksum-valid inline PNG uploaded into the empty Row 5 drop",
    id: "sphere.rowImages.4.activation",
    interactionId: `panel-${heroGalleryTargets.rowImages4.replaceAll(".", "-")}`,
    kind: "runtime",
    target: heroGalleryTargets.rowImages4,
    userAction:
      "With three rows, upload the first Row 5 image, remove Row 5, reload, then use Add Row without changing the retained drop.",
  },
  {
    automated: true,
    automatedTestName:
      "infinity mode keeps the external preview on its exact scene bounds",
    browser: true,
    browserTestName:
      "browser: infinity mode restores the exact finite website preview size",
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity mode removes finite sizing controls and artboard clipping, then restores the exact 1920 by 1080 finite preview when disabled.",
    fixture: "Finite 1920 by 1080 website preview and constant scene bounds",
    id: "canvas.infinity",
    infinityCanvasCoverage: "mode-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Enable Infinity canvas, then disable it again.",
  },
  {
    automated: true,
    automatedTestName:
      "declares production reload coverage for CRT Fade out and the hero workspace",
    browser: true,
    browserTestName:
      "browser: app restores exact CRT Fade out, canvas, and panel workspace after reload",
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "The exact CRT Fade out value, Sphere/CRT prerequisites, canvas size and zoom, and moved and collapsed Controls workspace remain restored after a real browser reload; the product output reports the restored Fade out value and the website renders the restored Sphere scene.",
    fixture:
      "Sphere gallery with CRT enabled, edited Fade out, resized canvas, and moved Controls workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices: starterPersistenceSlices,
    target: heroEffectsTargets.crtFade,
    userAction:
      "Select Sphere, enable CRT, edit Fade out, resize and zoom the canvas, move and collapse Controls, wait for persistence, and reload the page.",
  },
];

// Product entries use the same explicit stable section IDs as appSchema.
export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    {
      entity: "Hero stage background",
      entityId: "hero-stage-background",
      groupingReason:
        "The include state and color together define the visible hero stage background passed to the website.",
      id: "background",
      targets: ["export.includeBackground", "appearance.background"],
      title: "Background",
    },
    {
      entity: "Hero background checker pattern",
      entityId: "hero-background-pattern",
      groupingReason:
        "Visibility, color with opacity, and square size jointly define the native checker layer over the hero background.",
      id: "pattern",
      targets: [
        heroBackgroundPatternTargets.enabled,
        heroBackgroundPatternTargets.colorOpacity,
        heroBackgroundPatternTargets.squareSize,
      ],
      title: "Pattern",
    },
    {
      entity: "Hero heading group",
      entityId: "hero-heading-group",
      groupingReason:
        "Independent line sizes, shared brand-fill color, signed line spacing, and two-axis placement jointly define the editable V4 heading group.",
      id: "hero-heading",
      splitReason:
        "The heading entity has thirty-eight controls, so content and placement stay separate from badge, badge shadow, heading shadow, subtitle, CTA, and CTA shadow stages.",
      targets: [
        heroHeadingTargets.recraftSize,
        heroHeadingTargets.stylesSize,
        heroHeadingTargets.color,
        heroHeadingTargets.lineGap,
        heroHeadingTargets.position,
      ],
      title: "Hero Heading",
      workflowStage: "content-placement",
    },
    {
      entity: "Hero heading group",
      entityId: "hero-heading-group",
      groupingReason:
        "Visibility, color, uniform scale, and exact heading distance jointly define the V4 badge artwork.",
      id: "heading-badge",
      splitReason:
        "Badge artwork controls remain separate from its conditional shadow and the text styling stages.",
      targets: [
        heroHeadingTargets.badgeVisible,
        heroHeadingTargets.badgeColor,
        heroHeadingTargets.badgeScale,
        heroHeadingTargets.badgeGap,
      ],
      title: "Badge",
      workflowStage: "badge",
    },
    {
      entity: "Hero heading group",
      entityId: "hero-heading-group",
      groupingReason:
        "Visibility, offset, blur, spread, and color define the independent badge shadow.",
      id: "heading-badge-shadow",
      splitReason:
        "The heading entity has thirty-eight controls, so the badge shadow stays conditional and separate from badge artwork and text effects.",
      targets: [
        heroHeadingTargets.badgeShadowEnabled,
        heroHeadingTargets.badgeShadowOffset,
        heroHeadingTargets.badgeShadowBlur,
        heroHeadingTargets.badgeShadowSpread,
        heroHeadingTargets.badgeShadowColorOpacity,
      ],
      title: "Badge Shadow",
      workflowStage: "badge-shadow",
    },
    {
      entity: "Hero heading group",
      entityId: "hero-heading-group",
      groupingReason:
        "Visibility, offset, blur, spread, and color define the independent heading shadow.",
      id: "heading-effects",
      splitReason:
        "The heading entity has thirty-eight controls, so its shadow stays separate from content, placement, badge styling, subtitle styling, and CTA styling.",
      targets: [
        heroHeadingTargets.shadowEnabled,
        heroHeadingTargets.shadowOffset,
        heroHeadingTargets.shadowBlur,
        heroHeadingTargets.shadowSpread,
        heroHeadingTargets.shadowColorOpacity,
      ],
      title: "Heading Shadow",
      workflowStage: "effects",
    },
    {
      entity: "Hero heading group",
      entityId: "hero-heading-group",
      groupingReason:
        "Font size, exact heading distance, visibility, offset, blur, spread, and color define the Figma subtitle.",
      id: "heading-subtitle",
      splitReason:
        "The heading entity has thirty-eight controls, so the subtitle typography, placement, and conditional shadow remain separate from heading and CTA styling.",
      targets: [
        heroHeadingSubtitleTargets.fontSize,
        heroHeadingSubtitleTargets.gap,
        heroHeadingSubtitleTargets.shadowEnabled,
        heroHeadingSubtitleTargets.shadowOffset,
        heroHeadingSubtitleTargets.shadowBlur,
        heroHeadingSubtitleTargets.shadowSpread,
        heroHeadingSubtitleTargets.shadowColorOpacity,
      ],
      title: "Hero Subtitle",
      workflowStage: "subtitle",
    },
    {
      entity: "Hero heading group",
      entityId: "hero-heading-group",
      groupingReason:
        "Copy, typography, two-axis padding, text and fill colors, and subtitle distance jointly define the CTA button.",
      id: "heading-cta",
      splitReason:
        "The heading entity has thirty-eight controls, so the CTA content and geometry stay separate from the subtitle and three shadow stages.",
      targets: [
        heroHeadingCtaTargets.text,
        heroHeadingCtaTargets.fontSize,
        heroHeadingCtaTargets.horizontalPadding,
        heroHeadingCtaTargets.verticalPadding,
        heroHeadingCtaTargets.textColor,
        heroHeadingCtaTargets.backgroundColor,
        heroHeadingCtaTargets.gap,
      ],
      title: "CTA Button",
      workflowStage: "cta",
    },
    {
      entity: "Hero heading group",
      entityId: "hero-heading-group",
      groupingReason:
        "Visibility, offset, blur, spread, and color define the CTA shadow independently from the heading shadow.",
      id: "heading-cta-shadow",
      splitReason:
        "The heading entity has thirty-eight controls, so CTA shadow effects remain conditional and separate from button content and geometry.",
      targets: [
        heroHeadingCtaTargets.shadowEnabled,
        heroHeadingCtaTargets.shadowOffset,
        heroHeadingCtaTargets.shadowBlur,
        heroHeadingCtaTargets.shadowSpread,
        heroHeadingCtaTargets.shadowColorOpacity,
      ],
      title: "CTA Shadow",
      workflowStage: "cta-shadow",
    },
    {
      entity: "Perspective projection",
      entityId: "perspective-projection",
      groupingReason:
        "Perspective is the complete editable depth projection surface for the website hero scene.",
      id: "projection",
      targets: ["scene.perspective"],
      title: "Projection",
    },
    {
      entity: "Hero gallery content",
      entityId: "hero-gallery-surface",
      groupingReason:
        "The mode selector stays with the Rows-mode image source and Sphere content geometry it gates; the Rows collection remains the user-owned cardinality authority while the nine controls arrange, source, and round cards and rows on the panel.",
      id: "gallery",
      targets: [
        heroGalleryTargets.type,
        heroGalleryTargets.images,
        heroGalleryTargets.gap,
        heroGalleryTargets.cardHeight,
        heroGalleryTargets.cardRadius,
        heroGalleryTargets.safetyWidth,
        heroGalleryTargets.roll,
        heroGalleryTargets.sphereRows,
        heroGalleryTargets.rowGap,
      ],
      title: "Gallery",
    },
    {
      entity: "Hero gallery row images",
      entityId: "hero-gallery-row-images",
      groupingReason:
        "Six slots provide one content source per possible sphere row, and each empty-to-nonempty transition may complementarily activate its own row without replacing Rows ownership.",
      id: "row-images",
      targets: [
        heroGalleryTargets.rowImages0,
        heroGalleryTargets.rowImages1,
        heroGalleryTargets.rowImages2,
        heroGalleryTargets.rowImages3,
        heroGalleryTargets.rowImages4,
        heroGalleryTargets.rowImages5,
      ],
      title: "Row Images",
    },
    {
      entity: "Gallery lens",
      entityId: "hero-gallery-lens",
      groupingReason:
        "Width, height, depth and the two signed bends define the fixed bowl-or-ball surface every Sphere row is drawn through.",
      id: "lens",
      targets: [
        heroGalleryTargets.sphereWidth,
        heroGalleryTargets.sphereHeight,
        heroGalleryTargets.sphereDepth,
        heroGalleryTargets.sphereBendX,
        heroGalleryTargets.sphereBendY,
      ],
      title: "Lens",
    },
    {
      entity: "Gallery placement on the hero canvas",
      entityId: "hero-gallery-placement",
      groupingReason:
        "Position moves the lens centre on the canvas and Pan slides the image panel through it; both place the active gallery as one composition.",
      id: "gallery-placement",
      targets: [heroGalleryTargets.position, heroGalleryTargets.pan],
      title: "Gallery Placement",
    },
    {
      entity: "Hero gallery auto scroll",
      entityId: "hero-gallery-autoscroll",
      groupingReason:
        "The switch, interval, and jump duration define one autonomous cycle of jumps across the Sphere gallery. The approved product copy intentionally repeats Auto scroll beside the switch so its binary state remains explicit while Interval and Jump time are conditionally hidden.",
      id: "auto-scroll",
      targets: [
        heroGalleryTargets.autoScrollEnabled,
        heroGalleryTargets.autoScrollInterval,
        heroGalleryTargets.autoScrollDuration,
      ],
      title: "Auto Scroll",
    },
    {
      entity: "Hero treated-zone optics",
      entityId: "hero-card-edge-dispersion",
      groupingReason:
        "Width, falloff, fade, and the turbulence pair define the lens-surface treatment envelope before geometric warp.",
      id: "edge-zone",
      splitReason:
        "The field envelope is authored before the geometric warp stage of the same edge treatment.",
      targets: [
        heroDispersionTargets.edgeWidth,
        heroDispersionTargets.curve,
        heroDispersionTargets.edgeFade,
        heroDispersionTargets.turbulence,
        heroDispersionTargets.turbulenceScale,
      ],
      title: "Edge Zone",
      workflowStage: "field",
    },
    {
      entity: "Hero treated-zone optics",
      entityId: "hero-card-edge-dispersion",
      groupingReason:
        "Warp amount, style, offset, wave branches, and Prism face settings shape geometry inside the envelope.",
      id: "edge-warp",
      splitReason:
        "Geometric warp is authored after the field envelope and before spectral sampling.",
      targets: [
        heroDispersionTargets.warp,
        heroDispersionTargets.warpStyle,
        heroDispersionTargets.warpOffset,
        heroDispersionTargets.warpWaveEnabled,
        heroDispersionTargets.warpWaveKind,
        heroDispersionTargets.warpWave,
        heroDispersionTargets.warpWaveLength,
        heroDispersionTargets.warpWaveBlur,
        heroDispersionTargets.warpFace,
        heroDispersionTargets.warpSharpness,
      ],
      title: "Edge Warp",
      workflowStage: "warp",
    },
    {
      entity: "Hero dispersion optics",
      entityId: "hero-card-dispersion-optics",
      groupingReason:
        "Spectral width, bounded sampling, color, defocus, aura, and motion jointly tune the retained Rows passes and Sphere post pass.",
      id: "edge-dispersion",
      targets: [
        heroDispersionTargets.amount,
        heroDispersionTargets.count,
        heroDispersionTargets.spectrum,
        heroDispersionTargets.hue,
        heroDispersionTargets.blur,
        heroDispersionTargets.aura,
        heroDispersionTargets.velocity,
      ],
      title: "Dispersion & Aura",
    },
    {
      entity: "Hero boundary light band",
      entityId: "hero-card-boundary-aura",
      groupingReason:
        "Edge offset, band width, glow, and refraction tune the light curtain inside the treated band.",
      id: "aura-gate",
      targets: [
        heroDispersionTargets.gateOffset,
        heroDispersionTargets.gateWidth,
        heroDispersionTargets.gateGlow,
        heroDispersionTargets.gateRefraction,
      ],
      title: "Boundary Aura",
    },
    ...heroEffectsSectionInventory,
    {
      entity: "Website hero publication",
      entityId: "website-hero-publication",
      groupingReason:
        "Adjacent Reset and Apply actions own explicit website-source synchronization while Reset also dispatches the canonical Toolcraft global reset.",
      id: "website-actions",
      targets: ["website.settings"],
      title: "Website",
    },
  ];

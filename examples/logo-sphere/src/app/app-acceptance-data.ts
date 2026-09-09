import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";

const persistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    loopDuration: {
      evidence:
        "A twelve-second loop keeps thirty logo cards readable while producing one complete seamless turn.",
      seconds: 12,
      source: "product-derived",
    },
    mode: "timeline-playback",
  },
  mode: "new-toolcraft-app",
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
          "Panel angle controls would duplicate the same spatial rotation away from its visible result.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail:
          "The user explicitly asked to move and spin the sphere with the cursor.",
        source: "user-request",
      },
      id: "sphere-orbit",
      reason:
        "Direct canvas orbit keeps cursor movement spatially attached to the logo sphere.",
      surface: "canvas",
      target: "view.orbit",
    },
    {
      alternative: {
        reason:
          "Canvas upload chrome would obscure product output and duplicate the runtime FileDrop workflow.",
        surface: "canvas",
      },
      capability: "collection-edit",
      evidence: {
        detail:
          "A sortable panel collection is the most discoverable place to upload, reorder, transform, and remove logo images.",
        source: "usability-analysis",
      },
      id: "logo-source-collection",
      reason:
        "The built-in multi-image FileDrop owns source collection editing and runtime media order.",
      surface: "panel",
      target: "logos.sources",
    },
    {
      alternative: {
        reason:
          "A hidden renderer constant would prevent users from removing or restoring the supplied SVG source through runtime media state.",
        surface: "canvas",
      },
      capability: "collection-edit",
      evidence: {
        detail:
          "The supplied vector set is one attached bundle distinct from the user's image collection.",
        source: "user-request",
      },
      id: "logo-default-bundle",
      reason:
        "A separate built-in FileDrop keeps the supplied SVG bundle removable and resettable without blocking user image imports.",
      surface: "panel",
      target: "logos.defaults",
    },
    {
      alternative: {
        reason:
          "Persistent numeric handles on the canvas would clutter logos and duplicate exact panel values.",
        surface: "canvas",
      },
      capability: "precise-value-entry",
      evidence: {
        detail:
          "Visible count, sphere radius, size, depth, perspective, fade, and motion tuning benefit from exact discoverable values.",
        source: "usability-analysis",
      },
      id: "sphere-parameters",
      reason:
        "Panel controls expose precise parameters while the canvas remains dedicated to direct orbit.",
      surface: "panel",
      target: "sphere.visibleCount",
    },
    {
      alternative: {
        reason:
          "Per-card canvas handles would obstruct the sphere and make a global visual treatment inconsistent.",
        surface: "canvas",
      },
      capability: "precise-value-entry",
      evidence: {
        detail:
          "The user explicitly requested configurable outline, corner rounding, and depth-responsive shadow styling.",
        source: "user-request",
      },
      id: "card-style-parameters",
      reason:
        "One panel section exposes exact global card styling while the canvas remains dedicated to orbit.",
      surface: "panel",
      target: "card.strokeWidth",
    },
  ],
  mode: "product",
  productName: "Logo Sphere",
  productSummary:
    "An interactive editor that distributes SVG logo cards over a perspective sphere with configurable depth, density, fade, card contour, shadow, motion, and image export.",
  requestedBehavior:
    "Arrange supplied SVGs and uploaded images on a sphere, vary visible logo count and sphere/fade parameters, keep outline width constant through depth, scale rounding and shadow with distance, rotate it with the cursor, animate it like a spinning ball, and export the result.",
  viewInteraction: {
    mode: "orbit",
    orientationTargets: ["view.orbit"],
  },
};

function productControl(
  id: string,
  componentType: string,
  target: string,
  expectedObservable: string,
  userAction: string,
  interactionId?: string,
): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: `${id} updates logo sphere product output`,
    browser: true,
    browserTestName: `browser: ${id} updates logo sphere product output`,
    componentType,
    evidence: "rendered-pixels",
    expectedObservable,
    fixture: "thirty supplied logo cards on the default sphere",
    id,
    ...(interactionId ? { interactionId } : {}),
    kind: "control",
    target,
    userAction,
  };
}

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName:
      "included SVG set supports replacement removal and reset",
    browser: true,
    browserTestName:
      "browser: included SVG set removes and resets vector fallback",
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable:
      "The attached SVG bundle expands to 30 projected vector cards, removal clears the fallback sphere, replacement accepts one SVG, and Reset restores the supplied set.",
    fixture: "one attached vector atlas containing thirty supplied SVG cards",
    id: "logos.default-set",
    interactionId: "logo-default-bundle",
    kind: "control",
    mediaLifecycleCoverage: [
      "upload",
      "remove",
      "reset",
      "default-remove",
      "default-reset",
    ],
    target: "logos.defaults",
    userAction:
      "Remove or replace the included SVG set, then Reset the Logos section.",
  },
  {
    automated: true,
    automatedTestName:
      "default logo media supports upload, remove, reorder, transforms, and reset",
    browser: true,
    browserTestName:
      "browser: default logo media updates preview order and transforms",
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable:
      "The attached supplied SVG atlas expands to 30 independently projected fallback cards; uploading images switches the sphere to the editable upload collection, and reorder, rotate, flip, remove, and Reset change runtime media and rendered assignment.",
    fixture: "one attached atlas containing thirty supplied SVG cards and one uploaded replacement image",
    id: "logos.media",
    interactionId: "logo-source-collection",
    kind: "control",
    mediaLifecycleCoverage: [
      "upload",
      "remove",
      "reset",
      "reorder",
      "rotate",
      "flip",
      "order-output",
      "transform-output",
    ],
    target: "logos.sources",
    userAction:
      "Upload logos, reorder thumbnails, rotate and flip the selected image, remove uploads, then Reset controls.",
  },
  productControl(
    "sphere.visible-count",
    "slider",
    "sphere.visibleCount",
    "Changing Points changes the exact number of evenly spaced projected fill points from 6 through 500 while card size stays constant, with source logos repeating onto them.",
    "Drag Points from its minimum to maximum and inspect the card count.",
    "sphere-parameters",
  ),
  {
    ...productControl(
      "sphere.distribution",
      "segmented",
      "sphere.distribution",
      "Fibonacci produces a depth-sorted scattered sphere, Rings produces depth-sorted latitude bands, and Grid wraps upright sphere-distorted cards onto evenly spaced organic fill points with no aligned rows, sized by sphere perspective and fading toward the limb and rear. Grid draws the rear hemisphere first, then fixed descending-index sticker order within each hemisphere, so front overlaps do not re-stack during orbit or playback.",
      "Select Fibonacci, Rings, and Grid and compare projected positions.",
    ),
    optionCoverage: "each-visible-item",
  },
  productControl(
    "sphere.radius",
    "slider",
    "sphere.radius",
    "Sphere radius sets the ball size in pixels, from a compact ball to far beyond the frame, without changing the logo count.",
    "Drag Sphere radius across its range and inspect the silhouette size.",
  ),
  productControl(
    "sphere.logo-size",
    "slider",
    "sphere.logoSize",
    "Changing Logo size changes every visible card while preserving its center position; in Grid distribution it scales the radius-proportional surface cards.",
    "Drag Logo size and inspect the card dimensions.",
  ),
  productControl(
    "sphere.depth",
    "slider",
    "sphere.depth",
    "Depth changes front-to-back scale and opacity separation from a flat cluster to a visibly round sphere with pronounced Z contrast.",
    "Drag Depth between shallow and full values.",
  ),
  productControl(
    "sphere.perspective",
    "slider",
    "sphere.perspective",
    "Perspective changes the size contrast between front and rear logo cards.",
    "Drag Perspective and compare front and rear card sizes.",
  ),
  productControl(
    "sphere.fisheye",
    "slider",
    "sphere.fisheye",
    "Fisheye performs a dolly-zoom: the framing holds while the nearest logos grow and distort against effectively unchanged neighbors and the limb and far hemisphere compress.",
    "Drag Fisheye from zero to maximum and compare front-card size against its neighbors and the silhouette.",
  ),
  {
    automated: true,
    automatedTestName:
      "orientation gizmo and direct sphere drag share one export-clean pose",
    browser: true,
    browserTestName:
      "browser: orientation gizmo and direct sphere drag update shared pose",
    componentType: "orientationGizmo",
    evidence: "rendered-pixels",
    expectedObservable:
      "Gizmo drag, axis snap, and direct sphere drag update view.orbit and visible pixels; a canvas miss pans, undo/reset restores pose, and export contains no gizmo.",
    fixture: "default spatial logo sphere with playback paused at 2x render scale",
    id: "sphere.orbit",
    interactionId: "sphere-orbit",
    kind: "canvas-handle",
    canvasHandle: {
      exportCleanTestName:
        "browser: logo sphere export excludes orientation gizmo",
      outputObservable:
        "Direct sphere drag and gizmo drag change projected logo pixels while exported output excludes the editor handle.",
      testId: "toolcraft-orientation-gizmo",
      writesTarget: "view.orbit",
    },
    orientationGizmoCoverage: "all-required-orientation-gizmo-behavior",
    target: "view.orbit",
    userAction:
      "Drag the sphere, drag and snap the orientation gizmo, miss-drag the canvas, then undo and reset.",
  },
  productControl(
    "fade.mask-size",
    "slider",
    "fade.maskSize",
    "Mask size moves the outer radius where the continuous pixel-level logo mask reaches zero.",
    "Drag Mask size and inspect the feathered silhouette clipping through logo pixels.",
  ),
  productControl(
    "fade.feather",
    "slider",
    "fade.feather",
    "Feather changes the width of the partially transparent pixel band without changing per-card depth opacity.",
    "Drag Feather and inspect the soft transition width.",
  ),
  productControl(
    "fade.rear-opacity",
    "slider",
    "fade.rearOpacity",
    "Rear opacity changes only the minimum opacity of the far hemisphere.",
    "Drag Rear opacity and compare rear logo visibility.",
  ),
  productControl(
    "card.stroke-width",
    "slider",
    "card.strokeWidth",
    "Stroke width changes the card outline while remaining the same screen-pixel thickness on near and far cards.",
    "Drag Stroke width and compare outlines at opposite sphere depths.",
    "card-style-parameters",
  ),
  productControl(
    "card.stroke-color",
    "color",
    "card.strokeColor",
    "Stroke color changes only the outer card contour and preserves authored SVG colors.",
    "Choose a contrasting Stroke color and inspect card contours.",
  ),
  productControl(
    "card.corner-radius",
    "slider",
    "card.cornerRadius",
    "Corner radius changes the SVG card clip and its visible radius scales proportionally with perspective depth.",
    "Drag Corner radius and compare near and far card corners.",
  ),
  productControl(
    "card.shadow-color",
    "color",
    "card.shadowColor",
    "Shadow color changes the camera-facing shadow without recoloring the SVG or outline.",
    "Choose a contrasting Shadow color and inspect the shadow pixels.",
  ),
  productControl(
    "card.shadow-opacity",
    "slider",
    "card.shadowOpacity",
    "Shadow opacity changes the maximum shadow alpha while rear-card depth opacity attenuates distant shadows.",
    "Drag Shadow opacity and compare front and rear shadows.",
  ),
  productControl(
    "card.shadow-blur",
    "slider",
    "card.shadowBlur",
    "Shadow blur changes softness and scales down with perspective on distant cards.",
    "Drag Shadow blur and compare near and far shadow softness.",
  ),
  productControl(
    "card.shadow-offset",
    "slider",
    "card.shadowOffset",
    "Shadow offset changes displacement and scales down with perspective on distant cards.",
    "Drag Shadow offset and compare near and far shadow displacement.",
  ),
  {
    ...productControl(
      "motion.spin-axis",
      "segmented",
      "motion.spinAxis",
      "Each Spin axis option changes the direction of timeline-driven sphere rotation.",
      "Select every Spin axis option while playback runs.",
    ),
    optionCoverage: "each-visible-item",
  },
  productControl(
    "motion.spin-turns",
    "slider",
    "motion.spinAmount",
    "Spin turns changes the number of forward rotations completed in one loop.",
    "Change Spin turns and scrub the same timeline interval.",
  ),
  productControl(
    "motion.inertia",
    "slider",
    "motion.inertia",
    "Inertia changes how long direct sphere rotation continues after pointer release.",
    "Drag and release the sphere at low and high Inertia values.",
  ),
  {
    automated: true,
    automatedTestName:
      "background controls update bounded preview, Infinity, transparency, and export",
    backgroundOutputCoverage: "all-required-background-output",
    browser: true,
    browserTestName:
      "browser: background controls update preview Infinity and image export",
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "Background off hides bounded preview color, exits Infinity, and exports transparent PNG; Background on fills Infinity and selected color appears in preview/export.",
    fixture: "logo sphere with contrasting background and PNG/JPG export",
    id: "background.output",
    kind: "control",
    target: "export.includeBackground",
    userAction:
      "Toggle Background, change Background color, toggle Infinity, and inspect PNG/JPG output.",
  },
  productControl(
    "background.color",
    "color",
    "appearance.background",
    "Changing Background color updates the bounded preview and enabled image export background.",
    "Choose a contrasting Background color and inspect preview and export.",
  ),
  {
    ...productControl(
      "export.image-format",
      "select",
      "export.image.format",
      "Format selects real PNG or JPG encoding without changing product geometry.",
      "Select PNG and JPG before exporting the same frame.",
    ),
    evidence: "exported-bytes",
    optionCoverage: "each-visible-item",
  },
  {
    ...productControl(
      "export.image-resolution",
      "select",
      "export.image.resolution",
      "Resolution selects real 2K, 4K, or 8K long-edge output.",
      "Select 2K, 4K, and 8K and inspect decoded artifact dimensions.",
    ),
    evidence: "exported-bytes",
    optionCoverage: "each-visible-item",
  },
  {
    actionCoverage: ["export.png"],
    automated: true,
    automatedTestName:
      "image export produces decoded non-empty logo sphere artifacts",
    browser: true,
    browserTestName:
      "browser: image export produces decoded non-empty logo sphere artifacts",
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Export PNG completes a real download whose decoded dimensions, background, and logo pixels match the selected current frame.",
    exportArtifactCoverage: "all-required-image-export-behavior",
    fixture: "logo sphere exported as PNG/JPG at 2K, 4K, and 8K",
    id: "export.image",
    kind: "control",
    target: "actions.output",
    userAction: "Choose image settings and click Export PNG.",
  },
  {
    automated: true,
    automatedTestName:
      "timeline playback drives a seamless forward-only sphere loop",
    browser: true,
    browserTestName:
      "browser: timeline playback drives a seamless forward-only sphere loop",
    componentType: "timeline",
    evidence: "timeline-output",
    expectedObservable:
      "Play/pause, scrub, loop, and duration edit change rendered sphere frames while progress 0 and 1 match exactly.",
    fixture: "default logo sphere with twelve-second playback loop",
    id: "timeline.playback",
    kind: "runtime",
    target: "timeline.playback",
    timelineCoverage: "playback",
    timelineLoopProof: {
      direction: "forward-only",
      durationChange: "reproved-after-edit",
      reversePlayback: "forbidden",
      seam: "first-last-match",
    },
    timelinePlaybackCoverage: "all-playback-behavior",
    userAction:
      "Play, pause, scrub, toggle loop, edit duration, and compare first/last rendered frames.",
  },
  {
    automated: true,
    automatedTestName:
      "editable Infinity canvas restores finite size and crops image export to scene bounds",
    browser: true,
    browserTestName:
      "browser: Infinity canvas restores size and exports exact sphere scene bounds",
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity hides finite size controls and clipping, then restores the exact dormant artboard; infinite image export crops to the product scene-bounds union.",
    fixture: "finite and infinite logo sphere scene",
    id: "canvas.infinity.mode",
    infinityCanvasCoverage: "mode-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction:
      "Toggle Infinity on/off, compare finite size restoration, and export the infinite sphere.",
  },
  {
    automated: true,
    automatedTestName:
      "infinite image export crops to exact logo sphere scene bounds",
    browser: true,
    browserTestName:
      "browser: infinite image export crops to exact logo sphere scene bounds",
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "Infinite image export crops to the outward-rounded union returned by the exact-state logo sphere scene-bounds provider.",
    fixture: "infinite logo sphere with changed spread and logo size",
    id: "canvas.infinity.export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    target: "canvas.infinity",
    userAction:
      "Enable Infinity, change Spread and Logo size, export PNG, and inspect decoded bounds.",
  },
  {
    automated: true,
    automatedTestName:
      "selected resolution scale preserves exact logo sphere backing pixels",
    browser: true,
    browserTestName:
      "browser: selected resolution scale preserves logo sphere backing pixels",
    componentType: "canvas",
    evidence: "rendered-pixels",
    expectedObservable:
      "Canvas CSS size remains stable while backing pixels equal CSS size times devicePixelRatio times selected scale during interaction, playback, and steady state.",
    fixture: "logo sphere raster canvas at selected resolution scale",
    id: "canvas.render-scale",
    kind: "runtime",
    renderScaleCoverage: {
      kind: "selected-backing-pixels",
      states: ["interaction", "playback", "steady"],
    },
    target: "canvas.renderScale",
    userAction:
      "Set Resolution scale to 2, orbit the sphere, play the timeline, then inspect steady canvas backing pixels.",
  },
  {
    automated: true,
    automatedTestName:
      "workspace reload restores logo sphere values media timeline canvas and panels",
    browser: true,
    browserTestName:
      "browser: workspace reload restores logo sphere values media timeline canvas and panels",
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Edited sphere values, media order/transforms, orbit, timeline, canvas, and moved/collapsed panels restore after a real reload.",
    fixture: "edited persistent logo sphere workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices,
    target: "sphere.visibleCount",
    userAction:
      "Edit values and media, rotate the sphere, change timeline/canvas/panel state, wait for persistence, and reload.",
  },
];

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Logo source collection",
    entityId: "logo-sources",
    groupingReason:
      "The attached SVG bundle owns the supplied fallback while the image uploader owns editable upload order, transforms, removal, and reset for the same rendered logo source workflow.",
    id: "logos",
    targets: ["logos.defaults", "logos.sources"],
    title: "Logos",
  },
  {
    entity: "Logo sphere",
    entityId: "logo-sphere",
    groupingReason:
      "Count, distribution, sphere radius, card scale, depth, perspective, fisheye, and shared orbit jointly define the same spatial sphere.",
    id: "sphere",
    targets: [
      "sphere.visibleCount",
      "sphere.distribution",
      "sphere.radius",
      "sphere.logoSize",
      "sphere.depth",
      "sphere.perspective",
      "sphere.fisheye",
      "view.orbit",
    ],
    title: "Sphere",
  },
  {
    entity: "Sphere fade mask",
    entityId: "sphere-fade-mask",
    groupingReason:
      "Mask size, feather, and rear opacity jointly define the sphere visibility falloff.",
    id: "fade-mask",
    targets: ["fade.maskSize", "fade.feather", "fade.rearOpacity"],
    title: "Fade Mask",
  },
  {
    entity: "Logo card style",
    entityId: "logo-card-style",
    groupingReason:
      "Outline, corner radius, and shadow jointly define the global camera-facing card contour and depth response.",
    id: "card-style",
    targets: [
      "card.strokeWidth",
      "card.strokeColor",
      "card.cornerRadius",
      "card.shadowColor",
      "card.shadowOpacity",
      "card.shadowBlur",
      "card.shadowOffset",
    ],
    title: "Card Style",
  },
  {
    entity: "Sphere motion",
    entityId: "sphere-motion",
    groupingReason:
      "Spin axis, turns per loop, and drag inertia define the sphere motion behavior while timeline owns transport.",
    id: "motion",
    targets: ["motion.spinAxis", "motion.spinAmount", "motion.inertia"],
    title: "Motion",
  },
  {
    entity: "Product background",
    entityId: "product-background",
    groupingReason:
      "Background inclusion and color form the standard preview/export background pair consumed into Setup.",
    id: "background",
    targets: ["export.includeBackground", "appearance.background"],
    title: "Background",
  },
  {
    entity: "Image export",
    entityId: "image-export",
    groupingReason:
      "Format and resolution configure the single runtime-owned image artifact workflow.",
    id: "image-export",
    targets: ["export.image.format", "export.image.resolution"],
    title: "Image Export",
  },
];

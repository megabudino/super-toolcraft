import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";
import {
  crtAcceptance,
  crtControlSectionInventoryEntry,
  crtInteractionOwnership,
} from "./app-crt-acceptance-data";
import { GLOBE_TARGETS } from "./globe-constants";
import { GLOBE_BAND_ROWS } from "./globe-band-order";
import {
  logoAcceptance,
  logoControlSectionInventoryEntry,
  logoInteractionOwnership,
  logoScaleSectionInventoryEntry,
} from "./app-logo-acceptance-data";
import { logoOrbitMotionReferenceInput } from "./app-motion-reference-data";

const persistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

const bandTargets = GLOBE_BAND_ROWS.map(({ bandId }, rowIndex) => ({
  index: bandId,
  displayNumber: rowIndex + 1,
  positionTarget: GLOBE_TARGETS[`band${bandId}Position`],
  widthTarget: GLOBE_TARGETS[`band${bandId}Width`],
}));

const bandInteractionOwnership: Extract<
  ToolcraftProductReadiness,
  { mode: "product" }
>["interactionOwnership"] = [
  {
    alternative: {
      reason:
        "Canvas distance handles would overlap the globe orbit surface and make the shared offset hard to enter precisely.",
      surface: "canvas",
    },
    capability: "property-edit",
    evidence: {
      detail:
        "The user requested a controller for the common distance from the globe surface.",
      source: "user-request",
    },
    id: "band-distance-property",
    reason: "The panel slider exposes one exact shared distance for all four bands.",
    selectionScope: { mode: "global" },
    surface: "panel",
    target: GLOBE_TARGETS.bandDistance,
  },
  {
    alternative: {
      reason:
        "Canvas dot-size handles would add chrome over the ticker bands and duplicate a precise global setting.",
      surface: "canvas",
    },
    capability: "property-edit",
    evidence: {
      detail:
        "The user requested one universal dot-size setting for all bands.",
      source: "user-request",
    },
    id: "band-dot-size-property",
    reason:
      "The panel slider exposes one exact dot diameter while the renderer refits rows from it.",
    selectionScope: { mode: "global" },
    surface: "panel",
    target: GLOBE_TARGETS.bandDotSize,
  },
  {
    alternative: {
      reason:
        "Canvas column-spacing handles would duplicate a precise density setting and obscure the dotted ribbons.",
      surface: "canvas",
    },
    capability: "property-edit",
    evidence: {
      detail:
        "The user requested a parameter controlling the distance between dot columns.",
      source: "user-request",
    },
    id: "band-column-spacing-property",
    reason:
      "The panel slider exposes one exact horizontal dot-grid spacing while the renderer refits column count from it.",
    selectionScope: { mode: "global" },
    surface: "panel",
    target: GLOBE_TARGETS.bandColumnSpacing,
  },
  ...bandTargets.flatMap(({ index, displayNumber, positionTarget, widthTarget }) => [
    {
      alternative: {
        reason:
          "Canvas band handles would duplicate the globe orbit drag area and obscure the clean landing preview.",
        surface: "canvas" as const,
      },
      capability: "property-edit" as const,
      evidence: {
        detail:
          "The user wants to move each band up and down while keeping the same surface distance.",
        source: "user-request" as const,
      },
      id: `band-${index}-position-property`,
      reason:
        "The panel slider gives exact vertical placement while the renderer recalculates radius from that value.",
      selectionScope: { mode: "global" as const },
      surface: "panel" as const,
      target: positionTarget,
    },
    {
      alternative: {
        reason:
          "Canvas resize handles would add editing chrome on top of the white ribbon artwork.",
        surface: "canvas" as const,
      },
      capability: "property-edit" as const,
      evidence: {
        detail: "The user requested a width setting for every band.",
        source: "user-request" as const,
      },
      id: `band-${index}-width-property`,
      reason: `The panel slider gives a precise width for band ${displayNumber} without adding canvas UI.`,
      selectionScope: { mode: "global" as const },
      surface: "panel" as const,
      target: widthTarget,
    },
  ]),
];

const bandAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName: "band distance offsets all globe ribbons",
    browser: true,
    browserTestName: "browser: band distance offsets all globe ribbons",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Distance moves all four dotted flat bands away from or toward the globe while preserving their shared offset.",
    fixture: "landing globe band distance fixture",
    id: "bands.distance",
    interactionId: "band-distance-property",
    kind: "control",
    target: GLOBE_TARGETS.bandDistance,
    userAction: "Drag the Distance slider.",
  },
  {
    automated: true,
    automatedTestName: "band dot size changes every ribbon dot grid",
    browser: true,
    browserTestName: "browser: band dot size changes every ribbon dot grid",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Dot size changes the universal dot diameter and refits the dot rows across all four dotted bands.",
    fixture: "landing globe band dot size fixture",
    id: "bands.dot-size",
    interactionId: "band-dot-size-property",
    kind: "control",
    target: GLOBE_TARGETS.bandDotSize,
    userAction: "Drag the Dot size slider.",
  },
  {
    automated: true,
    automatedTestName: "band column spacing changes every ribbon dot grid",
    browser: true,
    browserTestName: "browser: band column spacing changes every ribbon dot grid",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Column spacing changes the distance between vertical dot columns and refits the column count across all four dotted bands.",
    fixture: "landing globe band column spacing fixture",
    id: "bands.column-spacing",
    interactionId: "band-column-spacing-property",
    kind: "control",
    target: GLOBE_TARGETS.bandColumnSpacing,
    userAction: "Drag the Column spacing slider.",
  },
  ...bandTargets.flatMap(({ index, displayNumber, positionTarget, widthTarget }) => [
    {
      automated: true,
      automatedTestName: `band ${index} position changes ribbon radius`,
      browser: true,
      browserTestName: `browser: band ${index} position changes ribbon radius`,
      componentType: "slider" as const,
      evidence: "rendered-pixels" as const,
      expectedObservable:
        `Dragging Band ${displayNumber} position moves its dotted ribbon vertically and recalculates its visible radius from the shared distance.`,
      fixture: `landing globe band ${index} position fixture`,
      id: `bands.band${index}.position`,
      interactionId: `band-${index}-position-property`,
      kind: "control" as const,
      target: positionTarget,
      userAction: `Drag Band ${displayNumber} position.`,
    },
    {
      automated: true,
      automatedTestName: `band ${index} width changes ribbon thickness`,
      browser: true,
      browserTestName: `browser: band ${index} width changes ribbon thickness`,
      componentType: "slider" as const,
      evidence: "rendered-pixels" as const,
      expectedObservable:
        `Dragging Band ${displayNumber} width changes its dotted ribbon thickness and refits its dot row count without changing the other band positions.`,
      fixture: `landing globe band ${index} width fixture`,
      id: `bands.band${index}.width`,
      interactionId: `band-${index}-width-property`,
      kind: "control" as const,
      target: widthTarget,
      userAction: `Drag Band ${displayNumber} width.`,
    },
  ]),
];

const bandControlSectionInventoryEntries: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Bands",
    entityId: "bands",
    groupingReason:
      "These controls edit the shared offset and dot-grid density for the four flat ribbons that wrap around the globe.",
    id: "bands",
    splitReason:
      "The Bands entity has more than ten controls after adding column spacing, so shared dot-grid controls are separated from per-band layout controls.",
    targets: [
      GLOBE_TARGETS.bandDistance,
      GLOBE_TARGETS.bandDotSize,
      GLOBE_TARGETS.bandColumnSpacing,
    ],
    title: "Bands",
    workflowStage: "shared-dot-grid",
  },
  {
    entity: "Bands",
    entityId: "bands",
    groupingReason:
      "These controls edit the vertical position and width of each individual flat ribbon while preserving the shared dot-grid settings.",
    id: "band-layout",
    splitReason:
      "The Bands entity has more than ten controls after adding column spacing, so per-band layout controls are separated from shared dot-grid controls.",
    targets: bandTargets.flatMap(({ positionTarget, widthTarget }) => [positionTarget, widthTarget]),
    title: "Band Layout",
    workflowStage: "per-band-layout",
  },
];

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
      "The logo orbit is a decorative self-running landing preview effect. Hold tunes only the dwell at final logo positions; there is no app-wide time transport, play/pause, scrub, global duration, loop toggle, or export-at-time behavior.",
  },
  mode: "new-toolcraft-app",
  referenceInputs: [logoOrbitMotionReferenceInput],
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: { mode: "toolcraft-default" },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [
    {
      alternative: {
        reason:
          "Canvas color pickers or numeric handles would add persistent product chrome over a clean landing-background preview.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user asked to control line counts, line thickness, colors, and canvas output parameters as editable settings.",
        source: "user-request",
      },
      id: "globe-line-width-properties",
      reason:
        "The panel gives exact, accessible values for counts, line width, colors, background, and export choices.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: GLOBE_TARGETS.lineWidth,
    },
    {
      alternative: {
        reason:
          "A canvas click target for the sphere boundary would be ambiguous with orbit dragging and would add hidden state to a visual-only circle.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user requested a sidebar option that can turn on the overall globe contour.",
        source: "user-request",
      },
      id: "globe-outline-property",
      reason:
        "The panel switch exposes the contour as a precise global globe property while line width remains the shared thickness control.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: GLOBE_TARGETS.outline,
    },
    ...bandInteractionOwnership,
    ...crtInteractionOwnership,
    ...logoInteractionOwnership,
    {
      alternative: {
        reason:
          "Angle sliders would duplicate the same spatial rotation and make direct visual tilt less discoverable.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail:
          "The user explicitly wants to tilt the globe axis under different angles.",
        source: "user-request",
      },
      id: "globe-axis-orbit",
      reason:
        "The runtime orientation gizmo and direct globe drag keep the axis tilt spatial and avoid mirrored panel controls.",
      surface: "canvas",
      target: GLOBE_TARGETS.orientation,
    },
  ],
  mode: "product",
  productName: "Landing Globe",
  productSummary:
    "A configurable black 3D globe with white latitude and meridian lines, optional synced outline, four offset dotted flat bands, one black dot-mask logo per band, an adjustable foreground CRT scanline/flicker treatment, and a speed-adjustable reference-paced staggered looping logo orbit for landing-page backgrounds.",
  requestedBehavior:
    "Generate a 1920px-wide black-background globe with adjustable latitude/meridian counts, line thickness, optional outer contour, four adjustable dotted flat bands offset from the surface, universal dot size, width-derived dot rows, adjustable dot-column spacing, one opaque black logo mask per band with final-position controls, adjustable CRT intensity over foreground pixels while keeping the black background visually clean, a speed-adjustable reference-paced looping full-orbit logo motion that slows and holds at final positions for a user-controlled time, and axis tilt, without continent shapes.",
  viewInteraction: {
    mode: "orbit",
    orientationTargets: [GLOBE_TARGETS.orientation],
  },
};

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName: "uses the requested default visual preset",
    browser: true,
    browserTestName: "browser: globe reset restores the current sidebar preset",
    componentType: "controlsPanel",
    evidence: "command-side-effect",
    expectedObservable: "A fresh workspace and Reset restore the current sidebar preset, including Speed 2.5, Hold 3 seconds, and Resolution scale 2.",
    fixture: "current sidebar defaults with edited controls",
    id: "globe.default-preset",
    kind: "runtime",
    userAction: "Edit controls, then click Reset controls.",
  },
  {
    automated: true,
    automatedTestName: "background inclusion changes bounded globe background output",
    backgroundOutputCoverage: "all-required-background-output",
    browser: true,
    browserTestName: "browser: background inclusion changes bounded globe background output",
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "Turning Background off hides the bounded black preview background and PNG export keeps transparent background pixels while the globe remains visible.",
    fixture: "landing globe background fixture",
    id: "background.include",
    kind: "control",
    target: GLOBE_TARGETS.includeBackground,
    userAction: "Toggle the Background control in runtime Setup.",
  },
  {
    automated: true,
    automatedTestName: "background color changes globe canvas fill",
    browser: true,
    browserTestName: "browser: background color changes globe canvas fill",
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing the background color changes the pixels behind the globe without adding continent artwork.",
    fixture: "landing globe background color fixture",
    id: "background.color",
    kind: "control",
    target: GLOBE_TARGETS.background,
    userAction: "Change Background color.",
  },
  {
    automated: true,
    automatedTestName: "sphere color changes opaque globe body",
    browser: true,
    browserTestName: "browser: sphere color changes opaque globe body",
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing Sphere recolors the opaque globe body while the white grid remains visible.",
    fixture: "landing globe sphere color fixture",
    id: "globe.sphere-color",
    kind: "control",
    target: GLOBE_TARGETS.sphereColor,
    userAction: "Change Sphere color.",
  },
  {
    automated: true,
    automatedTestName: "line color changes latitude and meridian grid",
    browser: true,
    browserTestName: "browser: line color changes latitude and meridian grid",
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing Lines recolors only the latitude and meridian grid.",
    fixture: "landing globe line color fixture",
    id: "globe.line-color",
    kind: "control",
    target: GLOBE_TARGETS.lineColor,
    userAction: "Change Lines color.",
  },
  {
    automated: true,
    automatedTestName: "latitude count changes horizontal globe rings",
    browser: true,
    browserTestName: "browser: latitude count changes horizontal globe rings",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Latitudes changes the number of horizontal rings on the globe during the drag.",
    fixture: "landing globe latitude count fixture",
    id: "globe.latitude-count",
    kind: "control",
    target: GLOBE_TARGETS.latitudeCount,
    userAction: "Drag the Latitudes slider.",
  },
  {
    automated: true,
    automatedTestName: "meridian count changes vertical globe arcs",
    browser: true,
    browserTestName: "browser: meridian count changes vertical globe arcs",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Meridians changes the number of vertical arcs on the globe during the drag.",
    fixture: "landing globe meridian count fixture",
    id: "globe.meridian-count",
    kind: "control",
    target: GLOBE_TARGETS.meridianCount,
    userAction: "Drag the Meridians slider.",
  },
  {
    automated: true,
    automatedTestName: "line width changes globe grid thickness",
    browser: true,
    browserTestName: "browser: line width changes globe grid thickness",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Line width visibly thickens or thins every latitude and meridian line.",
    fixture: "landing globe line width fixture",
    id: "globe.line-width",
    interactionId: "globe-line-width-properties",
    kind: "control",
    target: GLOBE_TARGETS.lineWidth,
    userAction: "Drag the Line width slider.",
  },
  {
    automated: true,
    automatedTestName: "outline toggle draws synchronized globe circle",
    browser: true,
    browserTestName: "browser: outline toggle draws synchronized globe circle",
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing Outline toggles the outer globe circle while keeping the same color and thickness as the latitude and meridian lines.",
    fixture: "landing globe outline fixture",
    id: "globe.outline",
    interactionId: "globe-outline-property",
    kind: "control",
    target: GLOBE_TARGETS.outline,
    userAction: "Toggle Outline.",
  },
  ...bandAcceptance,
  ...crtAcceptance,
  ...logoAcceptance,
  {
    automated: true,
    automatedTestName: "orientation gizmo tilts globe axis and stays out of export",
    browser: true,
    browserTestName: "browser: orientation gizmo tilts globe axis and stays out of export",
    canvasHandle: {
      exportCleanTestName: "orientation gizmo is excluded from exported globe image",
      outputObservable: "The globe grid rotates while canvas gizmo chrome is absent from export.",
      testId: "toolcraft-orientation-gizmo",
      writesTarget: GLOBE_TARGETS.orientation,
    },
    componentType: "orientationGizmo",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging or snapping the orientation gizmo changes the globe axis and direct model drag writes the same pose.",
    fixture: "landing globe orientation fixture",
    id: "globe.orientation",
    interactionId: "globe-axis-orbit",
    kind: "canvas-handle",
    orientationGizmoCoverage: "all-required-orientation-gizmo-behavior",
    target: GLOBE_TARGETS.orientation,
    userAction: "Drag the orientation gizmo and drag directly on the globe.",
  },
  {
    automated: true,
    automatedTestName: "image export format changes runtime output encoding",
    browser: true,
    browserTestName: "browser: image export format changes runtime output encoding",
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable:
      "Choosing PNG and JPG exports real image files with the globe visible.",
    fixture: "landing globe image format fixture",
    id: "export.image.format",
    kind: "control",
    optionCoverage: ["png", "jpg"],
    target: "export.image.format",
    userAction: "Choose PNG and JPG in Image Export format.",
  },
  {
    automated: true,
    automatedTestName: "image export resolution changes artifact dimensions",
    browser: true,
    browserTestName: "browser: image export resolution changes artifact dimensions",
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable:
      "Choosing 2K and 4K changes the downloaded image long edge while preserving the globe.",
    fixture: "landing globe image resolution fixture",
    id: "export.image.resolution",
    kind: "control",
    optionCoverage: ["2k", "4k", "8k"],
    target: "export.image.resolution",
    userAction: "Choose 2K and 4K in Image Export resolution.",
  },
  {
    actionCoverage: ["export.png"],
    automated: true,
    automatedTestName: "export png downloads configured landing globe image",
    browser: true,
    browserTestName: "browser: export png downloads configured landing globe image",
    componentType: "panelActions",
    evidence: "exported-bytes",
    exportArtifactCoverage: "all-required-image-export-behavior",
    expectedObservable:
      "Export PNG downloads a non-empty image at the selected format and resolution with the black sphere, white grid, dotted bands, logo masks, and adjustable CRT treatment.",
    fixture: "landing globe png export fixture",
    id: "export.image",
    kind: "control",
    target: "actions.output",
    userAction: "Click Export PNG.",
  },
  {
    automated: true,
    automatedTestName: "infinity canvas preserves globe scene bounds and finite restoration",
    browser: true,
    browserTestName: "browser: infinity canvas preserves globe scene bounds and finite restoration",
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Both Infinity transitions preserve the globe world/screen rect, viewport, canvas identity, backing pixels, and animation phase; finite mode restores the 1920x1080 clipping boundary without centering.",
    fixture: "landing globe infinity canvas fixture",
    id: "runtime.infinity-canvas",
    infinityCanvasCoverage: "mode-continuity-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Toggle Infinity canvas, pan/zoom, export, then restore finite mode.",
  },
  {
    automated: true,
    automatedTestName: "infinity canvas image export crops to globe scene bounds",
    browser: true,
    browserTestName: "browser: infinity canvas image export crops to globe scene bounds",
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "In Infinity mode, image export crops to the globe scene bounds instead of the current viewport.",
    fixture: "landing globe infinity scene export fixture",
    id: "runtime.infinity-scene-export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Enable Infinity canvas, pan the viewport, and export the image.",
  },
  {
    automated: true,
    automatedTestName: "render scale keeps selected backing pixels for globe canvas",
    browser: true,
    browserTestName: "browser: render scale keeps selected backing pixels for globe canvas",
    componentType: "canvas",
    evidence: "rendered-pixels",
    expectedObservable:
      "Resolution scale changes Canvas backing pixels without changing the visible globe size.",
    fixture: "landing globe render scale fixture",
    id: "runtime.render-scale",
    kind: "runtime",
    renderScaleCoverage: {
      kind: "selected-backing-pixels",
      states: ["interaction", "steady"],
    },
    target: "canvas.renderScale",
    userAction: "Set Resolution scale to 2, drag the globe orientation, and observe steady preview pixels.",
  },
  {
    automated: true,
    automatedTestName: "reload restores globe values canvas and panels",
    browser: true,
    browserTestName:
      "browser: app restores globe values, canvas, and panel workspace slices after reload",
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Globe counts, dotted bands, dot size, column spacing, logo final positions, logo hold timing, logo speed, CRT intensity, outline, line width, colors, orientation, canvas state, and panel placement remain restored after a real browser reload.",
    fixture: "landing globe persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices,
    target: GLOBE_TARGETS.latitudeCount,
    userAction:
      "Edit globe controls and canvas zoom, move/collapse the panel, wait for persistence, and reload.",
  },
];

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Background inclusion",
    entityId: "background-inclusion",
    groupingReason:
      "The include switch owns whether the product background participates in preview and export.",
    id: "background-inclusion",
    targets: [GLOBE_TARGETS.includeBackground],
    title: "Background",
  },
  {
    entity: "Background color",
    entityId: "background-color",
    groupingReason:
      "The color target owns the product backdrop color while the include switch owns visibility.",
    id: "background-color",
    targets: [GLOBE_TARGETS.background],
    title: "Background Color",
  },
  {
    entity: "Globe",
    entityId: "globe",
    groupingReason:
      "These controls all edit the single generated globe object: body color, grid style, grid density, and axis orientation.",
    id: "globe",
    targets: [
      GLOBE_TARGETS.sphereColor,
      GLOBE_TARGETS.lineColor,
      GLOBE_TARGETS.latitudeCount,
      GLOBE_TARGETS.meridianCount,
      GLOBE_TARGETS.lineWidth,
      GLOBE_TARGETS.orientation,
    ],
    title: "Globe",
  },
  {
    entity: "Globe outline",
    entityId: "globe-outline",
    groupingReason:
      "The outline switch owns only whether the synced sphere silhouette is drawn.",
    id: "globe-outline",
    targets: [GLOBE_TARGETS.outline],
    title: "Globe Outline",
  },
  crtControlSectionInventoryEntry,
  ...bandControlSectionInventoryEntries,
  logoControlSectionInventoryEntry,
  logoScaleSectionInventoryEntry,
  {
    entity: "Image export",
    entityId: "image-export",
    groupingReason:
      "Format and resolution are the paired runtime-owned settings for the requested image artifact.",
    id: "image-export",
    targets: ["export.image.format", "export.image.resolution"],
    title: "Image Export",
  },
];

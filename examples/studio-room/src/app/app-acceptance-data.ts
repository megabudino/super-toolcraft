import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";
import { studioRoomTargets } from "./studio-room-values";

const persistenceSlices =
  appSchema.persistence.storage === "localStorage" ? appSchema.persistence.include : [];

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: {
      evidence:
        "The user requested porting Studio Room without Apply or image/video export, like Recraft Hero and Playground; built-in settings transfer remains.",
      mode: "user-removed",
    },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [
    {
      alternative: {
        reason: "Canvas controls would cover the website-owned room output with editor chrome.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail: "The user requested an independent persistent fill for the inner wall.",
        source: "user-request",
      },
      id: "panel-studio-room-wall-fill",
      reason:
        "A panel color control owns the inner wall appearance without adding editor chrome over the output.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: studioRoomTargets.roomWallFill,
    },
    {
      alternative: {
        reason: "Canvas controls would cover the website-owned room output with editor chrome.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail: "The requested room effect is configured through the Toolcraft controls panel.",
        source: "user-request",
      },
      id: "panel-studio-room-properties",
      reason:
        "Panel controls provide precise persistent values without duplicating visitor motion.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: studioRoomTargets.roomVanishing,
    },
    {
      alternative: {
        reason: "Canvas controls would cover the website-owned room output with editor chrome.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail: "The user requested independent, persistent wall outline thickness controls.",
        source: "user-request",
      },
      id: "panel-studio-room-wall-border-width",
      reason:
        "Panel controls provide precise persistent non-spatial styling without duplicating editor chrome over the output.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: studioRoomTargets.roomWallBorderWidth,
    },
    {
      alternative: {
        reason: "Canvas controls would cover the website-owned room output with editor chrome.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user requested independent, persistent wall outline color and opacity controls.",
        source: "user-request",
      },
      id: "panel-studio-room-wall-border-color",
      reason:
        "Panel controls provide precise persistent non-spatial styling without duplicating editor chrome over the output.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: studioRoomTargets.roomWallBorderColorOpacity,
    },
    {
      alternative: {
        reason: "Canvas controls would cover the website-owned room output with editor chrome.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail: "The user requested a persistent switch for the panel grid continuation.",
        source: "user-request",
      },
      id: "panel-studio-room-inner-grid-enabled",
      reason:
        "A panel switch owns whether the inherited Main Grid continuation appears inside the wall.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: studioRoomTargets.roomInnerGridEnabled,
    },
    {
      alternative: {
        reason:
          "Canvas handles would add spatial editor chrome over the website-owned room output.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail: "The user requested a precise persistent inward reach for the panel continuation.",
        source: "user-request",
      },
      id: "panel-studio-room-inner-grid-depth",
      reason: "A panel slider owns the continuation reach as a precise percentage value.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: studioRoomTargets.roomInnerGridDepth,
    },
    {
      alternative: {
        reason: "Canvas controls would cover the website-owned room output with editor chrome.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail: "The user requested a precise persistent decay curve for the panel continuation.",
        source: "user-request",
      },
      id: "panel-studio-room-inner-grid-falloff",
      reason: "A panel slider owns the exponent-shaped fade without adding canvas chrome.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: studioRoomTargets.roomInnerGridFalloff,
    },
    {
      alternative: {
        reason: "Canvas controls would cover the website-owned room output with editor chrome.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail: "The user requested independent persistent opacity for the panel continuation.",
        source: "user-request",
      },
      id: "panel-studio-room-inner-grid-opacity",
      reason: "A panel slider owns the continuation layer opacity without changing the outer grid.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: studioRoomTargets.roomInnerGridOpacity,
    },
    {
      alternative: {
        reason: "Canvas upload and sorting chrome would obscure the live room preview.",
        surface: "canvas",
      },
      capability: "collection-edit",
      evidence: {
        detail: "The user requested an ordered image uploader for room tiles.",
        source: "user-request",
      },
      id: "panel-studio-room-tile-images",
      reason: "The built-in fileDrop is the single owner of upload, order, transform, and removal.",
      surface: "panel",
      target: studioRoomTargets.tilesImages,
    },
  ],
  mode: "product",
  productName: "Recraft Studio Room",
  productSummary:
    "A live Toolcraft controller for the website-owned Studio Room geometry, inner-grid continuation, grids, tiles, motion, depth trail, and ordered image set.",
  requestedBehavior:
    "Configure the Studio Room effect live, upload an ordered tile image set, reset through the standard Controls header, and transfer settings using the built-in Settings controls. No Apply or image/video export.",
  viewInteraction: {
    evidence:
      "The inspected website section has fixed framing and no requested camera interaction.",
    mode: "fixed-camera",
    source: "inspected-reference",
  },
};

function studioRoomControlAcceptance(
  target: string,
  componentType: ToolcraftComponentAcceptance["componentType"],
): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: `${target} maps into the Studio Room v6 settings payload`,
    browser: true,
    browserTestName: `browser: ${target} updates the real Studio Room preview`,
    componentType,
    evidence: "product-output",
    expectedObservable: `Changing ${target} updates its matching Studio Room visual property in the native canvas.`,
    fixture: "Default Studio Room website preview",
    id: target,
    kind: "control",
    target,
    userAction: `Change ${target} in the Toolcraft panel.`,
  };
}

const studioRoomControlAcceptanceEntries: readonly ToolcraftComponentAcceptance[] = [
  studioRoomControlAcceptance(studioRoomTargets.compositionFirstRowScale, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.compositionSecondRowScale, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.compositionLineGap, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.compositionButtonGap, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.roomDepth, "slider"),
  {
    ...studioRoomControlAcceptance(studioRoomTargets.roomWallFill, "color"),
    automatedTestName: "Wall fill live-recolors only the Studio Room inner wall",
    expectedObservable:
      "Changing Wall fill updates the opaque inner back-wall rectangle without recoloring the outer room surfaces, grids, tiles, or border.",
    interactionId: "panel-studio-room-wall-fill",
  },
  {
    ...studioRoomControlAcceptance(studioRoomTargets.roomVanishing, "vector"),
    controlPartCoverage: ["vector.x", "vector.y"],
    interactionId: "panel-studio-room-properties",
  },
  {
    ...studioRoomControlAcceptance(studioRoomTargets.roomWallBorderWidth, "slider"),
    automatedTestName: "Border width updates the Studio Room wall outline independently",
    expectedObservable:
      "Changing Border width updates the website-owned wall outline thickness live and independently of the grid line treatment.",
    interactionId: "panel-studio-room-wall-border-width",
  },
  {
    ...studioRoomControlAcceptance(studioRoomTargets.roomWallBorderColorOpacity, "colorOpacity"),
    automatedTestName: "Border color live-recolors the Studio Room wall outline independently",
    controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
    expectedObservable:
      "Changing Border color live recolors the website-owned wall outline independently of the grid and fog styling.",
    interactionId: "panel-studio-room-wall-border-color",
  },
  {
    ...studioRoomControlAcceptance(studioRoomTargets.roomInnerGridEnabled, "switch"),
    automatedTestName: "Inner Grid Active toggles the panel continuation layer",
    expectedObservable:
      "Turning Active on makes the inherited Main Grid continuation appear inside the panel; turning it off removes the continuation.",
    interactionId: "panel-studio-room-inner-grid-enabled",
  },
  {
    ...studioRoomControlAcceptance(studioRoomTargets.roomInnerGridDepth, "slider"),
    automatedTestName: "Inner Grid Depth changes edge-inward continuation reach",
    expectedObservable:
      "Increasing Depth widens the continuation reach inward from all four panel edges as a percentage of the smaller panel side.",
    interactionId: "panel-studio-room-inner-grid-depth",
  },
  {
    ...studioRoomControlAcceptance(studioRoomTargets.roomInnerGridFalloff, "slider"),
    automatedTestName: "Inner Grid Falloff reshapes the continuation decay",
    expectedObservable:
      "Changing Falloff hardens or softens the inherited Main Grid continuation decay without continuing the Fine Grid.",
    interactionId: "panel-studio-room-inner-grid-falloff",
  },
  {
    ...studioRoomControlAcceptance(studioRoomTargets.roomInnerGridOpacity, "slider"),
    automatedTestName: "Inner Grid Opacity dims only the continuation layer",
    expectedObservable:
      "Lowering Opacity dims the panel continuation layer without changing the outer Main Grid or Fine Grid.",
    interactionId: "panel-studio-room-inner-grid-opacity",
  },
  studioRoomControlAcceptance(studioRoomTargets.gridColumns, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.gridRows, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.gridDepthDivisions, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.gridColor, "color"),
  studioRoomControlAcceptance(studioRoomTargets.gridOpacity, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.gridThickness, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.fineGridEnabled, "switch"),
  studioRoomControlAcceptance(studioRoomTargets.fineGridSubdivision, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.fineGridColor, "color"),
  studioRoomControlAcceptance(studioRoomTargets.fineGridOpacity, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.fineGridThickness, "slider"),
  {
    ...studioRoomControlAcceptance(studioRoomTargets.tilesPerSurface, "slider"),
    automatedTestName: "Per surface changes Studio Room density without shared tile edges",
    expectedObservable:
      "Changing Per surface changes rendered tile density while tiles never share edges; high density may report fewer tiles on coarse grids.",
  },
  studioRoomControlAcceptance(studioRoomTargets.tilesInterval, "slider"),
  {
    ...studioRoomControlAcceptance(studioRoomTargets.tilesShuffleStyle, "segmented"),
    optionCoverage: ["swap", "slide"],
  },
  studioRoomControlAcceptance(studioRoomTargets.tilesDevelop, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.tilesHoverLift, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.tilesFog, "slider"),
  {
    automated: true,
    automatedTestName: "tile image descriptors preserve media order and transforms",
    browser: true,
    browserTestName: "browser: tile images preserve upload order and transforms",
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable:
      "All 24 default images appear as attached thumbnails. Attached images are the exclusive ordered tile pool; removing all images leaves the room empty and Reset restores the default attachments.",
    fixture: "24 default WebPs plus a separately uploaded room WebP",
    id: studioRoomTargets.tilesImages,
    interactionId: "panel-studio-room-tile-images",
    kind: "control",
    mediaLifecycleCoverage: [
      "upload",
      "remove",
      "reset",
      "rotate",
      "flip",
      "transform-output",
      "reorder",
      "order-output",
    ],
    target: studioRoomTargets.tilesImages,
    userAction: "Upload, reorder, rotate, flip, remove, and Reset tile images.",
  },
  studioRoomControlAcceptance(studioRoomTargets.motionEnabled, "switch"),
  studioRoomControlAcceptance(studioRoomTargets.motionParallax, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.motionSmoothness, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.motionScrollNudge, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.trailEnabled, "switch"),
  studioRoomControlAcceptance(studioRoomTargets.trailAmount, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.trailStrength, "slider"),
  studioRoomControlAcceptance(studioRoomTargets.trailFade, "slider"),
];

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  ...studioRoomControlAcceptanceEntries,
  {
    automated: true,
    automatedTestName:
      "sends the current Canvas height only after the Studio Room preview is ready",
    browser: true,
    browserTestName: "browser: Canvas height resizes the real Recraft Studio Room",
    componentType: "text",
    evidence: "product-output",
    expectedObservable:
      "Changing Canvas height resizes both the Toolcraft artboard and the website-owned Studio Room section to the same pixel height.",
    fixture: "Recraft Studio Room preview at the default 1920 by 1080 size",
    id: "section.height",
    kind: "control",
    target: "canvas.size.height",
    userAction: "Enter a new value in Canvas height and commit it.",
  },
  {
    automated: true,
    automatedTestName: "infinity mode keeps the external preview on its exact scene bounds",
    browser: true,
    browserTestName: "browser: infinity mode restores the exact finite Studio Room size",
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity mode removes finite artboard clipping and disabling it restores the exact finite Studio Room preview size.",
    fixture: "Finite 1920 by 1080 Studio Room preview",
    id: "canvas.infinity",
    infinityCanvasCoverage: "mode-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Enable Infinity canvas, then disable it again.",
  },
  {
    automated: true,
    automatedTestName: "declares production reload coverage for the Studio Room bridge",
    browser: true,
    browserTestName: "browser: app restores exact canvas and panel workspace slices after reload",
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Canvas size and zoom plus the Controls workspace are restored after a real browser reload.",
    fixture: "Changed Studio Room canvas height and Controls workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices,
    target: "canvas.size.height",
    userAction:
      "Edit canvas height and zoom, collapse Controls, wait for persistence, and reload the page.",
  },
];

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Studio Room center composition",
    entityId: "studio-room-center-composition",
    groupingReason:
      "The two row scales and two vertical gaps define the centered Figma title and CTA composition.",
    id: "center-composition",
    targets: [
      studioRoomTargets.compositionFirstRowScale,
      studioRoomTargets.compositionSecondRowScale,
      studioRoomTargets.compositionLineGap,
      studioRoomTargets.compositionButtonGap,
    ],
    title: "Center Composition",
  },
  {
    entity: "Studio Room geometry",
    entityId: "studio-room-geometry",
    groupingReason:
      "Depth, vanishing point, wall fill, and wall border together define the room's terminal face.",
    id: "room",
    targets: [
      studioRoomTargets.roomDepth,
      studioRoomTargets.roomVanishing,
      studioRoomTargets.roomWallFill,
      studioRoomTargets.roomWallBorderWidth,
      studioRoomTargets.roomWallBorderColorOpacity,
    ],
    title: "Room",
  },
  {
    entity: "Studio Room inner grid continuation",
    entityId: "studio-room-inner-grid",
    groupingReason:
      "Activation, edge-inward depth, exponent falloff, and layer opacity define the Main Grid continuation inside the terminal wall.",
    id: "inner-grid",
    targets: [
      studioRoomTargets.roomInnerGridEnabled,
      studioRoomTargets.roomInnerGridDepth,
      studioRoomTargets.roomInnerGridFalloff,
      studioRoomTargets.roomInnerGridOpacity,
    ],
    title: "Inner Grid",
  },
  {
    entity: "Studio Room main grid",
    entityId: "studio-room-main-grid",
    groupingReason: "Grid divisions and line treatment define the tile-bearing room grid.",
    id: "main-grid",
    targets: [
      studioRoomTargets.gridColumns,
      studioRoomTargets.gridRows,
      studioRoomTargets.gridDepthDivisions,
      studioRoomTargets.gridColor,
      studioRoomTargets.gridOpacity,
      studioRoomTargets.gridThickness,
    ],
    title: "Main Grid",
  },
  {
    entity: "Studio Room fine grid",
    entityId: "studio-room-fine-grid",
    groupingReason:
      "Activation, subdivision, and line treatment define the aligned decorative grid.",
    id: "fine-grid",
    targets: [
      studioRoomTargets.fineGridEnabled,
      studioRoomTargets.fineGridSubdivision,
      studioRoomTargets.fineGridColor,
      studioRoomTargets.fineGridOpacity,
      studioRoomTargets.fineGridThickness,
    ],
    title: "Fine Grid",
  },
  {
    entity: "Studio Room tiles",
    entityId: "studio-room-tiles",
    groupingReason:
      "Count, shuffle timing, transition style, reveal, hover response, and fog define tile presentation.",
    id: "tiles",
    targets: [
      studioRoomTargets.tilesPerSurface,
      studioRoomTargets.tilesInterval,
      studioRoomTargets.tilesShuffleStyle,
      studioRoomTargets.tilesDevelop,
      studioRoomTargets.tilesHoverLift,
      studioRoomTargets.tilesFog,
    ],
    title: "Tiles",
  },
  {
    entity: "Studio Room tile image set",
    entityId: "studio-room-tile-images",
    groupingReason:
      "The uploader is the complete ordered source, transform, removal, and reset surface for tile images.",
    id: "tile-images",
    targets: [studioRoomTargets.tilesImages],
    title: "Tile Images",
  },
  {
    entity: "Studio Room motion",
    entityId: "studio-room-motion",
    groupingReason:
      "Activation, parallax, spring response, and scroll nudge define global room motion.",
    id: "motion",
    targets: [
      studioRoomTargets.motionEnabled,
      studioRoomTargets.motionParallax,
      studioRoomTargets.motionSmoothness,
      studioRoomTargets.motionScrollNudge,
    ],
    title: "Motion",
  },
  {
    entity: "Studio Room depth trail",
    entityId: "studio-room-depth-trail",
    groupingReason:
      "Activation, line amount, peak opacity, and fade define the directional depth trail.",
    id: "depth-trail",
    targets: [
      studioRoomTargets.trailEnabled,
      studioRoomTargets.trailAmount,
      studioRoomTargets.trailStrength,
      studioRoomTargets.trailFade,
    ],
    title: "Depth Trail",
  },
];

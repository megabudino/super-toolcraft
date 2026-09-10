import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";

const automatedTestName =
  "image gallery acceptance maps schema, media, and interaction state to product output";

const browserTests = {
  controls: "browser: image gallery controls update rendered output",
  deckBehavior: "browser: deck navigation and image-only export stay in sync",
  deckControls: "browser: deck layout controls update rendered output",
  export: "browser: image gallery background and export preserve output semantics",
  interaction: "browser: image gallery canvas navigation preserves physical behavior",
  media: "browser: image gallery media lifecycle controls the rendered sequence",
  persistence: "browser: image gallery settings and media persist after reload",
} as const;

function controlRow({
  browserTestName = browserTests.controls,
  componentType,
  expectedObservable,
  id,
  target,
  userAction,
  ...extra
}: {
  browserTestName?: string;
  componentType: string;
  expectedObservable: string;
  id: string;
  target: string;
  userAction: string;
} & Partial<ToolcraftComponentAcceptance>): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName,
    componentType,
    evidence: "product-output",
    expectedObservable,
    fixture: "Uploaded color-grid image sequence in the image gallery",
    id,
    kind: "control",
    target,
    userAction,
    ...extra,
  };
}

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
};

export const appProductReadiness: ToolcraftProductReadiness = {
  interactionOwnership: [
    {
      alternative: {
        reason:
          "Canvas collection chrome would obscure the images and duplicate the runtime upload and sorting tools.",
        surface: "canvas",
      },
      capability: "collection-edit",
      evidence: {
        detail:
          "Toolcraft fileDrop provides accessible multi-image upload, ordering, transforms, and removal.",
        source: "usability-analysis",
      },
      id: "gallery-source-collection",
      reason:
        "The panel is the precise, discoverable owner for managing the image sequence.",
      surface: "panel",
      target: "source.images",
    },
  ],
  mode: "product",
  productName: "Spatial Gallery",
  productSummary:
    "A configurable WebGL image gallery with fourteen mixed JPG presets, curved Flow and Deck layouts, inertial navigation, physical card bending, soft cast card shadows, raster export, and an agent-ready code package.",
  requestedBehavior:
    "Keep the adjustable physical image-card gallery and its mixed presets, keep preview and raster export limited to image cards plus an optional flat background, and provide both PNG/JPG export and portable code export.",
  viewInteraction: {
    evidence:
      "The user explicitly requested that the current gallery behavior remain while its presentation design is removed; wheel, drag, and keys browse images without rotating the camera.",
    mode: "fixed-camera",
    source: "explicit-user-request",
  },
};

const flowSliderTargets = [
  "spiral.radius",
  "spiral.twistDegrees",
  "spiral.verticalGap",
  "spiral.depth",
  "spiral.depthOffset",
  "spiral.taper",
  "spiral.repetitions",
] as const;

const sharedSliderTargets = [
  "card.width",
  "card.height",
  "card.curveRadius",
  "card.cornerRadius",
  "shadow.blur",
  "depth.tiltDegrees",
  "depth.focusFalloff",
  "depth.focusFloor",
  "depth.scaleFalloff",
  "depth.minScale",
  "physics.wheelSpeed",
  "physics.dragSpeed",
  "physics.keyStep",
  "physics.inertia",
  "physics.flexStrength",
  "physics.flexResponse",
  "physics.snapStrength",
  "interaction.pressDepth",
  "interaction.pressShrink",
  "interaction.parallax",
  "view.perspective",
  "view.cameraDistance",
  "view.sceneOffset",
  "view.portraitScale",
] as const;

const deckSliders = [
  [
    "stack-gap",
    "stack.gap",
    "Vertical spacing between the resting deck cards changes.",
  ],
  [
    "stack-depth-step",
    "stack.depthStep",
    "Depth recession per card changes the perspective taper of the deck.",
  ],
  [
    "stack-back-tilt",
    "stack.backTiltDegrees",
    "The resting cards use a visibly different back tilt.",
  ],
  [
    "stack-fall-distance",
    "stack.fallDistance",
    "The passed card drops a visibly different distance before fading.",
  ],
  [
    "stack-fall-tilt",
    "stack.fallTiltDegrees",
    "The passed card reaches a visibly different angle while it falls.",
  ],
  [
    "stack-scroll-weight",
    "stack.scrollWeight",
    "The deck approaches the next card with a visibly different weighted glide.",
  ],
] as const;

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  controlRow({
    browserTestName: browserTests.media,
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable:
      "Fourteen predefined JPG images start attached in a mixed order; removal can reach an empty gallery, Reset restores their exact order, and upload, reorder, rotate, flip, and remove continue to change rendered sources.",
    fixture:
      "Fourteen predefined JPG gallery images plus uploaded deterministic color-grid images",
    id: "source-images",
    interactionId: "gallery-source-collection",
    mediaLifecycleCoverage: [
      "default-remove",
      "default-reset",
      "upload",
      "reorder",
      "order-output",
      "rotate",
      "flip",
      "transform-output",
      "remove",
      "reset",
    ],
    target: "source.images",
    userAction:
      "Remove the fourteen predefined images, reset the Gallery section to restore the mixed set, then replace them with deterministic uploads, reorder, transform, and remove an item.",
  }),
  controlRow({
    browserTestName: browserTests.deckControls,
    componentType: "segmented",
    expectedObservable:
      "Switching between Flow and Deck changes the image-card arrangement while preserving media order.",
    id: "layout-mode",
    optionCoverage: "each-visible-item",
    target: "layout.mode",
    userAction: "Toggle the Layout control between Flow and Deck.",
  }),
  ...flowSliderTargets.map((target) =>
    controlRow({
      ...(target === "spiral.verticalGap" ? { browserTestName: "browser: Spatial Gallery vertical gap changes rendered cards" } : {}),
      componentType: "slider",
      expectedObservable: `${target} changes the curved Flow geometry or visible card count.`,
      id: target.replaceAll(".", "-"),
      target,
      userAction: `Switch to Flow, change ${target}, and observe the image cards.`,
      ...(target === "spiral.radius"
        ? { visibilityCoverage: ["hidden", "visible"] as const }
        : {}),
    }),
  ),
  ...deckSliders.map(([id, target, expectedObservable]) =>
    controlRow({
      browserTestName: browserTests.deckControls,
      componentType: "slider",
      expectedObservable,
      id,
      target,
      userAction: `Switch to Deck, change ${target}, and observe the image cards.`,
      visibilityCoverage: ["hidden", "visible"],
    }),
  ),
  ...sharedSliderTargets.map((target) =>
    controlRow({
      ...(target === "card.cornerRadius" ? { browserTestName: "browser: Spatial Gallery corner radius changes rendered cards" } : {}),
      componentType: "slider",
      expectedObservable: `${target} changes card geometry, depth, cast-shadow spread, motion response, interaction feedback, or the fixed scene view.`,
      id: target.replaceAll(".", "-"),
      target,
      userAction: `Change ${target} and observe the image cards.`,
    }),
  ),
  controlRow({
    componentType: "colorOpacity",
    controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
    expectedObservable:
      "Changing the shadow hex tints every card's cast shadow and changing the opacity strengthens or removes it in preview and export.",
    id: "shadow-color",
    target: "shadow.color",
    userAction:
      "Edit the Shadow color hex and opacity fields and observe the cast shadows.",
  }),
  controlRow({
    componentType: "vector",
    controlPartCoverage: ["vector.x", "vector.y"],
    expectedObservable:
      "Moving the offset pad shifts every card's cast shadow horizontally and vertically, as if the light source moved.",
    id: "shadow-offset",
    target: "shadow.offset",
    userAction:
      "Move the Shadow offset pad on both axes and observe the cast shadows.",
  }),
  controlRow({
    componentType: "switch",
    expectedObservable:
      "The same input reverses gallery travel without changing image order.",
    id: "interaction-invert-direction",
    target: "interaction.invertDirection",
    userAction: "Turn Invert direction on, then use an arrow key.",
  }),
  controlRow({
    backgroundOutputCoverage: [
      "preview-hidden-when-excluded",
      "image-transparent-when-excluded",
    ],
    browserTestName: browserTests.export,
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "The default excluded state leaves only image cards and their cast shadows visible; enabling it adds one flat product background and transparent PNG pixels return when disabled.",
    id: "background-include",
    target: "export.includeBackground",
    userAction: "Toggle Include and export PNG.",
  }),
  controlRow({
    browserTestName: browserTests.export,
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing the background color updates the optional flat preview background and included still export.",
    id: "background-color",
    target: "appearance.background",
    userAction: "Enable the background and choose a contrasting color.",
  }),
  controlRow({
    browserTestName: browserTests.export,
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable:
      "PNG and JPG choices change the encoded MIME type and file extension.",
    id: "image-format",
    optionCoverage: "each-visible-item",
    target: "export.image.format",
    userAction: "Export the same gallery as PNG and JPG.",
  }),
  controlRow({
    browserTestName: browserTests.export,
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable:
      "2K, 4K, and 8K choices set real decoded long-edge dimensions.",
    id: "image-resolution",
    optionCoverage: "each-visible-item",
    target: "export.image.resolution",
    userAction: "Export at two image resolutions and compare dimensions.",
  }),
  controlRow({
    actionCoverage: ["export.png", "export.code"],
    browserTestName: browserTests.export,
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Export PNG downloads the selected raster output and Export Code downloads an agent-ready ZIP with current settings, renderer modules, and image assets.",
    id: "export-actions",
    target: "export.actions",
    userAction: "Click both Export PNG and Export Code and inspect the downloaded artifacts.",
  }),
  {
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName: browserTests.persistence,
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Edited gallery values, canvas size, panel state, and attached image records restore after reload.",
    fixture: "Edited physics value and uploaded deterministic images",
    id: "persistence-reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    userAction: "Edit a value, upload images, reload, and inspect restored output.",
  },
  {
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName: browserTests.interaction,
    componentType: "canvas-interaction",
    evidence: "product-output",
    expectedObservable:
      "Wheel, vertical drag, and arrow keys advance the wrapped image index, preserve the fixed camera, and produce direction-signed transient flex.",
    fixture: "Three uploaded color-grid images",
    id: "gallery-canvas-navigation",
    kind: "runtime",
    userAction: "Scroll, drag vertically, and press both navigation directions.",
  },
  {
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName: browserTests.deckBehavior,
    componentType: "canvas-interaction",
    evidence: "product-output",
    expectedObservable:
      "Deck input advances one image at a time: the incoming card moves forward, the outgoing card tips and fades, and the deck settles on a whole image.",
    fixture: "Four deterministic images in Deck layout",
    id: "deck-canvas-navigation",
    kind: "runtime",
    userAction: "Switch to Deck, advance with wheel and keys, and let it settle.",
  },
  {
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName: browserTests.deckBehavior,
    componentType: "custom-renderer",
    evidence: "product-output",
    expectedObservable:
      "Flow and Deck render uploaded image cards, each with its soft cast shadow, and no product text, file-name captions, indexes, hints, dots, vignette, or gradient chrome.",
    fixture: "Four deterministic images in both layouts",
    id: "image-only-output",
    kind: "runtime",
    userAction: "Load images, switch layouts, and inspect the product canvas.",
  },
  {
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName: browserTests.deckBehavior,
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Deck can be delivered as a non-empty PNG and as a code package that preserves the selected layout and physical renderer.",
    fixture: "Four deterministic images in Deck layout",
    id: "deck-export",
    kind: "runtime",
    userAction: "Switch to Deck and download both raster and code artifacts.",
  },
];

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Source image sequence",
    groupingReason:
      "Upload, ordering, transforms, removal, and reset belong to one gallery source collection.",
    targets: ["source.images"],
    title: "Gallery",
  },
  {
    entity: "Gallery arrangement",
    groupingReason:
      "The layout selector chooses the curved Flow or front-facing Deck composition for the same source sequence.",
    targets: ["layout.mode"],
    title: "Layout",
  },
  {
    entity: "Curved flow path",
    groupingReason:
      "These values jointly place repeated cards along the endless curved path.",
    targets: flowSliderTargets,
    title: "Flow",
  },
  {
    entity: "Stacked deck path",
    groupingReason:
      "These values shape the resting deck, the outgoing card transition, and the weighted scroll motion.",
    targets: deckSliders.map(([, target]) => target),
    title: "Deck",
  },
  {
    entity: "Card surface",
    groupingReason:
      "Dimensions, permanent curvature, and corner shape define each image card.",
    targets: ["card.width", "card.height", "card.curveRadius", "card.cornerRadius"],
    title: "Cards",
  },
  {
    entity: "Card cast shadow",
    groupingReason:
      "Color with opacity and blur shape the appearance of every card's cast shadow.",
    targets: ["shadow.color", "shadow.blur"],
    title: "Shadow",
  },
  {
    entity: "Card shadow direction",
    groupingReason:
      "The two-axis light offset owns the horizontal and vertical direction of every card's cast shadow.",
    targets: ["shadow.offset"],
    title: "Offset",
  },
  {
    entity: "Distance treatment",
    groupingReason:
      "Tilt, brightness, and scale falloff work together to express scene depth.",
    targets: [
      "depth.tiltDegrees",
      "depth.focusFalloff",
      "depth.focusFloor",
      "depth.scaleFalloff",
      "depth.minScale",
    ],
    title: "Depth",
  },
  {
    entity: "Navigation simulation",
    groupingReason:
      "Input impulses, interpolation, physical flex, and snapping form one motion system.",
    targets: [
      "physics.wheelSpeed",
      "physics.dragSpeed",
      "physics.keyStep",
      "physics.inertia",
      "physics.flexStrength",
      "physics.flexResponse",
      "physics.snapStrength",
    ],
    title: "Physics",
  },
  {
    entity: "Direct input feedback",
    groupingReason:
      "These controls tune pointer press, parallax, and direction without duplicating canvas browsing.",
    targets: [
      "interaction.pressDepth",
      "interaction.pressShrink",
      "interaction.parallax",
      "interaction.invertDirection",
    ],
    title: "Interaction",
  },
  {
    entity: "Fixed scene view",
    groupingReason:
      "Camera projection, responsive scale, offset, and fog define the image-card view.",
    targets: [
      "view.perspective",
      "view.cameraDistance",
      "view.sceneOffset",
      "view.portraitScale",
    ],
    title: "View",
  },
  {
    entity: "Still output background",
    groupingReason:
      "The include state and color control the optional flat preview and still background.",
    targets: ["export.includeBackground", "appearance.background"],
    title: "Background",
  },
  {
    groupingReason:
      "Format and resolution are the required paired settings for final image delivery.",
    targets: ["export.image.format", "export.image.resolution"],
    title: "Image Export",
    workflowStage: "Still image delivery",
  },
];

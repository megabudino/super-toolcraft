import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
  videoReferenceStudy: {
    acceptanceMapping: [
      {
        acceptanceId: "composition-seed",
        behavior:
          "The reference generates deterministic template micrographics whose codes, phases, and geometry re-roll through Randomize Content.",
        frameIds: ["templates-panel", "randomize-content"],
      },
      {
        acceptanceId: "library-template",
        behavior:
          "A template palette with thumbnails lets the user pick a brush and stamp it into a drawn region on the photo.",
        frameIds: ["templates-panel", "place-big-number"],
      },
      {
        acceptanceId: "canvas-element-transform",
        behavior:
          "Placed elements are selected, moved, and resized directly on the photo with a rect outline and corner handle; Delete removes them.",
        frameIds: ["place-big-number", "move-resize", "arrange-panel"],
      },
      {
        acceptanceId: "canvas-content-edit",
        behavior:
          "Each element owns editable multiline content using 'key | value' rows and '---' divider lines, edited in place for the selected element.",
        frameIds: ["content-editor"],
      },
      {
        acceptanceId: "canvas-color-edit",
        behavior:
          "Each element renders in white or black ink over the photograph via a Color White/Black toggle.",
        frameIds: ["checklist-props"],
      },
      {
        acceptanceId: "elements-opacity",
        behavior:
          "Element opacity is adjustable from the properties panel while staying legible over the photo.",
        frameIds: ["checklist-props"],
      },
      {
        acceptanceId: "output-export",
        behavior:
          "The finished poster exports as a raster image through an Export PNG action.",
        frameIds: ["export-final"],
      },
    ],
    behaviorDecomposition:
      "The reference app decomposes into: a photo canvas with aspect-ratio crops and snap grid; a template library of about twenty parametric micrographic brushes (caption, spec sheet, data table, barcode, big number, coords, run state, brackets, hatch, ruler, target, QR code, globe, waveform, dimension, checklist, sequence, graph, radar, timecode) plus composite sticker labels; per-element state of rect, white/black ink, opacity, type size, and multiline key|value content with deterministic randomization; direct canvas selection, move, resize, duplicate, delete, and front/back arrange; undo and PNG/SVG export. This Toolcraft product keeps the same element grammar and direct manipulation but replaces manual brush stamping with a seeded generator plus canvas refinement, per the approved redesign.",
    extractionEvidence:
      "65 one-second frames extracted with ffmpeg fps=1 into eight 3x3 contact sheets, plus full-resolution crops of the tools panel, templates list, library tab, aspect-ratio bar, and the checklist/content property panels.",
    referenceLocation: "Uploaded interface recording 'Video 2078113090722308097.mp4' (65 s, 3112x2160).",
    storyboard: [
      {
        behaviorObservation:
          "TEMPLATES tab lists parametric brushes: CAPTION, SPEC SHEET, DATA TABLE, BARCODE, BIG NUMBER, COORDS, RUN STATE, BRACKETS, HATCH, RULER, TARGET, QR CODE, GLOBE, WAVEFORM, DIMENSION, CHECKLIST.",
        frameId: "templates-panel",
        frameSource: "frame_002.png",
        timeSeconds: 2,
        visualObservation:
          "MICROGRAPH editor with dark chrome, photo poster on canvas, tools MOVE/SELECT (V) and ADD TEXT (T) with H1/H2/BODY/MIX sizes.",
      },
      {
        behaviorObservation:
          "Dragging an area on the photo with the BIG NUMBER brush stamps a large numeral into that rect; a selection outline with corner handles appears.",
        frameId: "place-big-number",
        frameSource: "frame_004.png",
        timeSeconds: 4,
        visualObservation: "White '56' placed over the lower photo area inside a drawn region.",
      },
      {
        behaviorObservation:
          "The selected element is moved and resized by dragging its body and corner handle; a RUN STATE list is stamped beside it.",
        frameId: "move-resize",
        frameSource: "frame_007.png",
        timeSeconds: 7,
        visualObservation:
          "'56' plus 'PHASE 01 INTAKE…05 SHIP' list with filled/empty state dots aligned to the numeral.",
      },
      {
        behaviorObservation:
          "The right panel edits the selected element CONTENT as plain text with 'key | value' rows, a RANDOMIZE CONTENT button, and hint 'Use | to split key / value, --- for a divider line.'",
        frameId: "content-editor",
        frameSource: "frame_014.png",
        timeSeconds: 14,
        visualObservation: "CONTENT textarea holding the phase list; ARRANGE with BACK/FRONT/DUPLICATE/DELETE.",
      },
      {
        behaviorObservation:
          "Template properties expose COLOR White/Black, OPACITY 0-100, and TYPE SIZE sliders that update the placed element live.",
        frameId: "checklist-props",
        frameSource: "frame_037.png",
        timeSeconds: 37,
        visualObservation:
          "TEMPLATE · CHECKLIST panel over the runner photo with CHECK rows '01 | ALIGN | OK'.",
      },
      {
        behaviorObservation:
          "Randomize Content re-rolls codes and rows deterministically per template; new photos restart the composition with GRAPH, RADAR, and address blocks.",
        frameId: "randomize-content",
        frameSource: "frame_031.png",
        timeSeconds: 31,
        visualObservation:
          "Runner photo with radar circle sweep, address block 'TO STUDIO VEKTOR HAUS…', and graph frame.",
      },
      {
        behaviorObservation:
          "The ARRANGE group orders elements front/back and duplicates or deletes them.",
        frameId: "arrange-panel",
        frameSource: "frame_040.png",
        timeSeconds: 40,
        visualObservation: "SEQUENCE column '001…005' beside CHECK rows over the green track photo.",
      },
      {
        behaviorObservation:
          "The toolbar exposes GRID aspect crops (ORIG/1:1/4:5/3:4/9:16/4:3/3:2/16:9/21:9), SNAP, UNDO, CLEAR, export scale, SVG, and Export PNG.",
        frameId: "export-final",
        frameSource: "frame_060.png",
        timeSeconds: 60,
        visualObservation:
          "Black-and-white portrait with QR sticker, globe barcode strip, and 2025 label ready for export.",
      },
    ],
    transitionAnalysis: [
      {
        behaviorDelta:
          "Brush selection plus a drag gesture on the photo creates a new element whose rect equals the drawn region; selection transfers to the new element.",
        fromFrameId: "templates-panel",
        id: "stamp-creates-element",
        toFrameId: "place-big-number",
      },
      {
        behaviorDelta:
          "Dragging the element body translates its rect; dragging the corner handle rescales it; the template relayouts its internal grammar to the new rect.",
        fromFrameId: "place-big-number",
        id: "transform-relayouts-template",
        toFrameId: "move-resize",
      },
      {
        behaviorDelta:
          "Selecting an element swaps the right panel to that element's template properties and content; edits apply live to the canvas.",
        fromFrameId: "move-resize",
        id: "selection-binds-properties",
        toFrameId: "content-editor",
      },
      {
        behaviorDelta:
          "COLOR/OPACITY/TYPE SIZE changes restyle only the selected element while other elements and the photo stay unchanged.",
        fromFrameId: "content-editor",
        id: "style-scopes-to-selection",
        toFrameId: "checklist-props",
      },
      {
        behaviorDelta:
          "RANDOMIZE CONTENT replaces the content lines with a new deterministic sample while rect, style, and template stay fixed.",
        fromFrameId: "checklist-props",
        id: "randomize-preserves-rect",
        toFrameId: "randomize-content",
      },
      {
        behaviorDelta:
          "Export renders only the photo plus placed elements; selection outlines, handles, and grid chrome are excluded from output.",
        fromFrameId: "arrange-panel",
        id: "export-excludes-chrome",
        toFrameId: "export-final",
      },
    ],
  },
};

export const appProductReadiness: ToolcraftProductReadiness = {
  interactionOwnership: [
    {
      alternative: {
        reason:
          "Panel X/Y/width/height fields would duplicate the direct manipulation the reference demonstrates.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail:
          "The reference video shows elements selected, moved, resized by a corner handle, and deleted directly on the photo.",
        source: "reference",
      },
      id: "canvas-element-transform",
      reason:
        "Direct drag, resize, and delete preserve continuous visual feedback over the photograph.",
      surface: "canvas",
      target: "controls.setValue",
    },
    {
      alternative: {
        reason:
          "A canvas-rendered template palette would become application UI inside product output.",
        surface: "canvas",
      },
      capability: "structured-selection",
      evidence: {
        detail:
          "The reference editor presents a template palette with thumbnails in its panel; the user asked to choose templates the same way.",
        source: "reference",
      },
      id: "panel-template-selection",
      reason:
        "The draggable template library presents every template thumbnail without mixing application UI into the poster.",
      surface: "panel",
      target: "library.template",
    },
    {
      alternative: {
        reason:
          "Panel X/Y/width/height controls would duplicate the requested point or region placement and separate it from the poster.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail:
          "The user explicitly requested dragging templates onto the canvas and selecting a template before clicking the exact insertion point.",
        source: "user-request",
      },
      id: "canvas-template-placement",
      reason:
        "Canvas click, region drag, and drop preserve direct spatial correspondence with the insertion coordinate.",
      surface: "canvas",
      target: "library.template",
    },
    {
      alternative: {
        reason:
          "A panel per-element color field would separate the color decision from the selected element on the canvas.",
        surface: "panel",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user asked for their palette colors to appear as swatches beside the selected element on the canvas and recolor it individually.",
        source: "user-request",
      },
      id: "canvas-color-edit",
      reason:
        "Palette swatches beside the selection paint the selected element with an individual color that survives global color changes.",
      surface: "canvas",
      target: "composition.layout",
    },
    {
      alternative: {
        reason:
          "A panel text field would break the direct WYSIWYG loop the user explicitly requested for text editing.",
        surface: "panel",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user requested clicking a text line on the canvas to edit it in place without a design switch; the reference edits selected-element content over the photo.",
        source: "user-request",
      },
      id: "canvas-content-edit",
      reason:
        "Double-clicking a text line replaces it with an identically styled input, so edits happen inside the design itself while single clicks keep moving the element.",
      surface: "canvas",
      target: "composition.count",
    },
  ],
  mode: "product",
  productName: "Micrographics",
  productSummary:
    "A photo-first poster tool that generates technical micrographic overlays — barcodes, checklists, radars, big numerals, spec sheets — from a template grammar and lets users refine them directly on the canvas.",
  requestedBehavior:
    "Open a photo, generate a deterministic micrographic overlay from about twenty template families with seed, element count, kit, ink, scale, and opacity controls, refine elements by moving, resizing, and deleting them on the canvas, edit exact layout data, and export the finished poster image.",
  viewInteraction: {
    mode: "non-spatial",
    reason:
      "The product is a flat two-dimensional poster; it contains no editable 3D scene or model camera.",
  },
};

function controlAcceptance(
  id: string,
  componentType: string,
  target: string,
  userAction: string,
  expectedObservable: string,
  overrides: Partial<ToolcraftComponentAcceptance> = {},
): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName:
      "micrographics schema controls have defaults and product output mappings",
    browser: true,
    browserTestName: "browser: micrographics controls update poster",
    componentType,
    evidence: "product-output",
    expectedObservable,
    fixture: "default micrographics poster",
    id,
    kind: "control",
    target,
    userAction,
    ...overrides,
  };
}

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  controlAcceptance(
    "composition-seed",
    "slider",
    "composition.seed",
    "Change Seed.",
    "The generated element layout, templates, and content codes update deterministically.",
  ),
  controlAcceptance(
    "composition-count",
    "slider",
    "composition.count",
    "Change Elements from three to sixteen.",
    "The poster visibly contains the selected number of independently transformable elements.",
  ),
  controlAcceptance(
    "composition-kit",
    "select",
    "composition.kit",
    "Choose each template kit.",
    "Generated elements come only from the selected template family.",
    {
      optionCoverage: ["full", "data", "technical", "typographic", "minimal"],
    },
  ),
  controlAcceptance(
    "composition-template-tier",
    "segmented",
    "composition.templateTier",
    "Choose Simple, Mega, and Both random types.",
    "Seeded random compositions use only the chosen template tier, or a mix of both tiers.",
    {
      optionCoverage: ["simple", "mega", "both"],
    },
  ),
  controlAcceptance(
    "composition-commands",
    "actions",
    "composition.layout",
    "Run Shuffle and Reset layout.",
    "Shuffle produces a new deterministic composition and Reset layout discards manual element edits.",
    {
      actionCoverage: ["shuffle", "reset-layout"],
      evidence: "product-output",
    },
  ),
  controlAcceptance(
    "library-template",
    "templateLibrary",
    "library.template",
    "Click a template and click the poster, or drag the template onto the poster.",
    "Every one of the two hundred template thumbnails inserts its distinct grammar at the requested poster coordinate and clears the pending selection.",
    {
      builtInFitCheck: {
        capabilities: ["custom-interaction"],
        checkedBuiltIns: ["imagePicker", "actions"],
        closestBuiltIn: "imagePicker",
        productObservable:
          "Clicking or dragging a template inserts its grammar at the requested poster coordinate.",
        whyInsufficient:
          "ImagePicker selects a visual option but cannot initiate native drag-and-drop or model one-shot pending placement that clears after insertion.",
      },
      browserTestName: "browser: direct micrographics placement",
      customControlCoverage: [
        "built-in-gap",
        "kit-primitives",
        "minimal-ui",
        "product-output",
        "runtime-state",
      ],
      interactionId: "panel-template-selection",
      optionCoverage: "each-visible-item",
    },
  ),
  controlAcceptance(
    "elements-scale",
    "slider",
    "elements.scale",
    "Change Scale.",
    "Generated element footprints grow or shrink without changing canvas size.",
  ),
  controlAcceptance(
    "elements-opacity",
    "slider",
    "elements.opacity",
    "Change Opacity.",
    "The whole micrographic overlay becomes more or less transparent over the photo.",
  ),
  controlAcceptance(
    "ink-color",
    "color",
    "ink.color",
    "Change the Global Color.",
    "Every element without an individual palette color repaints with the new color.",
  ),
  controlAcceptance(
    "ink-glow",
    "slider",
    "ink.glow",
    "Raise the Glow slider from zero.",
    "Every element gains a soft halo in its own ink color that strengthens as the slider rises, in both the live preview and the exported image.",
  ),
  controlAcceptance(
    "palette-colors",
    "collectionActions",
    "palette.colors",
    "Add a palette color, edit a swatch color, and remove a color.",
    "The palette swatches beside the selected element follow the edited list, and clicking a swatch repaints only that element while surviving Global Color changes.",
  ),
  controlAcceptance(
    "source-preset",
    "imagePicker",
    "source.preset",
    "Choose each bundled cover preset across the graphics and photo rows.",
    "The chosen cover renders full-bleed beneath the overlay in preview and export until a photo upload overrides it.",
    {
      browserTestName: "browser: sports cover presets update poster",
      optionCoverage: [
        "atlas",
        "profile",
        "fitness",
        "pilates",
        "mesh",
        "chaos",
        "paper",
        "wireframe",
      ],
    },
  ),
  controlAcceptance(
    "source-image",
    "fileDrop",
    "source.image",
    "Upload, transform, remove, and reset a source photo.",
    "The transformed photo is cover-cropped beneath the micrographic overlay and appears in export.",
    {
      browserTestName: "browser: micrographics source image lifecycle",
      evidence: "media-lifecycle",
      mediaLifecycleCoverage: [
        "upload",
        "remove",
        "reset",
        "rotate",
        "flip",
        "transform-output",
      ],
    },
  ),
  controlAcceptance(
    "background-include",
    "switch",
    "export.includeBackground",
    "Turn Include off and on.",
    "The product background hides in preview and exported PNG pixels become transparent when excluded.",
    {
      backgroundOutputCoverage: "all-required-background-output",
      browserTestName: "browser: micrographics background output",
      evidence: "rendered-pixels",
    },
  ),
  controlAcceptance(
    "background-color",
    "color",
    "appearance.background",
    "Change Background color.",
    "The poster background and included export use the selected color.",
  ),
  controlAcceptance(
    "image-format",
    "select",
    "export.image.format",
    "Choose PNG or JPG, then export.",
    "The downloaded image uses the selected MIME type and file extension.",
    {
      browserTestName: "browser: micrographics export image",
      evidence: "exported-bytes",
      optionCoverage: ["png", "jpg"],
    },
  ),
  controlAcceptance(
    "image-resolution",
    "select",
    "export.image.resolution",
    "Choose 2K, 4K, or 8K, then export.",
    "The delivered image long edge matches 2048, 4096, or 8192 pixels.",
    {
      browserTestName: "browser: micrographics export image",
      evidence: "exported-bytes",
      optionCoverage: ["2k", "4k", "8k"],
    },
  ),
  controlAcceptance(
    "output-export",
    "panelActions",
    "output.export",
    "Click Export PNG.",
    "A non-empty decoded poster image downloads with the selected format, resolution, background, photo, and elements.",
    {
      actionCoverage: ["export-png"],
      browserTestName: "browser: micrographics export image",
      evidence: "exported-bytes",
    },
  ),
  {
    automated: true,
    automatedTestName:
      "micrographics schema controls have defaults and product output mappings",
    browser: true,
    browserTestName: "browser: direct micrographics placement",
    canvasHandle: {
      exportCleanTestName: "micrographics export excludes editing handles",
      outputObservable:
        "The selected element position and size change while the export remains handle-free.",
      testId: "micrographics-selection-handle",
      writesTarget: "controls.setValue",
    },
    componentType: "canvasTransform",
    evidence: "product-output",
    expectedObservable:
      "Clicking selects an element, dragging moves it, the corner handle resizes it, and Delete removes it from the layout.",
    fixture: "default micrographics poster with a selected element",
    id: "canvas-element-transform",
    interactionId: "canvas-element-transform",
    kind: "canvas-handle",
    target: "composition.count",
    userAction: "Select, drag, resize, and delete an element on the canvas.",
  },
  {
    automated: true,
    automatedTestName:
      "micrographics schema controls have defaults and product output mappings",
    browser: true,
    browserTestName: "browser: direct micrographics placement",
    componentType: "canvasContentEditor",
    evidence: "product-output",
    expectedObservable:
      "Clicking a text line of the selected element replaces it with an identically styled in-place input; typing updates the rendered template live without changing the design.",
    fixture: "default micrographics poster with a selected element",
    id: "canvas-content-edit",
    interactionId: "canvas-content-edit",
    kind: "runtime",
    target: "composition.count",
    userAction: "Double-click one of an element's text lines and edit it in place.",
  },
  {
    automated: true,
    automatedTestName:
      "creates deterministic aspect-aware template placements around a point",
    browser: true,
    browserTestName: "browser: direct micrographics placement",
    componentType: "canvasTemplatePlacement",
    evidence: "product-output",
    expectedObservable:
      "Dropping a template tile inserts one bounded template element at the requested poster coordinate and clears the template selection.",
    fixture: "default micrographics poster with no pending template",
    id: "canvas-template-placement",
    interactionId: "canvas-template-placement",
    kind: "runtime",
    target: "library.template",
    userAction: "Drag a template tile onto the poster.",
  },
  {
    automated: true,
    automatedTestName:
      "micrographics schema controls have defaults and product output mappings",
    browser: true,
    browserTestName: "browser: micrographics controls update poster",
    componentType: "canvasColorSwatch",
    evidence: "product-output",
    expectedObservable:
      "Clicking a palette swatch beside the selection repaints only the selected element with that color, and the individual color survives Global Color changes.",
    fixture: "default micrographics poster with a selected element",
    id: "canvas-color-edit",
    interactionId: "canvas-color-edit",
    kind: "runtime",
    target: "composition.layout",
    userAction: "Select an element and click a palette swatch on the canvas.",
  },
  {
    automated: true,
    automatedTestName:
      "micrographics schema controls have defaults and product output mappings",
    browser: true,
    browserTestName: "browser: micrographics persistence reload",
    componentType: "localStorage",
    evidence: "persistence-state",
    expectedObservable:
      "Edited generator values, canvas size, source media, and panel positions restore after a real page reload.",
    fixture: "edited persisted micrographics poster",
    id: "persistence-reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    target: "composition.count",
    userAction: "Edit the poster and reload the page.",
  },
];

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Generated micrographic composition",
    groupingReason:
      "Seed, element count, template kit, and compose commands define which elements the generator places.",
    targets: [
      "composition.seed",
      "composition.count",
      "composition.kit",
      "composition.templateTier",
      "composition.layout",
    ],
    title: "Composition",
    workflowStage: "Generate the overlay",
  },
  {
    entity: "Template stamp library",
    groupingReason:
      "The draggable template library arms one chosen grammar for click placement or transfers it directly to a canvas drop coordinate.",
    targets: ["library.template"],
    title: "Template Library",
    workflowStage: "Stamp individual templates",
  },
  {
    entity: "Element overlay styling",
    groupingReason:
      "Scale and opacity jointly tune how the generated element overlay sits over the photograph.",
    targets: ["elements.scale", "elements.opacity"],
    title: "Elements",
  },
  {
    entity: "Global graphic color",
    groupingReason:
      "One color paints every generated element that carries no individual palette override, and one glow strength haloes the whole overlay in the same ink resolution.",
    targets: ["ink.color", "ink.glow"],
    title: "Global Color",
  },
  {
    entity: "Element color palette",
    groupingReason:
      "The user-managed color list feeds the canvas swatches that recolor individual selected elements.",
    targets: ["palette.colors"],
    title: "Palette",
  },
  {
    entity: "Source imagery",
    groupingReason:
      "The bundled cover presets and the photo uploader jointly own the full-bleed backdrop beneath the overlay; an uploaded photo always wins over a preset.",
    targets: ["source.preset", "source.image"],
    title: "Source Photo",
  },
  {
    entity: "Poster background",
    groupingReason:
      "Include and color jointly control product background preview and transparent export behavior.",
    targets: ["export.includeBackground", "appearance.background"],
    title: "Background",
  },
  {
    workflowStage: "Still image delivery",
    groupingReason:
      "Format and resolution are the paired settings for the final image artifact.",
    targets: ["export.image.format", "export.image.resolution"],
    title: "Image Export",
  },
];

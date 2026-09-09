import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";

const automatedTestName =
  "app acceptance maps mesh editor state to renderer output";

const sectionBrowserTests = {
  background: "browser: background and image export preserve mesh output semantics",
  color: "browser: color correction controls edit the rendered mesh gradient",
  mesh: "browser: mesh controls edit the rendered gradient",
  meshPoint:
    "browser: ColorFlow selection overflow and deletion preserve mesh topology",
  meshDivider:
    "browser: double-clicking a mesh line inserts a ColorFlow divider",
  presets:
    "browser: mesh preset gallery applies twelve rectangular mesh gradients",
  mixing: "browser: mixing controls edit the rendered mesh gradient",
  motion: "browser: motion controls edit the rendered animation",
  persistence: "browser: mesh editor settings persist after reload",
  timeline: "browser: mesh timeline drives one seamless animation loop",
  video: "browser: video export follows timeline and selected settings",
} as const;

function controlRow({
  browserTestName,
  componentType,
  expectedObservable,
  fixture,
  id,
  target,
  userAction,
  ...extra
}: {
  browserTestName: string;
  componentType: string;
  expectedObservable: string;
  fixture: string;
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
    fixture,
    id,
    kind: "control",
    target,
    userAction,
    ...extra,
  };
}

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    loopDuration: {
      evidence:
        "Six seconds gives the editable mesh enough time to drift visibly while the sinusoidal harmonics return every point and hue to their first-frame state.",
      seconds: 6,
      source: "product-derived",
    },
    mode: "timeline-playback",
  },
  mode: "new-toolcraft-app",
};

export const appProductReadiness: ToolcraftProductReadiness = {
  mode: "product",
  productName: "Mesh Gradient",
  productSummary:
    "A direct-manipulation WebGL editor for complex color meshes and seamless gradient animation.",
  requestedBehavior:
    "Start from twelve rectangular mesh-only presets, then create, position, mix, color-correct, animate, persist, and export custom mesh gradients with ColorFlow-exact unbounded points, modifier and marquee selection, grouped dragging, independently added color points with bidirectional panel-and-canvas selection, protected structural Coons nodes, split-cell triangulation, directional Bezier handles, and fixed-edge editing.",
};

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  controlRow({
    browserTestName: sectionBrowserTests.presets,
    componentType: "imagePicker",
    expectedObservable:
      "Each of the twelve rectangular previews applies its own mesh palette, column count, control-point layout, and rendered gradient without adding non-mesh effects.",
    fixture: "Twelve static 4:3 previews derived from twelve bounded rectangular mesh scenes",
    id: "mesh-presets",
    optionCoverage: "each-visible-item",
    target: "mesh.preset",
    userAction: "Select every preset preview, then edit one applied mesh point manually.",
  }),
  controlRow({
    browserTestName: sectionBrowserTests.mesh,
    componentType: "switch",
    expectedObservable:
      "Turning editing off hides every grid curve, point, and Bezier handle while leaving rendered and exported gradient pixels unchanged.",
    fixture: "Visible canvas mesh editor over a twelve-point gradient",
    id: "mesh-editing",
    target: "mesh.editing",
    userAction: "Turn Edit mesh off and back on.",
  }),
  controlRow({
    browserTestName: sectionBrowserTests.mesh,
    builtInFitCheck: {
      capabilities: [
        "collection",
        "commands",
        "custom-interaction",
        "custom-value-model",
        "selection",
      ],
      checkedBuiltIns: ["actions", "collectionActions", "color"],
      closestBuiltIn: "collectionActions",
      productObservable:
        "Selecting, adding, editing, or removing one color point changes the matching canvas node and rendered mesh surface.",
      whyInsufficient:
        "CollectionActions can grow and shrink colors but cannot share active point selection with the canvas, protect structural Coons nodes, or bind one added color to a specific mesh cell.",
    },
    componentType: "meshColorPoints",
    customControlCoverage: [
      "built-in-gap",
      "kit-primitives",
      "minimal-ui",
      "product-output",
      "runtime-state",
    ],
    expectedObservable:
      "The active panel color matches the selected canvas point, and Add or Remove changes exactly one integrated point without changing canvas size or columns.",
    fixture: "Twelve color points with four-to-sixteen enforced bounds",
    id: "mesh-colors",
    target: "mesh.colors",
    userAction: "Select a point from both surfaces, add one color, edit its hex value, then remove that inserted point.",
  }),
  controlRow({
    browserTestName: sectionBrowserTests.mesh,
    componentType: "slider",
    expectedObservable: "Changing columns reflows topology guides and mesh point positions.",
    fixture: "Twelve points in four columns",
    id: "mesh-columns",
    target: "mesh.columns",
    userAction: "Drag the discrete Columns slider from three to four.",
  }),
  controlRow({
    browserTestName: sectionBrowserTests.mesh,
    componentType: "switch",
    expectedObservable:
      "With Fix edges off, perimeter nodes move freely beyond the output; turning it on hides and completely locks every perimeter node.",
    fixture: "Free twelve-point mesh with a displaced perimeter node",
    id: "mesh-fix-edges",
    target: "mesh.pinEdges",
    userAction: "Drag a perimeter point, then turn Fix edges on and verify perimeter handles disappear.",
  }),
  controlRow({
    browserTestName: sectionBrowserTests.mesh,
    componentType: "switch",
    expectedObservable: "Grid guide lines disappear while all mesh points and rendered pixels remain.",
    fixture: "Visible topology guides",
    id: "mesh-guides",
    target: "mesh.guides",
    userAction: "Turn Grid guides off and back on.",
  }),
  controlRow({
    actionCoverage: ["mesh.reflow", "mesh.shuffle"],
    browserTestName: sectionBrowserTests.mesh,
    componentType: "actions",
    expectedObservable: "Reflow regularizes the grid and Shuffle creates a new bounded point layout.",
    fixture: "A manually displaced mesh topology",
    id: "mesh-geometry-actions",
    target: "mesh.points",
    userAction: "Click Reflow and Shuffle.",
  }),
  controlRow({
    browserTestName: sectionBrowserTests.mixing,
    componentType: "segmented",
    expectedObservable: "Every interpolation color space produces a distinct visible blend.",
    fixture: "Saturated colors with broad overlap",
    id: "mix-interpolation",
    optionCoverage: "each-visible-item",
    target: "mix.interpolation",
    userAction: "Select sRGB, Linear, and OKLab.",
  }),
  ...[
    ["mix-spread", "mix.spread", "Color spread", "color influence radius"],
    ["mix-warp", "mix.warp", "Distortion", "spatial warping"],
    ["mix-swirl", "mix.swirl", "Swirl", "rotational mixing"],
    ["mix-opacity", "mix.opacity", "Opacity", "mesh alpha compositing"],
    ["mix-grain", "mix.grain", "Grain", "fine texture strength"],
  ].map(([id, target, label, result]) =>
    controlRow({
      browserTestName: sectionBrowserTests.mixing,
      componentType: "slider",
      expectedObservable: `Dragging ${label} changes ${result} in the live WebGL output.`,
      fixture: "Paused twelve-point mesh at timeline midpoint",
      id,
      target,
      userAction: `Drag the ${label} slider.`,
    }),
  ),
  ...[
    ["color-exposure", "color.exposure", "Exposure", "scene luminance"],
    ["color-contrast", "color.contrast", "Contrast", "tonal separation"],
    ["color-hue", "color.hue", "Hue", "the full palette hue"],
    ["color-saturation", "color.saturation", "Saturation", "chroma intensity"],
    ["color-lightness", "color.lightness", "Lightness", "perceived lightness"],
  ].map(([id, target, label, result]) =>
    controlRow({
      browserTestName: sectionBrowserTests.color,
      componentType: "slider",
      expectedObservable: `Dragging ${label} changes ${result} across the rendered gradient.`,
      fixture: "Paused, color-rich twelve-point mesh",
      id,
      target,
      userAction: `Drag the ${label} slider.`,
    }),
  ),
  ...[
    ["motion-position-drift", "motion.positionDrift", "Point drift", "point trajectories"],
    ["motion-color-drift", "motion.colorDrift", "Color drift", "animated hue travel"],
    ["motion-scale", "motion.scale", "Motion scale", "spatial motion frequency"],
    ["motion-cycles", "motion.cycles", "Loop cycles", "cycles per timeline loop"],
    ["motion-randomness", "motion.randomness", "Randomness", "per-point phase offsets"],
  ].map(([id, target, label, result]) =>
    controlRow({
      browserTestName: sectionBrowserTests.motion,
      componentType: "slider",
      expectedObservable: `Changing ${label} changes ${result} while preserving the forward loop seam.`,
      fixture: "Six-second playback timeline with nonzero mesh motion",
      id,
      target,
      userAction: `Change ${label}, then play and scrub the timeline.`,
    }),
  ),
  controlRow({
    backgroundOutputCoverage: "all-required-background-output",
    browserTestName: sectionBrowserTests.background,
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "Excluding the background makes preview/image alpha transparent while video retains the chosen background.",
    fixture: "Dark background behind a partially transparent mesh",
    id: "background-include",
    target: "export.includeBackground",
    userAction: "Turn Include off, export PNG, then export video.",
  }),
  controlRow({
    browserTestName: sectionBrowserTests.background,
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable: "Changing the background color updates preview and included exports.",
    fixture: "Included dark background",
    id: "background-color",
    target: "appearance.background",
    userAction: "Enter a contrasting background hex color.",
  }),
  controlRow({
    browserTestName: sectionBrowserTests.background,
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable: "PNG and JPG exports have the selected MIME type and decodable pixels.",
    fixture: "Paused mesh with image export enabled",
    id: "image-format",
    optionCoverage: "each-visible-item",
    target: "export.image.format",
    userAction: "Export once as PNG and once as JPG.",
  }),
  controlRow({
    browserTestName: sectionBrowserTests.background,
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable: "2K, 4K, and 8K selections change decoded image dimensions.",
    fixture: "800×600 reference-sized editable output",
    id: "image-resolution",
    optionCoverage: "each-visible-item",
    target: "export.image.resolution",
    userAction: "Export at two image resolutions and compare decoded dimensions.",
  }),
  controlRow({
    browserTestName: sectionBrowserTests.video,
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable: "MP4 safely falls back when unsupported and WebM exports valid video bytes.",
    fixture: "Shortened playback timeline for encoder verification",
    id: "video-format",
    optionCoverage: "each-visible-item",
    target: "export.video.format",
    userAction: "Export with MP4 and WebM selected.",
  }),
  controlRow({
    browserTestName: sectionBrowserTests.video,
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable: "Current and 4K exports preserve aspect ratio and even encoder dimensions.",
    fixture: "800×600 reference-sized canvas with a short playback duration",
    id: "video-resolution",
    optionCoverage: "each-visible-item",
    target: "export.video.resolution",
    userAction: "Export at Current and 4K video resolutions.",
  }),
  controlRow({
    actionCoverage: ["export.png", "export.svg", "export.video"],
    browserTestName: sectionBrowserTests.video,
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Sticky actions place PNG and SVG side by side above a full-width Video action, report progress, and download non-empty image, SVG, and video artifacts from final product output.",
    fixture: "Configured mesh at a selected timeline frame",
    id: "export-actions",
    target: "export.actions",
    userAction: "Click Export PNG, Export SVG, and Export Video and inspect the layout and downloads.",
  }),
  {
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName: sectionBrowserTests.meshPoint,
    canvasHandle: {
      exportCleanTestName:
        "browser: canvas mesh handle stays out of image export",
      outputObservable:
        "The center color influence moves with the handle while exported pixels contain no handle chrome.",
      testId: "mesh-point-primary",
      writesTarget: "mesh.points",
    },
    componentType: "canvas-handle",
    evidence: "product-output",
    expectedObservable: "Dragging the center canvas handle moves the same mesh point and changes output.",
    fixture: "Unselected 800×600 mesh; pointer-down selects the center handle",
    id: "mesh-canvas-handle",
    kind: "canvas-handle",
    target: "mesh.points",
    userAction:
      "Grab the center point off-center, drag it by a delta without snapping, move it beyond the output, and undo once.",
  },
  {
    automated: true,
    automatedTestName:
      "app acceptance maps mesh editor state to renderer output",
    browser: true,
    browserTestName: sectionBrowserTests.meshDivider,
    componentType: "canvas-gesture",
    evidence: "product-output",
    expectedObservable:
      "Double-clicking a horizontal curve inserts a full interpolated column; double-clicking a vertical curve inserts a full interpolated row, and each divider changes the rendered mesh.",
    fixture: "Rectangular twelve-point mesh with visible editable cubic grid guides",
    id: "mesh-line-insertion",
    kind: "runtime",
    target: "mesh.points",
    userAction:
      "Double-click between two point handles on a horizontal grid curve, undo, then double-click a vertical grid curve.",
  },
  {
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName: sectionBrowserTests.mesh,
    canvasHandle: {
      exportCleanTestName:
        "browser: canvas mesh handle stays out of image export",
      outputObservable:
        "The selected node's directional handle bends the same Coons surface shown by its grid curve while exported pixels contain no editing chrome.",
      testId: "mesh-tangent-horizontal-positive",
      writesTarget: "mesh.points",
    },
    componentType: "canvas-handle",
    evidence: "product-output",
    expectedObservable:
      "Dragging one directional Bezier handle mirrors the complete opposite vector in smooth mode, bends the connected grid curve, and deforms the matching WebGL Coons patch.",
    fixture: "Selected center mesh node with four independent directional handles in smooth mode",
    id: "mesh-canvas-tangent",
    kind: "canvas-handle",
    target: "mesh.points",
    userAction: "Drag a horizontal tangent handle directly on the canvas and undo once.",
  },
  {
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName: sectionBrowserTests.timeline,
    componentType: "timeline",
    evidence: "timeline-output",
    expectedObservable:
      "Play, pause, scrub, and duration edit drive rendered frames through one seamless forward-only loop.",
    fixture: "Six-second playback timeline with point and color drift",
    id: "mesh-timeline",
    kind: "runtime",
    timelineCoverage: "playback",
    timelineLoopProof: {
      direction: "forward-only",
      durationChange: "reproved-after-edit",
      reversePlayback: "forbidden",
      seam: "first-last-match",
    },
    timelinePlaybackCoverage: "all-playback-behavior",
    userAction: "Pause, scrub, resume, and edit the timeline duration.",
  },
  {
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName: sectionBrowserTests.persistence,
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable: "A changed mesh setting and rendered result are restored after a real reload.",
    fixture: "LocalStorage persistence enabled for values, canvas, panels, and timeline",
    id: "mesh-persistence",
    kind: "runtime",
    persistenceCoverage: "reload",
    target: "mix.spread",
    userAction: "Change Color spread, wait for storage, and reload the page.",
  },
];

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Mesh preset gallery",
    groupingReason: "Starting palettes and topologies are selected together as complete mesh scenes before detailed editing.",
    targets: ["mesh.preset"],
    title: "Presets",
    workflowStage: "Start",
  },
  {
    entity: "Color point collection",
    groupingReason: "Palette item creation, removal, and color editing share one bounded collection owner.",
    targets: ["mesh.colors"],
    title: "Color Points",
    workflowStage: "Construct",
  },
  {
    entity: "Mesh topology",
    groupingReason: "Canvas editor visibility, grid shape, edge constraints, guides, and geometry commands affect the topology as a whole.",
    targets: ["mesh.editing", "mesh.columns", "mesh.pinEdges", "mesh.guides", "mesh.points"],
    title: "Topology",
    workflowStage: "Construct",
  },
  {
    entity: "Mesh blend",
    groupingReason: "Color-space interpolation and spatial blending shape the base field before correction.",
    targets: [
      "mix.interpolation",
      "mix.spread",
      "mix.warp",
      "mix.swirl",
      "mix.opacity",
      "mix.grain",
    ],
    title: "Mixing",
    workflowStage: "Blend",
  },
  {
    entity: "Final color treatment",
    groupingReason: "Global exposure and color corrections act on the fully mixed field.",
    targets: [
      "color.exposure",
      "color.contrast",
      "color.hue",
      "color.saturation",
      "color.lightness",
    ],
    title: "Color Correction",
    workflowStage: "Grade",
  },
  {
    entity: "Procedural loop",
    groupingReason: "Motion amplitude, harmonics, and phase variation define the timeline animation.",
    targets: [
      "motion.positionDrift",
      "motion.colorDrift",
      "motion.scale",
      "motion.cycles",
      "motion.randomness",
    ],
    title: "Motion",
    workflowStage: "Animate",
  },
  {
    entity: "Output background",
    groupingReason: "Background inclusion and color jointly define preview/image compositing.",
    targets: ["export.includeBackground", "appearance.background"],
    title: "Background",
    workflowStage: "Compose",
  },
  {
    entity: "Still delivery",
    groupingReason: "Image format and pixel resolution are chosen together immediately before export.",
    targets: ["export.image.format", "export.image.resolution"],
    title: "Image Export",
    workflowStage: "Deliver",
  },
  {
    entity: "Motion delivery",
    groupingReason: "Video container and encoder-safe resolution define the animated deliverable.",
    targets: ["export.video.format", "export.video.resolution"],
    title: "Video Export",
    workflowStage: "Deliver",
  },
];

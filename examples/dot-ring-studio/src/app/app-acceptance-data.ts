import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";

const AUTOMATED_TEST_NAME =
  "Dot Ring Studio product contract updates deterministic output";
const FIXTURE =
  "the default 1024px audio-driven ring with 160 beads and one row";
export const DOT_RING_BROWSER_TEST_NAME =
  "browser: Dot Ring Studio updates product output";

export function dotRingBrowserTestName(id: string): string {
  return `browser: Dot Ring Studio proves ${id}`;
}

const controlBrowserTestNames: Readonly<Record<string, string>> = {
  "actions.output":
    "browser: export actions create PNG and timeline-length video",
  "appearance.background": "browser: background color changes rendered output",
  "audio.source": "browser: source audio drives rendered waveform",
  "canvas.aspectRatio": "browser: aspect ratio changes finite output frame",
  "canvas.renderScale":
    "browser: resolution scale changes preview backing dimensions",
  "canvas.size.height": "browser: canvas height changes output dimensions",
  "canvas.size.width": "browser: canvas width changes output dimensions",
  "export.image.format": "browser: image format changes export encoding",
  "export.image.resolution":
    "browser: image resolution changes export dimensions",
  "export.includeBackground":
    "browser: include background controls png transparency",
  "export.video.format":
    "browser: video format changes export container selection",
  "export.video.resolution":
    "browser: video resolution changes export dimensions",
  "panels.timeline.extended":
    "browser: timeline panel toggle reveals extended transport",
  "ring.color1": "browser: ring color 1 changes rendered output",
  "ring.color2": "browser: ring color 2 changes rendered output",
  "ring.color3": "browser: ring color 3 changes rendered output",
  "ring.color4": "browser: ring color 4 changes rendered output",
  "ring.color5": "browser: ring color 5 changes rendered output",
  "ring.colorMode": "browser: ring color mode changes rendered output",
  "ring.colorSpread": "browser: ring color spread changes rendered output",
  "ring.density": "browser: ring density changes rendered output",
  "ring.dotSize": "browser: ring dot size changes rendered output",
  "ring.glow": "browser: ring glow changes rendered output",
  "ring.radius": "browser: ring radius changes rendered output",
  "ring.rows": "browser: ring rows changes rendered output",
  "ring.sizeResponse":
    "browser: ring size response changes rendered output",
  "runtime.settingsTransfer": DOT_RING_BROWSER_TEST_NAME,
  "wave.affectedAmplitude":
    "browser: wave active amplitude changes rendered output",
  "wave.calmAmplitude":
    "browser: wave calm amplitude changes rendered output",
  "wave.formula": "browser: wave formula changes rendered output",
  "wave.globalRotationSpeed":
    "browser: wave global rotation changes rendered output",
  "wave.rotationSpeed": "browser: wave rotation changes rendered output",
  "wave.rowEcho": "browser: wave row echo changes rendered output",
  "wave.sectorAngle": "browser: wave sector angle changes rendered output",
  "wave.speed": "browser: wave speed changes rendered output",
};

function controlAcceptance({
  componentType,
  evidence = "rendered-pixels",
  expectedObservable,
  id,
  target = id,
  userAction,
  ...coverage
}: {
  componentType: string;
  evidence?: ToolcraftComponentAcceptance["evidence"];
  expectedObservable: string;
  id: string;
  target?: string | null;
  userAction: string;
  actionCoverage?: readonly string[];
  backgroundOutputCoverage?: ToolcraftComponentAcceptance["backgroundOutputCoverage"];
  builtInFitCheck?: ToolcraftComponentAcceptance["builtInFitCheck"];
  controlPartCoverage?: ToolcraftComponentAcceptance["controlPartCoverage"];
  customControlCoverage?: ToolcraftComponentAcceptance["customControlCoverage"];
  interactionId?: string;
  mediaLifecycleCoverage?: ToolcraftComponentAcceptance["mediaLifecycleCoverage"];
  optionCoverage?: ToolcraftComponentAcceptance["optionCoverage"];
}): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName:
      controlBrowserTestNames[id] ?? dotRingBrowserTestName(id),
    componentType,
    evidence,
    expectedObservable,
    fixture: FIXTURE,
    id,
    kind: "control",
    userAction,
    ...coverage,
    ...(target === null ? {} : { target: target ?? id }),
  };
}

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    loopDuration: {
      evidence:
        "The existing Dot Ring Studio playback timeline and export tests use one deterministic 12-second waveform cycle.",
      seconds: 12,
      source: "product-derived",
    },
    mode: "timeline-playback",
  },
  mode: "new-toolcraft-app",
};

export const appProductReadiness: ToolcraftProductReadiness = {
  interactionOwnership: [
    {
      alternative: {
        reason:
          "A canvas file target would add app chrome over the procedural output and duplicate the persistent panel workflow.",
        surface: "canvas",
      },
      capability: "command",
      evidence: {
        detail:
          "The requested product uses source audio to drive the procedural waveform.",
        source: "user-request",
      },
      id: "source-audio-authoring",
      reason:
        "The panel owns audio import, source status, removal, history, and reset while the canvas remains output-only.",
      surface: "panel",
      target: "audio.source",
    },
    {
      alternative: {
        reason:
          "Dragging individual beads would conflict with deterministic density, row, radius, and waveform controls.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "Radius, density, rows, palette, spread, formula, speed, rotation, and amplitudes are exact product settings.",
        source: "user-request",
      },
      id: "ring-properties",
      reason:
        "Panel controls keep the procedural ring repeatable, resettable, persistent, and exportable.",
      surface: "panel",
      target: "ring.radius",
    },
  ],
  mode: "product",
  productName: "Dot Ring Studio",
  productSummary:
    "Creates an audio-driven animated dotted circular waveform with editable geometry, palette, motion, finite or infinite workspace, and image/video export.",
  requestedBehavior:
    "Preserve the existing audio-reactive Dot Ring Studio, use the current Toolcraft starter FileDrop for source audio, and keep the starter Infinity canvas with finite-size restoration, viewport background, pan/zoom, and scene-bounded PNG/video export.",
  viewInteraction: {
    mode: "non-spatial",
    reason:
      "The product is a flat two-dimensional procedural composition with no 3D camera or rotatable model.",
  },
};

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    {
      entity: "Audio waveform input",
      groupingReason:
        "Upload, source status, removal, and fallback select the one motion input.",
      id: "source-audio",
      targets: ["audio.source"],
      title: "Source Audio",
    },
    {
      entity: "Procedural ring geometry",
      groupingReason:
        "Radius, density, and rows jointly define the ring primitive layout.",
      id: "ring-pattern",
      targets: ["ring.radius", "ring.density", "ring.rows"],
      title: "Ring Pattern",
    },
    {
      entity: "Bead color allocation",
      groupingReason:
        "Color mode, five colors, and spread jointly define deterministic bead color selection.",
      id: "bead-colors",
      targets: [
        "ring.colorMode",
        "ring.color1",
        "ring.color2",
        "ring.color3",
        "ring.color4",
        "ring.color5",
        "ring.colorSpread",
      ],
      title: "Bead Colors",
    },
    {
      entity: "Bead rendering style",
      groupingReason:
        "Base size, waveform size response, and glow jointly define how each bead primitive renders.",
      id: "bead-style",
      targets: ["ring.dotSize", "ring.sizeResponse", "ring.glow"],
      title: "Bead Style",
    },
    {
      entity: "Wave displacement and travel",
      groupingReason:
        "Formula, speed, rotations, amplitudes, sector width, and row echo define one animated deformation system.",
      id: "wave-motion",
      targets: [
        "wave.formula",
        "wave.speed",
        "wave.rotationSpeed",
        "wave.globalRotationSpeed",
        "wave.affectedAmplitude",
        "wave.calmAmplitude",
        "wave.sectorAngle",
        "wave.rowEcho",
      ],
      title: "Wave Motion",
    },
    {
      entity: "Still-image delivery",
      groupingReason: "Format and resolution jointly define image encoding.",
      id: "image-export",
      targets: ["export.image.format", "export.image.resolution"],
      title: "Image Export",
    },
    {
      entity: "Animated delivery",
      groupingReason: "Format and resolution jointly define video encoding.",
      id: "video-export",
      targets: ["export.video.format", "export.video.resolution"],
      title: "Video Export",
    },
  ];

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  controlAcceptance({
    componentType: "settingsTransfer",
    evidence: "command-side-effect",
    expectedObservable:
      "Export Settings downloads portable product, canvas, and timeline state and Import Settings restores it.",
    id: "runtime.settingsTransfer",
    target: null,
    userAction: "Export settings, change the ring, import the file, and verify restoration.",
  }),
  controlAcceptance({
    componentType: "aspectRatio",
    expectedObservable:
      "Aspect ratio presets change the finite output frame and keep the ring centered.",
    id: "canvas.aspectRatio",
    userAction: "Choose a non-square ratio and inspect the finite output.",
  }),
  controlAcceptance({
    componentType: "text",
    expectedObservable:
      "Canvas width changes the finite output width and ring layout.",
    id: "canvas.size.width",
    userAction: "Enter a new finite width and inspect product output dimensions.",
  }),
  controlAcceptance({
    componentType: "text",
    expectedObservable:
      "Canvas height changes the finite output height and ring layout.",
    id: "canvas.size.height",
    userAction: "Enter a new finite height and inspect product output dimensions.",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Resolution scale changes preview backing pixels without changing the logical ring frame.",
    id: "canvas.renderScale",
    userAction: "Change Resolution scale and compare backing and CSS dimensions.",
  }),
  controlAcceptance({
    componentType: "switch",
    evidence: "command-side-effect",
    expectedObservable:
      "Timeline reveals the extended playback surface without changing ring state.",
    id: "panels.timeline.extended",
    target: null,
    userAction: "Toggle Timeline and inspect the extended transport.",
  }),
  {
    automated: true,
    automatedTestName: AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: dotRingBrowserTestName("canvas.infinity.mode"),
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity canvas removes the finite artboard and size controls, persists pan state, and restores the dormant finite frame through toggle, undo, and redo.",
    fixture: FIXTURE,
    id: "canvas.infinity.mode",
    infinityCanvasCoverage: "mode-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction:
      "Enable Infinity canvas, pan and reload it, then disable, undo, and redo while comparing the restored 1024px frame.",
  },
  {
    automated: true,
    automatedTestName: AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: dotRingBrowserTestName("canvas.infinity.image-export"),
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "Infinite image export crops to the outward-rounded union of visible flat bead bounds instead of the dormant finite frame.",
    fixture: FIXTURE,
    id: "canvas.infinity.image-export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    target: "canvas.infinity",
    userAction:
      "Export a finite and infinite image at one timeline time and compare decoded dimensions.",
  },
  {
    automated: true,
    automatedTestName: AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: dotRingBrowserTestName("canvas.infinity.video-export"),
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "Infinite video export uses one full-cycle scene envelope so every frame fits stable dimensions.",
    fixture: FIXTURE,
    id: "canvas.infinity.video-export",
    infinityCanvasCoverage: "scene-bounds-video-export",
    kind: "runtime",
    target: "canvas.infinity",
    userAction:
      "Export finite and infinite video and inspect dimensions, background, and duration.",
  },
  controlAcceptance({
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable:
      "Uploading audio changes the waveform source; removing or resetting it restores the bundled profile.",
    id: "audio.source",
    interactionId: "source-audio-authoring",
    mediaLifecycleCoverage: ["upload", "remove", "reset"],
    userAction:
      "Upload a WAV file, inspect the attached file and ring, remove it, then verify Reset returns to the bundled profile.",
  }),
  controlAcceptance({
    backgroundOutputCoverage: "all-required-background-output",
    componentType: "switch",
    expectedObservable:
      "Background controls finite preview and image alpha, is required for Infinity, and video always keeps the configured color.",
    id: "export.includeBackground",
    userAction:
      "Turn Background off in Setup, inspect finite preview and image alpha, then verify Infinity disables and video stays colored.",
  }),
  controlAcceptance({
    componentType: "color",
    expectedObservable:
      "Background color updates finite product pixels, the infinite viewport, images, and video.",
    id: "appearance.background",
    userAction: "Choose a different Background color and compare finite and infinite preview.",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable: "Radius changes the visible ring footprint and scene bounds.",
    id: "ring.radius",
    interactionId: "ring-properties",
    userAction: "Drag Radius and compare ring and infinite scene dimensions.",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Density changes the number and spacing of visible bead primitives.",
    id: "ring.density",
    userAction: "Drag Density and inspect visible bead count.",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Rows changes the number of concentric bead rows from one to twelve.",
    id: "ring.rows",
    userAction: "Change Rows and inspect the ring thickness.",
  }),
  ...[1, 2, 3, 4, 5].map(
    (index): ToolcraftComponentAcceptance =>
      controlAcceptance({
        componentType: "color",
        expectedObservable: `Color ${index} changes its deterministic bead allocation in the rendered ring.`,
        id: `ring.color${index}`,
        userAction: `Change Color ${index} and compare fixed-time ring pixels.`,
      }),
  ),
  controlAcceptance({
    componentType: "select",
    expectedObservable:
      "Random, Around ring, By row, and By energy map the palette to beads through distinct deterministic rules.",
    id: "ring.colorMode",
    optionCoverage: ["spread", "conic", "rows", "energy"],
    userAction: "Choose every Color mode option and compare fixed-time bead colors.",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Spread changes how often alternate palette colors appear around the ring.",
    id: "ring.colorSpread",
    userAction: "Drag Spread and inspect deterministic bead colors.",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Dot size scales every bead radius and the visible ring thickness.",
    id: "ring.dotSize",
    userAction: "Drag Dot size and compare bead radii at one timeline frame.",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Size response grows beads inside high-energy waveform regions while calm beads shrink slightly.",
    id: "ring.sizeResponse",
    userAction: "Drag Size response and compare bead radii across the active sector.",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Glow adds an additive halo behind beads and expands the visible scene bounds.",
    id: "ring.glow",
    userAction: "Drag Glow and inspect the halo behind fixed-time beads.",
  }),
  controlAcceptance({
    componentType: "select",
    expectedObservable:
      "Audio, Complex, Organic, Turbulent, and Pulse produce distinct loop-safe deformation.",
    id: "wave.formula",
    optionCoverage: ["audio", "complex", "organic", "turbulent", "pulse"],
    userAction: "Choose every Formula option and compare one timeline frame.",
  }),
  ...[
    ["wave.speed", "Speed changes waveform cadence."],
    ["wave.rotationSpeed", "Rotation changes active-sector travel."],
    [
      "wave.globalRotationSpeed",
      "Global rotation changes tangential bead handoff.",
    ],
    [
      "wave.affectedAmplitude",
      "Active amp changes displacement in the active sector.",
    ],
    [
      "wave.calmAmplitude",
      "Calm amp changes displacement outside the active sector.",
    ],
    ["wave.sectorAngle", "Sector angle changes the active sector width."],
    [
      "wave.rowEcho",
      "Row echo shifts inner rows back in time so concentric rows replay waveform history.",
    ],
  ].map(
    ([id, expectedObservable]): ToolcraftComponentAcceptance =>
      controlAcceptance({
        componentType: "slider",
        expectedObservable,
        id,
        userAction: `Change ${id} and compare a fixed timeline frame.`,
      }),
  ),
  controlAcceptance({
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable: "PNG and JPG choose matching image encoding and extension.",
    id: "export.image.format",
    optionCoverage: ["png", "jpg"],
    userAction: "Export PNG and JPG and inspect MIME type and extension.",
  }),
  controlAcceptance({
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable: "2K, 4K, and 8K create exact long-edge image dimensions.",
    id: "export.image.resolution",
    optionCoverage: ["2k", "4k", "8k"],
    userAction: "Export every image resolution and decode dimensions.",
  }),
  controlAcceptance({
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable:
      "MP4 and WebM request supported matching containers with fallback.",
    id: "export.video.format",
    optionCoverage: ["mp4", "webm"],
    userAction: "Export both requested video formats and inspect actual MIME type.",
  }),
  controlAcceptance({
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable:
      "Current and 4K create aspect-preserving video dimensions.",
    id: "export.video.resolution",
    optionCoverage: ["current", "4k"],
    userAction: "Export Current and 4K video and inspect metadata.",
  }),
  controlAcceptance({
    actionCoverage: ["export.video", "export.png"],
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Export Video and Export PNG return nonempty files from current ring, canvas, audio, and timeline state.",
    id: "actions.output",
    userAction: "Export both outputs and decode the resulting files.",
  }),
  {
    automated: true,
    automatedTestName: AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: "browser: timeline playback controls drive rendered output",
    componentType: "timeline",
    evidence: "timeline-output",
    expectedObservable:
      "Play advances the deterministic ring, pause freezes it, scrub restores exact frames, duration edits preserve the loop, and first/last frames match.",
    fixture: FIXTURE,
    id: "runtime.timeline.playback",
    kind: "runtime",
    timelineCoverage: "playback",
    timelineLoopProof: {
      direction: "forward-only",
      durationChange: "reproved-after-edit",
      reversePlayback: "forbidden",
      seam: "first-last-match",
    },
    timelinePlaybackCoverage: "all-playback-behavior",
    userAction: "Play, pause, scrub, edit duration, and sample the loop seam.",
  },
  {
    automated: true,
    automatedTestName: AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName:
      "browser: Dot Ring Studio restores values, infinite canvas, panels, and timeline after reload",
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Values, canvas mode/size/viewport, panels, timeline, and attached audio media restore after a real reload.",
    fixture: FIXTURE,
    id: "runtime.persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices: ["values", "canvas", "panels", "timeline", "media"],
    userAction: "Change every persisted slice, reload, and verify restoration.",
  },
  {
    automated: true,
    automatedTestName: AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: "browser: viewport drag and zoom preserve product output",
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Drag, zoom, radar, and center preserve timeline state while the renderer coalesces nonessential animation work.",
    fixture: FIXTURE,
    id: "runtime.canvas.viewport",
    kind: "runtime",
    userAction:
      "Play, drag and zoom the canvas, use radar and center, and verify timeline continuity.",
  },
];

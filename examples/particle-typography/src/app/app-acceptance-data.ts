import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import {
  controlAcceptance,
  dotsBrowserTestName,
  DOTS_AUTOMATED_TEST_NAME,
  DOTS_BROWSER_TEST_NAME,
  DOTS_DEFAULT_SETTINGS_ACCEPTANCE,
  DOTS_FIXTURE,
  DOTS_SPILL_BROWSER_TEST_NAME,
  DOTS_THEME_BROWSER_TEST_NAME,
  DOTS_TIMING_BROWSER_TEST_NAME,
} from "./dots/dots-acceptance";
import { DOT_COLOR_THEMES } from "./dots/dots-theme";
import { DOTS_DEFAULT_CYCLE_SECONDS } from "./dots/dots-timing";
import { dotsVideoReferenceStudy } from "./dots/dots-video-reference-study";

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    loopDuration: {
      evidence:
        "The imported default settings explicitly use a 10-second runtime timeline with the existing 4-second Active and 1-second Calm phase design.",
      seconds: DOTS_DEFAULT_CYCLE_SECONDS,
      source: "user-request",
    },
    mode: "timeline-playback",
  },
  behaviorCoverage: ["canvas-sizing", "control-mapping", "renderer-state"],
  mode: "reference-runtime-clone",
  referenceFeatureInventory: [
    {
      acceptanceId: "reference.renderer-state",
      behaviorEvidence:
        "Frame f000 shows a complete irregular multicolor ring before the first inward impulse.",
      featureName: "Perimeter launch",
      id: "reference.perimeter-launch",
      referenceBehavior:
        "All particles begin on an elliptical perimeter around an empty center.",
      sourceEvidence: "Untitled.mp4 frames f000-f010.",
      status: "ported",
      toolcraftMapping:
        "Ring launch deterministically distributes every selected particle around the editable frame; Scatter and Grid are user-requested alternatives.",
    },
    {
      acceptanceId: "reference.renderer-state",
      behaviorEvidence:
        "Frames f010-f150 show asynchronous inward travel, overshoot, stragglers, and damping around persistent anchors.",
      featureName: "Physical convergence",
      id: "reference.spring-convergence",
      referenceBehavior:
        "Dots travel along long paths, overshoot independently, and settle into a glyph.",
      sourceEvidence:
        "Untitled.mp4 opening 10 fps contact sheet plus full-frame tblend motion decay.",
      status: "ported",
      toolcraftMapping:
        "A random-access damped spring applies editable mass, attraction, damping, and curl turbulence to persistent glyph anchors.",
    },
    {
      acceptanceId: "reference.control-mapping",
      behaviorEvidence:
        "Rainbow dot identities persist from f000 through the settled N at f400, with visible radius variation in motion.",
      featureName: "Color and size dynamics",
      id: "reference.color-size",
      referenceBehavior:
        "Particles keep bright individual colors and change size while moving and settling.",
      sourceEvidence: "Untitled.mp4 frames f000, f050, f150, and f400.",
      status: "ported",
      toolcraftMapping:
        "Each seeded particle selects one discrete color from the editable multi-stop bank, while velocity and a subtle pulse map into a user-authored size range.",
    },
    {
      acceptanceId: "reference.control-mapping",
      behaviorEvidence:
        "The reference settles into a recognizable N; the user explicitly requested arbitrary letters and phrases.",
      featureName: "Editable glyph target",
      id: "toolcraft.editable-glyph",
      referenceBehavior: "The final particle anchors describe one N glyph.",
      sourceEvidence:
        "Untitled.mp4 settled frames plus the current user request for editable text and font.",
      status: "toolcraft-native",
      toolcraftMapping:
        "Text and FontPicker resample arbitrary short text into fill, outline, or mixed anchors.",
    },
    {
      acceptanceId: "runtime.timeline.playback",
      behaviorEvidence:
        "The video establishes forward launch-to-settle motion, and the user explicitly requests independent Active and Calm timing controls.",
      featureName: "Playback and seamless delivery",
      id: "toolcraft.timeline",
      referenceBehavior: "Forward time advances the particle formation.",
      sourceEvidence: "Untitled.mp4 duration and ordered storyboard frames.",
      status: "intentionally-changed",
      toolcraftMapping:
        "Toolcraft playback starts with the imported 10-second runtime duration. Active remains 4 seconds and controls the 75/25 formation/release design, Calm remains 1 second without changing its fixed idle speed, and editing either slider resynchronizes runtime duration to their sum.",
      userApprovedChangeReason:
        "The user explicitly requested two timing sliders for the main and calm animation, then clarified that changing Calm duration must not change idle animation speed.",
    },
    {
      acceptanceId: "reference.canvas-sizing",
      behaviorEvidence:
        "The reference is a centered portrait 1830x2304 composition with the perimeter and final N balanced inside the frame.",
      featureName: "Portrait output framing",
      id: "reference.output-framing",
      referenceBehavior:
        "Ring, trajectories, and the final N are centered inside a tall black output frame.",
      sourceEvidence: "Untitled.mp4 full-frame storyboard cells f000-f400.",
      status: "ported",
      toolcraftMapping:
        "The default editable canvas uses the same portrait composition class and keeps ring/glyph layout normalized when the Toolcraft output size changes.",
    },
  ],
  referenceName: "Untitled particle N formation",
  referenceStudy: {
    behaviorEvidence:
      "All 516 frames were decoded; opening and full-duration contact sheets plus frame-difference statistics establish launch, convergence, settling, trail decay, color persistence, and size dynamics.",
    referenceLocation: "/Users/kusnizza/Desktop/Untitled.mp4",
    reproductionSteps:
      "Play Untitled.mp4 from 0:00, inspect the 10 fps opening contact sheet, inspect the 4 fps full-duration storyboards, and compare framemd5 plus tblend signalstats under /tmp/dots-video-study.g16hWI.",
    sourceEvidence:
      "The supplied H.264 recording is 1830x2304, 10.548333 seconds, and 516 frames; no source project or original renderer code was provided.",
    sourceOnlyReason:
      "Only an encoded MP4 was supplied, so runtime internals cannot be executed or source-inspected; full decoded-frame evidence and product acceptance compensate.",
    status: "source-inspection-only",
  },
  referenceTimeline: {
    behaviorCoverage: ["playback"],
    loopDuration: {
      evidence:
        "The imported default settings explicitly use a 10-second runtime timeline while preserving the 4-second Active and 1-second Calm phase controls.",
      seconds: DOTS_DEFAULT_CYCLE_SECONDS,
      source: "user-request",
    },
    mode: "toolcraft-playback",
  },
  sourceOfTruth: "reference-runtime",
  videoReferenceStudy: dotsVideoReferenceStudy,
};

export const appProductReadiness: ToolcraftProductReadiness = {
  interactionOwnership: [
    {
      alternative: {
        reason:
          "A canvas text field would place app chrome over the output and duplicate exact entry in the panel.",
        surface: "canvas",
      },
      capability: "precise-value-entry",
      evidence: {
        detail:
          "The user explicitly requested changing a letter or phrase and choosing a font.",
        source: "user-request",
      },
      id: "text-shape-authoring",
      reason:
        "The panel keeps text and typography persistent, resettable, exportable, and accessible without covering the particle output.",
      surface: "panel",
      target: "text.content",
    },
    {
      alternative: {
        reason:
          "Dragging arbitrary points would duplicate the requested count/distribution controls and make exact settings undiscoverable.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user requested particle count, distribution, weight, physics, colors, and related exact settings.",
        source: "user-request",
      },
      id: "particle-system-properties",
      reason:
        "Panel controls provide precise repeatable particle and physics values while the canvas remains the uncluttered product preview.",
      surface: "panel",
      target: "particles.count",
    },
    {
      alternative: {
        reason:
          "Canvas timing chrome would duplicate the requested slider and cover the product output.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user explicitly requested a slider for the main animation duration.",
        source: "user-request",
      },
      id: "active-loop-timing",
      reason:
        "The panel slider provides a precise persistent duration while the top timeline remains the transport owner.",
      surface: "panel",
      target: "motion.activeDuration",
    },
    {
      alternative: {
        reason:
          "Canvas timing chrome would duplicate the requested slider and obscure the calm-state output being evaluated.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user explicitly requested a calm-duration slider and clarified that it must not change idle animation speed.",
        source: "user-request",
      },
      id: "calm-loop-timing",
      reason:
        "The panel slider makes calm duration precise and persistent without duplicating timeline transport.",
      surface: "panel",
      target: "motion.calmDuration",
    },
  ],
  mode: "product",
  productName: "Particle Typography",
  productSummary:
    "A deterministic particle-type studio that launches chaotically colored dots into editable letters or phrases with adjustable boundary spill, phase timing, spring physics, timeline playback, and image/video export.",
  requestedBehavior:
    "Reproduce the supplied particle formation with editable text, chaotic colors, adjustable boundary spill, independent Active and Calm duration sliders, fixed-speed calm animation, seamless playback, and image/video export.",
  viewInteraction: {
    mode: "non-spatial",
    reason:
      "The product is a flat two-dimensional particle composition with no visible 3D scene or rotatable model.",
  },
};

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Editable text target and typography",
    groupingReason:
      "The short text content selects the letter, word, or phrase used for the sampled target.",
    id: "text-shape",
    targets: ["text.content"],
    title: "Text Shape",
  },
  {
    entity: "Atomic typography for the sampled text",
    groupingReason:
      "Font family, weight, size, case, letter spacing, line height, tint, and opacity are owned by one FontPicker compound control.",
    id: "typography",
    targets: ["text.typography"],
    title: "Typography",
  },
  {
    entity: "Particle population and spatial allocation",
    groupingReason:
      "Count, glyph sampling, boundary spill, launch arrangement, and radius bounds define which point entities are created and where they travel.",
    id: "particles",
    targets: [
      "particles.count",
      "particles.distribution",
      "particles.edgeSpill",
      "particles.launch",
      "particles.size",
    ],
    title: "Particles",
  },
  {
    entity: "Forward loop phase timing",
    groupingReason:
      "Active and Calm divide one seamless product loop while the top timeline owns transport and optional global scaling.",
    id: "timing",
    targets: ["motion.activeDuration", "motion.calmDuration"],
    title: "Timing",
  },
  {
    entity: "Damped particle response",
    groupingReason:
      "Mass, attraction, damping, and turbulence jointly define the physical formation path.",
    id: "physics",
    targets: [
      "physics.mass",
      "physics.attraction",
      "physics.damping",
      "physics.turbulence",
    ],
    title: "Physics",
  },
  {
    entity: "Coordinated color presets",
    groupingReason:
      "Six theme actions each rewrite the multi-stop particle palette and the product background as one coordinated look.",
    id: "color-theme",
    targets: ["actions.colorTheme"],
    title: "Color Theme",
  },
  {
    entity: "Particle and trajectory appearance",
    groupingReason:
      "Trails, velocity-driven radius, and glow define the visible point field without changing its anchors.",
    id: "dot-look",
    targets: [
      "appearance.trails",
      "appearance.sizeMotion",
      "appearance.glow",
    ],
    title: "Dot Look",
  },
  {
    entity: "Multi-stop particle color field",
    groupingReason:
      "Gradient type, angle, stop positions, stop colors, and opacity jointly define particle and trail color allocation.",
    id: "particle-palette",
    targets: ["appearance.palette"],
    title: "Particle palette",
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
    browserTestName: DOTS_BROWSER_TEST_NAME,
    componentType: "settingsTransfer",
    evidence: "command-side-effect",
    expectedObservable:
      "Export Settings downloads JSON and Import Settings restores the serialized Dot Formation setup.",
    id: "runtime.settingsTransfer",
    target: null,
    userAction: "Export settings, change values, import the file, and verify restoration.",
  }),
  DOTS_DEFAULT_SETTINGS_ACCEPTANCE,
  controlAcceptance({
    componentType: "aspectRatio",
    expectedObservable: "Aspect ratio presets change the editable particle frame.",
    id: "canvas.aspectRatio",
    userAction: "Choose a landscape ratio and verify the visible output bounds change.",
  }),
  controlAcceptance({
    componentType: "text",
    expectedObservable: "Canvas width changes logical and backing output width.",
    id: "canvas.size.width",
    userAction: "Enter a new width and verify the particle backing follows it.",
  }),
  controlAcceptance({
    componentType: "text",
    expectedObservable: "Canvas height changes logical and backing output height.",
    id: "canvas.size.height",
    userAction: "Enter a new height and verify the particle backing follows it.",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Resolution scale changes backing pixels without changing visible canvas size.",
    id: "canvas.renderScale",
    userAction: "Change Resolution scale and compare backing dimensions and CSS bounds.",
  }),
  controlAcceptance({
    componentType: "switch",
    evidence: "command-side-effect",
    expectedObservable:
      "Timeline switch reveals extended transport without changing particle state.",
    id: "panels.timeline.extended",
    target: null,
    userAction: "Toggle Timeline and verify scrubber and duration controls appear.",
  }),
  {
    automated: true,
    automatedTestName: DOTS_AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: dotsBrowserTestName("canvas.infinity.mode"),
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity canvas removes the finite artboard and finite size controls, preserves pan and reload state, and restores the dormant finite frame through toggle, undo, and redo.",
    fixture: DOTS_FIXTURE,
    id: "canvas.infinity.mode",
    infinityCanvasCoverage: "mode-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction:
      "Enable Infinity canvas, pan and reload it, then disable, undo, and redo while verifying the finite frame returns unchanged.",
  },
  {
    automated: true,
    automatedTestName: DOTS_AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: dotsBrowserTestName("canvas.infinity.image-export"),
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "Infinite PNG export crops to the outward-rounded union of visible particle, glow, and trail bounds instead of the dormant finite canvas.",
    fixture: DOTS_FIXTURE,
    id: "canvas.infinity.image-export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    target: "canvas.infinity",
    userAction:
      "Export PNG in finite and infinite modes and decode both artifacts to verify their exact distinct frame dimensions.",
  },
  {
    automated: true,
    automatedTestName: DOTS_AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: dotsBrowserTestName("canvas.infinity.video-export"),
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "Infinite video export uses one complete timeline envelope so every frame fits the same scene-bounds dimensions.",
    fixture: DOTS_FIXTURE,
    id: "canvas.infinity.video-export",
    infinityCanvasCoverage: "scene-bounds-video-export",
    kind: "runtime",
    target: "canvas.infinity",
    userAction:
      "Export video in finite and infinite modes and inspect metadata for exact distinct dimensions and a positive duration.",
  },
  controlAcceptance({
    componentType: "text",
    expectedObservable:
      "Changing N to another letter or phrase resamples every particle anchor into that text.",
    id: "text.content",
    interactionId: "text-shape-authoring",
    userAction: "Type a different phrase and verify the particle silhouette changes while typing.",
  }),
  controlAcceptance({
    componentType: "fontPicker",
    controlPartCoverage: [
      "fontPicker.fontId",
      "fontPicker.fontWeight",
      "fontPicker.fontSize",
      "fontPicker.textCase",
      "fontPicker.color",
      "fontPicker.opacity",
      "fontPicker.letterSpacing",
      "fontPicker.lineHeight",
    ],
    expectedObservable:
      "Every typography field changes sampled geometry, particle tint, or product opacity.",
    id: "text.typography",
    userAction:
      "Change font, weight, size, case, color, opacity, letter spacing, and line height and compare the particle output.",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable: "Count changes the number of visible particle and trail primitives.",
    id: "particles.count",
    interactionId: "particle-system-properties",
    userAction: "Move Count from 1800 to another value and inspect the canvas particle count.",
  }),
  controlAcceptance({
    componentType: "segmented",
    expectedObservable: "Fill, Outline, and Mix create distinct text-anchor distributions.",
    id: "particles.distribution",
    optionCoverage: ["fill", "outline", "mixed"],
    userAction: "Choose each Shape fill option and compare the settled glyph.",
  }),
  controlAcceptance({
    browserTestName: DOTS_SPILL_BROWSER_TEST_NAME,
    componentType: "slider",
    expectedObservable:
      "Edge spill moves a deterministic share of settled dot centers beyond the sampled glyph boundary.",
    id: "particles.edgeSpill",
    userAction:
      "Compare a settled frame at 0% and 100% and verify the loose state extends beyond the strict glyph bounds.",
  }),
  controlAcceptance({
    componentType: "segmented",
    expectedObservable: "Ring, Scatter, and Grid use distinct particle launch arrangements.",
    id: "particles.launch",
    optionCoverage: ["ring", "scatter", "grid"],
    userAction: "Choose each Launch option and scrub to the first frame.",
  }),
  controlAcceptance({
    componentType: "rangeSlider",
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
    expectedObservable: "Both size bounds change resting and moving dot radii.",
    id: "particles.size",
    userAction: "Move each Size range thumb independently and compare dot radii.",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Active changes formation and release duration, updates total timeline length, and preserves the forward seam.",
    id: "motion.activeDuration",
    interactionId: "active-loop-timing",
    userAction:
      "Move Active and verify formation/release boundaries plus runtime duration change.",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Calm changes only settled-state length while equal elapsed idle seconds render at the same motion speed.",
    id: "motion.calmDuration",
    interactionId: "calm-loop-timing",
    userAction:
      "Move Calm, compare equal elapsed idle seconds, and verify duration changes without speed changes.",
  }),
  ...[
    ["physics.mass", "Mass changes oscillation period and response lag."],
    ["physics.attraction", "Attraction changes acceleration toward glyph anchors."],
    ["physics.damping", "Damping changes overshoot and settling time."],
    ["physics.turbulence", "Turbulence changes curl, spread, and stragglers."],
    ["appearance.trails", "Trails changes trajectory length and opacity."],
    ["appearance.sizeMotion", "Size motion changes velocity-driven dot growth."],
    ["appearance.glow", "Glow changes luminous radius around the same points."],
  ].map(([id, expectedObservable]) =>
    controlAcceptance({
      componentType: "slider",
      expectedObservable: expectedObservable ?? "The control changes product output.",
      id: id ?? "unknown",
      userAction: `Change ${id} and compare the same timeline frame.`,
    }),
  ),
  controlAcceptance({
    actionCoverage: DOT_COLOR_THEMES.map((theme) => theme.actionValue),
    browserTestName: DOTS_THEME_BROWSER_TEST_NAME,
    componentType: "actions",
    expectedObservable:
      "Each theme action rewrites the gradient stops and background color, changing dot, trail, and background pixels.",
    id: "actions.colorTheme",
    userAction:
      "Click each of the six theme buttons and compare palette stops, background color, and rendered output.",
  }),
  controlAcceptance({
    componentType: "gradient",
    controlPartCoverage: [
      "gradient.gradientType",
      "gradient.angle",
      "gradient.stops.position",
      "gradient.stops.color",
      "gradient.stops.opacity",
    ],
    expectedObservable:
      "Gradient type, angle, stop positions, colors, and opacity map into dot and trail pixels.",
    id: "appearance.palette",
    userAction:
      "Change every gradient part and compare particle colors at fixed anchors.",
  }),
  controlAcceptance({
    backgroundOutputCoverage: "all-required-background-output",
    componentType: "switch",
    expectedObservable:
      "Background controls preview and PNG transparency while video keeps the configured color.",
    id: "export.includeBackground",
    userAction:
      "Turn Background off in Setup, inspect preview and PNG alpha, then inspect video background.",
  }),
  controlAcceptance({
    componentType: "color",
    expectedObservable: "Background changes included preview, image, and video pixels.",
    id: "appearance.background",
    userAction:
      "Choose a different Background color in Setup and compare exported output.",
  }),
  controlAcceptance({
    componentType: "select",
    expectedObservable: "PNG and JPG choose matching encoding and extension.",
    id: "export.image.format",
    optionCoverage: ["png", "jpg"],
    userAction: "Export PNG and JPG and inspect MIME type and filename.",
  }),
  controlAcceptance({
    componentType: "select",
    expectedObservable: "2K, 4K, and 8K create exact long-edge dimensions.",
    id: "export.image.resolution",
    optionCoverage: ["2k", "4k", "8k"],
    userAction: "Export each image resolution and inspect decoded dimensions.",
  }),
  controlAcceptance({
    componentType: "select",
    expectedObservable: "MP4 and WebM request supported matching containers with fallback.",
    id: "export.video.format",
    optionCoverage: ["mp4", "webm"],
    userAction: "Choose each video format and inspect actual MIME type and extension.",
  }),
  controlAcceptance({
    componentType: "select",
    expectedObservable: "Current and 4K create encoder-safe aspect-preserving dimensions.",
    id: "export.video.resolution",
    optionCoverage: ["current", "4k"],
    userAction: "Export Current and 4K video and inspect metadata dimensions.",
  }),
  controlAcceptance({
    actionCoverage: ["export.video", "export.png"],
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Export Video and Export PNG return nonempty files from current text, physics, canvas, and timeline state.",
    id: "actions.output",
    userAction: "Export both outputs and decode the resulting files.",
  }),
  {
    automated: true,
    automatedTestName: DOTS_AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: dotsBrowserTestName("reference.canvas-sizing"),
    componentType: "reference-canvas",
    evidence: "rendered-pixels",
    expectedObservable:
      "Editable 4:5 framing preserves the portrait reference composition while Toolcraft controls output size.",
    fixture: DOTS_FIXTURE,
    id: "reference.canvas-sizing",
    kind: "runtime",
    referenceCoverage: "canvas-sizing",
    userAction: "Change output ratio and compare ring and glyph centering.",
  },
  {
    automated: true,
    automatedTestName: DOTS_AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: dotsBrowserTestName("reference.control-mapping"),
    componentType: "reference-controls",
    evidence: "rendered-pixels",
    expectedObservable:
      "Particle, physics, distribution, color, trail, and size controls reproduce the inspected reference behaviors.",
    fixture: DOTS_FIXTURE,
    id: "reference.control-mapping",
    kind: "runtime",
    referenceCoverage: "control-mapping",
    userAction: "Change transferred controls and compare deterministic frames with the study.",
  },
  {
    automated: true,
    automatedTestName: DOTS_AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: dotsBrowserTestName("reference.renderer-state"),
    componentType: "custom-renderer",
    evidence: "product-output",
    expectedObservable:
      "A perimeter ring launches inward with colored trails, asynchronous overshoot, a readable N, and an adjustable fixed-speed calm state.",
    fixture: DOTS_FIXTURE,
    id: "reference.renderer-state",
    kind: "runtime",
    referenceCoverage: "renderer-state",
    userAction: "Scrub opening, formation, settling, and hold frames and compare the storyboard.",
  },
  {
    automated: true,
    automatedTestName: DOTS_AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: dotsBrowserTestName("runtime.timeline.playback"),
    componentType: "timeline",
    evidence: "timeline-output",
    expectedObservable:
      "Play advances deterministic formation, timing sliders update phase durations, pause freezes it, scrub restores exact frames, global duration edits preserve phase ratio, and first/last frames match.",
    fixture: DOTS_FIXTURE,
    id: "runtime.timeline.playback",
    kind: "runtime",
    referenceTimelineCoverage: "playback",
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
    automatedTestName: DOTS_AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: dotsBrowserTestName("runtime.persistence.reload"),
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable: "Values, canvas, panels, and timeline restore after a real reload.",
    fixture: DOTS_FIXTURE,
    id: "runtime.persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices: ["values", "canvas", "panels", "timeline"],
    userAction: "Change every persisted slice, reload, and verify restoration.",
  },
  {
    automated: true,
    automatedTestName: DOTS_AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: dotsBrowserTestName("runtime.canvas.viewport"),
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Drag, zoom, radar, and center preserve playback state while the renderer coalesces nonessential animation frames.",
    fixture: DOTS_FIXTURE,
    id: "runtime.canvas.viewport",
    kind: "runtime",
    userAction: "Play, drag and zoom the canvas, use radar and center, and verify timeline continuity.",
  },
];

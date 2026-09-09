import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlPartCoverage,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";
import { FLOW_DURATION_SECONDS } from "./domain/flow";
import { maskComponentAcceptance, maskInteractionOwnership } from "./circle-mask-acceptance";
import {
  heroPreviewAcceptance,
  heroPreviewControlSectionInventory,
  heroPreviewInteractionOwnership,
} from "./hero-preview-acceptance-data";
import { waveControlSectionInventory } from "./wave-control-section-inventory";

const persistenceSlices =
  appSchema.persistence.storage === "localStorage" ? appSchema.persistence.include : [];

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    loopDuration: {
      evidence: "2026-09-09: the user requested hero-settings.json as the defaults. Its 8-second duration replaces the earlier 12-second default while preserving forward Flow and saved workspace durations.",
      seconds: FLOW_DURATION_SECONDS,
      source: "product-derived",
    },
    mode: "timeline-playback",
  },
  behaviorCoverage: ["canvas-sizing", "control-mapping", "renderer-state"],
  mode: "reference-runtime-clone",
  referenceFeatureInventory: [
    {
      acceptanceId: "hero.native-section",
      behaviorEvidence: "The original /toolcraft/hero route was opened locally: the Percents wordmark, Book a call link, two-line heading, right copy and rotating partner logos render as one hero section.",
      featureName: "Self-contained header and hero",
      id: "reference.native-hero",
      referenceBehavior: "The source preview renders Header and HeroSection, uses 4/6/10/12 logo slots by viewport width, and freezes the foreground video on its opening frame.",
      sourceEvidence: "percents-next/src/app/(toolcraft-preview)/toolcraft/hero/page.tsx, Header, HeroSection, Logos, PauseableVideo and the native Recraft section adapter were inspected. Exact source and asset hashes are in docs/reference/native-hero-manifest.json.",
      status: "intentionally-changed",
      toolcraftMapping: "Local src/section components receive canonical settings and a canvas-sized viewport. The imported Fold Studio hero retains its copy, 24 original reference-brand SVGs, typography, responsive structure and logo rotation. User approved a static preview instead of video: the frozen opening frame is a local JPEG95, with the original reveal geometry. All public asset paths respect the deployment base. No iframe, message transport or source-server dependency.",
    },
    {
      acceptanceId: "hero.wave.frame.width",
      behaviorEvidence:
        "The original Percent Hero renders the complete retained WebGL scene inside its canvas and responds to the canvas bounds supplied by its host.",
      featureName: "Wave render frame",
      id: "reference.wave-render-frame",
      referenceBehavior:
        "The wave remains one complete WebGL composition while its containing canvas determines the visible frame.",
      sourceEvidence:
        "/Users/kusnizza/Projects/percent-hero/src/app/renderer/hero-canvas.tsx and hero-renderer.ts were inspected and restored inside this Toolcraft app.",
      status: "ported",
      toolcraftMapping:
        "Wave width and height set the retained renderer frame, while the vector pad offsets that frame from the center of the hero preview.",
    },
    {
      acceptanceId: "hero.structure.shape",
      behaviorEvidence:
        "The original Percent Hero exposes the complete background, structure, rib, camera, light, sky, material, post, haze, motion, preset, and mask control set.",
      featureName: "Complete wave control surface",
      id: "reference.wave-controls",
      referenceBehavior:
        "Every visible reference control writes its named value into the same retained WebGL scene and presets apply coordinated value sets.",
      sourceEvidence:
        "/Users/kusnizza/Projects/percent-hero/src/app/domain and app-schema.ts were inspected and their product controls were transferred without reinterpretation.",
      status: "ported",
      toolcraftMapping:
        "The original control sections, targets, defaults, presets, and mask handles are registered after the existing hero typography and spacing controls.",
    },
    {
      acceptanceId: "hero.renderer.state",
      behaviorEvidence:
        "The reference keeps one Three.js renderer, scene, camera, geometry, material, mask pipeline, and animation state alive across value edits.",
      featureName: "Retained WebGL wave renderer",
      id: "reference.wave-renderer",
      referenceBehavior:
        "Parameter edits update one retained renderer rather than replacing the scene or flattening it into a static asset.",
      sourceEvidence:
        "/Users/kusnizza/Projects/percent-hero/src/app/renderer/hero-renderer.ts and hero-pipeline.ts define the inspected retained rendering lifecycle.",
      status: "ported",
      toolcraftMapping:
        "HeroCanvas mounts that renderer as the middle preview layer between the base hero background and the unchanged foreground native preview.",
    },
    {
      acceptanceId: "hero.timeline.playback",
      behaviorEvidence:
        "The reference maps Toolcraft playback time into a playback cycle; its oscillator channels were replaced by the user-requested forward rib Flow.",
      featureName: "Wave playback timeline",
      id: "reference.wave-playback",
      referenceBehavior:
        "Play, pause, scrub, duration changes, and looping operate on the same visible wave renderer state.",
      sourceEvidence:
        "/Users/kusnizza/Projects/percent-hero/src/app/domain/motion.ts and renderer/hero-renderer.ts were inspected together with the 40-second reference timeline schema.",
      status: "ported",
      toolcraftMapping:
        "The standard Toolcraft playback timeline remains connected to the transferred renderer with forward rib Flow and an 8-second default from the approved settings; saved durations are retained.",
    },
  ],
  referenceInputs: [],
  referenceName: "Percents website hero and Percent Hero wave generator",
  referenceStudy: {
    behaviorEvidence:
      "The original Toolcraft implementation, its controls, presets, mask handles, retained WebGL renderer, and timeline mapping were inspected before transfer; the restored target is verified through the same product tests and browser interaction path.",
    referenceLocation: "/Users/kusnizza/Projects/percent-hero and /Users/kusnizza/Projects/percents-next",
    reproductionSteps:
      "Run pnpm dev in /Users/kusnizza/Projects/percent-hero, open its local Toolcraft route, edit representative controls, apply each preset, drag mask handles, and exercise play, pause, scrub, duration, and loop behavior.",
    sourceEvidence:
      "The source app schema, renderer, masks and presets were inspected; the 2026-09-09 native port also inspected the website Header, HeroSection, logo animation, frozen preview media, exact fonts and CSS. Recraft's src/section adapter supplies the architectural precedent.",
    status: "ran-original",
  },
  referenceTimeline: {
    behaviorCoverage: ["playback"],
    loopDuration: {
      evidence: "The user-approved 2026-09-09 hero-settings.json specifies an 8-second default; the original timeline transport remains runtime-owned.",
      seconds: FLOW_DURATION_SECONDS,
      source: "product-derived",
    },
    mode: "toolcraft-playback",
  },
  sourceOfTruth: "reference-runtime",
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: {
      evidence:
        "The user explicitly said «экспорт делать не надо» for this transfer; the live wave remains fully editable in Toolcraft without artifact delivery.",
      mode: "user-removed",
    },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [
    ...heroPreviewInteractionOwnership,
    {
      alternative: {
        reason:
          "Dragging an invisible frame edge on the composed hero would obscure the foreground and duplicate exact numeric size controls.",
        surface: "canvas",
      },
      capability: "precise-value-entry",
      evidence: {
        detail: "The user explicitly requested independently configurable wave canvas dimensions.",
        source: "user-request",
      },
      id: "wave-frame-size-entry",
      reason:
        "Panel sliders provide exact, persistent wave width and height values without altering the foreground composition.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: "wave.frame.width",
    },
    {
      alternative: {
        reason:
          "A direct canvas drag would compete with the editable mask handles and the Toolcraft viewport gesture.",
        surface: "canvas",
      },
      capability: "precise-value-entry",
      evidence: {
        detail:
          "The user explicitly requested the built-in Toolcraft vector pad for positioning the wave background.",
        source: "user-request",
      },
      id: "wave-frame-position-entry",
      reason:
        "The panel vector pad owns the exact X and Y offset while mask handles keep their original canvas interaction.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: "wave.frame.position",
    },
    ...maskInteractionOwnership,
  ],
  mode: "product",
  productName: "Work with Masks",
  productSummary:
    "The existing Percents hero preview with its typography and spacing controls, plus the exact Percent Hero retained WebGL wave generator composited between the original background and unchanged foreground content.",
  requestedBehavior:
    "Preserve the main hero preview, all authored scene and layout settings, presets and masks; replace oscillation with forward rib Flow through the existing timeline. Keep independent wave bounds and the X/Y position pad; do not add artifact export.",
  viewInteraction: {
    evidence:
      "The inspected Percent Hero reference uses authored camera position, yaw, pitch, roll, and FOV values and exposes no orbit interaction or orientation gizmo.",
    mode: "fixed-camera",
    source: "inspected-reference",
  },
};

function heroBrowserFile(id: string) {
  return id.startsWith("hero.flow.")
    ? ("e2e/product-hero-flow.spec.ts" as const)
    : id.startsWith("hero.post.") || id.startsWith("hero.haze.") || id.startsWith("hero.presets.")
      ? ("e2e/product-hero-finish.spec.ts" as const)
      : ("e2e/product-hero.spec.ts" as const);
}

function heroBrowser(id: string) {
  return {
    budget: "standard",
    file: heroBrowserFile(id),
    testName: `browser: ${id} changes 3d scene pixels`,
  } as const;
}

function heroControl(
  id: string,
  target: string,
  componentType: string,
  options: Readonly<{
    controlPartCoverage?: readonly ToolcraftControlPartCoverage[];
    optionCoverage?: readonly string[];
  }> = {},
): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: "maps stage-one 3d controls into renderer parameters",
    browser: heroBrowser(id),
    componentType,
    ...(options.controlPartCoverage ? { controlPartCoverage: options.controlPartCoverage } : {}),
    evidence: "rendered-pixels",
    expectedObservable: `Editing ${target} changes stable pixels in the retained three-dimensional hero scene.`,
    fixture: "default Oculus vault hero",
    id,
    kind: "control",
    ...(options.optionCoverage ? { optionCoverage: options.optionCoverage } : {}),
    target,
    userAction: `Edit ${target} through its visible Toolcraft control and inspect the WebGL output.`,
  };
}

function heroFlowControl(id: string, target: string, componentType: string): ToolcraftComponentAcceptance {
  return {
    ...heroControl(id, target, componentType, target === "flow.direction" ? { optionCoverage: ["toward", "away"] } : {}),
    automatedTestName: "preserves authored scene settings while moving ribs monotonically",
    expectedObservable: `Editing ${target} changes the Flow frame at quarter progress without modifying authored scene values.`,
  };
}

const wavePlacementAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName: "maps wave frame controls to the approved renderer rectangle",
    browser: {
      budget: "standard",
      file: "e2e/product-wave-placement.spec.ts",
      testName: "browser: wave width changes the middle-layer renderer frame",
    },
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing Width updates the visible WebGL wave frame while the foreground hero remains fixed.",
    fixture: "1920 by 1080 centered wave inside the 2400 by 1200 hero preview",
    id: "hero.wave.frame.width",
    interactionId: "wave-frame-size-entry",
    kind: "control",
    referenceCoverage: "canvas-sizing",
    target: "wave.frame.width",
    userAction: "Drag Width through a visibly different value and inspect the wave bounds.",
  },
  {
    automated: true,
    automatedTestName: "maps wave frame controls to the approved renderer rectangle",
    browser: {
      budget: "standard",
      file: "e2e/product-wave-placement.spec.ts",
      testName: "browser: wave height changes the middle-layer renderer frame",
    },
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing Height updates the visible WebGL wave frame without moving the foreground hero.",
    fixture: "1920 by 1080 centered wave inside the 2400 by 1200 hero preview",
    id: "hero.wave.frame.height",
    kind: "control",
    target: "wave.frame.height",
    userAction: "Drag Height through a visibly different value and inspect the wave bounds.",
  },
  {
    automated: true,
    automatedTestName: "maps wave frame controls to the approved renderer rectangle",
    browser: {
      budget: "standard",
      file: "e2e/product-wave-placement.spec.ts",
      testName: "browser: wave position pad moves the middle-layer renderer frame",
    },
    componentType: "vector",
    controlPartCoverage: ["vector.x", "vector.y"],
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing either Position axis offsets the complete wave frame relative to preview center while the foreground stays fixed.",
    fixture: "1920 by 1080 centered wave inside the 2400 by 1200 hero preview",
    id: "hero.wave.frame.position",
    interactionId: "wave-frame-position-entry",
    kind: "control",
    target: "wave.frame.position",
    userAction: "Drag both X and Y axes on the built-in Position pad and inspect the wave frame.",
  },
  {
    automated: true,
    automatedTestName: "retains the transferred WebGL renderer across value updates",
    browser: {
      budget: "standard",
      file: "e2e/product-wave-placement.spec.ts",
      testName: "browser: wave renderer stays retained beneath the foreground hero",
    },
    componentType: "canvas",
    evidence: "rendered-pixels",
    expectedObservable:
      "The same WebGL canvas remains between the base background and foreground native preview while a structure value changes its pixels.",
    fixture: "default imported wave parameters beneath the unchanged hero foreground",
    id: "hero.renderer.state",
    kind: "runtime",
    referenceCoverage: "renderer-state",
    target: "structure.wave",
    userAction: "Edit Wave amplitude and inspect layer order, canvas identity, and changed pixels.",
  },
];

const waveAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName: "declares production reload coverage for the Percent Hero schema",
    browser: {
      budget: "extended-io",
      file: "e2e/app-persistence.spec.ts",
      testName:
        "browser: app restores exact canvas, values, and panel workspace slices after reload",
    },
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Canvas size, product values, zoom, and Controls workspace restore after a real reload.",
    fixture: "Percent Hero persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices,
    target: "canvas.size.width",
    userAction:
      "Edit Canvas width and zoom, move and collapse Controls, wait for persistence, and reload.",
  },
  {
    automated: true,
    automatedTestName: "maps stage-one 3d controls into renderer parameters",
    browser: heroBrowser("hero.background.include"),
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "Background off removes the wave renderer background while preserving the transparent middle-layer canvas and foreground hero.",
    fixture: "background-sensitive 3d hero",
    id: "hero.background.include",
    kind: "control",
    optionCoverage: ["true", "false"],
    target: "export.includeBackground",
    userAction: "Toggle Background and inspect the live wave pixels beneath the foreground native preview.",
  },
  {
    automated: true,
    automatedTestName: "maps stage-one 3d controls into renderer parameters",
    browser: heroBrowser("hero.background.color"),
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "The selected background color appears beneath translucent sky stops in the live wave layer.",
    fixture: "semi-transparent sky over selected background",
    id: "hero.background.color",
    kind: "control",
    target: "appearance.background",
    userAction: "Change Background color and inspect the live wave canvas.",
  },
  {
    ...heroControl("hero.structure.shape", "structure.shape", "segmented", {
      optionCoverage: ["vault", "dome"],
    }),
    browser: {
      budget: "standard",
      file: "e2e/product-hero.spec.ts",
      testName: "browser: hero.structure.shape switches structure fields",
    },
    expectedObservable:
      "Vault and Dome produce distinct geometry, and Dome length appears only for Dome while retaining its value.",
    referenceCoverage: "control-mapping",
  },
  heroControl("hero.structure.radius", "structure.radius", "slider"),
  heroControl("hero.structure.dome-length", "structure.domeLength", "slider"),
  heroControl("hero.structure.arc", "structure.arc", "rangeSlider", {
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
  }),
  heroControl("hero.structure.spacing", "structure.spacing", "slider"),
  heroControl("hero.structure.count", "structure.count", "slider"),
  heroControl("hero.structure.twist", "structure.twist", "slider"),
  heroControl("hero.structure.wave", "structure.wave", "slider"),
  heroControl("hero.structure.wave-length", "structure.waveLength", "slider"),
  heroControl("hero.rib.width", "rib.width", "slider"),
  heroControl("hero.rib.depth", "rib.depth", "slider"),
  heroControl("hero.rib.corner", "rib.corner", "slider"),
  heroControl("hero.rib.taper-start", "rib.taperStart", "slider"),
  heroControl("hero.rib.taper-tip", "rib.taperTip", "slider"),
  heroControl("hero.rib.taper-side", "rib.taperSide", "segmented", {
    optionCoverage: ["start", "end"],
  }),
  heroControl("hero.camera.position", "camera.position", "vector", {
    controlPartCoverage: ["vector.x", "vector.y"],
  }),
  heroControl("hero.camera.height", "camera.height", "slider"),
  heroControl("hero.camera.yaw", "camera.yaw", "slider"),
  heroControl("hero.camera.pitch", "camera.pitch", "slider"),
  heroControl("hero.camera.roll", "camera.roll", "slider"),
  heroControl("hero.camera.fov", "camera.fov", "slider"),
  heroControl("hero.light.azimuth", "light.azimuth", "slider"),
  heroControl("hero.light.elevation", "light.elevation", "slider"),
  heroControl("hero.light.intensity", "light.intensity", "slider"),
  heroControl("hero.light.color", "light.color", "color"),
  {
    ...heroControl("hero.light.shadows", "light.shadows", "switch", {
      optionCoverage: ["true", "false"],
    }),
    browser: {
      budget: "standard",
      file: "e2e/product-hero.spec.ts",
      testName: "browser: hero.light.shadows switches cast shadows",
    },
    expectedObservable:
      "Cast shadows on and off produce distinct sun shading, and Shadow softness appears only while shadows are on while retaining its value.",
  },
  heroControl("hero.light.shadow-softness", "light.shadowSoftness", "slider"),
  heroControl("hero.light.ambient", "light.ambient", "slider"),
  heroControl("hero.light.sky-color", "light.skyColor", "color"),
  heroControl("hero.light.ground-color", "light.groundColor", "color"),
  heroControl("hero.sky.gradient", "sky.gradient", "gradient", {
    controlPartCoverage: [
      "gradient.gradientType",
      "gradient.angle",
      "gradient.stops.position",
      "gradient.stops.color",
      "gradient.stops.opacity",
    ],
  }),
  heroControl("hero.sky.light-gradient", "sky.lightGradient", "gradient", {
    controlPartCoverage: [
      "gradient.gradientType",
      "gradient.angle",
      "gradient.stops.position",
      "gradient.stops.color",
      "gradient.stops.opacity",
    ],
  }),
  heroControl("hero.sky.environment", "sky.envIntensity", "slider"),
  heroControl("hero.sky.fog-near", "sky.fogNear", "slider"),
  heroControl("hero.sky.fog-far", "sky.fogFar", "slider"),
  heroControl("hero.sky.fog-color", "sky.fogColor", "color"),
  heroControl("hero.material.color", "material.color", "color"),
  heroControl("hero.material.roughness", "material.roughness", "slider"),
  heroControl("hero.material.clearcoat", "material.clearcoat", "slider"),
  heroControl("hero.material.clearcoat-roughness", "material.clearcoatRoughness", "slider"),
  heroControl("hero.post.exposure", "post.exposure", "slider"),
  heroControl("hero.post.bloom", "post.bloom", "slider"),
  heroControl("hero.post.bloom-threshold", "post.bloomThreshold", "slider"),
  heroControl("hero.post.occlusion", "post.occlusion", "slider"),
  heroControl("hero.post.occlusion-radius", "post.occlusionRadius", "slider"),
  {
    ...heroControl("hero.post.depth-of-field", "post.depthOfField", "switch", {
      optionCoverage: ["true", "false"],
    }),
    browser: {
      budget: "standard",
      file: "e2e/product-hero-finish.spec.ts",
      testName: "browser: hero.post.depth-of-field switches focus fields",
    },
    expectedObservable:
      "Depth of field on and off produce distinct frames, and Focus distance and Aperture appear only while it is on while retaining their values.",
  },
  heroControl("hero.post.focus", "post.focus", "slider"),
  heroControl("hero.post.aperture", "post.aperture", "slider"),
  heroControl("hero.haze.gradient", "haze.gradient", "gradient", {
    controlPartCoverage: [
      "gradient.gradientType",
      "gradient.angle",
      "gradient.stops.position",
      "gradient.stops.color",
      "gradient.stops.opacity",
    ],
  }),
  heroControl("hero.haze.strength", "haze.strength", "slider"),
  heroControl("hero.haze.blend", "haze.blend", "select", {
    optionCoverage: ["normal", "screen", "multiply"],
  }),
  heroControl("hero.haze.glow-color", "haze.glowColor", "color"),
  heroControl("hero.haze.glow-position", "haze.glowPosition", "vector", {
    controlPartCoverage: ["vector.x", "vector.y"],
  }),
  heroControl("hero.haze.glow-radius", "haze.glowRadius", "slider"),
  heroControl("hero.haze.glow-strength", "haze.glowStrength", "slider"),
  heroFlowControl("hero.flow.travel", "flow.travel", "slider"),
  heroFlowControl("hero.flow.direction", "flow.direction", "segmented"),
  heroFlowControl("hero.flow.glow-orbit", "flow.glowOrbit", "slider"),
  heroFlowControl("hero.flow.glow-radius", "flow.glowOrbitRadius", "slider"),
  ...maskComponentAcceptance,
  {
    actionCoverage: ["preset.oculus", "preset.bend", "preset.wave", "preset.amber"],
    automated: true,
    automatedTestName: "applies every non-default preset value through accepted value commands",
    browser: {
      budget: "standard",
      file: "e2e/product-hero-finish.spec.ts",
      testName: "browser: hero.presets.apply loads reference looks",
    },
    componentType: "actions",
    evidence: "rendered-pixels",
    expectedObservable:
      "Oculus, Bend, Wave, and Amber each load their matched scene and Flow values and render a distinct 3d frame.",
    fixture: "default Oculus vault hero",
    id: "hero.presets.apply",
    kind: "control",
    target: "presets.apply",
    userAction: "Click each reference look button and inspect the scene values and WebGL output.",
  },
  {
    automated: true,
    automatedTestName: "preserves authored scene settings while moving ribs monotonically",
    browser: {
      budget: "standard",
      file: "e2e/product-hero-flow.spec.ts",
      testName: "browser: hero.timeline.playback loops forward",
    },
    componentType: "timeline",
    evidence: "timeline-output",
    expectedObservable:
      "Playback and scrubbing move the retained 3d scene through one forward-only Flow loop with matching first and last frames.",
    fixture: "animated Amber dome",
    id: "hero.timeline.playback",
    kind: "runtime",
    referenceTimelineCoverage: "playback",
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
      "Play, pause, resume, scrub, and change duration while inspecting the rendered frame.",
  },
  {
    automated: true,
    automatedTestName: "uses one scene frame in finite and infinite modes",
    browser: {
      budget: "standard",
      file: "e2e/product-runtime.spec.ts",
      testName: "browser: hero preserves its scene through Infinity toggles",
    },
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity removes only the artboard boundary and restores the same frame, renderer, backing, view, and 3d scene.",
    fixture: "finite and infinite 3d hero",
    id: "hero.runtime.infinity",
    infinityCanvasCoverage: "mode-continuity-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Toggle Infinity on and off while observing scene and view continuity.",
  },
  {
    automated: true,
    automatedTestName: "bounds editable wave GPU work to the visible window while preserving full-frame landmarks",
    browser: {
      budget: "standard",
      file: "e2e/product-wave-viewport.spec.ts",
      testName: "browser: wave.viewport preserves the editable full-size wave through zoom",
    },
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable: "Zoom preserves wave-local pixels and camera framing; visible selected-density backing matches the actual GPU buffer without changing the authored scene frame.",
    fixture: "Default 2826×1080 editable wave, 310 ribs, standard browser DPR 1, render scale 2, paused 40→200% zoom",
    id: "wave.viewport",
    kind: "runtime",
    target: "canvas.viewport.zoom",
    userAction: "Increase canvas zoom past the previous GPU overflow point while comparing the same authored wave region.",
  },
  {
    automated: true,
    automatedTestName: "uses selected render-scale backing pixels",
    browser: {
      budget: "standard",
      file: "e2e/product-runtime.spec.ts",
      testName: "browser: hero uses selected render-scale backing pixels",
    },
    componentType: "canvas",
    evidence: "rendered-pixels",
    expectedObservable:
      "The WebGL backing equals CSS size times device pixel ratio times selected scale during interaction and steady state.",
    fixture: "finite 3d hero at render scale two",
    id: "hero.runtime.render-scale",
    kind: "runtime",
    renderScaleCoverage: {
      kind: "selected-backing-pixels",
      states: ["interaction", "playback", "steady"],
    },
    target: "canvas.renderScale",
    userAction: "Select render scale 2, drag a control, and inspect live backing pixels.",
  },
];

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName: "renders local header and hero components without an iframe or source server",
    browser: { budget: "standard", file: "e2e/product-native-hero.spec.ts",
      testName: "browser native hero: runs independently and responds to its own canvas width" },
    componentType: "native-dom",
    evidence: "product-output",
    expectedObservable: "Native hero content, local fonts, logos and static opening-frame preview load with the source server blocked; toolbar and wheel zoom preserve paused wave composition and update backing pixels; resizing the canvas changes responsive layout without replacing the wave canvas.",
    fixture: "2400px hero frame with real paused bounded wave, resized to a 390px mobile frame",
    id: "hero.native-section",
    kind: "runtime",
    referenceCoverage: "canvas-sizing",
    target: "canvas.size.width",
    userAction: "Open the standalone app, zoom the paused wave with toolbar and modifier-wheel, then change Canvas width to 390px.",
  },
  ...heroPreviewAcceptance.filter((entry) => entry.id !== "hero.canvas.fixed-size"),
  ...wavePlacementAcceptance,
  ...waveAcceptance.filter((entry) => entry.id !== "persistence.reload"),
];

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  ...heroPreviewControlSectionInventory,
  {
    entity: "Wave render frame",
    entityId: "wave-frame",
    finiteSelectors: [],
    groupingReason:
      "Width, height, and center-relative X/Y offset define the independent WebGL wave rectangle beneath the hero foreground.",
    id: "wave-placement",
    targets: ["wave.frame.width", "wave.frame.height", "wave.frame.position"],
    title: "Wave placement",
  },
  ...waveControlSectionInventory,
];

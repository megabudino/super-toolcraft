import { getCreativeAppsKitControlKeyframeCapability } from "@/creative-apps-kit/template-runtime";
import type {
  CreativeAppsKitActionSchema,
  CreativeAppsKitControlOrderRole,
  CreativeAppsKitControlSchema,
  ResolvedCreativeAppsKitAppSchema,
} from "@/creative-apps-kit/template-runtime";

import { appSchema } from "./app-schema";

export type CreativeAppsKitAcceptanceEvidence =
  | "command-side-effect"
  | "exported-bytes"
  | "media-lifecycle"
  | "product-output"
  | "rendered-pixels"
  | "timeline-output"
  | "viewport-side-effect";

export type CreativeAppsKitReferenceCoverage =
  | "canvas-sizing"
  | "control-mapping"
  | "export-at-time"
  | "export-copy"
  | "media-lifecycle"
  | "pause-resume"
  | "renderer-loop"
  | "renderer-state"
  | "restart"
  | "spawn-update-cadence"
  | "time-progress";

export type CreativeAppsKitReferenceTimelineCoverage =
  | "all-range"
  | "duration"
  | "export-at-time"
  | "export-range"
  | "jump-to-trim-start"
  | "keyframes"
  | "loop"
  | "playback"
  | "range-playback"
  | "restart"
  | "scrub"
  | "state-jump"
  | "time-progress"
  | "trim-range";

export type CreativeAppsKitTimelinePlaybackCoverage =
  | "duration"
  | "loop"
  | "pause-resume"
  | "rendered-frame"
  | "scrub";

export type CreativeAppsKitCanvasSizingCoverage = "fixed-output-size";

export type CreativeAppsKitAutonomousAnimationCoverage =
  | "no-duration-control"
  | "no-export-at-time"
  | "no-loop-control"
  | "no-play-pause"
  | "no-scrub"
  | "no-user-facing-transport";

export type CreativeAppsKitAnimationIntent =
  | {
      mode: "none";
    }
  | {
      behaviorCoverage: readonly CreativeAppsKitAutonomousAnimationCoverage[];
      mode: "autonomous";
      reason: string;
    }
  | {
      mode: "timeline-keyframes";
    }
  | {
      mode: "timeline-playback";
    };

export type CreativeAppsKitReferenceTimelineMode =
  | "custom-reference-timeline"
  | "none"
  | "creative-apps-kit-keyframes"
  | "creative-apps-kit-playback";

export type CreativeAppsKitReferenceTimelineContract = {
  behaviorCoverage: readonly CreativeAppsKitReferenceTimelineCoverage[];
  mode: CreativeAppsKitReferenceTimelineMode;
};

export type CreativeAppsKitLayerCoverage =
  | "grouping"
  | "media-lifecycle"
  | "reorder"
  | "selected-layer-controls"
  | "selection"
  | "visibility";

export type CreativeAppsKitControlPartCoverage =
  | "anchorGrid.position"
  | "channelMixer.activeChannel"
  | "channelMixer.values"
  | "colorOpacity.hex"
  | "colorOpacity.opacity"
  | "curves.activeChannel"
  | "curves.points"
  | "gradient.angle"
  | "gradient.gradientType"
  | "gradient.stops.color"
  | "gradient.stops.opacity"
  | "gradient.stops.position"
  | "palette.family"
  | "palette.shade"
  | "rangeInput.end"
  | "rangeInput.start"
  | "rangeSlider.lower"
  | "rangeSlider.upper"
  | "vector.x"
  | "vector.y";

export type CreativeAppsKitTransferMode =
  | {
      animationIntent?: CreativeAppsKitAnimationIntent;
      mode: "new-creative-apps-kit-app";
    }
  | {
      animationIntent?: CreativeAppsKitAnimationIntent;
      behaviorCoverage: readonly CreativeAppsKitReferenceCoverage[];
      mode: "reference-runtime-clone";
      referenceName: string;
      referenceTimeline: CreativeAppsKitReferenceTimelineContract;
      sourceOfTruth: "reference-runtime";
    };

export type CreativeAppsKitProductReadiness =
  | {
      mode: "starter";
      reason: string;
    }
  | {
      mode: "product";
      productName: string;
      productSummary: string;
      requestedBehavior: string;
    };

export type CreativeAppsKitComponentAcceptance = {
  actionCoverage?: readonly string[];
  automated: boolean;
  automatedTestName: string;
  browser: boolean;
  browserTestName: string;
  componentType: string;
  evidence: CreativeAppsKitAcceptanceEvidence;
  expectedObservable: string;
  fixture: string;
  id: string;
  canvasHandle?: {
    exportCleanTestName: string;
    outputObservable: string;
    testId: string;
    writesTarget: string;
  };
  kind: "canvas-handle" | "control" | "runtime";
  canvasSizingCoverage?: CreativeAppsKitCanvasSizingCoverage;
  layerCoverage?: CreativeAppsKitLayerCoverage;
  optionCoverage?: "each-visible-item" | readonly string[];
  referenceCoverage?: CreativeAppsKitReferenceCoverage;
  referenceTimelineCoverage?: CreativeAppsKitReferenceTimelineCoverage;
  target?: string;
  timelineCoverage?: "keyframes" | "playback";
  timelinePlaybackCoverage?:
    | "all-playback-behavior"
    | readonly CreativeAppsKitTimelinePlaybackCoverage[];
  controlPartCoverage?:
    | "all-visible-parts"
    | readonly CreativeAppsKitControlPartCoverage[];
  userAction: string;
};

export type CreativeAppsKitVisibleControl = {
  control: CreativeAppsKitControlSchema;
  controlId: string;
  sectionTitle?: string;
};

export type CreativeAppsKitControlOrderItem = {
  controlId: string;
  rank: number;
  role: CreativeAppsKitControlOrderRole;
  sectionTitle?: string;
  target: string;
  type: string;
};

export const appTransferMode: CreativeAppsKitTransferMode = {
  animationIntent: { mode: "timeline-playback" },
  mode: "new-creative-apps-kit-app",
};

export const appProductReadiness: CreativeAppsKitProductReadiness = {
  mode: "product",
  productName: "Vesta Split-Flap",
  productSummary:
    "A full-canvas Vestaboard-style rectangular tile field with deterministic filler characters and a timeline-driven phrase transform.",
  requestedBehavior:
    "Users can set target tile size, tile gap down to -1px, cell radius, cell fill color, seeded cell fill opacity range, seeded bottom-border highlight opacity range, cell border color and opacity, source and target multiline phrases, separate permanent phrase and random field typography, random fill amount, filler opacity range, seed, output background, PNG background inclusion, video format, and video quality; computed cells fill the full canvas and stay unclipped, while playback timeline duration controls the Vestaboard-style phrase shortening animation.",
};

export const appAcceptance: readonly CreativeAppsKitComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName: "settings transfer exports and imports board settings",
    browser: true,
    browserTestName: "browser: settings transfer exports and imports board settings",
    componentType: "settingsTransfer",
    evidence: "command-side-effect",
    expectedObservable:
      "Export Settings downloads a Vestaboard settings JSON and Import Settings restores saved runtime values, canvas size, and timeline state without using custom route-local file inputs.",
    fixture: "edited vestaboard settings fixture",
    id: "runtime.settingsTransfer",
    kind: "control",
    target: "runtime.settingsTransfer",
    userAction: "Click Export Settings, change a board value, then click Import Settings and choose the saved JSON.",
  },
  {
    automated: true,
    automatedTestName: "canvas width changes vestaboard output bounds",
    browser: true,
    browserTestName: "browser: canvas width changes vestaboard output bounds",
    componentType: "text",
    evidence: "product-output",
    expectedObservable:
      "Changing Canvas width changes the editable output dimensions while the computed grid still fills the canvas.",
    fixture: "editable 1200 by 720 board fixture",
    id: "canvas.size.width",
    kind: "control",
    target: "canvas.size.width",
    userAction: "Edit Canvas width in the runtime canvas size controls.",
  },
  {
    automated: true,
    automatedTestName: "canvas height changes vestaboard output bounds",
    browser: true,
    browserTestName: "browser: canvas height changes vestaboard output bounds",
    componentType: "text",
    evidence: "product-output",
    expectedObservable:
      "Changing Canvas height changes the editable output dimensions while the computed grid still fills the canvas.",
    fixture: "editable 1200 by 720 board fixture",
    id: "canvas.size.height",
    kind: "control",
    target: "canvas.size.height",
    userAction: "Edit Canvas height in the runtime canvas size controls.",
  },
  {
    automated: true,
    automatedTestName: "tile width changes vestaboard cell geometry",
    browser: true,
    browserTestName: "browser: tile width changes vestaboard cell geometry",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Dragging Width changes computed cell width and recomputes the full-canvas column count.",
    fixture: "default board surface fixture",
    id: "board.tile.width",
    kind: "control",
    target: "board.tile.width",
    userAction: "Drag the Width slider.",
  },
  {
    automated: true,
    automatedTestName: "tile height changes vestaboard cell geometry",
    browser: true,
    browserTestName: "browser: tile height changes vestaboard cell geometry",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Dragging Height changes computed cell height and recomputes the full-canvas row count.",
    fixture: "default board surface fixture",
    id: "board.tile.height",
    kind: "control",
    target: "board.tile.height",
    userAction: "Drag the Height slider.",
  },
  {
    automated: true,
    automatedTestName: "tile gap changes vestaboard spacing",
    browser: true,
    browserTestName: "browser: tile gap changes vestaboard spacing",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Dragging Gap changes the distance between adjacent tile rectangles without clipping the board.",
    fixture: "default board surface fixture",
    id: "board.tile.gap",
    kind: "control",
    target: "board.tile.gap",
    userAction: "Drag the Gap slider.",
  },
  {
    automated: true,
    automatedTestName: "cell radius changes vestaboard cell rounding",
    browser: true,
    browserTestName: "browser: cell radius changes vestaboard cell rounding",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Dragging Radius changes computed cell border-radius without changing the full-canvas grid bounds.",
    fixture: "default full-canvas grid fixture",
    id: "board.cell.radius",
    kind: "control",
    target: "board.cell.radius",
    userAction: "Drag the Radius slider.",
  },
  {
    automated: true,
    automatedTestName: "cell fill color changes vestaboard cells",
    browser: true,
    browserTestName: "browser: cell fill color changes vestaboard cells",
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing Cell fill color changes every cell background hue while preserving the opacity distribution.",
    fixture: "visible cell fill fixture",
    id: "board.cell.fill",
    kind: "control",
    target: "board.cell.fill",
    userAction: "Edit Cell fill color.",
  },
  {
    automated: true,
    automatedTestName: "cell fill opacity range changes vestaboard cell backgrounds",
    browser: true,
    browserTestName: "browser: cell fill opacity range changes vestaboard cell backgrounds",
    componentType: "rangeSlider",
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing both Cell opacity thumbs constrains seeded cell background alpha values.",
    fixture: "cell fill opacity range fixture",
    id: "board.cell.fillOpacityRange",
    kind: "control",
    target: "board.cell.fillOpacityRange",
    userAction: "Drag both lower and upper Cell opacity range thumbs.",
  },
  {
    automated: true,
    automatedTestName: "cell fill seed changes deterministic cell background alpha",
    browser: true,
    browserTestName: "browser: cell fill seed changes deterministic cell background alpha",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing Cell seed regenerates deterministic cell background alpha without changing characters.",
    fixture: "two cell fill seed values fixture",
    id: "board.cell.fillSeed",
    kind: "control",
    target: "board.cell.fillSeed",
    userAction: "Drag the Cell seed slider.",
  },
  {
    automated: true,
    automatedTestName: "bottom opacity range changes cell lower-edge highlights",
    browser: true,
    browserTestName: "browser: bottom opacity range changes cell lower-edge highlights",
    componentType: "rangeSlider",
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing both Bottom opacity thumbs constrains seeded lower-edge highlight alpha values.",
    fixture: "bottom opacity range fixture",
    id: "board.cell.bottomHighlightOpacityRange",
    kind: "control",
    target: "board.cell.bottomHighlightOpacityRange",
    userAction: "Drag both lower and upper Bottom opacity range thumbs.",
  },
  {
    automated: true,
    automatedTestName: "bottom seed changes deterministic lower-edge highlight alpha",
    browser: true,
    browserTestName: "browser: bottom seed changes deterministic lower-edge highlight alpha",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing Bottom seed regenerates deterministic lower-edge highlight alpha without changing grid geometry.",
    fixture: "two bottom seed values fixture",
    id: "board.cell.bottomHighlightSeed",
    kind: "control",
    target: "board.cell.bottomHighlightSeed",
    userAction: "Drag the Bottom seed slider.",
  },
  {
    automated: true,
    automatedTestName: "bottom fill canvas changes highlighted border coverage",
    browser: true,
    browserTestName: "browser: bottom fill canvas changes highlighted border coverage",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Fill canvas changes how many overlay cells render bottom highlights without changing cell geometry.",
    fixture: "bottom fill canvas fixture",
    id: "board.cell.bottomHighlightFillCanvas",
    kind: "control",
    target: "board.cell.bottomHighlightFillCanvas",
    userAction: "Raise Bottom opacity, drag Fill canvas from full toward empty, and inspect fewer highlighted cells.",
  },
  {
    automated: true,
    automatedTestName: "cell border color opacity changes vestaboard cells",
    browser: true,
    browserTestName: "browser: cell border color opacity changes vestaboard cells",
    componentType: "colorOpacity",
    controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing Cell border hex and Cell border opacity changes every cell outline color and alpha.",
    fixture: "visible cell border fixture",
    id: "board.cell.border",
    kind: "control",
    target: "board.cell.border",
    userAction: "Edit Cell border hex and Cell border opacity.",
  },
  {
    automated: true,
    automatedTestName: "message textarea centers permanent phrase",
    browser: true,
    browserTestName: "browser: message textarea centers permanent phrase",
    componentType: "code",
    evidence: "product-output",
    expectedObservable:
      "Editing the multiline Message textarea places the permanent phrase in centered board rows and preserves explicit line breaks.",
    fixture: "HELLO newline VESTA message fixture",
    id: "board.text.message",
    kind: "control",
    target: "board.text.message",
    userAction: "Edit Message, blur the textarea, and inspect phrase cell positions.",
  },
  {
    automated: true,
    automatedTestName: "message textarea can stay empty",
    browser: true,
    browserTestName: "browser: message textarea can stay empty",
    componentType: "code",
    evidence: "product-output",
    expectedObservable:
      "Clearing the Message textarea leaves no permanent phrase cells and remains empty after blur and reset.",
    fixture: "empty message fixture",
    id: "board.text.message.empty",
    kind: "control",
    target: "board.text.message",
    userAction: "Clear Message, blur the textarea, and inspect phrase markers.",
  },
  {
    automated: true,
    automatedTestName: "target message drives phrase transform animation",
    browser: true,
    browserTestName: "browser: target message drives phrase transform animation",
    componentType: "code",
    evidence: "timeline-output",
    expectedObservable:
      "Editing Target message animates the source Message into the normalized target phrase, removes extra source characters, and leaves no repeated spaces at the final frame.",
    fixture: "source message with extra words and target message fixture",
    id: "board.text.targetMessage",
    kind: "control",
    target: "board.text.targetMessage",
    userAction:
      "Edit Message and Target message, scrub playback from start to end, and inspect the final phrase text.",
  },
  {
    automated: true,
    automatedTestName: "final hold settles phrase before background ends",
    browser: true,
    browserTestName: "browser: final hold settles phrase before background ends",
    componentType: "finalHoldSlider",
    evidence: "timeline-output",
    expectedObservable:
      "Dragging Final hold extends the runtime timeline, preserves the phrase transform duration, and stretches background field cells across the longer ending.",
    fixture: "final phrase hold with active background fixture",
    id: "board.text.finalHoldSeconds",
    kind: "control",
    target: "board.text.finalHoldSeconds",
    userAction:
      "Set Message, Target message, and a nonzero Final hold, confirm the playback range grows, scrub into the final hold window, and inspect stable final phrase text with non-final background cells.",
  },
  {
    automated: true,
    automatedTestName: "uppercase remaps message text before layout",
    browser: true,
    browserTestName: "browser: uppercase remaps message text before layout",
    componentType: "switch",
    evidence: "product-output",
    expectedObservable:
      "Enabling Uppercase renders lowercase Message input as uppercase board characters; disabling restores the typed case.",
    fixture: "lowercase message fixture",
    id: "board.text.uppercase",
    kind: "control",
    target: "board.text.uppercase",
    userAction:
      "Type a lowercase Message, toggle Uppercase, and inspect the rendered board characters.",
  },
  {
    automated: true,
    automatedTestName: "duration spread changes outgoing letter animation overlap",
    browser: true,
    browserTestName: "browser: duration spread changes outgoing letter animation overlap",
    componentType: "rangeSlider",
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
    evidence: "timeline-output",
    expectedObservable:
      "Changing Duration spread adjusts how long outgoing phrase characters flicker and therefore how many overlap; in Drum flip mode the control is disabled because spin timing is drum-distance based.",
    fixture: "parallel multiline phrase duration spread fixture",
    id: "board.text.letterDurationRange",
    kind: "control",
    target: "board.text.letterDurationRange",
    userAction:
      "Set multiline Message and Target message, drag Duration spread, scrub playback, and inspect intermediate and final phrase frames.",
  },
  {
    automated: true,
    automatedTestName: "letter speed changes outgoing letter launch density",
    browser: true,
    browserTestName: "browser: letter speed changes outgoing letter launch density",
    componentType: "slider",
    evidence: "timeline-output",
    expectedObservable:
      "Changing Letter speed adjusts launch spacing so more or fewer outgoing letters flicker at once.",
    fixture: "parallel multiline phrase letter speed fixture",
    id: "board.text.letterSpeed",
    kind: "control",
    target: "board.text.letterSpeed",
    userAction:
      "Set multiline Message and Target message, drag Letter speed, scrub playback, and inspect simultaneous outgoing letter flicker.",
  },
  {
    automated: true,
    automatedTestName: "outgoing opacity range changes removing phrase characters",
    browser: true,
    browserTestName: "browser: outgoing opacity range changes removing phrase characters",
    componentType: "rangeSlider",
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
    evidence: "timeline-output",
    expectedObservable:
      "Changing Outgoing opacity adjusts alpha only for phrase characters that are flipping before removal.",
    fixture: "removing phrase character opacity fixture",
    id: "board.text.outgoingOpacityRange",
    kind: "control",
    target: "board.text.outgoingOpacityRange",
    userAction:
      "Set Message and Target message, drag Outgoing opacity, scrub into a removal frame, and inspect the removing character alpha.",
  },
  {
    automated: true,
    automatedTestName: "flash color count toggles main text fill flashes",
    browser: true,
    browserTestName: "browser: flash color count toggles main text fill flashes",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "At Flash colors 0 animated phrase letters have no flash fill; raising Flash colors enables colored fills behind disappearing and kept target main text letters throughout playback.",
    fixture: "main text flash fixture",
    id: "board.text.flashColorCount",
    kind: "control",
    target: "board.text.flashColorCount",
    userAction:
      "Set Message, raise Flash frequency, scrub into the timeline, and drag Flash colors from 0 to an active palette count.",
  },
  {
    automated: true,
    automatedTestName: "flash frequency changes main text fill flash coverage",
    browser: true,
    browserTestName: "browser: flash frequency changes main text fill flash coverage",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Raising Flash frequency increases how many animated phrase letters show colored fill flashes throughout playback.",
    fixture: "main text flash fixture",
    id: "board.text.flashFrequency",
    kind: "control",
    target: "board.text.flashFrequency",
    userAction:
      "Set Message, enable a flash palette, scrub into the timeline, and drag Flash frequency from low to high.",
  },
  {
    automated: true,
    automatedTestName: "flash palette colors change main text fill colors",
    browser: true,
    browserTestName: "browser: flash palette colors change main text fill colors",
    componentType: "color",
    evidence: "product-output",
    expectedObservable:
      "Changing Flash 1 updates the colored fill shown behind animated phrase letters.",
    fixture: "main text flash palette fixture",
    id: "board.text.flashColor1",
    kind: "control",
    target: "board.text.flashColor1",
    userAction:
      "Enable one Flash color, raise Flash frequency, scrub into the timeline, and edit Flash 1.",
  },
  {
    automated: true,
    automatedTestName: "flash palette color 2 changes main text fill colors",
    browser: true,
    browserTestName: "browser: flash palette color 2 changes main text fill colors",
    componentType: "color",
    evidence: "product-output",
    expectedObservable:
      "Changing Flash 2 updates the second active palette slot used by animated phrase fill flashes.",
    fixture: "main text flash palette fixture",
    id: "board.text.flashColor2",
    kind: "control",
    target: "board.text.flashColor2",
    userAction: "Set Flash colors to at least 2 and edit Flash 2.",
  },
  {
    automated: true,
    automatedTestName: "flash palette color 3 changes main text fill colors",
    browser: true,
    browserTestName: "browser: flash palette color 3 changes main text fill colors",
    componentType: "color",
    evidence: "product-output",
    expectedObservable:
      "Changing Flash 3 updates the third active palette slot used by animated phrase fill flashes.",
    fixture: "main text flash palette fixture",
    id: "board.text.flashColor3",
    kind: "control",
    target: "board.text.flashColor3",
    userAction: "Set Flash colors to at least 3 and edit Flash 3.",
  },
  {
    automated: true,
    automatedTestName: "flash palette color 4 changes main text fill colors",
    browser: true,
    browserTestName: "browser: flash palette color 4 changes main text fill colors",
    componentType: "color",
    evidence: "product-output",
    expectedObservable:
      "Changing Flash 4 updates the fourth active palette slot used by animated phrase fill flashes.",
    fixture: "main text flash palette fixture",
    id: "board.text.flashColor4",
    kind: "control",
    target: "board.text.flashColor4",
    userAction: "Set Flash colors to 4 and edit Flash 4.",
  },
  {
    automated: true,
    automatedTestName: "flip mode switches drum and random engines",
    browser: true,
    browserTestName: "browser: flip mode switches drum and random engines",
    componentType: "segmented",
    evidence: "timeline-output",
    expectedObservable:
      "Drum mode steps animated cells forward-only through the fixed drum character sequence with distance-based finish times; Random keeps the legacy deterministic flicker.",
    fixture: "animated phrase flip mode fixture",
    id: "board.flip.mode",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "board.flip.mode",
    userAction:
      "Set Message and Target message, switch Flip mode between Drum and Random, scrub playback, and inspect mid-frame characters.",
  },
  {
    automated: true,
    automatedTestName: "wear inserts sticky pauses into drum spins",
    browser: true,
    browserTestName: "browser: wear inserts sticky pauses into drum spins",
    componentType: "slider",
    evidence: "timeline-output",
    expectedObservable:
      "Raising Wear in Drum mode gives a seeded share of spinning modules a mid-spin sticky pause while final frames stay exact.",
    fixture: "drum mode wear fixture",
    id: "board.flip.wear",
    kind: "control",
    target: "board.flip.wear",
    userAction:
      "Enable Drum mode, drag Wear, scrub playback, and compare mid-frame spin positions; in Random mode the slider is disabled.",
  },
  {
    automated: true,
    automatedTestName: "trail ghosts previous characters on flipping cells",
    browser: true,
    browserTestName: "browser: trail ghosts previous characters on flipping cells",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Raising Trail renders the previous character of each actively flipping cell as a ghost glyph; Trail 0 removes ghosts.",
    fixture: "animated trail fixture",
    id: "board.flip.trailOpacity",
    kind: "control",
    target: "board.flip.trailOpacity",
    userAction:
      "Start playback with changing cells, drag Trail, and inspect ghost glyph markers on flipping cells.",
  },
  {
    automated: true,
    automatedTestName: "vibration shakes the board during flips",
    browser: true,
    browserTestName: "browser: vibration shakes the board during flips",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Raising Vibration applies a deterministic sub-pixel offset while phrase modules flip and settles to zero when only background cells or no cells are flipping.",
    fixture: "animated phrase vibration fixture",
    id: "board.flip.shake",
    kind: "control",
    target: "board.flip.shake",
    userAction:
      "Start playback with a phrase transform, drag Vibration, and inspect the foreground layer offset markers during phrase flips and in the background-only tail.",
  },
  {
    automated: true,
    automatedTestName: "sound toggle arms flap click synthesis",
    browser: true,
    browserTestName: "browser: sound toggle arms flap click synthesis",
    componentType: "switch",
    evidence: "command-side-effect",
    expectedObservable:
      "Enabling Sound arms WebAudio flap click synthesis during playback and mixes an audio track into video export; disabling keeps the pipeline silent.",
    fixture: "sound switch fixture",
    id: "board.sound.enabled",
    kind: "control",
    target: "board.sound.enabled",
    userAction: "Toggle Sound and play the timeline with changing cells.",
  },
  {
    automated: true,
    automatedTestName: "sound volume changes flap click gain",
    browser: true,
    browserTestName: "browser: sound volume changes flap click gain",
    componentType: "slider",
    evidence: "command-side-effect",
    expectedObservable:
      "Volume changes the WebAudio master gain for flap clicks and stays disabled while Sound is off.",
    fixture: "sound volume fixture",
    id: "board.sound.volume",
    kind: "control",
    target: "board.sound.volume",
    userAction: "Enable Sound, drag Volume, and play the timeline.",
  },
  {
    automated: true,
    automatedTestName: "main font changes permanent phrase typography",
    browser: true,
    browserTestName: "browser: main font changes permanent phrase typography",
    componentType: "fontPicker",
    evidence: "product-output",
    expectedObservable:
      "Changing Main font updates permanent phrase characters without changing random field characters.",
    fixture: "typography fixture with permanent characters and filler characters",
    id: "board.text.messageTypography",
    kind: "control",
    target: "board.text.messageTypography",
    userAction:
      "Change Main font family, weight, font size, Letter spacing, and Line height in the font picker.",
  },
  {
    automated: true,
    automatedTestName: "background font changes random field typography",
    browser: true,
    browserTestName: "browser: background font changes random field typography",
    componentType: "fontPicker",
    evidence: "product-output",
    expectedObservable:
      "Changing Background font updates random field characters without changing permanent phrase characters.",
    fixture: "typography fixture with permanent characters and filler characters",
    id: "field.typography",
    kind: "control",
    target: "field.typography",
    userAction:
      "Change Background font family, weight, font size, Letter spacing, and Line height in the font picker.",
  },
  {
    automated: true,
    automatedTestName: "text color changes vestaboard characters",
    browser: true,
    browserTestName: "browser: text color changes vestaboard characters",
    componentType: "color",
    evidence: "product-output",
    expectedObservable:
      "Changing Text color updates all visible permanent and filler characters.",
    fixture: "visible text color fixture",
    id: "board.text.color",
    kind: "control",
    target: "board.text.color",
    userAction: "Edit the Text color input.",
  },
  {
    automated: true,
    automatedTestName: "start fill changes random field first-frame occupancy",
    browser: true,
    browserTestName: "browser: start fill changes random field first-frame occupancy",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "At timeline start, Start fill controls how many non-message cells contain deterministic filler characters while permanent phrase cells remain.",
    fixture: "seeded random field fixture",
    id: "field.fillStart",
    kind: "control",
    target: "field.fillStart",
    userAction: "Pause playback, scrub to the first frame, then drag the Start fill slider from low to high.",
  },
  {
    automated: true,
    automatedTestName: "end fill changes random field final-frame occupancy",
    browser: true,
    browserTestName: "browser: end fill changes random field final-frame occupancy",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "At timeline end, End fill controls how many non-message cells contain deterministic filler characters while permanent phrase cells remain.",
    fixture: "seeded random field fixture",
    id: "field.fillEnd",
    kind: "control",
    target: "field.fillEnd",
    userAction: "Pause playback, scrub to the last frame, then drag the End fill slider from low to high.",
  },
  {
    automated: true,
    automatedTestName: "field duration range changes background cell flicker timing",
    browser: true,
    browserTestName: "browser: field duration range changes background cell flicker timing",
    componentType: "rangeSlider",
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
    evidence: "product-output",
    expectedObservable:
      "Changing both Field duration thumbs changes how long changing background cells flicker while Start fill and End fill remain the occupancy endpoints; in Drum flip mode the control is disabled because spin timing is drum-distance based.",
    fixture: "seeded random field animation fixture",
    id: "field.durationRange",
    kind: "control",
    target: "field.durationRange",
    userAction:
      "Set Start fill below End fill, drag both Field duration thumbs, scrub the timeline mid-frame, and inspect active background flips.",
  },
  {
    automated: true,
    automatedTestName: "field speed changes background cell flicker rate",
    browser: true,
    browserTestName: "browser: field speed changes background cell flicker rate",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Changing Field speed changes the active background flicker character pattern without changing Start fill, End fill, or Field duration endpoints.",
    fixture: "seeded random field animation fixture",
    id: "field.speed",
    kind: "control",
    target: "field.speed",
    userAction:
      "Set Start fill below End fill, keep Field duration high, scrub to an active frame, and drag Field speed from low to high.",
  },
  {
    automated: true,
    automatedTestName: "opacity range changes random field alpha",
    browser: true,
    browserTestName: "browser: opacity range changes random field alpha",
    componentType: "rangeSlider",
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
    evidence: "product-output",
    expectedObservable:
      "Changing both Opacity thumbs constrains filler character opacity while permanent phrase characters remain fully opaque.",
    fixture: "seeded opacity distribution fixture",
    id: "field.opacityRange",
    kind: "control",
    target: "field.opacityRange",
    userAction: "Drag both lower and upper Opacity range thumbs.",
  },
  {
    automated: true,
    automatedTestName: "seed slider changes deterministic random field",
    browser: true,
    browserTestName: "browser: seed slider changes deterministic random field",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Changing Seed regenerates filler locations, characters, and opacities without moving the permanent phrase.",
    fixture: "two seed values fixture",
    id: "field.seed",
    kind: "control",
    target: "field.seed",
    userAction: "Drag the Seed slider.",
  },
  {
    automated: true,
    automatedTestName: "video format chooses supported export container",
    browser: true,
    browserTestName: "browser: video format chooses supported export container",
    componentType: "select",
    evidence: "command-side-effect",
    expectedObservable:
      "Choosing Auto, WebM, and MP4 changes the video export format setting while unsupported containers fall back through MediaRecorder support checks.",
    fixture: "video format options fixture",
    id: "export.video.format",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "export.video.format",
    userAction: "Choose every visible Format option in the Video Export section.",
  },
  {
    automated: true,
    automatedTestName: "video quality changes export scale target",
    browser: true,
    browserTestName: "browser: video quality changes export scale target",
    componentType: "select",
    evidence: "command-side-effect",
    expectedObservable:
      "Choosing High and 4K changes the video export quality setting used by retina video dimensions and bitrate.",
    fixture: "video quality options fixture",
    id: "export.video.quality",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "export.video.quality",
    userAction: "Choose every visible Quality option in the Video Export section.",
  },
  {
    automated: true,
    automatedTestName: "background color changes vestaboard preview and export",
    browser: true,
    browserTestName: "browser: background color changes vestaboard preview and export",
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing Background color updates the live preview backing and the included PNG background pixels.",
    fixture: "background color fixture",
    id: "appearance.background",
    kind: "control",
    target: "appearance.background",
    userAction: "Edit the Background color input.",
  },
  {
    automated: true,
    automatedTestName: "include background controls png alpha only",
    browser: true,
    browserTestName: "browser: include background controls png alpha only",
    componentType: "switch",
    evidence: "exported-bytes",
    expectedObservable:
      "Turning Background off makes PNG output transparent in alpha pixels while live preview and workspace canvas backing keep the product background color.",
    fixture: "transparent PNG export fixture",
    id: "export.includeBackground",
    kind: "control",
    target: "export.includeBackground",
    userAction: "Toggle the Background switch and export PNG.",
  },
  {
    actionCoverage: ["export-video", "export-png"],
    automated: true,
    automatedTestName: "export actions download video and png vestaboard output",
    browser: true,
    browserTestName: "browser: export actions download video and png vestaboard output",
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Export Video records the full runtime timeline duration with retina dimensions and Export PNG renders the selected timeline frame with retina pixel dimensions.",
    fixture: "timeline export fixture",
    id: "panel.actions",
    kind: "control",
    target: "panel.actions",
    userAction: "Edit timeline duration, click Export Video, then scrub to a frame and click Export PNG.",
  },
  {
    automated: true,
    automatedTestName: "timeline playback controls phrase transform animation",
    browser: true,
    browserTestName: "browser: timeline playback controls phrase transform animation",
    componentType: "timeline",
    evidence: "timeline-output",
    expectedObservable:
      "Runtime playback controls pause and resume the phrase transform, scrubbing changes the rendered frame, loop toggles playback state, and editing timeline duration changes the playback range used by the renderer.",
    fixture: "timeline phrase transform fixture",
    id: "timeline.playback",
    kind: "runtime",
    target: "timeline.playback",
    timelineCoverage: "playback",
    timelinePlaybackCoverage: [
      "pause-resume",
      "scrub",
      "duration",
      "loop",
      "rendered-frame",
    ],
    userAction:
      "Edit timeline duration through the UI, scrub from 0 to the edited duration, toggle loop, pause playback, and resume playback.",
  },
  {
    automated: true,
    automatedTestName: "vestaboard renderer exposes product output only",
    browser: true,
    browserTestName: "browser: vestaboard renderer exposes product output only",
    componentType: "canvasContent",
    evidence: "product-output",
    expectedObservable:
      "The canvas contains only the full-height board product output, with no PNG header image, app UI controls, or helper copy.",
    fixture: "default renderer fixture",
    id: "vestaboard.output",
    kind: "runtime",
    target: "vestaboard.output",
    userAction: "Open the app and inspect canvas content.",
  },
  {
    automated: true,
    automatedTestName: "toolbar viewport keeps vestaboard centered",
    browser: true,
    browserTestName: "browser: toolbar viewport keeps vestaboard centered",
    componentType: "toolbar",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Zooming and centering through the runtime toolbar changes viewport state without changing board output or clipping cells.",
    fixture: "viewport toolbar fixture",
    id: "toolbar.viewport",
    kind: "runtime",
    target: "toolbar.viewport",
    userAction: "Use Zoom in, Zoom out, and Center canvas toolbar actions.",
  },
];

function getActionValue(action: CreativeAppsKitActionSchema | string): string {
  return typeof action === "string" ? action : action.value;
}

function getActionSearchText(action: CreativeAppsKitActionSchema | string): string {
  return typeof action === "string" ? action : `${action.label} ${action.value} ${action.command ?? ""}`;
}

function isCanvasSizeTarget(target: string): boolean {
  return target === "canvas.size.width" || target === "canvas.size.height";
}

function isResetPanelAction(action: CreativeAppsKitActionSchema | string): boolean {
  return /\breset\b/i.test(getActionSearchText(action));
}

function getControlOptionValues(control: CreativeAppsKitControlSchema): readonly string[] {
  if (control.type === "imagePicker") {
    return control.items?.map((item) => item.value) ?? [];
  }

  return control.options?.map((option) => option.value) ?? [];
}

function hasCoverageForValues(
  coverage: CreativeAppsKitComponentAcceptance["actionCoverage"] | CreativeAppsKitComponentAcceptance["optionCoverage"],
  values: readonly string[],
): boolean {
  if (values.length === 0) {
    return true;
  }

  if (coverage === "each-visible-item") {
    return true;
  }

  if (!Array.isArray(coverage)) {
    return false;
  }

  return values.every((value) => coverage.includes(value));
}

function hasControlPartCoverage(
  coverage: CreativeAppsKitComponentAcceptance["controlPartCoverage"],
  requiredParts: readonly CreativeAppsKitControlPartCoverage[],
): boolean {
  if (requiredParts.length === 0) {
    return true;
  }

  if (coverage === "all-visible-parts") {
    return true;
  }

  if (!Array.isArray(coverage)) {
    return false;
  }

  return requiredParts.every((part) => coverage.includes(part));
}

function hasTimelinePlaybackCoverage(
  coverage: CreativeAppsKitComponentAcceptance["timelinePlaybackCoverage"],
  requiredParts: readonly CreativeAppsKitTimelinePlaybackCoverage[],
): boolean {
  if (coverage === "all-playback-behavior") {
    return true;
  }

  if (!Array.isArray(coverage)) {
    return false;
  }

  return requiredParts.every((part) => coverage.includes(part));
}

function hasTimelinePlaybackCoveragePart(
  coverage: CreativeAppsKitComponentAcceptance["timelinePlaybackCoverage"],
  part: CreativeAppsKitTimelinePlaybackCoverage,
): boolean {
  return coverage === "all-playback-behavior" || (Array.isArray(coverage) && coverage.includes(part));
}

function getAcceptanceEvidenceText(entry: CreativeAppsKitComponentAcceptance): string {
  return [
    entry.automatedTestName,
    entry.browserTestName,
    entry.expectedObservable,
    entry.fixture,
    entry.userAction,
  ].join(" ");
}

export function getRequiredCreativeAppsKitControlPartCoverage(
  control: CreativeAppsKitControlSchema,
): readonly CreativeAppsKitControlPartCoverage[] {
  switch (control.type) {
    case "anchorGrid":
      return ["anchorGrid.position"];
    case "channelMixer":
      return ["channelMixer.activeChannel", "channelMixer.values"];
    case "colorOpacity":
      return ["colorOpacity.hex", "colorOpacity.opacity"];
    case "curves":
      return ["curves.activeChannel", "curves.points"];
    case "gradient":
      return [
        "gradient.gradientType",
        "gradient.angle",
        "gradient.stops.position",
        "gradient.stops.color",
        "gradient.stops.opacity",
      ];
    case "palette":
      return ["palette.family", "palette.shade"];
    case "rangeInput":
      return ["rangeInput.start", "rangeInput.end"];
    case "rangeSlider":
      return ["rangeSlider.lower", "rangeSlider.upper"];
    case "vector":
      return ["vector.x", "vector.y"];
    default:
      return [];
  }
}

function isSliderLikeControl(control: CreativeAppsKitControlSchema): boolean {
  return control.type === "slider" || control.type === "rangeSlider";
}

const SMALL_SEMANTIC_DISCRETE_POSITION_LIMIT = 13;
const MAX_VISUAL_DISCRETE_POSITION_COUNT = 32;
const SEMANTIC_DISCRETE_SLIDER_RE =
  /\b(anchor|band|bands|cell|cells|col|cols|column|columns|count|gap|grid|jitter|level|levels|octave|octaves|pass|passes|point|points|row|rows|segment|segments|step|steps|tile|tiles)\b/i;
const FINITE_ANIMATION_STEP_SLIDER_RE =
  /\b(char|chars|character|characters|flip|flips|glyph|glyphs|frame|frames|letter|letters)\b/i;
const FINITE_ANIMATION_STEP_VALUE_RE = /\b(count|depth|step|steps)\b/i;
const SEMANTIC_CONTINUOUS_SLIDER_RE =
  /\b(duration|fps|frame rate|frames per second|rate|speed|time|seconds?|ms|milliseconds?|hz|cols\/s|ch\/s)\b/i;

function getStepPositionCount(control: CreativeAppsKitControlSchema): number | undefined {
  if (
    typeof control.step !== "number" ||
    typeof control.min !== "number" ||
    typeof control.max !== "number" ||
    !Number.isFinite(control.step) ||
    !Number.isFinite(control.min) ||
    !Number.isFinite(control.max) ||
    control.step <= 0 ||
    control.max <= control.min
  ) {
    return undefined;
  }

  const rawStepCount = (control.max - control.min) / control.step;
  const roundedStepCount = Math.round(rawStepCount);
  const intervalCount =
    Math.abs(rawStepCount - roundedStepCount) < Number.EPSILON * 100
      ? roundedStepCount
      : Math.floor(rawStepCount) + 1;

  return Math.max(2, intervalCount + 1);
}

function getStepMarkerCount(control: CreativeAppsKitControlSchema): number | undefined {
  return getStepPositionCount(control);
}

function isIntegerStepDomain(control: CreativeAppsKitControlSchema): boolean {
  return (
    typeof control.min === "number" &&
    typeof control.max === "number" &&
    typeof control.step === "number" &&
    Number.isInteger(control.min) &&
    Number.isInteger(control.max) &&
    Number.isInteger(control.step)
  );
}

function getSliderSemanticText(
  controlId: string,
  control: CreativeAppsKitControlSchema,
): string {
  return [
    controlId,
    control.target,
    getControlLabelText(control),
    typeof control.unit === "string" ? control.unit : "",
  ].join(" ");
}

function shouldUseVisualDiscreteSlider(
  controlId: string,
  control: CreativeAppsKitControlSchema,
): boolean {
  const positionCount = getStepPositionCount(control);

  if (!positionCount || !isIntegerStepDomain(control)) {
    return false;
  }

  const semanticText = getSliderSemanticText(controlId, control);

  if (SEMANTIC_CONTINUOUS_SLIDER_RE.test(semanticText)) {
    return false;
  }

  const hasFiniteAnimationStepSemantics =
    FINITE_ANIMATION_STEP_SLIDER_RE.test(semanticText) &&
    FINITE_ANIMATION_STEP_VALUE_RE.test(semanticText);

  if (hasFiniteAnimationStepSemantics) {
    return positionCount <= MAX_VISUAL_DISCRETE_POSITION_COUNT;
  }

  if (positionCount > SMALL_SEMANTIC_DISCRETE_POSITION_LIMIT) {
    return false;
  }

  return SEMANTIC_DISCRETE_SLIDER_RE.test(semanticText);
}

function getSliderVariantClassificationErrors({
  control,
  controlId,
  label,
}: {
  control: CreativeAppsKitControlSchema;
  controlId: string;
  label: string;
}): string[] {
  const errors: string[] = [];
  const positionCount = getStepPositionCount(control);

  if (!positionCount) {
    return errors;
  }

  if (
    shouldUseVisualDiscreteSlider(controlId, control) &&
    control.variant !== "discrete"
  ) {
    errors.push(
      `${label} has ${positionCount} semantic integer positions and must use variant "discrete" so Creative Apps Kit renders tick markers.`,
    );
  }

  if (
    control.variant === "discrete" &&
    positionCount > MAX_VISUAL_DISCRETE_POSITION_COUNT
  ) {
    errors.push(
      `${label} declares variant "discrete" with ${positionCount} positions, which would overload tick markers. Keep it stepped continuous or use a different control.`,
    );
  }

  return errors;
}

function getControlLabelText(control: CreativeAppsKitControlSchema): string {
  return typeof control.label === "string" ? control.label : "";
}

function getToggleControlLabelError(control: CreativeAppsKitControlSchema): string | undefined {
  if (control.type !== "switch" && control.type !== "checkbox") {
    return undefined;
  }

  const label = getControlLabelText(control).trim();

  if (!/^(enable|disable)\b/i.test(label)) {
    return undefined;
  }

  return `toggle labels must name the setting context only; use "CRT", "Background", "Glow", or "Loop" instead of "${label}".`;
}

function getControlActions(
  control: CreativeAppsKitControlSchema,
): readonly (CreativeAppsKitActionSchema | string)[] {
  const maybeControlWithActions = control as {
    actions?: readonly (CreativeAppsKitActionSchema | string)[];
  };

  return Array.isArray(maybeControlWithActions.actions)
    ? maybeControlWithActions.actions
    : [];
}

function getTimelineTransportControlText(
  controlId: string,
  control: CreativeAppsKitControlSchema,
): string {
  return [
    controlId,
    control.target,
    getControlLabelText(control),
    ...getControlActions(control).map(getActionSearchText),
  ].join(" ");
}

function getAnimationIntentControlText({
  control,
  controlId,
  sectionTitle,
}: CreativeAppsKitVisibleControl): string {
  return [
    sectionTitle ?? "",
    controlId,
    control.target,
    getControlLabelText(control),
  ].join(" ");
}

function getSearchableControlText({
  control,
  controlId,
  sectionTitle,
}: CreativeAppsKitVisibleControl): string {
  return [
    sectionTitle ?? "",
    controlId,
    control.target,
    getControlLabelText(control),
  ]
    .join(" ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

function actionLooksLikePngExport(action: CreativeAppsKitActionSchema | string): boolean {
  const text = getActionSearchText(action).replace(/([a-z])([A-Z])/g, "$1 $2");

  return (
    (/\b(export|download)\b/i.test(text) && /\b(png|image)\b/i.test(text)) ||
    /\bexport\.png\b/i.test(text)
  );
}

function schemaHasPngExportPanelAction(schema: ResolvedCreativeAppsKitAppSchema): boolean {
  return (schema.panels.controls?.sections ?? []).some((section) =>
    Object.values(section.controls).some(
      (control) =>
        control.type === "panelActions" &&
        getControlActions(control).some(actionLooksLikePngExport),
    ),
  );
}

function schemaHasOutputBackgroundColorControl(
  controls: readonly CreativeAppsKitVisibleControl[],
): boolean {
  return controls.some((visibleControl) => {
    const { control } = visibleControl;

    if (control.type !== "color") {
      return false;
    }

    return /\b(background|backdrop|scene|canvas)\b/i.test(
      getSearchableControlText(visibleControl),
    );
  });
}

function schemaHasOutputBackgroundToggleControl(
  controls: readonly CreativeAppsKitVisibleControl[],
): boolean {
  return controls.some(isOutputBackgroundToggleControl);
}

function isOutputBackgroundToggleControl(visibleControl: CreativeAppsKitVisibleControl): boolean {
  const { control } = visibleControl;

  if (
    control.type !== "switch" &&
    control.type !== "checkbox" &&
    control.type !== "select" &&
    control.type !== "segmented"
  ) {
    return false;
  }

  return /\b(background|backdrop|transparent|transparency|alpha)\b/i.test(
    getSearchableControlText(visibleControl),
  );
}

const SEGMENTED_CONTROL_MAX_OPTIONS = 4;
const SEGMENTED_CONTROL_MAX_OPTION_LABEL_LENGTH = 9;
const SEGMENTED_CONTROL_MAX_TOTAL_LABEL_LENGTH = 24;

function getSegmentedControlLayoutError(
  control: CreativeAppsKitControlSchema,
): string | null {
  if (control.type !== "segmented") {
    return null;
  }

  const labels = control.options?.map((option) => option.label.trim()) ?? [];
  const totalLabelLength = labels.reduce((total, label) => total + label.length, 0);
  const longLabels = labels.filter(
    (label) => label.length > SEGMENTED_CONTROL_MAX_OPTION_LABEL_LENGTH,
  );

  if (
    labels.length > SEGMENTED_CONTROL_MAX_OPTIONS ||
    longLabels.length > 0 ||
    totalLabelLength > SEGMENTED_CONTROL_MAX_TOTAL_LABEL_LENGTH
  ) {
    return [
      `segmented controls must preserve cell padding: use at most ${SEGMENTED_CONTROL_MAX_OPTIONS} short options`,
      `(max ${SEGMENTED_CONTROL_MAX_OPTION_LABEL_LENGTH} characters per label and ${SEGMENTED_CONTROL_MAX_TOTAL_LABEL_LENGTH} total)`,
      "or shorten labels first; if the compact names still exceed the budget, use a select dropdown instead.",
    ].join(" ");
  }

  return null;
}

const controlOrderRoleRanks = {
  input: 0,
  mode: 1,
  primary: 2,
  spatial: 2,
  color: 2,
  strength: 3,
  detail: 4,
  advanced: 5,
  action: 6,
} satisfies Record<CreativeAppsKitControlOrderRole, number>;

const requiredReferenceCloneCoverage = [
  "canvas-sizing",
  "control-mapping",
  "renderer-state",
] satisfies readonly CreativeAppsKitReferenceCoverage[];

const referenceTransportCoverage = new Set<CreativeAppsKitReferenceCoverage>([
  "export-at-time",
  "pause-resume",
  "restart",
  "time-progress",
]);

const creativeAppsKitReferenceTimelineCoverage = new Set<CreativeAppsKitReferenceTimelineCoverage>([
  "duration",
  "export-at-time",
  "keyframes",
  "loop",
  "playback",
  "restart",
  "scrub",
  "time-progress",
]);

const customReferenceTimelineCoverage = new Set<CreativeAppsKitReferenceTimelineCoverage>([
  "all-range",
  "export-range",
  "jump-to-trim-start",
  "range-playback",
  "state-jump",
  "trim-range",
]);

const timelineTransportControlPattern =
  /\b(play|pause|paused|resume|animate|restart)\b/i;

const animationIntentControlPattern =
  /\b(animation|animate|motion|playback)\b/i;

const requiredAutonomousAnimationCoverage = [
  "no-user-facing-transport",
  "no-play-pause",
  "no-scrub",
  "no-duration-control",
  "no-loop-control",
  "no-export-at-time",
] satisfies readonly CreativeAppsKitAutonomousAnimationCoverage[];

const requiredLayerCoverage = [
  "selection",
  "visibility",
  "reorder",
  "grouping",
] satisfies readonly CreativeAppsKitLayerCoverage[];

const requiredTimelinePlaybackCoverage = [
  "pause-resume",
  "scrub",
  "duration",
  "loop",
  "rendered-frame",
] satisfies readonly CreativeAppsKitTimelinePlaybackCoverage[];

function isModeSelectorControl(
  controlId: string,
  control: CreativeAppsKitControlSchema,
): boolean {
  if (control.type !== "select" && control.type !== "segmented") {
    return false;
  }

  return /mode|type|filter|blend|style|preset|variant/i.test(
    `${controlId} ${control.target} ${getControlLabelText(control)}`,
  );
}

function matchesControlMeaning(
  controlId: string,
  control: CreativeAppsKitControlSchema,
  pattern: RegExp,
): boolean {
  return pattern.test(`${controlId} ${control.target} ${getControlLabelText(control)}`);
}

export function inferCreativeAppsKitControlOrderRole(
  controlId: string,
  control: CreativeAppsKitControlSchema,
): CreativeAppsKitControlOrderRole {
  if (control.orderRole) {
    return control.orderRole;
  }

  if (control.type === "panelActions") {
    return "action";
  }

  if (
    control.type === "fileDrop" ||
    control.target.startsWith("media.") ||
    control.target === "canvas.size.width" ||
    control.target === "canvas.size.height"
  ) {
    return "input";
  }

  if (isModeSelectorControl(controlId, control)) {
    return "mode";
  }

  if (control.type === "vector") {
    return "spatial";
  }

  if (control.type === "color" || control.type === "gradient") {
    return "color";
  }

  if (
    matchesControlMeaning(
      controlId,
      control,
      /grain|noise|texture|detail|blur|threshold|sample|quality|density|iteration|radius/i,
    )
  ) {
    return "detail";
  }

  if (
    isSliderLikeControl(control) ||
    matchesControlMeaning(
      controlId,
      control,
      /amount|brightness|contrast|depth|highlight|intensity|mix|opacity|saturation|scale|spread|strength/i,
    )
  ) {
    return "strength";
  }

  return "primary";
}

function getCreativeAppsKitControlOrderErrors(schema: ResolvedCreativeAppsKitAppSchema): string[] {
  const errors: string[] = [];

  for (const section of schema.panels.controls?.sections ?? []) {
    let previousItem: CreativeAppsKitControlOrderItem | undefined;

    for (const [controlId, control] of Object.entries(section.controls)) {
      if (control.type === "panelActions") {
        continue;
      }

      const role = inferCreativeAppsKitControlOrderRole(controlId, control);
      const item: CreativeAppsKitControlOrderItem = {
        controlId,
        rank: controlOrderRoleRanks[role],
        role,
        sectionTitle: section.title,
        target: control.target,
        type: control.type,
      };

      if (previousItem && item.rank < previousItem.rank) {
        const sectionLabel = section.title ? `${section.title} / ` : "";

        errors.push(
          `${sectionLabel}${controlId} (${control.target}) has orderRole "${role}" after ${previousItem.controlId} (${previousItem.target}) with orderRole "${previousItem.role}". Move mode/input/primary controls before dependent strength/detail/advanced controls or split them into an earlier section.`,
        );
      }

      previousItem = item;
    }
  }

  return errors;
}

const genericControlSectionTitlePattern =
  /^(controls?|settings?|parameters?|options?|configuration|config|adjustments?)$/i;

const controlTypeSectionTitlePattern =
  /^(sliders?|colors?|colours?|inputs?|selects?|switches?|checkboxes?|toggles?|buttons?|actions?)$/i;

function getCreativeAppsKitSectionLabel(sectionTitle: string | undefined, sectionIndex: number): string {
  return sectionTitle?.trim() || `untitled section ${sectionIndex + 1}`;
}

function getCreativeAppsKitStrictTargetPrefix(target: string): string | null {
  const parts = target.split(".").filter(Boolean);

  if (parts.length < 3) {
    return null;
  }

  const prefix = parts.slice(0, -1).join(".");

  if (prefix === "canvas.size") {
    return null;
  }

  return prefix;
}

function getCreativeAppsKitLooseTargetPrefix(target: string): string | null {
  const parts = target.split(".").filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const prefix = parts.slice(0, -1).join(".");

  if (prefix === "canvas.size") {
    return null;
  }

  return prefix;
}

function getCreativeAppsKitControlSectionGroupingErrors(
  schema: ResolvedCreativeAppsKitAppSchema,
): string[] {
  const errors: string[] = [];
  const strictPrefixSections = new Map<string, Set<string>>();
  const loosePrefixSections = new Map<string, Set<string>>();
  const colorSectionLoosePrefixes = new Map<string, string>();

  for (const [sectionIndex, section] of (schema.panels.controls?.sections ?? []).entries()) {
    const sectionTitle = section.title?.trim();
    const sectionLabel = getCreativeAppsKitSectionLabel(sectionTitle, sectionIndex);
    const controls = Object.entries(section.controls).filter(
      ([, control]) => control.type !== "panelActions",
    );
    const isSettingsTransferSection =
      controls.length === 1 && controls[0]?.[1]?.type === "settingsTransfer";

    if (controls.length === 0) {
      continue;
    }

    if (
      !isSettingsTransferSection &&
      sectionTitle &&
      genericControlSectionTitlePattern.test(sectionTitle)
    ) {
      errors.push(
        `${sectionLabel} is too generic for a controls section. Name the product entity, workflow stage, or behavior it edits instead of using a bucket title.`,
      );
    }

    if (
      !isSettingsTransferSection &&
      sectionTitle &&
      controlTypeSectionTitlePattern.test(sectionTitle)
    ) {
      errors.push(
        `${sectionLabel} names a UI control type instead of the product entity. Group controls by product meaning, not by Slider, Color, Input, Button, or similar component type.`,
      );
    }

    for (const [controlId, control] of controls) {
      const strictPrefix = getCreativeAppsKitStrictTargetPrefix(control.target);
      const loosePrefix = getCreativeAppsKitLooseTargetPrefix(control.target);

      if (strictPrefix) {
        const sections = strictPrefixSections.get(strictPrefix) ?? new Set<string>();
        sections.add(sectionLabel);
        strictPrefixSections.set(strictPrefix, sections);
      }

      if (loosePrefix) {
        const sections = loosePrefixSections.get(loosePrefix) ?? new Set<string>();
        sections.add(sectionLabel);
        loosePrefixSections.set(loosePrefix, sections);
      }

      if (
        control.type === "color" &&
        sectionTitle &&
        /^colors?$/i.test(sectionTitle) &&
        loosePrefix
      ) {
        colorSectionLoosePrefixes.set(loosePrefix, `${sectionLabel} / ${controlId}`);
      }
    }
  }

  for (const [prefix, sections] of strictPrefixSections) {
    if (sections.size > 1) {
      errors.push(
        `Controls for product entity "${prefix}" are split across sections: ${[...sections].join(", ")}. Keep controls for the same product entity in one semantic section unless the spec names a real workflow split.`,
      );
    }
  }

  for (const [prefix, colorControlLabel] of colorSectionLoosePrefixes) {
    const sections = loosePrefixSections.get(prefix);

    if (sections && sections.size > 1) {
      errors.push(
        `${colorControlLabel} is separated from other "${prefix}" controls. A color that configures the same product entity belongs inside that entity section with a field label such as Color, Fill, Stroke, or Accent.`,
      );
    }
  }

  return errors;
}

export function collectCreativeAppsKitVisibleControls(
  schema: ResolvedCreativeAppsKitAppSchema = appSchema,
): CreativeAppsKitVisibleControl[] {
  return (schema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.entries(section.controls).map(([controlId, control]) => ({
      control,
      controlId,
      sectionTitle: section.title,
    })),
  );
}

export function collectCreativeAppsKitKeyframeableControls(
  schema: ResolvedCreativeAppsKitAppSchema = appSchema,
): CreativeAppsKitVisibleControl[] {
  return collectCreativeAppsKitVisibleControls(schema).filter(
    ({ control }) => getCreativeAppsKitControlKeyframeCapability(control).capable,
  );
}

export function getCreativeAppsKitControlOrder(
  schema: ResolvedCreativeAppsKitAppSchema = appSchema,
): CreativeAppsKitControlOrderItem[] {
  return (schema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.entries(section.controls)
      .filter(([, control]) => control.type !== "panelActions")
      .map(([controlId, control]) => {
        const role = inferCreativeAppsKitControlOrderRole(controlId, control);

        return {
          controlId,
          rank: controlOrderRoleRanks[role],
          role,
          sectionTitle: section.title,
          target: control.target,
          type: control.type,
        };
      }),
  );
}

export function getCreativeAppsKitControlOrderTargets(
  schema: ResolvedCreativeAppsKitAppSchema = appSchema,
): string[] {
  return getCreativeAppsKitControlOrder(schema).map((item) => item.target);
}

export function validateCreativeAppsKitAcceptanceCoverage(
  schema: ResolvedCreativeAppsKitAppSchema = appSchema,
  acceptance: readonly CreativeAppsKitComponentAcceptance[] = appAcceptance,
  transferMode: CreativeAppsKitTransferMode = appTransferMode,
): string[] {
  const errors: string[] = [];
  const controls = collectCreativeAppsKitVisibleControls(schema);
  const controlAcceptance = new Map(
    acceptance
      .filter((entry) => entry.kind === "control")
      .map((entry) => [entry.target, entry]),
  );
  const timelineMode = schema.panels.timeline?.enabled ? schema.panels.timeline.mode : null;
  const layersEnabled = Boolean(schema.panels.layers);
  const controlTargets = new Set(controls.map(({ control }) => control.target));
  const animationIntent = transferMode.animationIntent;
  const animationControls = controls.filter(
    (visibleControl) =>
      visibleControl.control.type !== "panelActions" &&
      animationIntentControlPattern.test(getAnimationIntentControlText(visibleControl)),
  );
  const commandTargets = new Set([
    "canvas.center",
    "canvas.setOffset",
    "canvas.setSize",
    "canvas.setViewport",
    "canvas.zoomIn",
    "canvas.zoomOut",
    "controls.setValue",
    "history.redo",
    "history.undo",
  ]);

  errors.push(...getCreativeAppsKitControlOrderErrors(schema));
  errors.push(...getCreativeAppsKitControlSectionGroupingErrors(schema));

  if (schemaHasPngExportPanelAction(schema)) {
    if (!schemaHasOutputBackgroundColorControl(controls)) {
      errors.push(
        "Product apps with Export PNG must expose a user-facing background color control such as appearance.background or scene.background. Preview, PNG export, and video export must read that runtime value instead of hardcoding the product background.",
      );
    }

    if (!schemaHasOutputBackgroundToggleControl(controls)) {
      errors.push(
        "Product apps with Export PNG must expose a user-facing Include background / Transparent background control such as export.includeBackground. PNG export must pass that runtime value to createCreativeAppsKitPngExportCanvas includeBackground; video export keeps the background.",
      );
    }
  }

  if (animationControls.length > 0 && !timelineMode && animationIntent?.mode !== "autonomous") {
    errors.push(
      [
        `Animation controls ${animationControls.map(({ control, controlId, sectionTitle }) => `"${sectionTitle ? `${sectionTitle} / ` : ""}${controlId}" (${control.target})`).join(", ")} exist while panels.timeline is omitted.`,
        'Use panels.timeline mode "playback" for product animation transport, mode "keyframes" for editable keyframes, or declare appTransferMode.animationIntent mode "autonomous" with coverage proving there is no user-facing transport.',
      ].join(" "),
    );
  }

  if (animationIntent?.mode === "autonomous") {
    const declaredAutonomousCoverage = new Set(animationIntent.behaviorCoverage);
    const missingAutonomousCoverage = requiredAutonomousAnimationCoverage.filter(
      (coverage) => !declaredAutonomousCoverage.has(coverage),
    );

    if (timelineMode) {
      errors.push(
        `appTransferMode.animationIntent mode "autonomous" conflicts with panels.timeline mode "${timelineMode}". Use timeline-playback, timeline-keyframes, or remove the timeline.`,
      );
    }

    if (!animationIntent.reason.trim()) {
      errors.push(
        'appTransferMode.animationIntent mode "autonomous" must include a reason explaining why the animation is decorative/self-running and does not need top timeline transport.',
      );
    }

    if (missingAutonomousCoverage.length > 0) {
      errors.push(
        `appTransferMode.animationIntent mode "autonomous" must include behaviorCoverage ${missingAutonomousCoverage.map((coverage) => `"${coverage}"`).join(", ")}.`,
      );
    }
  }

  if (animationIntent?.mode === "timeline-playback" && timelineMode !== "playback") {
    errors.push(
      'appTransferMode.animationIntent mode "timeline-playback" requires panels.timeline mode "playback".',
    );
  }

  if (animationIntent?.mode === "timeline-keyframes" && timelineMode !== "keyframes") {
    errors.push(
      'appTransferMode.animationIntent mode "timeline-keyframes" requires panels.timeline mode "keyframes".',
    );
  }

  if (transferMode.mode === "reference-runtime-clone") {
    const declaredReferenceCoverage = new Set(transferMode.behaviorCoverage);
    const referenceTimeline = transferMode.referenceTimeline;

    if (!schema.assembly.surfaces.canvas.enabled) {
      errors.push(
        "reference-runtime-clone must keep the Creative Apps Kit canvas shell enabled; preserve the reference renderer inside CreativeAppsKitApp canvasContent instead of replacing the app with the original UI.",
      );
    }

    if (!transferMode.referenceName.trim()) {
      errors.push(
        "reference-runtime-clone transferMode must name the reference app or artifact.",
      );
    }

    if (transferMode.sourceOfTruth !== "reference-runtime") {
      errors.push(
        'reference-runtime-clone transferMode must set sourceOfTruth to "reference-runtime".',
      );
    }

    for (const coverage of requiredReferenceCloneCoverage) {
      if (!declaredReferenceCoverage.has(coverage)) {
        errors.push(
          `reference-runtime-clone transferMode must include behaviorCoverage "${coverage}".`,
        );
      }
    }

    for (const coverage of declaredReferenceCoverage) {
      const entry = acceptance.find(
        (acceptanceEntry) => acceptanceEntry.referenceCoverage === coverage,
      );

      if (!entry) {
        errors.push(
          `reference-runtime-clone behaviorCoverage "${coverage}" is missing an acceptance entry with referenceCoverage "${coverage}".`,
        );
        continue;
      }

      if (!entry.automated || !entry.automatedTestName.trim()) {
        errors.push(
          `${entry.id} must have automated coverage proving reference behavior "${coverage}".`,
        );
      }

      if (!entry.browser || !entry.browserTestName.trim()) {
        errors.push(
          `${entry.id} must have browser coverage proving reference behavior "${coverage}".`,
        );
      }

      if (!entry.expectedObservable.trim()) {
        errors.push(
          `${entry.id} must describe the observable reference behavior for "${coverage}".`,
        );
      }
    }

    if (!referenceTimeline) {
      errors.push(
        'reference-runtime-clone transferMode must declare referenceTimeline with mode "none", "creative-apps-kit-playback", "creative-apps-kit-keyframes", or "custom-reference-timeline".',
      );
    } else {
      const declaredReferenceTimelineCoverage = new Set(referenceTimeline.behaviorCoverage);
      const declaredReferenceTransportCoverage = [...declaredReferenceCoverage].filter(
        (coverage) => referenceTransportCoverage.has(coverage),
      );
      const declaredCreativeAppsKitTimelineCoverage = [...declaredReferenceTimelineCoverage].filter(
        (coverage) => creativeAppsKitReferenceTimelineCoverage.has(coverage),
      );

      if (referenceTimeline.mode === "none" && declaredReferenceTimelineCoverage.size > 0) {
        errors.push(
          'referenceTimeline mode "none" must not declare reference timeline behaviorCoverage.',
        );
      }

      if (
        referenceTimeline.mode === "none" &&
        declaredReferenceTransportCoverage.length > 0
      ) {
        errors.push(
          `reference-runtime-clone transport behaviorCoverage ${declaredReferenceTransportCoverage.map((coverage) => `"${coverage}"`).join(", ")} requires referenceTimeline mode "creative-apps-kit-playback", "creative-apps-kit-keyframes", or "custom-reference-timeline"; mode "none" is only for references with no user-facing transport behavior.`,
        );
      }

      if (
        (referenceTimeline.mode === "creative-apps-kit-playback" ||
          referenceTimeline.mode === "creative-apps-kit-keyframes") &&
        declaredReferenceTimelineCoverage.size === 0
      ) {
        errors.push(
          `referenceTimeline mode "${referenceTimeline.mode}" must list the concrete timeline transport behaviors in behaviorCoverage.`,
        );
      }

      if (referenceTimeline.mode === "creative-apps-kit-playback" && timelineMode !== "playback") {
        errors.push(
          'referenceTimeline mode "creative-apps-kit-playback" requires panels.timeline mode "playback".',
        );
      }

      if (referenceTimeline.mode === "creative-apps-kit-keyframes" && timelineMode !== "keyframes") {
        errors.push(
          'referenceTimeline mode "creative-apps-kit-keyframes" requires panels.timeline mode "keyframes".',
        );
      }

      if (
        referenceTimeline.mode === "creative-apps-kit-playback" &&
        declaredReferenceTimelineCoverage.has("keyframes")
      ) {
        errors.push(
          'referenceTimeline behaviorCoverage "keyframes" requires referenceTimeline mode "creative-apps-kit-keyframes".',
        );
      }

      if (
        referenceTimeline.mode === "creative-apps-kit-keyframes" &&
        !declaredReferenceTimelineCoverage.has("keyframes")
      ) {
        errors.push(
          'referenceTimeline mode "creative-apps-kit-keyframes" must include behaviorCoverage "keyframes".',
        );
      }

      if (
        (referenceTimeline.mode === "creative-apps-kit-playback" ||
          referenceTimeline.mode === "creative-apps-kit-keyframes") &&
        declaredCreativeAppsKitTimelineCoverage.length === 0
      ) {
        errors.push(
          `referenceTimeline mode "${referenceTimeline.mode}" must include at least one Creative Apps Kit timeline behavior such as "playback", "restart", "scrub", "duration", "loop", "time-progress", "export-at-time", or "keyframes".`,
        );
      }

      if (
        referenceTimeline.mode === "custom-reference-timeline" &&
        declaredReferenceTimelineCoverage.size === 0
      ) {
        errors.push(
          'referenceTimeline mode "custom-reference-timeline" must list every reference timeline behavior in behaviorCoverage.',
        );
      }

      for (const coverage of declaredReferenceTimelineCoverage) {
        if (
          customReferenceTimelineCoverage.has(coverage) &&
          referenceTimeline.mode !== "custom-reference-timeline"
        ) {
          errors.push(
            `referenceTimeline mode "${referenceTimeline.mode}" cannot preserve custom reference timeline behavior "${coverage}". Use mode "custom-reference-timeline" and browser-backed referenceTimelineCoverage instead.`,
          );
        }

        const entry = acceptance.find(
          (acceptanceEntry) => acceptanceEntry.referenceTimelineCoverage === coverage,
        );

        if (!entry) {
          errors.push(
            `referenceTimeline behaviorCoverage "${coverage}" is missing an acceptance entry with referenceTimelineCoverage "${coverage}".`,
          );
          continue;
        }

        if (entry.kind !== "runtime") {
          errors.push(
            `${entry.id} must be a runtime acceptance entry proving reference timeline behavior "${coverage}".`,
          );
        }

        if (!entry.automated || !entry.automatedTestName.trim()) {
          errors.push(
            `${entry.id} must have automated coverage proving reference timeline behavior "${coverage}".`,
          );
        }

        if (!entry.browser || !entry.browserTestName.trim()) {
          errors.push(
            `${entry.id} must have browser coverage proving reference timeline behavior "${coverage}".`,
          );
        }

        if (!entry.expectedObservable.trim()) {
          errors.push(
            `${entry.id} must describe the observable reference timeline behavior for "${coverage}".`,
          );
        }
      }
    }
  } else {
    for (const entry of acceptance) {
      if (entry.referenceCoverage) {
        errors.push(
          `${entry.id} declares referenceCoverage "${entry.referenceCoverage}" but transferMode is not "reference-runtime-clone".`,
        );
      }

      if (entry.referenceTimelineCoverage) {
        errors.push(
          `${entry.id} declares referenceTimelineCoverage "${entry.referenceTimelineCoverage}" but transferMode is not "reference-runtime-clone".`,
        );
      }
    }
  }

  if (layersEnabled) {
    for (const coverage of requiredLayerCoverage) {
      const entry = acceptance.find(
        (acceptanceEntry) =>
          acceptanceEntry.kind === "runtime" && acceptanceEntry.layerCoverage === coverage,
      );

      if (!entry) {
        errors.push(
          `panels.layers requires a runtime acceptance entry with layerCoverage "${coverage}" proving layer ${coverage} behavior.`,
        );
        continue;
      }

      if (!entry.automated || !entry.automatedTestName.trim()) {
        errors.push(`${entry.id} must have automated coverage proving layer ${coverage}.`);
      }

      if (!entry.browser || !entry.browserTestName.trim()) {
        errors.push(`${entry.id} must have browser coverage proving layer ${coverage}.`);
      }

      if (!entry.expectedObservable.trim()) {
        errors.push(
          `${entry.id} must describe the observable layer behavior for "${coverage}".`,
        );
      }
    }
  } else {
    for (const entry of acceptance) {
      if (entry.layerCoverage) {
        errors.push(
          `${entry.id} declares layerCoverage "${entry.layerCoverage}" but panels.layers is not enabled.`,
        );
      }
    }
  }

  if (timelineMode) {
    const playbackEntry = acceptance.find(
      (entry) => entry.kind === "runtime" && entry.timelineCoverage === "playback",
    );

    if (!playbackEntry) {
      errors.push(
        `panels.timeline mode "${timelineMode}" requires a runtime acceptance entry with timelineCoverage "playback" proving pause, scrub, duration/loop, and rendered-frame behavior.`,
      );
    } else if (
      !hasTimelinePlaybackCoverage(
        playbackEntry.timelinePlaybackCoverage,
        requiredTimelinePlaybackCoverage,
      )
    ) {
      errors.push(
        `${playbackEntry.id} timelineCoverage "playback" must declare timelinePlaybackCoverage for pause-resume, scrub, duration, loop, and rendered-frame. Duration coverage must prove renderer progress maps 0..state.timeline.durationSeconds, not a local fixed animation duration.`,
      );
    } else if (hasTimelinePlaybackCoveragePart(playbackEntry.timelinePlaybackCoverage, "duration")) {
      const durationEvidenceText = [
        playbackEntry.automatedTestName,
        playbackEntry.browserTestName,
        playbackEntry.expectedObservable,
        playbackEntry.userAction,
      ].join(" ");

      if (!/\bduration\b/i.test(durationEvidenceText) || !/\b(edit|change|commit|enter|set)\w*\b/i.test(durationEvidenceText)) {
        errors.push(
          `${playbackEntry.id} timelinePlaybackCoverage "duration" must describe editing/changing the timeline duration through the UI and proving the renderer follows state.timeline.durationSeconds.`,
        );
      }
    }
  }

  if (schema.canvas.sizing.mode === "fixed-output") {
    const fixedCanvasSizingEntry = acceptance.find(
      (entry) =>
        entry.kind === "runtime" &&
        entry.canvasSizingCoverage === "fixed-output-size",
    );

    if (!fixedCanvasSizingEntry) {
      errors.push(
        'canvas.sizing mode "fixed-output" requires a runtime acceptance entry with canvasSizingCoverage "fixed-output-size" explaining why width and height are intentionally non-editable. A user-provided base/default size should normally use "editable-output".',
      );
    } else {
      const evidenceText = getAcceptanceEvidenceText(fixedCanvasSizingEntry);

      if (!/(fixed|locked|non-editable|not user-editable|must not edit|reference-defined|product-defined)/i.test(evidenceText)) {
        errors.push(
          `${fixedCanvasSizingEntry.id} canvasSizingCoverage "fixed-output-size" must explain why the product output dimensions are intentionally fixed, not merely initialized from a default size.`,
        );
      }

      if (!fixedCanvasSizingEntry.automated || !fixedCanvasSizingEntry.automatedTestName.trim()) {
        errors.push(
          `${fixedCanvasSizingEntry.id} must have automated coverage proving fixed output dimensions.`,
        );
      }

      if (!fixedCanvasSizingEntry.browser || !fixedCanvasSizingEntry.browserTestName.trim()) {
        errors.push(
          `${fixedCanvasSizingEntry.id} must have browser coverage proving fixed output dimensions.`,
        );
      }
    }
  }

  if (timelineMode === "keyframes") {
    const hasKeyframesCoverage = acceptance.some(
      (entry) => entry.kind === "runtime" && entry.timelineCoverage === "keyframes",
    );

    if (!hasKeyframesCoverage) {
      errors.push(
        'panels.timeline mode "keyframes" requires a runtime acceptance entry with timelineCoverage "keyframes" proving expanded rows, diamonds, keyframe mutation, and renderer evaluation.',
      );
    }
  }

  for (const { control, controlId, sectionTitle } of controls) {
    const label = `${sectionTitle ? `${sectionTitle} / ` : ""}${controlId} (${control.target})`;
    const entry = controlAcceptance.get(control.target);
    const keyframeCapability = getCreativeAppsKitControlKeyframeCapability(control);
    const isSelectedLayerTarget = control.target.startsWith("selectedLayer.");
    const toggleLabelError = getToggleControlLabelError(control);

    if (toggleLabelError) {
      errors.push(`${label} ${toggleLabelError}`);
    }

    if (
      control.type !== "panelActions" &&
      timelineTransportControlPattern.test(getTimelineTransportControlText(controlId, control))
    ) {
      errors.push(
        `${label} looks like an app-wide timeline transport control. Play, Pause, Animate, Resume, and Restart animation belong to the top timeline; keep right-panel controls for renderer parameters, generation/apply actions, and output delivery.`,
      );
    }

    if (control.keyframeable === true && !keyframeCapability.capable) {
      errors.push(
        `${label} sets keyframeable true, but this control type or runtime-owned target cannot create timeline keyframes.`,
      );
    }

    if (
      timelineMode === "keyframes" &&
      keyframeCapability.capable &&
      control.keyframeable === false
    ) {
      errors.push(
        `${label} is keyframe-capable by Creative Apps Kit control type; remove keyframeable: false and provide keyframe evaluator coverage instead of hiding the diamond.`,
      );
    }

    if (isSelectedLayerTarget && !layersEnabled) {
      errors.push(
        `${label} uses reserved selectedLayer.* target without panels.layers enabled. Use an app-specific target for single-layer apps or enable layers with layerCoverage.`,
      );
    }

    if (control.disabledWhen) {
      if (
        !("equals" in control.disabledWhen) &&
        !("notEquals" in control.disabledWhen)
      ) {
        errors.push(
          `${label} disabledWhen must declare equals or notEquals so the unavailable state is deterministic.`,
        );
      }

      if (
        !controlTargets.has(control.disabledWhen.target) &&
        !isCanvasSizeTarget(control.disabledWhen.target)
      ) {
        errors.push(
          `${label} disabledWhen target ${control.disabledWhen.target} does not match another schema control target or canvas size target.`,
        );
      }
    }

    if (!entry) {
      errors.push(`${label} is missing an acceptance entry.`);
      continue;
    }

    if (!entry.automated) {
      errors.push(`${label} must have automated acceptance coverage.`);
    }

    if (!entry.browser) {
      errors.push(`${label} must have browser acceptance coverage.`);
    }

    if (entry.browser && !entry.browserTestName.trim()) {
      errors.push(`${label} must point to a browser test name.`);
    }

    if (!entry.expectedObservable.trim()) {
      errors.push(`${label} must describe a product-level observable.`);
    }

    if (!entry.automatedTestName.trim()) {
      errors.push(`${label} must point to an automated test name.`);
    }

    if (entry.componentType !== control.type) {
      errors.push(
        `${label} acceptance componentType must be "${control.type}", received "${entry.componentType}".`,
      );
    }

    if (
      control.disabledWhen &&
      !/\b(disabled|unavailable|inactive|not editable|not meaningful|no effect|without effect)\b/i.test(
        getAcceptanceEvidenceText(entry),
      )
    ) {
      errors.push(
        `${label} uses disabledWhen and acceptance must prove the control becomes disabled/unavailable when ${control.disabledWhen.target} reaches the disabling value.`,
      );
    }

    if (
      schemaHasPngExportPanelAction(schema) &&
      isOutputBackgroundToggleControl({ control, controlId, sectionTitle })
    ) {
      const evidenceText = getAcceptanceEvidenceText(entry);

      if (
        !/\b(png|image)\b/i.test(evidenceText) ||
        !/\b(transparent|transparency|alpha)\b/i.test(evidenceText) ||
        !/\b(preview|canvas|workspace|backing|video)\b/i.test(evidenceText) ||
        !/\b(keep|keeps|preserve|preserves|stay|stays|remain|remains|still|not transparent|non-transparent)\b/i.test(
          evidenceText,
        )
      ) {
        errors.push(
          `${label} controls PNG background inclusion and acceptance must prove disabling it makes PNG output transparent while live preview, workspace canvas backing, and video output keep the product background.`,
        );
      }
    }

    const requiredControlParts =
      getRequiredCreativeAppsKitControlPartCoverage(control);

    if (!hasControlPartCoverage(entry.controlPartCoverage, requiredControlParts)) {
      errors.push(
        `${label} must declare controlPartCoverage for every semantic value part: ${requiredControlParts.join(", ")}.`,
      );
    }

    if (timelineMode === "keyframes" && keyframeCapability.capable) {
      if (entry.timelineCoverage !== "keyframes") {
        errors.push(
          `${label} is keyframe-capable by Creative Apps Kit control type and must have acceptance timelineCoverage "keyframes" proving its diamond creates/updates a keyframe row and changes evaluated output.`,
        );
      }
    }

    if (
      isSelectedLayerTarget &&
      layersEnabled &&
      entry.layerCoverage !== "selected-layer-controls"
    ) {
      errors.push(
        `${label} targets selectedLayer.* and must have acceptance layerCoverage "selected-layer-controls" proving the control edits the currently selected layer output.`,
      );
    }

    if (isSliderLikeControl(control)) {
      const expectedMarkerCount = getStepMarkerCount(control);

      if (
        control.variant === "discrete" &&
        expectedMarkerCount &&
        control.markerCount !== expectedMarkerCount
      ) {
        errors.push(
          `${label} discrete slider must render one marker per step; expected markerCount ${expectedMarkerCount}, received ${String(control.markerCount)}.`,
        );
      }

      errors.push(
        ...getSliderVariantClassificationErrors({
          control,
          controlId,
          label,
        }),
      );
    }

    if (control.type === "imagePicker") {
      const itemValues = getControlOptionValues(control);

      if (!hasCoverageForValues(entry.optionCoverage, itemValues)) {
        errors.push(
          `${label} must cover every visible ImagePicker item: ${itemValues.join(", ")}.`,
        );
      }
    }

    if (control.type === "select" || control.type === "segmented") {
      const optionValues = getControlOptionValues(control);

      if (optionValues.length > 1 && !hasCoverageForValues(entry.optionCoverage, optionValues)) {
        errors.push(`${label} must cover every visible option: ${optionValues.join(", ")}.`);
      }

      const segmentedLayoutError = getSegmentedControlLayoutError(control);

      if (segmentedLayoutError) {
        errors.push(`${label} ${segmentedLayoutError}`);
      }
    }

    if (control.type === "panelActions") {
      const actionValues = control.actions?.map(getActionValue) ?? [];
      const resetActionValues =
        control.actions?.filter(isResetPanelAction).map(getActionValue) ?? [];

      if (resetActionValues.length > 0) {
        errors.push(
          `${label} must not include Reset footer actions (${resetActionValues.join(", ")}). The controls panel header owns Reset controls; sticky panelActions are only for product delivery actions such as Export, Copy, Generate, Apply, or Download.`,
        );
      }

      if (!hasCoverageForValues(entry.actionCoverage, actionValues)) {
        errors.push(`${label} must cover every footer action: ${actionValues.join(", ")}.`);
      }
    }
  }

  for (const entry of acceptance) {
    if (entry.kind === "control" && entry.target && !controlTargets.has(entry.target)) {
      errors.push(`${entry.id} points to missing control target ${entry.target}.`);
    }

    if (entry.kind !== "canvas-handle") {
      continue;
    }

    if (!entry.canvasHandle) {
      errors.push(`${entry.id} canvas handle is missing canvasHandle metadata.`);
      continue;
    }

    if (!entry.canvasHandle.testId.trim()) {
      errors.push(`${entry.id} canvas handle must provide a stable testId.`);
    }

    if (!entry.canvasHandle.writesTarget.trim()) {
      errors.push(`${entry.id} canvas handle must name the runtime target it writes.`);
    }

    if (
      entry.canvasHandle.writesTarget &&
      !controlTargets.has(entry.canvasHandle.writesTarget) &&
      !commandTargets.has(entry.canvasHandle.writesTarget)
    ) {
      errors.push(
        `${entry.id} canvas handle writesTarget ${entry.canvasHandle.writesTarget} does not match a schema target or supported editor command.`,
      );
    }

    if (!entry.canvasHandle.outputObservable.trim()) {
      errors.push(`${entry.id} canvas handle must describe the product output change.`);
    }

    if (!entry.canvasHandle.exportCleanTestName.trim()) {
      errors.push(`${entry.id} canvas handle must point to an export-clean test.`);
    }

    if (!entry.browser || !entry.browserTestName.trim()) {
      errors.push(`${entry.id} canvas handle must have browser drag coverage.`);
    }

    if (!entry.automated || !entry.automatedTestName.trim()) {
      errors.push(`${entry.id} canvas handle must have automated output coverage.`);
    }
  }

  return errors;
}

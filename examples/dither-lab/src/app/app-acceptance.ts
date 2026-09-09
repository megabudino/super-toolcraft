import {
  getToolcraftControlKeyframeCapability,
  getToolcraftSettingsTransferEligibility,
} from "@/toolcraft/runtime";
import type {
  ToolcraftActionSchema,
  ToolcraftControlConditionSchema,
  ToolcraftControlOrderRole,
  ToolcraftControlSchema,
  ResolvedToolcraftAppSchema,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";

export type ToolcraftAcceptanceEvidence =
  | "command-side-effect"
  | "exported-bytes"
  | "media-lifecycle"
  | "persistence-state"
  | "product-output"
  | "rendered-pixels"
  | "timeline-output"
  | "viewport-side-effect";

export type ToolcraftReferenceCoverage =
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

export type ToolcraftReferenceTimelineCoverage =
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

export type ToolcraftTimelinePlaybackCoverage =
  | "duration"
  | "loop"
  | "pause-resume"
  | "rendered-frame"
  | "scrub";

export type ToolcraftCanvasSizingCoverage = "fixed-output-size";

export type ToolcraftPersistenceCoverage = "reload";

export type ToolcraftSettingsTransferCoverage = "opt-out";

export type ToolcraftAutonomousAnimationCoverage =
  | "no-duration-control"
  | "no-export-at-time"
  | "no-loop-control"
  | "no-play-pause"
  | "no-scrub"
  | "no-user-facing-transport";

export type ToolcraftAnimationIntent =
  | {
      mode: "none";
    }
  | {
      behaviorCoverage: readonly ToolcraftAutonomousAnimationCoverage[];
      mode: "autonomous";
      reason: string;
    }
  | {
      mode: "timeline-keyframes";
    }
  | {
      mode: "timeline-playback";
    };

export type ToolcraftReferenceTimelineMode =
  | "custom-reference-timeline"
  | "none"
  | "toolcraft-keyframes"
  | "toolcraft-playback";

export type ToolcraftReferenceTimelineContract = {
  behaviorCoverage: readonly ToolcraftReferenceTimelineCoverage[];
  mode: ToolcraftReferenceTimelineMode;
};

export type ToolcraftLayerCoverage =
  | "grouping"
  | "media-lifecycle"
  | "reorder"
  | "selected-layer-controls"
  | "selection"
  | "visibility";

export type ToolcraftControlPartCoverage =
  | "anchorGrid.position"
  | "channelMixer.activeChannel"
  | "channelMixer.values"
  | "curves.activeChannel"
  | "curves.points"
  | "colorOpacity.hex"
  | "colorOpacity.opacity"
  | "fontPicker.color"
  | "fontPicker.fontId"
  | "fontPicker.fontSize"
  | "fontPicker.fontWeight"
  | "fontPicker.letterSpacing"
  | "fontPicker.lineHeight"
  | "fontPicker.opacity"
  | "fontPicker.textCase"
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

export type ToolcraftCustomControlCoverage =
  | "built-in-gap"
  | "kit-primitives"
  | "minimal-ui"
  | "product-output"
  | "runtime-state";

const builtInToolcraftControlTypeValues = [
  "actions",
  "anchorGrid",
  "channelMixer",
  "checkbox",
  "code",
  "collectionActions",
  "color",
  "colorOpacity",
  "curves",
  "fileDrop",
  "fontPicker",
  "gradient",
  "imagePicker",
  "palette",
  "panelActions",
  "rangeInput",
  "rangeSlider",
  "segmented",
  "select",
  "settingsTransfer",
  "slider",
  "switch",
  "text",
  "vector",
] as const;
const settingsTransferOptOutReasonPattern =
  /\b(ephemeral|temporary|one-off|not portable|session-only)\b/i;

export type ToolcraftBuiltInControlType =
  (typeof builtInToolcraftControlTypeValues)[number];

export type ToolcraftBuiltInFitCheck = {
  checkedBuiltIns: readonly ToolcraftBuiltInControlType[];
  closestBuiltIn: ToolcraftBuiltInControlType | "none";
  productObservable: string;
  whyInsufficient: string;
};

export type ToolcraftTransferMode =
  | {
      animationIntent?: ToolcraftAnimationIntent;
      mode: "new-toolcraft-app";
    }
  | {
      animationIntent?: ToolcraftAnimationIntent;
      behaviorCoverage: readonly ToolcraftReferenceCoverage[];
      mode: "reference-runtime-clone";
      referenceName: string;
      referenceTimeline: ToolcraftReferenceTimelineContract;
      sourceOfTruth: "reference-runtime";
    };

export type ToolcraftProductReadiness =
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

export type ToolcraftComponentAcceptance = {
  actionCoverage?: readonly string[];
  automated: boolean;
  automatedTestName: string;
  browser: boolean;
  browserTestName: string;
  componentType: string;
  evidence: ToolcraftAcceptanceEvidence;
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
  canvasSizingCoverage?: ToolcraftCanvasSizingCoverage;
  layerCoverage?: ToolcraftLayerCoverage;
  optionCoverage?: "each-visible-item" | readonly string[];
  persistenceCoverage?: ToolcraftPersistenceCoverage;
  referenceCoverage?: ToolcraftReferenceCoverage;
  referenceTimelineCoverage?: ToolcraftReferenceTimelineCoverage;
  settingsTransferCoverage?: ToolcraftSettingsTransferCoverage;
  target?: string;
  timelineCoverage?: "keyframes" | "playback";
  timelinePlaybackCoverage?:
    | "all-playback-behavior"
    | readonly ToolcraftTimelinePlaybackCoverage[];
  controlPartCoverage?:
    | "all-visible-parts"
    | readonly ToolcraftControlPartCoverage[];
  customControlCoverage?:
    | "all-custom-control-behavior"
    | readonly ToolcraftCustomControlCoverage[];
  builtInFitCheck?: ToolcraftBuiltInFitCheck;
  userAction: string;
};

export type ToolcraftVisibleControl = {
  control: ToolcraftControlSchema;
  controlId: string;
  sectionTitle?: string;
};

export type ToolcraftControlOrderItem = {
  controlId: string;
  rank: number;
  role: ToolcraftControlOrderRole;
  sectionTitle?: string;
  target: string;
  type: string;
};

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  behaviorCoverage: [
    "canvas-sizing",
    "control-mapping",
    "export-copy",
    "media-lifecycle",
    "renderer-state",
  ],
  mode: "reference-runtime-clone",
  referenceName: "Dither v1.4",
  referenceTimeline: {
    behaviorCoverage: [],
    mode: "none",
  },
  sourceOfTruth: "reference-runtime",
};

export const appProductReadiness: ToolcraftProductReadiness = {
  mode: "product",
  productName: "Dither Lab",
  productSummary:
    "A pixel-effect editor with bundled Lyonecho starting artwork, optional custom-image replacement, fourteen pixel styles, tone shaping, deterministic texture and lens finishes, duotone palettes, and high-resolution still export.",
  requestedBehavior:
    "Start from the bundled Lyonecho artwork and imported default settings, optionally replace the image, shape it with expressive Dither v1.4-inspired pixel, tone, texture, lens, and duotone controls, preview stable output in the Toolcraft canvas, and export PNG/JPG at selected 2K/4K/8K dimensions.",
};

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName: "source image upload clear and reset update media",
    browser: true,
    browserTestName: "browser: source image upload clear and reset update media",
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable:
      "The bundled Lyonecho image starts attached in the uploader; uploading or importing another source replaces it. Remove clears the uploader and rendered image. Undo restores the attachment, while global and Source section Reset restore the bundled default image.",
    fixture: "bundled Lyonecho default image and transparent SVG override",
    id: "source.image",
    kind: "control",
    referenceCoverage: "media-lifecycle",
    target: "source.image",
    userAction:
      "Open the app, remove the attached default, undo and redo removal, reset Source, upload/import a replacement, remove it, upload again, then use Reset controls to restore the attached bundled image.",
  },
  {
    automated: true,
    automatedTestName: "effect style changes product output",
    browser: true,
    browserTestName: "browser: effect style changes product output",
    componentType: "select",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing among all fourteen Style options visibly changes the rendered product pixels and primitive geometry.",
    fixture: "gradient source image",
    id: "effect.style",
    kind: "control",
    optionCoverage: "each-visible-item",
    referenceCoverage: "control-mapping",
    target: "effect.style",
    userAction: "Choose each visible Style option from the select menu.",
  },
  {
    automated: true,
    automatedTestName: "effect size changes product output",
    browser: true,
    browserTestName: "browser: effect size changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Size changes the sampled cell size and visible effect granularity.",
    fixture: "gradient source image with Dither style",
    id: "effect.size",
    kind: "control",
    referenceCoverage: "renderer-state",
    target: "effect.size",
    userAction: "Drag the Size slider from a small value to a large value.",
  },
  {
    automated: true,
    automatedTestName: "effect fill changes product output",
    browser: true,
    browserTestName: "browser: effect fill changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Fill changes threshold coverage for non-Dither effects and remains hidden for Dither.",
    fixture: "gradient source image with Halftone style",
    id: "effect.fill",
    kind: "control",
    target: "effect.fill",
    userAction:
      "Choose Halftone, drag Fill, then choose Dither and verify Fill becomes hidden.",
  },
  {
    automated: true,
    automatedTestName: "effect density changes product output",
    browser: true,
    browserTestName: "browser: effect density changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Density changes contrast/detail mapping and ASCII spacing in the rendered output.",
    fixture: "gradient source image with ASCII style",
    id: "effect.density",
    kind: "control",
    target: "effect.density",
    userAction: "Drag the Density slider from low to high.",
  },
  {
    automated: true,
    automatedTestName: "effect exposure changes product output",
    browser: true,
    browserTestName: "browser: effect exposure changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Exposure changes the brightness scaling used by the rendered effect.",
    fixture: "gradient source image with Dots style",
    id: "effect.exposure",
    kind: "control",
    target: "effect.exposure",
    userAction: "Drag the Exposure slider from low to high.",
  },
  {
    automated: true,
    automatedTestName: "effect scatter changes product output",
    browser: true,
    browserTestName: "browser: effect scatter changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Scatter changes deterministic per-cell alpha distribution and remains hidden for Dither and Bayer.",
    fixture: "gradient source image with Dots style",
    id: "effect.scatter",
    kind: "control",
    target: "effect.scatter",
    userAction:
      "Choose Dots, drag Scatter, then choose Bayer and verify Scatter becomes hidden.",
  },
  {
    automated: true,
    automatedTestName: "effect seed changes deterministic product output",
    browser: true,
    browserTestName: "browser: effect seed changes deterministic product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Seed changes Scatter, Noise, and Grain placement while identical seed and settings reproduce identical pixels.",
    fixture: "gradient source image with Dots, Scatter, and Grain",
    id: "effect.seed",
    kind: "control",
    target: "effect.seed",
    userAction: "Enable Scatter or Grain, change Seed, then return to the prior Seed.",
  },
  {
    automated: true,
    automatedTestName: "ascii mode changes product output",
    browser: true,
    browserTestName: "browser: ascii mode changes product output",
    componentType: "select",
    evidence: "rendered-pixels",
    expectedObservable:
      "ASCII Style is visible when Effect Style is ASCII, hidden otherwise, and Uniform, Dynamic, and Filled each change the rendered glyph layout.",
    fixture: "gradient source image with ASCII style",
    id: "effect.ascii.mode",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "effect.ascii.mode",
    userAction:
      "Choose ASCII Effect Style, select each ASCII Style option, then choose Dots and verify the ASCII section is hidden.",
  },
  {
    automated: true,
    automatedTestName: "ascii glyphs change product output",
    browser: true,
    browserTestName: "browser: ascii glyphs change product output",
    componentType: "select",
    evidence: "rendered-pixels",
    expectedObservable:
      "ASCII Preset is visible when Style is ASCII, hidden otherwise, and each visible character preset changes the character mapping.",
    fixture: "gradient source image with ASCII style",
    id: "effect.ascii.glyphs",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "effect.ascii.glyphs",
    userAction: "Choose ASCII Style and select every visible Preset option.",
  },
  {
    automated: true,
    automatedTestName: "ascii custom glyphs change product output",
    browser: true,
    browserTestName: "browser: ascii custom glyphs change product output",
    componentType: "text",
    evidence: "rendered-pixels",
    expectedObservable:
      "Chars text appears only when Preset is Custom and changing it changes ASCII product output.",
    fixture: "gradient source image with ASCII custom glyphs",
    id: "effect.ascii.customGlyphs",
    kind: "control",
    target: "effect.ascii.customGlyphs",
    userAction:
      "Choose ASCII Style, choose Custom Preset, type a new Chars string, and verify the field becomes hidden when another preset is selected.",
  },
  {
    automated: true,
    automatedTestName: "tone brightness changes product output",
    browser: true,
    browserTestName: "browser: tone brightness changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable: "Dragging Brightness changes the prepared source and final pixels.",
    fixture: "gradient source image with Dither style",
    id: "tone.brightness",
    kind: "control",
    target: "tone.brightness",
    userAction: "Drag Brightness below and above 100%.",
  },
  {
    automated: true,
    automatedTestName: "tone contrast changes product output",
    browser: true,
    browserTestName: "browser: tone contrast changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable: "Dragging Contrast changes the prepared source and final pixels.",
    fixture: "gradient source image with Dither style",
    id: "tone.contrast",
    kind: "control",
    target: "tone.contrast",
    userAction: "Drag Contrast below and above 100%.",
  },
  {
    automated: true,
    automatedTestName: "tone saturation changes product output",
    browser: true,
    browserTestName: "browser: tone saturation changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable: "Dragging Saturation changes the prepared source and final pixels.",
    fixture: "color gradient source image with Dither style",
    id: "tone.saturation",
    kind: "control",
    target: "tone.saturation",
    userAction: "Drag Saturation from grayscale to oversaturated.",
  },
  {
    automated: true,
    automatedTestName: "tone hue changes product output",
    browser: true,
    browserTestName: "browser: tone hue changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable: "Dragging Hue rotates source colors before the pixel effect.",
    fixture: "color gradient source image with Dither style",
    id: "tone.hue",
    kind: "control",
    target: "tone.hue",
    userAction: "Drag Hue between negative and positive rotations.",
  },
  {
    automated: true,
    automatedTestName: "finish noise changes product output",
    browser: true,
    browserTestName: "browser: finish noise changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable: "Dragging Noise adds a broad deterministic texture to output pixels.",
    fixture: "gradient source image with Halftone style",
    id: "finish.noise",
    kind: "control",
    target: "finish.noise",
    userAction: "Drag Noise from 0% to a strong value.",
  },
  {
    automated: true,
    automatedTestName: "finish grain changes product output",
    browser: true,
    browserTestName: "browser: finish grain changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable: "Dragging Grain adds a fine deterministic texture to output pixels.",
    fixture: "gradient source image with Halftone style",
    id: "finish.grain",
    kind: "control",
    target: "finish.grain",
    userAction: "Drag Grain from 0% to a strong value.",
  },
  {
    automated: true,
    automatedTestName: "finish glow changes product output",
    browser: true,
    browserTestName: "browser: finish glow changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable: "Dragging Glow adds a saturated screen bloom to bright output pixels.",
    fixture: "high-contrast source image with Dots style",
    id: "finish.glow",
    kind: "control",
    target: "finish.glow",
    userAction: "Drag Glow from 0% to a strong value.",
  },
  {
    automated: true,
    automatedTestName: "finish vignette changes product output",
    browser: true,
    browserTestName: "browser: finish vignette changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable: "Dragging Vignette progressively darkens the output edges.",
    fixture: "gradient source image with Pixel Art style",
    id: "finish.vignette",
    kind: "control",
    target: "finish.vignette",
    userAction: "Drag Vignette from 0% to a strong value.",
  },
  {
    automated: true,
    automatedTestName: "duotone preset changes product output",
    browser: true,
    browserTestName: "browser: duotone preset changes product output",
    componentType: "select",
    evidence: "rendered-pixels",
    expectedObservable:
      "Each Duotone preset remaps final output into a distinct two-color palette; Off preserves source colors.",
    fixture: "gradient source image with Dots style",
    id: "duotone.preset",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "duotone.preset",
    userAction: "Choose every visible Duotone Preset option.",
  },
  {
    automated: true,
    automatedTestName: "custom duotone pixels color changes product output",
    browser: true,
    browserTestName: "browser: custom duotone pixels color changes product output",
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Pixels color is shown only for Custom Duotone and changes the light palette endpoint.",
    fixture: "gradient source image with Custom Duotone",
    id: "duotone.pixels",
    kind: "control",
    target: "duotone.pixels",
    userAction: "Choose Custom Preset and change Pixels color.",
  },
  {
    automated: true,
    automatedTestName: "custom duotone base color changes product output",
    browser: true,
    browserTestName: "browser: custom duotone base color changes product output",
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Base color is shown only for Custom Duotone and changes the dark palette endpoint.",
    fixture: "gradient source image with Custom Duotone",
    id: "duotone.base",
    kind: "control",
    target: "duotone.base",
    userAction: "Choose Custom Preset and change Base color.",
  },
  {
    automated: true,
    automatedTestName: "layer opacity changes product output",
    browser: true,
    browserTestName: "browser: layer opacity changes product output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Opacity changes how strongly the effect layer composites over the source image.",
    fixture: "gradient source image with Dither style",
    id: "effect.layer.opacity",
    kind: "control",
    target: "effect.layer.opacity",
    userAction: "Drag the Opacity slider down and up.",
  },
  {
    automated: true,
    automatedTestName: "layer blend changes product output",
    browser: true,
    browserTestName: "browser: layer blend changes product output",
    componentType: "select",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing Blending Mode between Normal, Screen, Overlay, Color Dodge, and Multiply changes the composited rendered pixels.",
    fixture: "gradient source image with Halftone style",
    id: "effect.layer.blend",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "effect.layer.blend",
    userAction: "Choose each visible Blending Mode option from the select menu.",
  },
  {
    automated: true,
    automatedTestName: "include background changes preview and png output",
    browser: true,
    browserTestName: "browser: include background changes preview and png output",
    componentType: "switch",
    evidence: "exported-bytes",
    expectedObservable:
      "Turning Include off hides the live preview product background, exports PNG/image alpha transparency, and the still-image app exposes no video export so video background stays preserved by omission.",
    fixture: "transparent SVG source image",
    id: "export.includeBackground",
    kind: "control",
    target: "export.includeBackground",
    userAction:
      "Toggle Include off, inspect transparent preview corners, export PNG with alpha, then toggle Include on and export with background color.",
  },
  {
    automated: true,
    automatedTestName: "background color changes preview and png output",
    browser: true,
    browserTestName: "browser: background color changes preview and png output",
    componentType: "color",
    evidence: "exported-bytes",
    expectedObservable:
      "Changing Background color changes preview pixels behind transparent source areas and exported PNG background pixels when Include is on.",
    fixture: "transparent SVG source image",
    id: "appearance.background",
    kind: "control",
    target: "appearance.background",
    userAction: "Change Background color, preview, and exported PNG pixels.",
  },
  {
    automated: true,
    automatedTestName: "image format changes exported bytes",
    browser: true,
    browserTestName: "browser: image format changes exported bytes",
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable:
      "Choosing PNG and JPG changes the exported image MIME type and decoded bytes.",
    fixture: "gradient source image",
    id: "export.image.format",
    kind: "control",
    optionCoverage: ["png", "jpg"],
    target: "export.image.format",
    userAction: "Choose PNG, export, choose JPG, and export again.",
  },
  {
    automated: true,
    automatedTestName: "image resolution changes exported dimensions",
    browser: true,
    browserTestName: "browser: image resolution changes exported dimensions",
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable:
      "Choosing 2K, 4K, and 8K passes export.image.resolution to the PNG helper and changes actual decoded image dimensions.",
    fixture: "gradient source image",
    id: "export.image.resolution",
    kind: "control",
    optionCoverage: ["2k", "4k", "8k"],
    target: "export.image.resolution",
    userAction: "Choose 2K and 4K/8K resolution values and decode exported images.",
  },
  {
    automated: true,
    automatedTestName: "resolution scale changes preview output",
    browser: true,
    browserTestName: "browser: resolution scale changes preview output",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Resolution scale changes raster backing pixels without changing CSS/output size, and the canvas remains responsive.",
    fixture: "gradient source image with high-density Dots style",
    id: "canvas.renderScale",
    kind: "control",
    referenceCoverage: "canvas-sizing",
    target: "canvas.renderScale",
    userAction: "Drag the Resolution scale slider at a high-density effect setting.",
  },
  {
    automated: true,
    automatedTestName: "settings transfer exports and imports complex settings",
    browser: true,
    browserTestName: "browser: settings transfer exports and imports complex settings",
    componentType: "settingsTransfer",
    evidence: "command-side-effect",
    expectedObservable:
      "Export Settings writes current control values and canvas state, and Import Settings restores complex Dither settings through the runtime Setup section.",
    fixture: "changed Dither settings JSON",
    id: "runtime.settingsTransfer",
    kind: "control",
    target: "runtime.settingsTransfer",
    userAction: "Export settings, change controls, import settings, and observe restored output.",
  },
  {
    automated: true,
    automatedTestName: "persistence reload restores dither settings",
    browser: true,
    browserTestName: "browser: persistence reload restores dither settings",
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Changing a user-facing setting such as Style or Exposure, reloading the browser page, and observing the restored control value proves localStorage persistence reload behavior.",
    fixture: "changed exposure persisted in localStorage",
    id: "runtime.persistence",
    kind: "runtime",
    persistenceCoverage: "reload",
    target: "runtime.persistence",
    userAction:
      "Change Exposure, wait for persistence, reload the page, and verify the restored value/output.",
  },
  {
    actionCoverage: ["export-png"],
    automated: true,
    automatedTestName: "exports image output",
    browser: true,
    browserTestName: "browser: exports image output",
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Export PNG returns a real Promise, shows sticky footer progress, and downloads the final product output using current effect, background, format, and resolution values.",
    fixture: "gradient source image with 2K PNG export",
    id: "export.actions",
    kind: "control",
    referenceCoverage: "export-copy",
    target: "export.actions",
    userAction: "Click Export PNG and inspect the downloaded image bytes.",
  },
];

function getActionValue(action: ToolcraftActionSchema | string): string {
  return typeof action === "string" ? action : action.value;
}

function getActionSearchText(action: ToolcraftActionSchema | string): string {
  return typeof action === "string" ? action : `${action.label} ${action.value} ${action.command ?? ""}`;
}

function isCanvasSizeTarget(target: string): boolean {
  return target === "canvas.size.width" || target === "canvas.size.height";
}

function isResetPanelAction(action: ToolcraftActionSchema | string): boolean {
  return /\breset\b/i.test(getActionSearchText(action));
}

function getControlOptionValues(control: ToolcraftControlSchema): readonly string[] {
  if (control.type === "imagePicker") {
    return control.items?.map((item) => item.value) ?? [];
  }

  return control.options?.map((option) => option.value) ?? [];
}

function hasCoverageForValues(
  coverage: ToolcraftComponentAcceptance["actionCoverage"] | ToolcraftComponentAcceptance["optionCoverage"],
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
  coverage: ToolcraftComponentAcceptance["controlPartCoverage"],
  requiredParts: readonly ToolcraftControlPartCoverage[],
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

function hasCustomControlCoverage(
  coverage: ToolcraftComponentAcceptance["customControlCoverage"],
  requiredParts: readonly ToolcraftCustomControlCoverage[],
): boolean {
  if (coverage === "all-custom-control-behavior") {
    return true;
  }

  if (!Array.isArray(coverage)) {
    return false;
  }

  return requiredParts.every((part) => coverage.includes(part));
}

function hasTimelinePlaybackCoverage(
  coverage: ToolcraftComponentAcceptance["timelinePlaybackCoverage"],
  requiredParts: readonly ToolcraftTimelinePlaybackCoverage[],
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
  coverage: ToolcraftComponentAcceptance["timelinePlaybackCoverage"],
  part: ToolcraftTimelinePlaybackCoverage,
): boolean {
  return coverage === "all-playback-behavior" || (Array.isArray(coverage) && coverage.includes(part));
}

function getAcceptanceEvidenceText(entry: ToolcraftComponentAcceptance): string {
  return [
    entry.automatedTestName,
    entry.browserTestName,
    entry.expectedObservable,
    entry.fixture,
    entry.userAction,
  ].join(" ");
}

function getFileDropLifecycleCoverageErrors(
  label: string,
  entry: ToolcraftComponentAcceptance,
): string[] {
  const errors: string[] = [];
  const evidenceText = getAcceptanceEvidenceText(entry);

  if (entry.evidence !== "media-lifecycle") {
    errors.push(
      `${label} fileDrop acceptance evidence must be "media-lifecycle" so upload, clear, and reset behavior cannot be replaced by generic product-output coverage.`,
    );
  }

  if (
    !/\b(upload|import|drop|drag|browse|choose|select file|source image)\b/i.test(
      evidenceText,
    ) ||
    !/\b(clear|remove|delete|trash)\b/i.test(evidenceText) ||
    !/\b(reset|reset controls|section reset|global reset)\b/i.test(evidenceText)
  ) {
    errors.push(
      `${label} fileDrop acceptance must prove upload/import, clear/remove, and section or global reset remove source media.`,
    );
  }

  return errors;
}

const conditionOperatorLabels = [
  "equals",
  "notEquals",
  "oneOf",
  "notOneOf",
  "greaterThan",
  "greaterThanOrEqual",
  "lessThan",
  "lessThanOrEqual",
] as const satisfies readonly (keyof ToolcraftControlConditionSchema)[];

function hasConditionOperator(condition: ToolcraftControlConditionSchema): boolean {
  return conditionOperatorLabels.some((operator) => operator in condition);
}

function getConditionValidationErrors({
  condition,
  conditionName,
  controlTargets,
  label,
}: {
  condition: ToolcraftControlConditionSchema;
  conditionName: "disabledWhen" | "visibleWhen";
  controlTargets: ReadonlySet<string>;
  label: string;
}): string[] {
  const errors: string[] = [];

  if (!hasConditionOperator(condition)) {
    errors.push(
      `${label} ${conditionName} must declare one of equals, notEquals, oneOf, notOneOf, greaterThan, greaterThanOrEqual, lessThan, or lessThanOrEqual so the dependent state is deterministic.`,
    );
  }

  for (const arrayOperator of ["oneOf", "notOneOf"] as const) {
    if (
      arrayOperator in condition &&
      (!Array.isArray(condition[arrayOperator]) ||
        condition[arrayOperator]?.length === 0)
    ) {
      errors.push(
        `${label} ${conditionName}.${arrayOperator} must be a non-empty array.`,
      );
    }
  }

  for (const numericOperator of [
    "greaterThan",
    "greaterThanOrEqual",
    "lessThan",
    "lessThanOrEqual",
  ] as const) {
    if (
      numericOperator in condition &&
      (typeof condition[numericOperator] !== "number" ||
        !Number.isFinite(condition[numericOperator]))
    ) {
      errors.push(
        `${label} ${conditionName}.${numericOperator} must be a finite number.`,
      );
    }
  }

  if (
    !controlTargets.has(condition.target) &&
    !isCanvasSizeTarget(condition.target)
  ) {
    errors.push(
      `${label} ${conditionName} target ${condition.target} does not match another schema control target or canvas size target.`,
    );
  }

  return errors;
}

export function getRequiredToolcraftControlPartCoverage(
  control: ToolcraftControlSchema,
): readonly ToolcraftControlPartCoverage[] {
  switch (control.type) {
    case "anchorGrid":
      return ["anchorGrid.position"];
    case "channelMixer":
      return ["channelMixer.activeChannel", "channelMixer.values"];
    case "curves":
      return control.variant === "single"
        ? ["curves.points"]
        : ["curves.activeChannel", "curves.points"];
    case "fontPicker":
      return [
        "fontPicker.fontId",
        "fontPicker.fontWeight",
        "fontPicker.fontSize",
        "fontPicker.letterSpacing",
        "fontPicker.lineHeight",
        "fontPicker.textCase",
        "fontPicker.color",
        "fontPicker.opacity",
      ];
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

const builtInToolcraftControlTypes = new Set<string>(
  builtInToolcraftControlTypeValues,
);

const requiredCustomControlCoverage: readonly ToolcraftCustomControlCoverage[] = [
  "built-in-gap",
  "kit-primitives",
  "minimal-ui",
  "product-output",
  "runtime-state",
];

function isCustomToolcraftControl(control: ToolcraftControlSchema): boolean {
  return !builtInToolcraftControlTypes.has(control.type);
}

const collectionEntityCustomControlRe =
  /\b(collection|repeatable|list|lists|item|items|entry|entries|row|rows|asset|assets|object|objects|color|colors|swatch|swatches|glyph|glyphs|symbol|symbols|point|points|stop|stops|variant|variants|rule|rules|mask|masks|shape|shapes|layer|layers|media|image|images|file|files)\b/i;
const collectionOperationCustomControlRe =
  /\b(add|adding|delete|deleting|remove|removing|reorder|reordering|order|ordering|sort|sorting|select|selecting|selected|selection|duplicate|duplicating|upload|import|clear|clearing)\b/i;

const actionLikeCustomControlRe =
  /\b(add|adding|delete|deleting|remove|removing|duplicate|duplicating|sort|sorting|normalize|normalizing|clear|clearing|reset|shuffle|randomize|randomizing)\b/i;

const chromeOnlyCustomControlReasonRe =
  /\b(icon|icons|visual|style|styling|layout|spacing|chrome|button|buttons|compact|custom look|custom ui)\b/i;
const productInteractionCustomControlReasonRe =
  /\b(runtime|state|canvas|output|export|upload|import|preview|reorder|ordering|sort|drag|resize|handle|threshold|density|mapping|geometry|nested|multi|multiple|per-item|metadata|hit target|validation|selection)\b/i;
const collectionValueKeyRe =
  /^(items?|entries|rows|assets|objects|colors?|glyphs?|symbols?|points?|stops?|variants?|rules?|masks?|shapes?|layers?|media|images?|files?)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyUnknownForFitCheck(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(stringifyUnknownForFitCheck).join(" ");
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .flatMap(([key, entryValue]) => [key, stringifyUnknownForFitCheck(entryValue)])
      .join(" ");
  }

  return "";
}

function arrayLooksLikeCollectionValue(value: readonly unknown[]): boolean {
  return (
    value.length === 0 ||
    value.some((item) => isRecord(item) || Array.isArray(item) || typeof item === "string")
  );
}

function hasCollectionValueShape(value: unknown): boolean {
  if (!isRecord(value)) {
    return Array.isArray(value) && arrayLooksLikeCollectionValue(value);
  }

  return Object.entries(value).some(([key, entryValue]) => {
    if (Array.isArray(entryValue)) {
      return collectionValueKeyRe.test(key) || arrayLooksLikeCollectionValue(entryValue);
    }

    return collectionValueKeyRe.test(key) && isRecord(entryValue);
  });
}

function getCustomFitCheckSearchText(
  entry: ToolcraftComponentAcceptance,
  control?: ToolcraftControlSchema,
): string {
  return [
    control?.type,
    control?.target,
    typeof control?.label === "string" ? control.label : undefined,
    stringifyUnknownForFitCheck(control?.defaultValue),
    entry.id,
    entry.target,
    entry.componentType,
    entry.expectedObservable,
    entry.userAction,
    entry.builtInFitCheck?.whyInsufficient,
    entry.builtInFitCheck?.productObservable,
  ]
    .filter(Boolean)
    .join(" ");
}

function isCollectionLikeCustomControl(
  entry: ToolcraftComponentAcceptance,
  control: ToolcraftControlSchema,
): boolean {
  if (hasCollectionValueShape(control.defaultValue)) {
    return true;
  }

  const searchText = getCustomFitCheckSearchText(entry, control);

  return (
    collectionEntityCustomControlRe.test(searchText) &&
    collectionOperationCustomControlRe.test(searchText)
  );
}

function getBuiltInFitCheckErrors(
  label: string,
  entry: ToolcraftComponentAcceptance,
  control: ToolcraftControlSchema,
): string[] {
  const fitCheck = entry.builtInFitCheck;

  if (!fitCheck) {
    return [
      `${label} is a custom control and must declare builtInFitCheck with checkedBuiltIns, closestBuiltIn, whyInsufficient, and productObservable.`,
    ];
  }

  const errors: string[] = [];
  const checkedBuiltIns = Array.isArray(fitCheck.checkedBuiltIns)
    ? fitCheck.checkedBuiltIns
    : [];

  if (checkedBuiltIns.length === 0) {
    errors.push(
      `${label} builtInFitCheck.checkedBuiltIns must name at least one checked built-in control.`,
    );
  }

  const unknownCheckedBuiltIns = checkedBuiltIns.filter(
    (builtIn) => !builtInToolcraftControlTypes.has(builtIn),
  );

  if (unknownCheckedBuiltIns.length > 0) {
    errors.push(
      `${label} builtInFitCheck.checkedBuiltIns contains unknown built-in controls: ${unknownCheckedBuiltIns.join(", ")}.`,
    );
  }

  if (
    fitCheck.closestBuiltIn !== "none" &&
    !checkedBuiltIns.includes(fitCheck.closestBuiltIn)
  ) {
    errors.push(
      `${label} builtInFitCheck.closestBuiltIn must be one of the checked built-ins or "none".`,
    );
  }

  if (fitCheck.whyInsufficient.trim().length < 24) {
    errors.push(
      `${label} builtInFitCheck.whyInsufficient must explain why the closest built-in cannot express the product interaction.`,
    );
  }

  if (fitCheck.productObservable.trim().length < 24) {
    errors.push(
      `${label} builtInFitCheck.productObservable must name the product output or side effect that proves the custom control is necessary.`,
    );
  }

  const searchText = getCustomFitCheckSearchText(entry, control);

  if (
    isCollectionLikeCustomControl(entry, control) &&
    !checkedBuiltIns.includes("collectionActions")
  ) {
    errors.push(
      `${label} builtInFitCheck.checkedBuiltIns must include collectionActions when the custom control owns a growable, removable, selectable, or reorderable runtime item set.`,
    );
  }

  if (actionLikeCustomControlRe.test(searchText) && !checkedBuiltIns.includes("actions")) {
    errors.push(
      `${label} builtInFitCheck.checkedBuiltIns must include actions when the custom control exposes local command buttons such as add, remove, delete, duplicate, sort, normalize, or clear.`,
    );
  }

  if (
    chromeOnlyCustomControlReasonRe.test(fitCheck.whyInsufficient) &&
    !productInteractionCustomControlReasonRe.test(fitCheck.whyInsufficient)
  ) {
    errors.push(
      `${label} builtInFitCheck.whyInsufficient cannot justify a custom control only with icons, layout, styling, or custom buttons; name the product interaction or value model that built-ins cannot express.`,
    );
  }

  return errors;
}

function isSliderLikeControl(control: ToolcraftControlSchema): boolean {
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

function getStepPositionCount(control: ToolcraftControlSchema): number | undefined {
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

function getStepMarkerCount(control: ToolcraftControlSchema): number | undefined {
  return getStepPositionCount(control);
}

function isIntegerStepDomain(control: ToolcraftControlSchema): boolean {
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
  control: ToolcraftControlSchema,
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
  control: ToolcraftControlSchema,
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
  control: ToolcraftControlSchema;
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
      `${label} has ${positionCount} semantic integer positions and must use variant "discrete" so Toolcraft renders tick markers.`,
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

function getControlLabelText(control: ToolcraftControlSchema): string {
  return typeof control.label === "string" ? control.label : "";
}

function hasVisibleControlLabel(control: ToolcraftControlSchema): boolean {
  return typeof control.label === "string" && control.label.trim().length > 0;
}

const singleCurveSemanticPattern =
  /\b(acceleration|accel|bend|easing|ease|response|depth|mask|opacity|alpha|motion|velocity|threshold|falloff|remap|remapping)\b|speed\s+profile|mapping\s+curve|curve\s+mapping/i;
const rgbCurveSemanticPattern =
  /\b(rgb|rgba|channel|channels|red|green|blue|color\s*correction|colour\s*correction|color\s*grading|colour\s*grading|color\s*grade|colour\s*grade|color\s*curve|colour\s*curve|tone\s*mapping|hue|saturation|chroma)\b/i;

function getCurveSemanticText(
  controlId: string,
  control: ToolcraftControlSchema,
): string {
  return [
    controlId,
    control.target,
    getControlLabelText(control),
    control.description ?? "",
  ]
    .join(" ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function shouldUseSingleCurveVariant(
  controlId: string,
  control: ToolcraftControlSchema,
): boolean {
  if (control.type !== "curves" || control.variant === "single") {
    return false;
  }

  const text = getCurveSemanticText(controlId, control);

  return singleCurveSemanticPattern.test(text) && !rgbCurveSemanticPattern.test(text);
}

function getToggleControlLabelError(
  control: ToolcraftControlSchema,
  sectionTitle?: string,
): string | undefined {
  if (control.type !== "switch" && control.type !== "checkbox") {
    return undefined;
  }

  const label = getControlLabelText(control).trim();

  if (/^(enable|disable)\b/i.test(label)) {
    return `toggle labels must name the setting context only; use "CRT", "Background", "Glow", or "Loop" instead of "${label}".`;
  }

  if (
    label &&
    sectionTitle &&
    normalizeToolcraftSemanticText(label) ===
      normalizeToolcraftSemanticText(sectionTitle)
  ) {
    return `toggle label "${label}" duplicates section title "${sectionTitle}". Use a shorter contextual label such as "Include" or rename the toggle to a more specific setting.`;
  }

  return undefined;
}

const maxInlineSwitchLabelLength = 16;
const maxInlineSwitchLabelWordCount = 2;

function getInlineSwitchLabelText(
  controlId: string,
  control: ToolcraftControlSchema,
): string {
  if (control.label === false) {
    return "";
  }

  const label = getControlLabelText(control).trim();

  return label || controlId;
}

function isInlineSwitchLabelSafe(
  controlId: string,
  control: ToolcraftControlSchema,
): boolean {
  const label = getInlineSwitchLabelText(controlId, control);

  if (!label) {
    return true;
  }

  const wordCount = label.split(/\s+/u).filter(Boolean).length;

  return label.length <= maxInlineSwitchLabelLength && wordCount <= maxInlineSwitchLabelWordCount;
}

function isBooleanControl(control: ToolcraftControlSchema | undefined): boolean {
  return control?.type === "checkbox" || control?.type === "switch";
}

function controlsShareToolcraftTargetEntity(
  firstControl: ToolcraftControlSchema,
  secondControl: ToolcraftControlSchema,
): boolean {
  const firstPrefix = getToolcraftLooseTargetPrefix(firstControl.target);
  const secondPrefix = getToolcraftLooseTargetPrefix(secondControl.target);

  return Boolean(firstPrefix && firstPrefix === secondPrefix);
}

function sectionHasInlineLayoutGroupForPair(
  section: NonNullable<ResolvedToolcraftAppSchema["panels"]["controls"]>["sections"][number],
  firstControlId: string,
  secondControlId: string,
): boolean {
  return (section.layoutGroups ?? []).some(
    (layoutGroup) =>
      layoutGroup.layout === "inline" &&
      layoutGroup.columns === 2 &&
      layoutGroup.controls.length === 2 &&
      layoutGroup.controls.includes(firstControlId) &&
      layoutGroup.controls.includes(secondControlId),
  );
}

function getControlActions(
  control: ToolcraftControlSchema,
): readonly (ToolcraftActionSchema | string)[] {
  const maybeControlWithActions = control as {
    actions?: readonly (ToolcraftActionSchema | string)[];
  };

  return Array.isArray(maybeControlWithActions.actions)
    ? maybeControlWithActions.actions
    : [];
}

function getTimelineTransportControlText(
  controlId: string,
  control: ToolcraftControlSchema,
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
}: ToolcraftVisibleControl): string {
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
}: ToolcraftVisibleControl): string {
  return [
    sectionTitle ?? "",
    controlId,
    control.target,
    getControlLabelText(control),
  ]
    .join(" ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

function actionLooksLikePngExport(action: ToolcraftActionSchema | string): boolean {
  const text = getActionSearchText(action).replace(/([a-z])([A-Z])/g, "$1 $2");

  return (
    (/\b(export|download)\b/i.test(text) && /\b(png|image)\b/i.test(text)) ||
    /\bexport\.png\b/i.test(text)
  );
}

function actionLooksLikeVideoExport(action: ToolcraftActionSchema | string): boolean {
  const text = getActionSearchText(action).replace(/([a-z])([A-Z])/g, "$1 $2");

  return (
    (/\b(export|download)\b/i.test(text) && /\b(video|mp4|webm|mov)\b/i.test(text)) ||
    /\bexport\.video\b/i.test(text)
  );
}

function schemaHasPngExportPanelAction(schema: ResolvedToolcraftAppSchema): boolean {
  return (schema.panels.controls?.sections ?? []).some((section) =>
    Object.values(section.controls).some(
      (control) =>
        control.type === "panelActions" &&
        getControlActions(control).some(actionLooksLikePngExport),
    ),
  );
}

function schemaHasVideoExportPanelAction(schema: ResolvedToolcraftAppSchema): boolean {
  return (schema.panels.controls?.sections ?? []).some((section) =>
    Object.values(section.controls).some(
      (control) =>
        control.type === "panelActions" &&
        getControlActions(control).some(actionLooksLikeVideoExport),
    ),
  );
}

function getFirstPanelActionsSectionIndex(schema: ResolvedToolcraftAppSchema): number {
  return (schema.panels.controls?.sections ?? []).findIndex((section) =>
    Object.values(section.controls).some((control) => control.type === "panelActions"),
  );
}

function getSchemaControlsSectionByTitle(
  schema: ResolvedToolcraftAppSchema,
  title: string,
): NonNullable<ResolvedToolcraftAppSchema["panels"]["controls"]>["sections"][number] | undefined {
  const normalizedTitle = normalizeToolcraftSemanticText(title);

  return (schema.panels.controls?.sections ?? []).find(
    (section) => normalizeToolcraftSemanticText(section.title) === normalizedTitle,
  );
}

function getSchemaControlsSectionIndexByTitle(
  schema: ResolvedToolcraftAppSchema,
  title: string,
): number {
  const normalizedTitle = normalizeToolcraftSemanticText(title);

  return (schema.panels.controls?.sections ?? []).findIndex(
    (section) => normalizeToolcraftSemanticText(section.title) === normalizedTitle,
  );
}

function getSectionControlEntryByTarget(
  section:
    | NonNullable<ResolvedToolcraftAppSchema["panels"]["controls"]>["sections"][number]
    | undefined,
  target: string,
): readonly [string, ToolcraftControlSchema] | undefined {
  if (!section) {
    return undefined;
  }

  return Object.entries(section.controls).find(([, control]) => control.target === target);
}

function schemaHasOutputBackgroundColorControl(
  controls: readonly ToolcraftVisibleControl[],
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
  controls: readonly ToolcraftVisibleControl[],
): boolean {
  return controls.some(isOutputBackgroundToggleControl);
}

function isOutputBackgroundToggleControl(visibleControl: ToolcraftVisibleControl): boolean {
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

function getOutputBackgroundColorEntry(
  section:
    | NonNullable<ResolvedToolcraftAppSchema["panels"]["controls"]>["sections"][number]
    | undefined,
): readonly [string, ToolcraftControlSchema] | undefined {
  if (!section) {
    return undefined;
  }

  return Object.entries(section.controls).find(([controlId, control]) => {
    if (control.type !== "color") {
      return false;
    }

    return /\b(background|backdrop|scene|canvas)\b/i.test(
      [section.title, controlId, control.target, getControlLabelText(control)]
        .join(" ")
        .replace(/([a-z])([A-Z])/g, "$1 $2"),
    );
  });
}

function sectionHasEqualWidthOutputBackgroundRow(
  section:
    | NonNullable<ResolvedToolcraftAppSchema["panels"]["controls"]>["sections"][number]
    | undefined,
  toggleControlId: string | undefined,
  colorControlId: string | undefined,
): boolean {
  if (!section || !toggleControlId || !colorControlId) {
    return false;
  }

  return (section.layoutGroups ?? []).some(
    (layoutGroup) =>
      layoutGroup.layout === "inline" &&
      layoutGroup.columns === 2 &&
      layoutGroup.controls.length === 2 &&
      layoutGroup.controls[0] === toggleControlId &&
      layoutGroup.controls[1] === colorControlId,
  );
}

const SEGMENTED_CONTROL_MAX_OPTIONS = 4;
const SEGMENTED_CONTROL_MAX_OPTION_LABEL_LENGTH = 9;
const SEGMENTED_CONTROL_MAX_TOTAL_LABEL_LENGTH = 24;

function getSegmentedControlLayoutError(
  control: ToolcraftControlSchema,
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
} satisfies Record<ToolcraftControlOrderRole, number>;

const requiredReferenceCloneCoverage = [
  "canvas-sizing",
  "control-mapping",
  "renderer-state",
] satisfies readonly ToolcraftReferenceCoverage[];

const referenceTransportCoverage = new Set<ToolcraftReferenceCoverage>([
  "export-at-time",
  "pause-resume",
  "restart",
  "time-progress",
]);

const toolcraftReferenceTimelineCoverage = new Set<ToolcraftReferenceTimelineCoverage>([
  "duration",
  "export-at-time",
  "keyframes",
  "loop",
  "playback",
  "restart",
  "scrub",
  "time-progress",
]);

const customReferenceTimelineCoverage = new Set<ToolcraftReferenceTimelineCoverage>([
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
] satisfies readonly ToolcraftAutonomousAnimationCoverage[];

const requiredLayerCoverage = [
  "selection",
  "visibility",
  "reorder",
  "grouping",
] satisfies readonly ToolcraftLayerCoverage[];

const requiredTimelinePlaybackCoverage = [
  "pause-resume",
  "scrub",
  "duration",
  "loop",
  "rendered-frame",
] satisfies readonly ToolcraftTimelinePlaybackCoverage[];

function isModeSelectorControl(
  controlId: string,
  control: ToolcraftControlSchema,
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
  control: ToolcraftControlSchema,
  pattern: RegExp,
): boolean {
  return pattern.test(`${controlId} ${control.target} ${getControlLabelText(control)}`);
}

export function inferToolcraftControlOrderRole(
  controlId: string,
  control: ToolcraftControlSchema,
): ToolcraftControlOrderRole {
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

function getToolcraftControlOrderErrors(schema: ResolvedToolcraftAppSchema): string[] {
  const errors: string[] = [];

  for (const section of schema.panels.controls?.sections ?? []) {
    let previousItem: ToolcraftControlOrderItem | undefined;

    for (const [controlId, control] of Object.entries(section.controls)) {
      if (control.type === "panelActions") {
        continue;
      }

      const role = inferToolcraftControlOrderRole(controlId, control);
      const item: ToolcraftControlOrderItem = {
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

const weakControlLabelContextSectionTitlePattern =
  /^(appearance|look|looks|properties?|style|styles|values?|visuals?)$/i;

const broadControlSectionTitlePattern =
  /^(animation|export|flow|icon|logo|motion|output|scene|shape|shapes|text|typography|visual|visuals)$/i;

const genericControlLabelPattern =
  /^(angle|amount|blur|brightness|color|contrast|count|density|depth|frequency|height|hue|intensity|offset|opacity|phase|position|quality|radius|rotation|saturation|scale|size|spacing|speed|strength|threshold|tint|width)$/i;

const maxPreferredControlsPerSection = 7;
const maxHardControlsPerSection = 10;

const controlSemanticClusterPatterns: ReadonlyArray<readonly [string, RegExp]> = [
  ["input", /\b(upload|source|prompt|content|text|phrase|copy|message|file|media|image)\b/i],
  ["mode", /\b(mode|type|preset|style|variant|blend|filter|layout|format|quality)\b/i],
  ["motion", /\b(animation|speed|velocity|accel|acceleration|correlation|duration|timing|loop|phase|fps|rate)\b/i],
  ["geometry", /\b(width|height|size|scale|position|offset|anchor|origin|target|radius|distance|spread|bend|curve|curves|path|shape|grid|gap)\b/i],
  ["density", /\b(fill|density|amount|count|ratio|word|words|letter|letters|particle|particles|layer|layers|island|islands)\b/i],
  ["color", /\b(color|colour|gradient|shade|tint|background|halo|glow|opacity|alpha|stroke|fillColor|fillOpacity)\b/i],
  ["typography", /\b(font|weight|case|leading|tracking|lineHeight|letterSpacing|typeface)\b/i],
  ["export", /\b(export|copy|download|video|png|webm|mp4|mov|bitrate|resolution)\b/i],
];

const fontPickerOwnedTypographyPartLabels = new Map<string, string>([
  ["case", "case"],
  ["color", "color"],
  ["colour", "color"],
  ["family", "font family"],
  ["fill", "color"],
  ["fillcolor", "color"],
  ["fillopacity", "opacity"],
  ["font", "font family"],
  ["fontcolor", "color"],
  ["fontfamily", "font family"],
  ["fontid", "font family"],
  ["fontsize", "font size"],
  ["fontweight", "font weight"],
  ["foreground", "color"],
  ["foregroundcolor", "color"],
  ["leading", "line height"],
  ["letterspacing", "letter spacing"],
  ["lineheight", "line height"],
  ["opacity", "opacity"],
  ["size", "font size"],
  ["textcase", "case"],
  ["textcolor", "color"],
  ["textfill", "color"],
  ["textopacity", "opacity"],
  ["tracking", "letter spacing"],
  ["typeface", "font family"],
  ["weight", "font weight"],
]);

const fontPickerDescriptionOwnedPartPatterns: ReadonlyArray<readonly [string, RegExp]> = [
  ["font family", /\b(?:font\s+family|family|typeface)\b/i],
  ["font weight", /\b(?:font\s+weight|weight)\b/i],
  ["font size", /\b(?:font\s+size|size)\b/i],
  ["case", /\b(?:text\s+case|case|uppercase|lowercase|capitalize|title\s+case)\b/i],
  ["color", /\b(?:text\s+color|font\s+color|color|colour|fill)\b/i],
  ["opacity", /\b(?:text\s+opacity|font\s+opacity|opacity|alpha)\b/i],
  ["letter spacing", /\b(?:letter\s+spacing|tracking)\b/i],
  ["line height", /\b(?:line\s+height|leading)\b/i],
];

function getToolcraftSectionLabel(sectionTitle: string | undefined, sectionIndex: number): string {
  return sectionTitle?.trim() || `untitled section ${sectionIndex + 1}`;
}

function humanizeToolcraftLabelPart(value: string): string {
  const text = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return "";
  }

  return text.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function lowerCaseToolcraftLabelStart(value: string): string {
  return value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value;
}

function normalizeToolcraftSemanticText(value: string | undefined): string {
  return humanizeToolcraftLabelPart(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getToolcraftTargetParts(target: string): string[] {
  return target.split(".").filter(Boolean);
}

function getToolcraftTargetProperty(target: string): string {
  return getToolcraftTargetParts(target).at(-1) ?? "";
}

function getToolcraftStrictTargetPrefix(target: string): string | null {
  const parts = getToolcraftTargetParts(target);

  if (parts.length < 3) {
    return null;
  }

  const prefix = parts.slice(0, -1).join(".");

  if (prefix === "canvas.size") {
    return null;
  }

  return prefix;
}

function getToolcraftLooseTargetPrefix(target: string): string | null {
  const parts = getToolcraftTargetParts(target);

  if (parts.length < 2) {
    return null;
  }

  const prefix = parts.slice(0, -1).join(".");

  if (prefix === "canvas.size") {
    return null;
  }

  return prefix;
}

function isToolcraftWeakSectionContext(sectionTitle: string | undefined): boolean {
  if (!sectionTitle) {
    return true;
  }

  return (
    genericControlSectionTitlePattern.test(sectionTitle) ||
    controlTypeSectionTitlePattern.test(sectionTitle) ||
    weakControlLabelContextSectionTitlePattern.test(sectionTitle)
  );
}

function doesToolcraftSectionMatchTarget(
  sectionTitle: string | undefined,
  target: string,
): boolean {
  const sectionText = normalizeToolcraftSemanticText(sectionTitle);

  if (!sectionText) {
    return false;
  }

  return getToolcraftTargetParts(target).some((part) => {
    const targetText = normalizeToolcraftSemanticText(part);
    return (
      targetText.length > 0 &&
      (targetText === sectionText ||
        targetText.includes(sectionText) ||
        sectionText.includes(targetText))
    );
  });
}

function getToolcraftSuggestedControlLabel(
  control: ToolcraftControlSchema,
  sectionTitle: string | undefined,
): string {
  const label = getControlLabelText(control).trim();
  const targetProperty = humanizeToolcraftLabelPart(control.target.split(".").at(-1) ?? "");
  const normalizedLabel = normalizeToolcraftSemanticText(label);
  const normalizedTargetProperty = normalizeToolcraftSemanticText(targetProperty);

  if (
    label &&
    normalizedTargetProperty &&
    normalizedTargetProperty !== normalizedLabel &&
    normalizedTargetProperty.endsWith(normalizedLabel)
  ) {
    return targetProperty;
  }

  const property = label || targetProperty;
  const loosePrefix = getToolcraftLooseTargetPrefix(control.target);
  const prefixParts = loosePrefix ? getToolcraftTargetParts(loosePrefix) : [];
  const prefixEntity = humanizeToolcraftLabelPart(prefixParts.at(-1) ?? "");
  const sectionEntity =
    sectionTitle && !isToolcraftWeakSectionContext(sectionTitle)
      ? humanizeToolcraftLabelPart(sectionTitle)
      : "";
  const entity = prefixEntity || sectionEntity;

  if (!entity) {
    return property;
  }

  const normalizedEntity = normalizeToolcraftSemanticText(entity);
  const normalizedProperty = normalizeToolcraftSemanticText(property);

  if (normalizedEntity && normalizedProperty.includes(normalizedEntity)) {
    return property;
  }

  return `${entity} ${lowerCaseToolcraftLabelStart(property)}`;
}

function getToolcraftFontPickerOwnedTypographyPart(
  control: ToolcraftControlSchema,
): string | undefined {
  if (control.type === "fontPicker") {
    return undefined;
  }

  const normalizedCandidates = [
    getToolcraftTargetProperty(control.target),
    getControlLabelText(control),
  ].map(normalizeToolcraftSemanticText);

  for (const candidate of normalizedCandidates) {
    const ownedPart = fontPickerOwnedTypographyPartLabels.get(candidate);

    if (ownedPart) {
      return ownedPart;
    }
  }

  return undefined;
}

function getToolcraftControlSemanticCluster(
  controlId: string,
  control: ToolcraftControlSchema,
): string {
  const text = [
    controlId,
    getToolcraftTargetProperty(control.target),
    getControlLabelText(control),
    control.description ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  for (const [cluster, pattern] of controlSemanticClusterPatterns) {
    if (pattern.test(text)) {
      return cluster;
    }
  }

  return inferToolcraftControlOrderRole(controlId, control);
}

function getToolcraftGenericControlLabelError({
  control,
  controlId,
  sectionLabel,
  sectionLoosePrefixCount,
  sectionTitle,
}: {
  control: ToolcraftControlSchema;
  controlId: string;
  sectionLabel: string;
  sectionLoosePrefixCount: number;
  sectionTitle: string | undefined;
}): string | undefined {
  const label = getControlLabelText(control).trim();

  if (!genericControlLabelPattern.test(label)) {
    return undefined;
  }

  const hasWeakContext =
    isToolcraftWeakSectionContext(sectionTitle) ||
    (sectionLoosePrefixCount > 1 &&
      !doesToolcraftSectionMatchTarget(sectionTitle, control.target));

  if (!hasWeakContext) {
    return undefined;
  }

  const suggestedLabel = getToolcraftSuggestedControlLabel(control, sectionTitle);

  return `${sectionLabel} / ${controlId} label "${label}" is too generic in this context. Short labels are allowed when the nearest visible section or group clearly names the affected product entity. Rename it to "${suggestedLabel}".`;
}

function getToolcraftControlDescriptionError({
  control,
  controlId,
  sectionLabel,
  sectionTitle,
}: {
  control: ToolcraftControlSchema;
  controlId: string;
  sectionLabel: string;
  sectionTitle: string | undefined;
}): string | undefined {
  const description = control.description?.trim();

  if (!description) {
    return undefined;
  }

  const label = getControlLabelText(control).trim();

  if (
    isToolcraftObviousColorSectionControlDescription({
      control,
      description,
      label,
      sectionTitle,
    })
  ) {
    return `${sectionLabel} / ${controlId} description adds a help icon to an obvious color-section control. Omit control.description when the section title and visible label already explain the setting.`;
  }

  if (control.type !== "fontPicker") {
    return undefined;
  }

  const repeatedParts = fontPickerDescriptionOwnedPartPatterns
    .filter(([, pattern]) => pattern.test(description))
    .map(([part]) => part);

  if (repeatedParts.length < 2) {
    return undefined;
  }

  return `${sectionLabel} / ${controlId} description repeats FontPicker-owned fields (${repeatedParts.join(", ")}). FontPicker help must explain only non-obvious product behavior; use section titles and visible field labels for font family, weight, size, case, color, opacity, letter spacing, and line height, or omit description.`;
}

function isToolcraftColorSectionTitle(sectionTitle: string | undefined): boolean {
  return /\b(colou?rs?|palette|palettes|shades?|accents?)\b/i.test(
    sectionTitle ?? "",
  );
}

function isToolcraftSequentialColorLabel(label: string): boolean {
  return /^colou?r\s+\d+$/i.test(label.trim());
}

function isToolcraftPaletteVariationTarget(target: string): boolean {
  return (
    /(?:^|\.)(?:palette|palettes|colou?rs?|shades?|accents?)\b/i.test(
      target,
    ) || /(?:^|\.)(?:accent|shade|colou?r)\d+\b/i.test(target)
  );
}

function isToolcraftSimplePaletteDistributionLabel(label: string): boolean {
  return /^(spread|mix|distribution)$/i.test(label.trim());
}

function isToolcraftGenericControlHelpDescription(description: string): boolean {
  return /^(adjusts?|changes?|chooses?|controls?|defines?|selects?|sets?|updates?)\b/i.test(
    description.trim(),
  );
}

function isToolcraftObviousColorSectionControlDescription({
  control,
  description,
  label,
  sectionTitle,
}: {
  control: ToolcraftControlSchema;
  description: string;
  label: string;
  sectionTitle: string | undefined;
}): boolean {
  if (!isToolcraftColorSectionTitle(sectionTitle)) {
    return false;
  }

  if (
    (control.type === "color" || control.type === "colorOpacity") &&
    isToolcraftSequentialColorLabel(label)
  ) {
    return true;
  }

  return (
    isToolcraftSimplePaletteDistributionLabel(label) &&
    isToolcraftGenericControlHelpDescription(description)
  );
}

function getToolcraftColorBankLabelErrors({
  controls,
  sectionLabel,
  sectionTitle,
}: {
  controls: readonly [string, ToolcraftControlSchema][];
  sectionLabel: string;
  sectionTitle: string | undefined;
}): string[] {
  const colorControls = controls.filter(([, control]) => {
    if (control.type !== "color" && control.type !== "colorOpacity") {
      return false;
    }

    return true;
  });

  if (colorControls.length < 2) {
    return [];
  }

  const loosePrefixes = new Set(
    colorControls
      .map(([, control]) => getToolcraftLooseTargetPrefix(control.target))
      .filter((prefix): prefix is string => Boolean(prefix)),
  );

  if (loosePrefixes.size !== 1) {
    return [];
  }

  const sequentialColorControls = colorControls.filter(([, control]) =>
    isToolcraftSequentialColorLabel(getControlLabelText(control)),
  );
  const isPaletteVariationBank =
    colorControls.every(([, control]) =>
      isToolcraftPaletteVariationTarget(control.target),
    ) ||
    (isToolcraftColorSectionTitle(sectionTitle) &&
      sequentialColorControls.length > 0);

  if (!isPaletteVariationBank) {
    return [];
  }

  const visibleColorControls = colorControls.filter(([, control]) =>
    hasVisibleControlLabel(control),
  );
  const errors: string[] = [];

  if (
    visibleColorControls.length > 0 &&
    visibleColorControls.length < colorControls.length
  ) {
    errors.push(
      `${sectionLabel} mixes labeled and unlabeled color items in one palette variation group. Decide label visibility for the whole group: omit all per-item labels when colors only add variety, or label every item only when each color has a distinct user-facing role.`,
    );
  }

  for (const [controlId, control] of sequentialColorControls) {
    const label = getControlLabelText(control).trim();

    errors.push(
      `${sectionLabel} / ${controlId} uses visible label "${label}" for a palette variation color. When colors only add variety to one shared palette, set label: false or use collectionActions with unlabeled items. Keep visible labels only when each color edits a distinct user-facing entity such as Fill, Stroke, Background, Connector, or Object color.`,
    );
  }

  return errors;
}

function getToolcraftControlSectionGroupingErrors(
  schema: ResolvedToolcraftAppSchema,
): string[] {
  const errors: string[] = [];
  const visibleControls: Array<{
    control: ToolcraftControlSchema;
    controlId: string;
    loosePrefix: string | null;
    sectionLabel: string;
  }> = [];
  const strictPrefixSections = new Map<string, Set<string>>();
  const loosePrefixSections = new Map<string, Set<string>>();
  const colorSectionLoosePrefixes = new Map<string, string>();
  const sectionTitleCounts = new Map<string, { count: number; label: string }>();

  for (const [sectionIndex, section] of (schema.panels.controls?.sections ?? []).entries()) {
    const sectionTitle = section.title?.trim();
    const sectionLabel = getToolcraftSectionLabel(sectionTitle, sectionIndex);
    const controls = Object.entries(section.controls).filter(
      ([, control]) => control.type !== "panelActions",
    );

    if (controls.length === 0) {
      continue;
    }

    if (!sectionTitle) {
      errors.push(
        `${sectionLabel} is missing a controls section title. Every visible controls-panel section must name the product entity, workflow stage, or behavior it edits.`,
      );
    }

    if (sectionTitle) {
      const normalizedSectionTitle = normalizeToolcraftSemanticText(sectionTitle);
      const titleCount = sectionTitleCounts.get(normalizedSectionTitle);
      sectionTitleCounts.set(normalizedSectionTitle, {
        count: (titleCount?.count ?? 0) + 1,
        label: titleCount?.label ?? sectionTitle,
      });
    }

    if (sectionTitle && genericControlSectionTitlePattern.test(sectionTitle)) {
      errors.push(
        `${sectionLabel} is too generic for a controls section. Name the product entity, workflow stage, or behavior it edits instead of using a bucket title.`,
      );
    }

    if (sectionTitle && controlTypeSectionTitlePattern.test(sectionTitle)) {
      errors.push(
        `${sectionLabel} names a UI control type instead of the product entity. Group controls by product meaning, not by Slider, Color, Input, Button, or similar component type.`,
      );
    }

    const sectionLoosePrefixes = new Set(
      controls
        .map(([, control]) => getToolcraftLooseTargetPrefix(control.target))
        .filter((prefix): prefix is string => Boolean(prefix)),
    );
    const productControls = controls.filter(
      ([, control]) =>
        control.type !== "settingsTransfer" &&
        control.target !== "canvas.size.width" &&
        control.target !== "canvas.size.height",
    );
    const semanticClusters = new Set(
      productControls.map(([controlId, control]) =>
        getToolcraftControlSemanticCluster(controlId, control),
      ),
    );
    const clusterList = [...semanticClusters].join(", ");
    const hasBroadSectionTitle =
      sectionTitle !== undefined && broadControlSectionTitlePattern.test(sectionTitle);

    if (
      productControls.length > maxPreferredControlsPerSection &&
      hasBroadSectionTitle &&
      semanticClusters.size >= 3
    ) {
      errors.push(
        `${sectionLabel} has ${productControls.length} controls across multiple semantic clusters (${clusterList}). Broad section titles are only valid for small cohesive groups; split this into discrete sections with specific titles such as motion, geometry, density, color, typography, or export sub-entities.`,
      );
    }

    if (productControls.length > maxHardControlsPerSection && semanticClusters.size > 1) {
      errors.push(
        `${sectionLabel} has ${productControls.length} controls across ${semanticClusters.size} semantic clusters (${clusterList}). Controls-panel sections should stay discrete; split sections that grow past ${maxHardControlsPerSection} controls unless every control edits one tightly scoped entity.`,
      );
    }

    errors.push(
      ...getToolcraftColorBankLabelErrors({
        controls,
        sectionLabel,
        sectionTitle,
      }),
    );

    for (const [controlId, control] of controls) {
      const strictPrefix = getToolcraftStrictTargetPrefix(control.target);
      const loosePrefix = getToolcraftLooseTargetPrefix(control.target);
      const genericLabelError = getToolcraftGenericControlLabelError({
        control,
        controlId,
        sectionLabel,
        sectionLoosePrefixCount: sectionLoosePrefixes.size,
        sectionTitle,
      });

      if (genericLabelError) {
        errors.push(genericLabelError);
      }

      const descriptionError = getToolcraftControlDescriptionError({
        control,
        controlId,
        sectionLabel,
        sectionTitle,
      });

      if (descriptionError) {
        errors.push(descriptionError);
      }

      visibleControls.push({
        control,
        controlId,
        loosePrefix,
        sectionLabel,
      });

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

  for (const { count, label } of sectionTitleCounts.values()) {
    if (count > 1) {
      errors.push(
        `Controls panel repeats the section title "${label}" ${count} times. Section titles must be unique and describe distinct product entities or workflow stages.`,
      );
    }
  }

  const fontPickerControls = visibleControls.filter(
    (item) => item.control.type === "fontPicker" && item.loosePrefix,
  );

  for (const item of visibleControls) {
    if (!item.loosePrefix || item.control.type === "fontPicker") {
      continue;
    }

    const ownedTypographyPart =
      getToolcraftFontPickerOwnedTypographyPart(item.control);

    if (!ownedTypographyPart) {
      continue;
    }

    const owningFontPicker = fontPickerControls.find(
      (fontPicker) => fontPicker.loosePrefix === item.loosePrefix,
    );

    if (!owningFontPicker) {
      continue;
    }

    const label = getControlLabelText(item.control).trim() || item.controlId;

    errors.push(
      `${item.sectionLabel} / ${item.controlId} splits "${label}" out of the FontPicker-owned typography block for "${item.loosePrefix}". Keep font family, weight, size, case, letter spacing, line height, color, and opacity in the same fontPicker value.`,
    );
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
        `${colorControlLabel} is separated from other "${prefix}" controls. A color that configures the same product entity belongs inside that entity section with a concise field label that stays unambiguous in context.`,
      );
    }
  }

  return errors;
}

export function collectToolcraftVisibleControls(
  schema: ResolvedToolcraftAppSchema = appSchema,
): ToolcraftVisibleControl[] {
  return (schema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.entries(section.controls).map(([controlId, control]) => ({
      control,
      controlId,
      sectionTitle: section.title,
    })),
  );
}

export function collectToolcraftKeyframeableControls(
  schema: ResolvedToolcraftAppSchema = appSchema,
): ToolcraftVisibleControl[] {
  return collectToolcraftVisibleControls(schema).filter(
    ({ control }) => getToolcraftControlKeyframeCapability(control).capable,
  );
}

export function getToolcraftControlOrder(
  schema: ResolvedToolcraftAppSchema = appSchema,
): ToolcraftControlOrderItem[] {
  return (schema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.entries(section.controls)
      .filter(([, control]) => control.type !== "panelActions")
      .map(([controlId, control]) => {
        const role = inferToolcraftControlOrderRole(controlId, control);

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

export function getToolcraftControlOrderTargets(
  schema: ResolvedToolcraftAppSchema = appSchema,
): string[] {
  return getToolcraftControlOrder(schema).map((item) => item.target);
}

export function validateToolcraftAcceptanceCoverage(
  schema: ResolvedToolcraftAppSchema = appSchema,
  acceptance: readonly ToolcraftComponentAcceptance[] = appAcceptance,
  transferMode: ToolcraftTransferMode =
    schema === appSchema ? appTransferMode : { animationIntent: { mode: "none" }, mode: "new-toolcraft-app" },
): string[] {
  const errors: string[] = [];
  const controls = collectToolcraftVisibleControls(schema);
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

  errors.push(...getToolcraftControlOrderErrors(schema));
  errors.push(...getToolcraftControlSectionGroupingErrors(schema));

  for (const [sectionIndex, section] of (schema.panels.controls?.sections ?? []).entries()) {
    const sectionLabel = getToolcraftSectionLabel(section.title, sectionIndex);

    for (const layoutGroup of section.layoutGroups ?? []) {
      if (layoutGroup.layout !== "inline") {
        continue;
      }

      const rangeSliderIds = layoutGroup.controls.filter(
        (controlId) => section.controls[controlId]?.type === "rangeSlider",
      );

      if (rangeSliderIds.length > 0) {
        errors.push(
          `${sectionLabel} layoutGroups inline row "${layoutGroup.controls.join(", ")}" includes rangeSlider ${rangeSliderIds.join(", ")}. RangeSlider is a full-width two-thumb control and must not share a row with another slider or range slider.`,
        );
      }

      const switchEntries = layoutGroup.controls
        .map((controlId) => [controlId, section.controls[controlId]] as const)
        .filter(
          (entry): entry is readonly [string, ToolcraftControlSchema] =>
            Boolean(entry[1]) && entry[1].type === "switch",
        );
      const booleanEntries = layoutGroup.controls
        .map((controlId) => [controlId, section.controls[controlId]] as const)
        .filter(
          (entry): entry is readonly [string, ToolcraftControlSchema] =>
            Boolean(entry[1]) && isBooleanControl(entry[1]),
        );
      const parameterEntries = layoutGroup.controls
        .map((controlId) => [controlId, section.controls[controlId]] as const)
        .filter(
          (entry): entry is readonly [string, ToolcraftControlSchema] =>
            Boolean(entry[1]) && !isBooleanControl(entry[1]),
        );

      if (switchEntries.length > 1) {
        const unsafeSwitchLabels = switchEntries.filter(
          ([controlId, control]) => !isInlineSwitchLabelSafe(controlId, control),
        );

        if (unsafeSwitchLabels.length > 0) {
          errors.push(
            `${sectionLabel} layoutGroups inline row "${layoutGroup.controls.join(", ")}" includes switch labels ${unsafeSwitchLabels.map(([controlId, control]) => `${controlId} "${getInlineSwitchLabelText(controlId, control)}"`).join(", ")} that are too long for a two-column toggle row. Switches share a row only when every visible label fits without truncation; shorten labels or stack them.`,
          );
        }
      }

      if (booleanEntries.length === 1 && parameterEntries.length === 1) {
        const unsafeBooleanLabels = booleanEntries.filter(
          ([controlId, control]) => !isInlineSwitchLabelSafe(controlId, control),
        );

        if (unsafeBooleanLabels.length > 0) {
          errors.push(
            `${sectionLabel} layoutGroups inline row "${layoutGroup.controls.join(", ")}" includes toggle label ${unsafeBooleanLabels.map(([controlId, control]) => `${controlId} "${getInlineSwitchLabelText(controlId, control)}"`).join(", ")} that is too long for a compact toggle-plus-parameter row. Keep the toggle label short, such as "Include" inside Background, or stack the controls.`,
          );
        }
      }
    }

    const sectionControls = Object.entries(section.controls).filter(
      ([, control]) => control.type !== "panelActions",
    );

    for (let index = 0; index < sectionControls.length - 1; index += 1) {
      const [firstControlId, firstControl] = sectionControls[index] ?? [];
      const [secondControlId, secondControl] = sectionControls[index + 1] ?? [];

      if (
        !firstControlId ||
        !secondControlId ||
        !firstControl ||
        !secondControl ||
        firstControl.visibleWhen ||
        secondControl.visibleWhen ||
        !isBooleanControl(firstControl) ||
        !isBooleanControl(secondControl) ||
        !isInlineSwitchLabelSafe(firstControlId, firstControl) ||
        !isInlineSwitchLabelSafe(secondControlId, secondControl) ||
        !controlsShareToolcraftTargetEntity(firstControl, secondControl) ||
        sectionHasInlineLayoutGroupForPair(section, firstControlId, secondControlId)
      ) {
        continue;
      }

      errors.push(
        `${sectionLabel} has adjacent short toggle controls "${firstControlId}" and "${secondControlId}" for the same product entity "${getToolcraftLooseTargetPrefix(firstControl.target)}". Put them in a two-column inline layoutGroup so compact paired toggles share one row.`,
      );
    }
  }

  if (schemaHasPngExportPanelAction(schema)) {
    const backgroundSection = getSchemaControlsSectionByTitle(schema, "Background");
    const backgroundSectionIndex = getSchemaControlsSectionIndexByTitle(schema, "Background");
    const panelActionsSectionIndex = getFirstPanelActionsSectionIndex(schema);
    const imageExportSectionIndex = getSchemaControlsSectionIndexByTitle(schema, "Image Export");
    const videoExportSectionIndex = getSchemaControlsSectionIndexByTitle(schema, "Video Export");
    const hasVideoExportAction = schemaHasVideoExportPanelAction(schema);
    const expectedOutputSettingsIndex =
      imageExportSectionIndex >= 0 ? imageExportSectionIndex : videoExportSectionIndex;
    const finalExportSettingsIndex = hasVideoExportAction
      ? videoExportSectionIndex
      : imageExportSectionIndex;
    const includeBackgroundEntry = getSectionControlEntryByTarget(
      backgroundSection,
      "export.includeBackground",
    );
    const backgroundColorEntry = getOutputBackgroundColorEntry(backgroundSection);
    const imageExportSection = getSchemaControlsSectionByTitle(schema, "Image Export");
    const imageFormatEntry = getSectionControlEntryByTarget(
      imageExportSection,
      "export.image.format",
    );
    const imageResolutionEntry = getSectionControlEntryByTarget(
      imageExportSection,
      "export.image.resolution",
    );
    const imageFormatControl = imageFormatEntry?.[1];
    const imageResolutionControl = imageResolutionEntry?.[1];
    const imageFormatOptionValues =
      imageFormatControl?.options?.map((option) => option.value.toLowerCase()) ?? [];
    const imageResolutionOptionValues =
      imageResolutionControl?.options?.map((option) => option.value.toLowerCase()) ?? [];

    if (!backgroundSection) {
      errors.push(
        'Product apps with Export PNG must expose a separate controls section titled "Background" directly before the first export settings section.',
      );
    }

    if (
      backgroundSectionIndex >= 0 &&
      expectedOutputSettingsIndex >= 0 &&
      backgroundSectionIndex !== expectedOutputSettingsIndex - 1
    ) {
      errors.push(
        'The "Background" controls section must sit directly before the first export settings section: Image Export when PNG export exists, otherwise Video Export.',
      );
    }

    if (
      finalExportSettingsIndex >= 0 &&
      panelActionsSectionIndex >= 0 &&
      finalExportSettingsIndex !== panelActionsSectionIndex - 1
    ) {
      errors.push(
        'Export settings must sit directly above sticky footer actions: Image Export for still apps, or Video Export after Image Export for animated apps.',
      );
    }

    if (
      hasVideoExportAction &&
      imageExportSectionIndex >= 0 &&
      videoExportSectionIndex >= 0 &&
      imageExportSectionIndex !== videoExportSectionIndex - 1
    ) {
      errors.push(
        'Animated apps with both Export PNG and Export Video must place Image Export immediately before Video Export.',
      );
    }

    if (!schemaHasOutputBackgroundColorControl(controls)) {
      errors.push(
        "Product apps with Export PNG must expose a user-facing background color control such as appearance.background or scene.background. Preview, PNG export, and video export must read that runtime value instead of hardcoding the product background.",
      );
    }

    if (!backgroundColorEntry) {
      errors.push(
        'The "Background" section must contain the renderer-owned background color control, such as appearance.background or scene.background.',
      );
    } else {
      const [, backgroundColorControl] = backgroundColorEntry;

      if (backgroundColorControl.label !== false) {
        errors.push(
          'The background color control inside the required "Background" section must use label false; the section title already supplies the visible context.',
        );
      }
    }

    if (!schemaHasOutputBackgroundToggleControl(controls)) {
      errors.push(
        'Product apps with Export PNG must expose export.includeBackground inside the required "Background" section as a Switch labeled "Include". PNG export must pass that runtime value to createToolcraftPngExportCanvas includeBackground; live preview must use shouldIncludeToolcraftPreviewBackground(state); video export keeps the background.',
      );
    }

    if (!includeBackgroundEntry) {
      errors.push(
        'The "Background" section must contain export.includeBackground as the Include switch.',
      );
    } else {
      const [, includeBackgroundControl] = includeBackgroundEntry;

      if (includeBackgroundControl.type !== "switch") {
        errors.push('export.includeBackground must be a Switch control labeled "Include".');
      }

      if (getControlLabelText(includeBackgroundControl) !== "Include") {
        errors.push(
          'export.includeBackground must use the short visible label "Include"; the Background section title already supplies the rest of the context.',
        );
      }
    }

    if (
      !sectionHasEqualWidthOutputBackgroundRow(
        backgroundSection,
        includeBackgroundEntry?.[0],
        backgroundColorEntry?.[0],
      )
    ) {
      errors.push(
        'The "Background" section must render export.includeBackground and the background color in one two-column inline layoutGroup, with Include on the left and the unlabeled background color on the right.',
      );
    }

    if (!imageExportSection) {
      errors.push(
        'Apps with Export PNG must expose image export settings in a separate controls section titled "Image Export" directly above sticky footer export actions or directly before "Video Export" when video export also exists.',
      );
    }

    if (!imageFormatControl) {
      errors.push(
        'The separate "Image Export" section must include a format control with target "export.image.format".',
      );
    } else {
      if (imageFormatControl.type !== "select") {
        errors.push(
          'Image Export format must be a Select control so it matches the Video Export settings structure.',
        );
      }

      if (!imageFormatOptionValues.includes("png") || !imageFormatOptionValues.includes("jpg")) {
        errors.push('Image Export format options must include "png" and "jpg".');
      }

      if (imageFormatControl.defaultValue !== "png") {
        errors.push('Image Export format must default to "png".');
      }
    }

    if (!imageResolutionControl) {
      errors.push(
        'The separate "Image Export" section must include a resolution control with target "export.image.resolution".',
      );
    } else {
      if (imageResolutionControl.type !== "select") {
        errors.push(
          'Image Export resolution must be a Select control so it matches the Video Export settings structure.',
        );
      }

      if (
        !imageResolutionOptionValues.includes("2k") ||
        !imageResolutionOptionValues.includes("4k") ||
        !imageResolutionOptionValues.includes("8k")
      ) {
        errors.push(
          'Image Export resolution options must include "2k", "4k", and "8k".',
        );
      }

      if (imageResolutionControl.defaultValue !== "4k") {
        errors.push('Image Export resolution must default to "4k".');
      }
    }

    const imageFormatControlId = imageFormatEntry?.[0];
    const imageResolutionControlId = imageResolutionEntry?.[0];
    const imageExportHasInlinePair =
      imageExportSection === undefined ||
      imageFormatControlId === undefined ||
      imageResolutionControlId === undefined
        ? false
        : sectionHasInlineLayoutGroupForPair(
            imageExportSection,
            imageFormatControlId,
            imageResolutionControlId,
          );

    if (!imageExportHasInlinePair) {
      errors.push(
        "Image Export format and resolution must render as one compact two-column inline row, matching Video Export settings.",
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
        "reference-runtime-clone must keep the Toolcraft canvas shell enabled; preserve the reference renderer inside ToolcraftApp canvasContent instead of replacing the app with the original UI.",
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
        'reference-runtime-clone transferMode must declare referenceTimeline with mode "none", "toolcraft-playback", "toolcraft-keyframes", or "custom-reference-timeline".',
      );
    } else {
      const declaredReferenceTimelineCoverage = new Set(referenceTimeline.behaviorCoverage);
      const declaredReferenceTransportCoverage = [...declaredReferenceCoverage].filter(
        (coverage) => referenceTransportCoverage.has(coverage),
      );
      const declaredToolcraftTimelineCoverage = [...declaredReferenceTimelineCoverage].filter(
        (coverage) => toolcraftReferenceTimelineCoverage.has(coverage),
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
          `reference-runtime-clone transport behaviorCoverage ${declaredReferenceTransportCoverage.map((coverage) => `"${coverage}"`).join(", ")} requires referenceTimeline mode "toolcraft-playback", "toolcraft-keyframes", or "custom-reference-timeline"; mode "none" is only for references with no user-facing transport behavior.`,
        );
      }

      if (
        (referenceTimeline.mode === "toolcraft-playback" ||
          referenceTimeline.mode === "toolcraft-keyframes") &&
        declaredReferenceTimelineCoverage.size === 0
      ) {
        errors.push(
          `referenceTimeline mode "${referenceTimeline.mode}" must list the concrete timeline transport behaviors in behaviorCoverage.`,
        );
      }

      if (referenceTimeline.mode === "toolcraft-playback" && timelineMode !== "playback") {
        errors.push(
          'referenceTimeline mode "toolcraft-playback" requires panels.timeline mode "playback".',
        );
      }

      if (referenceTimeline.mode === "toolcraft-keyframes" && timelineMode !== "keyframes") {
        errors.push(
          'referenceTimeline mode "toolcraft-keyframes" requires panels.timeline mode "keyframes".',
        );
      }

      if (
        referenceTimeline.mode === "toolcraft-playback" &&
        declaredReferenceTimelineCoverage.has("keyframes")
      ) {
        errors.push(
          'referenceTimeline behaviorCoverage "keyframes" requires referenceTimeline mode "toolcraft-keyframes".',
        );
      }

      if (
        referenceTimeline.mode === "toolcraft-keyframes" &&
        !declaredReferenceTimelineCoverage.has("keyframes")
      ) {
        errors.push(
          'referenceTimeline mode "toolcraft-keyframes" must include behaviorCoverage "keyframes".',
        );
      }

      if (
        (referenceTimeline.mode === "toolcraft-playback" ||
          referenceTimeline.mode === "toolcraft-keyframes") &&
        declaredToolcraftTimelineCoverage.length === 0
      ) {
        errors.push(
          `referenceTimeline mode "${referenceTimeline.mode}" must include at least one Toolcraft timeline behavior such as "playback", "restart", "scrub", "duration", "loop", "time-progress", "export-at-time", or "keyframes".`,
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

  if (schema.persistence.storage === "localStorage") {
    const persistenceEntry = acceptance.find(
      (entry) =>
        entry.kind === "runtime" &&
        entry.persistenceCoverage === "reload",
    );

    if (!persistenceEntry) {
      errors.push(
        'persistence.storage "localStorage" requires a runtime acceptance entry with persistenceCoverage "reload" proving user-edited persisted state restores after a real browser reload. Settings import/export is not a substitute for persistence.',
      );
    } else {
      const evidenceText = getAcceptanceEvidenceText(persistenceEntry);

      if (!persistenceEntry.automated || !persistenceEntry.automatedTestName.trim()) {
        errors.push(
          `${persistenceEntry.id} must have automated coverage proving persistence reload behavior.`,
        );
      }

      if (!persistenceEntry.browser || !persistenceEntry.browserTestName.trim()) {
        errors.push(
          `${persistenceEntry.id} must have browser coverage proving persistence reload behavior.`,
        );
      }

      if (!persistenceEntry.expectedObservable.trim()) {
        errors.push(
          `${persistenceEntry.id} must describe the persisted state observable after reload.`,
        );
      }

      if (!/\b(reload|refresh|reopen|page\.reload)\b/i.test(evidenceText)) {
        errors.push(
          `${persistenceEntry.id} persistenceCoverage "reload" must describe changing a user-facing setting, reloading the browser page, and observing the restored value/output.`,
        );
      }
    }
  }

  const settingsTransferEligibility = getToolcraftSettingsTransferEligibility({
    panels: schema.panels,
  });

  if (settingsTransferEligibility.eligible && !schema.settingsTransfer.enabled) {
    const settingsTransferOptOutEntry = acceptance.find(
      (entry) =>
        entry.kind === "runtime" &&
        entry.target === "runtime.settingsTransfer" &&
        entry.settingsTransferCoverage === "opt-out",
    );

    if (!settingsTransferOptOutEntry) {
      errors.push(
        [
          "settingsTransfer is required for this complex product app because settings-transfer eligibility was reached.",
          `Eligibility: ${settingsTransferEligibility.controlCount} product controls, ${settingsTransferEligibility.sectionCount} product sections, weighted score ${settingsTransferEligibility.score}, reasons ${settingsTransferEligibility.reasons.join(", ")}.`,
          'Use schema settingsTransfer: "auto" or true, or add a runtime acceptance entry with settingsTransferCoverage "opt-out" explaining why the app is ephemeral, temporary, one-off, not portable, or session-only.',
        ].join(" "),
      );
    } else {
      const evidenceText = getAcceptanceEvidenceText(settingsTransferOptOutEntry);

      if (!settingsTransferOptOutEntry.automated || !settingsTransferOptOutEntry.automatedTestName.trim()) {
        errors.push(
          `${settingsTransferOptOutEntry.id} settingsTransferCoverage "opt-out" must have automated coverage proving the app intentionally omits portable settings.`,
        );
      }

      if (!settingsTransferOptOutEntry.browser || !settingsTransferOptOutEntry.browserTestName.trim()) {
        errors.push(
          `${settingsTransferOptOutEntry.id} settingsTransferCoverage "opt-out" must have browser coverage proving the app intentionally omits portable settings.`,
        );
      }

      if (!settingsTransferOptOutReasonPattern.test(evidenceText)) {
        errors.push(
          `${settingsTransferOptOutEntry.id} settingsTransferCoverage "opt-out" must explain why the complex app does not need portable settings using a concrete reason such as ephemeral, temporary, one-off, not portable, or session-only.`,
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
    const keyframeCapability = getToolcraftControlKeyframeCapability(control);
    const isCustomControl = isCustomToolcraftControl(control);
    const isSelectedLayerTarget = control.target.startsWith("selectedLayer.");
    const toggleLabelError = getToggleControlLabelError(control, sectionTitle);

    if (toggleLabelError) {
      errors.push(`${label} ${toggleLabelError}`);
    }

    if (
      control.type === "rangeSlider" &&
      Array.isArray(control.defaultValue) &&
      typeof control.defaultValue[0] === "number" &&
      typeof control.defaultValue[1] === "number" &&
      control.defaultValue[0] === control.defaultValue[1]
    ) {
      errors.push(
        `${label} rangeSlider defaultValue must start with different lower and upper values so the two-thumb control does not collapse into a single-value slider.`,
      );
    }

    if (
      control.type !== "panelActions" &&
      timelineTransportControlPattern.test(getTimelineTransportControlText(controlId, control))
    ) {
      errors.push(
        `${label} looks like an app-wide timeline transport control. Play, Pause, Animate, Resume, and Restart animation belong to the top timeline; keep right-panel controls for renderer parameters, generation/apply actions, and output delivery.`,
      );
    }

    if (shouldUseSingleCurveVariant(controlId, control)) {
      errors.push(
        `${label} is a semantic single curve and must set variant: "single"; RGB/R/G/B curve tabs are reserved for color-correction or channel-specific curves.`,
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
        `${label} is keyframe-capable by Toolcraft control type; remove keyframeable: false and provide keyframe evaluator coverage instead of hiding the diamond.`,
      );
    }

    if (isSelectedLayerTarget && !layersEnabled) {
      errors.push(
        `${label} uses reserved selectedLayer.* target without panels.layers enabled. Use an app-specific target for single-layer apps or enable layers with layerCoverage.`,
      );
    }

    if (control.visibleWhen) {
      errors.push(
        ...getConditionValidationErrors({
          condition: control.visibleWhen,
          conditionName: "visibleWhen",
          controlTargets,
          label,
        }),
      );
    }

    if (control.disabledWhen) {
      errors.push(
        ...getConditionValidationErrors({
          condition: control.disabledWhen,
          conditionName: "disabledWhen",
          controlTargets,
          label,
        }),
      );
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

    if (control.type === "fileDrop") {
      errors.push(...getFileDropLifecycleCoverageErrors(label, entry));
    }

    if (
      isCustomControl &&
      !hasCustomControlCoverage(
        entry.customControlCoverage,
        requiredCustomControlCoverage,
      )
    ) {
      errors.push(
        `${label} is a custom control and must declare customControlCoverage for: ${requiredCustomControlCoverage.join(", ")}.`,
      );
    }

    if (isCustomControl) {
      errors.push(...getBuiltInFitCheckErrors(label, entry, control));
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
      control.visibleWhen &&
      !/\b(visible|shown|show|appears|hidden|hide|hides|not visible|disappear|unavailable)\b/i.test(
        getAcceptanceEvidenceText(entry),
      )
    ) {
      errors.push(
        `${label} uses visibleWhen and acceptance must prove the control becomes visible and hidden/unavailable when ${control.visibleWhen.target} reaches the gating values.`,
      );
    }

    if (
      schemaHasPngExportPanelAction(schema) &&
      isOutputBackgroundToggleControl({ control, controlId, sectionTitle })
    ) {
      const evidenceText = getAcceptanceEvidenceText(entry);
      const provesPngTransparency =
        /\b(png|image)\b/i.test(evidenceText) &&
        /\b(transparent|transparency|alpha)\b/i.test(evidenceText);
      const provesPreviewTransparency =
        /\b(preview|canvas)\b/i.test(evidenceText) &&
        /\b(transparent|transparency|alpha|hide|hides|hidden|without background|no background|background off)\b/i.test(
          evidenceText,
        );
      const provesVideoBackground =
        /\bvideo\b/i.test(evidenceText) &&
        /\b(keep|keeps|preserve|preserves|stay|stays|remain|remains|still|background)\b/i.test(
          evidenceText,
        );

      if (!provesPngTransparency || !provesPreviewTransparency || !provesVideoBackground) {
        errors.push(
          `${label} controls background inclusion and acceptance must prove disabling it makes PNG output transparent, hides the live preview product background, and keeps video output with the product background.`,
        );
      }
    }

    const requiredControlParts =
      getRequiredToolcraftControlPartCoverage(control);

    if (!hasControlPartCoverage(entry.controlPartCoverage, requiredControlParts)) {
      errors.push(
        `${label} must declare controlPartCoverage for every semantic value part: ${requiredControlParts.join(", ")}.`,
      );
    }

    if (timelineMode === "keyframes" && keyframeCapability.capable) {
      if (entry.timelineCoverage !== "keyframes") {
        errors.push(
          `${label} is keyframe-capable by Toolcraft control type and must have acceptance timelineCoverage "keyframes" proving its diamond creates/updates a keyframe row and changes evaluated output.`,
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

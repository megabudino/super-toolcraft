import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
} from "./acceptance/types";
import { appSchema } from "./app-schema";
export {
  appTransferMode,
  donutDeepControlAcceptance,
  donutEdibleMaterialAcceptance,
} from "./donut/donut-reference-acceptance";
import {
  donutDeepControlAcceptance,
  donutEdibleMaterialAcceptance,
} from "./donut/donut-reference-acceptance";
import {
  DONUT_PRESET_CUSTOM,
  DONUT_PRESETS,
} from "./donut/donut-presets";
import {
  createDonutPresetAcceptanceRows,
  donutPresetControlSectionInventory,
} from "./donut/donut-preset-acceptance";

export const DONUT_AUTOMATED_ACCEPTANCE_TEST =
  "donut product acceptance maps every source feature to deterministic output";

const FIXTURE =
  "The supplied Blender donut at its authored defaults with deterministic browser-rendered icing and sprinkles.";

export function getDonutBrowserTestName(acceptanceId: string): string {
  return `donut acceptance: ${acceptanceId}`;
}

function controlAcceptance(
  entry: Omit<
    ToolcraftComponentAcceptance,
    "automated" | "browser" | "fixture" | "kind"
  >,
): ToolcraftComponentAcceptance {
  return {
    ...entry,
    automated: true,
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browser: true,
    fixture: FIXTURE,
    kind: "control",
  };
}

export const appProductReadiness: ToolcraftProductReadiness = {
  interactionOwnership: [
    {
      alternative: {
        reason:
          "A second panel rotation control would duplicate the spatial gesture and separate it from the visible donut.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail:
          "The source is a visible editable 3D scene and product usability assigns inspection orbit to the canvas.",
        source: "usability-analysis",
      },
      id: "donut-scene-orbit",
      reason:
        "Dragging the visible donut provides direct inspection while the runtime gizmo owns axis snaps and shared history.",
      surface: "canvas",
      target: "scene.orientation",
    },
    {
      alternative: {
        reason:
          "Painting persistent property controls over the donut would obscure the authored material and sprinkle result.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The inspected Geometry Nodes modifiers expose icing and sprinkle inputs as numeric, color, enum, and boolean properties.",
        source: "reference",
      },
      id: "geometry-node-properties",
      reason:
        "The panel provides precise resettable values for Blender node-group inputs without duplicating canvas orbit.",
      surface: "panel",
      target: "sprinkles.flow",
    },
  ],
  mode: "product",
  productName: "Donut Studio",
  productSummary:
    "A browser-native 3D donut simulator with authored geometry, smooth viscous icing, modifiable scanned edible-PBR materials, independently remembered flavor presets, instanced sprinkles, HDRI lighting and backdrop, soft shadows, orbit, and image export.",
  requestedBehavior:
    "Study the supplied Blender Geometry Nodes file, transfer its donut simulation, controls, editable supplied PBR materials, lighting, and output; replace angular icing teeth with adjustable simulated-looking flow and thickness; keep sprinkles naturally embedded in the current icing with signed surface offset control; add visible HDRI and shadows; use the supplied complete scene snapshots as named defaults with Matcha first, remember every independently tuned appearance inside one built-in Settings JSON, normalize every named preset to the shared Matcha camera, Infinity canvas, and 170% zoom, and preserve all scenes through import and reload.",
  viewInteraction: {
    mode: "orbit",
    orientationTargets: ["scene.orientation"],
  },
};

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  controlAcceptance({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("runtime.settingsTransfer"),
    componentType: "settingsTransfer",
    evidence: "command-side-effect",
    expectedObservable:
      "Export Settings downloads the current donut setup plus every named donut scene, and Import Settings restores the complete library.",
    id: "runtime.settingsTransfer",
    userAction:
      "Export settings after tuning named donuts, change values, import the file, reload, and revisit each scene.",
  }),
  controlAcceptance({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("canvas.aspectRatio"),
    componentType: "aspectRatio",
    evidence: "rendered-pixels",
    expectedObservable:
      "Aspect ratio changes the editable 3D output frame while the donut remains visible.",
    id: "canvas.aspectRatio",
    referenceCoverage: "canvas-sizing",
    target: "canvas.aspectRatio",
    userAction: "Choose a portrait aspect ratio and inspect the canvas.",
  }),
  controlAcceptance({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("canvas.size.width"),
    componentType: "text",
    evidence: "rendered-pixels",
    expectedObservable:
      "Canvas width changes the logical product frame and WebGL backing width.",
    id: "canvas.size.width",
    target: "canvas.size.width",
    userAction: "Enter and commit another Canvas width.",
  }),
  controlAcceptance({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("canvas.size.height"),
    componentType: "text",
    evidence: "rendered-pixels",
    expectedObservable:
      "Canvas height changes the logical product frame and WebGL backing height.",
    id: "canvas.size.height",
    target: "canvas.size.height",
    userAction: "Enter and commit another Canvas height.",
  }),
  {
    automated: true,
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browser: true,
    browserTestName: getDonutBrowserTestName("canvas.renderScale"),
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Resolution scale preserves CSS size while rendering the selected full backing pixels during interaction and steady state.",
    fixture: FIXTURE,
    id: "canvas.renderScale",
    kind: "runtime",
    renderScaleCoverage: {
      kind: "selected-backing-pixels",
      states: ["interaction", "steady"],
    },
    target: "canvas.renderScale",
    userAction:
      "Drag Resolution scale from 1 to 2 and compare CSS and backing dimensions.",
  },
  {
    automated: true,
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browser: true,
    browserTestName: getDonutBrowserTestName("canvas.infinity.mode"),
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity canvas switches modes, preserves its viewport, and restores the finite output frame.",
    fixture: FIXTURE,
    id: "canvas.infinity.mode",
    infinityCanvasCoverage: "mode-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Enable Infinity, pan, reload, disable, undo, and redo.",
  },
  {
    automated: true,
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browser: true,
    browserTestName: getDonutBrowserTestName("canvas.infinity.image-export"),
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "Infinite image export resolves the stable product-owned 3D scene bounds rather than dormant finite canvas size.",
    fixture: FIXTURE,
    id: "canvas.infinity.image-export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Export finite and infinite images and compare decoded dimensions.",
  },
  {
    automated: true,
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browser: true,
    browserTestName: getDonutBrowserTestName("reference.scene"),
    componentType: "canvas",
    evidence: "rendered-pixels",
    expectedObservable:
      "The exact Base and Plate geometry renders with nontransparent physical material pixels under the authored studio look.",
    fixture: FIXTURE,
    id: "reference.scene",
    kind: "runtime",
    referenceCoverage: "renderer-state",
    userAction: "Load the product and inspect the Blender-derived scene.",
  },
  controlAcceptance({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("scene.plateVisible"),
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "Plate hides and returns without changing the donut or procedural toppings.",
    id: "scene.plateVisible",
    target: "scene.plateVisible",
    userAction: "Toggle Plate.",
  }),
  {
    automated: true,
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browser: true,
    browserTestName: getDonutBrowserTestName("scene.orientation"),
    canvasHandle: {
      exportCleanTestName: getDonutBrowserTestName("scene.orientation"),
      outputObservable:
        "The donut view changes with the shared pose while the runtime gizmo remains absent from exported image pixels.",
      testId: "toolcraft-orientation-gizmo",
      writesTarget: "scene.orientation",
    },
    componentType: "orientationGizmo",
    evidence: "rendered-pixels",
    expectedObservable:
      "Axis drag, snap, model drag, miss-pan, undo/reset, and export share one scene pose.",
    fixture: FIXTURE,
    id: "scene.orientation",
    interactionId: "donut-scene-orbit",
    kind: "canvas-handle",
    orientationGizmoCoverage: "all-required-orientation-gizmo-behavior",
    target: "scene.orientation",
    userAction: "Orbit the donut with the model and runtime orientation gizmo.",
  },
  ...createDonutPresetAcceptanceRows({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName,
    fixture: FIXTURE,
  }),
  ...donutDeepControlAcceptance.map(([id, componentType, expectedObservable]) =>
    controlAcceptance({
      automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
      browserTestName: getDonutBrowserTestName(id),
      componentType,
      evidence: "rendered-pixels",
      expectedObservable,
      id,
      referenceCoverage: "control-mapping",
      target: id,
      userAction: `Change ${id} through its visible control.`,
      ...(id === "donut.preset"
        ? {
            optionCoverage: [
              DONUT_PRESET_CUSTOM,
              ...DONUT_PRESETS.map((preset) => preset.id),
            ],
          }
        : {}),
      ...(id === "studio.environmentBlur" ||
      id === "studio.shadowStrength" ||
      id === "studio.shadowSoftness"
        ? { visibilityCoverage: "all-conditional-visibility" as const }
        : {}),
    }),
  ),
  ...donutEdibleMaterialAcceptance.map(
    ([id, componentType, expectedObservable]) =>
      controlAcceptance({
        automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
        browserTestName: getDonutBrowserTestName(id),
        componentType,
        evidence: "rendered-pixels",
        expectedObservable,
        id,
        referenceCoverage: "control-mapping",
        target: id,
        userAction: `Change ${id} through its visible control.`,
      }),
  ),
  ...([
    [
      "icing.enabled",
      "switch",
      "Icing removes and restores the complete coating.",
    ],
    [
      "icing.color",
      "color",
      "Icing colour repaints the visible physical coating.",
    ],
  ] as const).map(([id, componentType, expectedObservable]) =>
    controlAcceptance({
      automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
      browserTestName: getDonutBrowserTestName(id),
      componentType,
      evidence: "rendered-pixels",
      expectedObservable,
      id,
      referenceCoverage: "control-mapping",
      target: id,
      userAction: `Change ${id} through its visible control.`,
    }),
  ),
  controlAcceptance({
    actionCoverage: ["icing.clear.base", "icing.clear.detail"],
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("icing.clear"),
    componentType: "actions",
    evidence: "rendered-pixels",
    expectedObservable:
      "Base removes all icing while Detail keeps a smooth top shell without drip variation.",
    id: "icing.clear",
    referenceCoverage: "control-mapping",
    target: "icing.clearMode",
    userAction: "Click both Clear actions and compare the coating.",
  }),
  ...([
    [
      "sprinkles.flow",
      "slider",
      "Flow changes the visible deterministic instance count during drag.",
    ],
    [
      "sprinkles.scale",
      "slider",
      "Scale changes visible instance dimensions without changing population.",
    ],
    [
      "sprinkles.metallic",
      "slider",
      "Metallic changes sprinkle highlight response.",
    ],
  ] as const).map(([id, componentType, expectedObservable]) =>
    controlAcceptance({
      automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
      browserTestName: getDonutBrowserTestName(id),
      componentType,
      evidence: "rendered-pixels",
      expectedObservable,
      id,
      interactionId:
        id === "sprinkles.flow" ? "geometry-node-properties" : undefined,
      referenceCoverage: "control-mapping",
      target: id,
      userAction: `Drag ${id} and inspect the live result.`,
    }),
  ),
  controlAcceptance({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("sprinkles.shape"),
    componentType: "segmented",
    evidence: "rendered-pixels",
    expectedObservable:
      "Pellet, Pearl, and Rod render visibly distinct instanced geometry.",
    id: "sprinkles.shape",
    optionCoverage: ["1", "2", "3"],
    referenceCoverage: "control-mapping",
    target: "sprinkles.shape",
    userAction: "Choose every Shape option.",
  }),
  controlAcceptance({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("sprinkles.palette"),
    componentType: "select",
    evidence: "rendered-pixels",
    expectedObservable:
      "All five public color branches produce visibly distinct sprinkle colors.",
    id: "sprinkles.palette",
    optionCoverage: ["1", "2", "3", "4", "5"],
    referenceCoverage: "control-mapping",
    target: "sprinkles.palette",
    userAction: "Choose every Palette option.",
  }),
  controlAcceptance({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("sprinkles.solidColor"),
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Solid colour appears only in the Solid branch and repaints every sprinkle.",
    id: "sprinkles.solidColor",
    target: "sprinkles.solidColor",
    userAction: "Choose Solid, change Solid colour, then switch away and back.",
    visibilityCoverage: "all-conditional-visibility",
  }),
  controlAcceptance({
    actionCoverage: ["sprinkles.clear"],
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("sprinkles.clear"),
    componentType: "actions",
    evidence: "rendered-pixels",
    expectedObservable:
      "Clear removes every sprinkle and changing a sprinkle setting rebuilds the deterministic result.",
    id: "sprinkles.clear",
    target: "sprinkles.clear",
    userAction: "Click Clear and then change Flow.",
  }),
  controlAcceptance({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    backgroundOutputCoverage: "all-required-background-output",
    browserTestName: getDonutBrowserTestName("export.includeBackground"),
    componentType: "switch",
    evidence: "exported-bytes",
    expectedObservable:
      "Background off hides preview color, exits Infinity, and exports transparent PNG alpha; on restores color and Infinity availability.",
    id: "export.includeBackground",
    target: "export.includeBackground",
    userAction: "Toggle Background and export PNG.",
  }),
  controlAcceptance({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("appearance.background"),
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Background color changes preview, complete infinite viewport, and encoded image pixels.",
    id: "appearance.background",
    target: "appearance.background",
    userAction: "Choose a saturated Background color.",
  }),
  controlAcceptance({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("export.image.format"),
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable:
      "PNG preserves optional alpha while JPG produces an opaque JPEG artifact.",
    id: "export.image.format",
    optionCoverage: ["png", "jpg"],
    target: "export.image.format",
    userAction: "Export both image formats.",
  }),
  controlAcceptance({
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("export.image.resolution"),
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable:
      "2K, 4K, and 8K produce decoded images at the selected long edge.",
    id: "export.image.resolution",
    optionCoverage: ["2k", "4k", "8k"],
    target: "export.image.resolution",
    userAction: "Export every image resolution.",
  }),
  controlAcceptance({
    actionCoverage: ["export.png"],
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browserTestName: getDonutBrowserTestName("actions.output"),
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Export PNG shows progress and downloads a non-empty image from the current 3D state.",
    id: "actions.output",
    target: "actions.output",
    userAction: "Run the sticky Export PNG action.",
  }),
  {
    automated: true,
    automatedTestName: DONUT_AUTOMATED_ACCEPTANCE_TEST,
    browser: true,
    browserTestName: getDonutBrowserTestName("persistence.reload"),
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Values, canvas viewport/size, and Controls workspace restore after a real reload.",
    fixture: FIXTURE,
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices:
      appSchema.persistence.storage === "localStorage"
        ? appSchema.persistence.include
        : [],
    target: "canvas.size.width",
    userAction:
      "Change donut values and canvas, move/collapse Controls, wait for persistence, and reload.",
  },
];

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  ...donutPresetControlSectionInventory,
  {
    entity: "Blender-derived donut shape",
    groupingReason:
      "Ring, profile deformation, organic variation, and shared orbit define the authored Base shape.",
    id: "donut-shape",
    targets: [
      "donut.majorRadius",
      "donut.thickness",
      "donut.height",
      "donut.organic",
      "scene.orientation",
    ],
    title: "Donut Shape",
  },
  {
    entity: "Blender donut material",
    groupingReason:
      "Color, surface response, softness, coat, and sheen reproduce the visible Base material.",
    id: "donut-material",
    splitReason:
      "Core physical response remains separate from the approved cooked-surface art direction.",
    targets: [
      "material.donut.color",
      "material.donut.roughness",
      "material.donut.subsurface",
      "material.donut.softness",
      "material.donut.coat",
      "material.donut.sheen",
    ],
    title: "Donut Material",
    workflowStage: "physical response",
  },
  {
    entity: "Procedural edible donut surface",
    groupingReason:
      "Bake, pores, moisture, and variation jointly define the realistic cooked crumb surface.",
    id: "donut-surface",
    splitReason:
      "Cooked-surface art direction follows the core physical material setup as a distinct authoring stage.",
    targets: [
      "material.donut.bake",
      "material.donut.pores",
      "material.donut.moisture",
      "material.donut.variation",
    ],
    title: "Donut Surface",
    workflowStage: "edible surface finish",
  },
  {
    entity: "Procedural icing formation",
    groupingReason:
      "Enablement, coverage, thickness, and source clear operations define the coating shell.",
    id: "icing-shape",
    targets: [
      "icing.enabled",
      "icing.coverage",
      "icing.thickness",
      "icing.clearMode",
    ],
    title: "Icing Shape",
  },
  {
    entity: "Viscous icing edge flow",
    groupingReason:
      "Flow, drip length, cadence, and detail jointly form one continuous simulated-looking coating edge.",
    id: "icing-flow",
    targets: [
      "icing.flow",
      "icing.dripAmount",
      "icing.dripFrequency",
      "icing.detail",
    ],
    title: "Icing Flow",
  },
  {
    entity: "Blender icing material",
    groupingReason:
      "Source color and visible physical response jointly shade the coating.",
    id: "icing-material",
    targets: [
      "icing.color",
      "material.icing.roughness",
      "material.icing.subsurface",
      "material.icing.coat",
      "material.icing.sheen",
      "material.icing.glaze",
      "material.icing.texture",
    ],
    title: "Icing Material",
  },
  {
    entity: "Geometry Nodes sprinkle result",
    groupingReason:
      "Flow, scale, primitive, color branch, solid color, and clear reproduce the public Sprinkle modifier.",
    id: "sprinkles",
    targets: [
      "sprinkles.flow",
      "sprinkles.scale",
      "sprinkles.shape",
      "sprinkles.palette",
      "sprinkles.solidColor",
      "sprinkles.clear",
    ],
    title: "Sprinkles",
  },
  {
    entity: "Sprinkle emitter distribution",
    groupingReason:
      "Seed, coverage, size variation, rotation, and surface offset jointly place retained instances.",
    id: "sprinkle-distribution",
    targets: [
      "sprinkles.seed",
      "sprinkles.coverage",
      "sprinkles.sizeVariation",
      "sprinkles.rotation",
      "sprinkles.surfaceOffset",
    ],
    title: "Distribution",
  },
  {
    entity: "Blender sprinkle material",
    groupingReason:
      "Metallic, roughness, and coat jointly shade every sprinkle instance.",
    id: "sprinkle-material",
    targets: [
      "sprinkles.metallic",
      "material.sprinkle.roughness",
      "material.sprinkle.coat",
    ],
    title: "Sprinkle Material",
  },
  {
    entity: "Authored plate",
    groupingReason:
      "Visibility, ceramic color, roughness, and coat define the Plate result.",
    id: "plate",
    targets: [
      "scene.plateVisible",
      "material.plate.color",
      "material.plate.roughness",
      "material.plate.coat",
    ],
    title: "Plate",
  },
  {
    entity: "Blender World environment",
    groupingReason:
      "Backdrop, blur, strength, and rotation jointly control the retained HDR studio environment.",
    id: "environment",
    targets: [
      "studio.hdriVisible",
      "studio.environmentStrength",
      "studio.environmentRotation",
      "studio.environmentBlur",
    ],
    title: "Environment",
  },
  {
    entity: "Retained product shadow rig",
    groupingReason:
      "Inclusion, strength, and softness jointly control the product shadow cast onto the plate.",
    id: "shadows",
    targets: [
      "studio.shadowsEnabled",
      "studio.shadowStrength",
      "studio.shadowSoftness",
    ],
    title: "Shadows",
  },
  ...([
    ["key-light", "Key Light", "studio.key"],
    ["warm-light", "Warm Light", "studio.warm"],
    ["cool-light", "Cool Light", "studio.cool"],
  ] as const).map(([id, title, prefix]) => ({
    entity: `Authored ${title}`,
    groupingReason:
      "Power, color, and emitter size jointly reproduce one Blender Area light.",
    id,
    targets: [`${prefix}.power`, `${prefix}.color`, `${prefix}.size`],
    title,
  })),
  {
    entity: "Still-image delivery",
    groupingReason:
      "Format and resolution jointly define final browser image encoding.",
    id: "image-export",
    targets: ["export.image.format", "export.image.resolution"],
    title: "Image Export",
  },
];

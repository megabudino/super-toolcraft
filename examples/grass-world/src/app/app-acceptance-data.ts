import type { ToolcraftComponentAcceptance } from "./acceptance/types";
import { grassBasicControlAcceptanceRows } from "./app-acceptance-basic-control-data";
import { grassButterflyAcceptanceRows } from "./app-acceptance-butterfly-data";
import { grassPbrAcceptanceRows } from "./app-acceptance-pbr-data";
import { grassDualLayerAcceptanceRows } from "./app-acceptance-layer-data";
import {
  grassSceneSetupAcceptanceRows,
} from "./app-acceptance-scene-data";
import {
  grassBoulderAcceptanceRows,
  grassRockShadowColorAcceptanceRows,
  grassScannedColorAcceptanceRows,
  grassScanAcceptanceRows,
} from "./app-acceptance-scan-data";
import { grassWindAcceptanceRows } from "./app-acceptance-wind-data";
import { grassInstanceColorAcceptanceRows } from "./app-acceptance-instance-color-data";
import { grassDistributionAcceptanceRows } from "./app-acceptance-distribution-data";
import { grassSurfaceBendAcceptanceRows } from "./app-acceptance-surface-bend-data";

export { appProductReadiness, appTransferMode } from "./app-product-readiness";

function controlAcceptance(
  entry: Omit<ToolcraftComponentAcceptance, "automated" | "browser" | "kind">,
): ToolcraftComponentAcceptance {
  return { ...entry, automated: true, browser: true, kind: "control" };
}

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  ...grassButterflyAcceptanceRows,
  ...grassScanAcceptanceRows,
  ...grassBoulderAcceptanceRows,
  ...grassScannedColorAcceptanceRows,
  ...grassRockShadowColorAcceptanceRows,
  ...grassBasicControlAcceptanceRows,
  ...grassDualLayerAcceptanceRows,
  ...grassWindAcceptanceRows,
  ...grassInstanceColorAcceptanceRows,
  ...grassSceneSetupAcceptanceRows,
  ...grassDistributionAcceptanceRows,
  ...grassSurfaceBendAcceptanceRows,
  controlAcceptance({
    automatedTestName:
      "terrain noise preview maps runtime state to terrain output",
    browserTestName:
      "terrain height map preview and controls reshape the field",
    builtInFitCheck: {
      capabilities: ["custom-interaction", "custom-visualization"],
      checkedBuiltIns: ["vector", "imagePicker", "fileDrop"],
      closestBuiltIn: "vector",
      productObservable:
        "The live grayscale preview and the WebGL terrain shift together when the preview is directly manipulated.",
      whyInsufficient:
        "Vector can author a two-axis offset but cannot visualize the generated noise map that the offset samples.",
    },
    componentType: "grassNoisePreview",
    customControlCoverage: [
      "built-in-gap",
      "kit-primitives",
      "minimal-ui",
      "product-output",
      "runtime-state",
    ],
    evidence: "product-output",
    expectedObservable:
      "The grayscale preview displays the exact normalized height mask used by the ground, and dragging it shifts that same mask under grass and attached objects.",
    fixture:
      "Default terrain compared with a dragged noise offset and changed noise parameters.",
    id: "grass.terrain-noise-preview",
    target: "terrain.noiseOffset",
    userAction:
      "Drag the Height map preview to choose another sampled terrain region.",
  }),
  controlAcceptance({
    automatedTestName:
      "Clover blend preview maps value-noise state to the ground material",
    browserTestName:
      "Clover PBR material blends with the current ground through one mask",
    builtInFitCheck: {
      capabilities: ["custom-interaction", "custom-visualization"],
      checkedBuiltIns: ["vector", "imagePicker", "fileDrop"],
      closestBuiltIn: "vector",
      productObservable:
        "The grayscale preview and ground shader sample the same deterministic Clover blend mask.",
      whyInsufficient:
        "Vector can author the two-axis offset but cannot preview the generated physical-material blend mask.",
    },
    componentType: "grassNoisePreview",
    customControlCoverage: [
      "built-in-gap",
      "kit-primitives",
      "minimal-ui",
      "product-output",
      "runtime-state",
    ],
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging the grayscale mask moves the same Clover regions across the lit PBR ground without adding another ground mesh.",
    fixture:
      "The current ground and Clover Patches material under fixed lighting and a translated mask.",
    id: "grass.clover-blend-preview",
    target: "surface.cloverMaskOffset",
    userAction: "Drag the Clover Blend mask preview.",
    visibilityCoverage: ["hidden", "visible"],
  }),
  controlAcceptance({
    automatedTestName:
      "Clover blend levels map black and white bounds to one PBR blend",
    browserTestName:
      "Clover PBR material blends with the current ground through one mask",
    componentType: "rangeSlider",
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
    evidence: "rendered-pixels",
    expectedObservable:
      "The black point preserves the current ground and the white point reveals Clover while color, AO, normal, and roughness transition together.",
    fixture:
      "A ground-only view compared at all-current, mixed, and all-Clover mask levels.",
    id: "grass.clover-blend-levels",
    target: "surface.cloverMaskLevels",
    userAction: "Move both Black / white handles.",
    visibilityCoverage: ["hidden", "visible"],
  }),
  controlAcceptance({
    automatedTestName:
      "grass conditional distribution controls map to renderer output",
    browserTestName:
      "grass top-facing controls reveal and filter slope coverage",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Coverage changes which procedural slopes can grow grass after Top facing only is enabled.",
    fixture: "Top facing only enabled with Coverage at separated values.",
    id: "grass.top-facing-coverage",
    target: "field.topFacingCoverage",
    userAction: "Enable Top facing only and drag Coverage.",
    visibilityCoverage: ["hidden", "visible"],
  }),
  controlAcceptance({
    automatedTestName:
      "grass conditional distribution controls map to renderer output",
    browserTestName:
      "grass top-facing controls reveal and filter slope coverage",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Fade shortens blades near the upward-facing coverage boundary.",
    fixture: "Top facing only enabled with Fade at 0 and 100.",
    id: "grass.top-facing-fade",
    target: "field.topFacingFade",
    userAction: "Enable Top facing only and drag Fade.",
    visibilityCoverage: ["hidden", "visible"],
  }),
  controlAcceptance({
    automatedTestName: "grass blade height range maps both bounds to layout",
    browserTestName: "grass blade height range changes visible growth",
    componentType: "rangeSlider",
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
    evidence: "product-output",
    expectedObservable:
      "The lower and upper handles independently change minimum and maximum blade height.",
    fixture: "Separated short and tall height ranges using both handles.",
    id: "grass.height-range",
    target: "blade.heightRange",
    userAction: "Move both Height range handles.",
  }),
  ...grassPbrAcceptanceRows,
  controlAcceptance({
    automatedTestName: "grass gradient maps all visible parts to blade shader",
    browserTestName: "grass appearance controls change PBR blade shading",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Color variation independently blends deterministic warm, cool, light, and deep greens across Tall Grass without changing blade geometry.",
    fixture: "The same Tall Grass layout at zero and maximum color variation.",
    id: "grass.color-variation",
    target: "appearance.colorVariation",
    userAction: "Drag Color variation in Tall Grass Appearance.",
  }),
  ...(
    [
      [
        "grass.tall-color-contrast",
        "appearance.colorContrast",
        "Tall Grass contrast",
      ],
      [
        "grass.tall-color-saturation",
        "appearance.colorSaturation",
        "Tall Grass saturation",
      ],
    ] as const
  ).map(([id, target, label]) =>
    controlAcceptance({
      automatedTestName:
        "grass gradient maps all visible parts to blade shader",
      browserTestName: "grass appearance controls change PBR blade shading",
      componentType: "slider",
      evidence: "rendered-pixels",
      expectedObservable: `${label} changes only Tall Grass PBR base color.`,
      fixture:
        "The same Tall Grass layout rendered at neutral and extreme color response.",
      id,
      target,
      userAction: `Drag ${label} in Tall Grass Appearance.`,
    }),
  ),
  controlAcceptance({
    automatedTestName: "grass gradient maps all visible parts to blade shader",
    browserTestName: "grass appearance controls change PBR blade shading",
    componentType: "gradient",
    controlPartCoverage: [
      "gradient.angle",
      "gradient.gradientType",
      "gradient.stops.color",
      "gradient.stops.opacity",
      "gradient.stops.position",
    ],
    evidence: "rendered-pixels",
    expectedObservable:
      "Editable root, middle, and tip stop colors map along every visible blade.",
    fixture: "A high-contrast three-stop gradient with moved stops.",
    id: "grass.blade-gradient",
    target: "appearance.bladeGradient",
    userAction:
      "Edit gradient type, angle, stop colors, opacity, and positions.",
  }),
  controlAcceptance({
    automatedTestName:
      "grass live detail preserves the authored root distribution",
    browserTestName:
      "grass live PBR clumps preserve full authored export geometry",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Tall detail changes the detailed/lightweight tier split while the current authored root distribution stays fixed.",
    fixture:
      "The live PBR preview compared at 6,000 and 300 detailed Tall Grass blades over the same authored Voronoi distribution.",
    id: "grass.preview-blade-count",
    target: "preview.bladeCount",
    userAction: "Drag Tall detail in Preview Quality.",
  }),
  {
    automated: true,
    automatedTestName:
      "grass orientation pose controls preview and export camera",
    browser: true,
    browserTestName:
      "grass orientation gizmo and direct field orbit share canvas ownership",
    canvasHandle: {
      exportCleanTestName: "grass export excludes orientation gizmo",
      outputObservable:
        "The full-quality grass camera follows the shared pose in preview and still export.",
      testId: "toolcraft-orientation-gizmo",
      writesTarget: "view.orientation",
    },
    componentType: "orientationGizmo",
    evidence: "rendered-pixels",
    expectedObservable:
      "Axis drag, axis snap, and direct field drag rotate the grass view; dragging outside the field pans the unbounded canvas instead.",
    fixture: "A visible full field surrounded by empty canvas workspace.",
    id: "grass.view-orientation",
    kind: "canvas-handle",
    orientationGizmoCoverage: "all-required-orientation-gizmo-behavior",
    target: "view.orientation",
    userAction:
      "Drag and snap the orientation gizmo, drag the visible field, then drag outside the field.",
  },
  controlAcceptance({
    automatedTestName:
      "grass background inclusion controls preview and export alpha",
    backgroundOutputCoverage: "all-required-background-output",
    browserTestName: "grass background toggle controls preview image alpha",
    componentType: "switch",
    evidence: "exported-bytes",
    expectedObservable:
      "Include off clears the preview and still-image background.",
    fixture: "A saturated background with Include toggled off.",
    id: "grass.include-background",
    target: "export.includeBackground",
    userAction: "Toggle Include and export an image.",
  }),
  controlAcceptance({
    automatedTestName: "grass background color maps to preview and export",
    browserTestName: "grass background toggle controls preview image alpha",
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing the color changes preview and encoded background pixels.",
    fixture: "A saturated violet background behind the field.",
    id: "grass.background",
    target: "scene.background",
    userAction: "Choose a new Background color.",
  }),
  ...(
    [
      [
        "grass.image-format",
        "export.image.format",
        "image format",
        ["png", "jpg"],
      ],
      [
        "grass.image-resolution",
        "export.image.resolution",
        "image resolution",
        ["2k", "4k", "8k"],
      ],
    ] as const
  ).map(([id, target, label, options]) =>
    controlAcceptance({
      automatedTestName: `grass ${label} is consumed by export`,
      browserTestName: "grass export settings control downloaded images",
      componentType: "select",
      evidence: "exported-bytes",
      expectedObservable: `The selected ${label} changes downloaded encoding or dimensions.`,
      fixture: `Export the same field using every visible ${label} option.`,
      id,
      optionCoverage: options,
      target,
      userAction: `Select each ${label} option and export.`,
    }),
  ),
  controlAcceptance({
    actionCoverage: ["export.png"],
    automatedTestName: "grass footer exposes PNG while video stays hidden",
    browserTestName: "grass export settings control downloaded images",
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Export PNG shows progress and downloads a non-empty image from the current field state.",
    fixture: "A medium-density field.",
    id: "grass.output-actions",
    target: "actions.output",
    userAction: "Run the sticky footer Export PNG action.",
  }),
  {
    automated: true,
    automatedTestName:
      "grass persisted state excludes autonomous timeline transport",
    browser: true,
    browserTestName: "grass field state restores after reload",
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Field, blade, wind, appearance, HDRI media, canvas, and panel settings restore after reload while autonomous animation restarts playing.",
    fixture:
      "Non-default field size, wind, PBR settings, custom HDRI, and canvas.",
    id: "grass.persistence",
    kind: "runtime",
    persistenceCoverage: "reload",
    userAction: "Edit persisted state and reload the browser.",
  },
];

export { appControlSectionInventory } from "./app-control-section-inventory-data";

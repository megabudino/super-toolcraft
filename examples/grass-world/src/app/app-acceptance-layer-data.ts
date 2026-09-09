import type { ToolcraftComponentAcceptance } from "./acceptance/types";

const automatedTestName =
  "dual grass layers map independent settings and wind ownership";
const browserTestName =
  "grass lawn cover and tall grass configure independently";

function layerControl(
  entry: Omit<
    ToolcraftComponentAcceptance,
    "automated" | "automatedTestName" | "browser" | "browserTestName" | "kind"
  >,
): ToolcraftComponentAcceptance {
  return {
    ...entry,
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName,
    kind: "control",
  };
}

const lawnSimpleControls = [
  ["grass.lawn-enabled", "lawn.enabled", "switch", "lawn visibility"],
  [
    "grass.lawn-density",
    "lawn.densityMax",
    "slider",
    "the authored lawn instance count",
  ],
  [
    "grass.lawn-distance",
    "lawn.distanceMin",
    "slider",
    "short-blade spacing and count",
  ],
  [
    "grass.lawn-offset",
    "lawn.depthOffset",
    "slider",
    "the lawn root offset from terrain",
  ],
  ["grass.lawn-seed", "lawn.seed", "slider", "the lawn placement pattern"],
  [
    "grass.lawn-resolution",
    "lawn.curveResolution",
    "slider",
    "the Lawn Cover blade topology",
  ],
  [
    "grass.lawn-thickness",
    "lawn.thickness",
    "slider",
    "short-blade ribbon width",
  ],
  ["grass.lawn-taper", "lawn.taperEnd", "slider", "short-blade taper"],
  ["grass.lawn-tilt", "lawn.tilt2d", "slider", "authored lawn rest lean"],
  ["grass.lawn-3d", "lawn.use3d", "switch", "flat versus crossed lawn ribbons"],
] as const;

export const grassDualLayerAcceptanceRows: readonly ToolcraftComponentAcceptance[] =
  [
    layerControl({
      componentType: "switch",
      evidence: "product-output",
      expectedObservable:
        "Tall Grass can be hidden independently while Lawn Cover remains rendered.",
      fixture: "Both strata enabled, then only Lawn Cover enabled.",
      id: "grass.tall-enabled",
      target: "grass.enabled",
      userAction: "Toggle Visible in the Tall Grass section.",
    }),
    ...lawnSimpleControls.map(([id, target, componentType, observable]) =>
      layerControl({
        componentType,
        evidence: "product-output",
        expectedObservable: `Changing this control updates ${observable} without changing Tall Grass authored state.`,
        fixture: `Both strata enabled with separated ${target} values.`,
        id,
        target,
        userAction: `Change ${target} through its Lawn Cover control.`,
        ...(target === "lawn.enabled"
          ? {}
          : { visibilityCoverage: ["hidden", "visible"] as const }),
      }),
    ),
    layerControl({
      componentType: "rangeSlider",
      controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
      evidence: "product-output",
      expectedObservable:
        "Both Lawn Cover height bounds reshape only the shorter, stiffer carpet.",
      fixture: "Short and tall Lawn Cover ranges over unchanged Tall Grass.",
      id: "grass.lawn-height",
      target: "lawn.heightRange",
      userAction: "Move both Cover height range handles.",
    }),
    layerControl({
      componentType: "slider",
      evidence: "rendered-pixels",
      expectedObservable:
        "Cover roughness changes only the Lawn Cover physical highlight response.",
      fixture: "Live PBR with a visible lawn under unchanged Tall Grass.",
      id: "grass.lawn-pbr-roughness",
      target: "lawn.pbrRoughness",
      userAction: "Drag Cover roughness in the always-PBR preview.",
      visibilityCoverage: ["hidden", "visible"],
    }),
    layerControl({
      componentType: "slider",
      evidence: "rendered-pixels",
      expectedObservable:
        "Cover contrast changes only Lawn Cover PBR base-color separation.",
      fixture: "The same Lawn Cover layout at neutral and extreme contrast.",
      id: "grass.lawn-color-contrast",
      target: "lawn.colorContrast",
      userAction: "Drag Cover contrast in Lawn Appearance.",
      visibilityCoverage: ["hidden", "visible"],
    }),
    layerControl({
      componentType: "slider",
      evidence: "rendered-pixels",
      expectedObservable:
        "Cover saturation changes only Lawn Cover PBR chroma.",
      fixture:
        "The same Lawn Cover layout at neutral and grayscale saturation.",
      id: "grass.lawn-color-saturation",
      target: "lawn.colorSaturation",
      userAction: "Drag Cover saturation in Lawn Appearance.",
      visibilityCoverage: ["hidden", "visible"],
    }),
    layerControl({
      componentType: "slider",
      evidence: "rendered-pixels",
      expectedObservable:
        "Cover color variation changes deterministic warm, cool, light, and deep greens only on Lawn Cover.",
      fixture:
        "The same Lawn Cover layout at zero and maximum color variation.",
      id: "grass.lawn-color-variation",
      target: "lawn.colorVariation",
      userAction: "Drag Color variation in Lawn Appearance.",
      visibilityCoverage: ["hidden", "visible"],
    }),
    layerControl({
      componentType: "gradient",
      controlPartCoverage: [
        "gradient.gradientType",
        "gradient.angle",
        "gradient.stops.position",
        "gradient.stops.color",
        "gradient.stops.opacity",
      ],
      evidence: "rendered-pixels",
      expectedObservable:
        "Every Cover gradient part changes the Lawn Cover colors without rewriting Tall Grass gradient state.",
      fixture:
        "A three-stop Lawn Cover gradient over a contrasting Tall Grass ramp.",
      id: "grass.lawn-gradient",
      target: "lawn.bladeGradient",
      userAction:
        "Change Cover gradient type, angle, stop position, color, and opacity.",
    }),
    layerControl({
      componentType: "slider",
      evidence: "product-output",
      expectedObservable:
        "Lawn detail changes the detailed clump share while lightweight clumps preserve the same authored Lawn coverage independently from Tall Grass.",
      fixture:
        "One live PBR preview with separated Lawn detail and Tall detail values.",
      id: "grass.preview-lawn-count",
      target: "preview.lawnBladeCount",
      userAction: "Drag Lawn detail in Preview Quality.",
    }),
  ];

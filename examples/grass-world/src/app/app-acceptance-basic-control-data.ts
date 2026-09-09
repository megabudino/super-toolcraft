import type { ToolcraftComponentAcceptance } from "./acceptance/types";

function controlAcceptance(
  entry: Omit<ToolcraftComponentAcceptance, "automated" | "browser" | "kind">,
): ToolcraftComponentAcceptance {
  return { ...entry, automated: true, browser: true, kind: "control" };
}

const basicControlRows = [
  [
    "grass.field-width",
    "field.width",
    "text",
    "field width and blade placement",
  ],
  [
    "grass.field-depth",
    "field.depth",
    "text",
    "field length and blade placement",
  ],
  [
    "grass.density",
    "field.densityMax",
    "slider",
    "the visible instanced blade count",
  ],
  [
    "grass.distance",
    "field.distanceMin",
    "slider",
    "minimum spacing and blade count",
  ],
  [
    "grass.offset",
    "grass.depthOffset",
    "slider",
    "blade root offset from the ground",
  ],
  ["grass.seed", "field.seed", "slider", "the deterministic placement pattern"],
  [
    "grass.distribution-scale",
    "field.distributionScale",
    "slider",
    "Tall Grass Voronoi region scale",
  ],
  [
    "grass.distribution-detail",
    "field.distributionDetail",
    "slider",
    "Tall Grass Voronoi octave detail",
  ],
  [
    "grass.distribution-roughness",
    "field.distributionRoughness",
    "slider",
    "small Tall Grass distribution regions",
  ],
  [
    "grass.distribution-seed",
    "field.distributionSeed",
    "slider",
    "the deterministic Tall Grass distribution mask",
  ],
  [
    "grass.terrain-scale",
    "terrain.noiseScale",
    "slider",
    "terrain hill frequency",
  ],
  [
    "grass.terrain-detail",
    "terrain.detail",
    "slider",
    "terrain fractal detail",
  ],
  [
    "grass.terrain-roughness",
    "terrain.roughness",
    "slider",
    "small terrain features",
  ],
  [
    "grass.terrain-seed",
    "terrain.seed",
    "slider",
    "the deterministic terrain shape",
  ],
  [
    "grass.align",
    "field.alignToNormals",
    "slider",
    "blade alignment on surface slopes",
  ],
  [
    "grass.rotation",
    "field.randomRotation",
    "slider",
    "per-blade azimuth variation",
  ],
  [
    "grass.top-facing",
    "field.topFacingOnly",
    "switch",
    "slope-based growth filtering",
  ],
  [
    "grass.show-ground",
    "field.showGround",
    "switch",
    "ground visibility beneath the grass",
  ],
  [
    "grass.resolution",
    "blade.curveResolution",
    "slider",
    "shared blade bend topology",
  ],
  ["grass.thickness", "blade.thickness", "slider", "blade ribbon width"],
  ["grass.taper", "blade.taperEnd", "slider", "tip sharpness"],
  ["grass.tilt", "blade.tilt2d", "slider", "flat-blade lean angle"],
  ["grass.3d", "blade.use3d", "switch", "flat versus crossed ribbon geometry"],
  [
    "grass.ground-color",
    "appearance.groundColor",
    "color",
    "the Current ground texture color",
  ],
  [
    "grass.clover-color",
    "surface.cloverColor",
    "color",
    "the Clover ground texture color",
  ],
  [
    "grass.surface-brightness",
    "surface.brightness",
    "slider",
    "the shared Current and Clover ground brightness",
  ],
  [
    "grass.surface-receive-shadows",
    "surface.receiveShadows",
    "switch",
    "Terrain cast-shadow reception while retaining PBR and AO shading",
  ],
  [
    "grass.surface-texture-scale",
    "surface.textureScale",
    "slider",
    "Uncut Grass texture tiling",
  ],
  [
    "grass.surface-normal-strength",
    "surface.normalStrength",
    "slider",
    "Uncut Grass normal response",
  ],
  [
    "grass.surface-roughness",
    "surface.roughness",
    "slider",
    "Uncut Grass roughness response",
  ],
  [
    "grass.clover-texture-scale",
    "surface.cloverTextureScale",
    "slider",
    "Clover texture tiling",
  ],
  [
    "grass.clover-normal-strength",
    "surface.cloverNormalStrength",
    "slider",
    "Clover normal response",
  ],
  [
    "grass.clover-roughness",
    "surface.cloverRoughness",
    "slider",
    "Clover roughness response",
  ],
  [
    "grass.clover-mask-scale",
    "surface.cloverMaskScale",
    "slider",
    "Clover blend-region scale",
  ],
  [
    "grass.clover-mask-detail",
    "surface.cloverMaskDetail",
    "slider",
    "Clover blend fractal detail",
  ],
  [
    "grass.clover-mask-roughness",
    "surface.cloverMaskRoughness",
    "slider",
    "small Clover blend regions",
  ],
  [
    "grass.clover-mask-seed",
    "surface.cloverMaskSeed",
    "slider",
    "the deterministic Clover blend mask",
  ],
  [
    "grass.surface-edge-fade-width",
    "surface.edgeFadeWidth",
    "slider",
    "the width of the shared transparent field perimeter",
  ],
  [
    "grass.surface-edge-fade-strength",
    "surface.edgeFadeStrength",
    "slider",
    "the terminal opacity of every object at the field perimeter",
  ],
  [
    "grass.ground-shadow-offset-y",
    "groundShadow.offsetY",
    "slider",
    "the vertical separation between Terrain and its grounding shadow",
  ],
  [
    "grass.ground-shadow-offset-z",
    "groundShadow.offsetZ",
    "slider",
    "the front/back position of the grounding shadow",
  ],
  [
    "grass.ground-shadow-scale",
    "groundShadow.scale",
    "slider",
    "the uniform footprint size of the grounding shadow",
  ],
  [
    "grass.ground-shadow-blur",
    "groundShadow.blur",
    "slider",
    "the world-space softness of the grounding shadow",
  ],
  [
    "grass.ground-shadow-color",
    "groundShadow.color",
    "color",
    "only the grounding shadow color",
  ],
  [
    "grass.ground-shadow-strength",
    "groundShadow.strength",
    "slider",
    "the grounding shadow opacity",
  ],
] as const;

const tallLayerConditionalTargets = new Set<string>([
  "field.densityMax",
  "field.distanceMin",
  "grass.depthOffset",
  "field.seed",
  "field.distributionScale",
  "field.distributionDetail",
  "field.distributionRoughness",
  "field.distributionSeed",
  "surface.textureScale",
  "surface.normalStrength",
  "surface.roughness",
]);

const surfaceConditionalTargets = new Set<string>([
  "surface.brightness",
  "surface.cloverMaskDetail",
  "surface.cloverMaskRoughness",
  "surface.cloverMaskScale",
  "surface.cloverMaskSeed",
  "surface.cloverNormalStrength",
  "surface.cloverRoughness",
  "surface.cloverTextureScale",
  "surface.receiveShadows",
]);

const surfaceLightingTargets = new Set<string>([
  "surface.brightness",
  "surface.receiveShadows",
]);

const groundShadowTargets = new Set<string>([
  "groundShadow.offsetY",
  "groundShadow.offsetZ",
  "groundShadow.scale",
  "groundShadow.blur",
  "groundShadow.color",
  "groundShadow.strength",
]);

export const grassBasicControlAcceptanceRows = [
  ...basicControlRows.map(([id, target, componentType, observable]) =>
    controlAcceptance({
      automatedTestName: "grass controls map to renderer output",
      browserTestName: groundShadowTargets.has(target)
        ? "Ground Shadow controls move and style the complete underlay"
        : surfaceLightingTargets.has(target)
          ? "surface lighting controls brighten terrain and toggle cast shadows"
          : "grass controls change the visible field",
      componentType,
      evidence: "product-output",
      expectedObservable: `Changing this control updates ${observable} in the visible WebGL field.`,
      fixture: `Default field compared with a separated ${target} value.`,
      id,
      target,
      userAction: `Change ${target} through the real control.`,
      ...(tallLayerConditionalTargets.has(target) ||
      surfaceConditionalTargets.has(target) ||
      groundShadowTargets.has(target)
        ? { visibilityCoverage: ["hidden", "visible"] as const }
        : {}),
    }),
  ),
  controlAcceptance({
    automatedTestName:
      "terrain height levels smoothly remap both mask bounds",
    browserTestName:
      "terrain height map preview and controls reshape the field",
    componentType: "rangeSlider",
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
    evidence: "product-output",
    expectedObservable:
      "The black and white handles smoothly remap the same grayscale mask in the preview and WebGL terrain without terracing.",
    fixture: "Separated black and white points using both handles.",
    id: "grass.terrain-height-levels",
    target: "terrain.heightLevels",
    userAction: "Move both Black / white handles.",
  }),
  controlAcceptance({
    automatedTestName: "terrain maximum height scales the completed mask",
    browserTestName:
      "terrain height map preview and controls reshape the field",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Maximum height scales the completed terrain mask while keeping its noise pattern and attached objects aligned.",
    fixture: "The same height mask compared at separated maximum heights.",
    id: "grass.terrain-max-height",
    target: "terrain.maxHeight",
    userAction: "Drag Max height.",
  }),
  controlAcceptance({
    automatedTestName: "field shape controls map to one shared perimeter",
    browserTestName: "field shape controls reshape the complete surface",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Roundness moves the complete Terrain and attached-object boundary between ellipse and softly rounded rectangle.",
    fixture: "The same clean field compared at 100% and 0% Roundness.",
    id: "grass.field-shape-roundness",
    target: "field.shapeRoundness",
    userAction: "Drag Field Roundness.",
  }),
  controlAcceptance({
    automatedTestName: "field shape controls map to one shared perimeter",
    browserTestName: "field shape controls reshape the complete surface",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Irregularity changes the deterministic complete-surface perimeter while keeping its width, length, and center stable.",
    fixture: "The same rounded field compared at 0% and 30% Irregularity.",
    id: "grass.field-edge-irregularity",
    target: "field.edgeIrregularity",
    userAction: "Drag Field Irregularity.",
  }),
];

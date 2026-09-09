export const grassSharedLayoutTargets = [
  "field.seed",
  "field.edgeIrregularity",
  "field.shapeRoundness",
  "terrain.noiseScale",
  "terrain.detail",
  "terrain.roughness",
  "terrain.heightLevels",
  "terrain.seed",
  "terrain.maxHeight",
  "surface.bendWidth",
] as const;

export const grassGroundGeometryOnlyTargets = [
  "surface.bendDepth",
  "surface.bendRoundness",
  "surface.bendSmoothness",
] as const;

export const grassGroundGeometryInputTargets = [
  "field.width",
  "field.depth",
  "field.edgeIrregularity",
  "field.shapeRoundness",
  "terrain.noiseScale",
  "terrain.detail",
  "terrain.roughness",
  "terrain.heightLevels",
  "terrain.seed",
  "terrain.maxHeight",
  "terrain.noiseOffset",
  "surface.bendEnabled",
  "surface.bendWidth",
  ...grassGroundGeometryOnlyTargets,
] as const;

export const grassButterflyLayoutTargets = [
  "butterflies.count",
  "butterflies.seed",
] as const;

export const grassButterflyLayoutInputTargets = [
  ...grassButterflyLayoutTargets,
  ...grassGroundGeometryInputTargets,
] as const;

export const grassButterflyMotionTargets = [
  "butterflies.sizeRange",
  "butterflies.heightRange",
  "butterflies.flightCycles",
  "butterflies.wingCycles",
  "butterflies.landingTime",
] as const;

export const grassLayoutTargets = [
  "field.densityMax",
  "field.distanceMin",
  "field.topFacingCoverage",
  "field.topFacingFade",
  "preview.bladeCount",
  "blade.curveResolution",
  "blade.heightRange",
] as const;

export const grassDistributionTargets = [
  "field.distributionScale",
  "field.distributionDetail",
  "field.distributionRoughness",
  "field.distributionSeed",
  "field.distributionLevels",
] as const;

export const grassDistributionChangeTargets = [
  "field.distributionOffset",
] as const;

export const lawnDistributionTargets = [
  "lawn.distributionScale",
  "lawn.distributionDetail",
  "lawn.distributionRoughness",
  "lawn.distributionSeed",
  "lawn.distributionLevels",
] as const;

export const lawnDistributionChangeTargets = [
  "lawn.distributionOffset",
] as const;

export const grassCloverBlendTargets = [
  "surface.cloverMaskScale",
  "surface.cloverMaskDetail",
  "surface.cloverMaskRoughness",
  "surface.cloverMaskSeed",
  "surface.cloverMaskLevels",
] as const;

export const grassCloverBlendChangeTargets = [
  "surface.cloverMaskOffset",
] as const;

export const lawnLayoutTargets = [
  "lawn.densityMax",
  "lawn.distanceMin",
  "lawn.seed",
  "preview.lawnBladeCount",
  "lawn.curveResolution",
  "lawn.heightRange",
] as const;

export const grassSharedLayoutChangeTargets = [
  "field.width",
  "field.depth",
  "terrain.noiseOffset",
  "surface.bendEnabled",
] as const;

export const grassLayoutChangeTargets = [
  "field.topFacingOnly",
  "blade.use3d",
] as const;

export const lawnLayoutChangeTargets = ["lawn.use3d"] as const;

export const grassScanLayoutTargets = {
  rocks: [
    "scan.rocks.count",
    "scan.rocks.sizeRange",
    "scan.rocks.clumping",
    "scan.rocks.seed",
    "scan.rocks.surfaceOffset",
    "scan.boulder.size",
    "scan.boulder.seed",
    "scan.boulder.surfaceOffset",
  ],
  tufted: [
    "scan.tufted.count",
    "scan.tufted.sizeRange",
    "scan.tufted.clumping",
    "scan.tufted.seed",
    "scan.tufted.surfaceOffset",
  ],
  white: [
    "scan.white.count",
    "scan.white.sizeRange",
    "scan.white.clumping",
    "scan.white.seed",
    "scan.white.surfaceOffset",
  ],
  wild: [
    "scan.wild.count",
    "scan.wild.sizeRange",
    "scan.wild.clumping",
    "scan.wild.seed",
    "scan.wild.surfaceOffset",
  ],
  yellow: [
    "scan.yellow.count",
    "scan.yellow.sizeRange",
    "scan.yellow.clumping",
    "scan.yellow.seed",
    "scan.yellow.surfaceOffset",
  ],
} as const;

export const grassScanEnabledTargets = {
  rocks: ["scan.rocks.enabled", "scan.boulder.enabled"],
  tufted: ["scan.tufted.enabled"],
  white: ["scan.white.enabled"],
  wild: ["scan.wild.enabled"],
  yellow: ["scan.yellow.enabled"],
} as const;

export const grassScanCommonLayoutTargets = [
  "field.edgeIrregularity",
  "field.shapeRoundness",
  "terrain.noiseScale",
  "terrain.detail",
  "terrain.roughness",
  "terrain.heightLevels",
  "terrain.seed",
  "terrain.maxHeight",
  "surface.bendWidth",
  ...grassSharedLayoutChangeTargets.filter(
    (target) => target !== "terrain.noiseOffset",
  ),
  "terrain.noiseOffset",
] as const;

export const grassScanAllLayoutTargets = [
  ...grassScanLayoutTargets.tufted,
  ...grassScanLayoutTargets.wild,
  ...grassScanLayoutTargets.white,
  ...grassScanLayoutTargets.yellow,
  ...grassScanLayoutTargets.rocks,
  ...grassScanEnabledTargets.tufted,
  ...grassScanEnabledTargets.wild,
  ...grassScanEnabledTargets.white,
  ...grassScanEnabledTargets.yellow,
  ...grassScanEnabledTargets.rocks,
] as const;

export const grassLayoutInputTargets = [
  ...grassLayoutTargets,
  ...grassLayoutChangeTargets,
  ...grassDistributionTargets,
  ...grassDistributionChangeTargets,
  ...grassSharedLayoutTargets,
  ...grassSharedLayoutChangeTargets,
] as const;

export const lawnLayoutInputTargets = [
  ...lawnLayoutTargets,
  ...lawnLayoutChangeTargets,
  ...lawnDistributionTargets,
  ...lawnDistributionChangeTargets,
  ...grassSharedLayoutTargets,
  ...grassSharedLayoutChangeTargets,
] as const;

export const grassNoisePreviewTargets = [
  "field.width",
  "field.depth",
  "field.edgeIrregularity",
  "field.shapeRoundness",
  ...grassDistributionTargets,
  ...grassDistributionChangeTargets,
  ...lawnDistributionTargets,
  ...lawnDistributionChangeTargets,
  "terrain.noiseOffset",
  "terrain.noiseScale",
  "terrain.detail",
  "terrain.roughness",
  "terrain.heightLevels",
  "terrain.seed",
  ...grassCloverBlendTargets,
  ...grassCloverBlendChangeTargets,
] as const;

export const grassNoisePreviewInputTargets = [
  ...grassNoisePreviewTargets,
  "renderer.noisePreviewKind",
] as const;

export const grassRenderSliderTargets = [
  "view.orientation",
  "grass.depthOffset",
  "lawn.depthOffset",
  "field.alignToNormals",
  "field.randomRotation",
  "blade.thickness",
  "blade.taperEnd",
  "blade.tilt2d",
  "lawn.thickness",
  "lawn.taperEnd",
  "lawn.tilt2d",
  ...grassButterflyMotionTargets,
  "appearance.pbrRoughness",
  "appearance.colorVariation",
  "appearance.colorContrast",
  "appearance.colorSaturation",
  "appearance.instanceColorWeight1",
  "appearance.instanceColorWeight2",
  "appearance.instanceColorWeight3",
  "lawn.pbrRoughness",
  "lawn.colorVariation",
  "lawn.colorContrast",
  "lawn.colorSaturation",
  "lawn.instanceColorWeight1",
  "lawn.instanceColorWeight2",
  "lawn.instanceColorWeight3",
  "environment.intensity",
  "environment.exposure",
  "environment.fillStrength",
  "environment.keyStrength",
  "environment.rimStrength",
  "environment.sceneContrast",
  "environment.sceneSaturation",
  "environment.highlightWarmth",
  "environment.shadowCoolness",
  "environment.rotation",
  "environment.rotationX",
  "environment.rotationZ",
  "environment.sunPatchCoverage",
  "environment.sunPatchScale",
  "environment.sunPatchSeed",
  "environment.sunPatchSoftness",
  "environment.sunPatchStrength",
  "environment.backgroundBlur",
  "surface.colorContrast",
  "surface.colorSaturation",
  "surface.brightness",
  "scan.tufted.colorContrast",
  "scan.tufted.colorSaturation",
  "scan.tufted.pbrBrightness",
  "scan.tufted.pbrNormalStrength",
  "scan.tufted.pbrRoughness",
  "scan.wild.colorContrast",
  "scan.wild.colorSaturation",
  "scan.wild.pbrBrightness",
  "scan.wild.pbrNormalStrength",
  "scan.wild.pbrRoughness",
  "scan.white.colorContrast",
  "scan.white.colorSaturation",
  "scan.white.pbrBrightness",
  "scan.white.pbrNormalStrength",
  "scan.white.pbrRoughness",
  "scan.yellow.colorContrast",
  "scan.yellow.colorSaturation",
  "scan.yellow.pbrBrightness",
  "scan.yellow.pbrNormalStrength",
  "scan.yellow.pbrRoughness",
  "scan.rocks.colorContrast",
  "scan.rocks.colorSaturation",
  "scan.rocks.pbrBrightness",
  "scan.rocks.pbrNormalStrength",
  "scan.rocks.pbrRoughness",
  "scan.boulder.colorContrast",
  "scan.boulder.colorSaturation",
  "scan.boulder.pbrBrightness",
  "scan.boulder.pbrNormalStrength",
  "scan.boulder.pbrRoughness",
  "surface.textureScale",
  "surface.normalStrength",
  "surface.roughness",
  "surface.cloverTextureScale",
  "surface.cloverNormalStrength",
  "surface.cloverRoughness",
  "surface.edgeFadeWidth",
  "surface.edgeFadeStrength",
  "groundShadow.offsetY",
  "groundShadow.offsetZ",
  "groundShadow.scale",
  "groundShadow.blur",
  "groundShadow.strength",
  "wind.directionAngle",
  "wind.directionResponse",
  "wind.flow",
  "wind.gustCycles",
  "wind.gustWidth",
  "wind.strength",
  "wind.noiseStrength",
  "wind.noiseScale",
  "wind.noiseDetail",
  "wind.rampUp",
  "wind.release",
  "wind.seed",
  "wind.surfaceTiltDown",
  "wind.surfaceTiltLeft",
  "wind.surfaceTiltRight",
  "wind.surfaceTiltSmoothing",
  "wind.surfaceTiltUp",
  "wind.swayCycles",
  "wind.swayStrength",
  "wind.swayVariation",
  "canvas.renderScale",
] as const;

export const grassRenderChangeTargets = [
  "field.showGround",
  "grass.enabled",
  "lawn.enabled",
  "appearance.bladeGradient",
  "appearance.instanceColor1",
  "appearance.instanceColor2",
  "appearance.instanceColor3",
  "lawn.bladeGradient",
  "lawn.instanceColor1",
  "lawn.instanceColor2",
  "lawn.instanceColor3",
  "appearance.groundColor",
  "surface.cloverColor",
  "surface.receiveShadows",
  "groundShadow.color",
  "scan.tufted.pbrTint",
  "scan.wild.pbrTint",
  "scan.white.pbrTint",
  "scan.yellow.pbrTint",
  "scan.rocks.pbrTint",
  "scan.rocks.shadowColor",
  "scan.boulder.pbrTint",
  "scan.boulder.shadowColor",
  "environment.sunPatchEnabled",
  "environment.sunPatchOffset",
  "environment.visible",
  "environment.fillColor",
  "environment.keyColor",
  "environment.rimColor",
  "export.includeBackground",
  "scene.background",
  "wind.mode",
  "canvas.aspectRatio",
  "canvas.size.width",
  "canvas.size.height",
] as const;

export const grassEnvironmentChangeTargets = ["environment.preset"] as const;

export const grassEnvironmentMediaTargets = ["environment.hdriFile"] as const;

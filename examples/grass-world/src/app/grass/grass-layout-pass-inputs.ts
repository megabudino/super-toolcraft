import type { GrassSettings } from "./grass-settings-types";

export function getGrassCoveragePassInputs(settings: GrassSettings) {
  return {
    "field.distributionDetail": settings.field.distribution.detail,
    "field.distributionLevels": settings.field.distribution.levels.join(":"),
    "field.distributionOffset": settings.field.distribution.offset.join(":"),
    "field.distributionRoughness": settings.field.distribution.roughness,
    "field.distributionScale": settings.field.distribution.scale,
    "field.distributionSeed": settings.field.distribution.seed,
    "field.seed": settings.field.seed,
  } as const;
}

export function getLawnCoveragePassInputs(settings: GrassSettings) {
  return {
    "lawn.distributionDetail": settings.lawn.distribution.detail,
    "lawn.distributionLevels": settings.lawn.distribution.levels.join(":"),
    "lawn.distributionOffset": settings.lawn.distribution.offset.join(":"),
    "lawn.distributionRoughness": settings.lawn.distribution.roughness,
    "lawn.distributionScale": settings.lawn.distribution.scale,
    "lawn.distributionSeed": settings.lawn.distribution.seed,
  } as const;
}

export function getGrassGroundGeometryPassInputs(settings: GrassSettings) {
  return {
    "field.depth": settings.field.depth,
    "field.edgeIrregularity": settings.field.edgeIrregularity,
    "field.shapeRoundness": settings.field.shapeRoundness,
    "field.width": settings.field.width,
    "surface.bendDepth": settings.surface.bend.depth,
    "surface.bendEnabled": settings.surface.bend.enabled,
    "surface.bendRoundness": settings.surface.bend.roundness,
    "surface.bendSmoothness": settings.surface.bend.smoothness,
    "surface.bendWidth": settings.surface.bend.width,
    "terrain.detail": settings.terrain.detail,
    "terrain.heightLevels": settings.terrain.heightLevels.join(":"),
    "terrain.maxHeight": settings.terrain.maxHeight,
    "terrain.noiseOffset": settings.terrain.noiseOffset.join(":"),
    "terrain.noiseScale": settings.terrain.noiseScale,
    "terrain.roughness": settings.terrain.roughness,
    "terrain.seed": settings.terrain.seed,
  } as const;
}

export function getGrassLayoutPassInputs(settings: GrassSettings) {
  return {
    "blade.curveResolution": settings.blade.curveResolution,
    "blade.heightRange": `${settings.blade.heightMin}:${settings.blade.heightMax}`,
    "blade.use3d": settings.blade.use3d,
    "field.densityMax": settings.field.densityMax,
    "field.depth": settings.field.depth,
    "field.edgeIrregularity": settings.field.edgeIrregularity,
    "field.distanceMin": settings.field.distanceMin,
    ...getGrassCoveragePassInputs(settings),
    "field.topFacingCoverage": settings.field.topFacingCoverage,
    "field.topFacingFade": settings.field.topFacingFade,
    "field.topFacingOnly": settings.field.topFacingOnly,
    "field.width": settings.field.width,
    "field.shapeRoundness": settings.field.shapeRoundness,
    "preview.bladeCount": settings.preview.bladeCount,
    "surface.bendEnabled": settings.surface.bend.enabled,
    "surface.bendWidth": settings.surface.bend.width,
    "terrain.detail": settings.terrain.detail,
    "terrain.heightLevels": settings.terrain.heightLevels.join(":"),
    "terrain.maxHeight": settings.terrain.maxHeight,
    "terrain.noiseOffset": settings.terrain.noiseOffset.join(":"),
    "terrain.noiseScale": settings.terrain.noiseScale,
    "terrain.roughness": settings.terrain.roughness,
    "terrain.seed": settings.terrain.seed,
  } as const;
}

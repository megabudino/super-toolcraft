export const grassTallConditionalControls = [
  ["grass.density", "field.densityMax"],
  ["grass.distance", "field.distanceMin"],
  ["grass.offset", "grass.depthOffset"],
  ["grass.seed", "field.seed"],
  ["grass.distribution-scale", "field.distributionScale"],
  ["grass.distribution-detail", "field.distributionDetail"],
  ["grass.distribution-roughness", "field.distributionRoughness"],
  ["grass.distribution-seed", "field.distributionSeed"],
] as const;

export const grassSurfaceConditionalControls = [
  ["grass.surface-texture-scale", "surface.textureScale"],
  ["grass.surface-normal-strength", "surface.normalStrength"],
  ["grass.surface-roughness", "surface.roughness"],
  ["grass.clover-texture-scale", "surface.cloverTextureScale"],
  ["grass.clover-normal-strength", "surface.cloverNormalStrength"],
  ["grass.clover-roughness", "surface.cloverRoughness"],
  ["grass.clover-mask-scale", "surface.cloverMaskScale"],
  ["grass.clover-mask-detail", "surface.cloverMaskDetail"],
  ["grass.clover-mask-roughness", "surface.cloverMaskRoughness"],
  ["grass.clover-mask-seed", "surface.cloverMaskSeed"],
] as const;

export const grassSurfaceLightingConditionalControls = [
  ["grass.surface-brightness", "surface.brightness"],
  ["grass.surface-receive-shadows", "surface.receiveShadows"],
] as const;

export const grassSurfaceLightingControls = [
  ["grass.surface-receive-shadows", "surface.receiveShadows", "switch"],
  ["grass.surface-brightness", "surface.brightness", "slider"],
] as const;

export const grassGroundShadowConditionalControls = [
  ["grass.ground-shadow-offset-y", "groundShadow.offsetY"],
  ["grass.ground-shadow-offset-z", "groundShadow.offsetZ"],
  ["grass.ground-shadow-scale", "groundShadow.scale"],
  ["grass.ground-shadow-blur", "groundShadow.blur"],
  ["grass.ground-shadow-color", "groundShadow.color"],
  ["grass.ground-shadow-strength", "groundShadow.strength"],
] as const;

export const grassGroundShadowControls = [
  ["grass.ground-shadow-offset-y", "groundShadow.offsetY", "slider"],
  ["grass.ground-shadow-offset-z", "groundShadow.offsetZ", "slider"],
  ["grass.ground-shadow-scale", "groundShadow.scale", "slider"],
  ["grass.ground-shadow-blur", "groundShadow.blur", "slider"],
  ["grass.ground-shadow-color", "groundShadow.color", "color"],
  ["grass.ground-shadow-strength", "groundShadow.strength", "slider"],
] as const;

export const grassBasicControls = [
  ["grass.field-width", "field.width", "text"],
  ["grass.field-depth", "field.depth", "text"],
  ["grass.density", "field.densityMax", "slider"],
  ["grass.distance", "field.distanceMin", "slider"],
  ["grass.offset", "grass.depthOffset", "slider"],
  ["grass.seed", "field.seed", "slider"],
  ["grass.distribution-scale", "field.distributionScale", "slider"],
  ["grass.distribution-detail", "field.distributionDetail", "slider"],
  ["grass.distribution-roughness", "field.distributionRoughness", "slider"],
  ["grass.distribution-seed", "field.distributionSeed", "slider"],
  ["grass.terrain-scale", "terrain.noiseScale", "slider"],
  ["grass.terrain-detail", "terrain.detail", "slider"],
  ["grass.terrain-roughness", "terrain.roughness", "slider"],
  ["grass.terrain-seed", "terrain.seed", "slider"],
  ["grass.align", "field.alignToNormals", "slider"],
  ["grass.rotation", "field.randomRotation", "slider"],
  ["grass.top-facing", "field.topFacingOnly", "switch"],
  ["grass.show-ground", "field.showGround", "switch"],
  ["grass.resolution", "blade.curveResolution", "slider"],
  ["grass.thickness", "blade.thickness", "slider"],
  ["grass.taper", "blade.taperEnd", "slider"],
  ["grass.tilt", "blade.tilt2d", "slider"],
  ["grass.3d", "blade.use3d", "switch"],
  ["grass.ground-color", "appearance.groundColor", "color"],
  ["grass.clover-color", "surface.cloverColor", "color"],
  ["grass.surface-texture-scale", "surface.textureScale", "slider"],
  ["grass.surface-normal-strength", "surface.normalStrength", "slider"],
  ["grass.surface-roughness", "surface.roughness", "slider"],
  ["grass.clover-texture-scale", "surface.cloverTextureScale", "slider"],
  ["grass.clover-normal-strength", "surface.cloverNormalStrength", "slider"],
  ["grass.clover-roughness", "surface.cloverRoughness", "slider"],
  ["grass.clover-mask-scale", "surface.cloverMaskScale", "slider"],
  ["grass.clover-mask-detail", "surface.cloverMaskDetail", "slider"],
  ["grass.clover-mask-roughness", "surface.cloverMaskRoughness", "slider"],
  ["grass.clover-mask-seed", "surface.cloverMaskSeed", "slider"],
  ["grass.surface-edge-fade-width", "surface.edgeFadeWidth", "slider"],
  ["grass.surface-edge-fade-strength", "surface.edgeFadeStrength", "slider"],
] as const;

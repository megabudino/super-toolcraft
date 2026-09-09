import type { GrassSettings } from "./grass-settings-types";

export function getGrassButterflyLayoutPassInputs(settings: GrassSettings) {
  return {
    "butterflies.count": settings.butterflies.count,
    "butterflies.seed": settings.butterflies.seed,
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


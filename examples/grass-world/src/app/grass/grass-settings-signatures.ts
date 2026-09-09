import type { GrassSettings } from "./grass-settings-types";

export function getGrassGroundGeometryKey(settings: GrassSettings): string {
  return JSON.stringify({
    field: {
      depth: settings.field.depth,
      edgeIrregularity: settings.field.edgeIrregularity,
      shapeRoundness: settings.field.shapeRoundness,
      width: settings.field.width,
    },
    surfaceBend: settings.surface.bend,
    terrain: settings.terrain,
  });
}

export function getGrassLayoutKey(settings: GrassSettings): string {
  return JSON.stringify({
    blade: {
      curveResolution: settings.blade.curveResolution,
      heightMax: settings.blade.heightMax,
      heightMin: settings.blade.heightMin,
      use3d: settings.blade.use3d,
    },
    field: {
      densityMax: settings.field.densityMax,
      depth: settings.field.depth,
      distanceMin: settings.field.distanceMin,
      distribution: settings.field.distribution,
      edgeIrregularity: settings.field.edgeIrregularity,
      seed: settings.field.seed,
      shapeRoundness: settings.field.shapeRoundness,
      topFacingCoverage: settings.field.topFacingCoverage,
      topFacingFade: settings.field.topFacingFade,
      topFacingOnly: settings.field.topFacingOnly,
      width: settings.field.width,
    },
    previewDetail: settings.preview.bladeCount,
    surfaceBend: {
      enabled: settings.surface.bend.enabled,
      width: settings.surface.bend.width,
    },
    terrain: settings.terrain,
  });
}

export function getLawnLayoutKey(settings: GrassSettings): string {
  return JSON.stringify({
    field: {
      depth: settings.field.depth,
      edgeIrregularity: settings.field.edgeIrregularity,
      seed: settings.field.seed,
      shapeRoundness: settings.field.shapeRoundness,
      width: settings.field.width,
    },
    lawn: {
      curveResolution: settings.lawn.curveResolution,
      densityMax: settings.lawn.densityMax,
      distanceMin: settings.lawn.distanceMin,
      distribution: settings.lawn.distribution,
      heightMax: settings.lawn.heightMax,
      heightMin: settings.lawn.heightMin,
      seed: settings.lawn.seed,
      use3d: settings.lawn.use3d,
    },
    previewDetail: settings.preview.lawnBladeCount,
    surfaceBend: {
      enabled: settings.surface.bend.enabled,
      width: settings.surface.bend.width,
    },
    terrain: settings.terrain,
  });
}

export function getGrassRenderKey(settings: GrassSettings): string {
  return JSON.stringify({
    ...settings,
    environment: {
      ...settings.environment,
      source: {
        cacheKey: settings.environment.source.cacheKey,
        fileName: settings.environment.source.fileName,
        kind: settings.environment.source.kind,
      },
    },
    wind: {
      ...settings.wind,
      audioVolume: undefined,
    },
  });
}

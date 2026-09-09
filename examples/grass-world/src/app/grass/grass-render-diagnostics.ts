import { calculateGrassBladeCount, calculateLawnBladeCount } from "./grass-layout";
import { publishGrassButterflyDiagnostics } from "./grass-butterfly-diagnostics";
import { grassScanLayerKinds, type GrassScanLayerKind } from "./grass-scan-contract";
import type { GrassSceneRenderer } from "./grass-scene";
import type { GrassSettings } from "./grass-settings-types";
import { publishGrassSurfaceTiltDiagnostics } from "./grass-surface-tilt";
import { getGrassWindDirectionVector } from "./grass-wind";

type GrassDiagnosticSurface = Readonly<{
  canvas: HTMLCanvasElement;
  host: HTMLDivElement;
}>;

export function publishGrassLayerVisibility({
  canvas,
  host,
  settings,
}: GrassDiagnosticSurface & Readonly<{ settings: GrassSettings }>): void {
  const terrainVisible = String(settings.field.showGround);
  canvas.dataset.grassLayerTerrain = terrainVisible;
  host.dataset.grassLayerTerrain = terrainVisible;
  canvas.dataset.grassLayerLawn = String(settings.lawn.enabled);
  host.dataset.grassLayerLawn = canvas.dataset.grassLayerLawn;
  canvas.dataset.grassLayerTall = String(settings.grass.enabled);
  host.dataset.grassLayerTall = canvas.dataset.grassLayerTall;
  canvas.dataset.grassLayerButterflies = String(settings.butterflies.enabled);
  host.dataset.grassLayerButterflies = canvas.dataset.grassLayerButterflies;
  for (const kind of grassScanLayerKinds) {
    const visible = String(settings.scans[kind].enabled);
    canvas.setAttribute(`data-grass-scan-layer-${kind}`, visible);
    host.setAttribute(`data-grass-scan-layer-${kind}`, visible);
  }
  const boulderVisible = String(settings.scans.boulder.enabled);
  canvas.setAttribute("data-grass-scan-layer-boulder", boulderVisible);
  host.setAttribute("data-grass-scan-layer-boulder", boulderVisible);
}

export type GrassPublishedFrame = Readonly<{
  signature: string;
  windActivation: number;
  windDirectionAngle: number;
  windDirectionVector: readonly [number, number];
  windPointerActive: boolean;
}>;

export function publishGrassSceneFrameDiagnostics({
  butterflyLayoutSignature,
  butterflyResourceSignature,
  canvas,
  host,
  includeBackground,
  progress,
  renderKey,
  scene,
  settings,
}: GrassDiagnosticSurface &
  Readonly<{
    butterflyLayoutSignature: string;
    butterflyResourceSignature: string;
    includeBackground: boolean;
    progress: number;
    renderKey: string;
    scene: GrassSceneRenderer;
    settings: GrassSettings;
  }>): GrassPublishedFrame {
  const renderedBladeCount =
    scene.getRenderedTallBladeCount() + scene.getRenderedLawnBladeCount();
  const renderedTallBladeCount = scene.getRenderedTallBladeCount();
  const renderedLawnBladeCount = scene.getRenderedLawnBladeCount();
  const diagnostics = scene.getRenderDiagnostics();
  const values = {
    grassDetailedLawnBladeCount: diagnostics.detailedLawnBlades,
    grassDetailedTallBladeCount: diagnostics.detailedTallBlades,
    grassLightweightLawnBladeCount: diagnostics.lightweightLawnBlades,
    grassLightweightTallBladeCount: diagnostics.lightweightTallBlades,
    grassRenderCalls: diagnostics.calls,
    grassRenderedBladeCount: renderedBladeCount,
    grassRenderedLawnBladeCount: renderedLawnBladeCount,
    grassRenderedLawnClumpCount: diagnostics.clumpCount,
    grassRenderedTallBladeCount: renderedTallBladeCount,
    grassRenderTriangles: diagnostics.triangles,
    grassShadowUpdated: diagnostics.shadowUpdated,
  } as const;
  for (const [key, value] of Object.entries(values)) {
    canvas.dataset[key] = String(value);
    host.dataset[key] = String(value);
  }
  publishGrassButterflyDiagnostics({
    canvas,
    diagnostics,
    host,
    layoutSignature: butterflyLayoutSignature,
    resourceSignature: butterflyResourceSignature,
    settings,
  });
  const [surfaceTiltXDegrees, surfaceTiltZDegrees] =
    publishGrassSurfaceTiltDiagnostics(
      canvas,
      host,
      diagnostics.surfaceTiltX,
      diagnostics.surfaceTiltZ,
    );
  const windDirectionVector = getGrassWindDirectionVector(
    diagnostics.windDirectionAngle,
  );
  return {
    signature: `${renderKey}:${progress.toFixed(5)}:${diagnostics.windActivation.toFixed(4)}:${diagnostics.windDirectionAngle.toFixed(3)}:${surfaceTiltXDegrees.toFixed(3)}:${surfaceTiltZDegrees.toFixed(3)}:${includeBackground ? 1 : 0}`,
    windActivation: diagnostics.windActivation,
    windDirectionAngle: diagnostics.windDirectionAngle,
    windDirectionVector,
    windPointerActive: diagnostics.windPointerActive,
  };
}

type GrassRenderDiagnostics = Readonly<{
  bladeCount: number;
  boulderCount: number;
  canvas: HTMLCanvasElement;
  environmentSignature: string;
  groundGeometryKey: string;
  groundMinimumHeight: number;
  host: HTMLDivElement;
  includeBackground: boolean;
  layoutKey: string;
  layoutSignature: string;
  lawnBladeCount: number;
  lawnLayoutKey: string;
  progress: number;
  renderKey: string;
  renderScale: number;
  scanCounts: Readonly<Record<GrassScanLayerKind, number>>;
  scanResourceSignature: string;
  settings: GrassSettings;
  signature: string;
  tallBladeCount: number;
  windActivation: number;
  windDirectionAngle: number;
  windDirectionVector: readonly [number, number];
  windPointerActive: boolean;
  windProgress: number;
}>;

export function publishGrassRenderDiagnostics({
  bladeCount,
  boulderCount,
  canvas,
  environmentSignature,
  groundGeometryKey,
  groundMinimumHeight,
  host,
  includeBackground,
  layoutKey,
  layoutSignature,
  lawnBladeCount,
  lawnLayoutKey,
  progress,
  renderKey,
  renderScale,
  scanCounts,
  scanResourceSignature,
  settings,
  signature,
  tallBladeCount,
  windActivation,
  windDirectionAngle,
  windDirectionVector,
  windPointerActive,
  windProgress,
}: GrassRenderDiagnostics): void {
  const fieldArea = settings.field.width * settings.field.depth;
  const tallRequestedCount = calculateGrassBladeCount(settings);
  const lawnRequestedCount = calculateLawnBladeCount(settings);
  const windFrameSignature = {
    ...settings.wind,
    activation: Number(windActivation.toFixed(4)),
    directionAngle: Number(windDirectionAngle.toFixed(3)),
    directionVector: windDirectionVector,
    pointerActive: windPointerActive,
    progress: Number(windProgress.toFixed(5)),
  };

  canvas.dataset.grassBladeCount = String(bladeCount);
  canvas.dataset.grassTallBladeCount = String(tallBladeCount);
  canvas.dataset.grassLawnBladeCount = String(lawnBladeCount);
  canvas.dataset.grassTallRequestedRootCount = String(tallRequestedCount);
  canvas.dataset.grassLawnRequestedRootCount = String(lawnRequestedCount);
  canvas.dataset.grassTallRootsPerSquareMeter = String(tallBladeCount / fieldArea);
  canvas.dataset.grassLawnRootsPerSquareMeter = String(lawnBladeCount / fieldArea);
  canvas.dataset.grassBackground = settings.scene.background;
  canvas.dataset.grassFrameSignature = signature;
  canvas.dataset.grassSettingsSignature = renderKey;
  canvas.dataset.grassLayoutSignature = layoutSignature;
  canvas.dataset.grassTallFrameSignature = JSON.stringify({
    enabled: settings.grass.enabled,
    layout: layoutKey,
    wind: windFrameSignature,
  });
  canvas.dataset.grassLawnFrameSignature = JSON.stringify({
    enabled: settings.lawn.enabled,
    environment: environmentSignature,
    lawn: settings.lawn,
    layout: lawnLayoutKey,
    wind: windFrameSignature,
  });
  canvas.dataset.grassGradient = JSON.stringify(settings.appearance.bladeGradient);
  canvas.dataset.grassLawnGradient = JSON.stringify(settings.lawn.bladeGradient);
  canvas.dataset.grassHeightRange = JSON.stringify([
    settings.blade.heightMin,
    settings.blade.heightMax,
  ]);
  canvas.dataset.grassLawnHeightRange = JSON.stringify([
    settings.lawn.heightMin,
    settings.lawn.heightMax,
  ]);
  canvas.dataset.grassTerrainHeightLevels = JSON.stringify(settings.terrain.heightLevels);
  canvas.dataset.grassTerrainMaxHeight = String(settings.terrain.maxHeight);
  canvas.dataset.grassTerrainSignature = JSON.stringify({
    detail: settings.terrain.detail,
    levels: settings.terrain.heightLevels,
    maxHeight: settings.terrain.maxHeight,
    offset: settings.terrain.noiseOffset,
    roughness: settings.terrain.roughness,
    scale: settings.terrain.noiseScale,
    seed: settings.terrain.seed,
  });
  canvas.dataset.grassFieldShapeSignature = JSON.stringify({
    depth: settings.field.depth,
    irregularity: settings.field.edgeIrregularity,
    roundness: settings.field.shapeRoundness,
    seed: settings.terrain.seed,
    width: settings.field.width,
  });
  canvas.dataset.grassDistributionSignature = JSON.stringify(settings.field.distribution);
  canvas.dataset.grassLawnDistributionSignature = JSON.stringify(
    settings.lawn.distribution,
  );
  canvas.dataset.grassCloverBlendSignature = JSON.stringify({
    material: settings.surface.clover,
    mask: settings.surface.cloverMask,
  });
  canvas.dataset.grassSurfaceEdgeFadeSignature = JSON.stringify(settings.surface.edgeFade);
  canvas.dataset.grassSurfaceBendSignature = JSON.stringify(settings.surface.bend);
  canvas.dataset.grassGroundGeometryKey = groundGeometryKey;
  canvas.dataset.grassGroundMinimumHeight = groundMinimumHeight.toFixed(5);
  canvas.dataset.grassSurfaceBendInnerRadius = String(
    settings.surface.bend.enabled ? 1 - settings.surface.bend.width : 1,
  );
  canvas.dataset.grassIncludeBackground = String(includeBackground);
  canvas.dataset.grassPbrEnabled = "true";
  canvas.dataset.grassEnvironmentPreset = settings.environment.preset;
  canvas.dataset.grassEnvironmentSource = settings.environment.source.kind;
  canvas.dataset.grassEnvironmentSignature = environmentSignature;
  canvas.dataset.grassScanResourceSignature = scanResourceSignature;
  for (const kind of grassScanLayerKinds) {
    const key = `grassScan${kind[0]?.toUpperCase()}${kind.slice(1)}Count`;
    canvas.dataset[key] = String(scanCounts[kind]);
    host.dataset[key] = String(scanCounts[kind]);
  }
  canvas.dataset.grassScanBoulderCount = String(boulderCount);
  host.dataset.grassScanBoulderCount = String(boulderCount);
  canvas.dataset.grassRenderScale = String(renderScale);
  canvas.dataset.grassPreviewRepresentation = "pbr-clumps";
  canvas.dataset.grassPreviewBladeCount = String(settings.preview.bladeCount);
  canvas.dataset.grassPreviewLawnBladeCount = String(settings.preview.lawnBladeCount);
  canvas.dataset.grassWindActivation = windActivation.toFixed(4);
  canvas.dataset.grassWindAuthoredDirectionAngle = String(settings.wind.directionAngle);
  canvas.dataset.grassWindDirectionAngle = windDirectionAngle.toFixed(2);
  canvas.dataset.grassWindDirectionVector = JSON.stringify(windDirectionVector);
  canvas.dataset.grassWindFlow = String(settings.wind.flow);
  canvas.dataset.grassWindMode = settings.wind.mode;
  canvas.dataset.grassWindPointerActive = String(windPointerActive);
  canvas.dataset.grassWindSeed = String(settings.wind.seed);
  canvas.dataset.grassWindSettingsSignature = JSON.stringify(settings.wind);
  canvas.dataset.grassTimelineProgress = progress.toFixed(5);

  host.dataset.grassBladeCount = String(bladeCount);
  host.dataset.grassTallBladeCount = String(tallBladeCount);
  host.dataset.grassLawnBladeCount = String(lawnBladeCount);
  host.dataset.grassTallRequestedRootCount = String(tallRequestedCount);
  host.dataset.grassLawnRequestedRootCount = String(lawnRequestedCount);
  host.dataset.grassTallRootsPerSquareMeter = canvas.dataset.grassTallRootsPerSquareMeter;
  host.dataset.grassLawnRootsPerSquareMeter = canvas.dataset.grassLawnRootsPerSquareMeter;
  host.dataset.grassFrameSignature = signature;
  host.dataset.grassSettingsSignature = renderKey;
  host.dataset.grassLayoutSignature = layoutSignature;
  host.dataset.grassDistributionSignature = canvas.dataset.grassDistributionSignature;
  host.dataset.grassLawnDistributionSignature =
    canvas.dataset.grassLawnDistributionSignature;
  host.dataset.grassCloverBlendSignature = canvas.dataset.grassCloverBlendSignature;
  host.dataset.grassSurfaceEdgeFadeSignature = canvas.dataset.grassSurfaceEdgeFadeSignature;
  host.dataset.grassSurfaceBendSignature = canvas.dataset.grassSurfaceBendSignature;
  host.dataset.grassGroundGeometryKey = groundGeometryKey;
  host.dataset.grassGroundMinimumHeight = canvas.dataset.grassGroundMinimumHeight;
  host.dataset.grassSurfaceBendInnerRadius =
    canvas.dataset.grassSurfaceBendInnerRadius;
  host.dataset.grassPbrEnabled = "true";
  host.dataset.grassEnvironmentPreset = settings.environment.preset;
  host.dataset.grassEnvironmentSource = settings.environment.source.kind;
  host.dataset.grassOrientation = JSON.stringify(settings.view.orientation);
  host.dataset.grassPreviewRepresentation = "pbr-clumps";
  host.dataset.grassPreviewBladeCount = String(settings.preview.bladeCount);
  host.dataset.grassPreviewLawnBladeCount = String(settings.preview.lawnBladeCount);
  host.dataset.grassWindActivation = windActivation.toFixed(4);
  host.dataset.grassWindAuthoredDirectionAngle = String(settings.wind.directionAngle);
  host.dataset.grassWindDirectionAngle = windDirectionAngle.toFixed(2);
  host.dataset.grassWindDirectionVector = JSON.stringify(windDirectionVector);
  host.dataset.grassWindFlow = String(settings.wind.flow);
  host.dataset.grassWindMode = settings.wind.mode;
  host.dataset.grassWindPointerActive = String(windPointerActive);
  host.dataset.grassWindSeed = String(settings.wind.seed);
  host.dataset.grassWindSettingsSignature = canvas.dataset.grassWindSettingsSignature;
  host.dataset.grassTimelineProgress = progress.toFixed(5);
}

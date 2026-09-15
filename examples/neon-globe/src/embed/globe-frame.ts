import { GLOBE_SCENE_SIZE } from "../app/globe-constants";
import { GLOBE_CRT_EXPORT_PHASE_MS } from "../app/globe-crt-effect";
import { drawGlobeFrame } from "../app/globe-frame";
import { getLoopingLogos } from "../app/globe-logo-animation";
import type { GlobeGeometryData, GlobeSettings } from "../app/globe-model";

export function getGlobeBackingSize(width: number, height: number, dpr: number, renderScale: number) {
  const pixelRatio = (Number.isFinite(dpr) && dpr > 0 ? dpr : 1) * renderScale;
  return { width: Math.round(width * pixelRatio), height: Math.round(height * pixelRatio), pixelRatio };
}

export function drawWebsiteGlobe(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: GlobeSettings,
  geometry: GlobeGeometryData,
  elapsedMs: number,
  still: boolean,
): void {
  // Keep line weight proportional to the sphere on portrait as well as wide layouts.
  const lineScale = Math.min(width, height) / GLOBE_SCENE_SIZE.height;
  drawGlobeFrame(context, width, height, {
    ...settings,
    lineWidth: settings.lineWidth * lineScale * GLOBE_SCENE_SIZE.width / width,
    logos: still ? settings.logos : getLoopingLogos(settings.logos, elapsedMs, settings.logoHoldSeconds, settings.logoSpeed),
  }, {
    clear: true,
    crtPhaseMs: still ? GLOBE_CRT_EXPORT_PHASE_MS : elapsedMs,
    geometry,
    includeBackground: settings.includeBackground,
  });
}

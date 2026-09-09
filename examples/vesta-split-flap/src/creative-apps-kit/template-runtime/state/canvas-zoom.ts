export const creativeAppsKitCanvasZoomMin = 25;
export const creativeAppsKitCanvasZoomMax = 400;
export const creativeAppsKitCanvasZoomStep = 10;
export const creativeAppsKitCanvasZoomDefault = 70;

export function clampCreativeAppsKitCanvasZoom(zoom: number): number {
  return Math.min(creativeAppsKitCanvasZoomMax, Math.max(creativeAppsKitCanvasZoomMin, zoom));
}

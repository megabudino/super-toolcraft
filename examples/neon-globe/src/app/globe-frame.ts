import { GLOBE_SCENE_SIZE } from "./globe-constants";
import { applyGlobeCrtEffect, GLOBE_CRT_EXPORT_PHASE_MS } from "./globe-crt-effect";
import { createGlobeGeometry, type GlobeGeometryData, type GlobeSettings } from "./globe-model";
import { createVisibleLineSegments, getOrientationQuaternion } from "./globe-projection";
import { drawBands } from "./globe-band-renderer";
import { GLOBE_SCREEN_RADIUS_RATIO } from "./globe-renderer-settings";

export function drawGlobeFrame(
  context: CanvasRenderingContext2D,
  frameWidth: number,
  frameHeight: number,
  settings: GlobeSettings,
  options: {
    crtPhaseMs?: number;
    clear?: boolean;
    geometry?: GlobeGeometryData;
    includeBackground?: boolean;
  } = {},
): void {
  const centerX = frameWidth / 2;
  const centerY = frameHeight / 2;
  const radius = Math.min(frameWidth, frameHeight) * GLOBE_SCREEN_RADIUS_RATIO;
  const geometry = options.geometry ?? createGlobeGeometry(settings);
  const orientation = getOrientationQuaternion(settings);

  context.save();
  if (options.clear) {
    context.clearRect(0, 0, frameWidth, frameHeight);
  }
  if (options.includeBackground) {
    context.fillStyle = settings.background;
    context.fillRect(0, 0, frameWidth, frameHeight);
  }

  context.fillStyle = settings.sphereColor;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.clip();

  context.strokeStyle = settings.lineColor;
  context.lineWidth = settings.lineWidth * (frameWidth / GLOBE_SCENE_SIZE.width);
  context.lineCap = "butt";
  context.lineJoin = "round";

  for (const path of [...geometry.latitudes, ...geometry.meridians]) {
    for (const segment of createVisibleLineSegments(path.points, orientation)) {
      context.beginPath();
      segment.points.forEach((point, index) => {
        const projected = point.clone().applyQuaternion(orientation);
        const x = centerX + projected.x * radius;
        const y = centerY - projected.y * radius;
        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      if (segment.closed) {
        context.closePath();
      }
      context.stroke();
    }
  }
  context.restore();

  if (settings.outline) {
    context.strokeStyle = settings.lineColor;
    context.lineWidth = settings.lineWidth * (frameWidth / GLOBE_SCENE_SIZE.width);
    context.lineCap = "butt";
    context.lineJoin = "round";
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.stroke();
  }

  drawBands(context, settings, orientation, centerX, centerY, radius);
  applyGlobeCrtEffect(context, frameWidth, frameHeight, options.crtPhaseMs ?? GLOBE_CRT_EXPORT_PHASE_MS, settings.crtIntensity);
  context.restore();
}

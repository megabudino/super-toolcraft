import {
  type LogoSphereCardStyle,
  getLogoSphereCardGeometry,
} from "./logo-sphere-renderer-types";

export function getContextDeviceScale(
  context: CanvasRenderingContext2D,
): number {
  if (typeof context.getTransform !== "function") {
    return 1;
  }

  const transform = context.getTransform();
  const scale = Math.hypot(transform.a, transform.b);

  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

type LogoSphereShadowSprite = Readonly<{
  canvas: CanvasImageSource;
  pad: number;
  size: number;
}>;

const shadowSpriteCache = new Map<string, LogoSphereShadowSprite | null>();
const shadowReferenceCardSize = 112;

// Pre-blurring the base-card shadow once per style keeps the expensive
// Gaussian out of the per-frame, per-card path; cards then draw one scaled
// bitmap whose blur scales with perspective exactly like the direct version.
export function getLogoSphereShadowSprite(
  style: LogoSphereCardStyle,
  baseLogoSize: number,
  deviceScale: number,
): LogoSphereShadowSprite | null {
  if (typeof document === "undefined") {
    return null;
  }
  const resolution = Math.min(4, Math.max(1, Math.round(deviceScale * 2) / 2));
  const key = [
    style.shadowColor,
    style.shadowBlur,
    style.cornerRadius,
    Math.round(baseLogoSize),
    resolution,
  ].join("|");
  const cached = shadowSpriteCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  let sprite: LogoSphereShadowSprite | null = null;
  try {
    const sizeRatio = Math.min(
      1,
      Math.max(0.12, baseLogoSize / shadowReferenceCardSize),
    );
    const spread = Math.max(0, style.shadowBlur) * sizeRatio * 0.18;
    const pad = Math.max(0, style.shadowBlur) * sizeRatio * 2 + spread + 4;
    const size = baseLogoSize + pad * 2;
    const pixelSize = Math.max(1, Math.ceil(size * resolution));
    const offscreen =
      typeof OffscreenCanvas === "undefined"
        ? null
        : new OffscreenCanvas(pixelSize, pixelSize);
    const canvas = offscreen ?? document.createElement("canvas");
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    const spriteContext = canvas.getContext("2d") as
      | CanvasRenderingContext2D
      | null;
    if (spriteContext) {
      spriteContext.scale(resolution, resolution);
      const castOffset = size * 2;
      spriteContext.fillStyle = style.shadowColor;
      spriteContext.shadowColor = style.shadowColor;
      spriteContext.shadowBlur =
        Math.max(0, style.shadowBlur) * sizeRatio * resolution;
      spriteContext.shadowOffsetX = castOffset * resolution;
      spriteContext.shadowOffsetY = 0;
      const geometry = getLogoSphereCardGeometry(
        { size: baseLogoSize },
        baseLogoSize,
        style,
      );
      addRoundedRectPath(
        spriteContext,
        pad - spread - castOffset,
        pad - spread,
        baseLogoSize + spread * 2,
        baseLogoSize + spread * 2,
        geometry.cornerRadius + spread,
      );
      spriteContext.fill();
      sprite = {
        canvas: offscreen ? offscreen.transferToImageBitmap() : canvas,
        pad,
        size,
      };
    }
  } catch {
    sprite = null;
  }

  if (shadowSpriteCache.size > 12) {
    shadowSpriteCache.clear();
  }
  shadowSpriteCache.set(key, sprite);
  return sprite;
}

export function addRoundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(
    Math.max(0, radius),
    Math.max(0, Math.min(width, height) / 2),
  );
  const right = x + width;
  const bottom = y + height;

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(right - safeRadius, y);
  context.quadraticCurveTo(right, y, right, y + safeRadius);
  context.lineTo(right, bottom - safeRadius);
  context.quadraticCurveTo(right, bottom, right - safeRadius, bottom);
  context.lineTo(x + safeRadius, bottom);
  context.quadraticCurveTo(x, bottom, x, bottom - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

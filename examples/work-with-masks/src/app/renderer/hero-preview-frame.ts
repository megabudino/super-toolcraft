import type { HeroRenderFrame } from './hero-pipeline';

export type HeroPreviewWindow = Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>;

export type HeroPreviewFrame = HeroRenderFrame & Readonly<{ css: HeroPreviewWindow }>;

/** World-space composition and device backing must never share zoom ownership. */
export function getHeroPreviewFrame({ width, height, zoom, devicePixelRatio, renderScale, visibleWindow }: {
  width: number;
  height: number;
  zoom: number;
  devicePixelRatio: number;
  renderScale: number;
  /** Window in canonical wave-local units; never a replacement scene frame. */
  visibleWindow?: HeroPreviewWindow;
}): HeroPreviewFrame {
  const pixelScale = zoom / 100 * devicePixelRatio * renderScale;
  const backingWidth = Math.max(1, Math.round(width * pixelScale));
  const backingHeight = Math.max(1, Math.round(height * pixelScale));
  const left = Math.max(0, Math.min(backingWidth - 1, Math.floor((visibleWindow?.left ?? 0) * pixelScale)));
  const top = Math.max(0, Math.min(backingHeight - 1, Math.floor((visibleWindow?.top ?? 0) * pixelScale)));
  const right = Math.max(left + 1, Math.min(backingWidth, Math.ceil(
    visibleWindow ? (visibleWindow.left + visibleWindow.width) * pixelScale : backingWidth,
  )));
  const bottom = Math.max(top + 1, Math.min(backingHeight, Math.ceil(
    visibleWindow ? (visibleWindow.top + visibleWindow.height) * pixelScale : backingHeight,
  )));
  return {
    fullWidth: backingWidth,
    fullHeight: backingHeight,
    width: right - left,
    height: bottom - top,
    tileX: left,
    tileY: top,
    projectionAspect: width / height,
    css: { left: left / pixelScale, top: top / pixelScale,
      width: (right - left) / pixelScale, height: (bottom - top) / pixelScale },
  };
}

/** A filter guard keeps blur kernels outside the visible browser boundary. */
export function getHeroVisibleWindow({ left, top, zoom, viewportWidth, viewportHeight }: {
  left: number; top: number; zoom: number; viewportWidth: number; viewportHeight: number;
}): HeroPreviewWindow {
  const scale = zoom / 100;
  const guard = 96;
  return { left: (-left - guard) / scale, top: (-top - guard) / scale,
    width: (viewportWidth + guard * 2) / scale, height: (viewportHeight + guard * 2) / scale };
}

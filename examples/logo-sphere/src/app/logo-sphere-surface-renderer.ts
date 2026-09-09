import { createLogoSphereGLRenderer, type LogoSphereSurfaceFrame } from "./logo-sphere-gl-renderer";
import { renderLogoSphereFrame, type RenderLogoSphereFrameInput } from "./logo-sphere-renderer";
import { defaultLogoSphereCardStyle } from "./logo-sphere-renderer-types";

export function createLogoSphereSurfaceRenderer(canvas: HTMLCanvasElement,
  options: Readonly<{ fallback?: boolean; invalidate?: () => void; unavailable?: () => void }> = {}) {
  const gpu = options.fallback ? null : createLogoSphereGLRenderer(canvas, options);
  // A canvas cannot change context types after WebGL creation. The React owner
  // remounts this ONE surface for fallback, preserving all pointer handlers.
  const context = gpu ? null : canvas.getContext("2d");
  if (!gpu && !context) { options.unavailable?.(); return null; }
  return {
    kind: gpu ? "webgl2" : "canvas-2d",
    resize(width: number, height: number) {
      if (gpu) gpu.resize(width, height);
      else {
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
      }
    },
    render(input: LogoSphereSurfaceFrame) {
      if (gpu) return gpu.render(input);
      if (!context) return false;
      const { frame } = input.projection;
      const scaleX = canvas.width / frame.width;
      const scaleY = canvas.height / frame.height;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (input.backgroundColor) {
        context.fillStyle = input.backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.setTransform(scaleX, 0, 0, scaleY, -frame.x * scaleX, -frame.y * scaleY);
      renderLogoSphereFrame({ ...input, context });
      return true;
    },
    dispose: () => gpu?.dispose(),
  };
}

let frameSurface: HTMLCanvasElement | null = null;
let frameRenderer: ReturnType<typeof createLogoSphereGLRenderer> = null;

export function disposeLogoSphereFrameSurface(): void {
  frameRenderer?.dispose();
  frameRenderer = null;
  if (frameSurface) frameSurface.width = frameSurface.height = 1;
  frameSurface = null;
}

export function renderLogoSphereSharedFrame(input: RenderLogoSphereFrameInput): void {
  // Intermediate GPU render target only. Runtime supplies the artifact canvas,
  // its exact size/transform and all encoding/download/background decisions.
  if (!frameSurface) {
    frameSurface = document.createElement("canvas");
    frameRenderer = createLogoSphereGLRenderer(frameSurface);
  }
  if (!frameRenderer || frameRenderer.isLost()) { renderLogoSphereFrame(input); return; }
  try {
    frameRenderer.resize(input.context.canvas.width, input.context.canvas.height);
    const rendered = frameRenderer.render({ ...input, backgroundColor: null,
      cardStyle: input.cardStyle ?? defaultLogoSphereCardStyle });
    if (!rendered) { renderLogoSphereFrame(input); return; }
    input.context.save();
    input.context.setTransform(1, 0, 0, 1, 0, 0);
    input.context.drawImage(frameSurface, 0, 0);
    input.context.restore();
  } catch (error) {
    console.warn("Logo sphere uses the full Canvas export fallback.", error);
    renderLogoSphereFrame(input);
  }
}

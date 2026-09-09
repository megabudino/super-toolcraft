import {
  createToolcraftPngExportCanvas,
  getToolcraftTimelineLoopProgress,
  getToolcraftVideoExportSize,
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";

import {
  createMeshGlResource,
  disposeMeshGlResource,
  renderMeshGlFrame,
} from "./mesh-webgl";
import { readColorHex, type MeshGlResource } from "./mesh-model";

let activePreviewResource: MeshGlResource | null = null;

export function setActiveMeshPreviewResource(resource: MeshGlResource | null): void {
  activePreviewResource = resource;
}

function renderImageFrame({
  context,
  cssHeight,
  cssWidth,
  height,
  progress,
  state,
  width,
}: {
  context: CanvasRenderingContext2D;
  cssHeight: number;
  cssWidth: number;
  height: number;
  progress: number;
  state: ToolcraftState;
  width: number;
}): void {
  const retained = activePreviewResource;
  const resource = retained ?? createMeshGlResource(document.createElement("canvas"));
  const previewSize = retained
    ? { height: retained.canvas.height, width: retained.canvas.width }
    : null;

  renderMeshGlFrame({
    height,
    includeBackground: false,
    progress,
    resource,
    state,
    width,
  });
  context.drawImage(resource.canvas, 0, 0, cssWidth, cssHeight);

  if (previewSize) {
    renderMeshGlFrame({
      height: previewSize.height,
      includeBackground: shouldIncludeToolcraftPreviewBackground({ state }),
      progress,
      resource,
      state,
      width: previewSize.width,
    });
  } else {
    disposeMeshGlResource(resource);
  }
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export returned no bytes."))),
      type,
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", () => reject(new Error("SVG image payload could not be read.")));
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("SVG image payload returned no data URL."));
      }
    });
    reader.readAsDataURL(blob);
  });
}

function createMeshStillCanvas(state: ToolcraftState): HTMLCanvasElement {
  const includeBackground = state.values["export.includeBackground"] !== false;
  const resolution = String(state.values["export.image.resolution"] ?? "4k");
  const progress = getToolcraftTimelineLoopProgress({
    currentTimeSeconds: state.timeline.currentTimeSeconds,
    durationSeconds: state.timeline.durationSeconds,
  });
  return createToolcraftPngExportCanvas({
    background: readColorHex(state.values["appearance.background"]),
    includeBackground,
    resolution,
    state,
    render: ({ context, cssHeight, cssWidth, pixelHeight, pixelWidth }) => {
      renderImageFrame({
        context,
        cssHeight,
        cssWidth,
        height: pixelHeight,
        progress,
        state,
        width: pixelWidth,
      });
    },
  });
}

export async function exportMeshImage(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<void> {
  reportProgress(0.1);
  const format = String(state.values["export.image.format"] ?? "png").toLowerCase();
  const canvas = createMeshStillCanvas(state);
  reportProgress(0.75);
  const isJpeg = format === "jpg" || format === "jpeg";
  const blob = await canvasToBlob(canvas, isJpeg ? "image/jpeg" : "image/png", 0.94);
  downloadBlob(blob, `mesh-gradient.${isJpeg ? "jpg" : "png"}`);
  reportProgress(1);
}

export async function exportMeshSvg(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<void> {
  reportProgress(0.1);
  const canvas = createMeshStillCanvas(state);
  reportProgress(0.65);
  const pngBlob = await canvasToBlob(canvas, "image/png");
  reportProgress(0.82);
  const imageDataUrl = await blobToDataUrl(pngBlob);
  const width = Math.max(1, Math.round(state.canvas.size.width));
  const height = Math.max(1, Math.round(state.canvas.size.height));
  const svg = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    "<title>Mesh Gradient</title>",
    `<image href="${imageDataUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"/>`,
    "</svg>",
  ].join("");
  reportProgress(0.95);
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "mesh-gradient.svg");
  reportProgress(1);
}

function chooseRecorderMime(requestedFormat: string): { extension: string; mimeType: string } {
  const candidates =
    requestedFormat === "mp4"
      ? ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"]
      : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
  if (!mimeType) {
    throw new Error("This browser does not provide a supported mesh-gradient video encoder.");
  }
  return { extension: mimeType.startsWith("video/mp4") ? "mp4" : "webm", mimeType };
}

export async function exportMeshVideo(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<void> {
  const resolution = String(state.values["export.video.resolution"] ?? "current");
  const requestedFormat = String(state.values["export.video.format"] ?? "mp4");
  const size = getToolcraftVideoExportSize({ resolution, state });
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const resource = createMeshGlResource(canvas);
  renderMeshGlFrame({
    height: size.height,
    includeBackground: true,
    progress: 0,
    resource,
    state,
    width: size.width,
  });

  const { extension, mimeType } = chooseRecorderMime(requestedFormat);
  const frameRate = 30;
  const stream = canvas.captureStream(frameRate);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000 });
  const chunks: BlobPart[] = [];
  const durationMs = Math.max(100, state.timeline.durationSeconds * 1000);
  const recording = new Promise<Blob>((resolve, reject) => {
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    recorder.addEventListener("error", () => reject(new Error("Video export failed.")));
    recorder.addEventListener("stop", () => resolve(new Blob(chunks, { type: mimeType })));
  });

  recorder.start(250);
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const draw = (now: number) => {
      const elapsed = Math.min(durationMs, now - start);
      const progress = elapsed / durationMs;
      renderMeshGlFrame({
        height: size.height,
        includeBackground: true,
        progress,
        resource,
        state,
        width: size.width,
      });
      reportProgress(progress * 0.92);
      if (elapsed >= durationMs) {
        resolve();
      } else {
        requestAnimationFrame(draw);
      }
    };
    requestAnimationFrame(draw);
  });
  recorder.requestData();
  recorder.stop();
  const blob = await recording;
  if (blob.size === 0) throw new Error("Video export returned no bytes.");
  downloadBlob(blob, `mesh-gradient.${extension}`);
  stream.getTracks().forEach((track) => track.stop());
  disposeMeshGlResource(resource);
  reportProgress(1);
}

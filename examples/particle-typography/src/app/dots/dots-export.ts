import {
  createToolcraftPngExportCanvas,
  getToolcraftTimelineLoopProgress,
  getToolcraftVideoExportSize,
  ToolcraftSceneExportError,
  type ToolcraftExportFrame,
} from "@/toolcraft/runtime";
import type { ToolcraftPanelActionContext } from "@/toolcraft/runtime/react";

import { dotsPipelinePasses } from "./dots-pipeline";
import { renderDotsFrame, renderDotsFrameInChunks } from "./dots-render-frame";
import { getDotPlan } from "./dots-shape";
import {
  DOTS_VIDEO_FRAME_RATE,
  getDotsWorldOrigin,
} from "./dots-scene-bounds";
import { readDotsSettings } from "./dots-values";
import {
  createDotsVideoFrameWorker,
  type DotsVideoFrameWorker,
} from "./dots-video-frame-worker-client";

type ExportContext = Pick<
  ToolcraftPanelActionContext,
  | "rendererPipeline"
  | "reportProgress"
  | "resolveSceneExportFrame"
  | "state"
>;

type RecorderChoice = Readonly<{
  extension: "mp4" | "webm";
  mimeType: string;
}>;

type PngWorkerResponse =
  | Readonly<{ id: number; type: "ready" | "written" }>
  | Readonly<{ bytes: ArrayBuffer; id: number; type: "result" }>
  | Readonly<{ error: string; id: number; type: "error" }>;

function requestPngWorker(
  worker: Worker,
  message: Record<string, unknown> & { id: number },
  transfer: Transferable[] = [],
): Promise<PngWorkerResponse> {
  return new Promise((resolve, reject) => {
    const receive = (event: MessageEvent<PngWorkerResponse>) => {
      if (event.data.id !== message.id) return;
      worker.removeEventListener("message", receive);
      worker.removeEventListener("error", fail);
      if (event.data.type === "error") reject(new Error(event.data.error));
      else resolve(event.data);
    };
    const fail = (event: ErrorEvent) => {
      worker.removeEventListener("message", receive);
      worker.removeEventListener("error", fail);
      reject(new Error(event.message || "PNG worker failed."));
    };
    worker.addEventListener("message", receive);
    worker.addEventListener("error", fail);
    worker.postMessage(message, transfer);
  });
}

async function encodePngRows(
  width: number,
  height: number,
  writeRows: (
    write: (pixels: Uint8ClampedArray, rowCount: number) => Promise<void>,
  ) => Promise<void>,
): Promise<Blob> {
  const worker = new Worker(
    new URL("./dots-png-worker.ts", import.meta.url),
    { type: "module" },
  );
  let requestId = 0;
  try {
    await requestPngWorker(worker, {
      height,
      id: ++requestId,
      type: "start",
      width,
    });
    await writeRows(async (pixels) => {
      const pixelBuffer = pixels.buffer as ArrayBuffer;
      await requestPngWorker(
        worker,
        {
          bytes: pixelBuffer,
          id: ++requestId,
          type: "rows",
        },
        [pixelBuffer],
      );
    });
    const result = await requestPngWorker(worker, {
      id: ++requestId,
      type: "finish",
    });
    if (result.type !== "result") {
      throw new Error("PNG worker did not return encoded bytes.");
    }
    return new Blob([result.bytes], { type: "image/png" });
  } finally {
    worker.terminate();
  }
}

function canStreamPng(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof CompressionStream !== "undefined"
  );
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return canvasToBlobNative(canvas, type, quality);
}

function canvasToBlobNative(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob: Blob | null) => {
        if (blob) resolve(blob);
        else reject(new Error(`Dot Formation could not encode ${type}.`));
      },
      type,
      quality,
    );
  });
}

function downloadBlob(blob: Blob, extension: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const timestamp = new Date().toISOString().replaceAll(":", "-").replace(".", "-");
  anchor.download = `dot-formation-${timestamp}.${extension}`;
  anchor.href = url;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function yieldToAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function createSizingOnlyCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  let logicalWidth = 1;
  let logicalHeight = 1;
  Object.defineProperties(canvas, {
    height: {
      configurable: true,
      get: () => logicalHeight,
      set: (value: number) => {
        logicalHeight = Math.max(0, Math.floor(Number(value) || 0));
      },
    },
    width: {
      configurable: true,
      get: () => logicalWidth,
      set: (value: number) => {
        logicalWidth = Math.max(0, Math.floor(Number(value) || 0));
      },
    },
  });
  return canvas;
}

async function fillExportBackground(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): Promise<void> {
  const stripeHeight = 24;
  context.fillStyle = color;
  for (let row = 0; row < height; row += stripeHeight) {
    context.fillRect(
      x,
      y + row,
      width,
      Math.min(stripeHeight, height - row),
    );
    context.getImageData(0, 0, 1, 1);
    await yieldToAnimationFrame();
  }
}

async function renderTiledPng({
  height,
  includeBackground,
  frame,
  origin,
  pixelRatio,
  progress,
  settings,
  width,
}: Readonly<{
  height: number;
  includeBackground: boolean;
  frame: ToolcraftExportFrame;
  origin: Readonly<{ x: number; y: number }>;
  pixelRatio: number;
  progress: number;
  settings: ReturnType<typeof readDotsSettings>;
  width: number;
}>): Promise<Blob> {
  const tileHeight = Math.min(256, height);
  const tile = document.createElement("canvas");
  tile.width = width;
  tile.height = tileHeight;
  const context = tile.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Dot Formation PNG export requires Canvas 2D.");

  return encodePngRows(width, height, async (write) => {
    for (let y = 0; y < height; y += tileHeight) {
      const rowCount = Math.min(tileHeight, height - y);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, width, tileHeight);
      if (includeBackground) {
        context.fillStyle = settings.appearance.background;
        context.fillRect(0, 0, width, rowCount);
      }
      context.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        (origin.x - frame.x) * pixelRatio,
        (origin.y - frame.y) * pixelRatio - y,
      );
      await renderDotsFrameInChunks(
        context,
        settings.canvas.width,
        settings.canvas.height,
        settings,
        progress,
        {
          batchSize: 512,
          clear: false,
          includeBackground: false,
          yieldControl: yieldToAnimationFrame,
        },
      );
      context.setTransform(1, 0, 0, 1, 0, 0);
      const pixels = context.getImageData(0, 0, width, rowCount).data;
      await write(pixels, rowCount);
      await yieldToAnimationFrame();
    }
  });
}

export function chooseDotsRecorderType(
  requestedFormat: string,
  isTypeSupported: (mimeType: string) => boolean = MediaRecorder.isTypeSupported.bind(
    MediaRecorder,
  ),
): RecorderChoice {
  const mp4 = ["video/mp4;codecs=avc1.42E01E", "video/mp4"] as const;
  const webm = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ] as const;
  const candidates = requestedFormat.toLowerCase() === "webm"
    ? [...webm, ...mp4]
    : [...mp4, ...webm];
  const mimeType = candidates.find((candidate) => isTypeSupported(candidate));
  if (!mimeType) {
    throw new Error("This browser cannot record MP4 or WebM video.");
  }
  return {
    extension: mimeType.startsWith("video/mp4") ? "mp4" : "webm",
    mimeType,
  };
}

export async function exportDotsImage({
  rendererPipeline,
  reportProgress,
  resolveSceneExportFrame,
  state,
}: ExportContext): Promise<void> {
  const settings = readDotsSettings(state);
  const requestedFormat = stringValue(state.values["export.image.format"], "png");
  const isJpeg = requestedFormat === "jpg" || requestedFormat === "jpeg";
  const mimeType = isJpeg ? "image/jpeg" : "image/png";
  const includeBackground = isJpeg
    ? true
    : state.values["export.includeBackground"] !== false;
  const resolution = stringValue(state.values["export.image.resolution"], "4k");
  const streamPng = !isJpeg && canStreamPng();
  const progress = getToolcraftTimelineLoopProgress({
    currentTimeSeconds: state.timeline.currentTimeSeconds,
    durationSeconds: state.timeline.durationSeconds,
  });
  const frameResult = resolveSceneExportFrame();
  if (!frameResult.ok) throw new ToolcraftSceneExportError(frameResult);
  const frame = frameResult.frame;
  const origin = getDotsWorldOrigin(state);
  reportProgress(0.08);

  let output: HTMLCanvasElement | null = null;
  let blob: Blob | null = null;
  const runExport = async (): Promise<void> => {
    await yieldToAnimationFrame();
    let renderSurface: Readonly<{
      context: CanvasRenderingContext2D;
      cssHeight: number;
      cssWidth: number;
      frame: ToolcraftExportFrame;
      pixelRatio: number;
    }> | null = null;
    output = createToolcraftPngExportCanvas({
      background: settings.appearance.background,
      includeBackground: false,
      frame,
      render: ({ context, cssHeight, cssWidth, frame: exportFrame, pixelRatio }) => {
        renderSurface = {
          context,
          cssHeight,
          cssWidth,
          frame: exportFrame,
          pixelRatio,
        };
      },
      resolution,
      state,
      ...(streamPng ? { canvasFactory: createSizingOnlyCanvas } : {}),
    });
    const capturedSurface = renderSurface as {
      context: CanvasRenderingContext2D;
      cssHeight: number;
      cssWidth: number;
      frame: ToolcraftExportFrame;
      pixelRatio: number;
    } | null;
    if (!capturedSurface) {
      throw new Error("Dot Formation image export did not receive a canvas context.");
    }
    const {
      context,
      cssHeight,
      cssWidth,
      frame: exportFrame,
      pixelRatio,
    } = capturedSurface;
    const renderedOutput = output as HTMLCanvasElement;

    if (streamPng) {
      const height = renderedOutput.height;
      const width = renderedOutput.width;
      renderedOutput.width = 1;
      renderedOutput.height = 1;
      await yieldToAnimationFrame();
      blob = await renderTiledPng({
        height,
        includeBackground,
        frame: exportFrame,
        origin,
        pixelRatio,
        progress,
        settings,
        width,
      });
      return;
    }

    context.save();
    context.setTransform(
      pixelRatio,
      0,
      0,
      pixelRatio,
      -exportFrame.x * pixelRatio,
      -exportFrame.y * pixelRatio,
    );
    try {
      if (includeBackground) {
        await fillExportBackground(
          context,
          exportFrame.x,
          exportFrame.y,
          cssWidth,
          cssHeight,
          settings.appearance.background,
        );
      }
      context.translate(origin.x, origin.y);
      await renderDotsFrameInChunks(
        context,
        settings.canvas.width,
        settings.canvas.height,
        settings,
        progress,
        {
          batchSize: 32,
          clear: false,
          includeBackground: false,
          yieldControl: async () => {
            context.getImageData(0, 0, 1, 1);
            await yieldToAnimationFrame();
          },
        },
      );
    } finally {
      context.restore();
    }
    blob = await canvasToBlob(
      renderedOutput,
      mimeType,
      isJpeg ? 0.94 : undefined,
    );
    renderedOutput.width = 1;
    renderedOutput.height = 1;
  };

  if (rendererPipeline) {
    await rendererPipeline.runPass(
      dotsPipelinePasses.imageExport,
      undefined,
      runExport,
    );
  } else {
    await runExport();
  }
  const encodedBlob = blob as Blob | null;
  if (!encodedBlob) {
    throw new Error("Dot Formation image export did not encode output.");
  }
  reportProgress(0.72);
  downloadBlob(encodedBlob, isJpeg ? "jpg" : "png");
  reportProgress(1);
}

export async function exportDotsVideo({
  rendererPipeline,
  reportProgress,
  resolveSceneExportFrame,
  state,
}: ExportContext): Promise<void> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser does not provide MediaRecorder video export.");
  }
  await yieldToAnimationFrame();
  const settings = readDotsSettings(state);
  const requestedFormat = stringValue(state.values["export.video.format"], "mp4");
  const recorderChoice = chooseDotsRecorderType(requestedFormat);
  const resolution = stringValue(state.values["export.video.resolution"], "current");
  const durationSeconds = Math.max(0.25, state.timeline.durationSeconds);
  const frameResult = resolveSceneExportFrame({
    timeRange: { endSeconds: durationSeconds, startSeconds: 0 },
  });
  if (!frameResult.ok) throw new ToolcraftSceneExportError(frameResult);
  const exportFrame = frameResult.frame;
  const { height, width } = getToolcraftVideoExportSize({
    frame: exportFrame,
    resolution,
    state,
  });
  const origin = getDotsWorldOrigin(state);
  const durationMs = durationSeconds * 1000;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Dot Formation video export requires Canvas 2D.");

  let videoFrameWorker: DotsVideoFrameWorker | null = null;
  const stream = canvas.captureStream(DOTS_VIDEO_FRAME_RATE);
  const recorder = new MediaRecorder(stream, {
    mimeType: recorderChoice.mimeType,
    videoBitsPerSecond: resolution === "4k" ? 18_000_000 : 8_000_000,
  });
  const chunks: Blob[] = [];
  const completion = new Promise<Blob>((resolve, reject) => {
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    recorder.addEventListener("error", () => {
      reject(new Error("Dot Formation video recording failed."));
    });
    recorder.addEventListener("stop", () => {
      const blob = new Blob(chunks, { type: recorderChoice.mimeType });
      if (blob.size === 0) reject(new Error("Dot Formation video export was empty."));
      else resolve(blob);
    });
  });
  let frame = 0;
  let finishing = false;
  let renderFailure: unknown;
  let renderPromise: Promise<void> | null = null;
  let queuedProgress: number | null = null;
  const frameIntervalMs = 1_000 / DOTS_VIDEO_FRAME_RATE;

  const prepareFrame = (): void => {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = settings.appearance.background;
    context.fillRect(0, 0, width, height);
    context.setTransform(
      width / exportFrame.width,
      0,
      0,
      height / exportFrame.height,
      (origin.x - exportFrame.x) * (width / exportFrame.width),
      (origin.y - exportFrame.y) * (height / exportFrame.height),
    );
  };

  const draw = (progress: number): void => {
    context.save();
    prepareFrame();
    renderDotsFrame(
      context,
      settings.canvas.width,
      settings.canvas.height,
      settings,
      progress,
      { clear: false, includeBackground: false },
    );
    context.restore();
  };

  const drawWorkerFrame = async (progress: number): Promise<void> => {
    if (!videoFrameWorker) {
      draw(progress);
      return;
    }
    const bitmap = await videoFrameWorker.render(progress);
    try {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.drawImage(bitmap, 0, 0, width, height);
    } finally {
      bitmap.close();
    }
  };

  const drawInitialFrame = async (): Promise<void> => {
    await yieldToAnimationFrame();
    context.save();
    prepareFrame();
    try {
      context.getImageData(0, 0, 1, 1);
      await yieldToAnimationFrame();
      await renderDotsFrameInChunks(
        context,
        settings.canvas.width,
        settings.canvas.height,
        settings,
        0,
        {
          batchSize: 16,
          clear: false,
          includeBackground: false,
          yieldControl: async () => {
            context.getImageData(0, 0, 1, 1);
            await yieldToAnimationFrame();
          },
        },
      );
    } finally {
      context.restore();
    }
  };

  const renderProgressFrame = async (progress: number): Promise<void> => {
    const renderFrame = videoFrameWorker
      ? () => drawWorkerFrame(progress)
      : progress === 0
        ? drawInitialFrame
        : () => {
            draw(progress);
          };
    if (rendererPipeline) {
      await rendererPipeline.runPass(
        dotsPipelinePasses.videoFrame,
        undefined,
        renderFrame,
      );
      return;
    }
    await renderFrame();
  };

  const drainQueuedFrames = async (): Promise<void> => {
    while (!finishing && queuedProgress !== null) {
      const progress = queuedProgress;
      queuedProgress = null;
      await renderProgressFrame(progress);
    }
  };

  const queueProgressFrame = (progress: number): void => {
    queuedProgress = progress;
    if (renderPromise || finishing) return;
    renderPromise = drainQueuedFrames()
      .catch((error: unknown) => {
        renderFailure = error;
        finishing = true;
        if (recorder.state !== "inactive") recorder.stop();
      })
      .finally(() => {
        renderPromise = null;
        if (!finishing && queuedProgress !== null) {
          queueProgressFrame(queuedProgress);
        }
      });
  };

  const finishRecording = async (): Promise<void> => {
    if (finishing) return;
    finishing = true;
    cancelAnimationFrame(frame);
    queuedProgress = null;
    try {
      await renderPromise;
      if (renderFailure) throw renderFailure;
      await renderProgressFrame(1);
      await yieldToAnimationFrame();
      recorder.stop();
    } catch (error) {
      renderFailure = error;
      if (recorder.state !== "inactive") recorder.stop();
    }
  };

  try {
    videoFrameWorker = await createDotsVideoFrameWorker({
      exportFrame,
      height,
      origin,
      plan: getDotPlan(settings),
      settings,
      width,
    });
    await renderProgressFrame(0);
    reportProgress(0);
    recorder.start(1_000);
    const start = performance.now();
    let nextDrawAt = start + frameIntervalMs;
    const tick = (now: number): void => {
      if (finishing) return;
      const elapsed = Math.max(0, now - start);
      const progress = Math.min(1, elapsed / durationMs);
      if (now >= nextDrawAt || elapsed >= durationMs) {
        queueProgressFrame(progress);
        reportProgress(Math.min(0.98, progress));
        do {
          nextDrawAt += frameIntervalMs;
        } while (nextDrawAt <= now);
      }
      if (elapsed >= durationMs) {
        void finishRecording();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const blob = await completion;
    if (renderFailure) throw renderFailure;
    downloadBlob(blob, recorderChoice.extension);
    reportProgress(1);
  } finally {
    finishing = true;
    cancelAnimationFrame(frame);
    videoFrameWorker?.dispose();
    stream.getTracks().forEach((track) => track.stop());
    if (recorder.state !== "inactive") recorder.stop();
    canvas.width = 1;
    canvas.height = 1;
    chunks.length = 0;
  }
}

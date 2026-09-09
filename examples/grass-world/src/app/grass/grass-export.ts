import {
  createToolcraftPngExportCanvas,
  getToolcraftTimelineLoopProgress,
  getToolcraftVideoExportSize,
  type ToolcraftRendererPipelineClient,
  type ToolcraftState,
} from "@/toolcraft/runtime";

import { grassPipelinePasses } from "../app-renderer-pipeline";
import { GrassSceneRenderer } from "./grass-scene";
import { getGrassTimelineProgress, readGrassSettings } from "./grass-values";

type ProgressReporter = (progress: number) => void;

type GrassVideoMime = Readonly<{
  extension: "mp4" | "webm";
  mimeType: string;
}>;

const videoMimePreferences = {
  mp4: [
    { extension: "mp4", mimeType: "video/mp4;codecs=avc1.42E01E" },
    { extension: "mp4", mimeType: "video/mp4" },
    { extension: "webm", mimeType: "video/webm;codecs=vp9" },
    { extension: "webm", mimeType: "video/webm" },
  ],
  webm: [
    { extension: "webm", mimeType: "video/webm;codecs=vp9" },
    { extension: "webm", mimeType: "video/webm;codecs=vp8" },
    { extension: "webm", mimeType: "video/webm" },
    { extension: "mp4", mimeType: "video/mp4" },
  ],
} as const;

export function chooseGrassVideoMime(
  requested: "mp4" | "webm",
  isTypeSupported: (mimeType: string) => boolean,
): GrassVideoMime {
  const supported = videoMimePreferences[requested].find(({ mimeType }) =>
    isTypeSupported(mimeType),
  );
  if (!supported) {
    throw new Error("This browser cannot encode MP4 or WebM video.");
  }
  return supported;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size === 0) {
          reject(new Error(`The ${mimeType} encoder returned an empty file.`));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function renderGrassFrame(
  state: ToolcraftState,
  width: number,
  height: number,
  progress: number,
  includeBackground: boolean,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  const settings = readGrassSettings(state);
  const scene = new GrassSceneRenderer(canvas);
  scene.updateGround(settings);
  scene.updateLayout(settings);
  await Promise.all([scene.prepareScans(), scene.prepareButterflies()]);
  scene.updateScanLayouts(settings);
  scene.updateButterflyLayout(settings);
  await scene.prepareEnvironment(settings);
  await waitForAnimationFrame();
  scene.render(settings, progress, width, height, 1, includeBackground, {
    purpose: "export",
  });
  await waitForAnimationFrame();
  scene.dispose();
  return canvas;
}

export async function exportGrassImage(
  state: ToolcraftState,
  reportProgress: ProgressReporter,
  rendererPipeline?: ToolcraftRendererPipelineClient | null,
): Promise<void> {
  const settings = readGrassSettings(state);
  reportProgress(0.06);
  let renderedFrame: HTMLCanvasElement | null = null;
  const frameTarget: {
    context?: CanvasRenderingContext2D;
    pixelHeight?: number;
    pixelWidth?: number;
  } = {};
  const exportCanvas = createToolcraftPngExportCanvas({
    background: settings.scene.background,
    includeBackground: settings.export.includeBackground,
    resolution: settings.export.imageResolution,
    state,
    render: (frame) => {
      frameTarget.context = frame.context;
      frameTarget.pixelHeight = frame.pixelHeight;
      frameTarget.pixelWidth = frame.pixelWidth;
    },
  });
  if (
    !frameTarget.context ||
    frameTarget.pixelHeight === undefined ||
    frameTarget.pixelWidth === undefined
  ) {
    throw new Error("Toolcraft did not provide an image export frame target.");
  }
  await waitForAnimationFrame();
  renderedFrame = await renderGrassFrame(
    state,
    frameTarget.pixelWidth,
    frameTarget.pixelHeight,
    getGrassTimelineProgress(state),
    false,
  );
  frameTarget.context.setTransform(1, 0, 0, 1, 0, 0);
  frameTarget.context.drawImage(
    renderedFrame,
    0,
    0,
    frameTarget.pixelWidth,
    frameTarget.pixelHeight,
  );
  reportProgress(0.76);
  if (rendererPipeline) {
    await rendererPipeline.runPass(
      grassPipelinePasses.exportFrame,
      undefined,
      () => renderedFrame ?? exportCanvas,
    );
  }
  const isJpeg = settings.export.imageFormat === "jpg";
  const blob = await canvasToBlob(
    exportCanvas,
    isJpeg ? "image/jpeg" : "image/png",
    isJpeg ? 0.94 : undefined,
  );
  reportProgress(0.94);
  downloadBlob(blob, `grass-field.${isJpeg ? "jpg" : "png"}`);
  reportProgress(1);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function stopRecorder(recorder: MediaRecorder): Promise<void> {
  return new Promise((resolve, reject) => {
    recorder.addEventListener("stop", () => resolve(), { once: true });
    recorder.addEventListener(
      "error",
      (event) =>
        reject(
          (event as ErrorEvent).error ?? new Error("Video encoding failed."),
        ),
      { once: true },
    );
    recorder.stop();
  });
}

export async function exportGrassVideo(
  state: ToolcraftState,
  reportProgress: ProgressReporter,
  rendererPipeline?: ToolcraftRendererPipelineClient | null,
): Promise<void> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error(
      "This browser does not provide MediaRecorder video export.",
    );
  }
  const settings = readGrassSettings(state);
  const { height, width } = getToolcraftVideoExportSize({
    resolution: settings.export.videoResolution,
    state,
  });
  const canvas = document.createElement("canvas");
  const scene = new GrassSceneRenderer(canvas);
  scene.updateGround(settings);
  scene.updateLayout(settings);
  await Promise.all([scene.prepareScans(), scene.prepareButterflies()]);
  scene.updateScanLayouts(settings);
  scene.updateButterflyLayout(settings);
  await scene.prepareEnvironment(settings);
  const durationSeconds = Math.max(0.1, state.timeline.durationSeconds);
  const framesPerSecond = 30;
  const frameCount = Math.max(
    2,
    Math.round(durationSeconds * framesPerSecond) + 1,
  );
  scene.render(settings, 0, width, height, 1, true, { purpose: "export" });

  const stream = canvas.captureStream(0);
  const videoTrack = stream.getVideoTracks()[0] as
    CanvasCaptureMediaStreamTrack | undefined;
  if (!videoTrack || typeof videoTrack.requestFrame !== "function") {
    stream.getTracks().forEach((track) => track.stop());
    scene.dispose();
    throw new Error(
      "This browser cannot request deterministic canvas video frames.",
    );
  }
  const mime = chooseGrassVideoMime(settings.export.videoFormat, (candidate) =>
    MediaRecorder.isTypeSupported(candidate),
  );
  const recorder = new MediaRecorder(stream, {
    mimeType: mime.mimeType,
    videoBitsPerSecond: Math.min(
      50_000_000,
      Math.max(12_000_000, Math.round(width * height * 5.5)),
    ),
  });
  const chunks: Blob[] = [];
  let recorderError: unknown;
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });
  recorder.addEventListener("error", (event) => {
    recorderError =
      (event as ErrorEvent).error ?? new Error("Video encoding failed.");
  });
  const startedAt = performance.now();
  recorder.start();
  reportProgress(0.04);
  try {
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      const timestamp = (frameIndex / (frameCount - 1)) * durationSeconds;
      const progress = getToolcraftTimelineLoopProgress({
        currentTimeSeconds: timestamp,
        durationSeconds,
      });
      scene.render(settings, progress, width, height, 1, true, {
        purpose: "export",
      });
      videoTrack.requestFrame();
      reportProgress(0.06 + (frameIndex / frameCount) * 0.84);
      const nextDeadline =
        startedAt + ((frameIndex + 1) / framesPerSecond) * 1_000;
      await wait(Math.max(0, nextDeadline - performance.now()));
    }
    await stopRecorder(recorder);
  } catch (error) {
    if (recorder.state !== "inactive") recorder.stop();
    throw error;
  } finally {
    stream.getTracks().forEach((track) => track.stop());
    scene.dispose();
  }
  if (recorderError) throw recorderError;
  const blob = new Blob(chunks, { type: mime.mimeType });
  if (blob.size === 0)
    throw new Error("The video encoder returned an empty file.");
  if (rendererPipeline) {
    await rendererPipeline.runPass(
      grassPipelinePasses.exportFrame,
      undefined,
      () => canvas,
    );
  }
  reportProgress(0.96);
  downloadBlob(blob, `grass-field.${mime.extension}`);
  reportProgress(1);
}

"use client";

import * as React from "react";
import {
  createToolcraftPngExportCanvas,
  getToolcraftImageExportSize,
  getToolcraftVideoExportSize,
  shouldIncludeToolcraftPreviewBackground,
  ToolcraftSceneExportError,
  type ToolcraftExportFrame,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import {
  useToolcraft,
  useToolcraftPipeline,
  useToolcraftPipelinePass,
  type ToolcraftPanelActionContext,
  type ToolcraftPanelActionHandler,
} from "@/toolcraft/runtime/react";
import { useToolcraftMediaPresentationUrls } from "@/toolcraft/runtime/react/app-shell/toolcraft-source-asset-context";

import {
  decodeDotRingAudioAsset,
  getDefaultDotRingAudioProfile,
  getDotRingAudioAsset,
  getDotRingAudioProfileForState,
} from "./dot-ring-audio";
import {
  drawDotRingFrame,
  drawDotRingGeometryRow,
  getDotRingFrameGeometry,
  getDotRingSettingsFromState,
  getDotRingVideoSettingsFromState,
  type DotRingAudioProfile,
  type DotRingSettings,
} from "./dot-ring-drawing";
import { useDotRingInfinityBounds } from "./dot-ring-infinity-bounds";
import { dotRingPipelinePasses } from "./dot-ring-pipeline";
import {
  DOT_RING_VIDEO_FRAME_RATE,
  getDotRingSceneBoundsForAudio,
  getDotRingWorldOrigin,
} from "./dot-ring-scene-bounds";

type ExportContext = Pick<
  ToolcraftPanelActionContext,
  | "rendererPipeline"
  | "reportProgress"
  | "resolveSceneExportFrame"
  | "state"
>;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForBrowserFrame(): Promise<void> {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

function getTimelineDurationSeconds(state: ToolcraftState): number {
  return Math.max(0.2, state.timeline.durationSeconds);
}

function getTimelineTimeSeconds(state: ToolcraftState): number {
  return Math.max(
    0,
    Math.min(state.timeline.currentTimeSeconds, getTimelineDurationSeconds(state)),
  );
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

async function getAudioProfileForExport(
  state: ToolcraftState,
): Promise<DotRingAudioProfile> {
  return getDotRingAudioProfileForState(state).catch(() =>
    getDefaultDotRingAudioProfile(),
  );
}

function downloadBlob(blob: Blob, extension: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replaceAll(":", "-").replace(".", "-");

  link.href = url;
  link.download = `dot-ring-studio-${timestamp}.${extension}`;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Dot Ring Studio export did not produce a blob."));
      },
      type,
      quality,
    );
  });
}

async function exportDotRingImage({
  rendererPipeline,
  reportProgress,
  resolveSceneExportFrame,
  state,
}: ExportContext): Promise<void> {
  const settings = getDotRingSettingsFromState(state);
  const audioProfile = await getAudioProfileForExport(state);
  const requestedFormat = stringValue(state.values["export.image.format"], "png");
  const isJpeg = requestedFormat === "jpg" || requestedFormat === "jpeg";
  const includeBackground =
    isJpeg || state.values["export.includeBackground"] !== false;
  const resolution = stringValue(
    state.values["export.image.resolution"],
    "4k",
  );
  const frameResult = resolveSceneExportFrame();

  if (!frameResult.ok) {
    throw new ToolcraftSceneExportError(frameResult);
  }

  const frame = frameResult.frame;
  const origin = getDotRingWorldOrigin(state);
  let blob: Blob | null = null;
  reportProgress(0.08);

  const runExport = async (): Promise<void> => {
    const geometry = getDotRingFrameGeometry({
      audioProfile,
      durationSeconds: getTimelineDurationSeconds(state),
      height: state.canvas.size.height,
      settings,
      timeSeconds: getTimelineTimeSeconds(state),
      width: state.canvas.size.width,
    });
    await waitForBrowserFrame();

    const { pixelRatio } = getToolcraftImageExportSize({
      frame,
      resolution,
      state,
    });
    const canvas = createToolcraftPngExportCanvas({
      background: settings.background,
      frame,
      includeBackground,
      render: () => undefined,
      resolution,
      state,
    });
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Dot Ring Studio image export requires Canvas 2D.");
    }

    context.save();
    context.scale(pixelRatio, pixelRatio);
    context.translate(
      origin.x - frame.x,
      origin.y - frame.y,
    );
    const rowCount = Math.ceil(settings.rows);

    for (let row = 0; row < rowCount; row += 1) {
      drawDotRingGeometryRow({ context, geometry, row });
      if (row + 1 < rowCount) await waitForBrowserFrame();
    }

    context.restore();

    blob = await canvasToBlob(
      canvas,
      isJpeg ? "image/jpeg" : "image/png",
      isJpeg ? 0.94 : undefined,
    );
  };

  if (rendererPipeline) {
    await rendererPipeline.runPass(
      dotRingPipelinePasses.imageExport,
      undefined,
      runExport,
    );
  } else {
    await runExport();
  }

  if (!blob) {
    throw new Error("Dot Ring Studio image export did not encode output.");
  }

  reportProgress(0.9);
  downloadBlob(blob, isJpeg ? "jpg" : "png");
  reportProgress(1);
}

function getSupportedVideoMimeType(format: "mp4" | "webm"): string {
  const candidates =
    format === "mp4"
      ? [
          'video/mp4;codecs="avc1.42E01E"',
          "video/mp4",
          'video/webm;codecs="vp9"',
          'video/webm;codecs="vp8"',
          "video/webm",
        ]
      : [
          'video/webm;codecs="vp9"',
          'video/webm;codecs="vp8"',
          "video/webm",
          "video/mp4",
        ];

  const supported = candidates.find((candidate) =>
    MediaRecorder.isTypeSupported(candidate),
  );

  if (!supported) {
    throw new Error("This browser cannot record MP4 or WebM video.");
  }

  return supported;
}

async function recordCanvasVideo({
  canvas,
  frameCount,
  mimeType,
  onFrame,
}: {
  canvas: HTMLCanvasElement;
  frameCount: number;
  mimeType: string;
  onFrame: (frameIndex: number) => void;
}): Promise<Blob> {
  const stream = canvas.captureStream(DOT_RING_VIDEO_FRAME_RATE);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];
  const [track] = stream.getVideoTracks();
  const captureTrack = track as MediaStreamTrack & { requestFrame?: () => void };

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });

  const stopped = new Promise<Blob>((resolve, reject) => {
    recorder.addEventListener(
      "stop",
      () => {
        stream.getTracks().forEach((item) => item.stop());
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size === 0) {
          reject(new Error("Dot Ring Studio video export was empty."));
          return;
        }
        resolve(blob);
      },
      { once: true },
    );
    recorder.addEventListener(
      "error",
      () => reject(new Error("MediaRecorder failed during video export.")),
      { once: true },
    );
  });

  recorder.start();
  const startedAt = performance.now();

  for (let frameIndex = 0; frameIndex <= frameCount; frameIndex += 1) {
    onFrame(frameIndex);
    captureTrack.requestFrame?.();

    const expectedElapsed =
      (frameIndex / DOT_RING_VIDEO_FRAME_RATE) * 1000;
    const actualElapsed = performance.now() - startedAt;
    await wait(Math.max(0, expectedElapsed - actualElapsed));
  }

  await wait(80);
  recorder.stop();
  return stopped;
}

async function exportDotRingVideo({
  rendererPipeline,
  reportProgress,
  resolveSceneExportFrame,
  state,
}: ExportContext): Promise<void> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser does not provide MediaRecorder video export.");
  }

  const settings = getDotRingSettingsFromState(state);
  const audioProfile = await getAudioProfileForExport(state);
  const videoSettings = getDotRingVideoSettingsFromState(state);
  const durationSeconds = getTimelineDurationSeconds(state);
  const frameResult = resolveSceneExportFrame({
    timeRange: { endSeconds: durationSeconds, startSeconds: 0 },
  });

  if (!frameResult.ok) {
    throw new ToolcraftSceneExportError(frameResult);
  }

  const exportFrame = frameResult.frame;
  const exportSize = getToolcraftVideoExportSize({
    frame: exportFrame,
    resolution: videoSettings.resolution,
    state,
  });
  const origin = getDotRingWorldOrigin(state);
  const mimeType = getSupportedVideoMimeType(videoSettings.format);
  const frameCount = Math.max(
    1,
    Math.round(durationSeconds * DOT_RING_VIDEO_FRAME_RATE),
  );
  const canvas = document.createElement("canvas");
  canvas.width = exportSize.width;
  canvas.height = exportSize.height;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Dot Ring Studio video export requires Canvas 2D.");
  }

  const runExport = async (): Promise<Blob> =>
    recordCanvasVideo({
      canvas,
      frameCount,
      mimeType,
      onFrame: (frameIndex) => {
        const timeSeconds = Math.min(
          durationSeconds,
          (frameIndex / frameCount) * durationSeconds,
        );
        const scaleX = exportSize.width / exportFrame.width;
        const scaleY = exportSize.height / exportFrame.height;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fillStyle = settings.background;
        context.fillRect(0, 0, exportSize.width, exportSize.height);
        context.save();
        context.setTransform(
          scaleX,
          0,
          0,
          scaleY,
          (origin.x - exportFrame.x) * scaleX,
          (origin.y - exportFrame.y) * scaleY,
        );
        drawDotRingFrame({
          audioProfile,
          clearCanvas: false,
          context,
          drawBackground: false,
          durationSeconds,
          height: state.canvas.size.height,
          settings,
          timeSeconds,
          width: state.canvas.size.width,
        });
        context.restore();
        reportProgress(frameIndex / frameCount);
      },
    });

  const blob = rendererPipeline
    ? await rendererPipeline.runPass(
        dotRingPipelinePasses.videoFrame,
        undefined,
        runExport,
      )
    : await runExport();
  const extension = mimeType.includes("mp4") ? "mp4" : "webm";

  downloadBlob(blob, extension);
  reportProgress(1);
}

export const handleDotRingPanelAction: ToolcraftPanelActionHandler = (
  context,
) => {
  if (context.action.value === "export.png") {
    return exportDotRingImage(context);
  }

  if (context.action.value === "export.video") {
    return exportDotRingVideo(context);
  }

  return undefined;
};

function useDotRingAudioProfile(state: ToolcraftState): DotRingAudioProfile {
  const pipeline = useToolcraftPipeline();
  const audioAsset = React.useMemo(
    () => getDotRingAudioAsset(state),
    [state.mediaAssets],
  );
  const presentationUrls = useToolcraftMediaPresentationUrls(state.mediaAssets);
  const sourceUrl = audioAsset ? presentationUrls.get(audioAsset.id) : undefined;
  const sourceId = audioAsset
    ? sourceUrl
      ? audioAsset.resourceRef
      : `${audioAsset.resourceRef}:pending`
    : "bundled-default";
  const selectionRevision = audioAsset?.fileName ?? "default";
  const audioPass = useToolcraftPipelinePass(
    dotRingPipelinePasses.audioAnalysis,
    { sourceId },
    () => {
      if (!audioAsset || !sourceUrl) {
        return getDefaultDotRingAudioProfile();
      }

      return decodeDotRingAudioAsset(audioAsset, sourceUrl);
    },
  );
  const previousSelectionRevision = React.useRef(selectionRevision);

  React.useLayoutEffect(() => {
    const selectionChanged =
      previousSelectionRevision.current !== selectionRevision;
    previousSelectionRevision.current = selectionRevision;

    if (
      !selectionChanged ||
      !audioAsset ||
      !pipeline ||
      audioPass.status !== "success"
    ) {
      return;
    }

    void pipeline.runPass(
      dotRingPipelinePasses.audioAnalysis,
      { sourceId },
      () => audioPass.result,
    );
  }, [
    audioAsset,
    audioPass,
    pipeline,
    selectionRevision,
    sourceId,
  ]);

  return audioPass.status === "success"
    ? audioPass.result
    : getDefaultDotRingAudioProfile();
}

function sceneRectKey(frame: ToolcraftExportFrame): string {
  return `${frame.x}:${frame.y}:${frame.width}:${frame.height}`;
}

function getSelectedAudioSourceName(
  state: ToolcraftState,
  audioProfile: DotRingAudioProfile,
): string {
  return getDotRingAudioAsset(state)?.fileName ?? audioProfile.sourceName;
}

export function DotRingRenderer(): React.JSX.Element {
  const { state } = useToolcraft();
  const pipeline = useToolcraftPipeline();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const viewportInteractionRef = React.useRef(false);
  const audioProfile = useDotRingAudioProfile(state);
  const settings = React.useMemo(
    () => getDotRingSettingsFromState(state),
    [state.values],
  );
  const spatialSettingsKey = [
    settings.affectedAmplitude, settings.calmAmplitude, settings.density,
    settings.dotSize, settings.formula, settings.globalRotationSpeed,
    settings.glow, settings.radius, settings.rotationSpeed,
    settings.rowEchoSeconds, settings.rows, settings.sectorAngle,
    settings.sizeResponse, settings.speed,
  ].join(":");
  const includeBackground = shouldIncludeToolcraftPreviewBackground({ state });
  const renderScale = Math.min(
    2,
    Math.max(1, Number(state.values["canvas.renderScale"] ?? 1)),
  );
  const infiniteBounds = useDotRingInfinityBounds({
    audioProfile,
    spatialSettingsKey,
    state,
  });
  const infiniteSceneRect = infiniteBounds.rect;
  const currentInfiniteSceneRect = React.useMemo(() => {
    if (state.canvas.mode !== "infinite" || state.timeline.isPlaying) return null;
    return getDotRingSceneBoundsForAudio({ state }, audioProfile)[0] ?? null;
  }, [
    audioProfile,
    spatialSettingsKey,
    state.canvas.mode,
    state.canvas.size.height,
    state.canvas.size.width,
    state.timeline.currentTimeSeconds,
    state.timeline.durationSeconds,
    state.timeline.isPlaying,
  ]);
  const sceneRect: ToolcraftExportFrame = infiniteSceneRect ?? {
    height: state.canvas.size.height,
    width: state.canvas.size.width,
    x: 0,
    y: 0,
  };
  const sceneKey = sceneRectKey(sceneRect);
  const worldOrigin = getDotRingWorldOrigin(state);
  const timelineDurationSeconds = getTimelineDurationSeconds(state);
  const timelineTimeSeconds = getTimelineTimeSeconds(state);
  const timelineProgress =
    ((timelineTimeSeconds / timelineDurationSeconds) % 1 + 1) % 1;
  const audioSourceName = getSelectedAudioSourceName(state, audioProfile);
  const frameSignature = JSON.stringify({
    audio: audioSourceName,
    background: includeBackground,
    canvas: state.canvas.size,
    progress: Number(timelineProgress.toFixed(5)),
    settings,
  });

  React.useEffect(() => {
    const begin = (event: PointerEvent): void => {
      if (
        event.target instanceof Element &&
        event.target.closest('[data-slot="toolcraft-runtime-canvas"]')
      ) {
        viewportInteractionRef.current = true;
      }
    };
    const end = (): void => {
      viewportInteractionRef.current = false;
    };

    window.addEventListener("pointerdown", begin, true);
    window.addEventListener("pointerup", end, true);
    window.addEventListener("pointercancel", end, true);
    window.addEventListener("blur", end);
    return () => {
      window.removeEventListener("pointerdown", begin, true);
      window.removeEventListener("pointerup", end, true);
      window.removeEventListener("pointercancel", end, true);
      window.removeEventListener("blur", end);
    };
  }, []);

  React.useLayoutEffect(() => {
    if (viewportInteractionRef.current && state.timeline.isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = Math.max(1, Math.round(sceneRect.width * renderScale));
    const height = Math.max(1, Math.round(sceneRect.height * renderScale));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return;

    const render = (): void => {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(renderScale, 0, 0, renderScale, 0, 0);
      context.translate(
        worldOrigin.x - sceneRect.x,
        worldOrigin.y - sceneRect.y,
      );
      drawDotRingFrame({
        audioProfile,
        clearCanvas: false,
        context,
        drawBackground: includeBackground,
        durationSeconds: getTimelineDurationSeconds(state),
        height: state.canvas.size.height,
        settings,
        timeSeconds: getTimelineTimeSeconds(state),
        width: state.canvas.size.width,
      });
      context.restore();
    };

    if (pipeline) {
      void pipeline.runPass(
        dotRingPipelinePasses.previewFrame,
        undefined,
        render,
      );
    } else {
      render();
    }
  }, [
    audioProfile,
    includeBackground,
    pipeline,
    renderScale,
    sceneKey,
    settings,
    state.canvas.size.height,
    state.canvas.size.width,
    state.timeline.currentTimeSeconds,
    state.timeline.durationSeconds,
    state.timeline.isPlaying,
    worldOrigin.x,
    worldOrigin.y,
  ]);

  return (
    <div
      className={
        state.canvas.mode === "infinite"
          ? "absolute pointer-events-none"
          : "relative h-full w-full min-h-0 pointer-events-none"
      }
      data-audio-source={audioSourceName}
      data-background-color={settings.background}
      data-background-visible={includeBackground ? "true" : "false"}
      data-canvas-height={state.canvas.size.height}
      data-canvas-mode={state.canvas.mode}
      data-canvas-width={state.canvas.size.width}
      data-current-scene-height={currentInfiniteSceneRect?.height}
      data-current-scene-width={currentInfiniteSceneRect?.width}
      data-current-scene-x={currentInfiniteSceneRect?.x}
      data-current-scene-y={currentInfiniteSceneRect?.y}
      data-dot-ring-renderer=""
      data-export-image-format={String(state.values["export.image.format"])}
      data-export-image-resolution={String(
        state.values["export.image.resolution"],
      )}
      data-export-video-format={String(state.values["export.video.format"])}
      data-export-video-resolution={String(
        state.values["export.video.resolution"],
      )}
      data-scene-height={sceneRect.height}
      data-scene-bounds-status={infiniteBounds.status}
      data-scene-width={sceneRect.width}
      data-scene-x={sceneRect.x}
      data-scene-y={sceneRect.y}
      data-frame-signature={frameSignature}
      data-toolcraft-product-output="dot-ring"
      data-timeline-duration={state.timeline.durationSeconds}
      data-timeline-playing={state.timeline.isPlaying ? "true" : "false"}
      data-timeline-progress={timelineProgress.toFixed(5)}
      data-timeline-time={timelineTimeSeconds.toFixed(5)}
      style={
        state.canvas.mode === "infinite"
          ? {
              height: sceneRect.height,
              left: sceneRect.x,
              top: sceneRect.y,
              width: sceneRect.width,
            }
          : undefined
      }
    >
      <canvas
        aria-label="Animated dotted circle waveform"
        className="block h-full w-full"
        data-audio-source={audioSourceName}
        data-dot-ring-canvas=""
        data-toolcraft-generated-output=""
        ref={canvasRef}
      />
    </div>
  );
}

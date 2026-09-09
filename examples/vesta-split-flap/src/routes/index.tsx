import {
  createCreativeAppsKitPngExportCanvas,
  getCreativeAppsKitRetinaExportSize,
  shouldIncludeCreativeAppsKitExportBackground,
  type CreativeAppsKitActionSchema,
  type CreativeAppsKitState,
} from "@/creative-apps-kit/template-runtime";
import { CreativeAppsKitApp } from "@/creative-apps-kit/template-runtime/react";

import { appSchema } from "../app/app-schema";
import { CanvasVisualFitGuard } from "../app/canvas-visual-fit-guard";
import { vestaboardControlRenderers } from "../app/final-hold-control";
import { ResidualPanelWheelGuard } from "../app/panel-wheel-guard";
import { VestaboardDefaultTimelineState } from "../app/vestaboard-default-timeline";
import {
  createVestaboardAudioEngine,
  type VestaboardFlapClick,
} from "../app/vestaboard-audio";
import {
  buildVestaboardModel,
  drawVestaboardToCanvas,
  getVestaboardAnimationProgress,
  resolveVestaboardSettings,
  type VestaboardModel,
} from "../app/vestaboard-model";
import { VestaboardRenderer } from "../app/vestaboard-renderer";

function downloadCanvasAsPng(canvas: HTMLCanvasElement, fileName: string): void {
  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportVestaboardPng(state: CreativeAppsKitState): Promise<void> {
  const settings = resolveVestaboardSettings(state.values, state.canvas.size);
  const progress = getVestaboardAnimationProgress({
    durationSeconds: state.timeline.durationSeconds,
    finalHoldSeconds: settings.finalHoldSeconds,
    hasTargetMessage: settings.targetMessage.trim().length > 0,
    timeSeconds: state.timeline.currentTimeSeconds,
  });
  const canvas = createCreativeAppsKitPngExportCanvas({
    background: settings.background,
    includeBackground: state.values["export.includeBackground"] !== false,
    render: ({ context }) => {
      drawVestaboardToCanvas(
        context,
        buildVestaboardModel(settings, {
          durationSeconds: state.timeline.durationSeconds,
          fieldProgress: progress.fieldProgress,
          phraseProgress: progress.phraseProgress,
        }),
      );
    },
    state,
  });

  downloadCanvasAsPng(canvas, "vestaboard.png");
}

function getVideoDevicePixelRatio(state: CreativeAppsKitState): number | undefined {
  if (state.values["export.video.quality"] !== "4k") {
    return undefined;
  }

  const widthRatio = 3840 / Math.max(1, state.canvas.size.width);
  const heightRatio = 2160 / Math.max(1, state.canvas.size.height);
  return Math.max(2, Math.min(4, widthRatio, heightRatio));
}

function getVideoMimeType(format: unknown, withAudio = false): string {
  const webmTypes = withAudio
    ? [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ]
    : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mp4Types = withAudio
    ? [
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4;codecs=avc1.42E01E",
        "video/mp4",
      ]
    : ["video/mp4;codecs=avc1.42E01E", "video/mp4"];
  const candidates =
    format === "mp4"
      ? mp4Types
      : format === "webm"
        ? webmTypes
        : [...mp4Types, ...webmTypes];

  return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? "";
}

function collectVestaboardFlapClicks(
  previousModel: VestaboardModel | null,
  model: VestaboardModel,
): VestaboardFlapClick[] {
  if (!previousModel || previousModel.cells.length !== model.cells.length) {
    return [];
  }

  const clicks: VestaboardFlapClick[] = [];

  for (let index = 0; index < model.cells.length; index += 1) {
    const previousCell = previousModel.cells[index];
    const cell = model.cells[index];

    if (!previousCell || !cell) {
      continue;
    }

    const previousKey = `${previousCell.char}${previousCell.messageFlashColor ?? ""}`;
    const currentKey = `${cell.char}${cell.messageFlashColor ?? ""}`;

    if (previousKey === currentKey) {
      continue;
    }

    clicks.push({
      columnRatio: model.columns <= 1 ? 0.5 : cell.col / (model.columns - 1),
    });
  }

  return clicks;
}

function drawVestaboardVideoFrame({
  canvas,
  context,
  model,
  pixelRatio,
  settings,
  state,
}: {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  model: VestaboardModel;
  pixelRatio: number;
  settings: ReturnType<typeof resolveVestaboardSettings>;
  state: CreativeAppsKitState;
}): void {
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);

  if (
    shouldIncludeCreativeAppsKitExportBackground({
      format: "video",
      schema: state.schema,
    })
  ) {
    context.fillStyle = settings.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.scale(pixelRatio, pixelRatio);
  drawVestaboardToCanvas(context, model);
  context.restore();
}

async function exportVestaboardVideo(state: CreativeAppsKitState): Promise<void> {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    throw new Error("Video export requires MediaRecorder support.");
  }

  const settings = resolveVestaboardSettings(state.values, state.canvas.size);
  const withAudio = settings.soundEnabled;
  const mimeType = getVideoMimeType(state.values["export.video.format"], withAudio);
  if (!mimeType) {
    throw new Error("No supported video export format is available in this browser.");
  }

  const canvas = document.createElement("canvas");
  const { height, pixelRatio, width } = getCreativeAppsKitRetinaExportSize({
    devicePixelRatio: getVideoDevicePixelRatio(state),
    state,
  });
  const context = canvas.getContext("2d");
  const fps = 30;
  const durationSeconds = Math.max(1, Math.min(60, state.timeline.durationSeconds));
  const frameCount = Math.max(1, Math.ceil(durationSeconds * fps));
  const bitsPerSecond = state.values["export.video.quality"] === "4k" ? 16_000_000 : 8_000_000;

  canvas.width = width;
  canvas.height = height;

  if (!context) {
    throw new Error("Video export requires a 2D canvas context.");
  }

  const stream = canvas.captureStream(fps);
  const [track] = stream.getVideoTracks() as (CanvasCaptureMediaStreamTrack & {
    requestFrame?: () => void;
  })[];
  const audioEngine = withAudio ? createVestaboardAudioEngine({ monitor: false }) : null;
  const recorderDestination = audioEngine?.createRecorderDestination() ?? null;

  if (recorderDestination) {
    for (const audioTrack of recorderDestination.stream.getAudioTracks()) {
      stream.addTrack(audioTrack);
    }
  }

  audioEngine?.resume();

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: bitsPerSecond,
  });
  const recordingComplete = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onerror = () => reject(new Error("Video export failed."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  recorder.start();

  let previousModel: VestaboardModel | null = null;

  for (let frame = 0; frame <= frameCount; frame += 1) {
    const timeSeconds = Math.min(durationSeconds, frame / fps);
    const progress = getVestaboardAnimationProgress({
      durationSeconds: state.timeline.durationSeconds,
      finalHoldSeconds: settings.finalHoldSeconds,
      hasTargetMessage: settings.targetMessage.trim().length > 0,
      timeSeconds,
    });
    const model = buildVestaboardModel(settings, {
      durationSeconds: state.timeline.durationSeconds,
      fieldProgress: progress.fieldProgress,
      phraseProgress: progress.phraseProgress,
    });
    drawVestaboardVideoFrame({
      canvas,
      context,
      model,
      pixelRatio,
      settings,
      state,
    });

    if (audioEngine) {
      const clicks = collectVestaboardFlapClicks(previousModel, model);

      if (clicks.length > 0) {
        audioEngine.playFlapClicks(clicks, settings.soundVolume);
      }
    }

    previousModel = model;
    track?.requestFrame?.();
    await new Promise((resolve) => window.setTimeout(resolve, 1000 / fps));
  }

  recorder.stop();
  track?.stop();

  const blob = await recordingComplete;
  audioEngine?.dispose();
  const extension = mimeType.includes("mp4") ? "mp4" : "webm";
  downloadBlob(blob, `vestaboard.${extension}`);
}

function handlePanelAction({
  action,
  state,
}: {
  action: CreativeAppsKitActionSchema;
  state: CreativeAppsKitState;
}): void {
  if (action.value === "export-png") {
    void exportVestaboardPng(state);
  }
  if (action.value === "export-video") {
    void exportVestaboardVideo(state);
  }
}

export function AppHome(): React.JSX.Element {
  return (
    <>
      <ResidualPanelWheelGuard />
      <CreativeAppsKitApp
        canvasContent={
          <>
            <VestaboardDefaultTimelineState />
            <CanvasVisualFitGuard />
            <VestaboardRenderer />
          </>
        }
        className="h-dvh min-h-dvh"
        controlRenderers={vestaboardControlRenderers}
        onPanelAction={handlePanelAction}
        renderDefaultCanvasMedia={false}
        schema={appSchema}
      />
    </>
  );
}

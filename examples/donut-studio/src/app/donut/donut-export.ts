import {
  createToolcraftPngExportCanvas,
  type ToolcraftExportFrame,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import { readToolcraftOrientationPose } from "@/toolcraft/runtime/react";

import { DONUT_CAMERA } from "./donut-reference";
import { canvasToDonutBlob, downloadDonutBlob } from "./donut-download";
import { createDonutScene } from "./donut-scene";
import type { DonutImageFormat } from "./donut-types";
import { readDonutSettings } from "./donut-values";

export type DonutExportContext = Readonly<{
  frame: ToolcraftExportFrame;
  reportProgress: (progress: number) => void;
  state: ToolcraftState;
}>;

export function resolveDonutImageFormat(value: unknown): Readonly<{
  extension: DonutImageFormat;
  mimeType: "image/jpeg" | "image/png";
  requiresBackground: boolean;
}> {
  if (String(value).toLowerCase() === "jpg") {
    return {
      extension: "jpg",
      mimeType: "image/jpeg",
      requiresBackground: true,
    };
  }
  return {
    extension: "png",
    mimeType: "image/png",
    requiresBackground: false,
  };
}

export function getDonutExportFileName(format: DonutImageFormat): string {
  return `donut-studio.${format}`;
}

function drawWebGlOutput(
  output: HTMLCanvasElement,
  source: HTMLCanvasElement,
): void {
  const context = output.getContext("2d");
  if (!context) {
    throw new Error("Donut export requires a 2D transfer canvas.");
  }
  context.drawImage(source, 0, 0, output.width, output.height);
}

export async function exportDonutImage({
  frame,
  reportProgress,
  state,
}: DonutExportContext): Promise<void> {
  const settings = readDonutSettings(state.values);
  const format = resolveDonutImageFormat(settings.image.format);
  const includeBackground =
    format.requiresBackground || settings.background.include;
  reportProgress(0.04);
  const output = createToolcraftPngExportCanvas({
    background: settings.background.color,
    frame,
    includeBackground,
    render: () => undefined,
    resolution: settings.image.resolution,
    state,
  });
  const webGlCanvas = document.createElement("canvas");
  const orientation = readToolcraftOrientationPose(
    state.values["scene.orientation"],
    {
      position: [...DONUT_CAMERA.defaultPosition],
      up: [...DONUT_CAMERA.up],
    },
  );
  const scene = await createDonutScene({
    canvas: webGlCanvas,
    height: output.height,
    orientation,
    pipeline: null,
    pixelRatio: 1,
    preserveDrawingBuffer: true,
    settings,
    width: output.width,
  });

  try {
    reportProgress(0.42);
    await scene.render(includeBackground);
    drawWebGlOutput(output, webGlCanvas);
    reportProgress(0.76);
    const blob = await canvasToDonutBlob(
      output,
      format.mimeType,
      format.extension === "jpg" ? 0.94 : undefined,
    );
    downloadDonutBlob(blob, getDonutExportFileName(format.extension));
    reportProgress(1);
  } finally {
    scene.dispose();
  }
}

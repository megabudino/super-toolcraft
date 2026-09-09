import {
  createToolcraftPngExportCanvas,
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import type { ToolcraftPanelActionHandler } from "@/toolcraft/runtime/react";

import { spiralGalleryPipelinePasses } from "./spiral-gallery-pipeline";
import { readSpiralGallerySettings } from "./spiral-gallery-settings";
import type { SpiralGalleryResource } from "./spiral-gallery-types";

type SpiralGalleryImageFormat = "jpg" | "png";

let activeResource: SpiralGalleryResource | null = null;

export function setActiveSpiralGalleryResource(
  resource: SpiralGalleryResource | null,
): void {
  activeResource = resource;
}

function imageFormat(state: ToolcraftState): SpiralGalleryImageFormat {
  return state.values["export.image.format"] === "jpg" ? "jpg" : "png";
}

async function encodeImageCanvas(
  canvas: HTMLCanvasElement,
  mimeType: "image/jpeg" | "image/png",
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("The image gallery could not be encoded.")),
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

function waitForTwoFrames(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export const handleSpiralGalleryPanelAction: ToolcraftPanelActionHandler = (
  context,
) => {
  if (context.action.value === "export.code") {
    const runCodeExport = async () => {
      context.reportProgress(0.02);
      const { createSpiralGalleryCodeArchive } = await import(
        "./spiral-gallery-code-export"
      );
      const archive = await createSpiralGalleryCodeArchive(context.state, {
        reportProgress: context.reportProgress,
      });
      downloadBlob(
        new Blob([new Uint8Array(archive)], { type: "application/zip" }),
        "image-gallery-agent-kit.zip",
      );
      context.reportProgress(1);
    };

    return context.rendererPipeline
      ? context.rendererPipeline.runPass(
          spiralGalleryPipelinePasses.export,
          undefined,
          runCodeExport,
        )
      : runCodeExport();
  }

  if (context.action.value !== "export.png") return;

  const run = async () => {
    const resource = activeResource;
    if (!resource) {
      throw new Error("The image gallery is not ready for export.");
    }

    context.reportProgress(0.12);
    await resource.ready();
    context.reportProgress(0.3);
    await waitForTwoFrames();

    const format = imageFormat(context.state);
    const resolution = String(
      context.state.values["export.image.resolution"] ?? "4k",
    );
    const includeBackground =
      format === "jpg" ||
      shouldIncludeToolcraftPreviewBackground({ state: context.state });
    const background = readSpiralGallerySettings(context.state).background;
    let exportSurface:
      | {
          context: CanvasRenderingContext2D;
          pixelHeight: number;
          pixelWidth: number;
        }
      | undefined;

    const canvas = createToolcraftPngExportCanvas({
      background,
      includeBackground,
      render: ({ context: canvasContext, pixelHeight, pixelWidth }) => {
        exportSurface = {
          context: canvasContext,
          pixelHeight,
          pixelWidth,
        };
      },
      resolution,
      state: context.state,
    });

    if (!exportSurface) {
      throw new Error("The image gallery export surface could not be prepared.");
    }

    const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
    await resource.drawExport({
      ...exportSurface,
      includeBackground,
      state: context.state,
    });
    context.reportProgress(0.72);
    const blob = await encodeImageCanvas(
      canvas,
      mimeType,
      format === "jpg" ? 0.92 : undefined,
    );
    context.reportProgress(0.9);
    await waitForTwoFrames();
    downloadBlob(blob, `image-gallery.${format}`);
    context.reportProgress(1);
  };

  return context.rendererPipeline
    ? context.rendererPipeline.runPass(
        spiralGalleryPipelinePasses.export,
        undefined,
        run,
      )
    : run();
};

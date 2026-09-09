import {
  createToolcraftPngExportCanvas,
  type ToolcraftImageAsset,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import type { ToolcraftPanelActionContext } from "@/toolcraft/runtime/react";

import { buildPosterScene, elementInk, elementPaper } from "./poster-model";
import { coverPresetSrc, micrographPosterFormats } from "./template-covers";
import type {
  PosterPrimitive,
  PosterScene,
  RenderedElement,
} from "./poster-types";
import { exportPngPass } from "./renderer-pipeline";

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function getBackgroundImage(state: ToolcraftState): ToolcraftImageAsset | null {
  for (let index = state.mediaAssets.length - 1; index >= 0; index -= 1) {
    const asset = state.mediaAssets[index];

    if (asset?.assetKind === "image" && asset.sourceTarget === "source.image") {
      return asset;
    }
  }

  return null;
}

function loadImage(asset: ToolcraftImageAsset | null): Promise<HTMLImageElement | null> {
  if (!asset) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not decode ${asset.fileName}.`));
    image.src = asset.dataUrl;
  });
}

function loadCoverImage(src: string | null): Promise<HTMLImageElement | null> {
  if (!src) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode the cover preset image."));
    image.src = src;
  });
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  asset: ToolcraftImageAsset | null,
  width: number,
  height: number,
): void {
  const sourceWidth = Math.max(1, image.naturalWidth);
  const sourceHeight = Math.max(1, image.naturalHeight);
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const rotation = asset?.transform?.rotationDeg ?? 0;
  const flipX = asset?.transform?.flipHorizontal ? -1 : 1;
  const flipY = asset?.transform?.flipVertical ? -1 : 1;

  context.save();
  context.translate(width / 2, height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.scale(flipX, flipY);
  context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  context.restore();
}

function drawPrimitive(
  context: CanvasRenderingContext2D,
  primitive: PosterPrimitive,
  element: RenderedElement,
  scene: PosterScene,
): void {
  const ink = elementInk(scene, element);
  const paper = elementPaper(scene);
  const glowing = context.shadowBlur > 0;
  const glowWith = (color: string): void => {
    if (glowing) {
      context.shadowColor = color;
    }
  };
  const fillColor = (fill: "ink" | "paper"): string => {
    const color = fill === "paper" ? paper : ink;
    glowWith(color);
    return color;
  };
  glowWith(ink);
  context.lineCap = "square";
  context.lineJoin = "round";
  context.strokeStyle = ink;
  context.fillStyle = ink;
  context.lineWidth =
    element.strokeWidth *
    (primitive.kind === "line" || primitive.kind === "polyline"
      ? (primitive.width ?? 1)
      : 1);

  switch (primitive.kind) {
    case "line":
      context.beginPath();
      context.moveTo(primitive.x1, primitive.y1);
      context.lineTo(primitive.x2, primitive.y2);
      context.stroke();
      break;
    case "rect": {
      const shouldFill = primitive.fill && primitive.fill !== "none";
      context.beginPath();
      if (primitive.radius) {
        context.roundRect(
          primitive.x,
          primitive.y,
          primitive.width,
          primitive.height,
          primitive.radius,
        );
      } else {
        context.rect(primitive.x, primitive.y, primitive.width, primitive.height);
      }
      if (shouldFill) {
        context.fillStyle = fillColor(primitive.fill as "ink" | "paper");
        context.fill();
      }
      if (primitive.stroke) {
        glowWith(ink);
        context.stroke();
      }
      break;
    }
    case "circle": {
      const shouldFill = primitive.fill && primitive.fill !== "none";
      context.beginPath();
      context.arc(primitive.x, primitive.y, primitive.radius, 0, Math.PI * 2);
      if (shouldFill) {
        context.fillStyle = fillColor(primitive.fill as "ink" | "paper");
        context.fill();
      }
      if (primitive.stroke) {
        glowWith(ink);
        context.stroke();
      }
      break;
    }
    case "polyline": {
      const [first, ...rest] = primitive.points;
      if (!first) {
        break;
      }
      context.beginPath();
      context.moveTo(first[0], first[1]);
      for (const [x, y] of rest) {
        context.lineTo(x, y);
      }
      if (primitive.closed) {
        context.closePath();
      }
      for (const hole of primitive.holes ?? []) {
        const [start, ...tail] = hole;
        if (!start) continue;
        context.moveTo(start[0], start[1]);
        for (const [x, y] of tail) {
          context.lineTo(x, y);
        }
        context.closePath();
      }
      if (primitive.fill && primitive.fill !== "none") {
        context.fillStyle = fillColor(primitive.fill as "ink" | "paper");
        context.fill((primitive.holes?.length ?? 0) > 0 ? "evenodd" : "nonzero");
        if (!primitive.closed) {
          glowWith(ink);
          context.stroke();
        }
      } else {
        context.stroke();
      }
      break;
    }
    case "text": {
      const textColor = primitive.fill === "paper" ? paper : ink;
      glowWith(textColor);
      context.fillStyle = textColor;
      const family =
        primitive.family === "sans"
          ? '"Inter Variable", "Helvetica Neue", Arial, sans-serif'
          : '"IBM Plex Mono", monospace';
      context.font = `${primitive.weight ?? 500} ${primitive.size}px ${family}`;
      context.textAlign =
        primitive.align === "center"
          ? "center"
          : primitive.align === "right"
            ? "right"
            : "left";
      context.textBaseline = "alphabetic";
      if ("letterSpacing" in context) {
        context.letterSpacing = `${primitive.letterSpacing ?? 0}px`;
      }
      context.fillText(primitive.text, primitive.x, primitive.y);
      if ("letterSpacing" in context) {
        context.letterSpacing = "0px";
      }
      break;
    }
  }
}

function drawPoster(
  context: CanvasRenderingContext2D,
  scene: PosterScene,
  state: ToolcraftState,
  sourceImage: HTMLImageElement | null,
  sourceAsset: ToolcraftImageAsset | null,
): void {
  const canvasWidth = state.canvas.size.width;
  const canvasHeight = state.canvas.size.height;

  if (scene.includeBackground && sourceImage) {
    drawCoverImage(context, sourceImage, sourceAsset, canvasWidth, canvasHeight);
  }

  const deviceScale = context.canvas.width / Math.max(1, canvasWidth);
  const glowBlur =
    scene.glow > 0
      ? scene.glow * Math.min(canvasWidth, canvasHeight) * 0.016 * deviceScale
      : 0;

  for (const element of scene.elements) {
    context.save();
    context.globalAlpha = (element.opacity / 100) * scene.globalOpacity;
    context.translate(element.x, element.y);
    if (glowBlur > 0) {
      context.shadowBlur = glowBlur;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
    }
    for (const primitive of element.primitives) {
      drawPrimitive(context, primitive, element, scene);
    }
    context.restore();
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: "image/jpeg" | "image/png",
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("The browser could not encode the poster image."));
        }
      },
      mimeType,
      mimeType === "image/jpeg" ? 0.94 : undefined,
    );
  });
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.download = fileName;
  anchor.href = url;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function createExportCanvas(
  state: ToolcraftState,
  sourceImage: HTMLImageElement | null,
  sourceAsset: ToolcraftImageAsset | null,
): Promise<HTMLCanvasElement> {
  const scene = buildPosterScene(state);

  return createToolcraftPngExportCanvas({
    background: scene.background,
    includeBackground: scene.includeBackground,
    render: ({ context }) =>
      drawPoster(context, scene, state, sourceImage, sourceAsset),
    resolution: stringValue(state.values["export.image.resolution"], "4k"),
    state,
  });
}

export async function exportMicrographicsPoster({
  rendererPipeline,
  reportProgress,
  state,
}: Pick<
  ToolcraftPanelActionContext,
  "rendererPipeline" | "reportProgress" | "state"
>): Promise<void> {
  reportProgress(0.08);
  const sourceAsset = getBackgroundImage(state);
  const sourceImage =
    (await loadImage(sourceAsset)) ??
    (await loadCoverImage(coverPresetSrc(state.values["source.preset"])));
  reportProgress(0.24);
  const canvas = rendererPipeline
    ? await rendererPipeline.runPass(exportPngPass, undefined, () =>
        createExportCanvas(state, sourceImage, sourceAsset),
      )
    : await createExportCanvas(state, sourceImage, sourceAsset);
  reportProgress(0.72);
  const format = stringValue(state.values["export.image.format"], "png");
  const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
  const extension = format === "jpg" ? "jpg" : "png";
  const blob = await canvasToBlob(canvas, mimeType);
  reportProgress(0.92);
  downloadBlob(blob, `micrographics.${extension}`);
  reportProgress(1);
}

export async function handleMicrographicsPanelAction(
  context: ToolcraftPanelActionContext,
): Promise<void> {
  switch (context.action.value) {
    case "shuffle": {
      const currentSeed = Number(context.state.values["composition.seed"] ?? 137);
      const nextSeed = (Math.round(currentSeed) * 31 + 17) % 999 || 1;
      context.dispatch({
        history: "record",
        label: "Shuffle composition",
        target: "composition.seed",
        type: "controls.setValue",
        value: nextSeed,
      });
      context.dispatch({
        history: "record",
        label: "Clear authored layout",
        target: "composition.layout",
        type: "controls.setValue",
        value: "[]",
      });
      return;
    }
    case "place-element": {
      context.dispatch({
        history: "skip",
        target: "library.commands",
        type: "controls.setValue",
        value: "place-element",
      });
      return;
    }
    case "reset-layout": {
      context.dispatch({
        history: "record",
        label: "Reset authored layout",
        target: "composition.layout",
        type: "controls.setValue",
        value: "[]",
      });
      return;
    }
    case "export-png":
      await exportMicrographicsPoster(context);
      return;
    default: {
      const format = micrographPosterFormats.find(
        (entry) => entry.value === context.action.value,
      );
      if (format) {
        context.dispatch({
          size: { height: format.height, unit: "px", width: format.width },
          type: "canvas.setSize",
        });
      }
      return;
    }
  }
}

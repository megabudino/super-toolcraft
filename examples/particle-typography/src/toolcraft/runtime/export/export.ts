import type { ResolvedToolcraftAppSchema } from "../schema/types";
import type { ToolcraftState } from "../state/types";
import {
  resolveToolcraftExportFrame,
  ToolcraftSceneExportError,
  validateToolcraftArtifactSize,
  type ToolcraftExportFrame,
} from "./export-frame";
import {
  getToolcraftImageExportSize,
  type ToolcraftImageExportResolution,
} from "./export-sizing";

export * from "./export-sizing";

export type ToolcraftExportFormat = "png" | "video";

export type ToolcraftExportBackgroundOptions = {
  format: ToolcraftExportFormat;
  schema: ResolvedToolcraftAppSchema;
};

export type ToolcraftPreviewBackgroundOptions = {
  includeBackgroundTarget?: string;
  state: ToolcraftState;
};

export type ToolcraftPngRenderContext = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  cssHeight: number;
  cssWidth: number;
  frame: ToolcraftExportFrame;
  includeBackground: boolean;
  pixelHeight: number;
  pixelRatio: number;
  pixelWidth: number;
};

export type ToolcraftPngExportCanvasOptions = {
  background?: string;
  canvasFactory?: () => HTMLCanvasElement;
  devicePixelRatio?: number;
  frame?: ToolcraftExportFrame;
  includeBackground?: boolean;
  render: (context: ToolcraftPngRenderContext) => void;
  resolution?: ToolcraftImageExportResolution | string;
  state: ToolcraftState;
};

export function shouldIncludeToolcraftExportBackground({
  format,
  schema,
}: ToolcraftExportBackgroundOptions): boolean {
  if (format === "video") {
    return true;
  }

  return schema.export.png.background !== "transparent";
}

export function shouldIncludeToolcraftPreviewBackground({
  includeBackgroundTarget = "export.includeBackground",
  state,
}: ToolcraftPreviewBackgroundOptions): boolean {
  if (state.canvas.mode === "infinite") {
    return false;
  }

  const includeBackgroundValue = state.values[includeBackgroundTarget];

  if (typeof includeBackgroundValue === "boolean") {
    return includeBackgroundValue;
  }

  if (typeof includeBackgroundValue === "string") {
    const normalizedValue = includeBackgroundValue.trim().toLowerCase();

    if (
      normalizedValue === "false" ||
      normalizedValue === "off" ||
      normalizedValue === "no" ||
      normalizedValue === "transparent" ||
      normalizedValue === "exclude"
    ) {
      return false;
    }

    if (
      normalizedValue === "true" ||
      normalizedValue === "on" ||
      normalizedValue === "yes" ||
      normalizedValue === "include"
    ) {
      return true;
    }
  }

  return true;
}

export function createToolcraftPngExportCanvas({
  background = "#000000",
  canvasFactory = () => document.createElement("canvas"),
  devicePixelRatio,
  frame,
  includeBackground: includeBackgroundOverride,
  render,
  resolution,
  state,
}: ToolcraftPngExportCanvasOptions): HTMLCanvasElement {
  const canvas = canvasFactory();
  const frameResult = frame
    ? { frame, ok: true as const }
    : resolveToolcraftExportFrame(state, null);
  if (!frameResult.ok) throw new ToolcraftSceneExportError(frameResult);
  const resolvedFrame = frameResult.frame;
  const { height, pixelRatio, width } = getToolcraftImageExportSize({
    devicePixelRatio,
    frame: resolvedFrame,
    resolution,
    state,
  });
  const artifactSize = validateToolcraftArtifactSize({ height, width });
  if (!artifactSize.ok) throw new ToolcraftSceneExportError(artifactSize);
  const includeBackground =
    includeBackgroundOverride ??
    shouldIncludeToolcraftExportBackground({
      format: "png",
      schema: state.schema,
    });

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Toolcraft PNG export requires a 2D canvas context.");
  }

  context.save();
  context.clearRect(0, 0, width, height);

  if (includeBackground) {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }

  context.scale(pixelRatio, pixelRatio);
  context.translate(-resolvedFrame.x, -resolvedFrame.y);
  render({
    canvas,
    context,
    cssHeight: resolvedFrame.height,
    cssWidth: resolvedFrame.width,
    frame: resolvedFrame,
    includeBackground,
    pixelHeight: height,
    pixelRatio,
    pixelWidth: width,
  });
  context.restore();

  return canvas;
}

import type { ResolvedCreativeAppsKitAppSchema } from "../schema/types";
import type { CreativeAppsKitState } from "../state/types";

export type CreativeAppsKitExportFormat = "png" | "video";

export type CreativeAppsKitRetinaExportSize = {
  height: number;
  pixelRatio: number;
  width: number;
};

export type CreativeAppsKitExportBackgroundOptions = {
  format: CreativeAppsKitExportFormat;
  schema: ResolvedCreativeAppsKitAppSchema;
};

export type CreativeAppsKitExportSizeOptions = {
  devicePixelRatio?: number;
  state: CreativeAppsKitState;
};

export type CreativeAppsKitPngRenderContext = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  cssHeight: number;
  cssWidth: number;
  includeBackground: boolean;
  pixelHeight: number;
  pixelRatio: number;
  pixelWidth: number;
};

export type CreativeAppsKitPngExportCanvasOptions = {
  background?: string;
  canvasFactory?: () => HTMLCanvasElement;
  devicePixelRatio?: number;
  includeBackground?: boolean;
  render: (context: CreativeAppsKitPngRenderContext) => void;
  state: CreativeAppsKitState;
};

export function getCreativeAppsKitRetinaExportPixelRatio(devicePixelRatio?: number): number {
  const globalPixelRatio = (globalThis as typeof globalThis & { devicePixelRatio?: number })
    .devicePixelRatio;
  const fallbackPixelRatio =
    typeof globalPixelRatio === "number" && Number.isFinite(globalPixelRatio)
      ? globalPixelRatio
      : 1;
  const requestedPixelRatio =
    typeof devicePixelRatio === "number" && Number.isFinite(devicePixelRatio)
      ? devicePixelRatio
      : fallbackPixelRatio;

  return Math.max(2, requestedPixelRatio);
}

export function getCreativeAppsKitRetinaExportSize({
  devicePixelRatio,
  state,
}: CreativeAppsKitExportSizeOptions): CreativeAppsKitRetinaExportSize {
  const pixelRatio = getCreativeAppsKitRetinaExportPixelRatio(devicePixelRatio);

  return {
    height: Math.ceil(state.canvas.size.height * pixelRatio),
    pixelRatio,
    width: Math.ceil(state.canvas.size.width * pixelRatio),
  };
}

export function shouldIncludeCreativeAppsKitExportBackground({
  format,
  schema,
}: CreativeAppsKitExportBackgroundOptions): boolean {
  if (format === "video") {
    return true;
  }

  return schema.export.png.background !== "transparent";
}

export function createCreativeAppsKitPngExportCanvas({
  background = "#000000",
  canvasFactory = () => document.createElement("canvas"),
  devicePixelRatio,
  includeBackground: includeBackgroundOverride,
  render,
  state,
}: CreativeAppsKitPngExportCanvasOptions): HTMLCanvasElement {
  const canvas = canvasFactory();
  const { height, pixelRatio, width } = getCreativeAppsKitRetinaExportSize({
    devicePixelRatio,
    state,
  });
  const includeBackground =
    includeBackgroundOverride ??
    shouldIncludeCreativeAppsKitExportBackground({
      format: "png",
      schema: state.schema,
    });

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Creative Apps Kit PNG export requires a 2D canvas context.");
  }

  context.save();
  context.clearRect(0, 0, width, height);

  if (includeBackground) {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }

  context.scale(pixelRatio, pixelRatio);
  render({
    canvas,
    context,
    cssHeight: state.canvas.size.height,
    cssWidth: state.canvas.size.width,
    includeBackground,
    pixelHeight: height,
    pixelRatio,
    pixelWidth: width,
  });
  context.restore();

  return canvas;
}

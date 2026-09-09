import type {
  ToolcraftProductExportRenderer,
  ToolcraftState,
} from "@/toolcraft/runtime";

import { dispersionCarouselPipelinePasses } from "./dispersion-carousel-pipeline";
import { drawDispersionCarouselTestimonial } from "./dispersion-carousel-textures";
import {
  DISPERSION_CAROUSEL_CARDS,
  DISPERSION_CAROUSEL_CARD_PITCH,
  DISPERSION_CAROUSEL_CYCLE_WIDTH,
  DISPERSION_CAROUSEL_GEOMETRY,
  dispersionCarouselTargets,
  readDispersionCarouselSettings,
} from "./dispersion-carousel-values";

export type DispersionCarouselExportProvider = Readonly<{
  getScrollLeft(): number;
  /**
   * Renders the dispersion rail deterministically (velocity zero) at the
   * requested backing ratio and returns the captured pixels.
   */
  snapshot(pixelRatio: number): Promise<ImageBitmap>;
}>;

let activeProvider: DispersionCarouselExportProvider | null = null;

export function registerDispersionCarouselExportProvider(
  provider: DispersionCarouselExportProvider,
): () => void {
  activeProvider = provider;
  return () => {
    if (activeProvider === provider) activeProvider = null;
  };
}

async function drawCarouselHeading(
  context: CanvasRenderingContext2D,
  frame: Readonly<{ height: number; width: number; x: number; y: number }>,
): Promise<void> {
  const geometry = DISPERSION_CAROUSEL_GEOMETRY;
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.load('500 48px "Dispersion Figtree"');
  }
  const headerX = frame.x + Math.max(0, (frame.width - geometry.canvasWidth) / 2);
  context.save();
  try {
    context.beginPath();
    context.rect(frame.x, frame.y, frame.width, frame.height);
    context.clip();
    context.fillStyle = "#000000";
    context.font = '500 48px "Dispersion Figtree", sans-serif';
    context.fontKerning = "none";
    context.textBaseline = "top";
    const headerY = frame.y + geometry.headerTop;
    context.fillText("How focused teams turn", headerX, headerY - 2);
    context.fillText("insights into action.", headerX, headerY + 50.8);
  } finally {
    context.restore();
  }
}

function getExportPixelRatio(context: CanvasRenderingContext2D): number {
  const transform = context.getTransform();
  const scale = Math.max(Math.abs(transform.a), Math.abs(transform.d));
  return Number.isFinite(scale) && scale > 0 ? scale : 2;
}

async function renderExportFrame({
  context,
  frame,
  state,
}: Readonly<{
  context: CanvasRenderingContext2D;
  frame: Readonly<{ height: number; width: number; x: number; y: number }>;
  state: ToolcraftState;
}>): Promise<void> {
  const provider = activeProvider;
  if (!provider) {
    throw new Error("The dispersion rail preview is not ready for export.");
  }
  const geometry = DISPERSION_CAROUSEL_GEOMETRY;
  await drawCarouselHeading(context, frame);
  const bitmap = await provider.snapshot(getExportPixelRatio(context));
  try {
    context.save();
    context.beginPath();
    context.rect(frame.x, frame.y, frame.width, frame.height);
    context.clip();
    context.drawImage(
      bitmap,
      frame.x,
      frame.y + geometry.railTop - geometry.effectPadding,
      frame.width,
      geometry.cardHeight + geometry.effectPadding * 2,
    );
    context.restore();
  } finally {
    bitmap.close();
  }
  if (!readDispersionCarouselSettings(state).includeText) {
    if (typeof document !== "undefined" && "fonts" in document) {
      await document.fonts.load('400 20px "Dispersion Figtree"');
    }
    const scrollLeft = provider.getScrollLeft();
    context.save();
    try {
      context.beginPath();
      context.rect(frame.x, frame.y, frame.width, frame.height);
      context.clip();
      for (const cycle of [-1, 0, 1]) {
        for (const [index, card] of DISPERSION_CAROUSEL_CARDS.entries()) {
          const cardX =
            frame.x +
            cycle * DISPERSION_CAROUSEL_CYCLE_WIDTH +
            index * DISPERSION_CAROUSEL_CARD_PITCH -
            scrollLeft;
          drawDispersionCarouselTestimonial(
            context,
            card.testimonial,
            cardX,
            frame.y + geometry.railTop,
          );
        }
      }
    } finally {
      context.restore();
    }
  }
}

export const dispersionCarouselExportRenderer = {
  baseFileName: "aura-carousel",
  async renderFrame({ context, frame, rendererPipeline, state }) {
    const render = () => renderExportFrame({ context, frame, state });
    if (rendererPipeline) {
      await rendererPipeline.runPass(
        dispersionCarouselPipelinePasses.imageExport,
        undefined,
        render,
      );
      return;
    }
    await render();
  },
} satisfies ToolcraftProductExportRenderer;

export function readExportFormat(state: Pick<ToolcraftState, "values">): string {
  return String(state.values[dispersionCarouselTargets.imageFormat] ?? "png");
}

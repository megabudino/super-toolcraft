import {
  DISPERSION_CAROUSEL_CARDS,
  DISPERSION_CAROUSEL_CARD_PITCH,
  DISPERSION_CAROUSEL_CYCLE_WIDTH,
  DISPERSION_CAROUSEL_GEOMETRY,
  DISPERSION_CAROUSEL_TESTIMONIAL_STYLE,
} from "./dispersion-carousel-values";

const SOURCE_SCALE = 2;
const TESTIMONIAL_FONT =
  '400 20px "Dispersion Figtree", Arial, sans-serif';

export type DispersionCarouselStripTextures = Readonly<{
  image: HTMLCanvasElement;
  text: HTMLCanvasElement;
  /** Nontransparent rows, expanded by one texel for linear filtering. */
  textRowRange: readonly [number, number];
}>;

let texturesPromise: Promise<DispersionCarouselStripTextures> | null = null;

function getTextRowRange(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): readonly [number, number] {
  const { data } = context.getImageData(0, 0, width, height);
  const rowHasText = (y: number): boolean => {
    const end = (y + 1) * width * 4;
    for (let i = y * width * 4 + 3; i < end; i += 4) {
      if (data[i] !== 0) return true;
    }
    return false;
  };
  let first = 0;
  while (first < height && !rowHasText(first)) first++;
  if (first === height) return [1, 0];
  let last = height - 1;
  while (last > first && !rowHasText(last)) last--;
  return [Math.max(0, first - 1) / height, Math.min(height, last + 2) / height];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load carousel card: ${src}`));
    image.src = src;
  });
}

export function wrapDispersionCarouselText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/u);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawDispersionCarouselTestimonial(
  context: CanvasRenderingContext2D,
  testimonial: string,
  cardX: number,
  cardY: number,
): void {
  const geometry = DISPERSION_CAROUSEL_GEOMETRY;
  const typography = DISPERSION_CAROUSEL_TESTIMONIAL_STYLE;
  const maxWidth = geometry.cardWidth - typography.padding * 2;
  context.font = TESTIMONIAL_FONT;
  context.fontKerning = "normal";
  context.fillStyle = "#FFFFFF";
  context.textBaseline = "top";
  const lines = wrapDispersionCarouselText(context, testimonial, maxWidth);
  const top =
    cardY +
    geometry.cardHeight -
    typography.padding -
    lines.length * typography.lineHeight;
  for (const [index, line] of lines.entries()) {
    context.fillText(
      line,
      cardX + typography.padding,
      top + index * typography.lineHeight,
    );
  }
}

export async function loadDispersionCarouselStripTextures(): Promise<DispersionCarouselStripTextures> {
  if (texturesPromise) return texturesPromise;
  texturesPromise = (async () => {
    if (typeof document !== "undefined" && "fonts" in document) {
      await document.fonts.load(TESTIMONIAL_FONT);
    }
    const images = await Promise.all(
      DISPERSION_CAROUSEL_CARDS.map((card) => loadImage(card.src)),
    );
    const width = DISPERSION_CAROUSEL_CYCLE_WIDTH * SOURCE_SCALE;
    const height = DISPERSION_CAROUSEL_GEOMETRY.cardHeight * SOURCE_SCALE;
    const image = document.createElement("canvas");
    const text = document.createElement("canvas");
    image.width = width;
    image.height = height;
    text.width = width;
    text.height = height;
    const imageContext = image.getContext("2d");
    const textContext = text.getContext("2d");
    if (!imageContext || !textContext) {
      throw new Error("The carousel strip textures require Canvas 2D support.");
    }

    imageContext.clearRect(0, 0, width, height);
    for (const [index, card] of DISPERSION_CAROUSEL_CARDS.entries()) {
      const x =
        index * DISPERSION_CAROUSEL_CARD_PITCH * SOURCE_SCALE;
      imageContext.drawImage(
        images[index]!,
        x,
        0,
        DISPERSION_CAROUSEL_GEOMETRY.cardWidth * SOURCE_SCALE,
        DISPERSION_CAROUSEL_GEOMETRY.cardHeight * SOURCE_SCALE,
      );
      textContext.save();
      textContext.scale(SOURCE_SCALE, SOURCE_SCALE);
      drawDispersionCarouselTestimonial(
        textContext,
        card.testimonial,
        x / SOURCE_SCALE,
        0,
      );
      textContext.restore();
    }
    return { image, text, textRowRange: getTextRowRange(textContext, width, height) };
  })();
  return texturesPromise;
}

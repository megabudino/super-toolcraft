import type { DitherRenderSettings } from "./dither-types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function ensureCanvasSize(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): boolean {
  const nextWidth = Math.max(1, Math.round(width));
  const nextHeight = Math.max(1, Math.round(height));
  let changed = false;

  if (canvas.width !== nextWidth) {
    canvas.width = nextWidth;
    changed = true;
  }
  if (canvas.height !== nextHeight) {
    canvas.height = nextHeight;
    changed = true;
  }

  return changed;
}

export function ensureCanvasCapacity(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): boolean {
  const nextWidth = Math.max(canvas.width, Math.max(1, Math.round(width)));
  const nextHeight = Math.max(canvas.height, Math.max(1, Math.round(height)));

  if (canvas.width === nextWidth && canvas.height === nextHeight) {
    return false;
  }

  canvas.width = nextWidth;
  canvas.height = nextHeight;
  return true;
}

export function createCanvas(width = 1, height = 1): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  ensureCanvasSize(canvas, width, height);
  return canvas;
}

export function get2dContext(
  canvas: HTMLCanvasElement,
  willReadFrequently = false,
): CanvasRenderingContext2D | null {
  return canvas.getContext(
    "2d",
    willReadFrequently ? { willReadFrequently: true } : undefined,
  );
}

export function luminance(data: Uint8ClampedArray, index: number): number {
  return (data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114) / 255;
}

function colorChannel(value: number): number {
  return Math.round(clamp(value, 0, 255));
}

export function rgb(red: number, green: number, blue: number): string {
  return `rgb(${colorChannel(red)},${colorChannel(green)},${colorChannel(blue)})`;
}

export function rgba(red: number, green: number, blue: number, alpha: number): string {
  return `rgba(${colorChannel(red)},${colorChannel(green)},${colorChannel(blue)},${clamp(alpha, 0, 1)})`;
}

export function coordinateNoise(seed: number, x: number, y: number, salt = 0): number {
  let value = Math.imul(Math.round(x) + 0x9e3779b9, 0x85ebca6b);
  value ^= Math.imul(Math.round(y) + 0xc2b2ae35, 0x27d4eb2f);
  value ^= Math.imul(Math.round(seed) + salt * 1013, 0x165667b1);
  value ^= value >>> 15;
  value = Math.imul(value, 0x2c1b3c6d);
  value ^= value >>> 12;
  return (value >>> 0) / 0xffffffff;
}

export function getScatterOpacity(
  settings: DitherRenderSettings,
  x: number,
  y: number,
  salt = 0,
): number {
  const scatter = settings.scatter / 100;
  if (scatter === 0) {
    return 1;
  }

  const keepNoise = coordinateNoise(settings.seed, x, y, salt);
  if (keepNoise < 0.25) {
    return 1;
  }

  return 1 - coordinateNoise(settings.seed, x, y, salt + 1) * scatter;
}

let sharedBlitCanvas: HTMLCanvasElement | null = null;

function getBlitCanvas(width: number, height: number): HTMLCanvasElement {
  if (!sharedBlitCanvas) sharedBlitCanvas = document.createElement("canvas");
  if (sharedBlitCanvas.width < width) sharedBlitCanvas.width = width;
  if (sharedBlitCanvas.height < height) sharedBlitCanvas.height = height;
  return sharedBlitCanvas;
}

export function blitSampleImage(
  context: CanvasRenderingContext2D,
  image: ImageData,
  outputWidth: number,
  outputHeight: number,
): void {
  const canvas = getBlitCanvas(image.width, image.height);
  const blitContext = canvas.getContext("2d");
  if (!blitContext) return;
  blitContext.clearRect(0, 0, image.width, image.height);
  blitContext.putImageData(image, 0, 0);
  const previousSmoothing = context.imageSmoothingEnabled;
  context.imageSmoothingEnabled = false;
  context.drawImage(
    canvas,
    0,
    0,
    image.width,
    image.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );
  context.imageSmoothingEnabled = previousSmoothing;
}

export function getToneFilter(settings: DitherRenderSettings): string {
  return [
    `brightness(${settings.toneBrightness}%)`,
    `contrast(${settings.toneContrast}%)`,
    `saturate(${settings.toneSaturation}%)`,
    `hue-rotate(${settings.toneHue}deg)`,
  ].join(" ");
}

export function stableSettingsKey(values: readonly (number | string | boolean)[]): string {
  return values.join("|");
}

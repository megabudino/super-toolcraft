import type { DitherRenderSettings } from "../dither-types";
import {
  blitSampleImage,
  clamp,
  coordinateNoise,
  luminance,
} from "../dither-utils";
import type { DitherEffectRenderContext } from "./types";

const bayer8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
] as const;

function writeLitPixel(
  output: ImageData,
  index: number,
  data: Uint8ClampedArray,
  sourceIndex: number,
  exposureScale: number,
): void {
  output.data[index] = Math.min(255, data[sourceIndex] * exposureScale * 3);
  output.data[index + 1] = Math.min(
    255,
    data[sourceIndex + 1] * exposureScale * 3,
  );
  output.data[index + 2] = Math.min(
    255,
    data[sourceIndex + 2] * exposureScale * 3,
  );
  output.data[index + 3] = 255;
}

function buildToneField(
  snapshot: ImageData,
  settings: DitherRenderSettings,
): Float32Array {
  const exposureScale = settings.exposure / 100;
  const gamma = 1 + (settings.density / 10) * 0.5;
  const field = new Float32Array(snapshot.width * snapshot.height);
  for (let index = 0; index < field.length; index += 1) {
    field[index] =
      Math.pow(luminance(snapshot.data, index * 4), 1 / gamma) * exposureScale;
  }
  return field;
}

export function renderDitherBlend({
  context,
  outputHeight,
  outputWidth,
  settings,
  snapshot,
}: DitherEffectRenderContext): void {
  const width = snapshot.width;
  const height = snapshot.height;
  const exposureScale = settings.exposure / 100;
  const pixels = buildToneField(snapshot, settings);
  const output = context.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const oldValue = pixels[index] ?? 0;
      const nextValue = oldValue > 0.5 ? 1 : 0;
      const error = oldValue - nextValue;
      pixels[index] = nextValue;

      if (x + 1 < width) pixels[index + 1] += (error * 7) / 16;
      if (y + 1 < height) {
        if (x > 0) pixels[index + width - 1] += (error * 3) / 16;
        pixels[index + width] += (error * 5) / 16;
        if (x + 1 < width) pixels[index + width + 1] += (error * 1) / 16;
      }

      if (nextValue === 1) {
        writeLitPixel(output, index * 4, snapshot.data, index * 4, exposureScale);
      }
    }
  }

  blitSampleImage(context, output, outputWidth, outputHeight);
}

export function renderBayer({
  context,
  outputHeight,
  outputWidth,
  settings,
  snapshot,
}: DitherEffectRenderContext): void {
  const width = snapshot.width;
  const height = snapshot.height;
  const exposureScale = settings.exposure / 100;
  const pixels = buildToneField(snapshot, settings);
  const output = context.createImageData(width, height);
  const cellSize = Math.max(1, Math.round(2 + settings.size * 0.08));
  const blockSize = Math.max(1, Math.round(cellSize * 0.2));
  const bias = ((settings.fill - 50) / 50) * 0.34;

  for (let y = 0; y < height; y += 1) {
    const matrixRow = (Math.floor(y / blockSize) % 8) * 8;
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const threshold =
        ((bayer8[matrixRow + (Math.floor(x / blockSize) % 8)] ?? 0) + 0.5) / 64;
      const tone = Math.pow(clamp((pixels[index] ?? 0) + bias, 0, 1), 0.85);
      if (tone <= threshold) continue;
      writeLitPixel(output, index * 4, snapshot.data, index * 4, exposureScale);
    }
  }

  blitSampleImage(context, output, outputWidth, outputHeight);
}

export function renderNoiseDither({
  context,
  outputHeight,
  outputWidth,
  settings,
  snapshot,
}: DitherEffectRenderContext): void {
  const width = snapshot.width;
  const height = snapshot.height;
  const exposureScale = settings.exposure / 100;
  const pixels = buildToneField(snapshot, settings);
  const output = context.createImageData(width, height);
  const bias = ((settings.fill - 50) / 50) * 0.34;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const tone = clamp((pixels[index] ?? 0) + bias, 0, 1);
      const noiseA = coordinateNoise(settings.seed, x, y, 7);
      const noiseB = coordinateNoise(settings.seed, x, y, 19);
      const threshold = (noiseA + noiseB) / 2;
      if (tone <= threshold) continue;
      writeLitPixel(output, index * 4, snapshot.data, index * 4, exposureScale);
    }
  }

  blitSampleImage(context, output, outputWidth, outputHeight);
}

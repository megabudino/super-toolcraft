import type { Page } from "@playwright/test";

export type CrtPixels = { width: number; height: number; data: Buffer; scale: number };

export async function decodeCrtScreenshot(page: Page, png: Buffer, scale: number): Promise<CrtPixels> {
  // This detached canvas only decodes a screenshot of the displayed product.
  // It never draws into the app, supplies source media, or reads WebGL buffers.
  const decoded = await page.evaluate(async encoded => {
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    try {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { willReadFrequently: true })!;
      context.drawImage(bitmap, 0, 0);
      const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let binary = "";
      for (let offset = 0; offset < rgba.length; offset += 4096) {
        binary += String.fromCharCode(...rgba.subarray(offset, offset + 4096));
      }
      return { width: canvas.width, height: canvas.height, encoded: btoa(binary) };
    } finally { bitmap.close(); }
  }, png.toString("base64"));
  return { width: decoded.width, height: decoded.height, data: Buffer.from(decoded.encoded, "base64"), scale };
}

function sameSize(first: CrtPixels, second: CrtPixels) {
  if (first.width !== second.width || first.height !== second.height) throw new Error("CRT proof changed its native screenshot bounds");
}
function luma(data: Buffer, index: number) {
  return data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
}
function imagePixel(base: CrtPixels, x: number, y: number, flat = false) {
  const index = (y * base.width + x) * 4;
  const value = luma(base.data, index);
  const spread = Math.max(...base.data.subarray(index, index + 3)) - Math.min(...base.data.subarray(index, index + 3));
  const gradient = Math.abs(luma(base.data, index - 4) - luma(base.data, index + 4));
  return value > 35 && value < 230 && spread > 8 && gradient < (flat ? 12 : 60);
}

export function crtMeanDifference(base: CrtPixels, frame: CrtPixels) {
  sameSize(base, frame);
  let sum = 0;
  for (let index = 0; index < base.data.length; index += 4) {
    for (let channel = 0; channel < 3; channel += 1) sum += Math.abs(base.data[index + channel] - frame.data[index + channel]);
  }
  return sum / (base.width * base.height * 3);
}

export function crtScanlinePower(base: CrtPixels, frame: CrtPixels, pitch: number) {
  sameSize(base, frame);
  const profile = Array.from({ length: base.height }, (_, y) => {
    let sum = 0, count = 0;
    for (let x = 2; x < base.width - 2; x += 2) {
      if (!imagePixel(base, x, y)) continue;
      const index = (y * base.width + x) * 4;
      sum += (luma(base.data, index) - luma(frame.data, index)) / luma(base.data, index);
      count += 1;
    }
    return count >= 4 ? sum / count : 0;
  });
  const radius = Math.max(3, Math.round(pitch * base.scale * 2));
  const detrended = profile.map((value, y) => {
    const neighborhood = profile.slice(Math.max(0, y - radius), Math.min(profile.length, y + radius + 1));
    return value - neighborhood.reduce((sum, item) => sum + item, 0) / neighborhood.length;
  });
  // Scanlines roll naturally. Sine/cosine magnitude measures their spacing
  // independently of phase, rather than freezing time to line up screenshots.
  let power = 0;
  for (const adjustment of [0.97, 1, 1.03]) {
    const period = pitch * base.scale * adjustment;
    let sine = 0, cosine = 0;
    for (let y = 0; y < detrended.length; y += 1) {
      const angle = y * 2 * Math.PI / period;
      sine += detrended[y] * Math.sin(angle);
      cosine += detrended[y] * Math.cos(angle);
    }
    power = Math.max(power, Math.hypot(sine, cosine) * 2 / detrended.length);
  }
  return power;
}

export function crtChannelShifts(base: CrtPixels, frame: CrtPixels) {
  sameSize(base, frame);
  const radius = Math.ceil(9 * base.scale);
  const points: number[] = [];
  for (let y = 2; y < base.height - 2; y += 2) {
    for (let x = radius + 2; x < base.width - radius - 2; x += 2) {
      const index = (y * base.width + x) * 4;
      if (!imagePixel(base, x, y) || !imagePixel(base, x - radius, y) || !imagePixel(base, x + radius, y)) continue;
      const contrast = [0, 1, 2].reduce((sum, channel) => sum + Math.abs(base.data[index - 4 + channel] - base.data[index + 4 + channel]), 0);
      if (contrast > 12) points.push(index);
    }
  }
  if (points.length < 100) throw new Error(`CRT chroma requires textured card interiors; found ${points.length} samples`);
  const shifts = [0, 1, 2].map(channel => {
    let bestShift = 0, bestError = Infinity;
    for (let shift = -radius; shift <= radius; shift += 0.25) {
      const integer = Math.floor(shift), fraction = shift - integer;
      let error = 0;
      for (const index of points) {
        const source = index + integer * 4 + channel;
        const expected = base.data[source] * (1 - fraction) + base.data[source + 4] * fraction;
        error += Math.abs(frame.data[index + channel] - expected);
      }
      if (error < bestError) { bestError = error; bestShift = shift; }
    }
    return bestShift;
  });
  return { red: shifts[0] - shifts[1], blue: shifts[2] - shifts[1], samples: points.length };
}

export function crtBrightnessSpan(base: CrtPixels, frames: readonly CrtPixels[]) {
  const gains = frames.map(frame => {
    sameSize(base, frame);
    let sum = 0, count = 0;
    for (let y = 2; y < base.height - 2; y += 2) {
      for (let x = 2; x < base.width - 2; x += 2) {
        if (!imagePixel(base, x, y, true)) continue;
        const index = (y * base.width + x) * 4;
        sum += luma(frame.data, index) / luma(base.data, index);
        count += 1;
      }
    }
    if (count < 100) throw new Error(`CRT flicker requires bright low-gradient image interiors; found ${count} samples`);
    return sum / count;
  });
  return { gains, span: Math.max(...gains) - Math.min(...gains) };
}

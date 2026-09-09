import type { Page } from "@playwright/test";

import {
  type HeroGallerySnapshotArtifact,
  requestHeroGallerySnapshot,
} from "./hero-gallery-snapshot-helpers";

export type HeroGalleryPixelSample = Readonly<{
  height: number;
  pixels: readonly number[];
  width: number;
}>;

export type HeroGalleryRelativeRegion = Readonly<{
  bottom: number;
  left: number;
  right: number;
  top: number;
}>;

export const rowFiveCalibratedRegion: HeroGalleryRelativeRegion = {
  bottom: 0.64,
  left: 0.08,
  right: 0.92,
  top: 0.36,
};

async function decodeHeroGallerySnapshot(
  page: Page,
  artifact: HeroGallerySnapshotArtifact,
): Promise<HeroGalleryPixelSample> {
  return page.evaluate(async (base64) => {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    const bitmap = await createImageBitmap(
      new Blob([bytes], { type: "image/png" }),
    );
    try {
      const width = 240;
      const height = 135;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        throw new Error("Unable to inspect the activated Sphere row pixels.");
      }
      context.imageSmoothingEnabled = false;
      context.drawImage(bitmap, 0, 0, width, height);
      return {
        height,
        pixels: Array.from(context.getImageData(0, 0, width, height).data),
        width,
      };
    } finally {
      bitmap.close();
    }
  }, artifact.base64);
}

export async function captureHeroGalleryPixelSample(
  page: Page,
): Promise<HeroGalleryPixelSample> {
  return decodeHeroGallerySnapshot(
    page,
    await requestHeroGallerySnapshot(page),
  );
}

export function heroGalleryRegionMeanDelta(
  before: HeroGalleryPixelSample,
  after: HeroGalleryPixelSample,
  region: HeroGalleryRelativeRegion,
): number {
  if (before.width !== after.width || before.height !== after.height) {
    throw new Error("Hero gallery samples must use the same dimensions.");
  }

  const startX = Math.floor(before.width * region.left);
  const endX = Math.ceil(before.width * region.right);
  const startY = Math.floor(before.height * region.top);
  const endY = Math.ceil(before.height * region.bottom);
  let channelDelta = 0;
  let channelCount = 0;

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const offset = (y * before.width + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) {
        channelDelta += Math.abs(
          (before.pixels[offset + channel] ?? 0) -
            (after.pixels[offset + channel] ?? 0),
        );
        channelCount += 1;
      }
    }
  }

  return channelDelta / Math.max(1, channelCount);
}

export function heroGalleryRegionOpaqueRatio(
  sample: HeroGalleryPixelSample,
  region: HeroGalleryRelativeRegion,
): number {
  const startX = Math.floor(sample.width * region.left);
  const endX = Math.ceil(sample.width * region.right);
  const startY = Math.floor(sample.height * region.top);
  const endY = Math.ceil(sample.height * region.bottom);
  let opaquePixels = 0;
  let pixelCount = 0;

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      if ((sample.pixels[(y * sample.width + x) * 4 + 3] ?? 0) > 24) {
        opaquePixels += 1;
      }
      pixelCount += 1;
    }
  }

  return opaquePixels / Math.max(1, pixelCount);
}

export async function expectHeroGalleryRowsRemainStable(
  page: Page,
  expectedRows: number,
  durationMs = 750,
): Promise<void> {
  await page
    .locator('[data-toolcraft-product-output="hero-external-preview"]')
    .evaluate(
      (output, options) =>
        new Promise<void>((resolve, reject) => {
          const startedAt = performance.now();
          const inspect = () => {
            const actual = output.getAttribute("data-hero-gallery-rows");
            if (actual !== String(options.expectedRows)) {
              reject(
                new Error(
                  `Expected ${options.expectedRows} stable gallery rows, received ${actual ?? "null"}.`,
                ),
              );
              return;
            }
            if (performance.now() - startedAt >= options.durationMs) {
              resolve();
              return;
            }
            requestAnimationFrame(inspect);
          };
          inspect();
        }),
      { durationMs, expectedRows },
    );
}

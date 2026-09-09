import type { Locator } from "@playwright/test";

import { pauseGrassPlayback } from "./grass-test-helpers";
import { expect, test } from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';

const visibleLayers = [
  ["field.showGround", "data-grass-layer-terrain"],
  ["grass.enabled", "data-grass-layer-tall"],
  ["lawn.enabled", "data-grass-layer-lawn"],
  ["scan.tufted.enabled", "data-grass-scan-layer-tufted"],
  ["scan.wild.enabled", "data-grass-scan-layer-wild"],
  ["scan.white.enabled", "data-grass-scan-layer-white"],
  ["scan.yellow.enabled", "data-grass-scan-layer-yellow"],
  ["scan.rocks.enabled", "data-grass-scan-layer-rocks"],
  ["scan.boulder.enabled", "data-grass-scan-layer-boulder"],
] as const;

async function readCanvasPixelHash(canvas: Locator): Promise<string> {
  return canvas.evaluate((element) => {
    const source = element as HTMLCanvasElement;
    const sample = document.createElement("canvas");
    sample.width = 128;
    sample.height = 128;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas pixel proof requires a 2D context.");
    context.drawImage(source, 0, 0, sample.width, sample.height);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    let hash = 2_166_136_261;
    for (const byte of pixels) {
      hash ^= byte;
      hash = Math.imul(hash, 16_777_619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  });
}

test("grass visibility switches toggle only their own layer", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");

  const canvas = page.locator(canvasSelector);
  await expect(canvas).toHaveAttribute("data-grass-layer-terrain", "true", {
    timeout: 45_000,
  });
  await pauseGrassPlayback(page);
  await expect(
    page.locator('[data-toolcraft-control-target^="solo."]'),
  ).toHaveCount(0);
  await expect(page.getByText("Rock Cliff", { exact: true })).toHaveCount(0);

  for (const [target, attribute] of visibleLayers) {
    await expect(canvas).toHaveAttribute(attribute, "true");
    const beforeSignature = await canvas.getAttribute(
      "data-grass-frame-signature",
    );
    const beforePixels = await readCanvasPixelHash(canvas);

    await page
      .locator(`[data-toolcraft-control-target="${target}"]`)
      .getByRole("switch")
      .click();
    await expect(canvas).toHaveAttribute(attribute, "false");
    await expect(canvas).not.toHaveAttribute(
      "data-grass-frame-signature",
      beforeSignature ?? "",
    );
    const afterPixels = await readCanvasPixelHash(canvas);
    expect(afterPixels).not.toBe(beforePixels);

    for (const [, otherAttribute] of visibleLayers) {
      if (otherAttribute !== attribute) {
        await expect(canvas).toHaveAttribute(otherAttribute, "true");
      }
    }

    await page
      .locator(`[data-toolcraft-control-target="${target}"]`)
      .getByRole("switch")
      .click();
    await expect(canvas).toHaveAttribute(attribute, "true", {
      timeout: 20_000,
    });
  }
});

import type { Page } from "@playwright/test";

import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { setGrassSliderValue } from "./grass-performance-control-actions";
import {
  disableGrassScanLayers,
  pauseGrassPlayback,
  setGrassLayerVisibility,
} from "./grass-test-helpers";
import { expect, test } from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';

type AlphaStats = Readonly<{
  center: number;
  partial: number;
  total: number;
  transparent: number;
}>;

async function readCanvasAlpha(page: Page): Promise<AlphaStats> {
  return page.locator(canvasSelector).evaluate((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext("webgl2");
    if (!gl)
      throw new Error("Grass preview did not expose its WebGL2 context.");
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let partial = 0;
    let total = 0;
    let transparent = 0;
    for (let offset = 3; offset < pixels.length; offset += 4) {
      const alpha = pixels[offset]!;
      total += alpha;
      if (alpha === 0) transparent += 1;
      else if (alpha < 255) partial += 1;
    }
    const centerOffset =
      (Math.floor(height * 0.5) * width + Math.floor(width * 0.5)) * 4 + 3;
    return { center: pixels[centerOffset]!, partial, total, transparent };
  });
}

async function setSliderAndWait(
  page: Page,
  target: string,
  value: number,
): Promise<void> {
  const canvas = page.locator(canvasSelector);
  const before = await canvas.getAttribute("data-grass-frame-signature");
  await setGrassSliderValue(page, target, value);
  await expect
    .poll(() => canvas.getAttribute("data-grass-frame-signature"), {
      timeout: 20_000,
    })
    .not.toBe(before);
}

test("Surface Fade dissolves the complete field composition", async ({
  page,
}) => {
  test.setTimeout(210_000);
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await createToolcraftBrowserProofSession(page);
  await pauseGrassPlayback(page);
  await disableGrassScanLayers(page);
  await setGrassLayerVisibility(page, "scan.boulder.enabled", false);
  await setGrassLayerVisibility(page, "grass.enabled", false);
  await setGrassLayerVisibility(page, "lawn.enabled", false);
  const canvas = page.locator(canvasSelector);
  await expect(canvas).toHaveAttribute(
    "data-grass-surface-edge-fade-signature",
    /"strength":1,"width":0\.12/u,
    { timeout: 30_000 },
  );

  const background = page.locator(
    '[data-toolcraft-control-target="export.includeBackground"]',
  );
  const backgroundSwitch = background.getByRole("switch");
  if ((await backgroundSwitch.getAttribute("aria-checked")) === "true") {
    await backgroundSwitch.click();
  }

  const fadeSection = page
    .locator("[data-toolcraft-controls-section-anchor]")
    .filter({
      has: page.getByRole("button", {
        name: "Collapse Surface Fade section",
      }),
    });
  await expect(fadeSection).toHaveCount(1);
  await expect(
    fadeSection.locator(
      '[data-toolcraft-control-target="surface.edgeFadeWidth"]',
    ),
  ).toBeVisible();
  await expect(
    fadeSection.locator(
      '[data-toolcraft-control-target="surface.edgeFadeStrength"]',
    ),
  ).toBeVisible();

  await setSliderAndWait(page, "surface.edgeFadeWidth", 0);
  const opaque = await readCanvasAlpha(page);

  await setSliderAndWait(page, "surface.edgeFadeWidth", 40);
  const faded = await readCanvasAlpha(page);
  expect(faded.center).toBe(255);
  expect(faded.partial).toBeGreaterThan(opaque.partial);
  expect(faded.total).toBeLessThan(opaque.total * 0.98);
  expect(faded.transparent).toBeGreaterThan(opaque.transparent);

  await setSliderAndWait(page, "surface.edgeFadeStrength", 0);
  const restored = await readCanvasAlpha(page);
  expect(restored.total).toBeGreaterThan(faded.total * 1.02);
  expect(restored.center).toBe(255);

  await setGrassLayerVisibility(page, "field.showGround", false);
  await setGrassLayerVisibility(page, "grass.enabled", true);
  await setGrassLayerVisibility(page, "lawn.enabled", true);
  const vegetationOpaque = await readCanvasAlpha(page);
  await setSliderAndWait(page, "surface.edgeFadeStrength", 100);
  const vegetationFaded = await readCanvasAlpha(page);
  expect(vegetationOpaque.total).toBeGreaterThan(0);
  expect(vegetationFaded.total).toBeLessThan(vegetationOpaque.total * 0.98);
  expect(vegetationFaded.transparent).toBeGreaterThan(
    vegetationOpaque.transparent,
  );

  await setGrassLayerVisibility(page, "grass.enabled", false);
  await setGrassLayerVisibility(page, "lawn.enabled", false);
  for (const target of [
    "scan.tufted.enabled",
    "scan.wild.enabled",
    "scan.white.enabled",
    "scan.yellow.enabled",
    "scan.rocks.enabled",
    "scan.boulder.enabled",
  ] as const) {
    await setGrassLayerVisibility(page, target, true);
  }
  await setSliderAndWait(page, "scan.boulder.seed", 51);
  await setSliderAndWait(page, "surface.edgeFadeStrength", 0);
  const scansOpaque = await readCanvasAlpha(page);
  await setSliderAndWait(page, "surface.edgeFadeStrength", 100);
  const scansFaded = await readCanvasAlpha(page);
  expect(scansOpaque.total).toBeGreaterThan(0);
  expect(scansFaded.total).toBeLessThan(scansOpaque.total * 0.98);
  expect(scansFaded.transparent).toBeGreaterThan(scansOpaque.transparent);
});

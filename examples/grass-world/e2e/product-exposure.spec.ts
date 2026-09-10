import { test as browserTest } from "@playwright/test";

import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';
const outputSelector = `[data-toolcraft-canvas-slot]:has(${canvasSelector})`;

// Full Chromium's headless mode uses the native GPU on supported hosts. The
// separate headless-shell binary uses SwiftShader here and stalls the default
// physical scene before the real Exposure action can begin.
browserTest.use({ channel: "chromium" });

test("grass Exposure changes the paused field lighting", async ({ page }) => {
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  // This app has autonomous motion, not a playback Pause button. Its real
  // Static mode and terrain-hover landing provide a steady lighting fixture.
  await page.locator('[data-toolcraft-control-target="wind.mode"]')
    .getByRole("button", { name: "Static", exact: true }).click();
  // A smaller real artboard bounds raster work without changing scene density,
  // geometry, materials, render scale, or shipped defaults.
  for (const [target, value] of [["canvas.size.width", "640"], ["canvas.size.height", "360"]]) {
    const input = page.locator(`[data-toolcraft-control-target="${target}"]`).getByRole("textbox");
    await input.fill(value);
    await input.press("Enter");
  }
  const canvas = page.locator(canvasSelector);
  await expect(canvas).toHaveAttribute("data-grass-frame-signature", /.+/u);
  await expect(canvas).toHaveAttribute("data-grass-pbr-enabled", "true");
  await expect(canvas).toHaveAttribute("data-grass-scan-resource-signature", /megascans-field-v3/u);
  await expect(canvas).toHaveAttribute("data-grass-butterfly-resource-signature", "butterflies-pbr-1k", { timeout: 8_000 });
  await expect(canvas).toHaveAttribute("data-grass-butterfly-count", "18");
  const slider = page.locator('[data-toolcraft-control-target="environment.exposure"]').getByRole("slider");
  await slider.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "50");
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await expect(canvas).toHaveAttribute("data-grass-butterfly-landing-blend", "1.0000");
  await expect(canvas).toHaveAttribute("data-grass-butterfly-transitioning", "false");
  const readFrame = () => canvas.evaluate((element) => {
    const sample = document.createElement("canvas");
    sample.width = 96;
    sample.height = 54;
    const context = sample.getContext("2d", { willReadFrequently: true })!;
    context.drawImage(element as HTMLCanvasElement, 0, 0, 96, 54);
    const pixels = context.getImageData(0, 0, 96, 54).data;
    let energy = 0;
    let foreground = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3]! < 32) continue;
      foreground++;
      energy += 0.2126 * pixels[i]! + 0.7152 * pixels[i + 1]! + 0.0722 * pixels[i + 2]!;
    }
    return { foreground, luminance: energy / Math.max(1, foreground) };
  });
  const before = await readFrame();
  expect(before.foreground).toBeGreaterThan(20);
  await expectToolcraftProductObservableToChange(session,
    session.controlAction("environment.exposure", async (field) => {
      await field.getByRole("slider").press("End");
      await expect(slider).toHaveAttribute("aria-valuenow", "250");
      await expect.poll(async () => (await readFrame()).luminance).toBeGreaterThan(before.luminance + 2);
    }), {
      requirementId: "grass.scene-exposure",
      // Sample the full canvas area without treating continuously published
      // autonomous-clock diagnostics as visible lighting changes.
      selector: outputSelector,
      timeoutMs: 8_000,
    });
});

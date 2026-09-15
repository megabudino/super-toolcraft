import { expect, type Page } from "@playwright/test";

import type { InfinityCanvasTransitionContinuity } from "./browser-infinity-canvas-evidence";
import { PREVIEW_CANVAS_SELECTOR } from "./product-landing-globe-helpers";
import { expectGlobeFrameContinuity } from "./product-landing-globe-orbit-helpers";

export async function globeScenePixels(page: Page): Promise<string> {
  return page.locator(PREVIEW_CANVAS_SELECTOR).evaluate((element) => {
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 108;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Cannot sample globe scene.");
    // Infinity moves the same black background from the raster to the viewport.
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(element as HTMLCanvasElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL();
  });
}

export async function expectGlobeModeContinuity(
  page: Page,
  action: () => Promise<unknown>,
): Promise<InfinityCanvasTransitionContinuity> {
  const host = await page.locator("[data-toolcraft-product-scene]").elementHandle();
  const output = await page.locator(PREVIEW_CANVAS_SELECTOR).elementHandle();
  if (!host || !output) throw new Error("Missing globe scene before mode transition.");
  const beforePixels = await globeScenePixels(page);
  try {
    await expectGlobeFrameContinuity(page, async () => {
      await action();
      await page.evaluate(() => new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }));
    });
    const continuity = {
      productHostPreserved: await host.evaluate((element) =>
        element === document.querySelector("[data-toolcraft-product-scene]")),
      productOutputPreserved: await output.evaluate((element, selector) =>
        element === document.querySelector(selector), PREVIEW_CANVAS_SELECTOR),
    };
    expect(continuity).toEqual({ productHostPreserved: true, productOutputPreserved: true });
    expect(await globeScenePixels(page), "The same animation phase must survive mode changes").toBe(beforePixels);
    return continuity;
  } finally {
    await host.dispose();
    await output.dispose();
  }
}

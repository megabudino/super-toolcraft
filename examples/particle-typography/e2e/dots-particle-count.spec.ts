import type { Page } from "@playwright/test";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { expect, test } from "./toolcraft-product-test";

const outputSelector = '[data-dots-renderer="true"]';

async function setParticleCount(page: Page, count: number): Promise<void> {
  const control = await getToolcraftControlFieldByTarget(page, "particles.count");
  const edit = control.getByRole("button", { name: /^Edit .+ value$/u });
  await edit.click();
  const input = control.getByRole("textbox");
  await input.fill(String(count));
  await input.press("Enter");
  await expect(page.locator(outputSelector)).toHaveAttribute("data-dot-count", String(count));
  await page.waitForTimeout(350);
}

async function setFormedTimelineFrame(page: Page): Promise<void> {
  const slider = page.getByRole("slider", { name: "Playback position" });
  if ((await slider.count()) === 0) {
    await page
      .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
      .getByRole("switch")
      .click();
  }
  await expect(slider).toBeVisible();
  const box = await slider.boundingBox();
  if (!box) throw new Error("Could not measure the Dot Formation timeline.");
  await slider.click({ position: { x: box.width * 0.6, y: box.height / 2 } });
  await page.waitForTimeout(100);
  const progress = Number(
    await page.locator(outputSelector).getAttribute("data-timeline-progress"),
  );
  expect(progress).toBeGreaterThan(0.3);
  expect(progress).toBeLessThan(0.8);
}

async function readBrightPixels(page: Page): Promise<number> {
  return page.locator(outputSelector).evaluate((node) => {
    const output = node as HTMLElement;
    const canvas = output.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Dot Formation output canvas is missing.");
    }
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Dot Formation output context is missing.");
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let brightPixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const delta =
        Math.abs((pixels[index] ?? 0) - 5) +
        Math.abs((pixels[index + 1] ?? 0) - 5) +
        Math.abs((pixels[index + 2] ?? 0) - 5);
      if (delta > 180) brightPixels += 1;
    }
    return brightPixels;
  });
}

test.setTimeout(60_000);

test("browser: particle count stays visibly distinct through 2400", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(outputSelector)).toBeVisible();
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) await pause.click();
  await setFormedTimelineFrame(page);

  await setParticleCount(page, 1200);
  const lower = await readBrightPixels(page);

  await setParticleCount(page, 1800);
  const middle = await readBrightPixels(page);
  await setParticleCount(page, 2400);
  const upper = await readBrightPixels(page);

  expect(middle).toBeGreaterThan(lower * 1.2);
  expect(upper).toBeGreaterThan(middle * 1.1);
});

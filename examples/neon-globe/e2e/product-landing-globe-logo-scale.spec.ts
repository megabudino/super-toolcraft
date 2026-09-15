import type { Page } from "@playwright/test";

import { GLOBE_LOGO_SCALE, GLOBE_TARGETS } from "../src/app/globe-constants";
import { getLogoLoopTiming } from "../src/app/globe-logo-animation";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange, getToolcraftProductObservableSnapshot } from "./product-observable-helpers";
import { PREVIEW_CANVAS_SELECTOR, setRangeControl } from "./product-landing-globe-helpers";
import { expect, test } from "./toolcraft-product-test";

const cases = [
  { id: "dxc", label: "easyJet", target: GLOBE_TARGETS.logoDxcScale, value: 50 },
  { id: "meta", label: "Novo Nordisk", target: GLOBE_TARGETS.logoMetaScale, value: 130 },
  { id: "prada", label: "Prada", target: GLOBE_TARGETS.logoPradaScale, value: 50 },
  { id: "zillow", label: "Ubisoft", target: GLOBE_TARGETS.logoZillowScale, value: 130 },
] as const;

async function whitePixels(page: Page): Promise<number> {
  return page.locator(PREVIEW_CANVAS_SELECTOR).evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Missing globe canvas context.");
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 200 && pixels[i + 1] > 200 && pixels[i + 2] > 200) count += 1;
    }
    return count;
  });
}

test.setTimeout(120_000);

for (const { id, label, target, value } of cases) {
  test(`browser: ${label.toLowerCase()} logo scale changes only its mask size`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.clock.install();
    await page.goto("/");
    await setRangeControl(page.locator(`[data-toolcraft-control-target="${GLOBE_TARGETS.crtIntensity}"]`), 0);
    await setRangeControl(page.locator(`[data-toolcraft-control-target="${GLOBE_TARGETS.logoHoldSeconds}"]`), 8);
    await setRangeControl(page.locator(`[data-toolcraft-control-target="${GLOBE_TARGETS.logoSpeed}"]`), 2.5);
    const positionControl = page.locator(`[data-toolcraft-control-target="logos.${id}.finalPosition"]`);
    await setRangeControl(positionControl, 50);
    await getToolcraftProductObservableSnapshot(page);
    const session = await createToolcraftBrowserProofSession(page);
    await page.getByRole("button", { name: "Run logos", exact: true }).click();
    const timing = getLogoLoopTiming(2.5);
    const now = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(new Date(now + timing.approachDurationMs + timing.staggerMs * 3 + 150));
    const control = page.locator(`[data-toolcraft-control-target="${target}"]`);
    await control.locator('[data-slot="slider-thumb"]').hover();
    await page.clock.runFor(64);
    await expect(control.getByRole("slider", { name: label, exact: true })).toBeVisible();
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (currentControl) => {
        await currentControl.locator('[data-slot="slider-thumb"]').hover();
        const thumb = await currentControl.locator('[data-slot="slider-thumb"]').boundingBox();
        const track = await currentControl.locator('[data-slot="slider-track"]').boundingBox();
        if (!thumb || !track) throw new Error("Missing visible scale slider.");
        const before = await whitePixels(page);
        expect(before).toBeGreaterThan(0);
        const fraction = (value - GLOBE_LOGO_SCALE.min) / (GLOBE_LOGO_SCALE.max - GLOBE_LOGO_SCALE.min);
        await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2);
        await page.mouse.down();
        try {
          await page.mouse.move(track.x + track.width * fraction, track.y + track.height / 2, { steps: 6 });
          await page.clock.runFor(64);
          const readValue = async () => Number(await currentControl.getByRole("slider").getAttribute("aria-valuenow"));
          if (value < 100) {
            await expect.poll(readValue).toBeLessThan(100);
            await expect.poll(() => whitePixels(page)).toBeGreaterThan(before);
          } else {
            await expect.poll(readValue).toBeGreaterThan(100);
            await expect.poll(() => whitePixels(page)).toBeLessThan(before);
          }
        } finally {
          await page.mouse.up();
          await page.clock.runFor(64);
        }
      }),
      { requirementId: `logos.${id}.scale`, stabilityIntervalMs: 0 },
    );
    for (const other of cases.filter((entry) => entry.target !== target)) {
      await expect(page.locator(`[data-toolcraft-control-target="${other.target}"]`).getByRole("slider"))
        .toHaveAttribute("aria-valuenow", "100");
    }
    await expect(positionControl.getByRole("slider")).toHaveAttribute("aria-valuenow", "50");
  });
}

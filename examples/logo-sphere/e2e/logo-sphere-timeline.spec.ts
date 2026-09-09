import { expect } from "@playwright/test";

import { expectToolcraftStandardTimelinePlayback } from "./browser-standard-timeline-evidence";
import {
  createLogoSphereProofSession,
  logoSphereCanvasSelector,
  readLogoSphereCanvasSignature,
} from "./logo-sphere-test-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(120_000);

test(
  "browser: timeline playback drives a seamless forward-only sphere loop",
  async ({ page }) => {
    const session = await createLogoSphereProofSession(page);
    await expectToolcraftStandardTimelinePlayback(session, {
      markerSelector: logoSphereCanvasSelector,
      requirementId: "timeline.playback",
    });
  },
);

test(
  "browser: dense Grid uses one full-quality surface for playback and pause",
  async ({ page }) => {
    await createLogoSphereProofSession(page);
    await page
      .locator('[data-toolcraft-control-target="sphere.distribution"]')
      .getByRole("button", { exact: true, name: "Grid" })
      .click();

    const points = page.locator(
      '[data-toolcraft-control-target="sphere.visibleCount"]',
    );
    await points.getByRole("button", { name: "Edit Points value" }).click();
    const pointsEditor = points.getByRole("textbox", { name: "Points value" });
    await pointsEditor.fill("312");
    await pointsEditor.press("Enter");

    const canvas = page.locator(logoSphereCanvasSelector);
    await expect(page.locator("canvas[data-toolcraft-playback-output]")).toHaveCount(0);
    await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
    await expect(canvas).toHaveAttribute("data-logo-count", "312");
    await expect(canvas).toHaveAttribute("data-render-quality", "full");
    const baselineProgress = await canvas.getAttribute("data-timeline-progress");
    const baselineBacking = await canvas.evaluate((element) => {
      const output = element as HTMLCanvasElement;
      return { height: output.height, width: output.width };
    });

    await page.getByRole("button", { name: "Play playback" }).click();
    await expect(canvas).toHaveAttribute("data-render-quality", "full");
    const moving = await page.locator("body").evaluate(readLogoSphereCanvasSignature);
    await expect.poll(() => page.locator("body").evaluate(readLogoSphereCanvasSignature)).not.toBe(moving);
    await expect.poll(() => canvas.getAttribute("data-timeline-progress")).not.toBe(
      baselineProgress,
    );
    expect(
      await canvas.evaluate((element) => {
        const output = element as HTMLCanvasElement;
        return { height: output.height, width: output.width };
      }),
    ).toEqual(baselineBacking);

    await page.getByRole("button", { name: "Pause playback" }).click();
    await expect(canvas).toHaveAttribute("data-render-quality", "full", {
      timeout: 4_000,
    });
    const paused = await page.locator("body").evaluate(readLogoSphereCanvasSignature);
    await page.waitForTimeout(200);
    expect(await page.locator("body").evaluate(readLogoSphereCanvasSignature)).toBe(paused);
    expect(
      await canvas.evaluate((element) => {
        const output = element as HTMLCanvasElement;
        return { height: output.height, width: output.width };
      }),
    ).toEqual(baselineBacking);
  },
);

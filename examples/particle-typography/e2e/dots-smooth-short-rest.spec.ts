import { DOTS_TIMING_BROWSER_TEST_NAME } from "../src/app/dots/dots-acceptance";
import {
  DOTS_DEFAULT_ACTIVE_SECONDS,
  DOTS_DEFAULT_CALM_SECONDS,
  DOTS_DEFAULT_CYCLE_SECONDS,
  getDotsLoopTiming,
} from "../src/app/dots/dots-timing";
import {
  canvasHash,
  ensureTimelineVisible,
  expectSimpleControlChange,
  pausePlayback,
  type ProductPage,
} from "./dots-acceptance-support";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expect, test } from "./toolcraft-product-test";

const outputSelector = '[data-dots-renderer="true"]';

async function setTimelineSeconds(
  page: ProductPage,
  seconds: number,
): Promise<void> {
  const slider = page.getByRole("slider", { name: "Playback position" });
  const keyboardStepSeconds = 0.25;
  const stepCount = Math.round(seconds / keyboardStepSeconds);
  await slider.press("Home");
  for (let step = 0; step < stepCount; step += 1) {
    await slider.press("ArrowRight");
  }
  await expect(slider).toHaveAttribute(
    "aria-valuenow",
    String(stepCount * keyboardStepSeconds),
  );
}

async function dragSliderTo(
  page: ProductPage,
  control: ReturnType<ProductPage["locator"]>,
  value: number,
): Promise<void> {
  const slider = control.getByRole("slider");
  const track = control.locator("[data-base-ui-slider-control]").first();
  await track.scrollIntoViewIfNeeded();
  const box = await track.boundingBox();
  expect(box).not.toBeNull();
  const minimum = Number(await slider.getAttribute("min"));
  const maximum = Number(await slider.getAttribute("max"));
  const current = Number(await slider.getAttribute("aria-valuenow"));
  const currentRatio = (current - minimum) / (maximum - minimum);
  const targetRatio = (value - minimum) / (maximum - minimum);
  const y = box!.y + box!.height / 2;
  await page.mouse.move(box!.x + box!.width * currentRatio, y);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * targetRatio, y, { steps: 8 });
  await page.mouse.up();
}

test(DOTS_TIMING_BROWSER_TEST_NAME, async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const output = page.locator(outputSelector);
  const activeControl = page.locator(
    '[data-toolcraft-control-target="motion.activeDuration"]',
  );
  const calmControl = page.locator(
    '[data-toolcraft-control-target="motion.calmDuration"]',
  );
  await expect(output).toBeVisible();
  await pausePlayback(page);
  await ensureTimelineVisible(page);

  await expect(output).toHaveAttribute(
    "data-dot-active-duration",
    String(DOTS_DEFAULT_ACTIVE_SECONDS),
  );
  await expect(output).toHaveAttribute(
    "data-dot-calm-duration",
    String(DOTS_DEFAULT_CALM_SECONDS),
  );
  await expect(output).toHaveAttribute(
    "data-timeline-duration",
    String(DOTS_DEFAULT_CYCLE_SECONDS),
  );
  const session = await createToolcraftBrowserProofSession(page);

  await setTimelineSeconds(page, 3.5);
  await expect(output).toHaveAttribute("data-dot-motion-phase", "rest");
  const oneSecondCalmHash = await canvasHash(page);

  await setTimelineSeconds(page, 4.5);
  await expectSimpleControlChange(
    session,
    "motion.calmDuration",
    (control, currentPage) => dragSliderTo(currentPage, control, 3),
  );
  await expect(output).toHaveAttribute("data-dot-calm-duration", "3");
  await expect(output).toHaveAttribute("data-timeline-duration", "7");
  await expect(output).toHaveAttribute(
    "data-dot-calm-effective-duration",
    "3.000",
  );
  await setTimelineSeconds(page, 3.5);
  await expect(output).toHaveAttribute("data-dot-motion-phase", "rest");
  expect(await canvasHash(page)).toBe(oneSecondCalmHash);

  await setTimelineSeconds(page, 2.5);
  await expectSimpleControlChange(
    session,
    "motion.activeDuration",
    (control, currentPage) => dragSliderTo(currentPage, control, 6),
  );
  const customTiming = getDotsLoopTiming(6, 3, 9);
  await expect(output).toHaveAttribute("data-dot-active-duration", "6");
  await expect(output).toHaveAttribute("data-dot-product-duration", "9");
  await expect(output).toHaveAttribute("data-timeline-duration", "9");

  await setTimelineSeconds(page, customTiming.formationSeconds + 0.25);
  await expect(output).toHaveAttribute("data-dot-motion-phase", "rest");
  const calmHash = await canvasHash(page);

  await setTimelineSeconds(
    page,
    customTiming.formationSeconds + customTiming.calmSeconds + 0.25,
  );
  await expect(output).toHaveAttribute("data-dot-motion-phase", "release");
  await expect.poll(() => canvasHash(page)).not.toBe(calmHash);

  await setTimelineSeconds(page, 0);
  const firstFrameHash = await canvasHash(page);
  await setTimelineSeconds(page, customTiming.totalSeconds);
  expect(await canvasHash(page)).toBe(firstFrameHash);
});

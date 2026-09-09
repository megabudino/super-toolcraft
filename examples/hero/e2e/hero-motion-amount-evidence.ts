import type { Locator, Page } from "@playwright/test";

import { heroPreviewSelector } from "./hero-preview-browser-helpers";
import {
  armHeroMotionPixelCapture,
  beginHeroPanDrag,
  clearHeroMotionFrames,
  moveHeroPanDrag,
  readLatestHeroMotionFrame,
  type HeroMotionRawPixelSample,
  waitForHeroMotionPixelSamples,
} from "./hero-motion-effects-evidence";
import {
  dragPreparedHeroSliderBeforeRelease,
  type PreparedHeroSliderEndpointDrag,
} from "./hero-motion-live-slider-drag";
import { getHeroMotionPixelHash } from "./hero-motion-pixel-evidence";
import { requestHeroGallerySnapshot } from "./hero-gallery-snapshot-helpers";
import { expect } from "./toolcraft-product-test";

export async function proveHeldAmountZeroPixels(
  page: Page,
  canvas: Locator,
  prepared: PreparedHeroSliderEndpointDrag,
): Promise<
  Readonly<{
    active: HeroMotionRawPixelSample;
    clean: HeroMotionRawPixelSample;
    finalPan: string;
  }>
> {
  await clearHeroMotionFrames(canvas);
  const start = await beginHeroPanDrag(page);
  let activeRequest = 0;
  try {
    for (let step = 1; step < 4; step += 1) {
      await moveHeroPanDrag(page, start, step);
    }
    const afterSequence =
      (await readLatestHeroMotionFrame(canvas))?.sequence ?? 0;
    activeRequest = await armHeroMotionPixelCapture(canvas, {
      afterSequence,
      match: { grainMinimum: 0.0001 },
      maximumSamples: 4,
    });
    await moveHeroPanDrag(page, start, 4);
  } finally {
    await page.mouse.up();
  }
  const activeSamples = await waitForHeroMotionPixelSamples(
    canvas,
    activeRequest,
    1,
  );
  const active = [...activeSamples].sort(
    (first, second) => second.frame.grain - first.frame.grain,
  )[0]!;
  const finalPan = await page
    .locator(heroPreviewSelector)
    .getAttribute("data-hero-gallery-pan");
  if (!finalPan) throw new Error("The held Amount Pan must be observable.");

  let heldClean: HeroMotionRawPixelSample | undefined;
  await dragPreparedHeroSliderBeforeRelease(page, prepared, async () => {
    const afterSequence =
      (await readLatestHeroMotionFrame(canvas))?.sequence ?? 0;
    const cleanRequest = await armHeroMotionPixelCapture(canvas, {
      afterSequence,
      match: { grainMaximum: 0 },
      maximumSamples: 1,
    });
    await requestHeroGallerySnapshot(page);
    const [clean] = await waitForHeroMotionPixelSamples(
      canvas,
      cleanRequest,
      1,
    );
    expect(clean?.frame.grain).toBe(0);
    heldClean = clean;
    expect(getHeroMotionPixelHash(clean!)).not.toBe(
      getHeroMotionPixelHash(active),
    );
    await expect(page.locator(heroPreviewSelector)).toHaveAttribute(
      "data-hero-gallery-pan",
      finalPan,
    );
  });
  return { active, clean: heldClean!, finalPan };
}

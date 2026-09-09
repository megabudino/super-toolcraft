import type { Locator, Page } from "@playwright/test";

import { heroEffectsTargets } from "../src/app/hero-effects-values";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { heroPreviewSelector } from "./hero-preview-browser-helpers";
import {
  armHeroMotionPixelCapture,
  type HeroMotionRawPixelSample,
  waitForHeroMotionPixelSamples,
} from "./hero-motion-effects-evidence";
import {
  startHeroAutoScrollMotion,
  stopHeroAutoScrollMotion,
} from "./hero-motion-effects-test-helpers";
import {
  dragPreparedHeroSliderBeforeRelease,
  prepareHeroSliderEndpointDrag,
} from "./hero-motion-live-slider-drag";
import { requestHeroGallerySnapshot } from "./hero-gallery-snapshot-helpers";
import { expect } from "./toolcraft-product-test";

async function captureActiveGrainSizeFrame(
  canvas: Locator,
  afterSequence: number,
  size: number,
): Promise<HeroMotionRawPixelSample> {
  const request = await armHeroMotionPixelCapture(canvas, {
    afterSequence,
    match: { grainMinimum: 0.0001, grainSize: size },
    maximumSamples: 1,
  });
  await requestHeroGallerySnapshot(canvas.page());
  const [sample] = await waitForHeroMotionPixelSamples(canvas, request, 1);
  if (!sample) throw new Error("The live Size frame must be captured.");
  return sample;
}

export async function proveHeldHeroGrainSizePixels(
  page: Page,
  canvas: Locator,
): Promise<void> {
  const output = page.locator(heroPreviewSelector);
  const initialPan = await output.getAttribute("data-hero-gallery-pan");
  if (!initialPan) throw new Error("The held Size baseline Pan must exist.");
  try {
    await startHeroAutoScrollMotion(page, canvas, "grain");
    const activeSizeEight = await captureActiveGrainSizeFrame(canvas, 0, 8);

    const currentSizeControl = await getToolcraftControlFieldByTarget(
      page,
      heroEffectsTargets.grainSize,
    );
    const fineDrag = await prepareHeroSliderEndpointDrag(currentSizeControl, 1);
    await dragPreparedHeroSliderBeforeRelease(page, fineDrag, async () => {
      await expect(fineDrag.slider).toHaveAttribute("aria-valuenow", "1");
      await expect.poll(() => fineDrag.slider.inputValue()).toBe("1");
      const activeSizeOne = await captureActiveGrainSizeFrame(
        canvas,
        activeSizeEight.frame.sequence,
        1,
      );
      expect(activeSizeEight.frame.grain).toBeGreaterThan(0.0001);
      expect(activeSizeEight.frame.grainSize).toBe(8);
      expect(activeSizeOne.frame.sequence).toBeGreaterThan(
        activeSizeEight.frame.sequence,
      );
      expect(activeSizeOne.frame.grain).toBeGreaterThan(0.0001);
      expect(activeSizeOne.frame.grainSize).toBe(1);
    });
  } finally {
    await stopHeroAutoScrollMotion(page, canvas, "grain");
  }
  const finalPan = await output.getAttribute("data-hero-gallery-pan");
  if (!finalPan) throw new Error("The held Size final Pan must exist.");
}

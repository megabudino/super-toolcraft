import type { Page } from "@playwright/test";
import { roomOutput } from "./studio-room-motion-fixture";

/** Observe one actual shuffle and its reveal/position frames, without clock or RNG overrides. */
export async function observeNextRoomTileChange(page: Page) {
  return page.locator(roomOutput).evaluate(async root => {
    const selector = '[class*="_tileImage_"]';
    const originalImages = new Set(root.querySelectorAll(selector));
    const originalSlots = Array.from(root.querySelectorAll('[class*="_tileSlot_"]'));
    const transforms = new Map(originalSlots.map(slot => [slot, new Set([getComputedStyle(slot).transform])]));
    const start = performance.now();
    let changedAt: number | undefined;
    let maximumBlur = 0;
    let changedSource = "";
    await new Promise<void>((resolve, reject) => {
      const sample = () => {
        const now = performance.now();
        for (const [slot, samples] of transforms) samples.add(getComputedStyle(slot).transform);
        for (const image of root.querySelectorAll<HTMLImageElement>(selector)) {
          if (originalImages.has(image)) continue;
          changedAt ??= now;
          changedSource = image.currentSrc || image.src;
          const blur = Number(getComputedStyle(image).filter.match(/blur\(([\d.]+)px\)/u)?.[1] ?? 0);
          maximumBlur = Math.max(maximumBlur, blur);
        }
        if (changedAt !== undefined && now - changedAt >= 650) resolve();
        else if (now - start > 8500) reject(new Error("No actual tile shuffle occurred within the configured interval"));
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    return {
      maximumBlur,
      changedSource,
      firstChangeMs: changedAt! - start,
      positionFrames: Math.max(...Array.from(transforms.values(), samples => samples.size)),
    };
  });
}

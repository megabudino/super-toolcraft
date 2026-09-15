import { expect, type Page } from "@playwright/test";

import { PREVIEW_CANVAS_SELECTOR } from "./product-landing-globe-helpers";

export async function expectGlobeFrameContinuity<T>(
  page: Page,
  action: () => Promise<T>,
): Promise<T> {
  const probe = await page.locator(PREVIEW_CANVAS_SELECTOR).evaluateHandle((element) => {
    const canvas = element as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Globe preview has no 2D context.");
    const backing = { width: canvas.width, height: canvas.height };
    const result = { samples: 0, blankFrames: 0, backingChanges: 0 };
    let frame = 0;
    const sample = () => {
      const pixels = context.getImageData(canvas.width / 2, canvas.height / 2, 8, 8).data;
      result.samples++;
      if (!pixels.some((value, index) => index % 4 === 3 && value > 0)) {
        result.blankFrames++;
      }
      if (canvas.width !== backing.width || canvas.height !== backing.height) {
        result.backingChanges++;
      }
      frame = requestAnimationFrame(sample);
    };
    frame = requestAnimationFrame(sample);
    return {
      stop: () => {
        cancelAnimationFrame(frame);
        return result;
      },
    };
  });

  try {
    const outcome = await action();
    const result = await probe.evaluate((observer) => observer.stop());
    expect(result.samples, "Observe rendered frames during the real orbit gesture").toBeGreaterThan(0);
    expect(result.blankFrames, "Globe must remain visible throughout orbit").toBe(0);
    expect(result.backingChanges, "Orbit must preserve the selected backing dimensions").toBe(0);
    return outcome;
  } finally {
    await probe.evaluate((observer) => observer.stop());
    await probe.dispose();
  }
}

import type { Page } from "@playwright/test";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expect } from "./toolcraft-product-test";

export const roomOutput = "[data-studio-room]";
export const roomField = (page: Page, target: string) =>
  page.locator(`[data-toolcraft-control-target="${target}"]`);

export async function prepareRoomMotion(page: Page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.locator(roomOutput)).toBeVisible();
  // Fit the authored room into the browser through its normal artboard controls.
  for (const [target, value] of [["canvas.size.width", "1024"], ["canvas.size.height", "576"]]) {
    const input = roomField(page, target).getByRole("textbox");
    await input.fill(value);
    await input.press("Enter");
    await expect(input).toHaveValue(value);
  }
  for (const target of ["motion.parallax", "motion.scrollNudge", "tiles.hoverLift"]) {
    await roomField(page, target).getByRole("slider").press("Home");
  }
  await roomField(page, "tiles.interval").getByRole("slider").press("End");
  return session;
}

export async function roomPointerPulse(page: Page) {
  const box = await page.locator(roomOutput).boundingBox();
  if (!box) throw new Error("Studio Room must have visible bounds");
  const y = Math.max(50, Math.min(600, box.y + box.height * 0.4));
  const left = Math.max(45, box.x + box.width * 0.12);
  const right = Math.min(800, box.x + box.width * 0.7);
  await page.mouse.move(right, y);
  await page.mouse.move(left, y, { steps: 4 });
}

export const trailOpacity = (page: Page) => page.locator("[data-studio-room-trail]")
  .evaluateAll(elements => Math.max(0, ...elements.map(element => Number(getComputedStyle(element).opacity))));

/** Read rendered opacity over an animation interval; never replace the clock or renderer. */
export async function observeTrailDecay(page: Page) {
  return page.locator(roomOutput).evaluate(async element => {
    const samples: number[] = [];
    const start = performance.now();
    await new Promise<void>(resolve => {
      const sample = () => {
        samples.push(Math.max(0, ...Array.from(element.querySelectorAll("[data-studio-room-trail]"),
          group => Number(getComputedStyle(group).opacity))));
        if (performance.now() - start >= 1000) resolve();
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    return { peak: Math.max(...samples), last: samples.at(-1)! };
  });
}

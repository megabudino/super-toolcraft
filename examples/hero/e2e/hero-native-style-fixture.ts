import type { Page } from "@playwright/test";
import { appAcceptance } from "../src/app/app-acceptance-data";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { getToolcraftProductObservableSnapshot } from "./product-observable-helpers";
import { expect } from "./toolcraft-product-test";

export const heroOutput = '[data-toolcraft-product-output="hero-native-preview"]';
export const heroHeading = "[data-hero-heading-group]";
export const heroField = (page: Page, target: string) => page.locator(`[data-toolcraft-control-target="${target}"]`);
export function heroStyleTitle(target: string) {
  const row = appAcceptance.find(item => item.id === target);
  if (!row?.browserTestName) throw new Error(`Missing Hero acceptance ${target}`);
  return row.browserTestName;
}
export const heroStyleProof = (requirementId: string, selector = heroHeading) => ({
  requirementId, selector, stabilitySamples: 2, stabilityIntervalMs: 50,
});
export async function prepareHeroStyle(page: Page, outputSelector = heroHeading) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  // Exercise the full native desktop Hero at its smallest desktop artboard,
  // through normal controls. Keep render scale, assets and shipped defaults.
  for (const [target, value] of [["canvas.size.width", "1280"], ["canvas.size.height", "720"]]) {
    const input = heroField(page, target).getByRole("textbox");
    await input.fill(value);
    await input.press("Enter");
    await expect(input).toHaveValue(value);
  }
  await expect(page.locator(heroHeading)).toBeVisible();
  await expect(page.locator(`${heroOutput} [data-hero-gallery][data-hero-gallery-ready="true"]`)).toHaveCount(1);
  const canvas = page.locator(`${heroOutput} [data-hero-gallery-canvas]`);
  await expect(canvas).toHaveAttribute("data-hero-gallery-revealed", "true");
  await expect(canvas).toHaveCSS("opacity", "1");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // Texture readiness is published before its scheduled final draw. This
  // renderer intentionally has no preserved drawing buffer, so use visible
  // screenshots rather than reading an already-cleared WebGL buffer.
  let previous: string | undefined;
  await expect.poll(async () => {
    const current = await getToolcraftProductObservableSnapshot(page, { selector: outputSelector });
    const stable = current === previous;
    previous = current;
    return stable;
  }, { message: "The loaded Hero gallery must finish its native reduced-motion draw", intervals: [80] }).toBe(true);
  return session;
}
export async function setHeroToggle(page: Page, target: string, enabled: boolean) {
  const toggle = heroField(page, target).getByRole("switch");
  if (await toggle.getAttribute("aria-checked") !== String(enabled)) await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", String(enabled));
}
export async function dragHeroStyle(page: Page, target: string, fraction = 0.7) {
  const track = heroField(page, target).locator('[data-slot="slider"]').first();
  await track.scrollIntoViewIfNeeded();
  const box = await track.boundingBox();
  if (!box) throw new Error(`Expected visible Hero slider ${target}`);
  await page.mouse.move(box.x + 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2, { steps: 3 });
}

export async function heroShadowFilterId(page: Page, subject: string) {
  const filter = await page.locator(subject).evaluate(element => getComputedStyle(element).filter);
  const id = filter.match(/#([^"\)]+)/u)?.[1];
  if (!id) throw new Error(`Expected active SVG shadow on ${subject}`);
  return id;
}

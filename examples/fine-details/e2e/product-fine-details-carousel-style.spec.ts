import type { Page } from "@playwright/test";
import { appAcceptance } from "../src/app/app-acceptance-data";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const section = "[data-fine-details-section]";
const carousel = "[data-fine-details-carousel]";
const card = '[data-fd-carousel-sequence="primary"] [data-fd-carousel-card-shell]';
const field = (page: Page, target: string) => page.locator(`[data-toolcraft-control-target="${target}"]`);
const title = (target: string) => {
  const row = appAcceptance.find(item => item.id === target);
  if (!row) throw new Error(`Missing carousel acceptance ${target}`);
  return row.browserTestName;
};

async function prepare(page: Page, prerequisite?: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  await field(page, "images.mode").getByRole("button", { name: "Carousel", exact: true }).click();
  await expect(page.locator(carousel)).toHaveAttribute("data-fd-carousel-band-valid", "true");
  await expect(page.locator(card)).toHaveCount(4);
  // Offscreen cards intentionally use native lazy loading. Require every
  // image in both the carousel and browser viewport to have decoded real pixels.
  await expect.poll(() => page.locator(`${card} img`).evaluateAll(images => {
    const frame = document.querySelector("[data-fine-details-carousel]")!.getBoundingClientRect();
    const visible = images.filter(image => {
      const rect = image.getBoundingClientRect();
      return rect.right > Math.max(0, frame.left) && rect.left < Math.min(innerWidth, frame.right)
        && rect.bottom > Math.max(0, frame.top) && rect.top < Math.min(innerHeight, frame.bottom);
    });
    if (visible.length === 0) return "No visible carousel images";
    return visible.filter(image => !(image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))
      .map(image => `${image.getAttribute("src")}: ${JSON.stringify(image.getBoundingClientRect())}`).join("; ");
  })).toBe("");
  if (prerequisite) {
    const toggle = field(page, prerequisite).getByRole("switch");
    if (await toggle.getAttribute("aria-checked") !== "true") await toggle.click();
  }
  return session;
}

for (const [target, selector, property, prerequisite, shadowIndex, direction] of [
  ["carousel.radius", card, "border-radius", undefined, undefined, 1],
  ["carousel.gap", '[data-fd-carousel-sequence="primary"]', "gap", undefined, undefined, 1],
  ["carousel.textGap", card, "height", undefined, undefined, -1],
  ["carousel.border.width", card, "border-left-width", "carousel.border.enabled", undefined, 1],
  ["carousel.shadow.blur", card, "box-shadow", "carousel.shadow.enabled", 2, 1],
  ["carousel.shadow.spread", card, "box-shadow", "carousel.shadow.enabled", 3, 1],
] as const) {
  test(title(target), async ({ page }) => {
    const session = await prepare(page, prerequisite);
    const read = () => page.locator(selector).first().evaluate((element, config) => {
      const value = getComputedStyle(element).getPropertyValue(config.property);
      return Number.parseFloat(config.shadowIndex === undefined
        ? value : value.match(/-?[\d.]+px/gu)?.[config.shadowIndex] ?? "NaN");
    }, { property, shadowIndex });
    const before = await read();
    expect(Number.isFinite(before)).toBe(true);
    const control = field(page, target);
    const slider = control.getByRole("slider");
    const baseline = Number(await slider.getAttribute("aria-valuenow"));
    const track = control.locator('[data-slot="slider"]').first();
    await track.scrollIntoViewIfNeeded();
    try {
      await expectToolcraftProductObservableToChange(session,
        session.targetAction(target, async () => {
          const box = await track.boundingBox();
          if (!box) throw new Error("Expected visible carousel slider");
          await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * 0.8 + 1, box.y + box.height / 2);
          await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).toBeGreaterThan(baseline);
          await expect.poll(async () => ((await read()) - before) * direction).toBeGreaterThan(0);
        }), { requirementId: target, selector: section, stabilityIntervalMs: 50, stabilitySamples: 2 });
    } finally {
      await page.mouse.up();
    }
  });
}

test(title("carousel.count"), async ({ page }) => {
  const session = await prepare(page);
  await expectToolcraftProductObservableToChange(session,
    session.targetAction("carousel.count", async () => {
      await field(page, "carousel.count").getByRole("slider").press("Home");
      await expect(page.locator(card)).toHaveCount(1);
      await expect(page.locator(`${card} img`)).toBeVisible();
    }), { requirementId: "carousel.count", selector: section, stabilityIntervalMs: 50, stabilitySamples: 2 });
});

for (const [target, property, disabled] of [
  ["carousel.border.enabled", "border-left-width", "0px"],
  ["carousel.shadow.enabled", "box-shadow", "none"],
] as const) {
  test(title(target), async ({ page }) => {
    const session = await prepare(page);
    const rendered = page.locator(card).first();
    const toggle = field(page, target).getByRole("switch");
    await expect(toggle).not.toBeChecked();
    await expect(rendered).toHaveCSS(property, disabled);
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await toggle.click();
      await expect(rendered).not.toHaveCSS(property, disabled);
    }), { requirementId: target, selector: section, stabilityIntervalMs: 50, stabilitySamples: 2 });
    await toggle.click();
    await expect(rendered).toHaveCSS(property, disabled);
  });
}

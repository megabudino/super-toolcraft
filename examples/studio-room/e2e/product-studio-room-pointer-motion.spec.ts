import type { Page } from "@playwright/test";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const output = "[data-studio-room]";
const wall = `${output} [class*="_backWall_"]`;
const field = (page: Page, target: string) => page.locator(`[data-toolcraft-control-target="${target}"]`);
async function prepare(page: Page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.locator(output)).toBeVisible();
  // Isolate pointer geometry using visible product controls. No fixture writes
  // to runtime state and no reduced-motion preference masking this behavior.
  await field(page, "tiles.interval").getByRole("slider").press("End");
  await field(page, "motion.scrollNudge").getByRole("slider").press("Home");
  await field(page, "trail.enabled").getByRole("switch").click();
  await expect(field(page, "trail.enabled").getByRole("switch")).not.toBeChecked();
  return session;
}
async function moveWithinRoom(page: Page) {
  const box = await page.locator(output).boundingBox();
  if (!box) throw new Error("Studio Room must have visible bounds");
  // Left quarter is clear of the right-hand controls panel in the actual
  // 1280px browser fixture, even when the authored scene is wider than it.
  const x = Math.max(40, box.x + box.width * 0.25);
  const y = Math.max(40, Math.min(620, box.y + box.height * 0.5));
  await page.mouse.move(x + 1, y);
  await page.mouse.move(x, y);
}
const offsetX = (page: Page) => page.locator(wall).evaluate(element =>
  new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);

test("browser: motion.parallax updates the real Studio Room preview", async ({ page }) => {
  const session = await prepare(page);
  const target = "motion.parallax";
  const slider = field(page, target).getByRole("slider");
  await slider.press("Home");
  await moveWithinRoom(page);
  await expect.poll(() => offsetX(page)).toBe(0);
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await slider.press("End");
    await expect(slider).toHaveAttribute("aria-valuenow", "150");
    await moveWithinRoom(page);
    await expect.poll(() => offsetX(page)).toBeLessThan(-20);
  }), { requirementId: target, selector: output, stabilitySamples: 2, stabilityIntervalMs: 50 });
  await slider.press("Home");
  await moveWithinRoom(page);
  await expect.poll(() => offsetX(page)).toBe(0);
});

test("browser: motion.enabled updates the real Studio Room preview", async ({ page }) => {
  const session = await prepare(page);
  const target = "motion.enabled";
  const toggle = field(page, target).getByRole("switch");
  await expect(toggle).toBeChecked();
  await toggle.click();
  await moveWithinRoom(page);
  await expect.poll(() => offsetX(page)).toBe(0);
  await expect(field(page, "motion.parallax")).toHaveCount(0);
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await toggle.click();
    await expect(field(page, "motion.parallax")).toHaveCount(1);
    await moveWithinRoom(page);
    await expect.poll(() => offsetX(page)).toBeLessThan(-20);
  }), { requirementId: target, selector: output, stabilitySamples: 2, stabilityIntervalMs: 50 });
  await toggle.click();
  await moveWithinRoom(page);
  await expect.poll(() => offsetX(page)).toBe(0);
});

test("browser: tiles.hoverLift updates the real Studio Room preview", async ({ page }) => {
  const session = await prepare(page);
  const target = "tiles.hoverLift";
  // At the default 1920px scene, the surrounding tiles are clipped out of this
  // browser fixture. Resize the actual artboard, preserving tile count/detail.
  for (const [name, value] of [["canvas.size.width", "1024"], ["canvas.size.height", "576"]]) {
    const input = field(page, name).getByRole("textbox");
    await input.fill(value);
    await input.press("Enter");
    await expect(input).toHaveValue(value);
  }
  await field(page, "motion.parallax").getByRole("slider").press("Home");
  const slider = field(page, target).getByRole("slider");
  await slider.press("Home");
  const images = page.locator(`${output} [class*="_tileImage_"]`);
  const findVisible = () => images.evaluateAll(elements => elements.findIndex(element => {
    const rect = element.getBoundingClientRect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    return element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0
      && x > 40 && x < innerWidth - 340 && y > 40 && y < innerHeight - 90;
  }));
  await expect.poll(findVisible, { message: "A decoded tile must enter the visible artboard" }).toBeGreaterThanOrEqual(0);
  const visibleIndex = await findVisible();
  expect(visibleIndex, "A decoded tile must be visible outside the controls panel").toBeGreaterThanOrEqual(0);
  const image = images.nth(visibleIndex);
  const hoverImage = async () => {
    const box = await image.boundingBox();
    if (!box) throw new Error("Selected Studio Room tile must remain visible");
    await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  };
  const scale = () => image.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m11);
  await hoverImage();
  await expect.poll(scale).toBe(1);
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await slider.press("End");
    await hoverImage();
    await expect.poll(scale).toBeGreaterThan(1.01);
    await expect(image).not.toHaveCSS("box-shadow", "rgba(20, 24, 9, 0) 0px 0px 0px 0px");
  }), { requirementId: target, selector: output, stabilitySamples: 2, stabilityIntervalMs: 50 });
  await slider.press("Home");
  await hoverImage();
  await expect.poll(scale).toBe(1);
});

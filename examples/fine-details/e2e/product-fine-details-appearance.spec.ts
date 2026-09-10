import { appAcceptance } from "../src/app/app-acceptance-data";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const section = "[data-fine-details-section]";
const cases = [
  ["appearance.gridSize", ':scope > div[aria-hidden="true"]', "background-size", 40, 1],
  ["appearance.gridOpacity", ':scope > div[aria-hidden="true"]', "opacity", 10, 0.01],
  ["typography.upperLeft.left", "[data-fine-details-upper-row]", "padding-left", 64, 1],
  ["typography.upperLeft.top", "[data-fine-details-upper-row]", "top", 64, 1],
  ["typography.upperLeft.fontSize", "[data-fine-details-upper-left-typography]", "font-size", 48, 1],
  ["typography.lowerRight.right", "[data-fine-details-lower-right-typography]", "right", 64, 1],
  ["typography.lowerRight.bottom", "[data-fine-details-lower-right-typography]", "bottom", 64, 1],
  ["typography.lowerRight.headingFontSize", "[data-fine-details-lower-heading]", "font-size", 32, 1],
  ["typography.lowerRight.bodyFontSize", "[data-fine-details-lower-body]", "font-size", 16, 1],
  ["typography.lowerRight.gap", "[data-fine-details-lower-right-typography]", "gap", 24, 1],
] as const;

for (const [target, selector, property, increment, scale] of cases) {
  const acceptance = appAcceptance.find(row => row.id === target);
  if (!acceptance) throw new Error(`Missing appearance acceptance: ${target}`);
  test(acceptance.browserTestName, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "commit" });
    const session = await createToolcraftBrowserProofSession(page);
    const output = page.locator(section);
    await expect(output).toBeVisible();
    const rendered = output.locator(selector);
    const readStyle = () => rendered.evaluate((element, cssProperty) =>
      Number.parseFloat(getComputedStyle(element).getPropertyValue(cssProperty)), property);
    const before = await readStyle();
    const control = page.locator(`[data-toolcraft-control-target="${target}"]`);
    await expect(control).toHaveCount(1);
    const slider = control.getByRole("slider");
    const range = await slider.evaluate(element => ({
      value: Number(element.getAttribute("aria-valuenow")),
      min: Number(element.getAttribute("aria-valuemin") ?? element.getAttribute("min")),
      max: Number(element.getAttribute("aria-valuemax") ?? element.getAttribute("max")),
    }));
    expect(range.max).toBeGreaterThan(range.min);
    const fraction = (Math.min(range.value + increment, range.max) - range.min) / (range.max - range.min);
    const track = control.locator('[data-slot="slider"]').first();
    await track.scrollIntoViewIfNeeded();
    try {
      await expectToolcraftProductObservableToChange(session,
        session.targetAction(target, async () => {
          const box = await track.boundingBox();
          if (!box) throw new Error("Expected visible appearance slider");
          await page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * fraction + 1, box.y + box.height / 2);
          await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).toBeGreaterThan(range.value);
          await expect.poll(readStyle).toBeGreaterThan(before);
          const value = Number(await slider.getAttribute("aria-valuenow"));
          await expect.poll(async () => Math.abs(await readStyle() - value * scale)).toBeLessThan(0.02);
        }), { requirementId: target, selector: section, stabilityIntervalMs: 50, stabilitySamples: 2 });
    } finally {
      await page.mouse.up();
    }
  });
}

const background = appAcceptance.find(row => row.id === "appearance.background")!;
test(background.browserTestName, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  const output = page.locator(section);
  await expect(output).toBeVisible();
  await expectToolcraftProductObservableToChange(session,
    session.targetAction("appearance.background", async () => {
      const input = page.locator('[data-toolcraft-control-target="appearance.background"]').getByRole("textbox");
      await input.fill("#E5D8FA");
      await input.press("Enter");
      await expect(output).toHaveCSS("background-color", "rgb(229, 216, 250)");
    }), { requirementId: "appearance.background", selector: section, stabilityIntervalMs: 50, stabilitySamples: 2 });
});

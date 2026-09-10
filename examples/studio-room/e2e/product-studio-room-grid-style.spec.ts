import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

for (const [target, selector] of [
  ["grid.color", 'svg[class*="_grid_"] > g'],
  ["fineGrid.color", 'svg[class*="_fineGrid_"] > g'],
] as const) {
  test(`browser: ${target} updates the real Studio Room preview`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "commit" });
    const session = await createToolcraftBrowserProofSession(page);
    const lines = page.locator("[data-studio-room]").locator(selector);
    await expect(lines).toBeVisible();
    const control = page.locator(`[data-toolcraft-control-target="${target}"]`);
    await expect(control).toHaveCount(1);
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      const input = control.getByRole("textbox");
      await input.fill("#D93674");
      await input.press("Enter");
      await expect(lines).toHaveCSS("stroke", "rgb(217, 54, 116)");
    }), { requirementId: target, selector: "[data-studio-room]", stabilityIntervalMs: 50, stabilitySamples: 2 });
  });
}

for (const [target, selector, dependent, initiallyVisible] of [
  ["fineGrid.enabled", 'svg[class*="_fineGrid_"]', "fineGrid.opacity", true],
  ["room.innerGrid.enabled", "[data-studio-room-inner-grid]", "room.innerGrid.opacity", false],
] as const) {
  test(`browser: ${target} updates the real Studio Room preview`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "commit" });
    const session = await createToolcraftBrowserProofSession(page);
    const layer = page.locator(selector);
    const toggle = page.locator(`[data-toolcraft-control-target="${target}"]`).getByRole("switch");
    const child = page.locator(`[data-toolcraft-control-target="${dependent}"]`);
    await expect(toggle).toBeChecked({ checked: initiallyVisible });
    await expect(layer).toHaveCount(initiallyVisible ? 1 : 0);
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await toggle.click();
      await expect(layer).toHaveCount(initiallyVisible ? 0 : 1);
      await expect(child).toHaveCount(initiallyVisible ? 0 : 1);
    }), { requirementId: target, selector: "[data-studio-room]", stabilityIntervalMs: 50, stabilitySamples: 2 });
    await toggle.click();
    await expect(layer).toHaveCount(initiallyVisible ? 1 : 0);
    await expect(child).toHaveCount(initiallyVisible ? 1 : 0);
  });
}

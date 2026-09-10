import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { roomStaticCases } from "./studio-room-static-cases";
import { expect, test } from "./toolcraft-product-test";

for (const scenario of roomStaticCases) {
  test(`browser: ${scenario.target} updates the real Studio Room preview`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "commit" });
    const session = await createToolcraftBrowserProofSession(page);
    const output = page.locator("[data-studio-room]");
    await expect(output).toBeVisible();
    if (scenario.prerequisite) {
      const toggle = page.locator(`[data-toolcraft-control-target="${scenario.prerequisite}"]`).getByRole("switch");
      if (await toggle.getAttribute("aria-checked") !== "true") await toggle.click();
    }
    const rendered = output.locator(scenario.selector);
    const readOutput = async () => {
      if (scenario.property) return rendered.first().evaluate((element, property) =>
        Number.parseFloat(getComputedStyle(element).getPropertyValue(property)), scenario.property);
      if (scenario.attribute) {
        const value = await rendered.first().getAttribute(scenario.attribute);
        return scenario.colorChannel ? Number(value?.match(/rgb\(\s*([\d.]+)/u)?.[1]) : Number(value);
      }
      return rendered.count();
    };
    const before = await readOutput();
    expect(Number.isFinite(before)).toBe(true);
    const control = page.locator(`[data-toolcraft-control-target="${scenario.target}"]`);
    await expect(control).toHaveCount(1);
    const slider = control.getByRole("slider");
    const baseline = Number(await slider.getAttribute("aria-valuenow"));
    const track = control.locator('[data-slot="slider"]').first();
    await track.scrollIntoViewIfNeeded();
    try {
      await expectToolcraftProductObservableToChange(session,
        session.targetAction(scenario.target, async () => {
          const box = await track.boundingBox();
          if (!box) throw new Error("Expected visible slider track");
          await page.mouse.move(box.x + 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2, { steps: 3 });
          await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).toBeGreaterThan(baseline);
          await expect.poll(async () => (await readOutput() - before) * (scenario.direction ?? 1)).toBeGreaterThan(0);
        }), {
          requirementId: scenario.target,
          selector: "[data-studio-room]",
          stabilityIntervalMs: 50,
          stabilitySamples: 2,
          timeoutMs: 5_000,
        });
    } finally {
      // Both the semantic assertion and rendered-pixel proof happen live.
      await page.mouse.up();
    }
  });
}

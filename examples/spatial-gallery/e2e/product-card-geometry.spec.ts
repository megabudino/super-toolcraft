import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { dragSliderToFraction, setSpiralCanvasSize, uploadSpiralFixtures,
  waitForSpiralCards, waitForSpiralSettled } from "./spiral-gallery-test-helpers";
import { spiralSliderEndpoint } from "./spiral-slider-endpoint";
import { expect, test } from "./toolcraft-product-test";

for (const [id, target, name] of [
  ["card-cornerRadius", "card.cornerRadius", "corner radius"],
  ["spiral-verticalGap", "spiral.verticalGap", "vertical gap"],
] as const) {
  test(`browser: Spatial Gallery ${name} changes rendered cards`, async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    const session = await createToolcraftBrowserProofSession(page);
    await setSpiralCanvasSize(page, 640, 360);
    await uploadSpiralFixtures(page);
    await waitForSpiralCards(page, 12);
    await waitForSpiralSettled(page);
    await expectToolcraftProductObservableToChange(session,
      session.controlAction(target, async (control, currentPage) => {
        const slider = control.getByRole("slider");
        const before = Number(await slider.getAttribute("aria-valuenow"));
        const minimum = Number(await slider.getAttribute("aria-valuemin") ?? await slider.getAttribute("min"));
        const maximum = Number(await slider.getAttribute("aria-valuemax") ?? await slider.getAttribute("max"));
        await dragSliderToFraction(control, currentPage, 0.78);
        await slider.press(spiralSliderEndpoint(before, minimum, maximum));
        await expect(slider).not.toHaveAttribute("aria-valuenow", String(before));
        await waitForSpiralSettled(currentPage);
      }), { requirementId: id, selector: '[data-image-gallery-canvas="true"]',
        stabilityIntervalMs: 100, timeoutMs: 8_000 });
  });
}

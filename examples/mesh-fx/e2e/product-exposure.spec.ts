import { expect, test, type Locator } from "@playwright/test";
import { getToolcraftFieldByLabel, dragToolcraftSliderByLabel } from "./performance-control-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

async function meanLuminance(canvas: Locator) {
  return canvas.evaluate(element => {
    const sample = document.createElement("canvas");
    sample.width = 128;
    sample.height = 72;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Cannot inspect Exposure output.");
    // The product renderer preserves its drawing buffer. Inspect actual pixels,
    // not a shader uniform or an editor-panel screenshot.
    context.drawImage(element as HTMLCanvasElement, 0, 0, 128, 72);
    const { data } = context.getImageData(0, 0, 128, 72);
    let sum = 0;
    for (let index = 0; index < data.length; index += 4) {
      sum += 0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2];
    }
    return sum / (128 * 72);
  });
}

test("browser: Mesh FX Exposure changes luminance without moving the camera", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator('[data-toolcraft-product-output="mesh-fx-canvas"]');
  await expect(canvas).toBeVisible();
  // Keep grain at a deterministic phase; noise is not evidence of an Exposure edit.
  const dynamicNoise = (await getToolcraftFieldByLabel(page, "Dynamic noise")).getByRole("switch");
  if (await dynamicNoise.isChecked()) await dynamicNoise.click();
  await expect(dynamicNoise).not.toBeChecked();
  const slider = (await getToolcraftFieldByLabel(page, "Exposure")).getByRole("slider");
  await slider.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "-2");
  const orbit = await canvas.getAttribute("data-view-orbit");
  const before = await meanLuminance(canvas);
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Exposure", 0.8);
    await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).toBeGreaterThan(1);
    await expect.poll(() => meanLuminance(canvas)).toBeGreaterThan(before + 2);
  }, { selector: '[data-toolcraft-product-output="mesh-fx-canvas"]' });
  await expect(canvas).toHaveAttribute("data-view-orbit", orbit!);
});

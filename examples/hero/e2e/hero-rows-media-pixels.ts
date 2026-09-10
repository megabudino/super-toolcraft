import type { Page } from "@playwright/test";
import { heroOutput } from "./hero-native-style-fixture";
import { expect } from "./toolcraft-product-test";

export async function expectHeroInnerCard(page: Page, side: "left" | "right", aspect: number, colors: readonly (readonly number[])[]) {
  const card = page.locator(`${heroOutput} [data-hero-card-row="${side}"] [data-hero-card-index="7"]`);
  await expect(card.locator("[data-dispersion-ready]")).toHaveAttribute("data-dispersion-ready", "true");
  const geometry = await card.evaluate(element => {
    const css = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    const viewport = element.closest("[data-hero-scene]")!.getBoundingClientRect();
    return { width: parseFloat(css.width), height: parseFloat(css.height),
      fullyVisible: bounds.left >= viewport.left && bounds.right <= viewport.right && bounds.top >= viewport.top && bounds.bottom <= viewport.bottom };
  });
  expect(geometry.fullyVisible).toBe(true);
  expect(geometry.width / geometry.height).toBeCloseTo(aspect, 2);
  // Screenshot the displayed card after the native fallback has disappeared;
  // decoding this screenshot cannot read the source image in place of output.
  // The floating controls overlap the right card on the test viewport. Use
  // their real collapse action, never CSS masking, before sampling product art.
  await page.getByRole("button", { name: "Collapse controls", exact: true }).click();
  let raster: Buffer;
  try {
    raster = await card.screenshot({ animations: "allow", scale: "css", type: "png" });
  } finally {
    await page.getByRole("button", { name: "Expand controls", exact: true }).click();
  }
  const samples = await page.evaluate(async encoded => {
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    try {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { willReadFrequently: true })!;
      context.drawImage(bitmap, 0, 0);
      return [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]].map(([x, y]) => {
        const data = context.getImageData(Math.floor(bitmap.width * x) - 2, Math.floor(bitmap.height * y) - 2, 5, 5).data;
        return [0, 1, 2].map(channel => {
          let sum = 0;
          for (let pixel = channel; pixel < data.length; pixel += 4) sum += data[pixel];
          return sum / 25;
        });
      });
    } finally { bitmap.close(); }
  }, raster.toString("base64"));
  for (const [quadrant, color] of colors.entries()) {
    for (let channel = 0; channel < 3; channel += 1) {
      expect(Math.abs(samples[quadrant][channel] - color[channel]), `Rendered ${side} card quadrant ${quadrant}, channel ${channel}: ${JSON.stringify(samples)}`).toBeLessThan(18);
    }
  }
}

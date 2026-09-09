import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  createLogoSphereProofSession,
  logoSphereCanvasSelector,
  moveSliderToEnd,
} from "./logo-sphere-test-helpers";
import { expect, test } from "./toolcraft-product-test";

test.setTimeout(120_000);

const sliderCases = [
  ["card.stroke-width", "card.strokeWidth"],
  ["card.corner-radius", "card.cornerRadius"],
  ["card.shadow-opacity", "card.shadowOpacity"],
  ["card.shadow-blur", "card.shadowBlur"],
  ["card.shadow-offset", "card.shadowOffset"],
] as const;

for (const [requirementId, target] of sliderCases) {
  test(
    `browser: ${requirementId} updates logo sphere product output`,
    async ({ page }) => {
      const session = await createLogoSphereProofSession(page);
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(target, moveSliderToEnd),
        {
          requirementId,
          selector: logoSphereCanvasSelector,
          stabilityIntervalMs: 0,
        },
      );
    },
  );
}

const colorCases = [
  ["card.stroke-color", "card.strokeColor", "#E02067", "#E02067"],
  ["card.shadow-color", "card.shadowColor", "#0055FF", "#6295F9"],
] as const;

async function countCanvasColorPixels(
  canvas: import("@playwright/test").Locator,
  hex: string,
): Promise<number> {
  return canvas.evaluate((element, expectedHex) => {
    const source = element as HTMLCanvasElement;
    const sample = document.createElement("canvas");
    sample.width = source.width;
    sample.height = source.height;
    const context = sample.getContext("2d", {
      willReadFrequently: true,
    });
    if (!context) return 0;
    context.drawImage(source, 0, 0);
    const target = [
      Number.parseInt(expectedHex.slice(1, 3), 16),
      Number.parseInt(expectedHex.slice(3, 5), 16),
      Number.parseInt(expectedHex.slice(5, 7), 16),
    ];
    const { data, height, width } = context.getImageData(
      0,
      0,
      (element as HTMLCanvasElement).width,
      (element as HTMLCanvasElement).height,
    );
    let count = 0;
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const offset = (y * width + x) * 4;
        if (
          Math.abs((data[offset] ?? 0) - (target[0] ?? 0)) <= 24 &&
          Math.abs((data[offset + 1] ?? 0) - (target[1] ?? 0)) <= 24 &&
          Math.abs((data[offset + 2] ?? 0) - (target[2] ?? 0)) <= 24 &&
          (data[offset + 3] ?? 0) >= 64
        ) {
          count += 1;
        }
      }
    }
    return count;
  }, hex);
}

for (const [requirementId, target, color, expectedPixelColor] of colorCases) {
  test(
    `browser: ${requirementId} updates logo sphere product output`,
    async ({ page }) => {
      const session = await createLogoSphereProofSession(page);
      if (target === "card.shadowColor") {
        await page
          .locator('[data-toolcraft-control-target="card.shadowOpacity"]')
          .getByRole("slider")
          .press("End");
        await page
          .locator('[data-toolcraft-control-target="card.shadowBlur"]')
          .getByRole("slider")
          .press("Home");
        await page
          .locator('[data-toolcraft-control-target="card.shadowOffset"]')
          .getByRole("slider")
          .press("End");
      }
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(target, async (control) => {
          const input = control.locator("input").last();
          await input.fill(color);
          await input.press("Enter");
        }),
        {
          requirementId,
          selector: logoSphereCanvasSelector,
          stabilityIntervalMs: 0,
        },
      );
      await expect(
        countCanvasColorPixels(
          page.locator(logoSphereCanvasSelector),
          expectedPixelColor,
        ),
      ).resolves.toBeGreaterThan(10);
    },
  );
}

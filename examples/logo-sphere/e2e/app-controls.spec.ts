import { expect, test } from "./toolcraft-product-test";

test.setTimeout(120_000);

test("browser: logo sphere opens with supplied media and controls", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toBeVisible();
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();
  await expect(
    page.locator('canvas[data-toolcraft-product-output="logo-sphere"]'),
  ).toHaveAttribute("data-ready-image-count", "30", { timeout: 20_000 });
  await expect(
    page.locator('[data-toolcraft-control-target="sphere.visibleCount"]'),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Play playback|Pause playback/ }),
  ).toBeVisible();
});

test("browser: logo sphere accepts another uploaded image", async ({ page }) => {
  await page.goto("/");
  const fileInput = page
    .locator('[data-toolcraft-control-target="logos.sources"]')
    .locator('input[type="file"]');
  const encodedPng = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Upload fixture requires Canvas 2D.");
    context.fillStyle = "#ff3366";
    context.fillRect(0, 0, 96, 96);
    context.fillStyle = "#ffffff";
    context.fillRect(24, 24, 48, 48);
    return canvas.toDataURL("image/png").split(",")[1]!;
  });

  await fileInput.setInputFiles({
    buffer: Buffer.from(encodedPng, "base64"),
    mimeType: "image/png",
    name: "extra-logo.png",
  });
  await expect(
    page.getByRole("img", { name: "extra-logo.png" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.locator('canvas[data-toolcraft-product-output="logo-sphere"]'),
  ).toHaveAttribute("data-ready-image-count", "1", { timeout: 20_000 });
});

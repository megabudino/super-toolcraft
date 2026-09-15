import { expect, test } from "./toolcraft-product-test";

test("browser: landing globe opens with product controls", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toBeVisible();
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();
  await expect(page.getByLabel("Landing globe preview")).toBeVisible();
  await expect(page.getByText("Globe", { exact: true })).toBeVisible();
  await expect(page.getByText("Latitudes")).toBeVisible();
  await expect(page.getByText("Meridians")).toBeVisible();
  await expect(page.getByText("Line width")).toBeVisible();
  await expect(page.getByText("Outline", { exact: true })).toBeVisible();
  await expect(page.getByText("Bands", { exact: true })).toBeVisible();
  await expect(page.getByText("Distance")).toBeVisible();
  await expect(page.getByText("Band 1 position")).toBeVisible();
  await expect(page.getByText("Band 4 width")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export PNG" })).toBeVisible();
  await expect(page.getByText("Prompt")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Play playback|Pause playback/ })).toHaveCount(0);
});

test("browser: landing globe canvas does not expose starter upload", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByText("Click to upload")).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByLabel("Landing globe preview")).toHaveAttribute(
    "data-toolcraft-renderer-layer",
    "globe-canvas",
  );
});

import { expect, test } from "./toolcraft-product-test";

test("browser: Dot Formation exposes the product shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toBeVisible();
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();
  await expect(page.locator('canvas[aria-label="Particle text formation"]')).toBeVisible();
  await expect(page.getByText("Particle Typography", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export Video" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export PNG" })).toBeVisible();
});

import { expect, test } from "./toolcraft-product-test";

test("browser: iceberg opens with topology controls", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-iceberg-canvas]')).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Peak height', exact: true })).toBeVisible();
  await expect(page.getByRole('button', {name: 'Export PNG', exact: true})).toBeVisible();
});

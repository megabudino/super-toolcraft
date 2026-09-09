import { expect, test } from "./toolcraft-product-test";

test("browser: Fine Details opens as a live Toolcraft workspace", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toBeVisible();
  await expect(
    page.getByRole("application", { name: "Canvas viewport" }),
  ).toBeVisible();
  await expect(
    page.locator(
      '[data-toolcraft-product-output="fine-details-external-preview"]',
    ),
  ).toBeVisible();
  await expect(page.getByText("Generation")).toHaveCount(0);
  await expect(page.getByText("Prompt", { exact: true })).toBeVisible();
  await expect(page.getByText("Prompt Shadow", { exact: true })).toBeVisible();
  await expect(page.getByText("Dur:")).toHaveCount(0);
});

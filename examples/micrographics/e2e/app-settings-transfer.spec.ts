import { readFile } from "node:fs/promises";

import { expect, test } from "./toolcraft-product-test";

const outputSelector =
  '[data-toolcraft-product-output="micrographics"]';
const firstElementSelector = '[data-element-index="0"]';

test.setTimeout(180_000);

test("browser: settings transfer restores authored canvas composition", async ({
  page,
}) => {
  await page.goto("/");
  const firstElement = page
    .locator(outputSelector)
    .locator(firstElementSelector);

  await expect(firstElement).toBeVisible();
  const exportedTransform = await firstElement.getAttribute("transform");
  expect(exportedTransform).toMatch(/^translate\(/u);

  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export Settings", exact: true })
    .click();
  const download = await downloadPromise;
  const downloadPath = await download.path();

  if (!downloadPath) {
    throw new Error("Export Settings did not produce a readable JSON file.");
  }

  const payload = JSON.parse(
    await readFile(downloadPath, "utf8"),
  ) as {
    values?: Record<string, unknown>;
  };
  expect(payload.values?.["composition.layout"]).toEqual(expect.any(String));

  await page.getByRole("button", { name: "Shuffle", exact: true }).click();
  await expect
    .poll(() => firstElement.getAttribute("transform"))
    .not.toBe(exportedTransform);

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Import Settings", exact: true })
    .click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(downloadPath);

  await expect
    .poll(() => firstElement.getAttribute("transform"))
    .toBe(exportedTransform);

  await page.reload();
  await expect(firstElement).toBeVisible();
  await expect
    .poll(() => firstElement.getAttribute("transform"))
    .toBe(exportedTransform);
});

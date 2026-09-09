import { expect, test } from "./toolcraft-product-test";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

const outputSelector = '[data-toolcraft-product-output="micrographics"]';

test("browser: runtime setup is the sole canvas format owner", async ({ page }) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);

  await expect(
    page.getByRole("button", { name: "Collapse Format section", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Aspect ratio", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Canvas width", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Canvas height", { exact: true }).first()).toBeVisible();

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("canvas.size.width", async (field) => {
      const input = field.getByRole("textbox").first();
      await input.fill("960");
      await input.press("Enter");
    }),
    {
      message: "Runtime Setup should remain the sole working canvas-size owner.",
      requirementId: "canvas-sizing-owner",
      selector: outputSelector,
    },
  );
  await expect(page.locator(outputSelector)).toHaveAttribute(
    "viewBox",
    "0 0 960 1350",
  );
  const exportFormat = await getToolcraftControlFieldByTarget(
    page,
    "export.image.format",
  );
  await exportFormat.scrollIntoViewIfNeeded();
  await expect(exportFormat.getByRole("combobox")).toBeVisible();
});

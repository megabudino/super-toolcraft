import { expect, test } from "./toolcraft-product-test";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { dragMicrographicsSliderTargetToValue } from "./micrographics-browser-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

const outputSelector =
  '[data-toolcraft-product-output="micrographics"]';
const defaultTemplateIds = [
  "big-number",
  "footer-line",
  "data-table",
  "spec-sheet",
  "contour",
  "barcode",
  "brand-lockup",
  "globe",
] as const;

test("browser: reset restores complete default state", async ({ page }) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const poster = page.locator(outputSelector);
  const seed = await getToolcraftControlFieldByTarget(
    page,
    "composition.seed",
  );
  const count = await getToolcraftControlFieldByTarget(
    page,
    "composition.count",
  );
  const scale = await getToolcraftControlFieldByTarget(
    page,
    "elements.scale",
  );
  const sourcePreset = await getToolcraftControlFieldByTarget(
    page,
    "source.preset",
  );

  await expect(seed.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "447",
  );
  await expect(count.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "3",
  );
  await expect(scale.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "71",
  );
  await expect(
    sourcePreset.getByRole("button", { name: "Fitness", exact: true }),
  ).toHaveAttribute("data-selected", "true");
  await expect(poster.locator("[data-element-index]")).toHaveCount(8);
  expect(
    await poster.locator("[data-element-index]").evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-template-id")),
    ),
  ).toEqual(defaultTemplateIds);
  await expect(
    poster.locator("[data-micrographics-cover-preset]"),
  ).toHaveAttribute("href", "/covers/fitness-explore.jpg");

  const templateLibrary = await getToolcraftControlFieldByTarget(
    page,
    "library.template",
  );
  await templateLibrary
    .getByRole("button", { name: "Simple", exact: true })
    .click();
  await templateLibrary
    .getByRole("button", { name: "Radar template", exact: true })
    .click();
  const posterBox = await poster.boundingBox();
  if (!posterBox) {
    throw new Error("Could not measure the poster.");
  }
  await page.mouse.click(
    posterBox.x + posterBox.width * 0.24,
    posterBox.y + posterBox.height * 0.24,
  );
  await expect(poster.locator("[data-element-index]")).toHaveCount(9);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("composition.layout", async (field) => {
      await field
        .getByRole("button", { name: "Reset layout", exact: true })
        .click();
    }),
    { requirementId: "composition-commands", selector: outputSelector },
  );
  await expect(poster.locator("[data-element-index]")).toHaveCount(8);

  await dragMicrographicsSliderTargetToValue(page, "composition.seed", 604);
  await dragMicrographicsSliderTargetToValue(page, "composition.count", 12);
  await dragMicrographicsSliderTargetToValue(page, "elements.scale", 132);
  await sourcePreset
    .getByRole("button", { name: "Runner", exact: true })
    .click();
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("composition.layout", async (field) => {
      await field.getByRole("button", { name: "Shuffle", exact: true }).click();
    }),
    { requirementId: "composition-commands", selector: outputSelector },
  );
  await expect(poster.locator("[data-element-index]")).toHaveCount(12);
  await templateLibrary
    .getByRole("button", { name: "Radar template", exact: true })
    .click();
  await page.mouse.click(
    posterBox.x + posterBox.width * 0.24,
    posterBox.y + posterBox.height * 0.24,
  );
  await expect(poster.locator("[data-element-index]")).toHaveCount(13);

  const sourceImage = await getToolcraftControlFieldByTarget(
    page,
    "source.image",
  );
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="red"/></svg>';
  await sourceImage.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from(svg),
    mimeType: "image/svg+xml",
    name: "reset-source.svg",
  });
  const uploadedImage = poster.locator('image[href^="data:image/svg+xml"]');
  await expect(uploadedImage).toBeVisible();

  await page
    .getByRole("button", { name: "Reset controls", exact: true })
    .click();

  await expect(seed.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "447",
  );
  await expect(count.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "3",
  );
  await expect(scale.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "71",
  );
  await expect(
    sourcePreset.getByRole("button", { name: "Fitness", exact: true }),
  ).toHaveAttribute("data-selected", "true");
  await expect(poster.locator("[data-element-index]")).toHaveCount(8);
  expect(
    await poster.locator("[data-element-index]").evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-template-id")),
    ),
  ).toEqual(defaultTemplateIds);
  await expect(
    poster.locator("[data-micrographics-cover-preset]"),
  ).toHaveAttribute("href", "/covers/fitness-explore.jpg");
  await expect(uploadedImage).toHaveCount(0);
});

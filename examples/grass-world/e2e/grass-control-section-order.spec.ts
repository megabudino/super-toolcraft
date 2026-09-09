import { expect, test } from "./toolcraft-product-test";

const expectedVisibleSectionOrder = [
  "Preview Quality",
  "Scene Setup",
  "Scene Environment",
  "Scene Lighting",
  "Light Balance",
  "Sun Patches",
  "Color Grade",
  "Field",
  "Terrain",
  "Surface",
  "Surface Fade",
  "Ground Shadow",
  "Lawn Cover",
  "Lawn Distribution",
  "Lawn Blade",
  "Lawn Appearance",
  "Cover gradient",
  "Lawn Instance Colors",
  "Tall Grass",
  "Tall Grass Distribution",
  "Tall Grass Placement",
  "Tall Grass Blade",
  "Tall Grass Appearance",
  "Blade gradient",
  "Tall Grass Instance Colors",
  "Tufted Grass",
  "Wild Grass",
  "White Flowers",
  "Yellow Flowers",
  "Small Rocks",
  "Tundra Boulder",
  "Butterflies",
  "Wind Mode",
  "Background",
  "Image Export",
] as const;

test("control sections follow the scene authoring workflow", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toBeVisible({
    timeout: 30_000,
  });
  const sectionTitles = await page
    .locator('[data-slot="control-section-header"] [data-slot="panel-title"]')
    .allTextContents();

  expect(sectionTitles.map((title) => title.trim())).toEqual(
    expectedVisibleSectionOrder,
  );
});

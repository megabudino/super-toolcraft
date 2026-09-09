import { heroGalleryTargets } from "../src/app/hero-gallery-values";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  expectNoForbiddenCanvasUi,
  getCanvasHandle,
} from "./canvas-handle-helpers";
import {
  heroFrameSelector,
  waitForWebsitePreview,
} from "./hero-preview-browser-helpers";
import { expect, test } from "./toolcraft-product-test";

test("browser: Hero Scene Lab opens the fixed-lens Sphere gallery", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForWebsitePreview(page);

  await expect(
    page.locator('[data-slot="toolcraft-runtime-app"]'),
  ).toBeVisible();
  await expect(
    page.getByRole("application", { name: "Canvas viewport" }),
  ).toBeVisible();
  await expect(
    page.locator('iframe[title="Recraft hero website preview"]'),
  ).toBeVisible();
  const preview = page.frameLocator(heroFrameSelector);
  const gallery = preview.locator(
    '[data-hero-gallery="sphere"][data-hero-gallery-ready="true"]',
  );

  await expect(gallery).toHaveCount(1);
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "1");
  await expect(gallery.locator("[data-hero-gallery-canvas]")).toHaveCount(1);
  await expect(getCanvasHandle(page, "hero-gallery-pan-handle")).toBeVisible();
  await expectNoForbiddenCanvasUi(page);

  const typeControl = await getToolcraftControlFieldByTarget(
    page,
    "gallery.type",
  );
  await typeControl.getByRole("button", { name: "Rows" }).click();
  await expect(preview.locator('[data-hero-gallery="rows"]')).toHaveCount(1);
  await expect(getCanvasHandle(page, "hero-gallery-pan-handle")).toHaveCount(0);
});

test("browser: Hero Scene Lab exposes gallery, lens and placement workflows", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByText("Gallery Images", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText("Gallery", { exact: true })).toBeVisible();
  await expect(page.getByText("Row Images", { exact: true })).toBeVisible();
  const sectionTitles = await page
    .locator('[data-slot="control-section-header"] [data-slot="panel-title"]')
    .allTextContents();
  expect(sectionTitles.indexOf("Row Images")).toBe(
    sectionTitles.indexOf("Gallery") + 1,
  );

  await expect(page.getByText("Lens", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Gallery Placement", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Edge Zone", { exact: true })).toBeVisible();
  await expect(page.getByText("Edge Warp", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Dispersion & Aura", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Boundary Aura", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Play playback|Pause playback/ }),
  ).toHaveCount(0);
  await expect(page.getByText("Layers", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Import Settings" }),
  ).toBeVisible();

  const typeControl = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.type,
  );
  await typeControl.getByRole("button", { name: "Rows" }).click();
  const legacyImages = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.images,
  );
  await expect(
    legacyImages.locator("xpath=ancestor::section").getByText("Gallery", {
      exact: true,
    }),
  ).toBeVisible();
});

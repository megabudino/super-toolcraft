import type { Locator } from "@playwright/test";

import { heroGalleryTargets } from "../src/app/hero-gallery-values";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  heroPreviewSelector,
  waitForWebsitePreview,
} from "./hero-preview-browser-helpers";
import {
  inspectHeroGallerySnapshotHorizontalBands,
  requestHeroGallerySnapshot,
} from "./hero-gallery-snapshot-helpers";
import { expect, test } from "./toolcraft-product-test";

async function enterSliderValue(control: Locator, value: string) {
  await control.getByRole("button", { name: /Edit .* value/ }).click();
  const input = control.getByRole("textbox");
  await input.fill(value);
  await input.press("Enter");
}

test.setTimeout(60_000);

test("browser: camera-plane clipping keeps the hero gallery edges populated", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForWebsitePreview(page);

  const perspective = await getToolcraftControlFieldByTarget(
    page,
    "scene.perspective",
  );
  const depth = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.sphereDepth,
  );
  await enterSliderValue(perspective, "1400");
  await enterSliderValue(depth, "1120");
  await expect(page.locator(heroPreviewSelector)).toHaveAttribute(
    "data-hero-gallery-renderer",
    "webgl",
  );

  const snapshot = await requestHeroGallerySnapshot(page);
  const inspection = await inspectHeroGallerySnapshotHorizontalBands(page, snapshot);
  const bounds = inspection.nonBackgroundBounds;
  const edgeFadeTolerance = 0.2;

  expect(bounds).not.toBeNull();
  expect(bounds?.x ?? 1).toBeLessThanOrEqual(0.05);
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeGreaterThanOrEqual(0.95);
  expect(inspection.centerOpaqueRatio).toBeGreaterThan(0.2);
  expect(inspection.leftOpaqueRatio).toBeGreaterThan(0.05);
  expect(inspection.rightOpaqueRatio).toBeGreaterThan(0.05);
  expect(Math.min(inspection.leftOpaqueRatio, inspection.rightOpaqueRatio)).toBeGreaterThanOrEqual(
    inspection.centerOpaqueRatio - edgeFadeTolerance,
  );
});

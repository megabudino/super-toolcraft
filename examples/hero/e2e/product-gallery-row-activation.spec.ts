import { Buffer } from "node:buffer";

import { heroGalleryTargets } from "../src/app/hero-gallery-values";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftMediaLifecycle } from "./browser-state-evidence-helpers";
import {
  captureHeroGalleryPixelSample,
  expectHeroGalleryRowsRemainStable,
  heroGalleryRegionMeanDelta,
  heroGalleryRegionOpaqueRatio,
  rowFiveCalibratedRegion,
} from "./hero-gallery-row-activation-helpers";
import { waitForWebsitePreview } from "./hero-preview-browser-helpers";
import { expect, test } from "./toolcraft-product-test";

const rowFivePngFixture = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAJ1BMVEUAAAD///8aGhpERETc3Nzv7++7u7ufn5+AgIBgYGAwMDCQkJBwcHDh4iCjAAAACXBIWXMAAAsTAAALEwEAmpwYAAAADnRFWHRTb2Z0d2FyZQBGaWdtYZ6xlmMAAAEDSURBVHja7VXLEoQgDLOUIg///3t3HRi3oDsSnPFETh5o2iZtXZaJiYk7sLNE4hKPhcdvdIENA/FBSMFGOD812LB4Y+kZg6czoC5KAbUOiII5ZK1bAbxYj5SsCBzaQdo/dRemmyC/518xoBFGJdR+pO4lyO+1nkXUtwiiIthGCP5p4EdccIqA35uDbL6YQQ0P5VK9CwY4B3SxjX70FqFjGB7GV9tzQDb4GFVYB/TT4dEUAIt0CelhSNUdbRh6nNSzTyxwCbUE7GEzawn45EnEfkl80tRBEuwHwDUMdzdB2tdGoBLiOV2rY+g5BJqg/dNb0y9BbpiRabJXirmBgZ6YmHgdH9tYBkv+9ZJmAAAAAElFTkSuQmCC",
  "base64",
);
const fixtureName = "row-five-activation-fixture.png";
const outputSelector =
  '[data-toolcraft-product-output="hero-external-preview"]';
const rowActivationPreviewTimeoutMs = 30_000;

test.setTimeout(120_000);

test("browser: Row 5 upload activates its row and preserves retained images across remove reload and add", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForWebsitePreview(page, rowActivationPreviewTimeoutMs);

  const output = page.locator(outputSelector);
  const rowsOwner = page.locator(
    `[data-slot="toolcraft-runtime-app"] [data-toolcraft-control-target="${heroGalleryTargets.sphereRows}"]`,
  );
  const rowRecords = rowsOwner.locator(
    '[data-slot="collection-actions-control"] [data-slot="collection-item-group"]',
  );
  const addRow = rowsOwner.getByRole("button", { name: "Add Row" });
  const removeRow = rowsOwner.getByRole("button", { name: "Remove Row" });

  await expect(rowsOwner).toHaveCount(1);
  await addRow.click();
  await addRow.click();
  await expect(output).toHaveAttribute("data-hero-gallery-rows", "3");
  await expect(rowRecords).toHaveCount(3);

  const session = await createToolcraftBrowserProofSession(page);
  await waitForWebsitePreview(page, rowActivationPreviewTimeoutMs);
  await expect(output).toHaveAttribute("data-hero-gallery-rows", "3");
  await expect(rowRecords).toHaveCount(3);

  const rowFiveOwner = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.rowImages4,
  );
  const expectedMediaId = "media-1";
  const lifecycle = session.observe((root) => {
    const currentOutput = root.querySelector<HTMLElement>(
      '[data-toolcraft-product-output="hero-external-preview"]',
    );
    const order = currentOutput?.getAttribute("data-hero-gallery-order") ?? "";
    const rows = currentOutput?.getAttribute("data-hero-gallery-rows") ?? "0";
    return {
      itemIds: order ? order.split(",") : [],
      outputSignature: `${rows}:${order}`,
    };
  });

  await expectToolcraftMediaLifecycle(
    lifecycle,
    session.controlAction(heroGalleryTargets.rowImages4, async (control) => {
      await control.locator('input[type="file"]').setInputFiles({
        buffer: rowFivePngFixture,
        mimeType: "image/png",
        name: fixtureName,
      });
    }),
    {
      itemIds: [expectedMediaId],
      outputSignature: `5:${expectedMediaId}`,
    },
    {
      requirementId: "sphere.rowImages.4.activation",
      stabilityIntervalMs: 75,
      stabilitySamples: 3,
      timeoutMs: 20_000,
    },
  );

  await expect(output).toHaveAttribute("data-hero-gallery-rows", "5");
  await expect(output).toHaveAttribute(
    "data-hero-gallery-order",
    expectedMediaId,
  );
  await expect(rowRecords).toHaveCount(5);
  await waitForWebsitePreview(page, rowActivationPreviewTimeoutMs);
  await expect(
    rowFiveOwner.getByRole("button", { name: `Remove ${fixtureName}` }),
  ).toBeVisible();

  const panControl = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.pan,
  );
  const panPad = panControl.getByRole("button", { name: "Pan X/Y pad" });
  const panBounds = await panPad.boundingBox();
  if (!panBounds) throw new Error("The gallery Pan pad must be measurable.");
  await panPad.click({
    position: { x: panBounds.width * 0.5, y: panBounds.height * 0.1 },
  });
  await expect(output).toHaveAttribute(
    "data-hero-gallery-pan",
    /^0(?:\.0+)?:-0\.8(?:0+)?:/,
  );

  let activePixels = await captureHeroGalleryPixelSample(page);
  await expect(async () => {
    activePixels = await captureHeroGalleryPixelSample(page);
    expect(
      heroGalleryRegionOpaqueRatio(activePixels, rowFiveCalibratedRegion),
    ).toBeGreaterThan(0.8);
  }).toPass({ intervals: [100, 200, 400, 800], timeout: 10_000 });
  const activeRowFiveOpacity = heroGalleryRegionOpaqueRatio(
    activePixels,
    rowFiveCalibratedRegion,
  );

  await removeRow.click();
  await expect(output).toHaveAttribute("data-hero-gallery-rows", "4");
  await expect(rowRecords).toHaveCount(4);
  await expect(output).not.toHaveAttribute(
    "data-hero-gallery-order",
    new RegExp(`(?:^|,)${expectedMediaId}(?:,|$)`),
  );
  await expect(
    rowFiveOwner.getByRole("button", { name: `Remove ${fixtureName}` }),
  ).toBeVisible();
  await expectHeroGalleryRowsRemainStable(page, 4);

  const removedPixels = await captureHeroGalleryPixelSample(page);
  const removedRowFiveDelta = heroGalleryRegionMeanDelta(
    activePixels,
    removedPixels,
    rowFiveCalibratedRegion,
  );
  expect(activeRowFiveOpacity).toBeGreaterThan(0.8);
  expect(removedRowFiveDelta).toBeGreaterThan(60);

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForWebsitePreview(page, rowActivationPreviewTimeoutMs);
  await expect(output).toHaveAttribute("data-hero-gallery-rows", "4");
  await expect(rowRecords).toHaveCount(4);
  await expect(output).not.toHaveAttribute(
    "data-hero-gallery-order",
    new RegExp(`(?:^|,)${expectedMediaId}(?:,|$)`),
  );
  await expect(
    rowFiveOwner.getByRole("button", { name: `Remove ${fixtureName}` }),
  ).toBeVisible();
  await expectHeroGalleryRowsRemainStable(page, 4);

  const reloadedPixels = await captureHeroGalleryPixelSample(page);
  expect(
    heroGalleryRegionMeanDelta(
      activePixels,
      reloadedPixels,
      rowFiveCalibratedRegion,
    ),
  ).toBeGreaterThan(60);

  await addRow.click();
  await expect(output).toHaveAttribute("data-hero-gallery-rows", "5");
  await expect(rowRecords).toHaveCount(5);
  await expect(output).toHaveAttribute(
    "data-hero-gallery-order",
    expectedMediaId,
    { timeout: 30_000 },
  );
  await waitForWebsitePreview(page, rowActivationPreviewTimeoutMs);

  let restoredPixels = await captureHeroGalleryPixelSample(page);
  await expect(async () => {
    restoredPixels = await captureHeroGalleryPixelSample(page);
    expect(
      heroGalleryRegionOpaqueRatio(restoredPixels, rowFiveCalibratedRegion),
    ).toBeGreaterThan(0.8);
  }).toPass({ intervals: [100, 200, 400, 800], timeout: 10_000 });
  const restoredRowFiveOpacity = heroGalleryRegionOpaqueRatio(
    restoredPixels,
    rowFiveCalibratedRegion,
  );
  const restoredRowFiveDelta = heroGalleryRegionMeanDelta(
    activePixels,
    restoredPixels,
    rowFiveCalibratedRegion,
  );
  expect(restoredRowFiveOpacity).toBeGreaterThan(activeRowFiveOpacity * 0.8);
  expect(restoredRowFiveDelta).toBeLessThan(2);
  expect(restoredRowFiveDelta).toBeLessThan(removedRowFiveDelta * 0.03);
});

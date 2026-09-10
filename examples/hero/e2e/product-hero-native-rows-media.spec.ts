import { test as browserTest } from "@playwright/test";
import { expectToolcraftMediaLifecycle } from "./browser-state-evidence-helpers";
import { getToolcraftProductObservableSnapshot } from "./product-observable-helpers";
import { heroField, heroOutput, heroStyleTitle } from "./hero-native-style-fixture";
import { clearHeroMedia, heroMediaIds, heroMediaItems, heroRowsMediaSettings, importHeroFixtureSettings, prepareHeroRowsMedia, reorderHeroMedia, selectHeroMedia } from "./hero-native-media-fixture";
import { heroLandscapeFixture, heroPortraitFixture, landscapeColors, portraitColors } from "./hero-media-fixtures";
import { expectHeroInnerCard } from "./hero-rows-media-pixels";
import { expect, test } from "./toolcraft-product-test";

const target = "gallery.images";
const gallery = `${heroOutput} [data-hero-gallery="rows"]`;

async function unobscuredOutput(page: Parameters<typeof getToolcraftProductObservableSnapshot>[0]) {
  // Compare the whole native gallery scene with the same public panel state.
  // Exclude the separate website header: its collapsed Controls button has
  // subpixel text rasterization changes unrelated to the removed gallery media.
  await page.getByRole("button", { name: "Collapse controls", exact: true }).click();
  try { return await getToolcraftProductObservableSnapshot(page, { selector: `${heroOutput} [data-hero-scene]` }); }
  finally { await page.getByRole("button", { name: "Expand controls", exact: true }).click(); }
}

test(heroStyleTitle(target), async ({ page }) => {
  const session = await prepareHeroRowsMedia(page);
  const field = heroField(page, target);
  const initialIds = await heroMediaIds(page, target);
  expect(initialIds).toEqual(Array.from({ length: 24 }, (_, index) => `hero-default-gallery-${index}`));
  await expect(page.locator(`${gallery} [data-hero-card-index]`)).toHaveCount(16);

  // Native media signature plus actual disappearing card output prove clearing
  // attached defaults. No source is replaced through browser state/internals.
  await expectToolcraftMediaLifecycle(session.observe(root => {
    const field = root.querySelector('[data-toolcraft-control-target="gallery.images"]')!;
    const gallery = root.querySelector('[data-hero-gallery="rows"]')!;
    return {
      itemIds: Array.from(field.querySelectorAll("[data-file-upload-preview-key]"), item => item.getAttribute("data-file-upload-preview-key")!),
      outputSignature: gallery.getAttribute("data-hero-gallery-order") || "empty-rows",
    };
  }), session.targetAction(target, async () => {
    await clearHeroMedia(page, target);
    await expect(page.locator(`${gallery} [data-hero-card-index]`)).toHaveCount(0);
    await expect(page.locator(`${gallery} canvas`)).toHaveCount(0);
  }), { itemIds: [], outputSignature: "empty-rows" }, { requirementId: target, stabilitySamples: 2, stabilityIntervalMs: 50 });
  const emptyPixels = await unobscuredOutput(page);

  await field.locator('input[type="file"]').setInputFiles([heroPortraitFixture, heroLandscapeFixture]);
  await expect(heroMediaItems(page, target)).toHaveCount(2);
  const uploadedIds = await heroMediaIds(page, target);
  expect(new Set(uploadedIds).size).toBe(2);
  expect(uploadedIds.some(id => initialIds.includes(id))).toBe(false);
  const order = () => page.locator(gallery).getAttribute("data-hero-gallery-order");
  const expectedOrder = (left: string, right: string) => [...Array(8).fill(left), ...Array(8).fill(right)].join(",");
  await expect.poll(order).toBe(expectedOrder(uploadedIds[0], uploadedIds[1]));
  await expectHeroInnerCard(page, "left", 0.75, portraitColors);
  await expectHeroInnerCard(page, "right", 4 / 3, landscapeColors);

  await selectHeroMedia(page, target, heroPortraitFixture.name);
  await field.getByRole("button", { name: "90° Right", exact: true }).click();
  await expectHeroInnerCard(page, "left", 4 / 3, [portraitColors[2], portraitColors[0], portraitColors[3], portraitColors[1]]);
  await expectHeroInnerCard(page, "right", 4 / 3, landscapeColors);
  await selectHeroMedia(page, target, heroPortraitFixture.name);
  await field.getByRole("button", { name: "Flip horizontal", exact: true }).click();
  await expectHeroInnerCard(page, "left", 4 / 3, [portraitColors[0], portraitColors[2], portraitColors[1], portraitColors[3]]);
  await selectHeroMedia(page, target, heroPortraitFixture.name);
  await field.getByRole("button", { name: "Flip vertical", exact: true }).click();
  const transformed = [portraitColors[1], portraitColors[3], portraitColors[0], portraitColors[2]];
  await expectHeroInnerCard(page, "left", 4 / 3, transformed);
  await expectHeroInnerCard(page, "right", 4 / 3, landscapeColors);

  await reorderHeroMedia(page, target, heroPortraitFixture.name);
  await expect.poll(() => heroMediaIds(page, target)).toEqual([uploadedIds[1], uploadedIds[0]]);
  await expect.poll(order).toBe(expectedOrder(uploadedIds[1], uploadedIds[0]));
  await expectHeroInnerCard(page, "left", 4 / 3, landscapeColors);
  await expectHeroInnerCard(page, "right", 4 / 3, transformed);

  await field.getByRole("button", { name: `Remove ${heroPortraitFixture.name}`, exact: true }).click();
  await expect.poll(order).toBe(expectedOrder(uploadedIds[1], uploadedIds[1]));
  await expectHeroInnerCard(page, "left", 4 / 3, landscapeColors);
  await expectHeroInnerCard(page, "right", 4 / 3, landscapeColors);
  await clearHeroMedia(page, target);
  await expect(page.locator(`${gallery} canvas`)).toHaveCount(0);
  expect(await unobscuredOutput(page)).toBe(emptyPixels);

  await page.getByRole("button", { name: "Reset Gallery section", exact: true }).click();
  await expect(heroField(page, "gallery.type").getByRole("button", { name: "Sphere", exact: true })).toHaveAttribute("aria-pressed", "true");
  // Gallery reset also restores its mode and geometry. Reapply only the public
  // view fixture to inspect the restored Rows source, without importing media.
  await importHeroFixtureSettings(page, heroRowsMediaSettings);
  await expect.poll(() => heroMediaIds(page, target)).toEqual(initialIds);
  const defaultOrder = [...Array.from({ length: 8 }, (_, index) => `hero-default-gallery-${14 - index * 2}`),
    ...Array.from({ length: 8 }, (_, index) => `hero-default-gallery-${15 - index * 2}`)].join(",");
  await expect.poll(order).toBe(defaultOrder);
  await expect(page.locator(`${gallery} [data-hero-card-index]`)).toHaveCount(16);
  await expect.poll(() => page.locator(`${gallery} [data-hero-card-index="7"] [data-dispersion-ready="true"]`).count()).toBe(2);
  expect(await unobscuredOutput(page)).not.toBe(emptyPixels);
});
// Use the installed full Chromium native GPU; keep render quality and budgets.
browserTest.use({ channel: "chromium" });

import { test as browserTest } from "@playwright/test";
import { expectToolcraftMediaLifecycle } from "./browser-state-evidence-helpers";
import { heroField, heroStyleTitle } from "./hero-native-style-fixture";
import { clearHeroMedia, heroMediaIds, heroMediaItems, reorderHeroMedia, selectHeroMedia } from "./hero-native-media-fixture";
import { heroLandscapeFixture, heroPortraitFixture, landscapeColors, portraitColors } from "./hero-media-fixtures";
import { expectSphereMediaOrder, prepareHeroSphereMedia, sphereMediaIds, sphereMediaTargets } from "./hero-sphere-media-fixture";
import { captureSphereMediaPixels, type SphereCardPixels } from "./hero-sphere-media-pixels";
import { expect, test } from "./toolcraft-product-test";

for (const [rowIndex, target] of sphereMediaTargets.entries()) {
  test(heroStyleTitle(target), async ({ page }) => {
    const session = await prepareHeroSphereMedia(page, rowIndex);
    const field = heroField(page, target);
    const original = await sphereMediaIds(page);
    expect(original[rowIndex]).toEqual(Array.from({ length: 6 }, (_, index) => `hero-default-row-${rowIndex * 6 + index}`));
    await expectSphereMediaOrder(page, original);
    const initialPixels = await captureSphereMediaPixels(page);
    const unchangedSiblings = (ids: string[][]) => ids.filter((_, index) => index !== rowIndex);
    const withoutTarget = original.map((ids, index) => index === rowIndex ? [] : ids);
    let emptyPixels: Awaited<ReturnType<typeof captureSphereMediaPixels>> | undefined;

    await expectToolcraftMediaLifecycle(session.observe(root => {
      const fields = root.querySelectorAll('[data-toolcraft-control-target^="sphere.rowImages."]');
      return {
        itemIds: Array.from(fields).flatMap(field => Array.from(field.querySelectorAll("[data-file-upload-preview-key]"), item => item.getAttribute("data-file-upload-preview-key")!)),
        outputSignature: root.querySelector('[data-hero-gallery="sphere"]')!.getAttribute("data-hero-gallery-order") || "empty-sphere",
      };
    }), session.targetAction(target, async () => {
      await clearHeroMedia(page, target);
      await expectSphereMediaOrder(page, withoutTarget);
      emptyPixels = await captureSphereMediaPixels(page, [], true);
      expect(emptyPixels.center).not.toBe(initialPixels.center);
      expect(emptyPixels.sibling).toBe(initialPixels.sibling);
    }), { itemIds: withoutTarget.flat(), outputSignature: withoutTarget.flat().join(",") }, { requirementId: target, stabilitySamples: 2, stabilityIntervalMs: 50 });

    await field.locator('input[type="file"]').setInputFiles([heroPortraitFixture, heroLandscapeFixture]);
    await expect(heroMediaItems(page, target)).toHaveCount(2);
    const uploaded = await heroMediaIds(page, target);
    expect(new Set(uploaded).size).toBe(2);
    expect(uploaded.some(id => original.flat().includes(id))).toBe(false);
    const assertCards = async (ids: string[], cards: readonly SphereCardPixels[]) => {
      const allIds = await sphereMediaIds(page);
      expect(allIds[rowIndex]).toEqual(ids);
      expect(unchangedSiblings(allIds)).toEqual(unchangedSiblings(original));
      await expectSphereMediaOrder(page, allIds);
      const pixels = await captureSphereMediaPixels(page, cards);
      expect(pixels.center).not.toBe(emptyPixels!.center);
      expect(pixels.sibling).toBe(initialPixels.sibling);
    };
    const landscape = { aspect: 4 / 3, colors: landscapeColors };
    await assertCards(uploaded, [{ aspect: 0.75, colors: portraitColors }, landscape]);

    await selectHeroMedia(page, target, heroPortraitFixture.name);
    await field.getByRole("button", { name: "90° Right", exact: true }).click();
    await assertCards(uploaded, [{ aspect: 4 / 3, colors: [portraitColors[2], portraitColors[0], portraitColors[3], portraitColors[1]] }, landscape]);
    // Collapsing the real panel for unobscured pixel proof unmounts its local
    // thumbnail selection. Select again before each scoped transform action.
    await selectHeroMedia(page, target, heroPortraitFixture.name);
    await field.getByRole("button", { name: "Flip horizontal", exact: true }).click();
    await assertCards(uploaded, [{ aspect: 4 / 3, colors: [portraitColors[0], portraitColors[2], portraitColors[1], portraitColors[3]] }, landscape]);
    await selectHeroMedia(page, target, heroPortraitFixture.name);
    await field.getByRole("button", { name: "Flip vertical", exact: true }).click();
    const transformed = { aspect: 4 / 3, colors: [portraitColors[1], portraitColors[3], portraitColors[0], portraitColors[2]] };
    await assertCards(uploaded, [transformed, landscape]);

    await reorderHeroMedia(page, target, heroPortraitFixture.name);
    await expect.poll(() => heroMediaIds(page, target)).toEqual([uploaded[1], uploaded[0]]);
    await assertCards([uploaded[1], uploaded[0]], [landscape, transformed]);
    const landscapeImage = field.getByRole("img", { name: heroLandscapeFixture.name, exact: true });
    const landscapeSource = await landscapeImage.getAttribute("src");
    expect(landscapeSource).toBeTruthy();
    await field.getByRole("button", { name: `Remove ${heroPortraitFixture.name}`, exact: true }).click();
    // FileDropSinglePreview has no sortable item key. Check its real filename
    // and count, while the native gallery order retains exact source identity.
    await expect(field.getByRole("button", { name: /^Remove / })).toHaveCount(1);
    await expect(field.getByRole("button", { name: `Replace ${heroLandscapeFixture.name}`, exact: true })).toBeVisible();
    await expect(field.getByRole("button", { name: `Remove ${heroLandscapeFixture.name}`, exact: true })).toBeVisible();
    await expect(landscapeImage).toBeVisible();
    await expect(landscapeImage).toHaveAttribute("src", landscapeSource!);
    await expect.poll(() => landscapeImage.evaluate(image => ({ width: (image as HTMLImageElement).naturalWidth, height: (image as HTMLImageElement).naturalHeight }))).toEqual({ width: 96, height: 72 });
    const remaining = original.map((ids, index) => index === rowIndex ? [uploaded[1]] : ids);
    await expectSphereMediaOrder(page, remaining);
    expect(unchangedSiblings(await sphereMediaIds(page))).toEqual(unchangedSiblings(original));
    expect((await captureSphereMediaPixels(page, [landscape])).sibling).toBe(initialPixels.sibling);
    await clearHeroMedia(page, target);
    await expectSphereMediaOrder(page, withoutTarget);
    expect(await sphereMediaIds(page)).toEqual(withoutTarget);
    expect(await captureSphereMediaPixels(page, [], true)).toEqual(emptyPixels);

    await page.getByRole("button", { name: "Reset Row Images section", exact: true }).click();
    await expect.poll(() => sphereMediaIds(page)).toEqual(original);
    await expectSphereMediaOrder(page, original);
    expect(await captureSphereMediaPixels(page)).toEqual(initialPixels);
  });
}
// Use the installed full Chromium native GPU; keep render quality and budgets.
browserTest.use({ channel: "chromium" });

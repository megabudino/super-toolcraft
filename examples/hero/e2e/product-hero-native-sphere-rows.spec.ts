import { test as browserTest } from "@playwright/test";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { clearHeroMedia, heroMediaIds, heroRowsMediaSettings, importHeroFixtureSettings } from "./hero-native-media-fixture";
import { heroField, heroOutput, heroStyleProof, heroStyleTitle, prepareHeroStyle } from "./hero-native-style-fixture";
import { heroPortraitFixture } from "./hero-media-fixtures";
import { expect, test } from "./toolcraft-product-test";

test(heroStyleTitle("sphere.rows"), async ({ page }) => {
  const target = "sphere.rows";
  const session = await prepareHeroStyle(page, heroOutput);
  await importHeroFixtureSettings(page, {
    ...heroRowsMediaSettings, "gallery.type": "sphere", "sphere.rows": [{ offset: 0, speed: 0 }],
    "heading.position": { x: 1, y: 1 }, "heading.shadow.enabled": false,
    "sphere.autoScroll.enabled": false, "effects.crt.enabled": false, "effects.grain.enabled": false,
  });
  const gallery = page.locator(`${heroOutput} [data-hero-gallery="sphere"]`);
  const field = heroField(page, target);
  const groups = field.locator('[data-slot="collection-item-group"]');
  const add = field.getByRole("button", { name: "Add Row", exact: true });
  const remove = field.getByRole("button", { name: "Remove Row", exact: true });
  const observe = session.observe(root => {
    const gallery = root.querySelector('[data-hero-gallery="sphere"]')!;
    return { rows: Number(gallery.getAttribute("data-hero-gallery-rows")), signature: gallery.getAttribute("data-hero-gallery-row-signature") };
  });
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "1");
  await expect(remove).toBeDisabled();
  const retained = await heroMediaIds(page, "sphere.rowImages.1");
  expect(retained).toHaveLength(6);

  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await expectToolcraftCompoundControlPartOutcome(observe, session.targetAction(target, () => add.click()),
      { rows: 2, signature: "0:0|0:3" }, { requirementId: target, part: "collectionActions.add" });
    await expect(groups).toHaveCount(2);
  }), heroStyleProof(target, heroOutput));

  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await expectToolcraftCompoundControlPartOutcome(observe, session.targetAction(target, async () => {
      const row = groups.nth(1);
      for (const [label, value] of [["Offset", "90"], ["Speed", "12"]]) {
        await row.getByRole("button", { name: `Edit ${label} value`, exact: true }).click();
        await row.getByRole("textbox").fill(value);
        await row.getByRole("textbox").press("Enter");
      }
    }), { rows: 2, signature: "0:0|90:12" }, { requirementId: target, part: "collectionActions.items" });
  }), heroStyleProof(target, heroOutput));
  // Normal motion must advance the edited row, not merely publish its setting.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Collapse controls", exact: true }).click();
  const canvas = gallery.locator("[data-hero-gallery-canvas]");
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("The row motion proof requires a visible native canvas");
  // Exclude the independently animated bottom ticker, heading and floating UI.
  // Only the second row moves: the first speed, CRT, grain and auto-scroll are 0/off.
  const clip = { x: bounds.x + bounds.width * 0.18, y: bounds.y + bounds.height * 0.16,
    width: bounds.width * 0.4, height: bounds.height * 0.7 };
  const moving = await page.screenshot({ clip, animations: "allow", scale: "css" });
  await expect.poll(async () => (await page.screenshot({ clip, animations: "allow", scale: "css" })).equals(moving)).toBe(false);
  await page.getByRole("button", { name: "Expand controls", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });

  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await expectToolcraftCompoundControlPartOutcome(observe, session.targetAction(target, () => remove.click()),
      { rows: 1, signature: "0:0" }, { requirementId: target, part: "collectionActions.remove" });
  }), heroStyleProof(target, heroOutput));
  expect(await heroMediaIds(page, "sphere.rowImages.1")).toEqual(retained);
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "1");
  await add.click();
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "2");
  await expect(gallery).toHaveAttribute("data-hero-gallery-order", new RegExp(retained.join(",")));
  await remove.click();
  await clearHeroMedia(page, "sphere.rowImages.1");
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "1");
  const beforeUpload = (await gallery.getAttribute("data-hero-gallery-order"))!.split(",");
  await heroField(page, "sphere.rowImages.1").locator('input[type="file"]').setInputFiles(heroPortraitFixture);
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "2");
  await expect(groups).toHaveCount(2);
  // The single-image presenter exposes its real filename/image, not sortable
  // IDs. Check identity independently against the native renderer's source order.
  const uploadField = heroField(page, "sphere.rowImages.1");
  await expect(uploadField.getByRole("button", { name: `Replace ${heroPortraitFixture.name}`, exact: true })).toBeVisible();
  const portrait = uploadField.getByRole("img", { name: heroPortraitFixture.name, exact: true });
  await expect(portrait).toBeVisible();
  expect(await portrait.evaluate(image => [ (image as HTMLImageElement).naturalWidth, (image as HTMLImageElement).naturalHeight ])).toEqual([72, 96]);
  const finalOrder = (await gallery.getAttribute("data-hero-gallery-order"))!.split(",");
  expect(finalOrder.slice(0, beforeUpload.length)).toEqual(beforeUpload);
  const uploaded = finalOrder.slice(beforeUpload.length);
  expect(uploaded).toHaveLength(1);
  expect(retained).not.toContain(uploaded[0]);
  await expect(gallery).toHaveAttribute("data-hero-gallery-order", new RegExp(uploaded[0]));
  await expect(gallery).toHaveAttribute("data-hero-gallery-ready", "true");
});
// Use the installed full Chromium native GPU; keep render quality and budgets.
browserTest.use({ channel: "chromium" });

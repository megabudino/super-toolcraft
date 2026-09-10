import { test as browserTest } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { dragHeroStyle, heroField, heroOutput, heroStyleProof, heroStyleTitle, prepareHeroStyle } from "./hero-native-style-fixture";
import { heroRowsMediaSettings, importHeroFixtureSettings } from "./hero-native-media-fixture";
import { expect, test } from "./toolcraft-product-test";

async function galleryPixels(page: Page) {
  await page.getByRole("button", { name: "Collapse controls", exact: true }).click();
  try {
    return await page.locator(`${heroOutput} [data-hero-scene]`).screenshot({ animations: "allow", scale: "css" });
  } finally {
    await page.getByRole("button", { name: "Expand controls", exact: true }).click();
  }
}

test(heroStyleTitle("gallery.position.v2"), async ({ page }) => {
  const session = await prepareHeroStyle(page, heroOutput);
  const target = "gallery.position.v2";
  const read = (root: HTMLElement) => {
    const gallery = root.querySelector<HTMLElement>('[data-hero-gallery]')!;
    const heading = root.querySelector('[data-hero-heading-group]')!.getBoundingClientRect();
    const setting = root.querySelector('[data-toolcraft-control-target="gallery.position.v2"] [aria-label="Edit Position value"]')!.textContent!.trim();
    // cqw/cqh belong to the native reference surface, which includes its
    // header; the shorter inner scene is not the CSS query-container owner.
    const scene = gallery.closest<HTMLElement>('[data-recraft-native-section]')!;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(gallery).transform);
    return {
      setting,
      heading: [heading.x, heading.y, heading.width, heading.height].map(value => Math.round(value * 10) / 10),
      shift: gallery.dataset.heroGallery === "rows"
        ? [Math.round(matrix.m41 / scene.clientWidth * 100), Math.round(matrix.m42 / scene.clientHeight * 100)] : null,
    };
  };
  for (const mode of ["sphere", "rows"] as const) {
    await importHeroFixtureSettings(page, { ...heroRowsMediaSettings, "gallery.type": mode });
    await expect(page.locator(`${heroOutput} [data-hero-gallery="${mode}"]`)).toHaveAttribute("data-hero-gallery-ready", "true");
    const initial = await page.locator('[data-slot="toolcraft-runtime-app"]').evaluate(read);
    for (const [part, value, shift] of [
      ["vector.x", "-0.25, 0.00", [-9, 0]],
      ["vector.y", "-0.25, 0.25", [-9, 7]],
    ] as const) {
      const before = await galleryPixels(page);
      await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
        await expectToolcraftCompoundControlPartOutcome(session.observe(read), session.targetAction(target, async () => {
          const field = heroField(page, target);
          await field.getByRole("button", { name: "Edit Position value", exact: true }).click();
          await field.getByRole("textbox").fill(value);
          await field.getByRole("textbox").press("Enter");
        }), { ...initial, setting: value, shift: mode === "rows" ? [...shift] : null }, { requirementId: target, part });
      }), heroStyleProof(target, heroOutput));
      expect((await galleryPixels(page)).equals(before), `${mode} ${part}: actual native gallery pixels`).toBe(false);
    }
  }
});

test(heroStyleTitle("cards.radius"), async ({ page }) => {
  const session = await prepareHeroStyle(page, heroOutput);
  for (const mode of ["sphere", "rows"] as const) {
    await importHeroFixtureSettings(page, { ...heroRowsMediaSettings, "gallery.type": mode });
    const gallery = page.locator(`${heroOutput} [data-hero-gallery="${mode}"]`);
    await expect(gallery).toHaveAttribute("data-hero-gallery-ready", "true");
    const before = await galleryPixels(page);
    try {
      await expectToolcraftProductObservableToChange(session, session.targetAction("cards.radius", async () => {
        await dragHeroStyle(page, "cards.radius", 0.6);
        const radius = Number(await heroField(page, "cards.radius").getByRole("slider").getAttribute("aria-valuenow"));
        expect(radius).toBeGreaterThan(40);
        if (mode === "sphere") await expect(gallery).toHaveAttribute("data-hero-gallery-card-radius", String(radius));
        else await expect.poll(() => gallery.locator("[data-hero-card-radius]").evaluateAll(cards => cards.every(card => Number(card.getAttribute("data-hero-card-radius")) > 40))).toBe(true);
      }), heroStyleProof("cards.radius", heroOutput));
    } finally { await page.mouse.up(); }
    expect((await galleryPixels(page)).equals(before), `${mode}: rounded native card pixels`).toBe(false);
  }
});
// Use the installed full Chromium native GPU; keep render quality and budgets.
browserTest.use({ channel: "chromium" });

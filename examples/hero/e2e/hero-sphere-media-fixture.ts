import type { Page } from "@playwright/test";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { heroMediaIds, heroRowsMediaSettings, importHeroFixtureSettings } from "./hero-native-media-fixture";
import { heroField, heroOutput } from "./hero-native-style-fixture";
import { expect } from "./toolcraft-product-test";

export const heroSphereMediaGallery = `${heroOutput} [data-hero-gallery="sphere"]`;
export const heroSphereMediaCanvas = `${heroSphereMediaGallery} [data-hero-gallery-canvas]`;
export const sphereMediaTargets = Array.from({ length: 6 }, (_, index) => `sphere.rowImages.${index}`);

export async function sphereMediaIds(page: Page) {
  return Promise.all(sphereMediaTargets.map(target => heroMediaIds(page, target)));
}

export async function expectSphereMediaOrder(page: Page, ids: readonly (readonly string[])[]) {
  await expect(page.locator(heroSphereMediaGallery)).toHaveAttribute("data-hero-gallery-order", ids.flat().join(","));
  await expect(page.locator(heroSphereMediaGallery)).toHaveAttribute("data-hero-gallery-ready", "true");
}

export async function prepareHeroSphereMedia(page: Page, rowIndex: number) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  // This public settings fixture keeps six independent sources and the shipped
  // curved lens. Pan centers only the row under test; no source is substituted.
  await importHeroFixtureSettings(page, {
    ...heroRowsMediaSettings,
    // Bottom alignment still leaves the complete text/CTA stack over central
    // Sphere cards. Move that authored stack right and remove its cast shadow.
    "heading.position": { x: 1, y: 1 },
    "heading.shadow.enabled": false,
    "gallery.type": "sphere",
    "sphere.rows": Array.from({ length: 6 }, () => ({ offset: 0, speed: 0 })),
    "sphere.pan": { x: 0, y: -(2 * rowIndex - 5) / 6 },
    "sphere.rowGap": 40,
    "sphere.width": 510, "sphere.height": 520, "sphere.depth": 1270,
    "sphere.bendX": 50, "sphere.bendY": 99, "scene.perspective": 1660,
    "sphere.autoScroll.enabled": false,
  });
  await expect(heroField(page, "gallery.type").getByRole("button", { name: "Sphere", exact: true })).toHaveAttribute("aria-pressed", "true");
  const gallery = page.locator(heroSphereMediaGallery);
  await expect(gallery).toHaveAttribute("data-hero-gallery-renderer", "webgl");
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "6");
  await expect(gallery).toHaveAttribute("data-hero-gallery-row-signature", Array(6).fill("0:0").join("|"));
  await expect(gallery).toHaveAttribute("data-hero-gallery-ready", "true");
  await expect(page.locator(heroSphereMediaCanvas)).toHaveAttribute("data-hero-gallery-revealed", "true");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return session;
}

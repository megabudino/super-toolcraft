import type { Page } from "@playwright/test";
import { createToolcraftBrowserProofSession, type ToolcraftBrowserProofSession } from "./browser-proof-session";
import { heroRowsMediaSettings, importHeroFixtureSettings } from "./hero-native-media-fixture";
import { heroField, heroOutput, heroStyleProof, setHeroToggle } from "./hero-native-style-fixture";
import { decodeCrtScreenshot } from "./hero-native-crt-pixels";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect } from "./toolcraft-product-test";

export const heroCrtGallery = `${heroOutput} [data-hero-gallery="sphere"]`;
export const heroCrtCanvas = `${heroCrtGallery} [data-hero-gallery-canvas]`;

export async function prepareHeroCrt(page: Page, values: Record<string, unknown>) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  await importHeroFixtureSettings(page, {
    ...heroRowsMediaSettings,
    "heading.position": { x: 1, y: 1 }, "heading.shadow.enabled": false,
    "gallery.type": "sphere", "sphere.rows": Array.from({ length: 6 }, () => ({ offset: 0, speed: 0 })),
    "sphere.pan": { x: 0, y: -1 / 6 }, "sphere.rowGap": 40,
    "sphere.width": 510, "sphere.height": 520, "sphere.depth": 1270,
    "sphere.bendX": 50, "sphere.bendY": 99, "scene.perspective": 1660,
    "sphere.autoScroll.enabled": false, "dispersion.velocity": 0,
    "effects.grain.enabled": false, "effects.crt.enabled": false,
    "effects.crt.scanlines": 0, "effects.crt.pitch": 8,
    "effects.crt.chroma": 0, "effects.crt.flicker": 0, "effects.crt.fade": 3,
    ...values,
  });
  const gallery = page.locator(heroCrtGallery), canvas = page.locator(heroCrtCanvas);
  await expect(gallery).toHaveAttribute("data-hero-gallery-renderer", "webgl");
  await expect(gallery).toHaveAttribute("data-hero-gallery-row-signature", Array(6).fill("0:0").join("|"));
  await expect(gallery).toHaveAttribute("data-hero-gallery-ready", "true");
  await expect(canvas).toHaveAttribute("data-dispersion-ready", "true");
  await expect(canvas).toHaveAttribute("data-hero-gallery-revealed", "true");
  await expect(canvas).toHaveCSS("opacity", "1");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(heroField(page, "effects.crt.enabled").getByRole("switch")).toHaveAttribute("aria-checked", "false");
  return session;
}

export async function captureHeroCrt(page: Page) {
  const canvas = page.locator(heroCrtCanvas);
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("CRT proof requires a visible native gallery canvas");
  const width = await canvas.evaluate(element => element.clientWidth);
  // This image-only region stays left of the real controls and the relocated
  // heading, so screenshots are possible while a slider thumb remains held.
  const clip = {
    x: Math.round(bounds.x + bounds.width * 0.18), y: Math.round(bounds.y + bounds.height * 0.16),
    width: Math.floor(bounds.width * 0.40), height: Math.floor(bounds.height * 0.70),
  };
  const png = await page.screenshot({ clip, animations: "allow", scale: "css", type: "png" });
  return decodeCrtScreenshot(page, png, bounds.width / width);
}

export async function pulseHeroCrtPan(page: Page) {
  const canvas = page.locator(heroCrtCanvas), gallery = page.locator(heroCrtGallery);
  const before = await gallery.getAttribute("data-hero-gallery-pan");
  const bounds = await canvas.boundingBox();
  if (!bounds || !before) throw new Error("CRT pan requires the loaded native gallery");
  const x = bounds.x + bounds.width * 0.28, y = bounds.y + bounds.height * 0.50;
  await page.mouse.move(x, y);
  await page.mouse.down();
  try {
    await expect(canvas).toHaveAttribute("data-hero-gallery-drag-state", "dragging");
    await page.mouse.move(x + 90, y, { steps: 12 });
    await expect(gallery).not.toHaveAttribute("data-hero-gallery-pan", before);
    await page.mouse.move(x, y, { steps: 12 });
  } finally { await page.mouse.up(); }
  await expect(gallery).toHaveAttribute("data-hero-gallery-pan", before);
  await expect(canvas).toHaveAttribute("data-hero-gallery-drag-state", "idle");
}

export async function dragHeroCrtMaximum(page: Page, target: string, maximum: number) {
  const field = heroField(page, target), thumb = field.getByRole("slider");
  const track = field.locator('[data-slot="slider"]').first();
  await track.scrollIntoViewIfNeeded();
  const bounds = await track.boundingBox(), start = await thumb.boundingBox();
  if (!bounds || !start) throw new Error(`CRT slider must be reachable: ${target}`);
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width - 1, bounds.y + bounds.height / 2, { steps: 5 });
  await expect(thumb).toHaveAttribute("aria-valuenow", String(maximum));
}

export async function enableHeroCrtControl(page: Page, target: string) {
  await setHeroToggle(page, "effects.crt.enabled", true);
  await heroField(page, target).scrollIntoViewIfNeeded();
}

export async function expectHeroCrtChange(page: Page, session: ToolcraftBrowserProofSession, target: string, action: () => Promise<void>) {
  const collapse = () => page.getByRole("button", { name: "Collapse controls", exact: true }).click();
  const expand = () => page.getByRole("button", { name: "Expand controls", exact: true }).click();
  // The glass panel overlaps the canvas and its corner antialiasing can change
  // independently. Use the real panel toggle for matching unobscured snapshots.
  await collapse();
  try {
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await expand();
      try { await action(); }
      finally {
        // Live cropped metrics run inside action while the slider is held;
        // the protected full-canvas check observes the result after release.
        await page.mouse.up();
        await collapse();
      }
    }), heroStyleProof(target, heroCrtCanvas));
  } finally { await expand(); }
}

export async function captureHeroCrtSequence(page: Page) {
  const frames = [];
  for (let index = 0; index < 7; index += 1) {
    frames.push(await captureHeroCrt(page));
    if (index < 6) await page.waitForTimeout(63);
  }
  return frames;
}

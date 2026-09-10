import type { Page } from "@playwright/test";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { heroField, heroOutput } from "./hero-native-style-fixture";
import { expect } from "./toolcraft-product-test";

export async function importHeroFixtureSettings(page: Page, values: Record<string, unknown>) {
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Settings", exact: true }).click();
  await (await chooser).setFiles({
    name: "hero-focused-fixture.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({
      source: "toolcraft-settings", version: 2, appId: "hero", exportedAt: new Date().toISOString(),
      canvas: { mode: "finite", size: { width: 1280, height: 720, unit: "px" } },
      timeline: { currentTimeSeconds: 0, durationSeconds: 10, expanded: false, isLooping: true, isPlaying: false },
      values,
    })),
  });
}

export const heroRowsMediaSettings = {
  "gallery.type": "rows", "cards.height": 180, "cards.gap": 40,
  "cards.radius": 0, "cards.roll": 0, "cards.safetyWidth": 400,
  "gallery.position.v2": { x: 0, y: 0 }, "heading.position": { x: 0, y: 1 },
  "heading.recraftSize": 64, "heading.stylesSize": 64, "heading.badgeVisible": false,
  "edgeZone.width": 0, "auraGate.glow": 0, "auraGate.refraction": 0,
};

export async function prepareHeroRowsMedia(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  // Normal public settings import prepares one flat view with the heading
  // reduced and placed below the cards, so text cannot cover sampled pixels. It
  // neither replaces source media nor changes render scale/default app files.
  await importHeroFixtureSettings(page, heroRowsMediaSettings);
  await expect(heroField(page, "gallery.type").getByRole("button", { name: "Rows", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(`${heroOutput} [data-hero-gallery]`)).toHaveAttribute("data-hero-gallery-ready", "true");
  await expect(heroField(page, "canvas.size.width").getByRole("textbox")).toHaveValue("1280");
  return session;
}

export const heroMediaItems = (page: Page, target: string) => heroField(page, target).locator("[data-file-upload-preview-key]");
export const heroMediaIds = (page: Page, target: string) => heroMediaItems(page, target).evaluateAll(items =>
  items.map(item => item.getAttribute("data-file-upload-preview-key")!));

export async function clearHeroMedia(page: Page, target: string) {
  const field = heroField(page, target);
  const remove = field.getByRole("button", { name: /^Remove / });
  const count = await remove.count();
  for (let index = 0; index < count; index += 1) {
    if (index === count - 1) {
      // A sole image switches presenters. Missing natural-size metadata used
      // to collapse this frame and make the real pointer Remove inaccessible.
      const preview = field.locator('[data-slot="file-upload-preview-frame"]');
      await expect(preview).toBeVisible();
      const bounds = await preview.boundingBox();
      expect(bounds?.height).toBeGreaterThan(20);
    }
    await remove.first().click();
  }
  await expect(remove).toHaveCount(0);
  await expect(field.locator('[data-slot="file-upload-preview-frame"]')).toHaveCount(0);
  await expect(heroMediaItems(page, target)).toHaveCount(0);
}

export async function reorderHeroMedia(page: Page, target: string, name: string) {
  const field = heroField(page, target);
  const from = field.getByRole("button", { name: `Reorder ${name}`, exact: true });
  const otherName = await field.getByRole("button", { name: /^Reorder / }).evaluateAll((buttons, sourceName) =>
    buttons.map(button => button.getAttribute("aria-label")).find(label => label !== `Reorder ${sourceName}`), name);
  if (!otherName) throw new Error("Reordering requires a second visible image");
  const to = field.getByRole("button", { name: otherName, exact: true });
  await from.scrollIntoViewIfNeeded();
  const first = await from.boundingBox();
  const second = await to.boundingBox();
  if (!first || !second) throw new Error("Image reorder handles must be visible");
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await page.mouse.down();
  try {
    await page.mouse.move(first.x + first.width / 2 + 10, first.y + first.height / 2);
    await page.mouse.move(second.x + second.width / 2, second.y + second.height / 2, { steps: 8 });
  } finally { await page.mouse.up(); }
}

export async function selectHeroMedia(page: Page, target: string, name: string) {
  const button = heroField(page, target).getByRole("button", { name: `Select ${name}`, exact: true });
  await button.scrollIntoViewIfNeeded();
  const point = await button.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const position = { x: bounds.width / 2, y: bounds.height - 6 };
    const hit = document.elementFromPoint(bounds.x + position.x, bounds.y + position.y);
    if (!hit || !element.contains(hit)) throw new Error("The image selection surface is covered");
    return position;
  });
  await button.click({ position: point });
  await expect(button).toHaveAttribute("aria-pressed", "true");
}

import type { Page } from "@playwright/test";
import { expectToolcraftMediaLifecycle } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";
import { cardSelector, clearTrail, prepareTrail, readTrail, setTrailSlider, spawnTrail, trailField, trailProof, trailTitle } from "./fine-details-trail-test-helpers";

const preview = '[data-slot="file-upload-preview-item"]';
const ids = (page: Page) => trailField(page, "images").locator(preview).evaluateAll(items => items.map(item => item.getAttribute("data-file-upload-preview-key")!));
const names = (page: Page) => trailField(page, "images").locator(`${preview} img`).evaluateAll(images => images.map(image => image.getAttribute("alt")));

async function removeAllImages(page: Page) {
  const field = trailField(page, "images");
  const remove = field.getByRole("button", { name: /^Remove / });
  for (let remaining = await remove.count(); remaining > 0; remaining -= 1) {
    if (remaining === 1) {
      const frame = field.locator('[data-slot="file-upload-preview-frame"]');
      const geometry = await frame.boundingBox();
      expect(geometry, "The final image must retain a real, usable single-image presenter").not.toBeNull();
      expect(geometry!.height, "The final image presenter must not collapse around absolute children").toBeGreaterThan(0);
      await expect(frame.locator("img")).toHaveCount(1);
    }
    await remove.last().click();
    await expect(remove).toHaveCount(remaining - 1);
  }
  await expect(field.locator(preview)).toHaveCount(0);
  await expect(field.locator("img")).toHaveCount(0);
  await expect(field.locator('[data-slot="file-upload-preview-frame"]')).toHaveCount(0);
  await expect(remove).toHaveCount(0);
  await expect(page.locator(cardSelector)).toHaveCount(0);
}

async function uploadFixtures(page: Page) {
  // Detached canvases create input PNGs only. They never alter the product DOM,
  // renderer, styles, clocks, media state or existing default assets.
  const files = await page.evaluate(() => [
    { name: "portrait.png", width: 120, height: 240, colors: ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"] },
    { name: "landscape.png", width: 240, height: 120, colors: ["#FF00FF", "#00FFFF", "#FFFFFF", "#000000"] },
    { name: "square.png", width: 180, height: 180, colors: ["#008000", "#000080", "#800000", "#808000"] },
  ].map(fixture => {
    const canvas = document.createElement("canvas");
    canvas.width = fixture.width;
    canvas.height = fixture.height;
    const context = canvas.getContext("2d")!;
    for (let index = 0; index < 4; index += 1) {
      context.fillStyle = fixture.colors[index]!;
      context.fillRect(index % 2 * fixture.width / 2, Math.floor(index / 2) * fixture.height / 2, fixture.width / 2, fixture.height / 2);
    }
    return { name: fixture.name, data: canvas.toDataURL("image/png").split(",")[1]! };
  }));
  await trailField(page, "images").locator('input[type="file"]').setInputFiles(files.map(file => ({
    name: file.name, mimeType: "image/png", buffer: Buffer.from(file.data, "base64"),
  })));
  await expect.poll(() => names(page)).toEqual(["portrait.png", "landscape.png", "square.png"]);
  await expect.poll(() => trailField(page, "images").locator(`${preview} img`).evaluateAll(images =>
    images.length === 3 && images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
}

function sourceName(card: Awaited<ReturnType<typeof readTrail>>[number]) {
  if (card.naturalWidth === 120 && card.naturalHeight === 240) return "portrait.png";
  if (card.naturalWidth === 240 && card.naturalHeight === 120) return "landscape.png";
  if (card.naturalWidth === 180 && card.naturalHeight === 180) return "square.png";
  throw new Error(`Unexpected rendered image dimensions: ${JSON.stringify(card)}`);
}

async function assertCycle(page: Page, order: string[]) {
  const cards = await readTrail(page);
  expect(cards).toHaveLength(6);
  const first = order.indexOf(sourceName(cards[0]!));
  expect(first).toBeGreaterThanOrEqual(0);
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index]!;
    expect(sourceName(card)).toBe(order[(first + index) % order.length]);
    expect(card.height).toBe(180);
    expect(card.width / card.height).toBeCloseTo(card.naturalWidth / card.naturalHeight, 2);
    expect(card.opacity).toBe(1);
  }
  const pixels = await page.locator(`${cardSelector} img`).evaluateAll(images => images.map(element => {
    const image = element as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    return [0, 1, 2, 3].map(index => Array.from(context.getImageData(
      (index % 2 + 0.5) * canvas.width / 2, (Math.floor(index / 2) + 0.5) * canvas.height / 2, 1, 1,
    ).data));
  }));
  const expectedPixels: Record<string, number[][]> = {
    "portrait.png": [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 0, 255]],
    "landscape.png": [[255, 0, 255, 255], [0, 255, 255, 255], [255, 255, 255, 255], [0, 0, 0, 255]],
    "square.png": [[0, 128, 0, 255], [0, 0, 128, 255], [128, 0, 0, 255], [128, 128, 0, 255]],
  };
  expect(pixels).toEqual(cards.map(card => expectedPixels[sourceName(card)]));
}

test(trailTitle("images"), async ({ page }) => {
  const session = await prepareTrail(page);
  const field = trailField(page, "images");
  const expectedDefaults = Array.from({ length: 50 }, (_, index) => `fine-details-trail-${String(index + 1).padStart(2, "0")}.webp`);
  await expect.poll(() => names(page)).toEqual(expectedDefaults);
  const defaultIds = await ids(page);
  expect(new Set(defaultIds).size).toBe(50);
  await spawnTrail(page);
  expect((await readTrail(page)).every(card => card.image.includes("fine-details-trail-"))).toBe(true);
  const lifecycle = session.observe(root => ({
    itemIds: Array.from(root.querySelectorAll('[data-toolcraft-control-target="trail.images"] [data-file-upload-preview-key]'), item => item.getAttribute("data-file-upload-preview-key")!),
    outputSignature: JSON.stringify(Array.from(root.querySelectorAll("[data-trail-card] img"), image => (image as HTMLImageElement).currentSrc)),
  }));
  await expectToolcraftMediaLifecycle(lifecycle, session.targetAction("trail.images", () => removeAllImages(page)),
    { itemIds: [], outputSignature: "[]" }, { requirementId: "trail.images" });

  await page.getByRole("button", { name: "Reset Trail Images section", exact: true }).click();
  await expect.poll(() => names(page)).toEqual(expectedDefaults);
  expect(await ids(page)).toEqual(defaultIds);
  await spawnTrail(page);
  expect((await readTrail(page)).every(card => card.image.includes("fine-details-trail-"))).toBe(true);
  await removeAllImages(page);

  await setTrailSlider(page, "spacing", 48);
  await expectToolcraftProductObservableToChange(session, session.targetAction("trail.images", async () => {
    await uploadFixtures(page);
    await spawnTrail(page, 6, 48);
    await assertCycle(page, ["portrait.png", "landscape.png", "square.png"]);
  }), trailProof("images"));
  const uploadedIds = await ids(page);
  expect(uploadedIds).toHaveLength(3);
  expect(uploadedIds.every(id => !defaultIds.includes(id))).toBe(true);

  await expectToolcraftProductObservableToChange(session, session.targetAction("trail.images", async () => {
    const from = field.getByRole("button", { name: "Reorder portrait.png", exact: true });
    const to = field.getByRole("button", { name: "Reorder landscape.png", exact: true });
    await from.scrollIntoViewIfNeeded();
    const first = await from.boundingBox();
    const second = await to.boundingBox();
    if (!first || !second) throw new Error("Image reorder handles must be visible");
    await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
    await page.mouse.down();
    await page.mouse.move(first.x + first.width / 2 + 10, first.y + first.height / 2);
    await page.mouse.move(second.x + second.width / 2, second.y + second.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => names(page)).toEqual(["landscape.png", "portrait.png", "square.png"]);
    expect(await ids(page)).toEqual([uploadedIds[1], uploadedIds[0], uploadedIds[2]]);
    await clearTrail(page);
    await spawnTrail(page, 6, 48);
    await assertCycle(page, ["landscape.png", "portrait.png", "square.png"]);
  }), trailProof("images"));

  const selectPortrait = field.getByRole("button", { name: "Select portrait.png", exact: true });
  await selectPortrait.scrollIntoViewIfNeeded();
  const selectionPoint = await selectPortrait.evaluate(button => {
    const bounds = button.getBoundingClientRect();
    const x = bounds.width / 2;
    const y = bounds.height - 6;
    const hit = document.elementFromPoint(bounds.left + x, bounds.top + y);
    if (!hit || !button.contains(hit)) throw new Error("The thumbnail must expose a real selection area below its drag/remove handles");
    return { x, y };
  });
  await selectPortrait.click({ position: selectionPoint });
  await expect(selectPortrait).toHaveAttribute("aria-pressed", "true");
  for (const [label, expected] of [
    ["90° Right", [0, 1, -1, 0]],
    ["Flip horizontal", [0, -1, -1, 0]],
    ["Flip vertical", [0, -1, 1, 0]],
  ] as const) {
    const siblings = (await readTrail(page)).filter(card => sourceName(card) !== "portrait.png");
    await expectToolcraftProductObservableToChange(session, session.targetAction("trail.images", async () => {
      await field.getByRole("button", { name: label, exact: true }).click();
      await expect.poll(async () => (await readTrail(page)).filter(card => sourceName(card) === "portrait.png")
        .map(card => card.imageTransform.slice(7, -1).split(",").slice(0, 4).map(Number))).toEqual([[...expected], [...expected]]);
      await expect.poll(() => page.locator(`${cardSelector} img`).evaluateAll(images => images.length === 6 && images.every(element => {
        const image = element as HTMLImageElement;
        return image.complete && image.naturalWidth > 0 && image.currentSrc === image.src;
      }))).toBe(true);
      const cards = await readTrail(page);
      expect(cards).toHaveLength(6);
      expect(cards.filter(card => sourceName(card) !== "portrait.png")).toEqual(siblings);
      for (const card of cards.filter(card => sourceName(card) === "portrait.png")) {
        expect([card.width, card.height]).toEqual([360, 180]);
        expect([card.imageWidth, card.imageHeight]).toEqual([180, 360]);
      }
    }), trailProof("images"));
  }

  const survivingCards = (await readTrail(page)).filter(card => sourceName(card) !== "portrait.png");
  await expectToolcraftProductObservableToChange(session, session.targetAction("trail.images", async () => {
    await field.getByRole("button", { name: "Remove portrait.png", exact: true }).click();
    await expect.poll(() => names(page)).toEqual(["landscape.png", "square.png"]);
    await expect.poll(() => readTrail(page)).toEqual(survivingCards);
    expect(await ids(page)).toEqual([uploadedIds[1], uploadedIds[2]]);
  }), trailProof("images"));
  await removeAllImages(page);
  await page.getByRole("button", { name: "Reset Trail Images section", exact: true }).click();
  await expect.poll(() => names(page)).toEqual(expectedDefaults);
  expect(await ids(page)).toEqual(defaultIds);
  await spawnTrail(page);
  expect((await readTrail(page)).every(card => card.image.includes("fine-details-trail-") && card.imageTransform.startsWith("matrix(1, 0, 0, 1,"))).toBe(true);
});

import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";
import { cardSelector, dragTrailSlider, prepareTrail, readTrail, setTrailSlider, spawnTrail, trailField, trailProof, trailSelector, trailTitle } from "./fine-details-trail-test-helpers";

const shadowParts = (shadow: string) => shadow.match(/-?[\d.]+px/gu)!.map(Number.parseFloat);

for (const name of ["cardSize", "cardRadius", "border.width", "shadow.blur", "shadow.spread"] as const) {
  test(trailTitle(name), async ({ page }) => {
    const session = await prepareTrail(page);
    await spawnTrail(page);
    const before = await readTrail(page);
    let selected = 0;
    try {
      await expectToolcraftProductObservableToChange(session, session.targetAction(`trail.${name}`, async () => {
        selected = await dragTrailSlider(page, name, 0.68);
        await expect.poll(async () => (await readTrail(page)).map(card =>
          name === "cardSize" ? card.height : name === "cardRadius" ? card.radius : name === "border.width" ? card.borderWidth
            : shadowParts(card.shadow)[name === "shadow.blur" ? 2 : 3])).toEqual(before.map(() => selected));
        const after = await readTrail(page);
        for (let index = 0; index < after.length; index += 1) {
          const card = after[index]!;
          const original = before[index]!;
          expect(card.image).toBe(original.image);
          if (name === "cardSize") {
            const matrix = card.imageTransform.slice(7, -1).split(",").map(Number);
            const oldMatrix = original.imageTransform.slice(7, -1).split(",").map(Number);
            expect(matrix.slice(0, 4)).toEqual(oldMatrix.slice(0, 4));
            expect(matrix[4]).toBeCloseTo(-card.imageWidth / 2, 1);
            expect(matrix[5]).toBeCloseTo(-card.imageHeight / 2, 1);
            expect(card.width / card.height).toBeCloseTo(original.width / original.height, 2);
            expect(card.height).toBeGreaterThan(original.height);
          } else {
            expect(card.imageTransform).toBe(original.imageTransform);
            expect([card.width, card.height]).toEqual([original.width, original.height]);
          }
          if (name === "cardRadius") expect(card.overflow).toBe("hidden");
          if (name === "shadow.blur" || name === "shadow.spread") {
            const other = name === "shadow.blur" ? 3 : 2;
            expect(shadowParts(card.shadow)[other]).toBe(shadowParts(original.shadow)[other]);
          }
        }
      }), trailProof(name));
    } finally { await page.mouse.up(); }
    await spawnTrail(page, 1);
    const newest = (await readTrail(page)).at(-1)!;
    expect(name === "cardSize" ? newest.height : name === "cardRadius" ? newest.radius : name === "border.width" ? newest.borderWidth
      : shadowParts(newest.shadow)[name === "shadow.blur" ? 2 : 3]).toBe(selected);
  });
}

test(trailTitle("enabled"), async ({ page }) => {
  const session = await prepareTrail(page);
  await spawnTrail(page);
  const siblingOutput = () => page.locator("[data-fine-details-section]").evaluate(root => {
    const grid = getComputedStyle(root.firstElementChild!);
    const selectors = "[data-fine-details-upper-left-typography], [data-fine-details-lower-right-typography], [data-fine-details-lower-heading], [data-fine-details-lower-body], [data-fine-details-prompt] form";
    return {
      background: getComputedStyle(root).backgroundColor,
      grid: [grid.backgroundImage, grid.backgroundSize, grid.opacity],
      siblings: Array.from(root.querySelectorAll(selectors), element => {
        const style = getComputedStyle(element);
        return { bounds: element.getBoundingClientRect().toJSON(), text: element.textContent,
          font: [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight, style.color],
          appearance: [style.backgroundColor, style.borderRadius, style.boxShadow] };
      }),
    };
  });
  const before = await siblingOutput();
  const toggle = trailField(page, "enabled").getByRole("switch");
  await expectToolcraftProductObservableToChange(session, session.targetAction("trail.enabled", async () => {
    await toggle.click();
    await expect(page.locator(cardSelector)).toHaveCount(0);
    await expect(page.locator(trailSelector)).toHaveAttribute("data-fine-details-trail", "off");
    await expect(trailField(page, "cardSize")).toHaveCount(0);
    expect(await siblingOutput()).toEqual(before);
  }), trailProof("enabled"));
  await toggle.click();
  await spawnTrail(page);
  expect(await siblingOutput()).toEqual(before);
});

for (const name of ["border.enabled", "shadow.enabled"] as const) {
  test(trailTitle(name), async ({ page }) => {
    const session = await prepareTrail(page);
    await spawnTrail(page);
    const before = await readTrail(page);
    const toggle = trailField(page, name).getByRole("switch");
    await expect(toggle).toBeChecked();
    await expectToolcraftProductObservableToChange(session, session.targetAction(`trail.${name}`, async () => {
      await toggle.click();
      await expect.poll(async () => (await readTrail(page)).map(card => name === "border.enabled" ? card.borderWidth : card.shadow))
        .toEqual(before.map(() => name === "border.enabled" ? 0 : "none"));
      for (const [index, card] of (await readTrail(page)).entries()) {
        expect([card.width, card.height, card.image]).toEqual([before[index]!.width, before[index]!.height, before[index]!.image]);
        expect(name === "border.enabled" ? card.shadow : card.borderWidth).toBe(name === "border.enabled" ? before[index]!.shadow : before[index]!.borderWidth);
      }
    }), trailProof(name));
    await spawnTrail(page, 1);
    expect((await readTrail(page)).every(card => name === "border.enabled" ? card.borderWidth === 0 : card.shadow === "none")).toBe(true);
    await toggle.click();
    await expect.poll(async () => (await readTrail(page)).map(card => name === "border.enabled" ? card.borderWidth : card.shadow))
      .toEqual(Array(4).fill(name === "border.enabled" ? before[0]!.borderWidth : before[0]!.shadow));
  });
}

test(trailTitle("border.color"), async ({ page }) => {
  const session = await prepareTrail(page);
  await spawnTrail(page);
  const before = await readTrail(page);
  await expectToolcraftProductObservableToChange(session, session.targetAction("trail.border.color", async () => {
    const input = trailField(page, "border.color").getByRole("textbox");
    await input.fill("#FF0000");
    await input.press("Enter");
    await expect.poll(async () => (await readTrail(page)).map(card => card.borderColor)).toEqual(before.map(() => "rgb(255, 0, 0)"));
    expect((await readTrail(page)).map(card => [card.image, card.shadow])).toEqual(before.map(card => [card.image, card.shadow]));
  }), trailProof("border.color"));
  await spawnTrail(page, 1);
  expect((await readTrail(page)).every(card => card.borderColor === "rgb(255, 0, 0)")).toBe(true);
});

test(trailTitle("shadow.offset"), async ({ page }) => {
  const session = await prepareTrail(page);
  // The compound editor displays two decimals: use exactly representable Y.
  const field = trailField(page, "shadow.offset");
  const set = async (value: string) => {
    await field.getByRole("button", { name: "Edit Shadow offset value", exact: true }).click();
    await field.getByRole("textbox").fill(value);
    await field.getByRole("textbox").press("Enter");
  };
  await set("0, 0.25");
  await spawnTrail(page);
  const offsets = session.observe(root => Array.from(root.querySelectorAll("[data-trail-card]"), element =>
    getComputedStyle(element).boxShadow.match(/-?[\d.]+px/gu)!.slice(0, 2).map(Number.parseFloat)));
  const before = (await readTrail(page)).map(card => [shadowParts(card.shadow).slice(2), card.borderColor, card.image]);
  for (const [part, value, expected] of [["vector.x", "0.5, 0.25", [24, 12]], ["vector.y", "0.5, -0.5", [24, -24]]] as const) {
    await expectToolcraftProductObservableToChange(session, session.targetAction("trail.shadow.offset", async () => {
      await expectToolcraftCompoundControlPartOutcome(offsets, session.targetAction("trail.shadow.offset", () => set(value)),
        Array.from({ length: 3 }, () => [...expected]), { requirementId: "trail.shadow.offset", part });
      expect((await readTrail(page)).map(card => [shadowParts(card.shadow).slice(2), card.borderColor, card.image])).toEqual(before);
    }), trailProof("shadow.offset"));
  }
});

test(trailTitle("shadow.colorOpacity"), async ({ page }) => {
  const session = await prepareTrail(page);
  await spawnTrail(page);
  const colors = session.observe(root => Array.from(root.querySelectorAll("[data-trail-card]"), element =>
    getComputedStyle(element).boxShadow.match(/rgba?\([^)]*\)/u)![0]));
  const field = trailField(page, "shadow.colorOpacity");
  const alpha = Number(await field.getByRole("textbox", { name: "Shadow color opacity", exact: true }).inputValue()) / 100;
  const before = (await readTrail(page)).map(card => [shadowParts(card.shadow), card.borderColor, card.image]);
  for (const [part, label, value, expected] of [
    ["colorOpacity.hex", "Shadow color hex", "#FF0000", `rgba(255, 0, 0, ${alpha})`],
    ["colorOpacity.opacity", "Shadow color opacity", "80", "rgba(255, 0, 0, 0.8)"],
  ] as const) {
    await expectToolcraftProductObservableToChange(session, session.targetAction("trail.shadow.colorOpacity", async () => {
      await expectToolcraftCompoundControlPartOutcome(colors, session.targetAction("trail.shadow.colorOpacity", async () => {
        const input = field.getByRole("textbox", { name: label, exact: true });
        await input.fill(value);
        await input.press("Enter");
      }), Array(3).fill(expected), { requirementId: "trail.shadow.colorOpacity", part });
      expect((await readTrail(page)).map(card => [shadowParts(card.shadow), card.borderColor, card.image])).toEqual(before);
    }), trailProof("shadow.colorOpacity"));
  }
});

test(trailTitle("sizeFalloff"), async ({ page }) => {
  const session = await prepareTrail(page);
  await setTrailSlider(page, "spacing", 40);
  await spawnTrail(page, 6, 40);
  expect((await readTrail(page)).map(card => card.scale)).toEqual(Array(6).fill(1));
  try {
    await expectToolcraftProductObservableToChange(session, session.targetAction("trail.sizeFalloff", async () => {
      const value = await dragTrailSlider(page, "sizeFalloff", 0.9);
      await expect.poll(async () => (await readTrail(page)).map(card => Number(card.scale.toFixed(2))))
        .toEqual(Array.from({ length: 6 }, (_, index) => Number(Math.max(0.1, 1 - (5 - index) * value / 100).toFixed(2))));
      const cards = await readTrail(page);
      expect(cards[0]!.scale).toBeCloseTo(0.1, 2);
      expect(cards.at(-1)!.scale).toBe(1);
      expect(cards.every(card => card.opacity === 1)).toBe(true);
    }), trailProof("sizeFalloff"));
  } finally { await page.mouse.up(); }
});

test(trailTitle("length"), async ({ page }) => {
  const session = await prepareTrail(page);
  await setTrailSlider(page, "spacing", 40);
  await spawnTrail(page, 8, 40);
  const originals = await readTrail(page);
  try {
    await expectToolcraftProductObservableToChange(session, session.targetAction("trail.length", async () => {
      const field = trailField(page, "length");
      const slider = field.getByRole("slider");
      await slider.scrollIntoViewIfNeeded();
      const thumb = await slider.boundingBox();
      const track = await field.locator('[data-slot="slider"]').first().boundingBox();
      if (!thumb || !track) throw new Error("Expected visible length thumb and track");
      await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2);
      await page.mouse.down();
      await page.mouse.move(track.x + track.width * 0.15, track.y + track.height / 2);
      const length = Number(await slider.getAttribute("aria-valuenow"));
      expect(length).toBeLessThan(8);
      await expect(page.locator(cardSelector)).toHaveCount(length);
      expect((await readTrail(page)).map(card => card.image)).toEqual(originals.slice(-length).map(card => card.image));
    }), trailProof("length"));
  } finally { await page.mouse.up(); }
  await spawnTrail(page, 3, 40);
  const selected = Number(await trailField(page, "length").getByRole("slider").getAttribute("aria-valuenow"));
  await expect(page.locator(cardSelector)).toHaveCount(selected);
});

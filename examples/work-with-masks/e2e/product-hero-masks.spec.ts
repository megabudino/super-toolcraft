import type { Page } from "@playwright/test";

import {
  dragCanvasHandle,
  expectCanvasHandlesUseToolcraftVisualLanguage,
  expectNoForbiddenCanvasUi,
  getCanvasHandle,
} from "./canvas-handle-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  createHeroSession,
  expectCompoundRender,
  expectProductChange,
  quickStability,
  setSwitch,
} from "./product-hero-support";
import { expect, test } from "./toolcraft-product-test";

const maskRecord = {
  enabled: true,
  feather: 15,
  opacity: 65,
  position: { x: -0.3, y: 0.1 },
  radius: 28,
  rotation: 20,
  stretch: 1.8,
} as const;

const maskValues = {
  "haze.strength": 0,
  "masks.items": [maskRecord],
  "masks.preview": true,
  "motion.amount": 0,
  "post.bloom": 0,
  "post.depthOfField": false,
  "post.occlusion": 0,
} as const;

async function pauseTimeline(page: Page): Promise<void> {
  const pause = page.getByRole("button", { name: "Pause playback" });
  if (await pause.isVisible()) await pause.click();
}

test("browser: hero.masks.preview changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page, {
    includeBackground: true,
    values: maskValues,
  });
  await pauseTimeline(page);

  await expectProductChange(session, "masks.preview", "hero.masks.preview", (control) =>
    setSwitch(control, false),
  );
  await expectProductChange(session, "masks.preview", "hero.masks.preview", (control) =>
    setSwitch(control, true),
  );
  await expectCanvasHandlesUseToolcraftVisualLanguage(page);
  await expectNoForbiddenCanvasUi(page);
});

test("browser: hero.masks.enabled changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page, {
    includeBackground: true,
    values: maskValues,
  });
  await pauseTimeline(page);

  await expectProductChange(session, "masks.enabled", "hero.masks.enabled", (control) =>
    setSwitch(control, false),
  );
  await expectProductChange(session, "masks.enabled", "hero.masks.enabled", (control) =>
    setSwitch(control, true),
  );
});

test("browser: hero.masks.items adds, edits, and removes circles", async ({ page }) => {
  const session = await createHeroSession(page, {
    includeBackground: true,
    values: maskValues,
  });
  await pauseTimeline(page);
  const collection = page.locator('[data-toolcraft-control-target="masks.items"]');
  const add = collection.getByRole("button", { name: "Add circle" });
  const remove = collection.getByRole("button", { name: "Remove last circle" });

  await expectProductChange(session, "masks.items", "hero.masks.items", () => add.click());
  await expectCompoundRender(
    session,
    page,
    "masks.items",
    "hero.masks.items",
    "collectionActions.add",
    () => add.click(),
  );

  const sliders = collection.getByRole("slider");
  const switches = collection.getByRole("switch");
  await expect(sliders).toHaveCount(15);
  await expect(sliders.nth(10)).toHaveAttribute("aria-valuenow", "30");
  await expect(sliders.nth(11)).toHaveAttribute("aria-valuenow", "1");
  await expect(sliders.nth(12)).toHaveAttribute("aria-valuenow", "0");
  await expect(sliders.nth(13)).toHaveAttribute("aria-valuenow", "20");
  await expect(sliders.nth(14)).toHaveAttribute("aria-valuenow", "100");
  await expect(switches.nth(2)).toHaveAttribute("aria-checked", "true");

  const siblingValues = await sliders.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("aria-valuenow")),
  );
  await expectCompoundRender(
    session,
    page,
    "masks.items",
    "hero.masks.items",
    "collectionActions.items",
    () => sliders.nth(14).press("Home"),
  );
  const editedValues = await sliders.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("aria-valuenow")),
  );
  expect(editedValues[14]).toBe("0");
  expect(editedValues.slice(0, 14)).toEqual(siblingValues.slice(0, 14));

  await expectCompoundRender(
    session,
    page,
    "masks.items",
    "hero.masks.items",
    "collectionActions.remove",
    () => remove.click(),
  );
  await remove.click();
  await remove.click();
  await expect(remove).toBeDisabled();
  await expect(page.locator("[data-toolcraft-canvas-handle]")).toHaveCount(0);
});

for (const [kind, delta] of [
  ["move", { x: 40, y: 0 }],
  [
    "size",
    {
      x: 30 * Math.cos((20 * Math.PI) / 180),
      y: -30 * Math.sin((20 * Math.PI) / 180),
    },
  ],
  [
    "stretch",
    {
      x: -20 * Math.sin((20 * Math.PI) / 180),
      y: -20 * Math.cos((20 * Math.PI) / 180),
    },
  ],
  ["rotate", { x: 0, y: 40 }],
] as const) {
  const requirementId = `hero.masks.handle.${kind}`;

  test(`browser: ${requirementId} drags a circle on the canvas`, async ({ page }) => {
    const session = await createHeroSession(page, {
      includeBackground: true,
      values: maskValues,
    });
    await pauseTimeline(page);
    const initialHandleBounds =
      kind === "move" ? await getCanvasHandle(page, `hero-mask-0-${kind}`).boundingBox() : null;

    await expectToolcraftProductObservableToChange(
      session,
      session.targetAction("masks.items", (currentPage) =>
        dragCanvasHandle(currentPage, `hero-mask-0-${kind}`, delta, {
          requirementId,
          target: "masks.items",
        }),
      ),
      { ...quickStability, requirementId },
    );
    if (kind === "move" && initialHandleBounds) {
      const movedHandleBounds = await getCanvasHandle(page, "hero-mask-0-move").boundingBox();
      expect(movedHandleBounds?.x).toBeGreaterThan(initialHandleBounds.x + 20);
      await page.keyboard.press("Meta+z");
      await expect
        .poll(async () => (await getCanvasHandle(page, "hero-mask-0-move").boundingBox())?.x)
        .toBeCloseTo(initialHandleBounds.x, 0);
    }
  });
}

test("browser: hero.masks.items keeps adding past the recommended count and stops at sixteen", async ({
  page,
}) => {
  await createHeroSession(page, {
    includeBackground: true,
    values: { ...maskValues, "masks.items": Array.from({ length: 8 }, () => maskRecord) },
  });
  await pauseTimeline(page);
  const add = page
    .locator('[data-toolcraft-control-target="masks.items"]')
    .getByRole("button", { name: "Add circle" });
  await expect(add).toBeEnabled();
  await add.click();
  await expect(
    page.locator(
      '[data-toolcraft-control-target="masks.items"] [data-slot="collection-item-fields"]',
    ),
  ).toHaveCount(9);

  for (let count = 9; count < 16; count += 1) await add.click();
  await expect(add).toBeDisabled();
  await expect(
    page.locator(
      '[data-toolcraft-control-target="masks.items"] [data-slot="collection-item-fields"]',
    ),
  ).toHaveCount(16);
});

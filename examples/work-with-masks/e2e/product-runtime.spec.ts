import type { ElementHandle, Locator, Page } from "@playwright/test";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  expectToolcraftInfinityCanvasModeEvidence,
  observeInfinityCanvas,
} from "./browser-infinity-canvas-evidence";
import { expectToolcraftCanvasRenderScaleEvidence } from "./browser-render-scale-evidence";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { installHeroBrowserFixture } from "./product-hero-fixture";
import { expect, test } from "./toolcraft-product-test";

const heroCanvasSelector = 'canvas[data-toolcraft-product-output="hero"]';
const sceneSelector = '[data-toolcraft-product-scene-status="ready"]';

type ContinuityHandles = Readonly<{
  output: ElementHandle<HTMLElement>;
  scene: ElementHandle<HTMLElement>;
}>;

async function waitForHero(page: Page): Promise<Locator> {
  const canvas = page.locator(heroCanvasSelector);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-hero-render-count", /^[1-9]\d*$/u);
  return canvas;
}

async function captureContinuityHandles(page: Page): Promise<ContinuityHandles> {
  const scene = page.locator(sceneSelector);
  const output = page.locator(heroCanvasSelector);
  const [sceneHandle, outputHandle] = await Promise.all([
    scene.elementHandle(),
    output.elementHandle(),
  ]);
  if (!sceneHandle || !outputHandle) {
    throw new Error("Percent Hero continuity nodes are unavailable.");
  }
  return {
    output: outputHandle as ElementHandle<HTMLElement>,
    scene: sceneHandle as ElementHandle<HTMLElement>,
  };
}

async function observeContinuity(
  page: Page,
  handles: ContinuityHandles,
) {
  return {
    productHostPreserved: await page
      .locator(sceneSelector)
      .evaluate((element, initial) => element === initial, handles.scene),
    productOutputPreserved: await page
      .locator(heroCanvasSelector)
      .evaluate((element, initial) => element === initial, handles.output),
  };
}

async function clickInfinity(page: Page): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, "canvas.infinity");
  await field.getByRole("switch").click();
}

async function expectCanvasMode(
  page: Page,
  mode: "finite" | "infinite",
): Promise<void> {
  await expect(page.locator('[data-toolcraft-canvas-surface=""]')).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    mode,
  );
}

test("browser: hero preserves its scene through Infinity toggles", async ({
  page,
}) => {
  await installHeroBrowserFixture(page, {
    includeBackground: true,
    sunIntensity: 2,
  });
  await page.goto("/");
  await waitForHero(page);

  const beforeHandles = await captureContinuityHandles(page);
  const before = await observeInfinityCanvas(page);
  await clickInfinity(page);
  await expectCanvasMode(page, "infinite");
  const enabled = await observeInfinityCanvas(page);
  const beforeToEnabled = await observeContinuity(page, beforeHandles);

  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const box = await viewport.boundingBox();
  if (!box) throw new Error("Canvas viewport has no measurable rectangle.");
  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.52, {
    steps: 8,
  });
  await page.mouse.up();
  const afterPan = await observeInfinityCanvas(page);

  await page.waitForTimeout(400);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForHero(page);
  const afterReload = await observeInfinityCanvas(page);
  const reloadedHandles = await captureContinuityHandles(page);

  await clickInfinity(page);
  await expectCanvasMode(page, "finite");
  const restored = await observeInfinityCanvas(page);
  const afterReloadToRestored = await observeContinuity(page, reloadedHandles);

  await page.getByLabel("Undo").click();
  await expectCanvasMode(page, "infinite");
  const undone = await observeInfinityCanvas(page);
  const restoredToUndone = await observeContinuity(page, reloadedHandles);

  await page.getByLabel("Redo").click();
  await expectCanvasMode(page, "finite");
  const redone = await observeInfinityCanvas(page);
  const undoneToRedone = await observeContinuity(page, reloadedHandles);

  await expectToolcraftInfinityCanvasModeEvidence(
    { afterPan, afterReload, before, enabled, redone, restored, undone },
    {
      afterReloadToRestored,
      beforeToEnabled,
      restoredToUndone,
      undoneToRedone,
    },
    {
      expectedFiniteSize: { height: 360, width: 640 },
      expectedSceneRect: { height: 359, width: 640, x: -320, y: -179 },
      requirementId: "hero.runtime.infinity",
      target: "canvas.infinity",
    },
  );
});

test("browser: hero uses selected render-scale backing pixels", async ({
  page,
}) => {
  await installHeroBrowserFixture(page, {
    includeBackground: true,
    sunIntensity: 2,
  });
  await page.goto("/");
  const canvas = await waitForHero(page);
  const renderScale = await getToolcraftControlFieldByTarget(
    page,
    "canvas.renderScale",
  );
  await renderScale.getByRole("slider").press("End");
  await expect(renderScale.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "2",
  );
  await expectToolcraftDiscreteSliderMarkers(
    page,
    "canvas.renderScale",
    "hero.runtime.render-scale",
  );

  const changeSpacing = async (key: "End" | "Home") => {
    const before = Number(await canvas.getAttribute("data-hero-render-count"));
    const spacing = await getToolcraftControlFieldByTarget(page, "structure.spacing");
    await spacing.getByRole("slider").press(key);
    await expect
      .poll(() =>
        canvas
          .getAttribute("data-hero-render-count")
          .then((value) => Number(value)),
      )
      .toBeGreaterThan(before);
  };

  await expectToolcraftCanvasRenderScaleEvidence(page, {
    canvasSelector: heroCanvasSelector,
    requirementId: "hero.runtime.render-scale",
    selectedScale: 2,
    stateTransitions: [
      { run: () => changeSpacing("Home"), state: "interaction" },
      {
        run: async () => {
          await changeSpacing("End");
          await page.waitForTimeout(120);
        },
        state: "steady",
      },
    ],
    target: "canvas.renderScale",
  });
});

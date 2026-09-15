import {
  observeInfinityCanvas,
  expectToolcraftInfinityCanvasImageExportEvidence,
  expectToolcraftInfinityCanvasModeEvidence,
} from "./browser-infinity-canvas-evidence";
import { expectToolcraftCanvasRenderScaleEvidence } from "./browser-render-scale-evidence";
import { expect, test } from "./toolcraft-product-test";
import {
  FINITE_SIZE,
  INFINITY_TARGET,
  RENDER_SCALE_TARGET,
  SCENE_RECT,
  PREVIEW_CANVAS_SELECTOR,
  chooseSelectOption,
  dragCanvasPan,
  exportImage,
  globeCanvasSignature,
  readImageDimensions,
} from "./product-landing-globe-helpers";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { expectGlobeModeContinuity, globeScenePixels } from "./product-landing-globe-infinity-helpers";

test.setTimeout(120_000);

test("browser: infinity canvas preserves globe scene bounds and finite restoration", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const schedule = window.requestAnimationFrame.bind(window);
    Object.defineProperty(performance, "now", { configurable: true, value: () => 1 });
    window.requestAnimationFrame = (callback) => schedule(() => callback(performance.now()));
  });
  await page.goto("/");
  await expect(page.locator(PREVIEW_CANVAS_SELECTOR)).toBeVisible();
  const initialPixels = await globeScenePixels(page);
  await page.evaluate(() => {
    Object.defineProperty(performance, "now", { configurable: true, value: () => 501 });
  });
  await expect.poll(() => globeScenePixels(page)).not.toBe(initialPixels);
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await dragCanvasPan(page);
  const before = await observeInfinityCanvas(page);
  expect(before.viewport.zoom).not.toBe(100);
  const beforeToEnabled = await expectGlobeModeContinuity(page, () => page
    .locator(`[data-toolcraft-control-target="${INFINITY_TARGET}"] [role="switch"]`)
    .click());
  const enabled = await observeInfinityCanvas(page);
  await dragCanvasPan(page);
  const afterPan = await observeInfinityCanvas(page);
  await page.reload();
  await expect(page.locator(PREVIEW_CANVAS_SELECTOR)).toBeVisible();
  const afterReload = await observeInfinityCanvas(page);
  const afterReloadToRestored = await expectGlobeModeContinuity(page, () => page
    .locator(`[data-toolcraft-control-target="${INFINITY_TARGET}"] [role="switch"]`)
    .click());
  const restored = await observeInfinityCanvas(page);
  const restoredToUndone = await expectGlobeModeContinuity(page, () =>
    page.getByRole("button", { name: "Undo" }).click());
  const undone = await observeInfinityCanvas(page);
  const undoneToRedone = await expectGlobeModeContinuity(page, () =>
    page.getByRole("button", { name: "Redo" }).click());
  const redone = await observeInfinityCanvas(page);

  await expectToolcraftInfinityCanvasModeEvidence(
    { afterPan, afterReload, before, enabled, redone, restored, undone },
    { afterReloadToRestored, beforeToEnabled, restoredToUndone, undoneToRedone },
    {
      expectedFiniteSize: FINITE_SIZE,
      expectedSceneRect: SCENE_RECT,
      requirementId: "runtime.infinity-canvas",
      target: INFINITY_TARGET,
    },
  );
});

test("browser: infinity canvas image export crops to globe scene bounds", async ({
  page,
}) => {
  await page.goto("/");
  const finiteDownload = await exportImage(page);
  const finite = await readImageDimensions(page, finiteDownload);
  await chooseSelectOption(
    page.locator(`[data-toolcraft-control-target="export.image.resolution"]`),
    "2K",
  );
  await page
    .locator(`[data-toolcraft-control-target="${INFINITY_TARGET}"] [role="switch"]`)
    .click();
  await dragCanvasPan(page);
  const infiniteDownload = await exportImage(page);
  const infinite = await readImageDimensions(page, infiniteDownload);
  await expectToolcraftInfinityCanvasImageExportEvidence(
    {
      finite: {
        byteLength: finite.byteLength,
        height: finite.height,
        width: finite.width,
      },
      infinite: {
        byteLength: infinite.byteLength,
        height: infinite.height,
        width: infinite.width,
      },
    },
    {
      expectedFiniteSize: { height: 2304, width: 4096 },
      expectedInfiniteSize: { height: 1152, width: 2048 },
      requirementId: "runtime.infinity-scene-export",
      target: INFINITY_TARGET,
    },
  );
});

test("browser: render scale keeps selected backing pixels for globe canvas", async ({
  page,
}) => {
  await page.goto("/");
  await expectToolcraftCanvasRenderScaleEvidence(page, {
    canvasSelector: PREVIEW_CANVAS_SELECTOR,
    requirementId: "runtime.render-scale",
    selectedScale: 2,
    stateTransitions: [
      {
        run: async () => {
          await page.waitForTimeout(100);
        },
        state: "steady",
      },
      {
        run: async () => {
          const before = await globeCanvasSignature(page);
          await page.mouse.move(720, 500);
          await page.mouse.down();
          await page.mouse.move(760, 530, { steps: 6 });
          await page.mouse.up();
          await expect.poll(() => globeCanvasSignature(page)).not.toBe(before);
        },
        state: "interaction",
      },
    ],
    target: RENDER_SCALE_TARGET,
  });
  await expectToolcraftDiscreteSliderMarkers(
    page,
    RENDER_SCALE_TARGET,
    "runtime.render-scale",
  );
});

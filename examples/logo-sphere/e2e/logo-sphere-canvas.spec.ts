import {
  expectToolcraftInfinityCanvasImageExportEvidence,
  expectToolcraftInfinityCanvasModeEvidence,
  observeInfinityCanvas,
} from "./browser-infinity-canvas-evidence";
import { expectToolcraftCanvasRenderScaleEvidence } from "./browser-render-scale-evidence";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import {
  createLogoSphereProofSession,
  logoSphereCanvasSelector,
  waitForLogoSphereDraw,
} from "./logo-sphere-test-helpers";
import { expect, test } from "./toolcraft-product-test";

test.setTimeout(120_000);

test(
  "browser: Infinity canvas restores size and exports exact sphere scene bounds",
  async ({ page }) => {
    await createLogoSphereProofSession(page);
    const before = await observeInfinityCanvas(page);
    const infinitySwitch = page
      .locator('[data-toolcraft-control-target="canvas.infinity"]')
      .getByRole("switch");
    await infinitySwitch.click();
    const enabled = await observeInfinityCanvas(page);
    expect(enabled.sceneRect).not.toBeNull();
    if (!enabled.sceneRect) return;

    const viewport = page.locator('[data-slot="toolcraft-runtime-canvas"]');
    const viewportBounds = await viewport.boundingBox();
    expect(viewportBounds).not.toBeNull();
    if (!viewportBounds) return;
    const x = viewportBounds.x + viewportBounds.width * 0.16;
    const y = viewportBounds.y + viewportBounds.height * 0.18;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 52, y + 34, { steps: 6 });
    await page.mouse.up();
    const afterPan = await observeInfinityCanvas(page);

    await page.reload();
    await expect(page.locator(logoSphereCanvasSelector)).toBeVisible();
    const afterReload = await observeInfinityCanvas(page);
    await page
      .locator('[data-toolcraft-control-target="canvas.infinity"]')
      .getByRole("switch")
      .click();
    const restored = await observeInfinityCanvas(page);
    await page.getByRole("button", { name: "Undo" }).click();
    const undone = await observeInfinityCanvas(page);
    await page.getByRole("button", { name: "Redo" }).click();
    const redone = await observeInfinityCanvas(page);

    await expectToolcraftInfinityCanvasModeEvidence(
      { afterPan, afterReload, before, enabled, redone, restored, undone },
      {
        expectedFiniteSize: { height: 1080, width: 1920 },
        expectedSceneRect: enabled.sceneRect,
        requirementId: "canvas.infinity.mode",
        target: "canvas.infinity",
      },
    );
  },
);

test(
  "browser: infinite image export crops to exact logo sphere scene bounds",
  async ({ page }) => {
    await createLogoSphereProofSession(page);
    const scrubber = page.getByRole("slider", { name: "Playback position" });
    if (!(await scrubber.isVisible())) {
      await page
        .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
        .getByRole("switch")
        .click();
    }
    await scrubber.press("Home");
    await waitForLogoSphereDraw(page);

    const exportAndInspect = async () => {
      const pending = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export PNG" }).click();
      const download = await pending;
      return (
        await inspectToolcraftImageDownload({
          backgroundRgba: [245, 244, 241, 255],
          download,
          page,
        })
      ).inspection;
    };
    const finite = await exportAndInspect();
    await page
      .locator('[data-toolcraft-control-target="canvas.infinity"]')
      .getByRole("switch")
      .click();
    const infiniteObservation = await observeInfinityCanvas(page);
    expect(infiniteObservation.sceneRect).not.toBeNull();
    if (!infiniteObservation.sceneRect) return;
    const infinite = await exportAndInspect();
    const rect = infiniteObservation.sceneRect;
    const scale = 4096 / Math.max(rect.width, rect.height);
    const expectedInfiniteSize = {
      height: Math.round(rect.height * scale),
      width: Math.round(rect.width * scale),
    };

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
        expectedInfiniteSize,
        requirementId: "canvas.infinity.export",
        target: "canvas.infinity",
      },
    );
  },
);

test(
  "browser: selected resolution scale preserves logo sphere backing pixels",
  async ({ page }) => {
    await createLogoSphereProofSession(page);
    const canvas = page.locator(logoSphereCanvasSelector);
    await expectToolcraftDiscreteSliderMarkers(
      page,
      "canvas.renderScale",
      "canvas.render-scale",
    );
    await expectToolcraftCanvasRenderScaleEvidence(page, {
      canvasSelector: logoSphereCanvasSelector,
      requirementId: "canvas.render-scale",
      selectedScale: 2,
      stateTransitions: [
        {
          state: "interaction",
          run: async () => {
            const bounds = await canvas.boundingBox();
            expect(bounds).not.toBeNull();
            if (!bounds) return;
            const x = bounds.x + bounds.width / 2;
            const y = bounds.y + bounds.height / 2;
            await page.mouse.move(x, y);
            await page.mouse.down();
            await page.mouse.move(x + 36, y - 18, { steps: 6 });
            await page.mouse.up();
            await waitForLogoSphereDraw(page);
          },
        },
        {
          state: "playback",
          run: async () => {
            await page.getByRole("button", { name: "Play playback" }).click();
            await page.waitForTimeout(80);
            await page.getByRole("button", { name: "Pause playback" }).click();
            await waitForLogoSphereDraw(page);
          },
        },
        {
          state: "steady",
          run: () => waitForLogoSphereDraw(page),
        },
      ],
      target: "canvas.renderScale",
    });
  },
);

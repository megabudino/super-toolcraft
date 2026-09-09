import { appAcceptance } from "../src/app/app-acceptance-data";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  expectToolcraftInfinityCanvasModeEvidence,
  observeInfinityCanvas,
} from "./browser-infinity-canvas-evidence";
import { waitForWebsitePreview } from "./hero-preview-browser-helpers";
import { test } from "./toolcraft-product-test";

const infinityAcceptance = appAcceptance.find(
  (entry) => entry.id === "canvas.infinity",
);
if (!infinityAcceptance) {
  throw new Error("Missing Infinity canvas acceptance.");
}

test(infinityAcceptance.browserTestName, async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForWebsitePreview(page);

  const before = await observeInfinityCanvas(page);
  const infinityControl = await getToolcraftControlFieldByTarget(
    page,
    "canvas.infinity",
  );
  await infinityControl.getByRole("switch").click();
  const enabled = await observeInfinityCanvas(page);

  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const viewportBox = await viewport.boundingBox();
  if (!viewportBox) {
    throw new Error("Infinity canvas proof requires visible viewport geometry.");
  }
  await page.mouse.move(
    viewportBox.x + viewportBox.width * 0.55,
    viewportBox.y + viewportBox.height * 0.55,
  );
  await page.mouse.down();
  await page.mouse.move(
    viewportBox.x + viewportBox.width * 0.55 + 64,
    viewportBox.y + viewportBox.height * 0.55 + 36,
    { steps: 4 },
  );
  await page.mouse.up();
  const afterPan = await observeInfinityCanvas(page);

  await page.reload();
  await waitForWebsitePreview(page);
  const afterReload = await observeInfinityCanvas(page);

  const restoredInfinityControl = await getToolcraftControlFieldByTarget(
    page,
    "canvas.infinity",
  );
  await restoredInfinityControl.getByRole("switch").click();
  const restored = await observeInfinityCanvas(page);
  await page.getByRole("button", { name: "Undo" }).click();
  const undone = await observeInfinityCanvas(page);
  await page.getByRole("button", { name: "Redo" }).click();
  const redone = await observeInfinityCanvas(page);

  await expectToolcraftInfinityCanvasModeEvidence(
    { afterPan, afterReload, before, enabled, redone, restored, undone },
    {
      expectedFiniteSize: { height: 1080, width: 1920 },
      expectedSceneRect: { height: 1080, width: 1920, x: 0, y: 0 },
      requirementId: infinityAcceptance.id,
      target: "canvas.infinity",
    },
  );
});

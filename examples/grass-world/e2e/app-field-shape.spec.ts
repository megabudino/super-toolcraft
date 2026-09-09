import type { Page } from "@playwright/test";

import {
  disableGrassScanLayers,
  pauseGrassPlayback,
  prepareGrassSession as prepareBaseGrassSession,
  setGrassLayerVisibility,
  setGrassTimelinePosition,
} from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

async function prepareGrassSession(page: Page) {
  const session = await prepareBaseGrassSession(page);
  const play = page.getByRole("button", { name: "Play playback" });
  if ((await play.count()) > 0) await play.click();
  await pauseGrassPlayback(page);
  await setGrassTimelinePosition(page, 0.31);
  await pauseGrassPlayback(page);
  return session;
}

test("field shape controls reshape the complete surface", async ({ page }) => {
  test.setTimeout(600_000);
  const session = await prepareGrassSession(page);
  for (const target of ["field.densityMax", "lawn.densityMax"] as const) {
    const slider = page
      .locator(`[data-toolcraft-control-target="${target}"]`)
      .getByRole("slider");
    await slider.focus();
    await slider.press("Home");
  }
  await disableGrassScanLayers(page);
  await setGrassLayerVisibility(page, "scan.boulder.enabled", false);

  const canvas = page.locator('[data-slot="grass-webgl-canvas"]');
  const readDimensions = () =>
    canvas.evaluate((element) => ({
      height: (element as HTMLCanvasElement).height,
      width: (element as HTMLCanvasElement).width,
    }));
  const dimensions = await readDimensions();

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("field.shapeRoundness", async (field) => {
      const slider = field.getByRole("slider");
      await slider.focus();
      await slider.press("Home");
    }),
    {
      requirementId: "grass.field-shape-roundness",
      timeoutMs: 20_000,
    },
  );
  await expect.poll(() => readShapeValue(canvas, "roundness")).toBe(0);

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("field.edgeIrregularity", async (field) => {
      const slider = field.getByRole("slider");
      await slider.focus();
      await slider.press("End");
    }),
    {
      requirementId: "grass.field-edge-irregularity",
      timeoutMs: 20_000,
    },
  );
  await expect.poll(() => readShapeValue(canvas, "irregularity")).toBe(0.3);
  await expect(readDimensions()).resolves.toEqual(dimensions);
});

async function readShapeValue(
  canvas: ReturnType<Page["locator"]>,
  key: "irregularity" | "roundness",
): Promise<number | undefined> {
  const signature = await canvas.getAttribute(
    "data-grass-field-shape-signature",
  );
  return JSON.parse(signature ?? "null")?.[key];
}

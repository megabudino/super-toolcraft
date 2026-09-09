import { expect, type Page } from "@playwright/test";

import {
  DONUT_CANVAS_SELECTOR,
  fieldFor,
  openDonut,
  setSliderValue,
} from "./donut-test-helpers";

export async function verifyDonutRenderPolicy(page: Page): Promise<void> {
  await openDonut(page);
  const canvas = page.locator(DONUT_CANVAS_SELECTOR);
  const readShadowUpdates = async () =>
    Number((await canvas.getAttribute("data-donut-shadow-map-updates")) ?? -1);
  const initialShadowUpdates = await readShadowUpdates();
  const initialSignature = await canvas.getAttribute(
    "data-donut-output-signature",
  );
  const expectedAntialias = await page.evaluate(() =>
    window.devicePixelRatio < 1.5 ? "true" : "false",
  );

  expect(initialShadowUpdates).toBeGreaterThan(0);
  await expect(canvas).toHaveAttribute(
    "data-donut-drawing-buffer-preserved",
    "true",
  );
  await expect(canvas).toHaveAttribute(
    "data-donut-antialias",
    expectedAntialias,
  );

  await setSliderValue(fieldFor(page, "material.donut.roughness"), 0.2);
  await expect(canvas).not.toHaveAttribute(
    "data-donut-output-signature",
    initialSignature ?? "",
  );
  await expect.poll(readShadowUpdates).toBe(initialShadowUpdates);

  await setSliderValue(fieldFor(page, "donut.thickness"), 1.2);
  await expect
    .poll(readShadowUpdates)
    .toBeGreaterThan(initialShadowUpdates);
  const afterGeometryUpdate = await readShadowUpdates();

  await fieldFor(page, "studio.shadowsEnabled").getByRole("switch").click();
  await expect.poll(readShadowUpdates).toBe(afterGeometryUpdate);
  await fieldFor(page, "studio.shadowsEnabled").getByRole("switch").click();
  await expect
    .poll(readShadowUpdates)
    .toBeGreaterThan(afterGeometryUpdate);
}

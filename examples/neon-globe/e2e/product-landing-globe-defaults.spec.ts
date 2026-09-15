import type { Page } from "@playwright/test";

import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
import { PREVIEW_CANVAS_SELECTOR, setRangeControl } from "./product-landing-globe-helpers";
import { expectGlobeControlOrder } from "./product-landing-globe-order-helpers";
import { expect, test } from "./toolcraft-product-test";

const numericDefaults = {
  "canvas.renderScale": 2,
  "globe.latitudeCount": 8,
  "globe.meridianCount": 16,
  "globe.lineWidth": 1.5,
  "effects.crtIntensity": 100,
  "bands.distance": 1,
  "bands.dotSize": 1.25,
  "bands.columnSpacing": 3.5,
  "bands.band1.position": 69,
  "bands.band1.width": 17,
  "bands.band4.position": 46,
  "bands.band4.width": 24,
  "bands.band2.position": 6,
  "bands.band2.width": 50,
  "bands.band3.position": -30,
  "bands.band3.width": 16,
  "logos.holdSeconds": 3,
  "logos.speed": 2.5,
  "logos.dxc.finalPosition": 60,
  "logos.zillow.finalPosition": 68,
  "logos.meta.finalPosition": 71,
  "logos.prada.finalPosition": 76,
  "logos.dxc.scale": 100,
  "logos.zillow.scale": 100,
  "logos.meta.scale": 100,
  "logos.prada.scale": 100,
};

function readNumericDefaults(page: Page) {
  return page.locator('[data-toolcraft-control-target]').evaluateAll((controls, targets) =>
    Object.fromEntries(targets.map((target) => [target, Number(controls.find((control) =>
      control.getAttribute("data-toolcraft-control-target") === target,
    )?.querySelector('input[type="range"]')?.getAttribute("aria-valuenow"))])), Object.keys(numericDefaults));
}

async function expectFixedDefaults(page: Page) {
  for (const [name, color] of [["Background color", "#000000"], ["Sphere", "#000000"], ["Lines", "#FFFFFF"]]) {
    await expect(page.getByRole("textbox", { name: `${name} hex`, exact: true })).toHaveValue(color);
  }
  for (const [target, value] of [["export.includeBackground", "true"], ["globe.outline", "true"], ["canvas.infinity", "false"]]) {
    await expect(page.locator(`[data-toolcraft-control-target="${target}"]`).getByRole("switch"))
      .toHaveAttribute("aria-checked", value);
  }
  for (const [target, value] of [["canvas.size.width", "1920"], ["canvas.size.height", "1080"]]) {
    await expect(page.locator(`[data-toolcraft-control-target="${target}"]`).getByRole("textbox")).toHaveValue(value);
  }
  for (const [target, value] of [["canvas.aspectRatio", "16:9"], ["export.image.format", "PNG"], ["export.image.resolution", "4K"]]) {
    await expect(page.locator(`[data-toolcraft-control-target="${target}"]`).getByRole("combobox")).toContainText(value);
  }
  await expectGlobeControlOrder(page);
}

test("browser: globe reset restores the current sidebar preset", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  await expect.poll(() => readNumericDefaults(page)).toEqual(numericDefaults);
  await expectFixedDefaults(page);
  for (const [target, value] of Object.entries({
    "canvas.renderScale": 1.75,
    "globe.latitudeCount": 14,
    "effects.crtIntensity": 0,
    "bands.dotSize": 2,
    "bands.band1.position": 55,
    "logos.holdSeconds": 6,
    "logos.speed": 1,
    "logos.meta.finalPosition": 45,
    "logos.prada.scale": 75,
  })) {
    await setRangeControl(page.locator(`[data-toolcraft-control-target="${target}"]`), value);
  }
  const restored = await expectToolcraftAcceptanceOutcome(
    () => readNumericDefaults(page),
    () => page.getByRole("button", { name: "Reset controls", exact: true }).click(),
    { requirementId: "globe.default-preset", evidenceType: "command-side-effect", stabilityIntervalMs: 0 },
  );
  expect(restored).toEqual(numericDefaults);
  await expectFixedDefaults(page);
  await expect.poll(() => page.locator(PREVIEW_CANVAS_SELECTOR).evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    let visiblePixels = 0;
    for (let i = 0; i < pixels.length; i += 16) if (pixels[i] > 30) visiblePixels += 1;
    return visiblePixels;
  })).toBeGreaterThan(100);
  await page.screenshot({ path: ".toolcraft/browser-artifacts/sidebar-defaults.png" });
});

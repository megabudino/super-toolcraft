import type { Locator, Page } from "@playwright/test";

import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { pauseGrassPlayback } from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const dependentControls = [
  ["surface.bendDepth", "grass.surface-bend-depth"],
  ["surface.bendWidth", "grass.surface-bend-width"],
  ["surface.bendRoundness", "grass.surface-bend-roundness"],
  ["surface.bendSmoothness", "grass.surface-bend-smoothness"],
] as const;

async function setSwitch(control: Locator, enabled: boolean): Promise<void> {
  const toggle = control.getByRole("switch");
  const current = (await toggle.getAttribute("aria-checked")) === "true";
  if (current !== enabled) await toggle.click({ force: true });
  await expect(toggle).toHaveAttribute("aria-checked", String(enabled));
}

async function setSliderEndpoint(
  page: Page,
  target: string,
  key: "End" | "Home",
): Promise<void> {
  const control = page.locator(`[data-toolcraft-control-target="${target}"]`);
  const slider = control.getByRole("slider").first();
  await expect(slider).toBeVisible();
  const current = await slider.getAttribute("aria-valuenow");
  await slider.focus();
  await slider.press(key);
  await expect(slider).not.toHaveAttribute("aria-valuenow", current ?? "");
}

async function readMinimumHeight(page: Page): Promise<number> {
  const value = await page
    .locator('[data-slot="grass-live-preview"]')
    .getAttribute("data-grass-ground-minimum-height");
  const parsed = Number(value);
  expect(Number.isFinite(parsed)).toBe(true);
  return parsed;
}

test("Surface Bend deforms the perimeter and keeps every layer inside", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "toolcraft:grass-world:state:v22",
      JSON.stringify({
        state: {
          values: {
            "canvas.renderScale": 1,
            "field.densityMax": 500,
            "grass.enabled": false,
            "lawn.enabled": false,
            "lawn.densityMax": 1000,
            "preview.bladeCount": 300,
            "preview.lawnBladeCount": 1000,
            "scan.boulder.enabled": false,
            "scan.rocks.enabled": false,
            "scan.tufted.enabled": false,
            "scan.white.enabled": false,
            "scan.wild.enabled": false,
            "scan.yellow.enabled": false,
          },
        },
        version: 22,
      }),
    );
  });
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const canvas = page.locator('[data-slot="grass-webgl-canvas"]');
  await expect(canvas).toHaveAttribute("data-grass-frame-signature", /.+/u, {
    timeout: 180_000,
  });
  await expect(canvas).not.toHaveAttribute(
    "data-grass-environment-signature",
    "hdri-loading",
    { timeout: 60_000 },
  );
  await pauseGrassPlayback(page);
  await expect
    .poll(
      async () =>
        Number(await canvas.getAttribute("data-grass-rendered-blade-count")),
      { timeout: 60_000 },
    )
    .toBeLessThanOrEqual(1500);
  const output = page.locator('[data-slot="grass-live-preview"]');
  const bendControl = page.locator(
    '[data-toolcraft-control-target="surface.bendEnabled"]',
  );

  await expect(output).toHaveAttribute(
    "data-grass-surface-bend-signature",
    /.+/u,
    { timeout: 30_000 },
  );
  const enabledGroundKey = await output.getAttribute(
    "data-grass-ground-geometry-key",
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("surface.bendEnabled", async (control) => {
      await setSwitch(control, false);
    }),
    {
      requirementId: "grass.surface-bend-enabled",
      timeoutMs: 20_000,
    },
  );
  await expect(output).toHaveAttribute(
    "data-grass-surface-bend-signature",
    /"enabled":false/u,
  );
  await expect(output).not.toHaveAttribute(
    "data-grass-ground-geometry-key",
    enabledGroundKey ?? "",
  );

  await setSwitch(bendControl, true);
  for (const [target, requirementId] of dependentControls) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("surface.bendEnabled", async (control) => {
        await setSwitch(control, false);
        await expect(
          page.locator(`[data-toolcraft-control-target="${target}"]`),
        ).toHaveCount(0);
      }),
      session.controlAction("surface.bendEnabled", async (control) => {
        await setSwitch(control, true);
      }),
      { requirementId, target, timeoutMs: 15_000 },
    );
  }

  const minimumBeforeDepth = await readMinimumHeight(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("surface.bendDepth", async () => {
      await setSliderEndpoint(page, "surface.bendDepth", "End");
      await expect
        .poll(() => readMinimumHeight(page), { timeout: 20_000 })
        .toBeLessThan(minimumBeforeDepth - 0.5);
    }),
    { requirementId: "grass.surface-bend-depth", timeoutMs: 25_000 },
  );

  for (const { id, key, target } of [
    { id: "grass.surface-bend-width", key: "End", target: "surface.bendWidth" },
    {
      id: "grass.surface-bend-roundness",
      key: "Home",
      target: "surface.bendRoundness",
    },
    {
      id: "grass.surface-bend-smoothness",
      key: "Home",
      target: "surface.bendSmoothness",
    },
  ] as const) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async () => {
        await setSliderEndpoint(page, target, key);
      }),
      { requirementId: id, timeoutMs: 25_000 },
    );
  }

  await expect(output).toHaveAttribute(
    "data-grass-surface-bend-inner-radius",
    "0.6",
  );
  const groundKeyBeforeViewport = await output.getAttribute(
    "data-grass-ground-geometry-key",
  );
  await page.getByRole("button", { name: "Zoom in" }).click({ force: true });
  await expect(output).toHaveAttribute(
    "data-grass-ground-geometry-key",
    groundKeyBeforeViewport ?? "",
  );
});

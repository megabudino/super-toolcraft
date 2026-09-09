import type { Locator } from "@playwright/test";

import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import {
  grassSurfaceLightingConditionalControls,
  grassSurfaceLightingControls,
} from "./grass-basic-control-fixtures";
import { prepareGrassSession } from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";

const hiddenSurfaceLayers = [
  "grass.enabled",
  "lawn.enabled",
  "scan.tufted.enabled",
  "scan.wild.enabled",
  "scan.white.enabled",
  "scan.yellow.enabled",
  "scan.rocks.enabled",
  "scan.boulder.enabled",
] as const;

async function toggleSlider(control: Locator): Promise<void> {
  const slider = control.getByRole("slider").first();
  const current = Number(await slider.inputValue());
  const maximum = Number(await slider.getAttribute("max"));
  await slider.focus();
  await slider.press(current >= maximum ? "Home" : "End");
}

test("surface lighting controls brighten terrain and toggle cast shadows", async ({
  page,
}) => {
  test.setTimeout(600_000);
  const session = await prepareGrassSession(page, { pausePlayback: false });

  await page.evaluate((targets) => {
    for (const target of targets) {
      const control = document.querySelector(
        `[data-toolcraft-control-target="${target}"] [role="switch"]`,
      );
      if (control?.getAttribute("aria-checked") === "true") {
        (control as HTMLElement).click();
      }
    }
  }, hiddenSurfaceLayers);

  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) {
    await pause.evaluate((button: HTMLButtonElement) => button.click());
  }

  for (const [
    requirementId,
    target,
  ] of grassSurfaceLightingConditionalControls) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("field.showGround", async (field) => {
        await field.getByRole("switch").click();
      }),
      session.controlAction("field.showGround", async (field) => {
        await field.getByRole("switch").click();
      }),
      { requirementId, target, timeoutMs: 10_000 },
    );
  }

  for (const [requirementId, target, kind] of grassSurfaceLightingControls) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        if (kind === "switch") {
          await field.getByRole("switch").click();
          return;
        }
        await toggleSlider(field);
      }),
      {
        baselineStabilityIntervalMs: 12,
        baselineStabilitySamples: 2,
        requirementId,
        stabilityIntervalMs: 18,
        stabilitySamples: 2,
        timeoutMs: 15_000,
      },
    );
  }
});

import type { Locator } from "@playwright/test";

import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import {
  grassGroundShadowConditionalControls,
  grassGroundShadowControls,
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
  const minimum = Number(await slider.getAttribute("min"));
  await slider.focus();
  await slider.press(current <= minimum ? "End" : "Home");
}

test("Ground Shadow controls move and style the complete underlay", async ({
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

  const background = page.locator(
    '[data-toolcraft-control-target="scene.background"]',
  );
  const backgroundHex = background.getByRole("textbox", {
    name: "Background hex",
  });
  await backgroundHex.fill("#A7B8A0");
  await backgroundHex.press("Enter");

  for (const [requirementId, target] of
    grassGroundShadowConditionalControls) {
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

  for (const [requirementId, target, kind] of grassGroundShadowControls) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        if (kind === "color") {
          const hex = field.getByRole("textbox", { name: "Color hex" });
          await hex.fill("#6D204B");
          await hex.press("Enter");
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

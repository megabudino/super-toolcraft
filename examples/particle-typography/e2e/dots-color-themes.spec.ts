import type { Locator, Page } from "@playwright/test";

import {
  createDotColorThemePaletteValue,
  DOT_COLOR_THEMES,
} from "../src/app/dots/dots-theme";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { selectFiniteCanvas } from "./dots-acceptance-support";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const outputSelector = '[data-dots-renderer="true"]';
const themeControlSelector = '[data-toolcraft-control-target="actions.colorTheme"]';

async function pausePlayback(page: Page): Promise<void> {
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) await pause.click();
}

async function readRenderedStopColors(output: Locator): Promise<string[]> {
  const encoded = await output.getAttribute("data-dot-gradient");
  if (!encoded) return [];
  const gradient = JSON.parse(encoded) as { stops: Array<{ color: string }> };
  return gradient.stops.map(({ color }) => color);
}

test("browser: color theme actions restyle palette and background", async ({ page }) => {
  page.setDefaultTimeout(8_000);
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await selectFiniteCanvas(page);
  const session = await createToolcraftBrowserProofSession(page);
  await pausePlayback(page);

  const output = page.locator(outputSelector);
  const themeControl = page.locator(themeControlSelector);
  await expect(output).toBeVisible();
  await expect(themeControl).toBeVisible();

  for (const theme of DOT_COLOR_THEMES) {
    await expect(
      themeControl.getByRole("button", { name: theme.label, exact: true }),
    ).toBeVisible();
  }

  const spectrum = DOT_COLOR_THEMES[0]!;
  const neon = DOT_COLOR_THEMES[1]!;
  const spectrumColors = createDotColorThemePaletteValue(spectrum).stops.map(
    ({ color }) => color,
  );
  await expect.poll(() => readRenderedStopColors(output)).toEqual(spectrumColors);
  await expect(output).toHaveAttribute(
    "data-background-color",
    spectrum.background,
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("actions.colorTheme", (control) =>
      control.getByRole("button", { name: neon.label, exact: true }).click(),
    ),
    {
      requirementId: "actions.colorTheme",
      selector: outputSelector,
      stabilityIntervalMs: 60,
      timeoutMs: 20_000,
    },
  );
  await expect.poll(() => readRenderedStopColors(output)).toEqual(
    createDotColorThemePaletteValue(neon).stops.map(({ color }) => color),
  );
  await expect(output).toHaveAttribute("data-background-color", neon.background);

  for (const theme of [...DOT_COLOR_THEMES.slice(2), spectrum]) {
    await themeControl
      .getByRole("button", { name: theme.label, exact: true })
      .click();
    await expect.poll(() => readRenderedStopColors(output)).toEqual(
      createDotColorThemePaletteValue(theme).stops.map(({ color }) => color),
    );
    await expect(output).toHaveAttribute(
      "data-background-color",
      theme.background,
    );
  }

  const paletteControl = page.locator(
    '[data-toolcraft-control-target="appearance.palette"]',
  );
  const stopHex = paletteControl.getByRole("textbox", { name: "Stop 1 hex" });
  await stopHex.scrollIntoViewIfNeeded();
  await stopHex.fill("#123456");
  await stopHex.press("Enter");
  await expect
    .poll(() => readRenderedStopColors(output))
    .toContain("#123456");
});

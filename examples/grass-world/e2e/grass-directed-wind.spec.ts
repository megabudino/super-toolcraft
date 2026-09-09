import type { Page } from "@playwright/test";

import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import {
  disableGrassScanLayers,
  grassLayerVisibilityTargets,
  prepareGrassSession,
  setGrassLayerVisibility,
} from "./grass-test-helpers";
import {
  expectToolcraftDiscreteSliderMarkers,
  expectToolcraftSegmentedControlCellsPreservePadding,
} from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

async function clickModeButton(control: ReturnType<Page["locator"]>, label: string) {
  await control
    .getByRole("button", { name: label, exact: true })
    .click({ force: true });
}

const windTargets = [
  ["wind.directionAngle", "grass.wind-direction", "Static", "Wind"],
  ["wind.swayStrength", "grass.sway-strength", "Static", "Sway"],
  ["wind.swayCycles", "grass.sway-cycles", "Static", "Sway"],
  ["wind.swayVariation", "grass.sway-variation", "Static", "Sway"],
  ["wind.strength", "grass.wind-strength", "Sway", "Wind"],
  ["wind.flow", "grass.wind-flow", "Sway", "Wind"],
  ["wind.gustCycles", "grass.gust-cycles", "Sway", "Wind"],
  ["wind.gustWidth", "grass.gust-width", "Sway", "Wind"],
  ["wind.noiseStrength", "grass.noise-strength", "Sway", "Wind"],
  ["wind.noiseScale", "grass.noise-scale", "Sway", "Wind"],
  ["wind.noiseDetail", "grass.noise-detail", "Sway", "Wind"],
  ["wind.seed", "grass.wind-seed", "Sway", "Wind"],
  ["wind.rampUp", "grass.wind-ramp-up", "Wind", "Simulate"],
  ["wind.release", "grass.wind-release", "Wind", "Simulate"],
  [
    "wind.directionResponse",
    "grass.wind-direction-response",
    "Wind",
    "Simulate",
  ],
] as const;

async function setSliderValue(
  page: Page,
  target: string,
  value: number,
): Promise<void> {
  const control = page.locator(`[data-toolcraft-control-target="${target}"]`);
  const edit = control.getByRole("button", { name: /^Edit .+ value$/u });
  await edit.click();
  const input = control.getByRole("textbox");
  await input.fill(String(value));
  await input.press("Enter");
}

async function setTimelineFraction(
  page: Page,
  fraction: number,
): Promise<void> {
  const timelineSwitch = page.locator(
    '[data-toolcraft-control-target="panels.timeline.extended"] [role="switch"]',
  );
  if (
    (await timelineSwitch.count()) > 0 &&
    (await timelineSwitch.getAttribute("aria-checked")) === "false"
  ) {
    await timelineSwitch.click();
  }
  const slider = page.getByRole("slider", { name: "Playback position" });
  await expect(slider).toBeVisible();
  const bounds = await slider.boundingBox();
  expect(bounds).not.toBeNull();
  await slider.click({
    position: {
      x: Math.max(1, bounds!.width * fraction),
      y: bounds!.height / 2,
    },
  });
}

async function chooseMode(page: Page, label: string): Promise<void> {
  await clickModeButton(
    page.locator('[data-toolcraft-control-target="wind.mode"]'),
    label,
  );
}

async function ensurePlaybackRunning(page: Page): Promise<void> {
  const play = page.getByRole("button", { name: "Play playback" });
  if ((await play.count()) > 0) await play.click();
}

test("grass wind modes blend ambient sway gusts and smooth pointer simulation", async ({
  page,
}) => {
  test.setTimeout(1_200_000);
  const session = await prepareGrassSession(page);
  const output = page.locator('[data-slot="grass-live-preview"]');
  const canvas = page.locator('[data-slot="grass-webgl-canvas"]');
  const mode = page.locator('[data-toolcraft-control-target="wind.mode"]');

  await disableGrassScanLayers(page);
  await setGrassLayerVisibility(page, "scan.boulder.enabled", false);
  await setGrassLayerVisibility(page, "lawn.enabled", false);

  await expect(output).toHaveAttribute("data-grass-wind-mode", "static");
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Mode", {
    requirementId: "grass.wind-mode",
    target: "wind.mode",
  });
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("wind.mode", async (control) => {
      for (const [label, value] of [
        ["Static", "static"],
        ["Sway", "sway"],
        ["Wind", "wind"],
        ["Simulate", "simulation"],
      ] as const) {
        await clickModeButton(control, label);
        await expect(output).toHaveAttribute("data-grass-wind-mode", value);
      }
    }),
    { requirementId: "grass.wind-mode", timeoutMs: 30_000 },
  );

  for (const [target, requirementId, hiddenMode, visibleMode] of windTargets) {
    await chooseMode(page, visibleMode);
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("wind.mode", async (control) => {
        await clickModeButton(control, hiddenMode);
      }),
      session.controlAction("wind.mode", async (control) => {
        await clickModeButton(control, visibleMode);
      }),
      { requirementId, target, timeoutMs: 15_000 },
    );
  }

  await chooseMode(page, "Sway");
  await expectToolcraftDiscreteSliderMarkers(
    page,
    "wind.swayCycles",
    "grass.sway-cycles",
  );
  await chooseMode(page, "Wind");
  await expectToolcraftDiscreteSliderMarkers(
    page,
    "wind.gustCycles",
    "grass.gust-cycles",
  );

  const sliderFixtures = [
    ["wind.directionAngle", "grass.wind-direction", "Wind", 180],
    ["wind.swayStrength", "grass.sway-strength", "Sway", 32],
    ["wind.swayCycles", "grass.sway-cycles", "Sway", 4],
    ["wind.swayVariation", "grass.sway-variation", "Sway", 100],
    ["wind.strength", "grass.wind-strength", "Wind", 100],
    ["wind.flow", "grass.wind-flow", "Wind", 100],
    ["wind.gustCycles", "grass.gust-cycles", "Wind", 4],
    ["wind.gustWidth", "grass.gust-width", "Wind", 85],
    ["wind.noiseStrength", "grass.noise-strength", "Wind", 0],
    ["wind.noiseScale", "grass.noise-scale", "Wind", 5],
    ["wind.noiseDetail", "grass.noise-detail", "Wind", 100],
    ["wind.seed", "grass.wind-seed", "Wind", 128],
    ["wind.rampUp", "grass.wind-ramp-up", "Simulate", 0.1],
    ["wind.release", "grass.wind-release", "Simulate", 0.1],
    [
      "wind.directionResponse",
      "grass.wind-direction-response",
      "Simulate",
      1.5,
    ],
  ] as const;
  for (const [target, requirementId, modeLabel, value] of sliderFixtures) {
    await chooseMode(page, modeLabel);
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (_control, currentPage) => {
        await setSliderValue(currentPage, target, value);
      }),
      { requirementId, timeoutMs: 25_000 },
    );
  }

  await chooseMode(page, "Static");
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) await pause.click();
  await setTimelineFraction(page, 0.18);
  const firstStatic = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL("image/png"),
  );
  await setTimelineFraction(page, 0.73);
  const secondStatic = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL("image/png"),
  );
  expect(secondStatic).toBe(firstStatic);

  await chooseMode(page, "Sway");
  await setTimelineFraction(page, 0.18);
  const firstSway = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL("image/png"),
  );
  await setTimelineFraction(page, 0.73);
  const secondSway = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL("image/png"),
  );
  expect(secondSway).not.toBe(firstSway);

  await chooseMode(page, "Wind");
  await setSliderValue(page, "wind.directionAngle", 180);
  await expect(output).toHaveAttribute(
    "data-grass-wind-authored-direction-angle",
    "180",
  );
  await expect(output).toHaveAttribute(
    "data-grass-wind-direction-vector",
    "[-1,0]",
  );
  await setTimelineFraction(page, 0.18);
  const firstWind = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL("image/png"),
  );
  await setTimelineFraction(page, 0.73);
  const secondWind = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL("image/png"),
  );
  expect(secondWind).not.toBe(firstWind);

  await chooseMode(page, "Simulate");
  await setSliderValue(page, "wind.rampUp", 0.1);
  await setSliderValue(page, "wind.release", 0.1);
  await setSliderValue(page, "wind.directionResponse", 1.5);
  await ensurePlaybackRunning(page);
  await expect(output).toHaveAttribute("data-grass-wind-activation", "0.0000");
  const outputBox = await output.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { height: rect.height, width: rect.width, x: rect.x, y: rect.y };
  });
  const pointerLeft = outputBox.x + outputBox.width * 0.38;
  const pointerRight = outputBox.x + outputBox.width * 0.64;
  const pointerY = outputBox.y + outputBox.height * 0.6;
  await page.mouse.move(pointerLeft, pointerY);
  await expect(output).toHaveAttribute("data-grass-pointer-direction-hit", "true");
  await expect
    .poll(async () => Number(await output.getAttribute("data-grass-wind-activation")))
    .toBeGreaterThan(0.05);
  const beforeDirection = Number(
    await output.getAttribute("data-grass-wind-direction-angle"),
  );
  await page.mouse.move(pointerRight, pointerY, { steps: 8 });
  await expect(output).toHaveAttribute(
    "data-grass-pointer-direction-observed",
    "true",
  );
  await expect(output).toHaveAttribute("data-grass-wind-pointer-active", "true");
  await expect
    .poll(async () => Number(await output.getAttribute("data-grass-wind-direction-angle")))
    .not.toBe(beforeDirection);
  await expect(output).toHaveAttribute(
    "data-grass-wind-authored-direction-angle",
    "180",
  );
  await page.mouse.move(outputBox.x + 2, outputBox.y + 2);
  await expect(output).toHaveAttribute("data-grass-pointer-direction-hit", "false");
  await expect
    .poll(async () => Number(await output.getAttribute("data-grass-wind-activation")))
    .toBeLessThan(0.05);

  await chooseMode(page, "Wind");
  const pauseAgain = page.getByRole("button", { name: "Pause playback" });
  if ((await pauseAgain.count()) > 0) await pauseAgain.click();
  for (const activeTarget of [
    "lawn.enabled",
    "scan.tufted.enabled",
    "scan.wild.enabled",
    "scan.white.enabled",
    "scan.yellow.enabled",
  ] as const) {
    for (const target of grassLayerVisibilityTargets) {
      await setGrassLayerVisibility(page, target, target === activeTarget);
    }
    await setTimelineFraction(page, 0.18);
    const firstScanFrame = await canvas.evaluate((element) =>
      (element as HTMLCanvasElement).toDataURL("image/png"),
    );
    await setTimelineFraction(page, 0.73);
    const secondScanFrame = await canvas.evaluate((element) =>
      (element as HTMLCanvasElement).toDataURL("image/png"),
    );
    expect(secondScanFrame).not.toBe(firstScanFrame);
  }

  await clickModeButton(mode, "Static");
  await expect(output).toHaveAttribute("data-grass-wind-mode", "static");
});

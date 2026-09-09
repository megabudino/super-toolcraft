import type { Locator, Page } from "@playwright/test";

import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';

async function toggleSlider(control: Locator): Promise<void> {
  const slider = control.getByRole("slider").first();
  const current = Number(await slider.inputValue());
  const maximum = Number(await slider.getAttribute("max"));
  await slider.focus();
  await slider.press(current >= maximum ? "Home" : "End");
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

test("grass lawn cover and tall grass configure independently", async ({
  page,
}) => {
  test.setTimeout(420_000);
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  const session = await createToolcraftBrowserProofSession(page);
  const play = page.getByRole("button", { name: "Play playback" });
  if ((await play.count()) > 0) await play.click();
  const canvas = page.locator(canvasSelector);
  await expect(canvas).toHaveAttribute("data-grass-layer-lawn", "true", {
    timeout: 15_000,
  });
  await expect(canvas).toHaveAttribute("data-grass-layer-tall", "true");
  const pauseInitialPlayback = page.getByRole("button", {
    name: "Pause playback",
  });
  if ((await pauseInitialPlayback.count()) > 0) {
    await pauseInitialPlayback.click();
  }
  await expect(canvas).toHaveAttribute(
    "data-grass-preview-representation",
    "pbr-clumps",
  );
  for (const kind of ["tufted", "wild", "white", "yellow", "rocks"]) {
    const scanSwitch = page
      .locator(`[data-toolcraft-control-target="scan.${kind}.enabled"]`)
      .getByRole("switch");
    if ((await scanSwitch.getAttribute("aria-checked")) === "true") {
      await scanSwitch.click();
    }
  }
  await expect
    .poll(
      async () =>
        Number(
          await canvas.getAttribute("data-grass-rendered-lawn-blade-count"),
        ),
      { timeout: 20_000 },
    )
    .toBeGreaterThan(0);

  const initialLawnCount = await canvas.getAttribute(
    "data-grass-rendered-lawn-blade-count",
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("grass.enabled", async (field) => {
      await field.getByRole("switch").click();
    }),
    { requirementId: "grass.tall-enabled", timeoutMs: 15_000 },
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-rendered-lawn-blade-count",
    initialLawnCount!,
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-rendered-tall-blade-count",
    "0",
  );
  await page
    .locator('[data-toolcraft-control-target="grass.enabled"]')
    .getByRole("switch")
    .click();

  const initialTallCount = await canvas.getAttribute(
    "data-grass-rendered-tall-blade-count",
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("lawn.enabled", async (field) => {
      await field.getByRole("switch").click();
    }),
    { requirementId: "grass.lawn-enabled", timeoutMs: 15_000 },
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-rendered-tall-blade-count",
    initialTallCount!,
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-rendered-lawn-blade-count",
    "0",
  );
  await page
    .locator('[data-toolcraft-control-target="lawn.enabled"]')
    .getByRole("switch")
    .click();

  const lawnControls = [
    ["grass.lawn-density", "lawn.densityMax"],
    ["grass.lawn-distance", "lawn.distanceMin"],
    ["grass.lawn-offset", "lawn.depthOffset"],
    ["grass.lawn-seed", "lawn.seed"],
    ["grass.lawn-resolution", "lawn.curveResolution"],
    ["grass.lawn-thickness", "lawn.thickness"],
    ["grass.lawn-taper", "lawn.taperEnd"],
    ["grass.lawn-tilt", "lawn.tilt2d"],
    ["grass.lawn-3d", "lawn.use3d"],
  ] as const;

  for (const [requirementId, target] of lawnControls) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("lawn.enabled", async (field) => {
        await field.getByRole("switch").click();
      }),
      session.controlAction("lawn.enabled", async (field) => {
        await field.getByRole("switch").click();
      }),
      { requirementId, target, timeoutMs: 12_000 },
    );
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        if (target === "lawn.use3d") {
          await field.getByRole("switch").click();
          return;
        }
        const slider = field.getByRole("slider").first();
        await slider.focus();
        await slider.press(target === "lawn.densityMax" ? "ArrowLeft" : "End");
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

  const heightObservation = session.observe((root) => {
    const output = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    return JSON.parse(output?.dataset.grassLawnHeightRange ?? "null") as [
      number,
      number,
    ];
  });
  await expectToolcraftCompoundControlPartOutcome(
    heightObservation,
    session.controlAction("lawn.heightRange", async (field) => {
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("ArrowRight");
    }),
    [0.07, 0.12],
    {
      part: "rangeSlider.lower",
      requirementId: "grass.lawn-height",
      timeoutMs: 12_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    heightObservation,
    session.controlAction("lawn.heightRange", async (field) => {
      const upper = field.getByRole("slider").nth(1);
      await upper.focus();
      await upper.press("End");
    }),
    [0.07, 0.55],
    {
      part: "rangeSlider.upper",
      requirementId: "grass.lawn-height",
      timeoutMs: 12_000,
    },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("lawn.heightRange", async (field) => {
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("Home");
    }),
    { requirementId: "grass.lawn-height", timeoutMs: 12_000 },
  );

  for (const [requirementId, target] of [
    ["grass.lawn-pbr-roughness", "lawn.pbrRoughness"],
  ] as const) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        await toggleSlider(field);
      }),
      { requirementId, timeoutMs: 15_000 },
    );
  }

  await expectToolcraftConditionalControlVisibility(
    session,
    session.controlAction("lawn.enabled", async (field) => {
      await field.getByRole("switch").click();
    }),
    session.controlAction("lawn.enabled", async (field) => {
      await field.getByRole("switch").click();
    }),
    {
      requirementId: "grass.lawn-color-variation",
      target: "lawn.colorVariation",
      timeoutMs: 12_000,
    },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("lawn.colorVariation", async (field) => {
      await toggleSlider(field);
    }),
    { requirementId: "grass.lawn-color-variation", timeoutMs: 15_000 },
  );

  for (const [requirementId, target, key] of [
    ["grass.lawn-color-contrast", "lawn.colorContrast", "End"],
    ["grass.lawn-color-saturation", "lawn.colorSaturation", "Home"],
  ] as const) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("lawn.enabled", async (field) => {
        await field.getByRole("switch").click();
      }),
      session.controlAction("lawn.enabled", async (field) => {
        await field.getByRole("switch").click();
      }),
      { requirementId, target, timeoutMs: 12_000 },
    );
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        const slider = field.getByRole("slider");
        await slider.focus();
        await slider.press(key);
      }),
      { requirementId, timeoutMs: 15_000 },
    );
  }

  const gradientObservation = session.observe((root) => {
    const output = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    return JSON.parse(output?.dataset.grassLawnGradient ?? "null");
  });
  const gradientDefaults = {
    angle: 90,
    colors: ["#173d20", "#2D5B20", "#82b84c"],
    opacities: [1, 1, 1],
    positions: [0, 0.62, 1],
    type: "linear",
  };
  await expectToolcraftCompoundControlPartOutcome(
    gradientObservation,
    session.controlAction("lawn.bladeGradient", async (field) => {
      const angle = field.getByRole("textbox", { name: "Gradient angle" });
      await angle.fill("25");
      await angle.press("Enter");
    }),
    { ...gradientDefaults, angle: 25 },
    {
      part: "gradient.angle",
      requirementId: "grass.lawn-gradient",
      timeoutMs: 12_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    gradientObservation,
    session.controlAction("lawn.bladeGradient", async (field, currentPage) => {
      await field.getByRole("combobox").click();
      await currentPage
        .locator('[role="listbox"]:visible [role="option"]')
        .filter({ hasText: "Radial" })
        .click();
    }),
    { ...gradientDefaults, angle: 25, type: "radial" },
    {
      part: "gradient.gradientType",
      requirementId: "grass.lawn-gradient",
      timeoutMs: 12_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    gradientObservation,
    session.controlAction("lawn.bladeGradient", async (field) => {
      const color = field.getByRole("textbox", { name: "Stop 2 hex" });
      await color.fill("#FF00FF");
      await color.press("Enter");
    }),
    {
      ...gradientDefaults,
      angle: 25,
      colors: ["#173d20", "#FF00FF", "#82b84c"],
      type: "radial",
    },
    {
      part: "gradient.stops.color",
      requirementId: "grass.lawn-gradient",
      timeoutMs: 12_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    gradientObservation,
    session.controlAction("lawn.bladeGradient", async (field) => {
      const opacity = field.getByRole("textbox", {
        name: "Stop 2 opacity",
      });
      await opacity.fill("45");
      await opacity.press("Enter");
    }),
    {
      ...gradientDefaults,
      angle: 25,
      colors: ["#173d20", "#FF00FF", "#82b84c"],
      opacities: [1, 0.45, 1],
      type: "radial",
    },
    {
      part: "gradient.stops.opacity",
      requirementId: "grass.lawn-gradient",
      timeoutMs: 12_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    gradientObservation,
    session.controlAction("lawn.bladeGradient", async (field) => {
      const position = field.getByRole("textbox", {
        name: "Stop 2 position",
      });
      await position.fill("38");
      await position.press("Enter");
    }),
    {
      ...gradientDefaults,
      angle: 25,
      colors: ["#173d20", "#FF00FF", "#82b84c"],
      opacities: [1, 0.45, 1],
      positions: [0, 0.38, 1],
      type: "radial",
    },
    {
      part: "gradient.stops.position",
      requirementId: "grass.lawn-gradient",
      timeoutMs: 12_000,
    },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("lawn.bladeGradient", async (field) => {
      const color = field.getByRole("textbox", { name: "Stop 2 hex" });
      await color.fill("#00FFFF");
      await color.press("Enter");
    }),
    { requirementId: "grass.lawn-gradient", timeoutMs: 12_000 },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("preview.lawnBladeCount", async (field) => {
      const slider = field.getByRole("slider");
      await slider.focus();
      await slider.press("Home");
    }),
    { requirementId: "grass.preview-lawn-count", timeoutMs: 12_000 },
  );

  await page
    .locator('[data-toolcraft-control-target="wind.mode"]')
    .getByRole("button", { name: "Wind", exact: true })
    .click();
  await setTimelineFraction(page, 0.18);
  const lawnBeforeWindFrame = await canvas.getAttribute(
    "data-grass-lawn-frame-signature",
  );
  const tallBeforeWindFrame = await canvas.getAttribute(
    "data-grass-tall-frame-signature",
  );
  await setTimelineFraction(page, 0.73);
  await expect
    .poll(() => canvas.getAttribute("data-grass-tall-frame-signature"))
    .not.toBe(tallBeforeWindFrame);
  await expect
    .poll(() => canvas.getAttribute("data-grass-lawn-frame-signature"))
    .not.toBe(lawnBeforeWindFrame);
});

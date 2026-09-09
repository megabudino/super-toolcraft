import type { Locator, Page } from "@playwright/test";

import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import {
  grassBasicControls,
  grassSurfaceConditionalControls,
  grassTallConditionalControls,
} from "./grass-basic-control-fixtures";
import {
  pauseGrassPlayback,
  prepareGrassSession as prepareBaseGrassSession,
  setGrassTimelinePosition,
} from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';

async function prepareGrassSession(page: Page) {
  const session = await prepareBaseGrassSession(page);
  const play = page.getByRole("button", { name: "Play playback" });
  if ((await play.count()) > 0) await play.click();
  await pauseGrassPlayback(page);
  await setGrassTimelinePosition(page, 0.31);
  await pauseGrassPlayback(page);
  return session;
}

async function toggleSlider(control: Locator): Promise<void> {
  const slider = control.getByRole("slider").first();
  const current = Number(await slider.inputValue());
  const maximum = Number(await slider.getAttribute("max"));
  await slider.focus();
  await slider.press(current >= maximum ? "Home" : "End");
}

test("grass controls change the visible field", async ({ page }) => {
  test.setTimeout(900_000);
  const session = await prepareGrassSession(page);
  for (const [requirementId, target] of grassTallConditionalControls) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("grass.enabled", async (field) => {
        await field.getByRole("switch").click();
      }),
      session.controlAction("grass.enabled", async (field) => {
        await field.getByRole("switch").click();
      }),
      { requirementId, target, timeoutMs: 10_000 },
    );
  }
  for (const [requirementId, target] of grassSurfaceConditionalControls) {
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
  for (const [requirementId, target, kind] of grassBasicControls) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        if (kind === "switch") {
          await field.getByRole("switch").click();
          return;
        }
        if (kind === "color") {
          const textbox = field.getByRole("textbox");
          await textbox.fill("#F02DAA");
          await textbox.press("Enter");
          return;
        }
        if (kind === "text") {
          const textbox = field.getByRole("textbox");
          await textbox.fill(target === "field.width" ? "16.5" : "12.5");
          await textbox.press("Enter");
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
        timeoutMs: 12_000,
      },
    );
    if (target === "field.showGround") {
      await page
        .locator('[data-toolcraft-control-target="field.showGround"]')
        .getByRole("switch")
        .click();
    }
  }
});

test("terrain height map preview and controls reshape the field", async ({
  page,
}) => {
  test.setTimeout(600_000);
  const session = await prepareGrassSession(page);
  const preview = page.getByRole("button", { name: "Move terrain height map" });
  await expect(preview).toBeVisible();
  const beforePreview = await preview.screenshot();

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("terrain.noiseOffset", async (field) => {
      const map = field.getByRole("button", {
        name: "Move terrain height map",
      });
      const bounds = await map.boundingBox();
      expect(bounds).not.toBeNull();
      await page.mouse.move(
        bounds!.x + bounds!.width * 0.72,
        bounds!.y + bounds!.height * 0.46,
      );
      await page.mouse.down();
      await page.mouse.move(
        bounds!.x + bounds!.width * 0.26,
        bounds!.y + bounds!.height * 0.68,
        { steps: 8 },
      );
      await page.mouse.up();
    }),
    {
      baselineStabilityIntervalMs: 12,
      baselineStabilitySamples: 2,
      requirementId: "grass.terrain-noise-preview",
      stabilityIntervalMs: 18,
      stabilitySamples: 2,
      timeoutMs: 15_000,
    },
  );
  await expect
    .poll(async () => Buffer.compare(beforePreview, await preview.screenshot()))
    .not.toBe(0);

  const beforeScalePreview = await preview.screenshot();
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("terrain.noiseScale", async (field) => {
      const slider = field.getByRole("slider");
      await slider.focus();
      await slider.press("Home");
    }),
    {
      baselineStabilityIntervalMs: 12,
      baselineStabilitySamples: 2,
      requirementId: "grass.terrain-scale",
      stabilityIntervalMs: 18,
      stabilitySamples: 2,
      timeoutMs: 15_000,
    },
  );
  await expect
    .poll(async () =>
      Buffer.compare(beforeScalePreview, await preview.screenshot()),
    )
    .not.toBe(0);

  const levelsObservation = session.observe((root) => {
    const canvas = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    return JSON.parse(canvas?.dataset.grassTerrainHeightLevels ?? "null") as [
      number,
      number,
    ];
  });
  const beforeLevelsPreview = await preview.screenshot();
  await expectToolcraftCompoundControlPartOutcome(
    levelsObservation,
    session.controlAction("terrain.heightLevels", async (field) => {
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("ArrowRight");
    }),
    [0.01, 1],
    {
      part: "rangeSlider.lower",
      requirementId: "grass.terrain-height-levels",
      timeoutMs: 12_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    levelsObservation,
    session.controlAction("terrain.heightLevels", async (field) => {
      const upper = field.getByRole("slider").nth(1);
      await upper.focus();
      await upper.press("ArrowLeft");
    }),
    [0.01, 0.99],
    {
      part: "rangeSlider.upper",
      requirementId: "grass.terrain-height-levels",
      timeoutMs: 12_000,
    },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("terrain.heightLevels", async (field) => {
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("ArrowRight");
    }),
    {
      requirementId: "grass.terrain-height-levels",
      timeoutMs: 12_000,
    },
  );
  await expect
    .poll(async () =>
      Buffer.compare(beforeLevelsPreview, await preview.screenshot()),
    )
    .not.toBe(0);

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("terrain.maxHeight", async (field) => {
      const slider = field.getByRole("slider");
      await slider.focus();
      await slider.press("Home");
    }),
    { requirementId: "grass.terrain-max-height", timeoutMs: 12_000 },
  );
  await expect(page.locator(canvasSelector)).toHaveAttribute(
    "data-grass-terrain-max-height",
    "0",
  );
});

test("grass top-facing controls reveal and filter slope coverage", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const session = await prepareGrassSession(page);
  const topFacingSwitch = page
    .locator('[data-toolcraft-control-target="field.topFacingOnly"]')
    .getByRole("switch");
  if ((await topFacingSwitch.getAttribute("aria-checked")) === "false") {
    await topFacingSwitch.click();
  }

  for (const [requirementId, target] of [
    ["grass.top-facing-coverage", "field.topFacingCoverage"],
    ["grass.top-facing-fade", "field.topFacingFade"],
  ] as const) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("field.topFacingOnly", async (field) => {
        await field.getByRole("switch").click();
      }),
      session.controlAction("field.topFacingOnly", async (field) => {
        await field.getByRole("switch").click();
      }),
      { requirementId, target, timeoutMs: 8_000 },
    );
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        const slider = field.getByRole("slider");
        await slider.focus();
        await slider.press("Home");
      }),
      {
        baselineStabilityIntervalMs: 12,
        requirementId,
        stabilityIntervalMs: 18,
        timeoutMs: 10_000,
      },
    );
  }
});

test("grass blade height range changes visible growth", async ({ page }) => {
  test.setTimeout(90_000);
  const session = await prepareGrassSession(page);
  const heightObservation = session.observe((root) => {
    const canvas = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    return JSON.parse(canvas?.dataset.grassHeightRange ?? "null") as [
      number,
      number,
    ];
  });

  await expectToolcraftCompoundControlPartOutcome(
    heightObservation,
    session.controlAction("blade.heightRange", async (field) => {
      const slider = field.getByRole("slider").nth(0);
      await slider.focus();
      await slider.press("ArrowRight");
      await slider.press("ArrowRight");
    }),
    [0.3, 0.58],
    {
      part: "rangeSlider.lower",
      requirementId: "grass.height-range",
      timeoutMs: 10_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    heightObservation,
    session.controlAction("blade.heightRange", async (field) => {
      const slider = field.getByRole("slider").nth(1);
      await slider.focus();
      await slider.press("End");
    }),
    [0.3, 2.4],
    {
      part: "rangeSlider.upper",
      requirementId: "grass.height-range",
      timeoutMs: 10_000,
    },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("blade.heightRange", async (field) => {
      const slider = field.getByRole("slider").nth(0);
      await slider.focus();
      await slider.press("Home");
    }),
    { requirementId: "grass.height-range", timeoutMs: 10_000 },
  );
});

test("grass appearance controls change PBR blade shading", async ({ page }) => {
  test.setTimeout(120_000);
  const session = await prepareGrassSession(page);
  await expect(
    page.locator('[data-toolcraft-control-target="appearance.pbrEnabled"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-toolcraft-control-target="appearance.materialStyle"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-slot="grass-webgl-canvas"]'),
  ).toHaveAttribute("data-grass-pbr-enabled", "true");

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.colorVariation", async (field) => {
      const slider = field.getByRole("slider").first();
      await slider.focus();
      await slider.press("End");
    }),
    { requirementId: "grass.color-variation", timeoutMs: 10_000 },
  );

  for (const [requirementId, target, key] of [
    ["grass.tall-color-contrast", "appearance.colorContrast", "End"],
    ["grass.tall-color-saturation", "appearance.colorSaturation", "Home"],
  ] as const) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        const slider = field.getByRole("slider").first();
        await slider.focus();
        await slider.press(key);
      }),
      { requirementId, timeoutMs: 10_000 },
    );
  }

  const gradientObservation = session.observe((root) => {
    const canvas = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    return JSON.parse(canvas?.dataset.grassGradient ?? "null");
  });
  const defaults = {
    angle: 90,
    colors: ["#173822", "#56863b", "#c6d76a"],
    opacities: [1, 1, 1],
    positions: [0, 0.58, 1],
    type: "linear",
  };
  await expectToolcraftCompoundControlPartOutcome(
    gradientObservation,
    session.controlAction("appearance.bladeGradient", async (field) => {
      const angle = field.getByRole("textbox", { name: "Gradient angle" });
      await angle.fill("30");
      await angle.press("Enter");
    }),
    { ...defaults, angle: 30 },
    {
      part: "gradient.angle",
      requirementId: "grass.blade-gradient",
      timeoutMs: 10_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    gradientObservation,
    session.controlAction(
      "appearance.bladeGradient",
      async (field, currentPage) => {
        await field.getByRole("combobox").click();
        await currentPage
          .locator('[role="listbox"]:visible [role="option"]')
          .filter({ hasText: "Radial" })
          .click();
      },
    ),
    { ...defaults, angle: 30, type: "radial" },
    {
      part: "gradient.gradientType",
      requirementId: "grass.blade-gradient",
      timeoutMs: 10_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    gradientObservation,
    session.controlAction("appearance.bladeGradient", async (field) => {
      const hex = field.getByRole("textbox", { name: "Stop 2 hex" });
      await hex.fill("#FF00FF");
      await hex.press("Enter");
    }),
    {
      ...defaults,
      angle: 30,
      colors: ["#173822", "#FF00FF", "#c6d76a"],
      type: "radial",
    },
    {
      part: "gradient.stops.color",
      requirementId: "grass.blade-gradient",
      timeoutMs: 10_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    gradientObservation,
    session.controlAction("appearance.bladeGradient", async (field) => {
      const opacity = field.getByRole("textbox", { name: "Stop 2 opacity" });
      await opacity.fill("45");
      await opacity.press("Enter");
    }),
    {
      ...defaults,
      angle: 30,
      colors: ["#173822", "#FF00FF", "#c6d76a"],
      opacities: [1, 0.45, 1],
      type: "radial",
    },
    {
      part: "gradient.stops.opacity",
      requirementId: "grass.blade-gradient",
      timeoutMs: 10_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    gradientObservation,
    session.controlAction("appearance.bladeGradient", async (field) => {
      const position = field.getByRole("textbox", { name: "Stop 2 position" });
      await position.fill("40");
      await position.press("Enter");
    }),
    {
      ...defaults,
      angle: 30,
      colors: ["#173822", "#FF00FF", "#c6d76a"],
      opacities: [1, 0.45, 1],
      positions: [0, 0.4, 1],
      type: "radial",
    },
    {
      part: "gradient.stops.position",
      requirementId: "grass.blade-gradient",
      timeoutMs: 10_000,
    },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.bladeGradient", async (field) => {
      const hex = field.getByRole("textbox", { name: "Stop 2 hex" });
      await hex.fill("#00FFFF");
      await hex.press("Enter");
    }),
    { requirementId: "grass.blade-gradient", timeoutMs: 10_000 },
  );
});

import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import {
  pauseGrassPlayback,
  setGrassTimelinePosition,
} from "./grass-test-helpers";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';
const outputSelector = '[data-slot="grass-live-preview"]';

test("butterfly hover preview changes landing blend", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await pauseGrassPlayback(page);
  const canvas = page.locator(canvasSelector);
  const output = page.locator(outputSelector);
  await expect(canvas).toHaveAttribute(
    "data-grass-butterfly-resource-signature",
    "butterflies-pbr-1k",
    { timeout: 60_000 },
  );
  const bounds = await output.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(
    bounds!.x + bounds!.width / 2,
    bounds!.y + bounds!.height / 2,
  );
  await expect(output).toHaveAttribute(
    "data-grass-butterfly-hover-active",
    "true",
  );
  await expect
    .poll(
      async () =>
        Number(
          await canvas.getAttribute("data-grass-butterfly-landing-blend"),
        ),
      { timeout: 20_000 },
    )
    .toBeGreaterThan(0.8);
  await page.mouse.move(bounds!.x - 12, bounds!.y - 12);
  await expect(output).toHaveAttribute(
    "data-grass-butterfly-hover-active",
    "false",
  );
  await expect
    .poll(
      async () =>
        Number(
          await canvas.getAttribute("data-grass-butterfly-landing-blend"),
        ),
      { timeout: 20_000 },
    )
    .toBeLessThan(0.05);
});

test("butterflies fly, land on terrain hover, and take off on leave", async ({
  page,
}) => {
  test.setTimeout(360_000);
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  const session = await createToolcraftBrowserProofSession(page);
  await pauseGrassPlayback(page);
  await setGrassTimelinePosition(page, 0.37);
  const canvas = page.locator(canvasSelector);
  const output = page.locator(outputSelector);

  await expect(canvas).toHaveAttribute("data-grass-frame-signature", /.+/u, {
    timeout: 60_000,
  });
  await expect(canvas).toHaveAttribute("data-grass-layer-butterflies", "true", {
    timeout: 30_000,
  });
  await expect(canvas).toHaveAttribute(
    "data-grass-butterfly-resource-signature",
    "butterflies-pbr-1k",
    { timeout: 30_000 },
  );
  await expect(canvas).toHaveAttribute("data-grass-butterfly-texture-size", "1024");
  await expect(canvas).toHaveAttribute("data-grass-butterfly-count", "18");

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("butterflies.enabled", async (field) => {
      await field.getByRole("switch").click();
    }),
    {
      requirementId: "grass.butterflies-enabled",
      timeoutMs: 20_000,
    },
  );
  await expect(canvas).toHaveAttribute("data-grass-butterfly-count", "0");
  await page
    .locator('[data-toolcraft-control-target="butterflies.enabled"]')
    .getByRole("switch")
    .click();
  await expect(canvas).toHaveAttribute("data-grass-butterfly-count", "18");

  const dependentControls = [
    ["grass.butterflies-count", "butterflies.count"],
    ["grass.butterflies-sizeRange", "butterflies.sizeRange"],
    ["grass.butterflies-seed", "butterflies.seed"],
    ["grass.butterflies-heightRange", "butterflies.heightRange"],
    ["grass.butterflies-flightCycles", "butterflies.flightCycles"],
    ["grass.butterflies-wingCycles", "butterflies.wingCycles"],
    ["grass.butterflies-landingTime", "butterflies.landingTime"],
  ] as const;
  for (const [requirementId, target] of dependentControls) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("butterflies.enabled", async (field) => {
        await field.getByRole("switch").click();
      }),
      session.controlAction("butterflies.enabled", async (field) => {
        await field.getByRole("switch").click();
      }),
      { requirementId, target, timeoutMs: 15_000 },
    );
  }
  await expectToolcraftDiscreteSliderMarkers(
    page,
    "butterflies.flightCycles",
    "grass.butterflies-flightCycles",
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("butterflies.count", async (field) => {
      const slider = field.getByRole("slider");
      await slider.focus();
      await slider.press("End");
    }),
    {
      requirementId: "grass.butterflies-count",
      timeoutMs: 20_000,
    },
  );
  await expect(canvas).toHaveAttribute("data-grass-butterfly-count", "64");

  const sizeObservation = session.observe((root) => {
    const element = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    return (element?.dataset.grassButterflySizeRange ?? "")
      .split(":")
      .map(Number);
  });
  await expectToolcraftCompoundControlPartOutcome(
    sizeObservation,
    session.controlAction("butterflies.sizeRange", async (field) => {
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("Home");
    }),
    [0.05, 0.24],
    {
      part: "rangeSlider.lower",
      requirementId: "grass.butterflies-sizeRange",
      timeoutMs: 20_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    sizeObservation,
    session.controlAction("butterflies.sizeRange", async (field) => {
      const upper = field.getByRole("slider").nth(1);
      await upper.focus();
      await upper.press("End");
    }),
    [0.05, 0.45],
    {
      part: "rangeSlider.upper",
      requirementId: "grass.butterflies-sizeRange",
      timeoutMs: 20_000,
    },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("butterflies.sizeRange", async (field) => {
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("ArrowRight");
    }),
    {
      requirementId: "grass.butterflies-sizeRange",
      timeoutMs: 20_000,
    },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("butterflies.seed", async (field) => {
      const slider = field.getByRole("slider");
      await slider.focus();
      await slider.press("End");
    }),
    {
      requirementId: "grass.butterflies-seed",
      timeoutMs: 20_000,
    },
  );

  const heightObservation = session.observe((root) => {
    const element = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    return (element?.dataset.grassButterflyHeightRange ?? "")
      .split(":")
      .map(Number);
  });
  await expectToolcraftCompoundControlPartOutcome(
    heightObservation,
    session.controlAction("butterflies.heightRange", async (field) => {
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("Home");
    }),
    [0.1, 1.15],
    {
      part: "rangeSlider.lower",
      requirementId: "grass.butterflies-heightRange",
      timeoutMs: 20_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    heightObservation,
    session.controlAction("butterflies.heightRange", async (field) => {
      const upper = field.getByRole("slider").nth(1);
      await upper.focus();
      await upper.press("End");
    }),
    [0.1, 2.4],
    {
      part: "rangeSlider.upper",
      requirementId: "grass.butterflies-heightRange",
      timeoutMs: 20_000,
    },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("butterflies.heightRange", async (field) => {
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("ArrowRight");
    }),
    {
      requirementId: "grass.butterflies-heightRange",
      timeoutMs: 20_000,
    },
  );

  for (const [requirementId, target, key] of [
    ["grass.butterflies-flightCycles", "butterflies.flightCycles", "End"],
    ["grass.butterflies-wingCycles", "butterflies.wingCycles", "Home"],
  ] as const) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        const slider = field.getByRole("slider");
        await slider.focus();
        await slider.press(key);
      }),
      { requirementId, timeoutMs: 20_000 },
    );
  }

  const outputBounds = await output.boundingBox();
  expect(outputBounds).not.toBeNull();
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("butterflies.landingTime", async (field) => {
      const slider = field.getByRole("slider");
      await slider.focus();
      await slider.press("Home");
      await page.mouse.move(
        outputBounds!.x + outputBounds!.width / 2,
        outputBounds!.y + outputBounds!.height / 2,
      );
    }),
    {
      requirementId: "grass.butterflies-landingTime",
      timeoutMs: 20_000,
    },
  );
  await expect(output).toHaveAttribute("data-grass-butterfly-hover-active", "true");
  await expect
    .poll(
      async () =>
        Number(
          await canvas.getAttribute("data-grass-butterfly-landing-blend"),
        ),
      { timeout: 20_000 },
    )
    .toBeGreaterThan(0.8);

  await page.mouse.move(outputBounds!.x - 12, outputBounds!.y - 12);
  await expect(output).toHaveAttribute("data-grass-butterfly-hover-active", "false");
  await expect
    .poll(
      async () =>
        Number(
          await canvas.getAttribute("data-grass-butterfly-landing-blend"),
        ),
      { timeout: 20_000 },
    )
    .toBeLessThan(0.05);
});

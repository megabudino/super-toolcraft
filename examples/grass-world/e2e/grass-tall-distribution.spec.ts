import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { setGrassSliderValue } from "./grass-performance-control-actions";
import {
  disableGrassScanLayers,
  pauseGrassPlayback,
} from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expect, test } from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';

test("Tall Grass density and Voronoi mask control the complete field", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  const session = await createToolcraftBrowserProofSession(page);
  await pauseGrassPlayback(page);
  await disableGrassScanLayers(page);

  const canvas = page.locator(canvasSelector);
  await expect(canvas).toHaveAttribute("data-grass-frame-signature", /.+/u, {
    timeout: 20_000,
  });

  await setGrassSliderValue(page, "field.densityMax", 10_000);
  await expect(canvas).toHaveAttribute(
    "data-grass-tall-requested-root-count",
    "10000",
    { timeout: 20_000 },
  );
  await expect
    .poll(
      async () => Number(await canvas.getAttribute("data-grass-tall-blade-count")),
      { timeout: 20_000 },
    )
    .toBeGreaterThan(0);
  await expect
    .poll(
      async () => Number(await canvas.getAttribute("data-grass-tall-blade-count")),
      { timeout: 20_000 },
    )
    .toBeLessThan(10_000);

  for (const [requirementId, target] of [
    ["grass.tall-distribution-preview", "field.distributionOffset"],
    ["grass.tall-distribution-levels", "field.distributionLevels"],
  ] as const) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("grass.enabled", async (field) => {
        await field.getByRole("switch").click();
      }),
      session.controlAction("grass.enabled", async (field) => {
        await field.getByRole("switch").click();
      }),
      { requirementId, target, timeoutMs: 12_000 },
    );
  }

  const preview = page.getByRole("button", {
    name: "Move Tall Grass distribution map",
  });
  await expect(preview).toBeVisible();
  const previewBefore = await preview.screenshot();
  const lawnSignatureBefore = await canvas.getAttribute(
    "data-grass-lawn-frame-signature",
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("field.distributionOffset", async (field) => {
      const map = field.getByRole("button", {
        name: "Move Tall Grass distribution map",
      });
      const bounds = await map.boundingBox();
      expect(bounds).not.toBeNull();
      await page.mouse.move(
        bounds!.x + bounds!.width * 0.7,
        bounds!.y + bounds!.height * 0.4,
      );
      await page.mouse.down();
      await page.mouse.move(
        bounds!.x + bounds!.width * 0.28,
        bounds!.y + bounds!.height * 0.66,
        { steps: 8 },
      );
      await page.mouse.up();
    }),
    {
      baselineStabilityIntervalMs: 12,
      baselineStabilitySamples: 2,
      requirementId: "grass.tall-distribution-preview",
      stabilityIntervalMs: 18,
      stabilitySamples: 2,
      timeoutMs: 20_000,
    },
  );
  await expect
    .poll(async () => Buffer.compare(previewBefore, await preview.screenshot()))
    .not.toBe(0);
  await expect(canvas).toHaveAttribute(
    "data-grass-lawn-frame-signature",
    lawnSignatureBefore ?? "",
  );

  const levelsObservation = session.observe((root) => {
    const output = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    const signature = JSON.parse(
      output?.dataset.grassDistributionSignature ?? "null",
    ) as { levels: [number, number] } | null;
    return signature?.levels ?? null;
  });
  await expectToolcraftCompoundControlPartOutcome(
    levelsObservation,
    session.controlAction("field.distributionLevels", async (field) => {
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("ArrowRight");
    }),
    [0.01, 1],
    {
      part: "rangeSlider.lower",
      requirementId: "grass.tall-distribution-levels",
      timeoutMs: 15_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    levelsObservation,
    session.controlAction("field.distributionLevels", async (field) => {
      const upper = field.getByRole("slider").nth(1);
      await upper.focus();
      await upper.press("ArrowLeft");
    }),
    [0.01, 0.99],
    {
      part: "rangeSlider.upper",
      requirementId: "grass.tall-distribution-levels",
      timeoutMs: 15_000,
    },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("field.distributionLevels", async (field) => {
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("Home");
    }),
    {
      requirementId: "grass.tall-distribution-levels",
      timeoutMs: 20_000,
    },
  );
});

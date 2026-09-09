import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { pauseGrassPlayback } from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';

test("Lawn distribution map controls only Lawn Cover", async ({ page }) => {
  test.setTimeout(600_000);
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  const session = await createToolcraftBrowserProofSession(page);
  await pauseGrassPlayback(page);
  const canvas = page.locator(canvasSelector);
  await expect(canvas).toHaveAttribute("data-grass-frame-signature", /.+/u, {
    timeout: 20_000,
  });

  const controls = [
    ["grass.lawn-distribution-preview", "lawn.distributionOffset"],
    ["grass.lawn-distribution-levels", "lawn.distributionLevels"],
    ["grass.lawn-distribution-scale", "lawn.distributionScale"],
    ["grass.lawn-distribution-detail", "lawn.distributionDetail"],
    ["grass.lawn-distribution-roughness", "lawn.distributionRoughness"],
    ["grass.lawn-distribution-seed", "lawn.distributionSeed"],
  ] as const;
  const tallSignature = await canvas.getAttribute(
    "data-grass-tall-frame-signature",
  );
  const scanCounts = await Promise.all(
    ["tufted", "wild", "white", "yellow", "rocks"].map((kind) =>
      canvas.getAttribute(`data-grass-scan-${kind}-count`),
    ),
  );

  const levelsObservation = session.observe((root) => {
    const output = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    const signature = JSON.parse(
      output?.dataset.grassLawnDistributionSignature ?? "null",
    ) as { levels: [number, number] } | null;
    return signature?.levels ?? null;
  });
  await expectToolcraftCompoundControlPartOutcome(
    levelsObservation,
    session.controlAction("lawn.distributionLevels", async (field) => {
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("ArrowRight");
    }),
    [0.01, 0.01],
    {
      part: "rangeSlider.lower",
      requirementId: "grass.lawn-distribution-levels",
      timeoutMs: 15_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    levelsObservation,
    session.controlAction("lawn.distributionLevels", async (field) => {
      const upper = field.getByRole("slider").nth(1);
      await upper.focus();
      await upper.press("End");
    }),
    [0.01, 1],
    {
      part: "rangeSlider.upper",
      requirementId: "grass.lawn-distribution-levels",
      timeoutMs: 15_000,
    },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("lawn.distributionOffset", async (field) => {
      const map = field.getByRole("button", {
        name: "Move Lawn distribution map",
      });
      const bounds = await map.boundingBox();
      expect(bounds).not.toBeNull();
      await page.mouse.move(
        bounds!.x + bounds!.width * 0.72,
        bounds!.y + bounds!.height * 0.38,
      );
      await page.mouse.down();
      await page.mouse.move(
        bounds!.x + bounds!.width * 0.3,
        bounds!.y + bounds!.height * 0.68,
        { steps: 8 },
      );
      await page.mouse.up();
    }),
    {
      requirementId: "grass.lawn-distribution-preview",
      timeoutMs: 20_000,
    },
  );

  for (const [requirementId, target] of controls.slice(2)) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        const slider = field.getByRole("slider").first();
        await slider.focus();
        await slider.press("End");
      }),
      { requirementId, timeoutMs: 20_000 },
    );
  }

  await expect(canvas).toHaveAttribute(
    "data-grass-tall-frame-signature",
    tallSignature ?? "",
  );
  for (const [index, kind] of [
    "tufted",
    "wild",
    "white",
    "yellow",
    "rocks",
  ].entries()) {
    await expect(canvas).toHaveAttribute(
      `data-grass-scan-${kind}-count`,
      scanCounts[index] ?? "",
    );
  }
});

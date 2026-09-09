import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import {
  disableGrassScanLayers,
  pauseGrassPlayback,
  setGrassLayerVisibility,
} from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';

test("Clover PBR material blends with the current ground through one mask", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  const session = await createToolcraftBrowserProofSession(page);
  await pauseGrassPlayback(page);
  await disableGrassScanLayers(page);
  await setGrassLayerVisibility(page, "grass.enabled", false);
  await setGrassLayerVisibility(page, "lawn.enabled", false);

  const surfaceSection = page
    .locator("[data-toolcraft-controls-section-anchor]")
    .filter({
      has: page.getByRole("button", { name: "Collapse Surface section" }),
    });
  await expect(surfaceSection).toHaveCount(1);
  for (const target of [
    "surface.textureScale",
    "surface.cloverTextureScale",
    "surface.cloverMaskOffset",
    "surface.cloverMaskScale",
    "surface.cloverMaskDetail",
    "surface.cloverMaskRoughness",
    "surface.cloverMaskSeed",
    "surface.cloverMaskLevels",
  ]) {
    await expect(
      surfaceSection.locator(`[data-toolcraft-control-target="${target}"]`),
      `${target} should be visible inside Surface`,
    ).toBeVisible();
  }
  await expect(
    page.getByRole("button", { name: "Collapse Clover Material section" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Collapse Clover Blend section" }),
  ).toHaveCount(0);

  const canvas = page.locator(canvasSelector);
  await expect(canvas).toHaveAttribute(
    "data-grass-scan-resource-signature",
    "megascans-field-v3",
    { timeout: 30_000 },
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-clover-blend-signature",
    /"levels":\[0\.42,0\.62\]/u,
  );

  for (const [requirementId, target] of [
    ["grass.clover-blend-preview", "surface.cloverMaskOffset"],
    ["grass.clover-blend-levels", "surface.cloverMaskLevels"],
  ] as const) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("field.showGround", async (field) => {
        await field.getByRole("switch").click();
      }),
      session.controlAction("field.showGround", async (field) => {
        await field.getByRole("switch").click();
      }),
      { requirementId, target, timeoutMs: 15_000 },
    );
  }

  const preview = page.getByRole("button", {
    name: "Move Clover blend map",
  });
  await expect(preview).toBeVisible();
  const previewBefore = await preview.screenshot();
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("surface.cloverMaskOffset", async (field) => {
      const map = field.getByRole("button", {
        name: "Move Clover blend map",
      });
      const bounds = await map.boundingBox();
      expect(bounds).not.toBeNull();
      await page.mouse.move(
        bounds!.x + bounds!.width * 0.7,
        bounds!.y + bounds!.height * 0.38,
      );
      await page.mouse.down();
      await page.mouse.move(
        bounds!.x + bounds!.width * 0.3,
        bounds!.y + bounds!.height * 0.66,
        { steps: 8 },
      );
      await page.mouse.up();
    }),
    {
      baselineStabilityIntervalMs: 12,
      baselineStabilitySamples: 2,
      requirementId: "grass.clover-blend-preview",
      stabilityIntervalMs: 18,
      stabilitySamples: 2,
      timeoutMs: 25_000,
    },
  );
  await expect
    .poll(async () => Buffer.compare(previewBefore, await preview.screenshot()))
    .not.toBe(0);

  const levelsObservation = session.observe((root) => {
    const output = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    const signature = JSON.parse(
      output?.dataset.grassCloverBlendSignature ?? "null",
    ) as { mask: { levels: [number, number] } } | null;
    return signature?.mask.levels ?? null;
  });
  await expectToolcraftCompoundControlPartOutcome(
    levelsObservation,
    session.controlAction("surface.cloverMaskLevels", async (field) => {
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("Home");
    }),
    [0, 0.62],
    {
      part: "rangeSlider.lower",
      requirementId: "grass.clover-blend-levels",
      timeoutMs: 15_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    levelsObservation,
    session.controlAction("surface.cloverMaskLevels", async (field) => {
      const upper = field.getByRole("slider").nth(1);
      await upper.focus();
      await upper.press("Home");
    }),
    [0, 0],
    {
      part: "rangeSlider.upper",
      requirementId: "grass.clover-blend-levels",
      timeoutMs: 15_000,
    },
  );
  const currentGroundPixels = await canvas.screenshot();
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("surface.cloverMaskLevels", async (field) => {
      const upper = field.getByRole("slider").nth(1);
      await upper.focus();
      await upper.press("End");
      const lower = field.getByRole("slider").nth(0);
      await lower.focus();
      await lower.press("End");
    }),
    {
      baselineStabilityIntervalMs: 12,
      baselineStabilitySamples: 2,
      requirementId: "grass.clover-blend-levels",
      stabilityIntervalMs: 18,
      stabilitySamples: 2,
      timeoutMs: 25_000,
    },
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-clover-blend-signature",
    /"levels":\[1,1\]/u,
  );
  expect(
    Buffer.compare(currentGroundPixels, await canvas.screenshot()),
  ).not.toBe(0);
});

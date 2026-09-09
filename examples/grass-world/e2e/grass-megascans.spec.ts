import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';

const scanLayers = [
  ["tufted", 1000, 0.35, 2],
  ["wild", 402, 0.35, 1.8],
  ["white", 178, 0.35, 1.8],
  ["yellow", 136, 0.35, 1.8],
  ["rocks", 18, 0.35, 2.2],
] as const;

const commonPbrControls = [
  ["pbrTint", "pbr-tint", "color", "#F02DAA"],
  ["pbrBrightness", "pbr-brightness", "slider", "End"],
  ["colorContrast", "color-contrast", "slider", "End"],
  ["colorSaturation", "color-saturation", "slider", "Home"],
  ["pbrRoughness", "pbr-roughness", "slider", "End"],
  ["pbrNormalStrength", "pbr-normal", "slider", "End"],
] as const;

test("Megascans field layers update visible PBR instances independently", async ({
  page,
}) => {
  test.setTimeout(600_000);
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  const session = await createToolcraftBrowserProofSession(page);
  const preview = page.getByRole("application", {
    name: "Procedural grass field preview",
  });
  await preview.click();
  const canvas = page.locator(canvasSelector);
  await expect(canvas).toHaveAttribute(
    "data-grass-scan-resource-signature",
    "megascans-field-v3",
    { timeout: 45_000 },
  );
  for (const target of ["grass.enabled", "lawn.enabled"]) {
    const layerSwitch = page
      .locator(`[data-toolcraft-control-target="${target}"]`)
      .getByRole("switch");
    if ((await layerSwitch.getAttribute("aria-checked")) === "true") {
      await layerSwitch.click();
    }
  }

  for (const [kind, initialCount, sizeMin, sizeMax] of scanLayers) {
    await expect(canvas).toHaveAttribute(
      `data-grass-scan-${kind}-count`,
      String(initialCount),
    );
    const enabledTarget = `scan.${kind}.enabled`;
    const requirementPrefix = `grass.scan-${kind}`;

    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(enabledTarget, async (field) => {
        await field.getByRole("switch").click();
      }),
      {
        requirementId: `${requirementPrefix}-enabled`,
        timeoutMs: 15_000,
      },
    );
    await expect(canvas).toHaveAttribute(`data-grass-scan-${kind}-count`, "0");
    await page
      .locator(`[data-toolcraft-control-target="${enabledTarget}"]`)
      .getByRole("switch")
      .click();
    await expect(canvas).toHaveAttribute(
      `data-grass-scan-${kind}-count`,
      String(initialCount),
    );

    for (const [suffix, requirementSuffix] of [
      ["count", "count"],
      ["sizeRange", "sizeRange"],
      ["clumping", "clumping"],
      ["seed", "seed"],
      ["surfaceOffset", "surfaceOffset"],
      ...commonPbrControls.map(
        ([suffix, requirementSuffix]) => [suffix, requirementSuffix] as const,
      ),
    ] as const) {
      const target = `scan.${kind}.${suffix}`;
      await expectToolcraftConditionalControlVisibility(
        session,
        session.controlAction(enabledTarget, async (field) => {
          await field.getByRole("switch").click();
        }),
        session.controlAction(enabledTarget, async (field) => {
          await field.getByRole("switch").click();
        }),
        {
          requirementId: `${requirementPrefix}-${requirementSuffix}`,
          target,
          timeoutMs: 12_000,
        },
      );
    }

    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(`scan.${kind}.count`, async (field) => {
        const slider = field.getByRole("slider");
        await slider.focus();
        await slider.press("ArrowLeft");
      }),
      {
        requirementId: `${requirementPrefix}-count`,
        timeoutMs: 15_000,
      },
    );
    await expect(canvas).toHaveAttribute(
      `data-grass-scan-${kind}-count`,
      String(initialCount - 1),
    );

    const scanSettingsObservation = session.observe((root) => {
      const output = root.querySelector<HTMLCanvasElement>(
        '[data-slot="grass-webgl-canvas"]',
      );
      const signature = JSON.parse(
        output?.dataset.grassSettingsSignature ?? "{}",
      ) as {
        scans?: Record<string, { sizeMax?: number; sizeMin?: number }>;
      };
      return signature.scans ?? {};
    });
    const scanSettingsBeforeLower = (
      JSON.parse(
        (await canvas.getAttribute("data-grass-settings-signature")) ?? "{}",
      ) as {
        scans: Record<string, { sizeMax: number; sizeMin: number }>;
      }
    ).scans;
    await expectToolcraftCompoundControlPartOutcome(
      scanSettingsObservation,
      session.controlAction(`scan.${kind}.sizeRange`, async (field) => {
        const lower = field.getByRole("slider").nth(0);
        await lower.focus();
        await lower.press("Home");
      }),
      {
        ...scanSettingsBeforeLower,
        [kind]: { ...scanSettingsBeforeLower[kind], sizeMin },
      },
      {
        part: "rangeSlider.lower",
        requirementId: `${requirementPrefix}-sizeRange`,
        timeoutMs: 15_000,
      },
    );
    const scanSettingsBeforeUpper = (
      JSON.parse(
        (await canvas.getAttribute("data-grass-settings-signature")) ?? "{}",
      ) as {
        scans: Record<string, { sizeMax: number; sizeMin: number }>;
      }
    ).scans;
    await expectToolcraftCompoundControlPartOutcome(
      scanSettingsObservation,
      session.controlAction(`scan.${kind}.sizeRange`, async (field) => {
        const upper = field.getByRole("slider").nth(1);
        await upper.focus();
        await upper.press("End");
      }),
      {
        ...scanSettingsBeforeUpper,
        [kind]: { ...scanSettingsBeforeUpper[kind], sizeMax },
      },
      {
        part: "rangeSlider.upper",
        requirementId: `${requirementPrefix}-sizeRange`,
        timeoutMs: 15_000,
      },
    );
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(`scan.${kind}.sizeRange`, async (field) => {
        const lower = field.getByRole("slider").nth(0);
        await lower.focus();
        await lower.press("ArrowRight");
      }),
      {
        requirementId: `${requirementPrefix}-sizeRange`,
        timeoutMs: 15_000,
      },
    );

    for (const [suffix, key] of [
      ["clumping", "End"],
      ["seed", "Home"],
      ["surfaceOffset", "End"],
    ] as const) {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(`scan.${kind}.${suffix}`, async (field) => {
          const slider = field.getByRole("slider");
          await slider.focus();
          await slider.press(key);
        }),
        {
          requirementId: `${requirementPrefix}-${suffix}`,
          timeoutMs: 15_000,
        },
      );
    }
    for (const [suffix, requirementSuffix, controlType, actionValue] of [
      ...commonPbrControls,
    ] as const) {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(`scan.${kind}.${suffix}`, async (field) => {
          if (controlType === "color") {
            const textbox = field.getByRole("textbox");
            await textbox.fill(actionValue);
            await textbox.press("Enter");
            return;
          }
          const slider = field.getByRole("slider");
          await slider.focus();
          await slider.press(actionValue);
        }),
        {
          requirementId: `${requirementPrefix}-${requirementSuffix}`,
          timeoutMs: 15_000,
        },
      );
    }
  }

  const boulderToggle = page
    .locator('[data-toolcraft-control-target="scan.boulder.enabled"]')
    .getByRole("switch");
  if ((await boulderToggle.getAttribute("aria-checked")) === "false") {
    await boulderToggle.click();
  }
  await expect(canvas).toHaveAttribute("data-grass-scan-boulder-count", "1");
  for (const [suffix, requirementSuffix] of [
    ["size", "size"],
    ["seed", "seed"],
    ["surfaceOffset", "surfaceOffset"],
    ...commonPbrControls.map(
      ([suffix, requirementSuffix]) => [suffix, requirementSuffix] as const,
    ),
  ] as const) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("scan.boulder.enabled", async (field) => {
        await field.getByRole("switch").click();
      }),
      session.controlAction("scan.boulder.enabled", async (field) => {
        await field.getByRole("switch").click();
      }),
      {
        requirementId: `grass.scan-boulder-${requirementSuffix}`,
        target: `scan.boulder.${suffix}`,
        timeoutMs: 12_000,
      },
    );
  }
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("scan.boulder.enabled", async (field) => {
      await field.getByRole("switch").click();
    }),
    { requirementId: "grass.scan-boulder-enabled", timeoutMs: 15_000 },
  );
  await expect(canvas).toHaveAttribute("data-grass-scan-boulder-count", "0");
  await page
    .locator('[data-toolcraft-control-target="scan.boulder.enabled"]')
    .getByRole("switch")
    .click();
  await expect(canvas).toHaveAttribute("data-grass-scan-boulder-count", "1");

  for (const [suffix, key] of [
    ["size", "End"],
    ["seed", "End"],
    ["surfaceOffset", "Home"],
  ] as const) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(`scan.boulder.${suffix}`, async (field) => {
        const slider = field.getByRole("slider");
        await slider.focus();
        await slider.press(key);
      }),
      {
        requirementId: `grass.scan-boulder-${suffix}`,
        timeoutMs: 15_000,
      },
    );
  }
  for (const [
    suffix,
    requirementSuffix,
    controlType,
    actionValue,
  ] of commonPbrControls) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(`scan.boulder.${suffix}`, async (field) => {
        if (controlType === "color") {
          const textbox = field.getByRole("textbox");
          await textbox.fill(actionValue);
          await textbox.press("Enter");
          return;
        }
        const slider = field.getByRole("slider");
        await slider.focus();
        await slider.press(actionValue);
      }),
      {
        requirementId: `grass.scan-boulder-${requirementSuffix}`,
        timeoutMs: 15_000,
      },
    );
  }

  for (const [requirementId, target, key] of [
    ["grass.surface-color-contrast", "surface.colorContrast", "End"],
    ["grass.surface-color-saturation", "surface.colorSaturation", "Home"],
  ] as const) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("field.showGround", async (field) => {
        await field.getByRole("switch").click();
      }),
      session.controlAction("field.showGround", async (field) => {
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
});

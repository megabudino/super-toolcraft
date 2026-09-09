import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { prepareGrassSession } from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';

test("Rock shadow colors tint only received rock shadows", async ({ page }) => {
  test.setTimeout(180_000);
  const session = await prepareGrassSession(page);
  const canvas = page.locator(canvasSelector);
  await expect(canvas).toHaveAttribute(
    "data-grass-scan-resource-signature",
    /megascans-field-v3/u,
    { timeout: 45_000 },
  );

  for (const [kind, color, otherKind] of [
    ["rocks", "#315FD1", "boulder"],
    ["boulder", "#D24B2A", "rocks"],
  ] as const) {
    const enabledTarget = `scan.${kind}.enabled`;
    const target = `scan.${kind}.shadowColor`;
    const enabled = page
      .locator(`[data-toolcraft-control-target="${enabledTarget}"]`)
      .getByRole("switch");
    if ((await enabled.getAttribute("aria-checked")) === "false") {
      await enabled.click();
    }

    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction(enabledTarget, async (field) => {
        await field.getByRole("switch").click();
      }),
      session.controlAction(enabledTarget, async (field) => {
        await field.getByRole("switch").click();
      }),
      {
        requirementId: `grass.scan-${kind}-shadow-color`,
        target,
        timeoutMs: 15_000,
      },
    );

    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        const textbox = field.getByRole("textbox");
        await textbox.fill(color);
        await textbox.press("Enter");
      }),
      {
        requirementId: `grass.scan-${kind}-shadow-color`,
        timeoutMs: 20_000,
      },
    );

    const signature = JSON.parse(
      (await canvas.getAttribute("data-grass-settings-signature")) ?? "{}",
    ) as {
      scans?: Record<string, { shadowColor?: string }>;
    };
    expect(signature.scans?.[kind]?.shadowColor?.toLowerCase()).toBe(
      color.toLowerCase(),
    );
    expect(signature.scans?.[otherKind]?.shadowColor?.toLowerCase()).toBe(
      otherKind === "rocks" ? "#315fd1" : "#ffffff",
    );
  }
});

import { expect, test } from "./toolcraft-product-test";

import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { dragMicrographicsSliderTargetToValue } from "./micrographics-browser-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

const outputSelector =
  '[data-toolcraft-product-output="micrographics"]';

test.setTimeout(90_000);

test("browser: glow slider updates the poster filter live", async ({ page }) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const foreground = page.locator(
    `${outputSelector} [data-micrographics-layer="foreground"]`,
  );
  const glowFilter = page.locator(
    `${outputSelector} [data-micrographics-glow]`,
  );

  await expect(foreground).not.toHaveAttribute(
    "filter",
    "url(#micrographics-glow)",
  );
  await expect(glowFilter).toHaveCount(0);

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("ink.glow", async () => {
      await dragMicrographicsSliderTargetToValue(page, "ink.glow", 60);
    }),
    {
      message: "Glow should change the rendered poster output.",
      requirementId: "ink-glow",
      selector: outputSelector,
    },
  );

  await expect(foreground).toHaveAttribute(
    "filter",
    "url(#micrographics-glow)",
  );
  await expect(glowFilter).toHaveCount(1);
  await expect
    .poll(async () =>
      Number(
        await glowFilter
          .locator("feGaussianBlur")
          .getAttribute("stdDeviation"),
      ),
    )
    .toBeGreaterThan(0);

  await dragMicrographicsSliderTargetToValue(page, "ink.glow", 0);
  await expect(foreground).not.toHaveAttribute(
    "filter",
    "url(#micrographics-glow)",
  );
  await expect(glowFilter).toHaveCount(0);
});

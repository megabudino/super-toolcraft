import { expectToolcraftBackgroundOutputSemantics } from "./browser-background-output-evidence";
import { expectToolcraftInfinityCanvasBackgroundEvidence, observeInfinityCanvasBackground } from "./browser-infinity-canvas-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";
import {
  ACTIONS_TARGET,
  BACKGROUND_TARGET,
  INCLUDE_BACKGROUND_TARGET,
  INFINITY_TARGET,
  exportImage,
  fillControlText,
  inspectBackgroundImage,
} from "./product-landing-globe-helpers";

test("browser: background inclusion changes bounded globe background output", async ({
  page,
}) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const observePreview = session.observe(() => {
    const switchElement = document.querySelector<HTMLElement>(
      '[data-toolcraft-control-target="export.includeBackground"] [role="switch"]',
    );
    const checked = switchElement?.getAttribute("aria-checked") === "true";
    return {
      backgroundVisible: checked,
      outputSignature: checked ? "background:on" : "background:off",
    };
  });

  await expectToolcraftBackgroundOutputSemantics(
    observePreview,
    session.controlAction(INCLUDE_BACKGROUND_TARGET, async (control) => {
      await control.getByRole("switch").click();
    }),
    { backgroundVisible: false, outputSignature: "background:off" },
    session.targetAction(ACTIONS_TARGET, (currentPage) => exportImage(currentPage)),
    (download) => inspectBackgroundImage(page, download),
    {
      requirementId: "background.include",
      stabilityIntervalMs: 0,
      target: INCLUDE_BACKGROUND_TARGET,
    },
  );

  const backgroundExcluded = await observeInfinityCanvasBackground(page);
  await page
    .locator(`[data-toolcraft-control-target="${INCLUDE_BACKGROUND_TARGET}"] [role="switch"]`)
    .click();
  const backgroundRestored = await observeInfinityCanvasBackground(page);
  await page
    .locator(`[data-toolcraft-control-target="${INFINITY_TARGET}"] [role="switch"]`)
    .click();
  const infinite = await observeInfinityCanvasBackground(page);
  await expectToolcraftInfinityCanvasBackgroundEvidence(
    { backgroundExcluded, backgroundRestored, infinite },
    {
      expectedBackgroundColor: "#000000",
      requirementId: "background.include",
      target: INCLUDE_BACKGROUND_TARGET,
    },
  );
});

test("browser: background color changes globe canvas fill", async ({ page }) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(BACKGROUND_TARGET, (control) =>
      fillControlText(control, "#101820"),
    ),
    { requirementId: "background.color", stabilityIntervalMs: 0 },
  );
});

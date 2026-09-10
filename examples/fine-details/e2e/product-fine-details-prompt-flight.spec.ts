import { fineDetailsPromptFlightBrowserTestNames } from "../src/app/app-acceptance-data";
import {
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_BROWSER_TEST_NAME,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
} from "../src/app/fine-details-prompt-flight-command-contract";
import { promptFlightEvidenceCases } from "./fine-details-prompt-flight-cases";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  expectPromptFlightCommandOutcome,
  expectPromptFlightSettings,
  getDistance,
  getPromptFlightAcceptance,
  getPromptFlightBaseRect,
  getPromptRect,
  preparePromptFlightTransition,
  prepareWith,
  previewSelector,
  provePromptFlightControlCase,
  provePromptFlightTransition,
  readGhostOpacities,
  readPromptFlightControlSnapshot,
  resetAndWaitForPreview,
  waitForGhostsToClear,
} from "./fine-details-prompt-flight-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const productEvidenceOptions = {
  selector: previewSelector,
  stabilityIntervalMs: 50,
  stabilitySamples: 2,
  timeoutMs: 15_000,
} as const;

async function readPromptFlightPersistenceSnapshot(
  page: Parameters<typeof resetAndWaitForPreview>[0],
) {
  return page.evaluate(() => {
    const entries = Array.from({ length: localStorage.length }, (_, index) => {
      const key = localStorage.key(index);
      return key ? ([key, localStorage.getItem(key)] as const) : null;
    }).filter((entry): entry is readonly [string, string | null] => entry !== null);
    return entries.sort(([first], [second]) => first.localeCompare(second));
  });
}

for (const evidenceCase of promptFlightEvidenceCases) {
  const acceptance = getPromptFlightAcceptance(evidenceCase.target);
  test(fineDetailsPromptFlightBrowserTestNames[evidenceCase.target], async ({ page }) => {
    await resetAndWaitForPreview(page);
    const session = await createToolcraftBrowserProofSession(page);
    await evidenceCase.prepare(page);
    const baseRect = await getPromptFlightBaseRect(page);

    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(acceptance.target, async (control, currentPage) => {
        await provePromptFlightControlCase({
          baseRect,
          control,
          evidenceCase,
          page: currentPage,
        });
      }),
      {
        ...productEvidenceOptions,
        requirementId: acceptance.id,
      },
    );
  });
}

const transitionAcceptance = getPromptFlightAcceptance("prompt.flight.transition");

test(fineDetailsPromptFlightBrowserTestNames["prompt.flight.transition"], async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await resetAndWaitForPreview(page);
  const session = await createToolcraftBrowserProofSession(page);
  const baseRect = await preparePromptFlightTransition(page);

  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction(transitionAcceptance.target, async (currentPage) => {
      await provePromptFlightTransition(currentPage, baseRect);
    }),
    {
      ...productEvidenceOptions,
      requirementId: transitionAcceptance.id,
    },
  );
});

test(FINE_DETAILS_PROMPT_FLIGHT_COMMAND_BROWSER_TEST_NAME, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await resetAndWaitForPreview(page);
  await prepareWith({
    bounce: 0,
    flightTime: 1_200,
    ghostSpacing: 56,
    ghosts: true,
    offsetX: 0,
    offsetY: 0,
    startDelay: 0,
    vanishStagger: 120,
    vanishTime: 500,
  })(page);
  await expectPromptFlightSettings(page, {
    flightTime: 1_200,
    ghostSpacing: 56,
    ghosts: true,
    offset: { x: 0, y: 0 },
  });

  const frame = page.locator(previewSelector);
  const prompt = frame.locator("[data-fine-details-prompt-drag-root]");
  const layer = frame.locator("[data-fine-details-prompt-flight-layer]");
  const ghosts = frame.locator("[data-fine-details-prompt-ghost]");
  const baseRect = await getPromptFlightBaseRect(page);
  const settingsBefore = await readPromptFlightControlSnapshot(page);
  const persistenceBefore = await readPromptFlightPersistenceSnapshot(page);
  const playback = await getToolcraftControlFieldByTarget(
    page,
    FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
  );

  const runOutcome = await expectPromptFlightCommandOutcome(
    () => prompt.getAttribute("data-fine-details-prompt-flight"),
    async () => {
      await playback.getByRole("button", { name: "Run" }).click();
      await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "flying");
      await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "landed");
    },
    { stabilityIntervalMs: 50, stabilitySamples: 2, timeoutMs: 5_000 },
  );
  expect(runOutcome).toBe("landed");
  expect(await readPromptFlightControlSnapshot(page)).toEqual(
    settingsBefore,
  );
  expect(await readPromptFlightPersistenceSnapshot(page)).toEqual(persistenceBefore);

  await playback.getByRole("button", { name: "Run" }).click();
  await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "flying");
  await playback.getByRole("button", { name: "Reset" }).click();
  await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "returning");
  await expect
    .poll(async () => (await readGhostOpacities(ghosts)).some((opacity) => opacity > 0))
    .toBe(true);
  await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "idle");
  await waitForGhostsToClear(ghosts);
  expect(getDistance(await getPromptRect(layer), baseRect)).toBeLessThanOrEqual(1);
  expect(await readPromptFlightControlSnapshot(page)).toEqual(
    settingsBefore,
  );
  expect(await readPromptFlightPersistenceSnapshot(page)).toEqual(persistenceBefore);
});

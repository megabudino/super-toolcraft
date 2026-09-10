import { expect, type Locator, type Page } from "@playwright/test";

import { appAcceptance } from "../src/app/app-acceptance-data";
import { fineDetailsCarouselTargets } from "../src/app/fine-details-carousel-values";
import {
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_ACCEPTANCE_ID,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
} from "../src/app/fine-details-prompt-flight-command-contract";
import { fineDetailsPromptFlightTargets } from "../src/app/fine-details-prompt-flight-values";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { attachToolcraftBrowserRuntimeEvidence } from "./browser-runtime-evidence";
import { expectToolcraftPersistentOutcomeAfterAction } from "./stable-outcome-helpers";
import { getTypographyCornerOffset, orderGhostSnapshotsAlongPath } from '../src/app/fine-details-evidence-geometry';
export { getTypographyCornerOffset, orderGhostSnapshotsAlongPath } from '../src/app/fine-details-evidence-geometry';

export const previewSelector = '[data-recraft-native-section]';
const sectionSelector = "[data-fine-details-section]";
const promptSelector = "[data-fine-details-prompt-drag-root]";
const promptFlightLayerSelector = "[data-fine-details-prompt-flight-layer]";
const ghostSelector = "[data-fine-details-prompt-ghost]";
const upperLeftTypographySelector = "[data-fine-details-upper-left-typography]";
const lowerRightTypographySelector = "[data-fine-details-lower-right-typography]";

export type PromptFlightTarget =
  (typeof fineDetailsPromptFlightTargets)[keyof typeof fineDetailsPromptFlightTargets];
export type PromptRect = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;
export type PromptGhostSnapshot = PromptRect & Readonly<{ opacity: number }>;
export type PromptFlightOutcomeContext = Readonly<{
  baseRect: PromptRect;
  control: Locator;
  ghosts: Locator;
  layer: Locator;
  lowerRightTypography: Locator;
  page: Page;
  prompt: Locator;
  section: Locator;
  upperLeftTypography: Locator;
}>;
export type PromptFlightEvidenceCase = Readonly<{
  edit: (control: Locator) => Promise<Readonly<Record<string, unknown>>>;
  outcome: (context: PromptFlightOutcomeContext) => Promise<void>;
  prepare: (page: Page) => Promise<void>;
  target: PromptFlightTarget;
}>;

const promptFlightAcceptances = new Map(
  appAcceptance
    .filter((entry) => entry.id.startsWith("prompt.flight."))
    .map((entry) => [entry.id, entry]),
);

export function getPromptFlightAcceptance(id: string) {
  const acceptance = promptFlightAcceptances.get(id);
  if (!acceptance) throw new Error(`Missing ${id} acceptance.`);
  return acceptance;
}

export async function expectPromptFlightCommandOutcome<T>(
  observeOutcome: () => Promise<T>,
  action: () => Promise<void>,
  {
    stabilityIntervalMs,
    stabilitySamples,
    timeoutMs = 5_000,
  }: {
    stabilityIntervalMs?: number;
    stabilitySamples?: number;
    timeoutMs?: number;
  },
): Promise<T> {
  const result = await expectToolcraftPersistentOutcomeAfterAction(
    observeOutcome,
    action,
    {
      message: `Acceptance outcome "${FINE_DETAILS_PROMPT_FLIGHT_COMMAND_ACCEPTANCE_ID}" should change after the tested action.`,
      stabilityIntervalMs,
      stabilitySamples,
      timeoutMs,
    },
  );
  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType: "command-side-effect",
    requirementId: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_ACCEPTANCE_ID,
    target: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
  });
  return result;
}

export async function resetAndWaitForPreview(page: Page) {
  // Playwright supplies a fresh context for each product test. Reloading here
  // needlessly aborts native media initialization and repeats startup work.
  await page.goto("/");
  await expect(page.locator(previewSelector)).toBeVisible();
  await expect(page.locator(previewSelector).locator(promptSelector)).toBeVisible();
}

export async function editNumericControl(control: Locator, label: string, value: number) {
  await control.getByRole("button", { name: `Edit ${label} value` }).click();
  const editor = control.getByRole("textbox", { name: `${label} value` });
  await editor.fill(String(value));
  await editor.press("Enter");
}

async function setNumericControl(page: Page, target: string, label: string, value: number) {
  await editNumericControl(await getToolcraftControlFieldByTarget(page, target), label, value);
}

export async function setImagesMode(page: Page, mode: "Carousel" | "Trail") {
  const control = await getToolcraftControlFieldByTarget(
    page,
    fineDetailsCarouselTargets.imagesMode,
  );
  await control.getByRole("button", { name: mode }).click();
  await expect(page.locator(previewSelector).locator(sectionSelector)).toHaveAttribute(
    "data-fine-details-image-state",
    mode.toLowerCase(),
  );
}

export async function expectPromptFlightSettings(
  page: Page,
  expected: Readonly<Record<string, unknown>>,
) {
  // The native scene has no iframe settings transport. Assert the authored UI
  // values here; each evidence case separately proves their rendered effect.
  for (const [key, value] of Object.entries(expected)) {
    const entries = key === "offset"
      ? Object.entries(value as Record<string, number>).map(([axis, coordinate]) =>
          [`prompt.flight.offset.${axis}`, coordinate] as const)
      : [[`prompt.flight.${key}`, value] as const];
    for (const [target, expectedValue] of entries) {
      const control = await getToolcraftControlFieldByTarget(page, target);
      if (typeof expectedValue === "boolean") {
        await expect(control.getByRole("switch")).toBeChecked({ checked: expectedValue });
      } else {
        await expect(control.getByRole("slider")).toHaveAttribute("aria-valuenow", String(expectedValue));
      }
    }
  }
}

export async function readPromptFlightControlSnapshot(page: Page) {
  const snapshot = await page
    .locator('[data-slot="toolcraft-runtime-app"] [data-toolcraft-control-target^="prompt.flight."]')
    .evaluateAll((controls) => controls.map((control) => {
      const target = control.getAttribute("data-toolcraft-control-target")!;
      const input = control.querySelector('[role="switch"], [role="slider"], input[type="range"]');
      const value = input?.getAttribute(input.getAttribute("role") === "switch" ? "aria-checked" : "aria-valuenow");
      if (value == null) throw new Error(`Missing rendered Prompt Flight value: ${target}`);
      return [target, value] as const;
    }));
  // One DOM read, but still require every authored setting exactly once.
  expect(snapshot.map(([target]) => target).sort()).toEqual(Object.values(fineDetailsPromptFlightTargets).sort());
  return snapshot.sort(([first], [second]) => first.localeCompare(second));
}

export async function getPromptRect(prompt: Locator): Promise<PromptRect> {
  const rect = await prompt.boundingBox();
  if (!rect) throw new Error("Prompt flight proof requires visible prompt bounds.");
  return rect;
}

export function getDistance(first: PromptRect, second: PromptRect) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function getCenterDistance(first: PromptRect, second: PromptRect) {
  return Math.hypot(
    first.x + first.width / 2 - (second.x + second.width / 2),
    first.y + first.height / 2 - (second.y + second.height / 2),
  );
}

export async function readGhostSnapshots(ghosts: Locator): Promise<PromptGhostSnapshot[]> {
  return ghosts.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        height: rect.height,
        opacity: Number.parseFloat(getComputedStyle(element).opacity),
        width: rect.width,
        x: rect.x,
        y: rect.y,
      };
    }),
  );
}

export async function readGhostOpacities(ghosts: Locator) {
  return (await readGhostSnapshots(ghosts)).map(({ opacity }) => opacity);
}

export async function readGhostRects(ghosts: Locator): Promise<PromptRect[]> {
  return (await readGhostSnapshots(ghosts)).map(({ height, width, x, y }) => ({
    height,
    width,
    x,
    y,
  }));
}

export async function readGhostOpacityAtRect(ghosts: Locator, selected: PromptRect) {
  const snapshots = await readGhostSnapshots(ghosts);
  const nearest = snapshots
    .map((snapshot) => ({ distance: getCenterDistance(snapshot, selected), snapshot }))
    .sort((first, second) => first.distance - second.distance)[0];
  return nearest && nearest.distance <= 2 ? nearest.snapshot.opacity : null;
}

export async function waitForGhostsToClear(ghosts: Locator) {
  await expect(ghosts).toHaveCount(0, { timeout: 5_000 });
}

function getPromptLocators(page: Page) {
  const frame = page.locator(previewSelector);
  return {
    ghosts: frame.locator(ghostSelector),
    layer: frame.locator(promptFlightLayerSelector),
    lowerRightTypography: frame.locator(lowerRightTypographySelector),
    prompt: frame.locator(promptSelector),
    section: frame.locator(sectionSelector),
    upperLeftTypography: frame.locator(upperLeftTypographySelector),
  };
}

export async function expectLandedAwayFrom(prompt: Locator, layer: Locator, baseRect: PromptRect) {
  await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "landed");
  const landedRect = await getPromptRect(layer);
  expect(getDistance(landedRect, baseRect)).toBeGreaterThan(40);
  return landedRect;
}

async function prepareFlight(
  page: Page,
  settings: Readonly<{
    bounce?: number;
    flightTime?: number;
    ghostFalloff?: number;
    ghostOpacity?: number;
    ghostSpacing?: number;
    ghosts?: boolean;
    offsetX?: number;
    offsetY?: number;
    startDelay?: number;
    vanishStagger?: number;
    vanishTime?: number;
  }>,
) {
  if (settings.offsetX !== undefined) {
    await setNumericControl(
      page,
      fineDetailsPromptFlightTargets.offsetX,
      "Offset X",
      settings.offsetX,
    );
  }
  if (settings.offsetY !== undefined) {
    await setNumericControl(
      page,
      fineDetailsPromptFlightTargets.offsetY,
      "Offset Y",
      settings.offsetY,
    );
  }
  if (settings.startDelay !== undefined) {
    await setNumericControl(
      page,
      fineDetailsPromptFlightTargets.startDelay,
      "Start delay",
      settings.startDelay,
    );
  }
  if (settings.flightTime !== undefined) {
    await setNumericControl(
      page,
      fineDetailsPromptFlightTargets.flightTime,
      "Flight time",
      settings.flightTime,
    );
  }
  if (settings.bounce !== undefined) {
    await setNumericControl(page, fineDetailsPromptFlightTargets.bounce, "Bounce", settings.bounce);
  }
  if (settings.ghosts !== undefined) {
    const ghostsControl = await getToolcraftControlFieldByTarget(
      page,
      fineDetailsPromptFlightTargets.ghosts,
    );
    const ghostsSwitch = ghostsControl.getByRole("switch");
    if ((await ghostsSwitch.isChecked()) !== settings.ghosts) await ghostsSwitch.click();
  }
  if (settings.ghostSpacing !== undefined) {
    await setNumericControl(
      page,
      fineDetailsPromptFlightTargets.ghostSpacing,
      "Spacing",
      settings.ghostSpacing,
    );
  }
  if (settings.ghostOpacity !== undefined) {
    await setNumericControl(
      page,
      fineDetailsPromptFlightTargets.ghostOpacity,
      "Opacity",
      settings.ghostOpacity,
    );
  }
  if (settings.ghostFalloff !== undefined) {
    await setNumericControl(
      page,
      fineDetailsPromptFlightTargets.ghostFalloff,
      "Falloff",
      settings.ghostFalloff,
    );
  }
  if (settings.vanishStagger !== undefined) {
    await setNumericControl(
      page,
      fineDetailsPromptFlightTargets.vanishStagger,
      "Vanish stagger",
      settings.vanishStagger,
    );
  }
  if (settings.vanishTime !== undefined) {
    await setNumericControl(
      page,
      fineDetailsPromptFlightTargets.vanishTime,
      "Vanish time",
      settings.vanishTime,
    );
  }
  await setImagesMode(page, "Trail");
}

export function prepareWith(settings: Parameters<typeof prepareFlight>[1]) {
  return (page: Page) => prepareFlight(page, settings);
}

export function prepareLandedWith(settings: Parameters<typeof prepareFlight>[1]) {
  return async (page: Page) => {
    await prepareFlight(page, settings);
    await setImagesMode(page, "Carousel");
    await expect(getPromptLocators(page).prompt).toHaveAttribute(
      "data-fine-details-prompt-flight",
      "landed",
    );
  };
}

export async function beginCarousel(context: PromptFlightOutcomeContext) {
  await setImagesMode(context.page, "Trail");
  await setImagesMode(context.page, "Carousel");
}

export async function getPromptFlightBaseRect(page: Page) {
  return getPromptRect(getPromptLocators(page).layer);
}

export async function provePromptFlightControlCase({
  baseRect,
  control,
  evidenceCase,
  page,
}: {
  baseRect: PromptRect;
  control: Locator;
  evidenceCase: PromptFlightEvidenceCase;
  page: Page;
}) {
  const expected = await evidenceCase.edit(control);
  await expectPromptFlightSettings(page, expected);
  await evidenceCase.outcome({
    baseRect,
    control,
    page,
    ...getPromptLocators(page),
  });
}

export async function preparePromptFlightTransition(page: Page) {
  await prepareFlight(page, {
    bounce: 0,
    flightTime: 600,
    ghostFalloff: 8,
    ghostOpacity: 70,
    ghostSpacing: 56,
    ghosts: true,
    offsetX: 0,
    offsetY: 0,
    startDelay: 0,
    vanishStagger: 120,
    vanishTime: 260,
  });
  await expectPromptFlightSettings(page, {
    flightTime: 600,
    ghostFalloff: 8,
    ghostOpacity: 70,
    ghostSpacing: 56,
    ghosts: true,
    offset: { x: 0, y: 0 },
    startDelay: 0,
    vanishStagger: 120,
    vanishTime: 260,
  });
  return getPromptFlightBaseRect(page);
}

export async function provePromptFlightTransition(page: Page, baseRect: PromptRect) {
  const { ghosts, layer, prompt } = getPromptLocators(page);
  await setImagesMode(page, "Trail");
  await setImagesMode(page, "Carousel");
  await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "flying");
  await expect.poll(() => ghosts.count()).toBeGreaterThan(1);
  await expectLandedAwayFrom(prompt, layer, baseRect);
  await expect
    .poll(async () => (await readGhostOpacities(ghosts)).some((opacity) => opacity > 0))
    .toBe(true);
  await waitForGhostsToClear(ghosts);

  await setImagesMode(page, "Trail");
  await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "returning");
  await expect
    .poll(async () => (await readGhostOpacities(ghosts)).some((opacity) => opacity > 0))
    .toBe(true);
  await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "idle");
  await waitForGhostsToClear(ghosts);
  expect(getDistance(await getPromptRect(layer), baseRect)).toBeLessThanOrEqual(1);

  await setImagesMode(page, "Carousel");
  await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "flying");
  await expectLandedAwayFrom(prompt, layer, baseRect);
  await waitForGhostsToClear(ghosts);
}

import type { Locator, Page } from '@playwright/test';

import { appAcceptance } from '../src/app/app-acceptance-data';
import { fineDetailsCarouselTargets } from '../src/app/fine-details-carousel-values';
import { getToolcraftControlFieldByTarget } from './browser-control-target-helpers';
import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { expectToolcraftProductObservableToChange } from './product-observable-helpers';
import { expect, test } from './toolcraft-product-test';

const previewSelector = '[data-toolcraft-product-output="fine-details-external-preview"]';
const frameSelector = 'iframe[title="Recraft Fine Details website preview"]';
const promptSelector = '[data-fine-details-prompt-drag-root]';
const sectionSelector = '[data-fine-details-section]';
const interactivePromptSelector = [
  'a',
  'button',
  'input',
  'label',
  'option',
  'select',
  'summary',
  'textarea',
  '[aria-haspopup]',
  '[aria-pressed]',
  '[contenteditable]:not([contenteditable="false"])',
  '[data-fine-details-prompt-no-drag]',
  '[draggable="true"]',
  '[href]',
  '[onclick]',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="link"]',
  '[role="listbox"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="textbox"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const promptDragAcceptance = appAcceptance.find((entry) => entry.id === 'prompt.runtimeOffset');

if (!promptDragAcceptance) {
  throw new Error('Missing prompt.runtimeOffset acceptance.');
}

async function waitForPreview(page: Page) {
  await expect(page.locator(frameSelector)).toBeVisible();
  await expect(page.frameLocator(frameSelector).locator(sectionSelector)).toBeVisible();
  await expect(page.frameLocator(frameSelector).locator(promptSelector)).toBeVisible();
}

async function resetAndWaitForPreview(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForPreview(page);
}

async function getFineDetailsImagesModeButton(page: Page, mode: 'Carousel' | 'Trail') {
  const control = await getToolcraftControlFieldByTarget(
    page,
    fineDetailsCarouselTargets.imagesMode,
  );
  return control.getByRole('button', { name: mode });
}

async function setFineDetailsImagesMode(page: Page, mode: 'Carousel' | 'Trail') {
  const button = await getFineDetailsImagesModeButton(page, mode);
  await button.click();
  await expect(page.locator(previewSelector)).toHaveAttribute(
    'data-fine-details-images-mode',
    mode.toLowerCase(),
  );
}

async function setFineDetailsCarouselCount(page: Page, value: number) {
  const control = await getToolcraftControlFieldByTarget(
    page,
    fineDetailsCarouselTargets.count,
  );
  await control.getByRole('button', { name: 'Edit Images shown value' }).click();
  const editor = control.getByRole('textbox');
  await editor.fill(String(value));
  await editor.press('Enter');
}

async function getPromptChromePoint(prompt: Locator) {
  const promptRect = await prompt.boundingBox();
  if (!promptRect) throw new Error('Prompt drag proof requires visible prompt bounds.');

  const interactiveControls = prompt.locator(interactivePromptSelector);
  const interactiveRects = (
    await Promise.all(
      Array.from({ length: await interactiveControls.count() }, (_, index) =>
        interactiveControls.nth(index).boundingBox(),
      ),
    )
  ).filter((rect): rect is NonNullable<typeof rect> => rect !== null);
  const inset = Math.min(12, promptRect.width / 4, promptRect.height / 4);
  const candidates = [
    { x: promptRect.x + inset, y: promptRect.y + inset },
    { x: promptRect.x + promptRect.width - inset, y: promptRect.y + inset },
    { x: promptRect.x + inset, y: promptRect.y + promptRect.height - inset },
    {
      x: promptRect.x + promptRect.width - inset,
      y: promptRect.y + promptRect.height - inset,
    },
  ];
  const point = candidates.find(
    (candidate) =>
      !interactiveRects.some(
        (rect) =>
          candidate.x >= rect.x &&
          candidate.x <= rect.x + rect.width &&
          candidate.y >= rect.y &&
          candidate.y <= rect.y + rect.height,
      ),
  );

  if (!point) throw new Error('Prompt drag proof requires non-interactive prompt chrome.');
  return point;
}

async function getCapturedPointerId(target: Locator) {
  return target.evaluate((element) => {
    for (let pointerId = 1; pointerId <= 1024; pointerId += 1) {
      if (element.hasPointerCapture(pointerId)) return pointerId;
    }
    return null;
  });
}

async function getHittableInteractivePoint(control: Locator, iframe: Locator) {
  const controlRect = await control.boundingBox();
  const iframeRect = await iframe.boundingBox();
  if (!controlRect || !iframeRect || controlRect.width <= 0 || controlRect.height <= 0) {
    return null;
  }

  for (const [xRatio, yRatio] of [
    [0.5, 0.5],
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ] as const) {
    const point = {
      x: controlRect.x + controlRect.width * xRatio,
      y: controlRect.y + controlRect.height * yRatio,
    };
    const hitsControl = await control.evaluate(
      (element, clientPoint) => {
        const target = element.ownerDocument.elementFromPoint(clientPoint.x, clientPoint.y);
        return target !== null && element.contains(target);
      },
      { x: point.x - iframeRect.x, y: point.y - iframeRect.y },
    );
    if (hitsControl) return point;
  }

  return null;
}

async function expectTopLevelPointerTarget(
  page: Page,
  point: Readonly<{ x: number; y: number }>,
  selector: string,
) {
  await expect
    .poll(() =>
      page.evaluate(
        ({ selector, x, y }) => document.elementFromPoint(x, y)?.matches(selector) ?? false,
        { selector, x: point.x, y: point.y },
      ),
    )
    .toBe(true);
}

function expectRectNear(
  actual: Readonly<{ x: number; y: number }>,
  expected: Readonly<{ x: number; y: number }>,
) {
  expect(Math.abs(actual.x - expected.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(actual.y - expected.y)).toBeLessThanOrEqual(1);
}

function getPositionRelativeToSection(
  promptRect: Readonly<{ x: number; y: number }>,
  sectionRect: Readonly<{ x: number; y: number }>,
) {
  return {
    x: promptRect.x - sectionRect.x,
    y: promptRect.y - sectionRect.y,
  };
}

test(promptDragAcceptance.browserTestName, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await resetAndWaitForPreview(page);
  const session = await createToolcraftBrowserProofSession(page);
  await waitForPreview(page);

  await setFineDetailsImagesMode(page, 'Carousel');
  await setFineDetailsCarouselCount(page, 1);
  const frame = page.frameLocator(frameSelector);
  const iframe = page.locator(frameSelector);
  const preview = page.locator(previewSelector);
  const prompt = frame.locator(promptSelector);
  const textarea = frame.getByRole('textbox', {
    name: 'Describe what you want to generate',
  });
  const retainedPrompt = 'Keep this prompt while moving the panel.';
  await textarea.fill(retainedPrompt);
  await expect(prompt).toHaveAttribute('data-fine-details-prompt-drag-enabled', 'true');
  const initialChrome = await getPromptChromePoint(prompt);
  await expectTopLevelPointerTarget(page, initialChrome, frameSelector);
  await page.mouse.move(initialChrome.x, initialChrome.y);
  await expect(prompt).toHaveCSS('cursor', 'grab');

  const interactiveControls = prompt.locator(interactivePromptSelector);
  let visibleInteractiveControls = 0;
  for (let index = 0; index < (await interactiveControls.count()); index += 1) {
    const control = interactiveControls.nth(index);
    const dragStart = await getHittableInteractivePoint(control, iframe);
    if (!dragStart) continue;

    visibleInteractiveControls += 1;
    await expectTopLevelPointerTarget(page, dragStart, frameSelector);
    await page.mouse.move(dragStart.x, dragStart.y);
    await expect(control).not.toHaveCSS('cursor', 'grab');
    await expect(control).not.toHaveCSS('cursor', 'grabbing');
    await page.mouse.down();
    await page.mouse.move(dragStart.x + 32, dragStart.y + 16, { steps: 4 });
    await page.mouse.up();
    await expect(preview).toHaveAttribute('data-fine-details-prompt-dragging', 'false');
    await expect(prompt).toHaveAttribute('data-fine-details-prompt-dragging', 'false');
    await expect(prompt).toHaveAttribute('data-fine-details-prompt-offset', '0.00:0.00');
  }
  expect(visibleInteractiveControls).toBeGreaterThanOrEqual(2);
  await expect(textarea).toHaveValue(retainedPrompt);

  const authoredRect = await prompt.boundingBox();
  if (!authoredRect) throw new Error('Prompt drag proof requires visible prompt bounds.');

  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction('prompt.position', async (currentPage) => {
      const currentPrompt = currentPage.frameLocator(frameSelector).locator(promptSelector);
      const currentPreview = currentPage.locator(previewSelector);
      const dragStart = await getPromptChromePoint(currentPrompt);
      await currentPage.mouse.move(dragStart.x, dragStart.y);
      await expect(currentPrompt).toHaveCSS('cursor', 'grab');
      await currentPage.mouse.down();
      await expect(currentPrompt).toHaveAttribute('data-fine-details-prompt-dragging', 'true');
      await expect(currentPrompt).toHaveCSS('cursor', 'grabbing');
      const pointerId = await getCapturedPointerId(currentPrompt);
      if (pointerId === null) {
        throw new Error('Carousel native prompt drag proof requires root pointer capture.');
      }
      await currentPage.mouse.move(dragStart.x + 120, dragStart.y + 70, { steps: 8 });
      await currentPage.mouse.up();

      await expect(currentPreview).toHaveAttribute('data-fine-details-prompt-dragging', 'false');
      await expect(currentPrompt).toHaveAttribute('data-fine-details-prompt-dragging', 'false');
      await expect(currentPrompt).toHaveCSS('cursor', 'grab');
      await expect
        .poll(() =>
          currentPrompt.evaluate(
            (element, capturedPointerId) => element.hasPointerCapture(capturedPointerId),
            pointerId,
          ),
        )
        .toBe(false);
      await expect(currentPrompt).not.toHaveAttribute(
        'data-fine-details-prompt-offset',
        '0.00:0.00',
      );
    }),
    {
      requirementId: promptDragAcceptance.id,
      selector: previewSelector,
      stabilityIntervalMs: 50,
      stabilitySamples: 2,
      timeoutMs: 10_000,
    },
  );

  const movedRect = await prompt.boundingBox();
  const sectionRect = await frame.locator(sectionSelector).boundingBox();
  if (!movedRect || !sectionRect) {
    throw new Error('Prompt drag proof requires moved prompt and section bounds.');
  }
  expect(Math.abs(movedRect.x - authoredRect.x)).toBeGreaterThan(40);
  expect(Math.abs(movedRect.y - authoredRect.y)).toBeGreaterThan(30);
  expect(movedRect.x).toBeGreaterThanOrEqual(sectionRect.x + 15);
  expect(movedRect.y).toBeGreaterThanOrEqual(sectionRect.y + 15);
  expect(movedRect.x + movedRect.width).toBeLessThanOrEqual(sectionRect.x + sectionRect.width - 15);
  expect(movedRect.y + movedRect.height).toBeLessThanOrEqual(
    sectionRect.y + sectionRect.height - 15,
  );
  await expect(textarea).toHaveValue(retainedPrompt);

  const movedChrome = await getPromptChromePoint(prompt);
  await page.mouse.dblclick(movedChrome.x, movedChrome.y);
  await expect(preview).toHaveAttribute('data-fine-details-prompt-rect', 'none');
  await expect
    .poll(async () => {
      const resetRect = await prompt.boundingBox();
      return resetRect
        ? Math.max(Math.abs(resetRect.x - authoredRect.x), Math.abs(resetRect.y - authoredRect.y))
        : Number.POSITIVE_INFINITY;
    })
    .toBeLessThanOrEqual(1);
  await expect(preview).not.toHaveAttribute('data-fine-details-prompt-rect', 'none');

  const resetRect = await prompt.boundingBox();
  if (!resetRect) throw new Error('Prompt reset proof requires visible prompt bounds.');
  expectRectNear(resetRect, authoredRect);
  await expect(prompt).toHaveAttribute('data-fine-details-prompt-offset', '0.00:0.00');
  await expect(textarea).toHaveValue(retainedPrompt);

  const trailModeButton = await getFineDetailsImagesModeButton(page, 'Trail');
  await trailModeButton.focus();
  const heldDragStart = await getPromptChromePoint(prompt);
  await page.mouse.move(heldDragStart.x, heldDragStart.y);
  await expectTopLevelPointerTarget(page, heldDragStart, frameSelector);
  await expect(prompt).toHaveCSS('cursor', 'grab');
  await page.mouse.down();
  await expect(prompt).toHaveAttribute('data-fine-details-prompt-dragging', 'true');
  await expect(prompt).toHaveCSS('cursor', 'grabbing');
  const capturedPointerId = await getCapturedPointerId(prompt);
  if (capturedPointerId === null) {
    throw new Error('Carousel prompt drag proof requires native root pointer capture.');
  }
  await page.mouse.move(heldDragStart.x - 90, heldDragStart.y + 45, { steps: 6 });
  await expect(prompt).not.toHaveAttribute('data-fine-details-prompt-offset', '0.00:0.00');

  await trailModeButton.press('Enter');
  await expect(preview).toHaveAttribute('data-fine-details-images-mode', 'trail');
  await expect(prompt).toHaveAttribute('data-fine-details-prompt-drag-enabled', 'false');
  await expect(preview).toHaveAttribute('data-fine-details-prompt-dragging', 'false');
  await expect(preview).not.toHaveCSS('cursor', 'grab');
  await expect(preview).not.toHaveCSS('cursor', 'grabbing');
  await expect(prompt).toHaveAttribute('data-fine-details-prompt-dragging', 'false');
  await expect(prompt).toHaveAttribute('data-fine-details-prompt-offset', '0.00:0.00');
  await expect(preview).toHaveAttribute('data-fine-details-prompt-rect', 'none');
  await expect(preview).toHaveAttribute('data-fine-details-prompt-interactive-rects', '0');
  await expect
    .poll(() =>
      prompt.evaluate(
        (element, pointerId) => element.hasPointerCapture(pointerId),
        capturedPointerId,
      ),
    )
    .toBe(false);
  const trailRect = await prompt.boundingBox();
  const trailSectionRect = await frame.locator(sectionSelector).boundingBox();
  if (!trailRect || !trailSectionRect) {
    throw new Error('Trail drag proof requires visible prompt and section bounds.');
  }
  expectRectNear(trailRect, authoredRect);
  const authoredTrailPosition = getPositionRelativeToSection(trailRect, trailSectionRect);

  await page.mouse.move(heldDragStart.x + 120, heldDragStart.y + 70, { steps: 8 });
  await expect(preview).toHaveAttribute('data-fine-details-prompt-dragging', 'false');
  await expect(prompt).toHaveAttribute('data-fine-details-prompt-dragging', 'false');
  await expect(prompt).toHaveAttribute('data-fine-details-prompt-offset', '0.00:0.00');
  const heldMoveRect = await prompt.boundingBox();
  const heldMoveSectionRect = await frame.locator(sectionSelector).boundingBox();
  if (!heldMoveRect || !heldMoveSectionRect) {
    throw new Error('Cancelled drag proof requires visible prompt and section bounds.');
  }
  expectRectNear(
    getPositionRelativeToSection(heldMoveRect, heldMoveSectionRect),
    authoredTrailPosition,
  );
  await page.mouse.up();

  const disabledChrome = await getPromptChromePoint(prompt);
  await expectTopLevelPointerTarget(page, disabledChrome, previewSelector);
  await page.mouse.move(disabledChrome.x, disabledChrome.y);
  await expect(preview).not.toHaveCSS('cursor', 'grab');
  await expect(preview).not.toHaveCSS('cursor', 'grabbing');
  await page.mouse.down();
  await expect(preview).toHaveAttribute('data-fine-details-prompt-dragging', 'false');
  await expect(prompt).toHaveAttribute('data-fine-details-prompt-dragging', 'false');
  await page.mouse.move(disabledChrome.x + 120, disabledChrome.y + 70, { steps: 8 });
  await page.mouse.up();
  const disabledDoubleClickPoint = await getPromptChromePoint(prompt);
  await page.mouse.dblclick(disabledDoubleClickPoint.x, disabledDoubleClickPoint.y);
  await expect(prompt).toHaveAttribute('data-fine-details-prompt-dragging', 'false');
  await expect(prompt).toHaveAttribute('data-fine-details-prompt-offset', '0.00:0.00');
  const disabledRect = await prompt.boundingBox();
  const disabledSectionRect = await frame.locator(sectionSelector).boundingBox();
  if (!disabledRect || !disabledSectionRect) {
    throw new Error('Disabled drag proof requires visible prompt and section bounds.');
  }
  expectRectNear(
    getPositionRelativeToSection(disabledRect, disabledSectionRect),
    authoredTrailPosition,
  );
  await expect(textarea).toHaveValue(retainedPrompt);
});

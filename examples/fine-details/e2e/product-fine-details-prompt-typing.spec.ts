import type { Page } from '@playwright/test';

import { fineDetailsCarouselTargets } from '../src/app/fine-details-carousel-values';
import { fineDetailsPromptTargets } from '../src/app/fine-details-prompt-values';
import { getToolcraftControlFieldByTarget } from './browser-control-target-helpers';
import { expect, test } from './toolcraft-product-test';

const previewSelector = '[data-toolcraft-product-output="fine-details-external-preview"]';
const frameSelector = 'iframe[title="Recraft Fine Details website preview"]';
const sectionSelector = '[data-fine-details-section]';
const ghostSelector = '[data-fine-details-prompt-ghost]';
const promptPhrases = ['Amber', 'Cobalt'] as const;

async function waitForPreview(page: Page) {
  await expect(page.locator(frameSelector)).toBeVisible();
  await expect(page.frameLocator(frameSelector).locator(sectionSelector)).toBeVisible();
}

async function resetAndWaitForPreview(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForPreview(page);
}

async function setFineDetailsImagesMode(page: Page, mode: 'Carousel' | 'Trail') {
  const control = await getToolcraftControlFieldByTarget(
    page,
    fineDetailsCarouselTargets.imagesMode,
  );
  await control.getByRole('button', { name: mode }).click();
  await expect(page.locator(previewSelector)).toHaveAttribute(
    'data-fine-details-images-mode',
    mode.toLowerCase(),
  );
}

async function setFineDetailsSlider(
  page: Page,
  target: string,
  label: string,
  value: number,
) {
  const control = await getToolcraftControlFieldByTarget(page, target);
  await control.getByRole('button', { name: `Edit ${label} value` }).click();
  const editor = control.getByRole('textbox');
  await editor.fill(String(value));
  await editor.press('Enter');
  await expect(control.getByRole('slider')).toHaveAttribute('aria-valuenow', String(value));
}

async function readGhostText(page: Page) {
  const ghost = page.frameLocator(frameSelector).locator(ghostSelector);
  if ((await ghost.count()) === 0) return '';
  return ghost.evaluate((element) => element.firstChild?.textContent ?? '');
}

test('browser: prompt typing animates phrases until focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await resetAndWaitForPreview(page);
  await setFineDetailsImagesMode(page, 'Trail');

  const typingControl = await getToolcraftControlFieldByTarget(
    page,
    fineDetailsPromptTargets.typingEnabled,
  );
  const typingSwitch = typingControl.getByRole('switch');
  await typingSwitch.click();
  await expect(typingSwitch).toBeChecked();

  const phrasesField = await getToolcraftControlFieldByTarget(
    page,
    fineDetailsPromptTargets.typingPhrases,
  );
  const phrasesControl = phrasesField.locator(
    'xpath=ancestor-or-self::*[@data-toolcraft-control-target="prompt.typing.phrases"][1]',
  );
  await expect(phrasesControl).toBeVisible();
  const phraseInputs = phrasesControl.getByRole('textbox');
  await expect(phraseInputs).toHaveCount(1);
  await phraseInputs.first().fill(promptPhrases[0]);
  await phrasesControl.getByRole('button', { name: 'Add Phrase' }).click();
  await expect(phraseInputs).toHaveCount(2);
  await phraseInputs.nth(1).fill(promptPhrases[1]);
  await expect(phraseInputs.first()).toHaveValue(promptPhrases[0]);
  await expect(phraseInputs.nth(1)).toHaveValue(promptPhrases[1]);

  await setFineDetailsSlider(
    page,
    fineDetailsPromptTargets.typingTypeSpeed,
    'Type speed',
    30,
  );
  await setFineDetailsSlider(
    page,
    fineDetailsPromptTargets.typingDeleteSpeed,
    'Delete speed',
    60,
  );
  await setFineDetailsSlider(page, fineDetailsPromptTargets.typingHold, 'Hold', 0.2);
  await setFineDetailsSlider(page, fineDetailsPromptTargets.typingGap, 'Gap', 0.3);
  await setFineDetailsSlider(page, fineDetailsPromptTargets.typingHumanize, 'Humanize', 0);

  const frame = page.frameLocator(frameSelector);
  const ghost = frame.locator(ghostSelector);
  const textarea = frame.getByRole('textbox', {
    name: 'Describe what you want to generate',
  });
  await expect(ghost).toBeVisible();
  await expect(textarea).toHaveValue('');

  const animatedObservations = new Set<string>();
  await expect
    .poll(
      async () => {
        const text = await readGhostText(page);
        animatedObservations.add(text);
        return promptPhrases.filter((phrase) => animatedObservations.has(phrase)).length;
      },
      { intervals: [25, 50, 75], timeout: 2_500 },
    )
    .toBe(promptPhrases.length);
  expect(animatedObservations.size).toBeGreaterThan(promptPhrases.length);

  // Trail intentionally keeps the host iframe pointer-transparent. Focusing the real
  // iframe textarea proves the focus gate without changing runtime settings or values.
  await textarea.focus();
  await expect(textarea).toBeFocused();
  await expect(ghost).toHaveCount(0, { timeout: 300 });

  const blurStartedAt = Date.now();
  await textarea.press('Tab');
  await expect(textarea).not.toBeFocused();
  await expect(ghost).toBeVisible();
  let firstPostBlurTextAt = 0;
  await expect
    .poll(
      async () => {
        const text = await readGhostText(page);
        if (text.length > 0 && firstPostBlurTextAt === 0) firstPostBlurTextAt = Date.now();
        return text.length > 0;
      },
      { intervals: [25, 50], timeout: 1_500 },
    )
    .toBe(true);
  expect(firstPostBlurTextAt - blurStartedAt).toBeGreaterThanOrEqual(200);

  await setFineDetailsSlider(
    page,
    fineDetailsPromptTargets.typingDeleteSpeed,
    'Delete speed',
    5,
  );
  const deleteStyleControl = await getToolcraftControlFieldByTarget(
    page,
    fineDetailsPromptTargets.typingDeleteStyle,
  );
  const instantButton = deleteStyleControl.getByRole('button', { name: 'Instant' });
  await instantButton.click();
  const selectedDeleteStyleControl = await getToolcraftControlFieldByTarget(
    page,
    fineDetailsPromptTargets.typingDeleteStyle,
  );
  await expect(
    selectedDeleteStyleControl.getByRole('button', { name: 'Instant' }),
  ).toHaveAttribute('aria-pressed', 'true');

  let completedPhrase: string | null = null;
  const instantTransition: string[] = [];
  await expect
    .poll(
      async () => {
        const text = await readGhostText(page);
        if (completedPhrase === null) {
          if (promptPhrases.some((phrase) => phrase === text)) {
            completedPhrase = text;
            instantTransition.push(text);
          }
          return false;
        }

        if (instantTransition.at(-1) !== text) instantTransition.push(text);
        return text === '';
      },
      { intervals: [15, 20, 25], timeout: 2_500 },
    )
    .toBe(true);
  expect(instantTransition).toEqual([completedPhrase, '']);

  await setFineDetailsImagesMode(page, 'Carousel');
  await expect(ghost).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await setFineDetailsImagesMode(page, 'Trail');
  await expect(ghost).toBeVisible();
  await expect.poll(() => readGhostText(page)).toBe(promptPhrases[0]);
  await expect(ghost.locator('span')).toHaveCount(0);

  const reducedMotionText = await readGhostText(page);
  const reducedMotionStartedAt = Date.now();
  let reducedMotionChanged = false;
  await expect
    .poll(
      async () => {
        if ((await readGhostText(page)) !== reducedMotionText) reducedMotionChanged = true;
        return {
          changed: reducedMotionChanged,
          observedInterval: Date.now() - reducedMotionStartedAt >= 450,
        };
      },
      { intervals: [75, 100], timeout: 900 },
    )
    .toEqual({ changed: false, observedInterval: true });

  const reducedTypingControl = await getToolcraftControlFieldByTarget(
    page,
    fineDetailsPromptTargets.typingEnabled,
  );
  const reducedTypingSwitch = reducedTypingControl.getByRole('switch');
  await reducedTypingSwitch.click();
  await expect(reducedTypingSwitch).not.toBeChecked();
  await expect(ghost).toHaveCount(0);
});

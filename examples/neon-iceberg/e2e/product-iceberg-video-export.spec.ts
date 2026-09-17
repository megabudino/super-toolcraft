import { expect, test, type Download, type Page } from './toolcraft-product-test';
import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { expectToolcraftInfinityCanvasVideoExportEvidence } from './browser-infinity-canvas-evidence';
import { expectToolcraftVideoExportArtifact } from './browser-media-export-evidence';
import { field, openIceberg, setChoice, setNumber } from './iceberg-test-helpers';

const durationSeconds = 1;
const schedule = Array.from({ length: 30 }, (_, index) => ({
  index,
  timeSeconds: index / 30,
  durationSeconds: 1 / 30,
}));
const sampleTimes = [schedule[0]!.timeSeconds, schedule[15]!.timeSeconds, schedule[29]!.timeSeconds];
const background = [255, 255, 255, 255] as const;
const expectedSamples = sampleTimes.map(timeSeconds => ({
  timeSeconds,
  pixels: [
    { xRatio: 0.05, yRatio: 0.05, rgba: background },
    { xRatio: 0.5, yRatio: 0.46875, rgba: [13, 13, 13, 255] as const },
  ],
}));
const infiniteSize = { width: 1000, height: 1400 } as const;
const infiniteSamples = sampleTimes.map(timeSeconds => ({
  timeSeconds,
  pixels: [{ xRatio: 0.5, yRatio: 0.390625, rgba: [6, 6, 6, 255] as const }],
}));

async function editDuration(page: Page, value: number): Promise<void> {
  await page.getByRole('button', { name: 'Edit timeline duration' }).click();
  const editor = page.getByRole('textbox', { name: 'timeline duration' });
  await editor.fill(String(value));
  await editor.press('Enter');
}

async function downloadVideo(page: Page): Promise<Download> {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Export (MP4|WebM)$/ }).click();
  return pending;
}

test('browser: iceberg video export encodes the complete plate animation', async ({ page }) => {
  await openIceberg(page);
  const session = await createToolcraftBrowserProofSession(page);
  for (const title of ['Material', 'Base patterns']) {
    const section = page.getByRole('button', { name: `Toggle ${title} section` });
    if (await section.getAttribute('aria-expanded') === 'false') await section.click();
  }
  for (const label of ['Rock', 'Ice']) {
    const input = page.getByRole('textbox', { name: `${label} hex` });
    await input.fill('#000000');
    await input.press('Enter');
  }
  await setNumber(page, 'iceberg.gridStrength', 0);
  await editDuration(page, durationSeconds);
  await expect(page.getByRole('slider', { name: 'Playback position' })).toHaveAttribute('aria-valuemax', '1');

  await setChoice(page, 'export.video.format', 'MP4');
  await expect(page.getByRole('button', { name: 'Export MP4', exact: true })).toBeVisible();
  await setChoice(page, 'export.video.resolution', '4K');
  await expect(field(page, 'export.video.resolution').getByRole('combobox')).toContainText('4K');
  await setChoice(page, 'export.video.format', 'WebM');
  await setChoice(page, 'export.video.resolution', 'Current');

  const finite = await expectToolcraftVideoExportArtifact(
    session.targetAction('actions.output', () => downloadVideo(page)),
    {
      page,
      requirementId: 'export.video.artifact',
      backgroundRgba: background,
      expectedMediaType: 'video/webm',
      expectedWidth: 3330,
      expectedHeight: 4440,
      expectedDurationSeconds: durationSeconds,
      schedule,
      expectedSamples,
      animated: true,
      additionalArtifactRequirements: [
        { requirementId: 'export.video.format', target: 'export.video.format' },
        { requirementId: 'export.video.resolution', target: 'export.video.resolution' },
      ],
    },
  );

  await page.getByRole('switch', { name: 'Infinity canvas' }).click();
  await expect(page.getByRole('switch', { name: 'Infinity canvas' })).toBeChecked();
  const infinite = await expectToolcraftVideoExportArtifact(
    session.targetAction('actions.output', () => downloadVideo(page)),
    {
      page,
      requirementId: 'export.video.artifact',
      backgroundRgba: background,
      expectedMediaType: 'video/webm',
      expectedWidth: infiniteSize.width,
      expectedHeight: infiniteSize.height,
      expectedDurationSeconds: durationSeconds,
      schedule,
      expectedSamples: infiniteSamples,
      animated: true,
    },
  );
  await expectToolcraftInfinityCanvasVideoExportEvidence(
    { finite: finite.inspection, infinite: infinite.inspection },
    {
      requirementId: 'iceberg.infinity-video-export',
      target: 'actions.output',
      expectedFiniteSize: { width: 3330, height: 4440 },
      expectedInfiniteSize: { width: infiniteSize.width, height: infiniteSize.height },
    },
  );
});

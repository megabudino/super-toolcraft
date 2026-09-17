import { expect, test, type Page } from './toolcraft-product-test';
import { createToolcraftBrowserProofSession, type ToolcraftBrowserProofSession } from './browser-proof-session';
import {
  expectToolcraftTimelineDuration,
  expectToolcraftTimelineLoop,
  expectToolcraftTimelinePauseResume,
  expectToolcraftTimelineRenderedFrame,
  expectToolcraftTimelineScrub,
  type ToolcraftTimelineLoopCycleProof,
  type ToolcraftTimelineLoopProof,
} from './browser-timeline-evidence-helpers';
import {
  downloadImage,
  icebergSelector,
  inspectImage,
  openIceberg,
  setChoice,
  setIcebergTimelineFrame,
  setIcebergTimelineLoop,
  setNumber,
} from './iceberg-test-helpers';

const requirementId = 'renderer.timeline';

type FrameSnapshot = {
  componentCount: number;
  outputSignature: string;
};

async function readFrame(page: Page): Promise<FrameSnapshot> {
  return page.locator(icebergSelector).evaluate((canvas: HTMLCanvasElement) => {
    const size = 128;
    const scratch = document.createElement('canvas');
    scratch.width = size;
    scratch.height = size;
    const context = scratch.getContext('2d', { willReadFrequently: true })!;
    context.imageSmoothingEnabled = false;
    context.drawImage(canvas, 0, 0, size, size);
    const pixels = context.getImageData(0, 0, size, size).data;
    let hash = 2166136261;
    let componentCount = 0;
    for (let index = 0; index < pixels.length; index += 1) {
      hash = Math.imul(hash ^ pixels[index]!, 16777619);
    }
    for (let x = 0; x < size; x += 1) {
      let columnComponents = 0;
      for (let y = 0; y < size; y += 1) {
        if (pixels[(y * size + x) * 4 + 3]! <= 80) continue;
        const start = y;
        while (y + 1 < size && pixels[((y + 1) * size + x) * 4 + 3]! > 80) y += 1;
        if (y - start + 1 >= 2) columnComponents += 1;
      }
      componentCount = Math.max(componentCount, columnComponents);
    }
    return { componentCount, outputSignature: (hash >>> 0).toString(16) };
  });
}

function observeFrame(session: ToolcraftBrowserProofSession) {
  return session.observe(root => {
    const canvas = root.querySelector<HTMLCanvasElement>('[data-iceberg-canvas]')!;
    const size = 128;
    const scratch = document.createElement('canvas');
    scratch.width = size;
    scratch.height = size;
    const context = scratch.getContext('2d', { willReadFrequently: true })!;
    context.imageSmoothingEnabled = false;
    context.drawImage(canvas, 0, 0, size, size);
    const pixels = context.getImageData(0, 0, size, size).data;
    let hash = 2166136261;
    for (const value of pixels) hash = Math.imul(hash ^ value, 16777619);
    const scrubber = root.querySelector<HTMLElement>('[role="slider"][aria-label="Playback position"]')!;
    return {
      currentTimeSeconds: Number(scrubber.getAttribute('aria-valuenow')),
      outputSignature: (hash >>> 0).toString(16),
    };
  });
}

function observePlayback(session: ToolcraftBrowserProofSession) {
  return session.observe(root => {
    const canvas = root.querySelector<HTMLCanvasElement>('[data-iceberg-canvas]')!;
    const scratch = document.createElement('canvas');
    scratch.width = 128;
    scratch.height = 128;
    const context = scratch.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(canvas, 0, 0, 128, 128);
    const pixels = context.getImageData(0, 0, 128, 128).data;
    let hash = 2166136261;
    for (const value of pixels) hash = Math.imul(hash ^ value, 16777619);
    const scrubber = root.querySelector<HTMLElement>('[role="slider"][aria-label="Playback position"]')!;
    return {
      currentTimeSeconds: Number(scrubber.getAttribute('aria-valuenow')),
      outputSignature: (hash >>> 0).toString(16),
      playing: Boolean(root.querySelector('[aria-label="Pause playback"]')),
    };
  });
}

async function waitForFrame(page: Page, expected: FrameSnapshot): Promise<void> {
  await expect.poll(() => readFrame(page)).toEqual(expected);
}

async function setTimelineRatio(page: Page, ratio: number): Promise<void> {
  const scrubber = page.getByRole('slider', { name: 'Playback position' });
  const box = await scrubber.boundingBox();
  if (!box) throw new Error('Timeline scrubber is unavailable.');
  await page.mouse.click(box.x + box.width * ratio, box.y + box.height / 2);
}

async function editDuration(page: Page, durationSeconds: number): Promise<void> {
  await page.getByRole('button', { name: 'Edit timeline duration' }).click();
  const editor = page.getByRole('textbox', { name: 'timeline duration' });
  await editor.fill(String(durationSeconds));
  await editor.press('Enter');
}

async function collectLoopCycle(page: Page): Promise<ToolcraftTimelineLoopCycleProof> {
  const scrubber = page.getByRole('slider', { name: 'Playback position' });
  const durationSeconds = Number(await scrubber.getAttribute('aria-valuemax'));
  await setIcebergTimelineLoop(page, true);
  await setIcebergTimelineFrame(page, 'start');
  const seamStartSignature = (await readFrame(page)).outputSignature;
  await scrubber.press('End');
  const seamEndSignature = (await readFrame(page)).outputSignature;
  await scrubber.press('Home');
  await page.getByRole('button', { name: 'Play playback' }).click();
  const normalizedPhases: number[] = [];
  let wrapped = false;
  for (let sample = 0; sample < 48; sample += 1) {
    await page.waitForTimeout(80);
    const phase = Number(await scrubber.getAttribute('aria-valuenow')) / durationSeconds;
    const previous = normalizedPhases.at(-1);
    if (previous === undefined || Math.abs(phase - previous) > 0.001) {
      if (previous !== undefined && phase < previous) wrapped = true;
      normalizedPhases.push(phase);
    }
    if (wrapped && normalizedPhases.length >= 5 && phase > normalizedPhases[normalizedPhases.length - 2]!) break;
  }
  await page.getByRole('button', { name: 'Pause playback' }).click();
  expect(wrapped).toBe(true);
  return { durationSeconds, normalizedPhases, seamEndSignature, seamStartSignature };
}

test('browser: iceberg timeline animates closed base into separated plates', async ({ page }) => {
  await openIceberg(page);
  const session = await createToolcraftBrowserProofSession(page);
  await setNumber(page, 'canvas.renderScale', 1);
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Center canvas', exact: true }).click();
  const scrubber = page.getByRole('slider', { name: 'Playback position' });
  await expect(scrubber).toHaveAttribute('aria-valuemax', '1.2');
  await setIcebergTimelineFrame(page, 'start');
  const closed = await readFrame(page);
  expect(closed.componentCount).toBe(1);

  await setIcebergTimelineLoop(page, false);
  await scrubber.press('End');
  await expect.poll(async () => (await readFrame(page)).componentCount).toBe(5);
  const separated = await readFrame(page);
  expect(separated.outputSignature).not.toBe(closed.outputSignature);
  await scrubber.press('Home');
  await waitForFrame(page, closed);

  const frameObservation = observeFrame(session);
  await expectToolcraftTimelineScrub(
    frameObservation,
    session.targetAction('timeline.playback', async currentPage => {
      await currentPage.getByRole('slider', { name: 'Playback position' }).press('End');
    }),
    { currentTimeSeconds: 1.2, outputSignature: separated.outputSignature },
    { requirementId },
  );
  await expectToolcraftTimelineRenderedFrame(
    frameObservation,
    session.targetAction('timeline.playback', async currentPage => {
      await currentPage.getByRole('slider', { name: 'Playback position' }).press('Home');
    }),
    { currentTimeSeconds: 0, outputSignature: closed.outputSignature },
    { requirementId },
  );

  const initialLoop = await collectLoopCycle(page);
  await setIcebergTimelineLoop(page, false);
  await setTimelineRatio(page, 0.5);
  const defaultMidpoint = await readFrame(page);
  const durationObservation = session.observe(root => {
    const scrubberElement = root.querySelector<HTMLElement>('[role="slider"][aria-label="Playback position"]')!;
    const duration = Number(scrubberElement.getAttribute('aria-valuemax'));
    return { renderedCycleDurationSeconds: duration, timelineDurationSeconds: duration };
  });
  await expectToolcraftTimelineDuration(
    durationObservation,
    session.targetAction('timeline.playback', currentPage => editDuration(currentPage, 1.6)),
    1.6,
    { requirementId },
  );
  await setTimelineRatio(page, 0.5);
  await waitForFrame(page, defaultMidpoint);
  const resizedLoop = await collectLoopCycle(page);
  const loopProof: ToolcraftTimelineLoopProof = { initial: initialLoop, resized: resizedLoop };
  await page.evaluate(proof => {
    (window as typeof window & { __icebergLoopProof?: ToolcraftTimelineLoopProof }).__icebergLoopProof = proof;
  }, loopProof);
  await expectToolcraftTimelineLoop(
    session.observe(() => (window as typeof window & { __icebergLoopProof: ToolcraftTimelineLoopProof }).__icebergLoopProof),
    { requirementId },
  );

  await setIcebergTimelineFrame(page, 'start');
  await page.getByRole('button', { name: 'Play playback' }).click();
  await expect.poll(() => scrubber.getAttribute('aria-valuenow')).not.toBe('0');
  await expectToolcraftTimelinePauseResume(
    observePlayback(session),
    session.targetAction('timeline.playback', async currentPage => {
      await currentPage.getByRole('button', { name: 'Pause playback' }).click();
    }),
    session.targetAction('timeline.playback', async currentPage => {
      await currentPage.getByRole('button', { name: 'Play playback' }).click();
    }),
    { requirementId },
  );
  await page.getByRole('button', { name: 'Pause playback' }).click();

  await setIcebergTimelineLoop(page, false);
  await scrubber.press('End');
  await page.getByRole('button', { name: 'Play playback' }).click();
  await expect.poll(async () => Number(await scrubber.getAttribute('aria-valuenow'))).toBeLessThan(1.6);
  await page.getByRole('button', { name: 'Pause playback' }).click();

  await setChoice(page, 'export.image.resolution', '2K');
  await scrubber.press('Home');
  const closedArtifact = await inspectImage(page, await downloadImage(page));
  await scrubber.press('End');
  const separatedArtifact = await inspectImage(page, await downloadImage(page));
  expect(separatedArtifact.inspection.decodedPixelHash).not.toBe(closedArtifact.inspection.decodedPixelHash);
});

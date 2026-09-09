import type { Page } from '@playwright/test';
import { createToolcraftBrowserProofSession, readToolcraftBrowserObservation } from './browser-proof-session';
import { expectToolcraftViewportSideEffect } from './browser-state-evidence-helpers';
import { expect, test } from './toolcraft-product-test';

const outputSelector = 'canvas[data-toolcraft-product-output="hero"]';

async function readWave(page: Page) {
  return page.locator(outputSelector).evaluate(node => {
    const output = node as HTMLCanvasElement;
    const gpu = document.querySelector<HTMLCanvasElement>('[data-hero-gpu-surface]');
    const gl = gpu?.getContext('webgl2');
    if (!gl) throw new Error('Missing editable WebGL wave.');
    const rect = output.getBoundingClientRect();
    return {
      count: Number(output.dataset.heroRenderCount),
      fullWidth: Number(output.dataset.heroFullWidth),
      width: output.width, height: output.height,
      cssWidth: rect.width, cssHeight: rect.height,
      gpuWidth: gl.drawingBufferWidth, gpuHeight: gl.drawingBufferHeight,
      gpuError: gl.getError(), phase: output.dataset.heroFrameProgress,
    };
  });
}

/** Compare the same authored region, not pixels at the same browser position. */
async function sampleWave(page: Page) {
  return page.locator(outputSelector).evaluate(node => {
    const output = node as HTMLCanvasElement;
    const fullWidth = Number(output.dataset.heroFullWidth);
    const fullHeight = Number(output.dataset.heroFullHeight);
    const x = fullWidth * 0.6 - Number(output.dataset.heroTileX);
    const y = fullHeight * 0.4 - Number(output.dataset.heroTileY);
    const width = fullWidth * 0.1, height = fullHeight * 0.2;
    if (x < 0 || y < 0 || x + width > output.width || y + height > output.height) {
      throw new Error('The comparison region must be inside both viewport crops.');
    }
    const sample = document.createElement('canvas');
    sample.width = 64;
    sample.height = 64;
    const context = sample.getContext('2d')!;
    context.drawImage(output, x, y, width, height, 0, 0, 64, 64);
    return [...context.getImageData(0, 0, 64, 64).data];
  });
}

test('browser: wave.viewport preserves the editable full-size wave through zoom', async ({ page }) => {
  // Standard browser DPR 1, selected render scale 2. At 200% the original
  // full-scene allocation is 11304 px wide: the same overflow as Retina 100%.
  // Real defaults: 2826×1080, 310 ribs, masks and postprocessing retained.
  await page.addInitScript(() => localStorage.setItem('toolcraft:work-with-masks-hero:state:v2', JSON.stringify({
    version: 2, state: { canvas: { zoom: 40, offset: { x: 0, y: 0 } },
      timeline: { isPlaying: false, currentTimeSeconds: 0 }, values: { 'canvas.renderScale': 2 } },
  })));
  const failures: string[] = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => {
    if (/GL_INVALID|FRAMEBUFFER|too (big|large)|exceeds.*(GPU|texture)/i.test(message.text())) failures.push(message.text());
  });
  // The protected session reloads the page; avoid starting a discarded GPU scene
  // before that mandatory fresh navigation.
  await page.goto('/', { waitUntil: 'commit' });
  const session = await createToolcraftBrowserProofSession(page);
  const output = page.locator(outputSelector);
  await page.waitForFunction(() => Number(document.querySelector<HTMLElement>('[data-hero-render-count]')?.dataset.heroRenderCount) > 0);
  const originalNode = await output.elementHandle();
  const before = await readWave(page);
  const pixelsBefore = await sampleWave(page);
  const viewport = session.observe(root => {
    const world = root.querySelector<HTMLElement>('[data-toolcraft-canvas-world]')!;
    const wave = root.querySelector<HTMLElement>('[data-wave-frame-width]')!;
    return { offsetX: Number(world.dataset.toolcraftCanvasOffsetX),
      offsetY: Number(world.dataset.toolcraftCanvasOffsetY), zoom: Number(world.dataset.toolcraftCanvasZoom),
      outputWidth: Number(wave.dataset.waveFrameWidth), outputHeight: Number(wave.dataset.waveFrameHeight) };
  });
  const initialViewport = await readToolcraftBrowserObservation(viewport);
  expect([initialViewport.outputWidth, initialViewport.outputHeight]).toEqual([2826, 1080]);
  await expectToolcraftViewportSideEffect(viewport, session.targetAction('canvas.viewport.zoom', async browserPage => {
    const bounds = await browserPage.getByRole('application', { name: 'Canvas viewport' }).boundingBox();
    if (!bounds) throw new Error('Missing canvas viewport.');
    await browserPage.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await browserPage.keyboard.down('Control');
    for (let step = 0; step < 8; step++) await browserPage.mouse.wheel(0, -40);
    await browserPage.keyboard.up('Control');
  }), { ...initialViewport, zoom: 200 }, { requirementId: 'wave.viewport', stabilityIntervalMs: 0 });
  await page.waitForFunction(() => Number(document.querySelector<HTMLElement>('[data-hero-full-width]')?.dataset.heroFullWidth) === 11304);
  const after = await readWave(page);
  expect(after.count).toBeGreaterThan(before.count);
  expect(after.count - before.count).toBeLessThanOrEqual(2);
  expect(after.phase).toBe(before.phase);
  expect(await output.evaluate((node, original) => node === original, originalNode)).toBe(true);
  for (const frame of [before, after]) {
    expect(frame.gpuWidth).toBe(frame.width);
    expect(frame.gpuHeight).toBe(frame.height);
    expect(Math.abs(frame.width - frame.cssWidth * 2)).toBeLessThan(1);
    expect(Math.abs(frame.height - frame.cssHeight * 2)).toBeLessThan(1);
    expect(frame.gpuError).toBe(0);
  }
  expect(after.width).toBeLessThanOrEqual((1280 + 192) * 2 + 1);
  expect(after.height).toBeLessThanOrEqual((720 + 192) * 2 + 1);
  const pixelsAfter = await sampleWave(page);
  const difference = pixelsBefore.reduce((sum, value, index) => sum + Math.abs(value - pixelsAfter[index]), 0) / pixelsBefore.length;
  expect(Math.max(...pixelsBefore) - Math.min(...pixelsBefore)).toBeGreaterThan(5);
  expect(difference).toBeLessThan(5);
  expect(failures).toEqual([]);
});

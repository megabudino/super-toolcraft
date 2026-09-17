import fs from 'node:fs/promises';
import { expect, type Page } from '@playwright/test';
import { runToolcraftBrowserAction, type ToolcraftBrowserProofSession } from './browser-proof-session';
import { createToolcraftOrientationGizmoDragAction } from './browser-orientation-gizmo-actions';
import { downloadImage, icebergSelector, setChoice, setNumber } from './iceberg-test-helpers';

async function observeRenderFrame(page: Page) {
  return page.locator(icebergSelector).evaluate(element => {
    const source = element as HTMLCanvasElement;
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 768;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(source, 0, 0, 768, 768);
    const rgba = ctx.getImageData(0, 0, 768, 768).data;
    const edges = { top: 0, bottom: 0, left: 0, right: 0 };
    for (let i = 0; i < 768; i++) {
      if (rgba[i * 4 + 3] > 16) edges.top++;
      if (rgba[((767 * 768) + i) * 4 + 3] > 16) edges.bottom++;
      if (rgba[(i * 768) * 4 + 3] > 16) edges.left++;
      if (rgba[(i * 768 + 767) * 4 + 3] > 16) edges.right++;
    }
    const host = source.closest<HTMLElement>('[data-toolcraft-product-scene]')!;
    const frame = { x: Number.parseFloat(host.style.left), y: Number.parseFloat(host.style.top), width: Number.parseFloat(host.style.width), height: Number.parseFloat(host.style.height) };
    const css = source.getBoundingClientRect();
    return { edges, frame, backing: [source.width, source.height], expectedBacking: [css.width * devicePixelRatio * 2, css.height * devicePixelRatio * 2] };
  });
}

async function assertUnclippedFrame(page: Page) {
  const observation = await observeRenderFrame(page);
  console.log('Rendered frame borders:', observation);
  expect(observation.edges, 'No cube tip or peak may terminate on the internal renderer edge').toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
  for (let axis = 0; axis < 2; axis++) expect(Math.abs(observation.backing[axis] - observation.expectedBacking[axis]), 'Expanded frame preserves selected CSS × DPR × 2 backing').toBeLessThanOrEqual(1);
  return observation;
}

export async function verifySceneFraming(page: Page, session: ToolcraftBrowserProofSession) {
  await page.getByRole('switch', { name: 'Infinity canvas', exact: true }).check();
  await setNumber(page, 'iceberg.depth', 2.5);
  const deep = await assertUnclippedFrame(page);
  const canvas = await page.locator(icebergSelector).elementHandle();
  const world = page.locator('[data-toolcraft-canvas-world]');
  const initialZoom = Number(await world.getAttribute('data-toolcraft-canvas-zoom'));
  while (Number(await world.getAttribute('data-toolcraft-canvas-zoom')) < 150) {
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  }
  const zoomed = await assertUnclippedFrame(page);
  expect(zoomed.frame, 'Zoom must not fit or recenter the object').toEqual(deep.frame);
  expect(zoomed.backing[0]).toBeGreaterThan(deep.backing[0]);
  while (Number(await world.getAttribute('data-toolcraft-canvas-zoom')) > initialZoom) {
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  }
  for (const [key, value] of [['width', 3.6], ['height', 4], ['seamLevel', 0.6], ['cliff', 0.8], ['erosion', 0.6]] as const) {
    await setNumber(page, `iceberg.${key}`, value);
  }
  await assertUnclippedFrame(page);
  await runToolcraftBrowserAction(createToolcraftOrientationGizmoDragAction(session, 'view.orbit', { x: 65, y: -40 }));
  const rotated = await assertUnclippedFrame(page);
  expect(await canvas!.evaluate(element => element === document.querySelector('[data-iceberg-canvas]')), 'Scene reframing retains the live renderer surface').toBe(true);
  await setChoice(page, 'export.image.resolution', '2K');
  const path = await (await downloadImage(page)).path();
  const bytes = await fs.readFile(path!);
  const artifact = await page.evaluate(async base64 => {
    const data = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([data], { type: 'image/png' }));
    try {
      const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(bitmap, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let borderInk = 0;
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        if (x !== 0 && x !== canvas.width - 1 && y !== 0 && y !== canvas.height - 1) continue;
        const i = (y * canvas.width + x) * 4;
        if (pixels[i] < 250 || pixels[i + 1] < 250 || pixels[i + 2] < 250) borderInk++;
      }
      return { width: bitmap.width, height: bitmap.height, borderInk };
    } finally { bitmap.close(); }
  }, bytes.toString('base64'));
  const edge = Math.max(rotated.frame.width, rotated.frame.height);
  expect([artifact.width, artifact.height]).toEqual([Math.round(rotated.frame.width / edge * 2048), Math.round(rotated.frame.height / edge * 2048)]);
  expect(artifact.borderInk, 'Export uses the expanded frame without cutting the geometry').toBe(0);
  console.log('Expanded frame PNG:', artifact);
}

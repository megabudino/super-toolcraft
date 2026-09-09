import { Buffer } from 'node:buffer';

import defaults from '../src/app/studio-room-default-assets.data.json' with { type: 'json' };
import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { expectToolcraftMediaLifecycle } from './browser-state-evidence-helpers';
import { expect, test } from './toolcraft-product-test';

test('browser: tile images preserve upload order and transforms', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1920, height: 1200 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const thumbnails = page.locator('[data-slot="file-upload-preview-item"] img');
  const tiles = page.locator('[data-studio-room] img');
  // AnimatePresence retains the outgoing image during a source cross-fade.
  const firstTile = page.locator('[data-studio-room] [class*="_tileSlot_"]').first().locator('img').last();
  await expect(thumbnails).toHaveCount(24);
  await expect.poll(() => thumbnails.evaluateAll(images => images.every(image =>
    (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
  ))).toBe(true);
  await expect(tiles).toHaveCount(9);
  await expect.poll(() => tiles.evaluateAll(images => images.every(image =>
    (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
  ))).toBe(true);
  const stack = await page.locator('[data-studio-room]').evaluate(stage => {
    const z = (name: string) => Number(getComputedStyle(stage.querySelector(`[class*="_${name}_"]`)!).zIndex);
    return { tiles: z('tiles'), grid: z('grid'), fineGrid: z('fineGrid'), wall: z('backWall') };
  });
  expect(stack.tiles).toBeGreaterThan(stack.grid);
  expect(stack.tiles).toBeGreaterThan(stack.fineGrid);
  expect(stack.wall).toBeGreaterThan(stack.tiles);

  const originalTile = await firstTile.getAttribute('src');
  const reorder = page.getByRole('button', { name: 'Reorder studio-room-01.webp', exact: true });
  await reorder.scrollIntoViewIfNeeded();
  const from = await reorder.boundingBox();
  const to = await page.getByRole('button', { name: 'Reorder studio-room-02.webp', exact: true }).boundingBox();
  if (!from || !to) throw new Error('Both reorder handles must be visible.');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(thumbnails.first()).toHaveAttribute('alt', 'studio-room-02.webp');
  await expect.poll(() => firstTile.getAttribute('src')).not.toBe(originalTile);
  await expect(tiles).toHaveCount(9);

  await page.getByRole('button', { name: 'Select studio-room-02.webp', exact: true }).click();
  const beforeRotation = await firstTile.screenshot();
  const beforeRotationSource = await firstTile.getAttribute('src');
  await page.getByRole('button', { name: '90° Right', exact: true }).click();
  await expect.poll(() => firstTile.getAttribute('src')).not.toBe(beforeRotationSource);
  await expect(tiles).toHaveCount(9);
  expect((await firstTile.screenshot()).equals(beforeRotation)).toBe(false);
  const beforeFlip = await firstTile.screenshot();
  const beforeFlipSource = await firstTile.getAttribute('src');
  await page.getByRole('button', { name: 'Flip horizontal', exact: true }).click();
  await expect.poll(() => firstTile.getAttribute('src')).not.toBe(beforeFlipSource);
  await expect(tiles).toHaveCount(9);
  expect((await firstTile.screenshot()).equals(beforeFlip)).toBe(false);

  for (const action of ['Flip vertical', '90° Right', '90° Right', '90° Right']) {
    const beforeSource = await firstTile.getAttribute('src');
    const beforePixels = await firstTile.screenshot();
    await page.getByRole('button', { name: action, exact: true }).click();
    await expect.poll(() => firstTile.getAttribute('src')).not.toBe(beforeSource);
    expect((await firstTile.screenshot()).equals(beforePixels)).toBe(false);
  }
  const transformedPixels = await firstTile.screenshot();
  await page.reload();
  await expect(thumbnails.first()).toHaveAttribute('alt', 'studio-room-02.webp');
  await expect(tiles).toHaveCount(9);
  await expect.poll(async () => (await firstTile.screenshot()).equals(transformedPixels)).toBe(true);

  // A real remove affects the output; an intentionally emptied collection stays empty.
  const session = await createToolcraftBrowserProofSession(page);
  const media = session.observe(root => ({
    itemIds: Array.from(root.querySelectorAll('[data-file-upload-preview-key]'))
      .map(item => item.getAttribute('data-file-upload-preview-key')!),
    outputSignature: root.querySelector('[data-studio-room] img') ? 'room-with-images' : 'empty-room',
  }));
  await expectToolcraftMediaLifecycle(media, session.targetAction('tiles.images', async currentPage => {
    const remove = currentPage.getByRole('button', { name: /^Remove studio-room-/ });
    while (await remove.count() > 1) await remove.first().click();
    // The built-in single-image preview exposes its remove action to the keyboard.
    await remove.first().press('Enter');
  }), { itemIds: [], outputSignature: 'empty-room' }, { requirementId: 'tiles.images' });
  await expect(thumbnails).toHaveCount(0);
  await expect(tiles).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-studio-room]')).toBeVisible();
  await expect(thumbnails).toHaveCount(0);
  await expect(tiles).toHaveCount(0);

  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Click to upload an image or drag it onto the canvas', exact: true }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: 'uploaded-room.webp', mimeType: 'image/webp',
    buffer: Buffer.from(defaults[0].dataUrl.split(',')[1], 'base64'),
  });
  await expect(page.getByRole('img', { name: 'uploaded-room.webp', exact: true })).toBeVisible();
  await expect(tiles).toHaveCount(9);
  await expect.poll(() => tiles.evaluateAll(images => images.every(image =>
    (image as HTMLImageElement).naturalWidth > 0,
  ))).toBe(true);
  await page.getByRole('button', { name: 'Reset Tile Images section', exact: true }).click();
  await expect(thumbnails).toHaveCount(24);
  await expect(thumbnails.first()).toHaveAttribute('alt', 'studio-room-01.webp');
  await expect(tiles).toHaveCount(9);
  await page.reload();
  await expect(thumbnails).toHaveCount(24);
  await expect(tiles).toHaveCount(9);
  expect(errors).toEqual([]);
});

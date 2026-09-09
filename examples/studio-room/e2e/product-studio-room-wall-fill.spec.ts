import { appSchema } from '../src/app/app-schema';
import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { expectToolcraftProductObservableToChange } from './product-observable-helpers';
import { expect, test } from './toolcraft-product-test';

test('browser: room.wallFill updates the real Studio Room preview', async ({ page }) => {
  if (appSchema.persistence.storage !== 'localStorage') throw new Error('Expected workspace persistence');
  const key = appSchema.persistence.key;
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(key => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      version: 2,
      state: { values: { 'room.wallFill': '#F1F6DE', 'room.depth': 0.73 } },
    }));
  }, key);
  await page.goto('/');
  const wall = page.locator('[data-studio-room] [class*="_backWall_"]');
  const input = page.getByRole('textbox', { name: 'Wall fill hex', exact: true });
  await expect(input).toHaveValue('#F0F4E2');
  await expect(wall).toHaveCSS('background-color', 'rgb(240, 244, 226)');
  await expect(page.getByRole('button', { name: 'Edit Depth value', exact: true }).first()).toHaveText('0.73');

  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(session,
    session.controlAction('room.wallFill', async control => {
      await control.getByRole('textbox').fill('#123456');
      await control.getByRole('textbox').press('Enter');
      await expect(wall).toHaveCSS('background-color', 'rgb(18, 52, 86)');
    }),
    { requirementId: 'room.wallFill', selector: '[data-studio-room] [class*="_backWall_"]', stabilitySamples: 2, stabilityIntervalMs: 50 },
  );
  await page.reload();
  await expect(input).toHaveValue('#123456');
  await expect(wall).toHaveCSS('background-color', 'rgb(18, 52, 86)');

  // The previous default remains a valid deliberate choice after the one-time update.
  await input.fill('#F1F6DE'); await input.press('Enter');
  await page.reload();
  await expect(input).toHaveValue('#F1F6DE');
  await page.getByRole('button', { name: 'Reset Room section', exact: true }).click();
  await expect(input).toHaveValue('#F0F4E2');
});

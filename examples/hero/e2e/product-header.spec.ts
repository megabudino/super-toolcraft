import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { expectToolcraftProductObservableToChange } from './product-observable-helpers';
import { expect, test } from './toolcraft-product-test';

test('browser: Recraft header fills the Hero viewport and follows canvas breakpoints', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  const header = page.locator('[data-recraft-header]');
  await expect(header).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const geometry = await page.locator('[data-recraft-native-section]').evaluate(root => {
    const viewport = root.getBoundingClientRect();
    const headerRect = root.querySelector('header')!.getBoundingClientRect();
    const hero = root.querySelector('[data-hero-video-frame]')!.getBoundingClientRect();
    return { headerHeight: headerRect.height, headerTop: headerRect.top - viewport.top,
      heroTop: hero.top - viewport.top, heroHeight: hero.height, bottomGap: viewport.bottom - hero.bottom };
  });
  expect(geometry).toEqual({ headerHeight: 64, headerTop: 0, heroTop: 64, heroHeight: 1016, bottomGap: 0 });
  await expect(header.locator('img')).toHaveJSProperty('complete', true);
  await expect(header.locator('img')).toHaveJSProperty('naturalWidth', 40);
  await expect(header.getByRole('link', { name: 'API', exact: true })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Docs', exact: true })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction('canvas.size.width', async () => {
      const width = page.locator('input[value="1920"]');
      await width.fill('644');
      await page.keyboard.press('Enter');
      await expect(header.locator('nav')).toBeHidden();
      await expect(header.getByRole('link', { name: 'Sign in', exact: true })).toBeHidden();
      await expect(header.getByRole('link', { name: 'Try Recraft Studio', exact: true })).toBeVisible();
      await expect(header.locator('img')).toBeVisible();
    }),
    { requirementId: 'hero.reference-header', selector: '[data-recraft-header]' },
  );
  const width = page.locator('input[value="644"]');
  await width.fill('768');
  await page.keyboard.press('Enter');
  await expect(header.locator('nav')).toBeVisible();
  await expect(header.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
});

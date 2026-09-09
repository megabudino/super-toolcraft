import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { expectToolcraftProductObservableToChange } from './product-observable-helpers';
import { expect, test } from './toolcraft-product-test';
import { installNativeHeroFixture } from './product-native-hero-fixture';
import { expectToolcraftReferenceParity } from './browser-acceptance-outcome-helpers';

test('browser native hero: runs independently and responds to its own canvas width', async ({ page }) => {
  await installNativeHeroFixture(page);
  const sourceRequests: string[] = [];
  await page.route(/https?:\/\/(localhost|127\.0\.0\.1):3000\//, route => {
    sourceRequests.push(route.request().url());
    return route.abort();
  });
  await page.goto('/');
  const session = await createToolcraftBrowserProofSession(page);
  const heading = page.locator('[data-toolcraft-hero-heading]');
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText('Get Noticed.Keep Growing.');
  await expect(page.locator('[data-toolcraft-hero-right-lead]')).toHaveText('Every card purchase can become the start of a lasting connection.');
  await expect(page.getByRole('link', { name: 'Fold Studio', exact: true })).toBeVisible();
  await expect(heading).toHaveCSS('font-size', '102px');
  const pause = page.getByLabel('Pause playback', { exact: true });
  if (await pause.isVisible()) await pause.click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('[data-percents-native-section] footer')).toHaveCount(0);
  const bookCall = page.getByRole('link', { name: 'See the story' });
  await expect(bookCall).toHaveAttribute('href', '#hero-media');
  await expect(bookCall).toHaveCSS('color', 'rgb(255, 255, 255)');
  const media = page.locator('[data-hero-media-preview]');
  await expect(page.locator('[data-percents-native-section] video')).toHaveCount(0);
  await expect(media).toHaveJSProperty('complete', true);
  await expect(media).toHaveAttribute('src', /\/images\/home\/hero\/online-shopping\.jpg$/);
  await expect(media).toHaveJSProperty('naturalWidth', 1920);
  await expect(media).toHaveJSProperty('naturalHeight', 1080);
  await expect(media).toHaveCSS('width', '2400px');
  await expect.poll(() => page.locator('[data-percents-native-section] img').evaluateAll(images =>
    images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const logoImages = page.getByRole('list', { name: 'Partner brands' }).locator('img');
  expect(await logoImages.evaluateAll(images => images.every(image => {
    const src = image.getAttribute('src') ?? '';
    return /\/images\/home\/hero\/(logos\/[^/]+|revolut)\.svg$/.test(src)
      && getComputedStyle(image).filter === 'none';
  }))).toBe(true);
  await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Percents Figtree"') && document.fonts.check('16px "Percents Inter"'))).toBe(true);

  const wave = await page.locator('canvas[data-toolcraft-product-output="hero"]').elementHandle();
  if (!wave) throw new Error('Missing retained wave canvas.');
  const readWaveFrame = () => wave.evaluate(element => {
    const canvas = element as HTMLCanvasElement;
    const bounds = canvas.getBoundingClientRect();
    const site = document.querySelector('[data-percents-native-section]')!.getBoundingClientRect();
    return {
      backing: [canvas.width, canvas.height],
      expectedBacking: [Math.round(bounds.width * devicePixelRatio * 2), Math.round(bounds.height * devicePixelRatio * 2)],
      width: bounds.width,
      composition: [bounds.width / site.width, bounds.height / site.width,
        (bounds.x - site.x) / site.width, (bounds.y - site.y) / site.width],
      phase: canvas.dataset.heroFrameProgress,
      renderCount: Number(canvas.dataset.heroRenderCount),
    };
  });
  await expect.poll(async () => (await readWaveFrame()).renderCount).toBeGreaterThan(0);
  const beforeZoom = await readWaveFrame();
  const expectStableZoomComposition = async () => {
    await expect.poll(async () => {
      const frame = await readWaveFrame();
      return frame.backing.every((value, index) => Math.abs(value - frame.expectedBacking[index]) <= 1);
    }).toBe(true);
    const frame = await readWaveFrame();
    expect(frame.phase).toBe(beforeZoom.phase);
    frame.composition.forEach((value, index) => expect(value).toBeCloseTo(beforeZoom.composition[index], 5));
    expect(await wave.evaluate(element => element.isConnected)).toBe(true);
    await expect(heading).toHaveCSS('font-size', '102px');
  };
  await page.getByLabel('Zoom out', { exact: true }).click();
  await expect.poll(async () => (await readWaveFrame()).width).toBeLessThan(beforeZoom.width);
  await expectStableZoomComposition();
  expect((await readWaveFrame()).renderCount).toBeGreaterThan(beforeZoom.renderCount);
  await page.getByLabel('Zoom in', { exact: true }).click();
  await expect.poll(async () => (await readWaveFrame()).width).toBeCloseTo(beforeZoom.width, 2);
  await expectStableZoomComposition();
  const waveBounds = await wave.boundingBox();
  if (!waveBounds) throw new Error('Missing visible wave bounds.');
  await page.mouse.move(waveBounds.x + waveBounds.width / 2, waveBounds.y + waveBounds.height / 2);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -80);
  await page.keyboard.up('Control');
  await expect.poll(async () => (await readWaveFrame()).width).toBeGreaterThan(beforeZoom.width);
  await expectStableZoomComposition();

  const widthControl = page.locator('[data-toolcraft-control-target="canvas.size.width"] input');
  await expectToolcraftProductObservableToChange(session,
    session.targetAction('canvas.size.width', async () => {
      await widthControl.fill('390');
      await widthControl.press('Enter');
    }), { requirementId: 'hero.native-section', selector: '[data-toolcraft-hero-heading]' });
  await expect(page.locator('[data-percents-native-section]')).toHaveCSS('width', '390px');
  await expect(heading).toHaveCSS('font-size', '40px');
  await expect(media).toHaveCSS('width', '390px');
  await expect(page.getByRole('list', { name: 'Partner brands' }).locator('li:visible')).toHaveCount(4);
  expect(await wave.evaluate(element => element.isConnected)).toBe(true);
  expect(sourceRequests).toEqual([]);
  await expectToolcraftReferenceParity(async () => ({
    headingSize: await heading.evaluate(element => getComputedStyle(element).fontSize),
    visibleLogoSlots: await page.getByRole('list', { name: 'Partner brands' }).locator('li:visible').count(),
    staticMediaLoaded: await media.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth === 1920),
  }), { headingSize: '40px', visibleLogoSlots: 4, staticMediaLoaded: true },
  { requirementId: 'hero.native-section', target: 'canvas.size.width' });
});

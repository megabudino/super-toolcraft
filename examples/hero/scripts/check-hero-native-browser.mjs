import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
const originalRequests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => {
  if (/^https?:\/\/(?:localhost|127\.0\.0\.1):(?:3000|3100)\//.test(request.url())) originalRequests.push(request.url());
});
try {
  await page.goto('http://127.0.0.1:3101');
  await page.waitForSelector('[data-hero-gallery-ready="true"]');
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('iframe').count(), 0);
  const headingGeometry = await page.locator('#hero-title').evaluate(element => {
    const heading = element.getBoundingClientRect();
    const section = element.closest('section').getBoundingClientRect();
    return { x: heading.x - section.x, y: heading.y - section.y, width: heading.width, height: heading.height,
      lineMargin: getComputedStyle(element.lastElementChild).marginTop };
  });
  // Measured against the read-only original /v4styles at the same 1920×1080 viewport.
  assert.equal(headingGeometry.lineMargin, '-24px');
  assert.equal(headingGeometry.width, 882);
  assert.ok(Math.abs(headingGeometry.height - 250.54684448242188) < .01);
  assert.ok(Math.abs(headingGeometry.y - 297.9543762207031) < .01);
  await page.getByRole('button', { name: 'Rows', exact: true }).click();
  await page.waitForSelector('[data-hero-gallery="rows"]');
  const rowCanvases = await page.locator('[data-recraft-site-root] canvas').count();
  assert.ok(rowCanvases >= 1);
  await page.getByRole('button', { name: 'Sphere', exact: true }).click();
  await page.waitForSelector('[data-hero-gallery="sphere"][data-hero-gallery-ready="true"]');
  const before = await page.locator('[data-hero-gallery="sphere"]').getAttribute('data-hero-gallery-pan');
  const gallery = page.locator('[data-hero-gallery-canvas]');
  const rect = await gallery.boundingBox();
  assert.ok(rect);
  await page.mouse.move(rect.x + rect.width * .25, rect.y + rect.height * .6);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * .33, rect.y + rect.height * .66, { steps: 12 });
  await page.mouse.up();
  await page.waitForFunction(before => document.querySelector('[data-hero-gallery="sphere"]').getAttribute('data-hero-gallery-pan') !== before, before);
  const editedPan = (await page.locator('[data-hero-gallery="sphere"]').getAttribute('data-hero-gallery-pan')).split(':').slice(0, 2).join(':');
  await page.locator('input[value="See How it Works"]').fill('Explore styles');
  await page.waitForFunction(() => document.querySelector('[data-hero-heading-cta]').textContent === 'Explore styles');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForSelector('[data-hero-gallery="sphere"][data-hero-gallery-ready="true"]');
  assert.equal(await page.locator('[data-hero-heading-cta]').textContent(), 'Explore styles');
  assert.equal((await page.locator('[data-hero-gallery="sphere"]').getAttribute('data-hero-gallery-pan')).split(':').slice(0, 2).join(':'), editedPan);
  await page.locator('input[value="1920"]').fill('768');
  await page.locator('input[value="768"]').press('Enter');
  await page.waitForSelector('[data-hero-mobile-poster]');
  assert.equal(await page.locator('[data-hero-gallery-canvas]').count(), 0);
  await page.getByRole('button', { name: 'Reset controls', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-hero-heading-cta]').textContent === 'See How it Works');
  await mkdir('.toolcraft/browser-artifacts', { recursive: true });
  await page.screenshot({ path: '.toolcraft/browser-artifacts/hero-native-verified.png' });
  assert.deepEqual(errors, []);
  assert.deepEqual(originalRequests, []);
  console.log(JSON.stringify({ iframes: 0, rowCanvases, nativePanPersisted: true, ctaPersisted: true, mobileCanvasBreakpoint: true, reset: true, headingGeometry, pageErrors: errors, originalRequests }));
} finally {
  await browser.close();
}

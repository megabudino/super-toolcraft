import { expect, type Page } from '@playwright/test';
import { engravingPixels as materialPixels } from './iceberg-engraving-check';
import { setNumber } from './iceberg-test-helpers';

export async function verifyDramaticLight(page: Page) {
  await setNumber(page, 'iceberg.grain', 0);
  for (const [label, color] of [['Rock', '#FF0000'], ['Ice', '#0000FF']]) {
    const input = page.getByRole('textbox', { name: `${label} hex` });
    await input.fill(color); await input.press('Enter');
  }
  await setNumber(page, 'iceberg.lightDrama', 0);
  const soft = await materialPixels(page);
  const pose = await page.getByRole('application', { name: '3D orientation gizmo' }).getAttribute('data-toolcraft-orientation-pose');
  await setNumber(page, 'iceberg.lightDrama', 1);
  const dramatic = await materialPixels(page);
  const softTones: number[] = [], dramaticTones: number[] = [];
  let brighter = 0, darker = 0, alphaChanges = 0;
  for (let i = 0; i < soft.length; i += 4) {
    if (soft[i + 3] !== dramatic[i + 3]) alphaChanges++;
    if (soft[i + 1] !== 0 || soft[i + 2] !== 0 || soft[i + 3] !== 255 || soft[i] < 7) continue;
    softTones.push(soft[i]); dramaticTones.push(dramatic[i]);
    if (dramatic[i] - soft[i] > 20) brighter++;
    if (soft[i] - dramatic[i] > 20) darker++;
  }
  softTones.sort((a, b) => a - b); dramaticTones.sort((a, b) => a - b);
  const quantile = (tones: number[], fraction: number) => tones[Math.floor((tones.length - 1) * fraction)];
  const softRange = quantile(softTones, 0.9) - quantile(softTones, 0.1);
  const dramaticRange = quantile(dramaticTones, 0.9) - quantile(dramaticTones, 0.1);
  console.log('Dramatic rock light:', { softRange, dramaticRange, brighter, darker, alphaChanges });
  expect(dramaticRange, 'Light-dark separation increases').toBeGreaterThan(softRange * 1.1);
  expect(brighter, 'Some illuminated facets brighten rather than the whole rock dimming').toBeGreaterThan(500);
  expect(darker, 'Shadowed facets darken').toBeGreaterThan(1000);
  expect(quantile(dramaticTones, 0.9), 'Bright highlights remain').toBeGreaterThan(200);
  expect(alphaChanges).toBe(0);
  await expect(page.getByRole('application', { name: '3D orientation gizmo' })).toHaveAttribute('data-toolcraft-orientation-pose', pose!);
  await setNumber(page, 'iceberg.lightDrama', 0);
  expect(await materialPixels(page), 'Returning to zero restores the softer lighting').toEqual(soft);
  await page.getByRole('switch', { name: 'Engraving', exact: true }).check();
  const softEngraving = await materialPixels(page);
  await setNumber(page, 'iceberg.lightDrama', 1);
  const dramaticEngraving = await materialPixels(page);
  let changedInk = 0;
  for (let i = 0; i < softEngraving.length; i += 4) {
    if (soft[i + 1] === 0 && soft[i + 2] === 0 && soft[i + 3] === 255 && Math.abs(softEngraving[i] - dramaticEngraving[i]) > 20) changedInk++;
  }
  expect(changedInk, 'Engraved rock ink follows the new lighting').toBeGreaterThan(1000);
}

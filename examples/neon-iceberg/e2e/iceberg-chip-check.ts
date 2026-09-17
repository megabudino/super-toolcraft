import { expect, type Page } from '@playwright/test';
import { boundaryProfile, surfacePixels } from './iceberg-seam-check';
import { icebergSelector, setNumber } from './iceberg-test-helpers';

const material = (p: number[], i: number) => p[i + 3] < 250 ? 0 : p[i] > p[i + 2] * 3 ? 1 : p[i + 2] > p[i] * 3 ? 2 : 0;
function chips(original: number[], next: number[]) {
  const mask = new Uint8Array(512 * 512);
  let changed = 0;
  for (let p = 0; p < mask.length; p++) {
    const a = material(original, p * 4), b = material(next, p * 4);
    if (a && b && a !== b) { mask[p] = 1; changed++; }
  }
  const areas: number[] = [];
  for (let p = 0; p < mask.length; p++) if (mask[p]) {
    const stack = [p]; let area = 0; mask[p] = 0;
    while (stack.length) {
      const q = stack.pop()!; area++;
      for (const n of [q - 1, q + 1, q - 512, q + 512]) if (n >= 0 && n < mask.length && mask[n]) { mask[n] = 0; stack.push(n); }
    }
    if (area > 2) areas.push(area);
  }
  areas.sort((a, b) => a - b);
  return { changed, medianArea: areas[Math.floor(areas.length / 2)] ?? 0, maxArea: Math.max(0, ...areas) };
}
function rootContinuity(original: number[], next: number[]) {
  const jumps: number[] = [];
  for (let p = 513; p < 512 * 511; p++) for (const q of [p + 1, p + 512]) {
    const a = material(original, p * 4), b = material(original, q * 4);
    if (a && b && a !== b && material(next, p * 4) === 1 && material(next, q * 4) === 1) {
      jumps.push(Math.abs(next[p * 4] - next[q * 4]) / Math.max(20, next[p * 4], next[q * 4]));
    }
  }
  jumps.sort((a, b) => a - b);
  return { count: jumps.length, median: jumps[Math.floor(jumps.length / 2)] ?? 1 };
}

export async function verifyChipScale(page: Page) {
  for (const [label, color] of [['Rock', '#FF0000'], ['Ice', '#0000FF']]) {
    const input = page.getByRole('textbox', { name: `${label} hex` });
    await input.fill(color); await input.press('Enter');
  }
  await setNumber(page, 'iceberg.grain', 0);
  await setNumber(page, 'iceberg.seamJagged', 0);
  const original = await surfacePixels(page);
  const profile = await boundaryProfile(page);
  await setNumber(page, 'iceberg.seamScale', 1);
  await setNumber(page, 'iceberg.seamJagged', 1);
  await expect.poll(() => surfacePixels(page)).not.toEqual(original);
  const smallPixels = await surfacePixels(page), small = chips(original, smallPixels);
  await setNumber(page, 'iceberg.seamScale', 3);
  await expect.poll(() => surfacePixels(page)).not.toEqual(smallPixels);
  const largePixels = await surfacePixels(page), large = chips(original, largePixels);
  const continuity = rootContinuity(original, largePixels);
  console.log('Chip scale/continuity:', { small, large, continuity });
  expect(large.changed).toBeGreaterThan(small.changed * 1.8);
  expect(large.maxArea).toBeGreaterThan(small.maxArea * 2);
  expect(continuity.count).toBeGreaterThan(15);
  expect(continuity.median, 'Rock lighting must continue through the old junction').toBeLessThan(0.12);
  expect(largePixels.filter((_, i) => i % 4 === 3)).toEqual(original.filter((_, i) => i % 4 === 3));
  const enlargedProfile = await boundaryProfile(page);
  expect(enlargedProfile.summit).toBe(profile.summit);
  expect(enlargedProfile.bottom).toEqual(profile.bottom);
  await page.locator(icebergSelector).screenshot({ path: '.toolcraft/browser-artifacts/chips-3x.png' });
  await setNumber(page, 'iceberg.seamJagged', 0);
  await expect.poll(() => surfacePixels(page)).toEqual(original);
  await setNumber(page, 'iceberg.seamScale', 1);
  await expect.poll(() => surfacePixels(page)).toEqual(original);
}

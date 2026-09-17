import { expect, type Page } from '@playwright/test';
import { icebergSelector, setNumber } from './iceberg-test-helpers';

export async function engravingPixels(page: Page, size = 512) {
  const encoded = await page.locator(icebergSelector).evaluate((element, size) => {
    const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(element as HTMLCanvasElement, 0, 0, size, size);
    const bytes = ctx.getImageData(0, 0, size, size).data;
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  }, size);
  return Buffer.from(encoded, 'base64');
}

export async function engravingScopeFixture(page: Page) {
  for (const [key, value] of [['grain', 0], ['seamJagged', 1], ['seamScale', 3]] as const) {
    await setNumber(page, `iceberg.${key}`, value);
  }
  for (const [label, color] of [['Rock', '#FF0000'], ['Ice', '#0000FF']]) {
    const input = page.getByRole('textbox', { name: `${label} hex` });
    await input.fill(color); await input.press('Enter');
  }
}

export function assertRockOnlyEngraving(plain: Buffer, engraved: Buffer) {
  let alphaChanges = 0, cubeChanges = 0, cubePixels = 0, rockChanges = 0;
  const cube = (i: number) => plain[i] === 0 && plain[i + 1] === 0 && plain[i + 2] > 10 && plain[i + 3] === 255;
  for (let i = 0; i < plain.length; i += 4) {
    if (plain[i + 3] !== engraved[i + 3]) alphaChanges++;
    // Exclude mixed antialiased boundary pixels that quantize to blue.
    if ([-2052, -2048, -2044, -4, 0, 4, 2044, 2048, 2052].every(offset => cube(i + offset))) {
      cubePixels++;
      if ([0, 1, 2].some(channel => plain[i + channel] !== engraved[i + channel])) cubeChanges++;
    }
    if (plain[i] > 10 && plain[i + 1] === 0 && plain[i + 2] === 0 && Math.abs(plain[i] - engraved[i]) > 20) rockChanges++;
  }
  console.log('Engraving scope:', { alphaChanges, cubeChanges, cubePixels, rockChanges });
  expect(cubePixels).toBeGreaterThan(1000);
  expect(rockChanges).toBeGreaterThan(1000);
  expect(alphaChanges, 'Rock silhouette remains identical').toBe(0);
  expect(cubeChanges, 'Cube surface and grid remain identical through the jagged seam').toBe(0);
}

function stripeFrequency(pixels: Buffer, xStart: number) {
  // Average a narrow vertical rock patch, then detect its dominant repeated
  // stroke frequency independently of the shader's chosen line count.
  const rows = Array.from({ length: 192 }, (_, row) => {
    let sum = 0;
    for (let x = xStart; x < xStart + 40; x++) sum += pixels[((row + 320) * 1024 + x) * 4];
    return sum / 40;
  });
  const mean = rows.reduce((a, b) => a + b) / rows.length;
  let bestFrequency = 0, bestPower = 0;
  for (let frequency = 8; frequency <= 65; frequency += 0.1) {
    let real = 0, imaginary = 0;
    rows.forEach((value, row) => {
      const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * row / (rows.length - 1));
      const angle = 2 * Math.PI * frequency * row / rows.length;
      real += (value - mean) * window * Math.cos(angle);
      imaginary += (value - mean) * window * Math.sin(angle);
    });
    const power = real * real + imaginary * imaginary;
    if (power > bestPower) { bestPower = power; bestFrequency = frequency; }
  }
  return bestFrequency;
}

export async function verifyEngravingScale(page: Page) {
  await setNumber(page, 'iceberg.grain', 0);
  await setNumber(page, 'iceberg.engravingThickness', 35);
  await setNumber(page, 'iceberg.engravingScale', 1.5);
  const fine = await engravingPixels(page, 1024);
  await setNumber(page, 'iceberg.engravingScale', 3);
  const coarse = await engravingPixels(page, 1024);
  const fineFrequency = stripeFrequency(fine, 460), coarseFrequency = stripeFrequency(coarse, 460);
  const adjacentFrequency = stripeFrequency(coarse, 520);
  console.log('Engraving stroke frequency:', { fineFrequency, coarseFrequency, adjacentFrequency });
  expect(fineFrequency / coarseFrequency, 'Doubling scale doubles visible stroke spacing').toBeCloseTo(2, 1);
  expect(Math.abs(coarseFrequency - adjacentFrequency), 'Horizontal strokes share spacing across different rock facets').toBeLessThan(0.5);
}

import { expect, type Page } from '@playwright/test';
import { createToolcraftBrowserProofSession, runToolcraftBrowserAction } from './browser-proof-session';
import { createToolcraftOrientationAxisSnapAction } from './browser-orientation-gizmo-actions';
import { downloadImage, field, icebergSelector, inspectImage, setChoice, setNumber } from './iceberg-test-helpers';

const faceAxes = { frontColumns: '+z', rightColumns: '+x', backColumns: '-z', leftColumns: '-x' } as const;
export type FaceColumns = keyof typeof faceAxes;
export async function viewTileFace(page: Page, key: FaceColumns) {
  const session = await createToolcraftBrowserProofSession(page);
  await runToolcraftBrowserAction(createToolcraftOrientationAxisSnapAction(session, 'view.orbit', faceAxes[key]));
  const axis = faceAxes[key], index = axis[1] === 'x' ? 0 : 2, sign = axis[0] === '+' ? 1 : -1;
  await expect.poll(async () => {
    const pose = JSON.parse((await page.getByRole('application', { name: '3D orientation gizmo' }).getAttribute('data-toolcraft-orientation-pose'))!);
    return pose.position[index] / Math.hypot(...pose.position);
  }).toBeCloseTo(sign, 5);
}
async function pixels(page: Page) {
  return page.locator(icebergSelector).evaluate(element => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const context = canvas.getContext('2d')!;
    context.drawImage(element as HTMLCanvasElement, 0, 0, 512, 512);
    return Array.from(context.getImageData(0, 0, 512, 512).data);
  });
}
function assertWholeColumns(plain: number[], ink: number[], columns: number, width: number) {
  // Axis-snapped orthographic view: inspect one row between horizontal lines.
  const left = 512 * (0.5 - width / 10), cell = width / 5 * 512 / columns;
  const y = Math.round(512 * (0.5 - (-1.8 + 0.37 * width / columns - 0.66) / 7));
  const centers: number[] = [];
  let start = -1;
  for (let x = Math.ceil(left + cell * 0.3); x <= Math.floor(left + columns * cell - cell * 0.3); x++) {
    const i = (y * 512 + x) * 4;
    const on = plain[i] - ink[i] > 20;
    if (on && start < 0) start = x;
    if (!on && start >= 0) { centers.push((start + x - 1) / 2 + 0.5); start = -1; }
  }
  expect(centers.length, `Rendered internal dividers for ${columns} whole columns`).toBe(columns - 1);
  for (const [i, center] of centers.entries()) {
    // This checks the first/last tile width against both outer cube edges too.
    expect(Math.abs(center - (left + (i + 1) * cell))).toBeLessThan(1.25);
  }
}
export async function verifyFaceColumns(page: Page, key: FaceColumns) {
  await setNumber(page, 'iceberg.depth', 1.8);
  await setNumber(page, 'iceberg.grain', 0);
  await setNumber(page, 'iceberg.gridThickness', 10);
  await setNumber(page, 'iceberg.gridStrength', 0);
  const plain = await pixels(page);
  await setNumber(page, 'iceberg.gridStrength', 1);
  const target = `iceberg.${key}`;
  // The numeric editor can retain fractions; displayed and rendered tile
  // counts must still agree on a whole subdivision.
  await setNumber(page, target, 7.3);
  await expect(field(page, target).getByRole('button', { name: /^Edit .* value$/ })).toHaveText('7');
  assertWholeColumns(plain, await pixels(page), 7, 2.35);
  const before = await pixels(page);
  const other = key === 'frontColumns' ? 'backColumns' : 'frontColumns';
  await setNumber(page, `iceberg.${other}`, 23);
  expect(await pixels(page), 'Editing another side leaves this face unchanged').toEqual(before);
  for (const count of [1, 32]) {
    await setNumber(page, target, count);
    assertWholeColumns(plain, await pixels(page), count, 2.35);
  }
  if (key === 'frontColumns') {
    await setNumber(page, target, 13);
    await setNumber(page, 'iceberg.width', 3.1);
    await setNumber(page, 'iceberg.gridStrength', 0);
    const widerPlain = await pixels(page);
    await setNumber(page, 'iceberg.gridStrength', 1);
    assertWholeColumns(widerPlain, await pixels(page), 13, 3.1);
  }
}
export async function verifySidePatterns(page: Page) {
  for (const [target, value] of [['depth', 1.8], ['seamJagged', 1], ['seamScale', 3], ['grain', 0], ['gridStrength', 0]] as const) {
    await setNumber(page, `iceberg.${target}`, value);
  }
  for (const [label, color] of [['Rock', '#FF0000'], ['Ice', '#FFFFFF']]) {
    const input = page.getByRole('textbox', { name: `${label} hex` });
    await input.fill(color); await input.press('Enter');
  }
  const plain = await pixels(page);
  await setNumber(page, 'iceberg.gridStrength', 1);
  const decorated = await pixels(page);
  let changed = 0, alphaChanges = 0, rockChanges = 0;
  const isRock = (i: number) => plain[i] > 10 && plain[i + 1] === 0 && plain[i + 2] === 0;
  for (let i = 0; i < plain.length; i += 4) {
    if (decorated[i + 3] !== plain[i + 3]) alphaChanges++;
    // Exclude mixed antialiased boundary pixels that quantize to red. A full
    // 3×3 rock neighborhood identifies the unaffected rock interior.
    const rock = [-2052, -2048, -2044, -4, 0, 4, 2044, 2048, 2052].every(offset => isRock(i + offset));
    if (rock && plain.slice(i, i + 3).some((value, channel) => decorated[i + channel] !== value)) rockChanges++;
    if (plain[i] - decorated[i] > 20) changed++;
  }
  expect(changed).toBeGreaterThan(100);
  expect(alphaChanges).toBe(0);
  expect(rockChanges).toBe(0);
  await setChoice(page, 'export.image.resolution', '2K');
  const printedExport = await inspectImage(page, await downloadImage(page));
  await setNumber(page, 'iceberg.gridStrength', 0);
  expect(await pixels(page)).toEqual(plain);
  const plainExport = await inspectImage(page, await downloadImage(page));
  expect(printedExport.inspection.width).toBe(1536);
  expect(printedExport.inspection.height).toBe(2048);
  expect(printedExport.inspection.decodedPixelHash).not.toBe(plainExport.inspection.decodedPixelHash);
}

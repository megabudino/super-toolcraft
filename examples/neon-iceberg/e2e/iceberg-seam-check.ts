import { expect, type Page } from '@playwright/test';
import { expectToolcraftReferenceParity } from './browser-acceptance-outcome-helpers';
import { downloadImage, icebergSelector, inspectImage, setChoice, setNumber } from './iceberg-test-helpers';

export async function boundaryProfile(page: Page) {
  return page.locator(icebergSelector).evaluate(element => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const context = canvas.getContext('2d')!;
    // Observe a fixed world window. The live scene frame may expand to fit
    // taller bounds, which must not be mistaken for changed summit geometry.
    const host=element.closest<HTMLElement>('[data-toolcraft-product-scene]')!;
    const x=Number.parseFloat(host.style.left), y=Number.parseFloat(host.style.top);
    const width=Number.parseFloat(host.style.width), height=Number.parseFloat(host.style.height);
    context.drawImage(element as HTMLCanvasElement,(x+500)*512/1000,(y+700)*512/1400,width*512/1000,height*512/1400);
    const pixels = context.getImageData(0, 0, 512, 512).data;
    const edge = Array<number>(512).fill(-1);
    const bottom = Array<number>(512).fill(-1);
    let summit = 512;
    for (let x = 0; x < 512; x++) for (let y = 0; y < 512; y++) {
      const i = (y * 512 + x) * 4;
      if (pixels[i + 3] > 127) bottom[x] = y;
      if (pixels[i] > 5 && pixels[i] > pixels[i + 1] * 3 && pixels[i] > pixels[i + 2] * 3) {
        edge[x] = y; summit = Math.min(summit, y);
      }
    }
    return { edge, bottom, summit };
  });
}

export async function surfacePixels(page: Page) {
  return page.locator(icebergSelector).evaluate(element => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const context = canvas.getContext('2d')!;
    context.drawImage(element as HTMLCanvasElement, 0, 0, 512, 512);
    return Array.from(context.getImageData(0, 0, 512, 512).data);
  });
}

export async function verifyComplexSeam(page: Page) {
  // Distinct materials expose the actual geometric interface in rendered pixels.
  for (const [label, color] of [['Rock', '#FF0000'], ['Ice', '#0000FF']]) {
    const input = page.getByRole('textbox', { name: `${label} hex` });
    await input.fill(color); await input.press('Enter');
  }
  await setNumber(page, 'iceberg.seamValley', 0);
  await setNumber(page, 'iceberg.seamVariation', 0);
  const flat = await boundaryProfile(page);
  await setNumber(page, 'iceberg.seamValley', 1.2);
  await expect.poll(async () => (await boundaryProfile(page)).edge).not.toEqual(flat.edge);
  const coarse = await boundaryProfile(page);
  await setChoice(page, 'export.image.resolution', '2K');
  const coarseExport = await inspectImage(page, await downloadImage(page));

  await setNumber(page, 'iceberg.seamVariation', 0.65);
  await expect.poll(async () => (await boundaryProfile(page)).edge).not.toEqual(coarse.edge);
  const complex = await boundaryProfile(page);
  const columns = coarse.edge.map((y, x) => x).filter(x => flat.edge[x] >= 0 && coarse.edge[x] >= 0 && complex.edge[x] >= 0);
  const depression = columns.map(x => coarse.edge[x] - flat.edge[x]);
  const cuts = columns.map(x => complex.edge[x] - coarse.edge[x]);
  expect(Math.max(...depression)).toBeGreaterThan(25);
  expect(Math.max(...cuts) - Math.min(...cuts)).toBeGreaterThan(15);
  expect(Math.min(...cuts)).toBeLessThan(-3);
  expect(Math.max(...cuts)).toBeGreaterThan(3);
  expect(complex.summit).toBe(flat.summit);
  expect(complex.bottom.map(y=>y>=0)).toEqual(flat.bottom.map(y=>y>=0));
  // Expanding the frame changes rounded backing height by a fractional pixel;
  // remapping that bitmap may move antialiased floor coverage by one sample.
  expect(Math.max(...complex.bottom.map((y,x)=>Math.abs(y-flat.bottom[x])))).toBeLessThanOrEqual(1);

  const complexExport = await inspectImage(page, await downloadImage(page));
  expect(complexExport.inspection.width).toBe(1536);
  expect(complexExport.inspection.height).toBe(2048);
  expect(complexExport.inspection.decodedPixelHash).not.toBe(coarseExport.inspection.decodedPixelHash);
}

export async function verifyJaggedSeam(page: Page) {
  for (const [label, color] of [['Rock', '#FF0000'], ['Ice', '#0000FF']]) {
    const input = page.getByRole('textbox', { name: `${label} hex` });
    await input.fill(color); await input.press('Enter');
  }
  await setNumber(page, 'iceberg.seamJagged', 0);
  const organic = await boundaryProfile(page);
  const originalPixels = await surfacePixels(page);
  await setChoice(page, 'export.image.resolution', '2K');
  const organicExport = await inspectImage(page, await downloadImage(page));
  await setNumber(page, 'iceberg.seamJagged', 1);
  await expect.poll(async () => (await boundaryProfile(page)).edge).not.toEqual(organic.edge);
  const jagged = await boundaryProfile(page);
  const patternedPixels = await surfacePixels(page);
  let alphaChanges = 0, remoteChanges = 0, edgeChanges = 0;
  // Find every visible edge in 2D: an orbit view can expose several junctions
  // in one column, so its lowest red pixel alone is not a complete edge mask.
  const material = (i: number) => originalPixels[i + 3] < 128 ? 0 : originalPixels[i] > originalPixels[i + 2] ? 1 : 2;
  const edgeMask = new Uint8Array(512 * 512);
  // The 0.10-world-unit band projects to at most 512 / 5 pixels per unit,
  // plus sampling/antialias coverage in the 512px observation.
  const bandPixels = Math.ceil(0.10 * 512 / 5) + 1;
  for (let y = 1; y < 511; y++) for (let x = 1; x < 511; x++) {
    const p = y * 512 + x, m = material(p * 4);
    const mixedMaterials = originalPixels[p * 4] > 3 && originalPixels[p * 4 + 2] > 3;
    if (mixedMaterials || [p - 1, p + 1, p - 512, p + 512].some(n => material(n * 4) !== m)) edgeMask[p] = 1;
  }
  for (let i = 0; i < originalPixels.length; i += 4) {
    if (originalPixels[i + 3] !== patternedPixels[i + 3]) alphaChanges++;
    if (originalPixels.slice(i, i + 3).some((v, channel) => v !== patternedPixels[i + channel])) {
      const x = (i / 4) % 512, y = Math.floor(i / 4 / 512);
      let nearEdge = false;
      for (let dy = -bandPixels; dy <= bandPixels && !nearEdge; dy++) for (let dx = -bandPixels; dx <= bandPixels && !nearEdge; dx++) {
        if (x + dx >= 0 && x + dx < 512 && y + dy >= 0 && y + dy < 512 && edgeMask[(y + dy) * 512 + x + dx]) nearEdge = true;
      }
      if (nearEdge) edgeChanges++;
      else remoteChanges++;
    }
  }
  expect(alphaChanges, 'The edge pattern must not deform the object').toBe(0);
  expect(remoteChanges, 'Only the narrow junction band may change').toBe(0);
  expect(edgeChanges).toBeGreaterThan(30);
  // The recording's accepted behavior is a local material pattern around
  // stationary valleys, with unchanged remote relief and silhouette.
  await expectToolcraftReferenceParity(async () =>
    `silhouette:${alphaChanges};remote:${remoteChanges};local:${edgeChanges > 30}`,
  'silhouette:0;remote:0;local:true',
  { requirementId: 'iceberg.seamJagged', target: 'iceberg.seamJagged' });
  const shifts = jagged.edge.flatMap((y, x) => y >= 0 && organic.edge[x] >= 0 ? [y - organic.edge[x]] : []);
  expect(Math.max(...shifts.map(Math.abs))).toBeLessThanOrEqual(bandPixels);
  expect(shifts.reduce((sum, v) => sum + Math.abs(v), 0) / shifts.length).toBeLessThan(2);
  expect(jagged.summit).toBe(organic.summit);
  expect(jagged.bottom).toEqual(organic.bottom);
  const jaggedExport = await inspectImage(page, await downloadImage(page));
  expect(jaggedExport.inspection.width).toBe(1536);
  expect(jaggedExport.inspection.height).toBe(2048);
  expect(jaggedExport.inspection.decodedPixelHash).not.toBe(organicExport.inspection.decodedPixelHash);
  await setNumber(page, 'iceberg.seamJagged', 0);
  await expect.poll(() => boundaryProfile(page)).toEqual(organic);
}

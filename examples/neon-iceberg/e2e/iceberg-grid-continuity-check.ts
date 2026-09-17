import { expect, type Page } from '@playwright/test';
import { createToolcraftBrowserProofSession, runToolcraftBrowserAction } from './browser-proof-session';
import { createToolcraftOrientationGizmoDragAction } from './browser-orientation-gizmo-actions';
import { icebergSelector, setNumber } from './iceberg-test-helpers';

type Point = [number, number];
type Segment = [Point, Point];
const size = 1024, halfWidth = 2.35 / 2, depth = 1.2;
const normalized = (v: number[]) => v.map(n => n / Math.hypot(...v));
const cross = (a: number[], b: number[]) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const dot = (a: number[], b: number[]) => a.reduce((s, n, i) => s + n*b[i], 0);
function expectedGrid(pose: { position: number[]; up: number[] }) {
  const f = normalized(pose.position), right = normalized(cross(pose.up, f)), up = cross(f, right);
  const project = (point: number[]): Point => {
    const p = [point[0], point[1] - 0.66, point[2]];
    return [size*(0.5 + dot(p, right)/5), size*(0.5 - dot(p, up)/7)];
  };
  const segments: Segment[] = [];
  for (const axis of [0, 2]) {
    if (Math.abs(f[axis]) < 0.0001) continue;
    const sign = Math.sign(f[axis]);
    const columns = axis === 2 ? (sign > 0 ? 9 : 11) : (sign > 0 ? 13 : 7);
    const point = (across: number, y: number) => axis === 2 ? [across, y, sign*halfWidth] : [sign*halfWidth, y, across];
    for (let column = 0; column <= columns; column++) {
      const across = -halfWidth + column*2*halfWidth/columns;
      segments.push([project(point(across, -depth)), project(point(across, 1))]);
    }
    for (let row = 0; row*2*halfWidth/columns <= depth+1; row++) {
      const y = -depth + row*2*halfWidth/columns;
      segments.push([project(point(-halfWidth, y)), project(point(halfWidth, y))]);
    }
  }
  return segments;
}
function distanceToSegment(x: number, y: number, [[ax, ay], [bx, by]]: Segment) {
  const dx = bx-ax, dy = by-ay;
  const t = Math.max(0, Math.min(1, ((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
  return Math.hypot(x-ax-t*dx, y-ay-t*dy);
}
async function pixels(page: Page) {
  const encoded = await page.locator(icebergSelector).evaluate((element, size) => {
    const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(element as HTMLCanvasElement, 0, 0, size, size);
    const rgba = ctx.getImageData(0, 0, size, size).data;
    const red = new Uint8Array(size*size);
    for (let i = 0; i < red.length; i++) red[i] = rgba[i*4+3] >= 250 ? rgba[i*4] : 0;
    // Transfer only the observed channel as compact bytes, not four million
    // JSON numbers per frame. Alpha filtering happens on the actual pixels.
    let binary = '';
    for (let i = 0; i < red.length; i += 8192) binary += String.fromCharCode(...red.subarray(i, i+8192));
    return btoa(binary);
  }, size);
  return Buffer.from(encoded, 'base64');
}
async function assertStraightGrid(page: Page) {
  const pose = JSON.parse((await page.getByRole('application', { name: '3D orientation gizmo' }).getAttribute('data-toolcraft-orientation-pose'))!);
  await setNumber(page, 'iceberg.gridStrength', 0);
  const plain = await pixels(page);
  await setNumber(page, 'iceberg.gridStrength', 1);
  const printed = await pixels(page), segments = expectedGrid(pose);
  let inkPixels = 0, offGridPixels = 0, maxDistance = 0;
  for (let i = 0; i < plain.length; i++) {
    if (plain[i]-printed[i] < 35) continue;
    const x = i%size+0.5, y = Math.floor(i/size)+0.5;
    const distance = Math.min(...segments.map(segment => distanceToSegment(x, y, segment)));
    inkPixels++;
    if (distance > 2.5) offGridPixels++;
    maxDistance = Math.max(maxDistance, distance);
  }
  console.log('Planar grid continuity:', { inkPixels, offGridPixels, maxDistance });
  expect(inkPixels).toBeGreaterThan(1000);
  expect(offGridPixels, 'Grid ink must stay on straight cube-plane lines through the jagged cutouts').toBe(0);
}
export async function verifyGridContinuity(page: Page) {
  for (const [key, value] of [
    ['width', 2.35], ['depth', 1.2], ['plateGap', 0],
    ['frontColumns', 9], ['rightColumns', 13], ['backColumns', 11], ['leftColumns', 7],
    ['gridThickness', 4], ['grain', 0], ['seamJagged', 1], ['seamScale', 3],
  ] as const) await setNumber(page, `iceberg.${key}`, value);
  await assertStraightGrid(page);
  const session = await createToolcraftBrowserProofSession(page);
  await runToolcraftBrowserAction(createToolcraftOrientationGizmoDragAction(session, 'view.orbit', { x: 65, y: -18 }));
  await assertStraightGrid(page);
}

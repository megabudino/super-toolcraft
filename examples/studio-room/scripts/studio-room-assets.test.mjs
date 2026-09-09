import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
async function files(directory) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(`${directory}/${entry.name}`)
    : `${directory}/${entry.name}`))).flat();
}

test('ships only the 24 room images used by the animated scene', async () => {
  const expected = Array.from({ length: 24 }, (_, i) =>
    `studio-room-${String(i + 1).padStart(2, '0')}.webp`);
  const assets = JSON.parse(await readFile(path.join(root, 'src/app/studio-room-default-assets.data.json'), 'utf8'));
  assert.deepEqual(assets.map(asset => asset.fileName), expected);
  for (const asset of assets) {
    assert.ok(asset.dataUrl.startsWith('data:image/webp;base64,'));
    const bytes = Buffer.from(asset.dataUrl.split(',')[1], 'base64');
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
  assert.deepEqual((await files('public')).filter(file => /\.(?:png|jpe?g|webp)$/i.test(file)), []);
});

test('keeps only fonts referenced by the preserved section stylesheet', async () => {
  const css = await readFile(path.join(root, 'src/section/reference/reference-styles.module.css'), 'utf8');
  const expected = [...css.matchAll(/url\((\/fonts\/[^)]+)\)/g)].map(match => `public${match[1]}`).sort();
  assert.deepEqual((await files('public/fonts')).sort(), expected);
});

test('uses one animated room instead of a separate mobile fallback', async () => {
  const directory = 'src/section/components/pages/home';
  const component = await readFile(path.join(root, directory, 'pre-footer.tsx'), 'utf8');
  const css = await readFile(path.join(root, directory, 'pre-footer.module.css'), 'utf8');
  assert.ok(!component.includes('PreFooterRoomResponsive'));
  assert.ok(!component.includes('mobileTitle'));
  assert.ok(!css.includes('mobile'));
  assert.ok(component.includes('<AnimatedPreFooterRoom settings={settings}>'));
  assert.ok(!(await readdir(path.join(root, directory))).some(file => file.startsWith('pre-footer-room-responsive')));
});

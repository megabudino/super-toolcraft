// One-off, hash-checked restoration of the exact reference logo set.
import { constants, copyFile, mkdir, mkdtemp, readFile, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceBackup = '/Users/kusnizza/.Trash/percent-hero-content.2fOJAz';
const manifestPath = path.join(root, 'docs/reference/native-hero-manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.realBrandRevision) throw new Error('Real brand restoration has already run.');
const previous = JSON.parse(await readFile(path.join(sourceBackup, 'native-hero-manifest.json'), 'utf8'));
const logos = previous.files.filter(file => /^public\/images\/home\/hero\/(logos\/[^/]+|revolut)\.svg$/.test(file.local));
const concepts = manifest.files.filter(file => file.local.startsWith('public/images/home/hero/concepts/'));
if (logos.length !== 24 || concepts.length !== 24) throw new Error('Expected exactly 24 old and new logos.');
for (const file of [...logos.map(file => ({ ...file, root: sourceBackup })), ...concepts.map(file => ({ ...file, root }))]) {
  const bytes = await readFile(path.join(file.root, file.local));
  if (bytes.length !== file.bytes || createHash('sha256').update(bytes).digest('hex') !== file.sha256) {
    throw new Error(`Asset differs from recorded source: ${file.local}`);
  }
}
for (const file of logos) {
  const destination = path.join(root, file.local);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(sourceBackup, file.local), destination, constants.COPYFILE_EXCL);
}
const retiredBackup = await mkdtemp('/Users/kusnizza/.Trash/percent-hero-concept-logos.');
await copyFile(manifestPath, path.join(retiredBackup, 'native-hero-manifest.json'));
await rename(path.join(root, 'public/images/home/hero/concepts'), path.join(retiredBackup, 'concepts'));
manifest.files = [...manifest.files.filter(file => !concepts.includes(file)), ...logos];
manifest.assetPolicy = '24 original real-brand SVGs in their source colors, one local H.264 video, two local Latin fonts. No unused concept logos or retired video files.';
manifest.realBrandRevision = { date: '2026-09-09', sourceBackup, retiredBackup,
  request: 'логотипы сделай реальных брендов и цветные как были примерно',
  usage: 'Reference/demo marks only; no endorsement or commercial relationship claimed.' };
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Restored ${logos.length} real-brand SVGs. Retired concept backup: ${retiredBackup}`);

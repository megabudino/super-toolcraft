import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

// One-time, bounded content/asset migration. Not a runtime or build dependency.
const root = path.resolve(import.meta.dirname, '..');
const backup = '/Users/kusnizza/.Trash/percent-hero-content.2fOJAz';
const manifestPath = path.join(root, 'docs/reference/native-hero-manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
if (manifest.contentRevision) throw new Error('Content migration already applied.');
await fs.copyFile(manifestPath, path.join(backup, 'native-hero-manifest.json'));

// Rewrite only the old constant blocks; keep the existing component/motion logic.
const sectionPath = path.join(root, 'src/section/components/pages/home/hero-section.tsx');
const section = await fs.readFile(sectionPath, 'utf8');
if (!section.includes('const logoCellSize =')) throw new Error('Hero logo source changed.');
await fs.writeFile(sectionPath, section
  .replace("import { heroContent }", "import { heroContent, partnerLogos }")
  .replace(/const logoCellSize =[\s\S]+?\] as const;\n\n/, ''));
const logoPath = path.join(root, 'src/section/components/header-logo.tsx');
const logo = await fs.readFile(logoPath, 'utf8');
if (!logo.includes('const percentPaths =')) throw new Error('Header logo source changed.');
await fs.writeFile(logoPath, logo.replace(/const percentPaths =[\s\S]+?(?=const collapseThreshold)/,
  "import { brandIconPaths as percentPaths, brandLetterPaths as letterPaths } from './header-brand';\n\n"));

const source = await fs.readFile(path.join(root, 'src/section/components/pages/home/hero-content.ts'), 'utf8');
const brandBlock = source.split('export const conceptBrands = [')[1].split('] as const;')[0];
const brands = [...brandBlock.matchAll(/\['([^']+)', '([^']+)'\]/g)].map(match => [match[1], match[2]]);
if (brands.length !== 24) throw new Error('Expected all 24 concept brands.');
const xml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const colors = ['#24352E', '#23262C', '#645145', '#343650', '#585145', '#29484B'];
const marks = [
  '<path d="M23 53 36 27 49 53H42L36 40 30 53Z"/>',
  '<path d="M24 29h12a11 11 0 0 1 0 22H24Zm6 6v10h6a5 5 0 0 0 0-10Z" fill-rule="evenodd"/>',
  '<path d="m25 33 11-6 11 6v14l-11 6-11-6Zm6 4v6l5 3 5-3v-6l-5-3Z" fill-rule="evenodd"/>',
  '<circle cx="31" cy="40" r="8"/><circle cx="42" cy="40" r="8" opacity=".55"/>',
  '<path d="M25 30h9v9h-9Zm13 0h9v9h-9ZM25 43h9v9h-9Zm13 0h9v9h-9Z"/>',
  '<path d="M26 28h7v16h14v7H26Zm12 0h9v9h-9Z"/>',
];
const assetFiles = [];
for (const [index, [id, name]] of brands.entries()) {
  const local = `public/images/home/hero/concepts/${id}.svg`;
  const family = index % 5 === 1 ? 'Georgia,serif' : 'Arial,sans-serif';
  const size = name.length > 13 ? 18 : name.length > 9 ? 21 : 25;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="245" height="80" viewBox="0 0 245 80"><title>${xml(name)} — fictional concept</title><g fill="${colors[index % colors.length]}">${marks[index % marks.length]}<text x="61" y="48" font-family="${family}" font-size="${size}" font-weight="${index % 5 === 1 ? 400 : 600}" letter-spacing="-.6">${xml(name)}</text></g></svg>\n`;
  await fs.mkdir(path.dirname(path.join(root, local)), { recursive: true });
  await fs.writeFile(path.join(root, local), svg);
  assetFiles.push({ local, source: 'Original fictional concept wordmark for this demo' });
}
assetFiles.push({ local: 'public/videos/home/hero/online-shopping.mp4',
  source: 'https://www.pexels.com/video/a-woman-happily-shopping-online-6994923/' });

// Move only exact legacy shipping media from the prior manifest to recoverable trash.
const retired = manifest.files.filter(file => file.local.startsWith('public/images/home/hero/') ||
  ['public/videos/home/hero/hero-dev-9-no-rounded-h265.mp4',
    'public/videos/home/hero/hero-dev-9-no-rounded-vp9.webm'].includes(file.local));
if (retired.length !== 26) throw new Error('Legacy asset closure differs; inspect before moving.');
for (const asset of retired) {
  const destination = path.join(backup, asset.local);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.rename(path.join(root, asset.local), destination);
}
const removedPaths = new Set(retired.map(asset => asset.local));
manifest.files = manifest.files.filter(asset => !removedPaths.has(asset.local));
for (const asset of assetFiles) {
  const bytes = await fs.readFile(path.join(root, asset.local));
  manifest.files.push({ ...asset, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
manifest.contentRevision = { date: '2026-09-09', brand: 'Looplane (fictional demo)', backup,
  videoAuthor: 'Kindel Media', videoLicense: 'https://www.pexels.com/license/',
  videoEncoding: 'First 10 seconds, 1920x1080, 30fps, H.264 CRF24, no audio, faststart' };
manifest.assetPolicy = '24 original concept logos, one local H.264 video, two local Latin fonts. No retired brand or video assets.';
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ retired: retired.length, backup, assets: manifest.files.filter(file => file.local.startsWith('public/')).length }));

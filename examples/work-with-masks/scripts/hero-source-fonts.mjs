import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import postcss from 'postcss';

/** One-time source migration helper; not imported by the application. */
export async function copyHeroFonts(source, target) {
  const fonts = postcss.root();
  const manifest = [];
  const chunks = path.join(source, '.next/dev/static/chunks');
  for (const name of await fs.readdir(chunks)) {
    if (!/^\[next\]_internal_font_google_(inter|figtree)_.+\.single\.css$/.test(name)) continue;
    const sourceCss = postcss.parse(await fs.readFile(path.join(chunks, name), 'utf8'));
    for (const face of sourceCss.nodes.filter(node => node.type === 'atrule' && node.name === 'font-face')) {
      const range = face.nodes.find(node => node.prop === 'unicode-range')?.value;
      const style = face.nodes.find(node => node.prop === 'font-style')?.value;
      if ((range && !/^U\+(?:0-FF\b|\?\?)/i.test(range)) || (style && style !== 'normal')) continue;
      const local = face.clone();
      local.walkDecls('font-family', decl => { decl.value = decl.value.replace(/(Inter|Figtree)/g, 'Percents $1'); });
      local.walkDecls('src', decl => { decl.value = decl.value.replace(/(?:\/_next\/static|\.\.)\/media\/([^\s)"']+)/g, '/fonts/hero/$1'); });
      fonts.append(local);
      for (const decl of local.nodes.filter(node => node.prop === 'src')) {
        for (const match of decl.value.matchAll(/\/fonts\/hero\/([^\s)"']+)/g)) {
          const sourcePath = `.next/dev/static/media/${match[1]}`;
          const localPath = `public/fonts/hero/${match[1]}`;
          const bytes = await fs.readFile(path.join(source, sourcePath));
          await fs.mkdir(path.dirname(path.join(target, localPath)), { recursive: true });
          await fs.writeFile(path.join(target, localPath), bytes);
          manifest.push({ source: sourcePath, local: localPath, bytes: bytes.length,
            sha256: createHash('sha256').update(bytes).digest('hex') });
        }
      }
    }
  }
  if (manifest.length !== 2) throw new Error('Expected one Latin face each for Inter and Figtree.');
  return { css: fonts.toString(), manifest };
}

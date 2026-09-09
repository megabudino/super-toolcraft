import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { copyHeroFonts } from './hero-source-fonts.mjs';

// One-time mechanical source port. Not part of install, build or runtime.
// Refuses to overwrite a later-edited section.
const source = '/Users/kusnizza/Projects/percents-next';
const target = path.resolve(import.meta.dirname, '..');
const section = path.join(target, 'src/section');
if (await fs.stat(section).catch(() => null)) throw new Error('src/section already exists; review changes instead of rerunning the port.');
const require = createRequire(path.join(target, 'package.json'));
const sourceRequire = createRequire(path.join(source, 'package.json'));
const twRequire = createRequire(sourceRequire.resolve('@tailwindcss/postcss'));
const { compile } = twRequire('@tailwindcss/node');
const { Scanner } = twRequire('@tailwindcss/oxide');
const ts = require('typescript');
const postcss = require('postcss');
const selectors = require('postcss-selector-parser');
const files = [
  'components/header.tsx', 'components/header-logo.tsx', 'components/header-logo-path-morph.ts',
  'components/sticky-header.tsx', 'components/sticky-header.module.css',
  'components/container.tsx', 'components/logos.tsx', 'components/pauseable-video.tsx',
  'components/pages/home/hero-section.tsx', 'components/pages/home/hero-section.module.css',
  'components/pages/home/hero-video-reveal.tsx', 'components/pages/home/hero-video-reveal.module.css',
  'components/ui/button.tsx', 'lib/utils.ts', 'config/website-config.ts',
];
const manifest = [];
const sources = new Map();
async function write(relative, content) {
  const destination = path.join(target, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, content);
}
function record(sourcePath, local, bytes) {
  manifest.push({ source: sourcePath, local, bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex') });
}
function viewportCss(css) {
  css.walkAtRules('media', rule => {
    if (/\b(?:min-|max-)?(?:width|height)\s*[:<>=]/.test(rule.params) && !/prefers-|pointer|hover/.test(rule.params)) {
      rule.name = 'container';
      rule.params = `percents-hero ${rule.params.replace(/^screen\s+and\s+/, '')}`;
    }
    rule.params = rule.params.replace(/([\d.]+)rem\b/g, (_, n) => `${Number(n) * 16}px`);
  });
  css.walkDecls(decl => {
    decl.value = decl.value.replace(/([\d.]+)(?:svw|dvw|vw|cqw)\b/g, 'calc($1 * var(--hero-vw))')
      .replace(/([\d.]+)(?:svh|dvh|vh|cqh)\b/g, 'calc($1 * var(--hero-vh))')
      .replace(/([\d.]+)rem\b/g, (_, n) => `${Number(n) * 16}px`);
  });
}

for (const file of files) {
  const bytes = await fs.readFile(path.join(source, 'src', file));
  let content = bytes.toString().replace(/(['"])@\//g, '$1@/section/');
  if (file === 'components/header.tsx') content = content.replace("'next/link'", "'@/section/reference/link'");
  if (file === 'components/pages/home/hero-section.tsx') {
    content = content.replace("import { HeroRibbonBackground } from './hero-ribbon/hero-ribbon-background';\n", '')
      .replace('        {!isToolcraftPreview && <HeroRibbonBackground />}\n', '');
  }
  if (file === 'components/logos.tsx') {
    content = content.replace("'next/image'", "'@/section/reference/image'")
      .replace("import { Separator } from '@/section/components/ui/separator';", "import { useHeroViewport } from '@/section/reference/viewport-context';")
      .replace('<Separator className="w-auto grow bg-muted" />', '<span className="w-auto grow bg-muted" role="separator" />')
      .replace("  const isGrid = layout === 'grid';", "  const { width: viewportWidth, animationSuspended } = useHeroViewport();\n  const isGrid = layout === 'grid';")
      .replace('if (!canBlurTransition || !isInView) return;', 'if (!canBlurTransition || !isInView || animationSuspended) return;')
      .replace('[activeGridSlotCount, canBlurTransition, isInView, logos.length, visibleCount]', '[activeGridSlotCount, animationSuspended, canBlurTransition, isInView, logos.length, visibleCount]');
    const start = content.indexOf('    const tabletQuery =');
    const end = content.indexOf('  }, [isGrid, visibleCount]);', start);
    if (start < 0 || end < 0) throw new Error('Source logo viewport hook changed');
    content = content.slice(0, start) + `    const breakpointVisibleCount = viewportWidth >= 1280 ? gridVisibleCount
      : viewportWidth >= 768 ? gridLaptopVisibleCount
        : viewportWidth >= 640 ? gridTabletVisibleCount : gridMobileVisibleCount;
    setActiveGridSlotCount(Math.min(visibleCount, breakpointVisibleCount));
  }, [isGrid, viewportWidth, visibleCount]);` + content.slice(end + '  }, [isGrid, visibleCount]);'.length);
  }
  if (file === 'components/header-logo.tsx') {
    content = content.replace("import { useEffect, useRef } from 'react';", "import { useEffect, useRef } from 'react';\nimport { useHeroViewport } from '@/section/reference/viewport-context';")
      .replace('export function HeaderLogo() {', 'export function HeaderLogo() {\n  const { scrollRef } = useHeroViewport();')
      .replace('    const restingLogo = restingLogoRef.current;', '    const scrollTarget = scrollRef.current;\n    if (!scrollTarget) return;\n    const restingLogo = restingLogoRef.current;')
      .replaceAll('window.scrollY', 'scrollTarget.scrollTop')
      .replace("window.addEventListener('scroll'", "scrollTarget.addEventListener('scroll'")
      .replace("window.removeEventListener('scroll'", "scrollTarget.removeEventListener('scroll'")
      .replace('  }, []);', '  }, [scrollRef]);');
  }
  if (file === 'components/sticky-header.tsx') {
    content = content.replace("import styles from './sticky-header.module.css';", "import styles from './sticky-header.module.css';\nimport { useHeroViewport } from '@/section/reference/viewport-context';")
      .replace('  const [hasScrolled,', '  const { scrollRef } = useHeroViewport();\n  const [hasScrolled,')
      .replace('    });\n\n    observer.observe(trigger);', '    }, { root: scrollRef.current });\n\n    observer.observe(trigger);')
      .replace('  }, []);', '  }, [scrollRef]);');
  }
  if (file === 'components/pages/home/hero-video-reveal.tsx') {
    content = content.replace("import styles from './hero-video-reveal.module.css';", "import styles from './hero-video-reveal.module.css';\nimport { useHeroViewport } from '@/section/reference/viewport-context';")
      .replace('  const frameRef =', '  const { scrollRef } = useHeroViewport();\n  const frameRef =')
      .replace('    target: frameRef,', '    target: frameRef,\n    container: scrollRef,');
  }
  if (file.endsWith('.css')) { const css = postcss.parse(content); viewportCss(css); content = css.toString(); }
  sources.set(file, content);
  record(`src/${file}`, `src/section/${file}`, bytes);
  await write(`src/section/${file}`, content);
}

// Compile only the imported hero candidates. Blog/video-player/footer styles are not shipped.
const globalPath = path.join(source, 'src/styles/globals.css');
let globalCss = await fs.readFile(globalPath, 'utf8');
globalCss = globalCss.replace(/@import '\.\/(?:typography|shiki|video)\.css';/g, '');
const globalAst = postcss.parse(globalCss);
globalAst.walkAtRules('layer', layer => { if (layer.params === 'components') layer.remove(); });
globalAst.walkAtRules('keyframes', rule => { if (rule.params.startsWith('campaign-')) rule.remove(); });
globalAst.walkDecls(/^--(?:call-to-action|campaign)-/, decl => decl.remove());
const compiler = await compile(globalAst.toString(), { base: path.dirname(globalPath), from: globalPath, onDependency() {} });
const candidates = new Scanner({ sources: [{ base: section, pattern: '**/*.{ts,tsx}', negated: false }] }).scan();
const css = postcss.parse(compiler.build(candidates));
css.walkComments(comment => comment.remove());
css.walkAtRules('layer', layer => { if (layer.nodes) layer.replaceWith(...layer.nodes); else layer.remove(); });
const tokens = new Set();
css.walkRules(rule => {
  for (let parent = rule.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && /keyframes$/.test(parent.name)) return;
  }
  const nested = rule.parent?.type === 'rule';
  rule.selector = selectors(ast => {
    ast.walkClasses(node => {
      tokens.add(node.value);
      node.replaceWith(selectors.attribute({ attribute: 'class', operator: '~=', value: `ph-${node.value}`,
        quoteMark: '"', raws: { value: JSON.stringify(`ph-${node.value}`) } }));
    });
    ast.each(selector => {
      let mapped = false;
      selector.walk(node => {
        if ((node.type === 'pseudo' && [':root', ':host'].includes(node.value)) || (node.type === 'tag' && ['html', 'body'].includes(node.value))) {
          node.replaceWith(selectors.className({ value: 'siteRoot' })); mapped = true;
        }
      });
      if (!nested && !mapped) {
        const universal = selector.nodes.every(node => node.type === 'universal' || (node.type === 'pseudo' && ['::after', '::before', '::backdrop', '::file-selector-button'].includes(node.value)));
        selector.prepend(selectors.combinator({ value: ' ' }));
        selector.prepend(universal ? selectors.pseudo({ value: ':where', nodes: [selectors.selector({ nodes: [selectors.className({ value: 'siteRoot' })] })] }) : selectors.className({ value: 'siteRoot' }));
      }
    });
  }).processSync(rule.selector);
});
viewportCss(css);

// English-only hero: exact normal Latin faces plus fallback metrics, no unused subsets.
const copiedFonts = await copyHeroFonts(source, target);
const fonts = copiedFonts.css;
manifest.push(...copiedFonts.manifest);
css.append(postcss.parse(`.siteRoot { --font-body-family: 'Percents Inter', 'Percents Inter Fallback'; --font-heading-family: 'Percents Figtree', 'Percents Figtree Fallback'; font-family: var(--font-sans); font-size: 16px; font-weight: 400; line-height: 1.5; color: var(--foreground); -webkit-font-smoothing: antialiased; width: 100%; min-height: 100%; position: relative; background: transparent; color-scheme: light; }`));
await write('src/section/reference/site-styles.module.css', `/* Scoped source theme and only hero utility candidates. */\n@layer theme, base, components, utilities, percents-hero-site;\n${fonts}\n@layer percents-hero-site {\n${css}\n}\n`.replaceAll('--tw-', '--percents-tw-'));
await write('src/section/reference/classes.ts', `const tokens = new Set(${JSON.stringify([...tokens].sort())});\nexport function sectionClasses(value: string | undefined): string | undefined {\n  return value?.split(/\\s+/).map(token => tokens.has(token) ? \`ph-\${token}\` : token).join(' ');\n}\n`);

// Namespace final DOM classes, not source utilities, so Tailwind discovery stays reproducible.
for (const [file, sourceText] of sources) {
  if (!file.endsWith('.tsx')) continue;
  const ast = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  const visit = node => {
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === 'className' && node.initializer) {
      const tag = node.parent.parent.tagName?.getText(ast) ?? '';
      if (/^[a-z]/.test(tag)) {
        const expression = ts.isJsxExpression(node.initializer) ? node.initializer.expression?.getText(ast) : node.initializer.getText(ast);
        if (expression) edits.push({ start: node.initializer.getStart(ast), end: node.initializer.end, value: `{sectionClasses(${expression})}` });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  if (!edits.length) continue;
  let output = sourceText;
  for (const edit of edits.sort((a, b) => b.start - a.start)) output = output.slice(0, edit.start) + edit.value + output.slice(edit.end);
  output = `import { sectionClasses } from '@/section/reference/classes';\n${output}`;
  await write(`src/section/${file}`, output);
}

// Exact explicit asset closure includes every reachable rotating logo and both codec fallbacks.
const heroSource = sources.get('components/pages/home/hero-section.tsx');
const assets = new Set([...heroSource.matchAll(/["'](\/(?:images|videos)\/[^"']+)["']/g)].map(match => match[1]));
for (const asset of assets) {
  const bytes = await fs.readFile(path.join(source, 'public', asset));
  const local = `public${asset}`;
  await write(local, bytes); record(local, local, bytes);
}
await write('docs/reference/native-hero-manifest.json', JSON.stringify({ sourceRoot: source,
  referenceArchitecture: '/Users/kusnizza/Projects/recraft-apps/hero',
  sourceRoute: '/toolcraft/hero', files: manifest, assetPolicy: 'Exact hero closure only; all 24 rotating logos are reachable.' }, null, 2) + '\n');
console.log(JSON.stringify({ modules: files.length, utilityClasses: tokens.size, assets: assets.size,
  totalAssetBytes: manifest.filter(file => file.local.startsWith('public/')).reduce((sum, file) => sum + file.bytes, 0) }));

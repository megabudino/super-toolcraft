import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

// Mechanical migration: keep source utility spelling for Tailwind discovery,
// namespace only final DOM class values so editor-global utilities never match.
const root = path.resolve(process.argv[2] ?? process.cwd());
const section = path.join(root, 'src/section');
const cssFile = path.join(section, 'reference/reference-styles.module.css');
const css = postcss.parse(fs.readFileSync(cssFile, 'utf8'));
const tokens = new Set();
css.walkRules(rule => {
  rule.selector = selectorParser(ast => {
    ast.walkAttributes(node => {
      if (node.attribute !== 'class' || node.operator !== '~=') return;
      const value = node.value.replace(/^ref-/, '');
      tokens.add(value);
      node.setValue(`ref-${value}`, { quoteMark: '"' });
    });
  }).processSync(rule.selector);
});
fs.writeFileSync(cssFile, css.toString());
const helper = `const utilityTokens = new Set(${JSON.stringify([...tokens].sort())});\n\nexport function referenceClasses(value: string | undefined): string | undefined {\n  return value?.split(/\\s+/).map(token => utilityTokens.has(token) ? \`ref-\${token}\` : token).join(' ');\n}\n`;
fs.writeFileSync(path.join(section, 'reference/reference-classes.ts'), helper);
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}
let changed = 0;
for (const file of walk(section).filter(file => file.endsWith('.tsx') && !file.includes('/reference/'))) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === 'className' && node.initializer) {
      const opening = node.parent.parent;
      const tag = opening.tagName?.getText(ast) ?? '';
      if (/^[a-z]/.test(tag)) {
        const expression = ts.isJsxExpression(node.initializer) ? node.initializer.expression?.getText(ast) : node.initializer.getText(ast);
        if (expression && !expression.startsWith('referenceClasses(')) edits.push({ start: node.initializer.getStart(ast), end: node.initializer.end, value: `{referenceClasses(${expression})}` });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (!edits.length) continue;
  let output = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) output = output.slice(0, edit.start) + edit.value + output.slice(edit.end);
  if (!source.includes('import { referenceClasses }')) {
    const directive = /^['"]use client['"];\s*/.exec(output);
    const at = directive?.[0].length ?? 0;
    output = output.slice(0, at) + `import { referenceClasses } from '@/section/reference/reference-classes';\n` + output.slice(at);
  }
  fs.writeFileSync(file, output);
  changed++;
}
console.log(`${path.basename(root)}: namespaced ${tokens.size} utility tokens across ${changed} native DOM modules`);

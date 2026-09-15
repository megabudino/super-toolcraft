import { copyFile, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import ts from "typescript";
import { build } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const entry = join(root, "src/embed/neon-globe.ts");
const output = join(root, "dist-embed");

await build({
  root,
  configFile: false,
  build: {
    outDir: output,
    emptyOutDir: true,
    target: "es2022",
    lib: { entry, formats: ["es"], fileName: () => "neon-globe.js" },
    minify: true,
    sourcemap: false,
  },
});

const declaration = ts.transpileDeclaration(await readFile(entry, "utf8"), {
  fileName: entry,
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
const errors = (declaration.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error);
if (errors.length > 0) {
  throw new Error(errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n")).join("\n"));
}
await writeFile(join(output, "neon-globe.d.ts"), declaration.outputText);
const demo = await readFile(join(root, "examples/neon-globe/index.html"), "utf8");
await writeFile(join(output, "index.html"), demo.replace("../../src/embed/neon-globe.ts", "./neon-globe.js"));
await copyFile(join(root, "docs/website-integration.md"), join(output, "README.md"));
await copyFile(join(root, "node_modules/three/LICENSE"), join(output, "THREE-LICENSE.txt"));
const bundle = await readFile(join(output, "neon-globe.js"));
console.log(`Standalone globe: ${bundle.byteLength} bytes; ${gzipSync(bundle).byteLength} bytes gzip.`);

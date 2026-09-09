import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { chromium } from "playwright";

const url = process.env.TOOLCRAFT_URL ?? "http://127.0.0.1:3003/";
const outputDirectory = join(process.cwd(), "test-results", "editorial-templates");
const templateFieldPattern = /^Template/;

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { height: 1000, width: 1440 } });
const browserErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") browserErrors.push(message.text());
});
page.on("pageerror", (error) => browserErrors.push(error.message));
await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.reload();

const field = page.locator('[data-slot="field"]').filter({ hasText: templateFieldPattern });
const select = field.getByRole("combobox");
await select.click();
const labels = await page.locator('[data-slot="select-item"]').allTextContents();
await page.keyboard.press("Escape");

const captures = [];
for (const label of labels) {
  await select.click();
  await page
    .locator('[data-slot="select-item"]')
    .filter({ has: page.getByText(label, { exact: true }) })
    .last()
    .click();
  const output = page.getByTestId("editorial-pattern-output");
  const id = await output.getAttribute("data-editorial-template");
  const path = join(outputDirectory, `${id}.png`);
  await output.screenshot({ path });
  captures.push({ label, path });
}

const cards = await Promise.all(
  captures.map(async ({ label, path }) => {
    const image = await readFile(path, "base64");
    return `<figure><img src="data:image/png;base64,${image}" alt="${label}"><figcaption>${label}</figcaption></figure>`;
  }),
);

const sheet = await browser.newPage({ viewport: { height: 1000, width: 1400 } });
await sheet.setContent(`<!doctype html><style>
  *{box-sizing:border-box}body{margin:0;padding:28px;background:#c7c7c7;font:14px/1.2 Arial,sans-serif;color:#111}
  main{display:grid;grid-template-columns:repeat(5,1fr);gap:22px 16px}
  figure{margin:0;display:grid;gap:7px}img{display:block;width:100%;aspect-ratio:4/5;object-fit:contain;background:#111}
  figcaption{font-weight:600}
</style><main>${cards.join("")}</main>`);
await sheet.screenshot({
  fullPage: true,
  path: join(outputDirectory, "contact-sheet.png"),
});

await browser.close();
if (browserErrors.length > 0) {
  throw new Error(`Browser errors: ${browserErrors.join(" | ")}`);
}
console.log(`Captured ${captures.length} templates with zero browser errors in ${outputDirectory}`);

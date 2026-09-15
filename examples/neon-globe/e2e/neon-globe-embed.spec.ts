import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { expect, test } from "./toolcraft-product-test";
import { mountEmbed, openEmbedFixture, readCanvasPixels, readDrawCount } from "./neon-globe-embed-helpers";

const landingPreset = JSON.parse(readFileSync(
  new URL("../src/embed/landing-preset.json", import.meta.url), "utf8",
)) as { values: Record<string, unknown> };

test.setTimeout(90000);

for (const size of [
  { name: "desktop", width: 1920, height: 1080, dpr: 1 },
  { name: "mobile", width: 390, height: 844, dpr: 3 },
]) {
  test(`embed: ${size.name} shipped demo is sharp, framed and nonblank`, async ({ page: hostPage }) => {
    const browser = hostPage.context().browser();
    if (!browser) throw new Error("A local browser is required for device-scale coverage.");
    const response = await hostPage.request.get("/dist-embed/");
    const context = await browser.newContext({
      baseURL: new URL(response.url()).origin, viewport: { width: size.width, height: size.height },
      deviceScaleFactor: size.dpr, reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto("/dist-embed/");
      await expect(page.locator("canvas")).toBeVisible();
      await expect.poll(async () => (await readCanvasPixels(page, "canvas")).lit).toBeGreaterThan(1000);
      const pixels = await readCanvasPixels(page, "canvas");
      expect([pixels.cssWidth, pixels.cssHeight]).toEqual([size.width, size.height]);
      expect([pixels.width, pixels.height]).toEqual([size.width * size.dpr * 2, size.height * size.dpr * 2]);
      expect(pixels.corner).toEqual([0, 0, 0, 255]);
      expect(pixels.minX).toBeGreaterThan(0);
      expect(pixels.minY).toBeGreaterThan(0);
      expect(pixels.maxX).toBeLessThan(pixels.width - 1);
      expect(pixels.maxY).toBeLessThan(pixels.height - 1);
      // The existing scene radius is 36% of its short side; bands sit 1% above it.
      const diameter = Math.min(pixels.width, pixels.height) * 0.72;
      for (const extent of [pixels.maxX - pixels.minX, pixels.maxY - pixels.minY]) {
        expect(extent).toBeGreaterThan(diameter * 0.98);
        expect(extent).toBeLessThan(diameter * 1.04);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await mkdir(".toolcraft/browser-artifacts", { recursive: true });
      await page.screenshot({ path: `.toolcraft/browser-artifacts/neon-globe-embed-${size.name}.png` });
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("embed: real pixels move, pause, resume and update without remounting", async ({ page }) => {
  await openEmbedFixture(page);
  await mountEmbed(page, "a", { values: { "effects.crtIntensity": 0, "logos.holdSeconds": 0 } });
  const first = await readCanvasPixels(page);
  await expect.poll(async () => (await readCanvasPixels(page)).hash).not.toBe(first.hash);
  await page.evaluate(() => window.embedGlobes.a.pause());
  const paused = await readCanvasPixels(page);
  const count = await readDrawCount(page);
  await page.waitForTimeout(200);
  expect(await readDrawCount(page)).toBe(count);
  expect((await readCanvasPixels(page)).hash).toBe(paused.hash);
  await page.evaluate(() => window.embedGlobes.a.resume());
  await expect.poll(() => readDrawCount(page)).toBeGreaterThan(count);
  await expect.poll(async () => (await readCanvasPixels(page)).hash).not.toBe(paused.hash);
  await page.evaluate(() => {
    window.embedGlobes.a.pause();
    window.embedGlobes.a.update({ "globe.lineColor": "#FF0000" });
  });
  await expect.poll(async () => page.locator("#a canvas").evaluate((canvas) => {
    const c = canvas as HTMLCanvasElement;
    const bytes = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    for (let i = 0; i < bytes.length; i += 4) {
      if (bytes[i] > 100 && bytes[i + 1] < 20 && bytes[i + 2] < 20) return true;
    }
    return false;
  })).toBe(true);
  await expect(page.locator("#a canvas")).toHaveCount(1);
});

test("embed: real intersection suspends work and does not override manual pause", async ({ page }) => {
  await openEmbedFixture(page);
  await mountEmbed(page);
  await page.mouse.wheel(0, 1600);
  await expect.poll(() => page.evaluate(() => window.embedFrames.size)).toBe(0);
  const hiddenCount = await readDrawCount(page);
  await page.waitForTimeout(150);
  expect(await readDrawCount(page)).toBe(hiddenCount);
  await page.mouse.wheel(0, -1800);
  await expect.poll(() => readDrawCount(page)).toBeGreaterThan(hiddenCount);
  await page.evaluate(() => window.embedGlobes.a.pause());
  const pausedCount = await readDrawCount(page);
  await page.mouse.wheel(0, 1600);
  await page.waitForTimeout(150);
  await page.mouse.wheel(0, -1800);
  await page.waitForTimeout(150);
  expect(await readDrawCount(page)).toBe(pausedCount);
  expect(await page.evaluate(() => window.embedFrames.size)).toBe(0);
});

test("embed: reduced motion is static, responds live, and resizes at full backing scale", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openEmbedFixture(page);
  await mountEmbed(page);
  const staticPixels = await readCanvasPixels(page);
  const count = await readDrawCount(page);
  await page.waitForTimeout(150);
  expect(await readDrawCount(page)).toBe(count);
  expect(await page.evaluate(() => window.embedFrames.size)).toBe(0);
  await page.locator("#a").evaluate((host) => { host.style.width = "390px"; host.style.height = "600px"; });
  await expect.poll(async () => (await readCanvasPixels(page)).height).toBe(1200);
  expect((await readCanvasPixels(page)).width).toBe(780);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => readDrawCount(page)).toBeGreaterThan(count + 2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => page.evaluate(() => window.embedFrames.size)).toBe(0);
  await page.locator("#a").evaluate((host) => { host.style.width = "640px"; host.style.height = "360px"; });
  await expect.poll(async () => (await readCanvasPixels(page)).hash).toBe(staticPixels.hash);
});

test("embed: separate instances and repeated mount/destroy leave no active frames or backing pixels", async ({ page }) => {
  await openEmbedFixture(page);
  await mountEmbed(page, "a");
  await mountEmbed(page, "b");
  await page.evaluate(() => window.embedGlobes.a.pause());
  const a = await readDrawCount(page, "a");
  const b = await readDrawCount(page, "b");
  await expect.poll(() => readDrawCount(page, "b")).toBeGreaterThan(b);
  expect(await readDrawCount(page, "a")).toBe(a);
  await page.evaluate(() => {
    window.embedGlobes.a.destroy();
    window.embedGlobes.b.destroy();
  });
  for (let cycle = 0; cycle < 10; cycle++) {
    await mountEmbed(page);
    await page.evaluate(() => { window.embedGlobes.a.destroy(); window.embedGlobes.a.destroy(); });
    expect(await page.evaluate(() => ({
      canvases: document.querySelectorAll("canvas").length,
      frames: window.embedFrames.size,
      width: window.embedGlobes.a.canvas.width,
      height: window.embedGlobes.a.canvas.height,
    }))).toEqual({ canvases: 0, frames: 0, width: 0, height: 0 });
  }
});

test("embed: shipped static pixels match the supplied editor composition and preserve opaque logo masks", async ({ page }) => {
  await openEmbedFixture(page);
  await page.locator("#a").evaluate((host) => { host.style.width = "960px"; host.style.height = "540px"; });
  await mountEmbed(page, "a", { motion: "still" });
  const actual = await readCanvasPixels(page);
  const referenceHash = await page.evaluate(async (values) => {
    const { drawGlobeFrame } = await import("/src/app/globe-frame.ts");
    const { readGlobeSettings } = await import("/src/app/globe-model.ts");
    const canvas = document.createElement("canvas");
    canvas.width = 1920; canvas.height = 1080;
    const context = canvas.getContext("2d")!;
    context.setTransform(2, 0, 0, 2, 0, 0);
    drawGlobeFrame(context, 960, 540, readGlobeSettings(values), { clear: true, includeBackground: true });
    const bytes = context.getImageData(0, 0, canvas.width, canvas.height).data;
    return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
      .map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }, landingPreset.values);
  expect(actual.hash).toBe(referenceHash);
  await page.evaluate(() => window.embedGlobes.a.update({ "export.includeBackground": false }));
  await expect.poll(async () => (await readCanvasPixels(page)).corner[3]).toBe(0);
  expect((await readCanvasPixels(page)).centerAlpha).toBe(255);
});

test("embed: moving logos settle on the saved composition during their pause", async ({ page }) => {
  await openEmbedFixture(page);
  await page.clock.install();
  await page.locator("#b").evaluate((host) => { host.style.width = "640px"; });
  await mountEmbed(page, "a", { values: { "effects.crtIntensity": 0 } });
  await mountEmbed(page, "b", { motion: "still", values: { "effects.crtIntensity": 0 } });
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(new Date(now + 1000));
  await page.clock.runFor(600);
  const expected = await readCanvasPixels(page, "#b canvas");
  expect((await readCanvasPixels(page)).hash).toBe(expected.hash);
  await page.clock.runFor(250);
  expect((await readCanvasPixels(page)).hash).toBe(expected.hash);
});

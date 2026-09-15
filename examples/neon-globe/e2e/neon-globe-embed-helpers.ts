import { expect, type Page } from "@playwright/test";
import type { NeonGlobe, NeonGlobeOptions } from "../src/embed/neon-globe";

declare global {
  interface Window {
    embedGlobes: Record<string, NeonGlobe>;
    embedDraws: WeakMap<HTMLCanvasElement, number>;
    embedFrames: Set<number>;
  }
}

export async function openEmbedFixture(page: Page) {
  await page.addInitScript(() => {
    window.embedGlobes = {};
    window.embedDraws = new WeakMap();
    window.embedFrames = new Set();
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      window.embedDraws.set(this.canvas, (window.embedDraws.get(this.canvas) ?? 0) + 1);
      return clear.apply(this, args);
    };
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => {
      const id = request((now) => {
        window.embedFrames.delete(id);
        callback(now);
      });
      window.embedFrames.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      window.embedFrames.delete(id);
      cancel(id);
    };
  });
  await page.route("**/embed-test.html", (route) => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="margin:0;background:#000"><main style="display:flex;flex-wrap:wrap">
        <div id="a" style="position:relative;width:640px;height:360px"></div>
        <div id="b" style="position:relative;width:320px;height:360px"></div>
      </main><div style="height:2000px"></div></body></html>`,
  }));
  await page.goto("/embed-test.html");
}

export async function mountEmbed(page: Page, id = "a", options: NeonGlobeOptions = {}) {
  await page.evaluate(async ({ id, options }) => {
    // Exercise the shipped ESM entry, not a test-only rendering adapter.
    const { createNeonGlobe } = await import("/dist-embed/neon-globe.js");
    window.embedGlobes[id] = createNeonGlobe(document.getElementById(id)!, options);
  }, { id, options });
  await expect.poll(() => readDrawCount(page, id)).toBeGreaterThan(0);
}

export function readDrawCount(page: Page, id = "a") {
  return page.evaluate((id) => window.embedDraws.get(window.embedGlobes[id].canvas) ?? 0, id);
}

export function readCanvasPixels(page: Page, selector = "#a canvas") {
  return page.locator(selector).evaluate(async (element) => {
    const canvas = element as HTMLCanvasElement;
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      if (Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]) < 24) continue;
      const index = offset / 4;
      const x = index % canvas.width;
      const y = Math.floor(index / canvas.width);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      lit++;
    }
    const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", pixels))]
      .map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const rect = canvas.getBoundingClientRect();
    const centerOffset = (Math.floor(canvas.height / 2) * canvas.width + Math.floor(canvas.width / 2)) * 4;
    return {
      hash, lit, minX, maxX, minY, maxY,
      width: canvas.width, height: canvas.height, cssWidth: rect.width, cssHeight: rect.height,
      dpr: window.devicePixelRatio, corner: [...pixels.slice(0, 4)], centerAlpha: pixels[centerOffset + 3],
    };
  });
}

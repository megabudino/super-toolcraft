import type { Page } from "@playwright/test";
import { appAcceptance } from "../src/app/app-acceptance-data";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expect } from "./toolcraft-product-test";

export const trailSelector = "[data-fine-details-trail]";
export const cardSelector = `${trailSelector} [data-trail-card]`;
export const trailField = (page: Page, name: string) => page.locator(`[data-toolcraft-control-target="trail.${name}"]`);
export const trailTitle = (name: string) => {
  const row = appAcceptance.find(item => item.id === `trail.${name}`);
  if (!row) throw new Error(`Missing trail acceptance ${name}`);
  return row.browserTestName;
};
export const trailProof = (name: string) => ({
  requirementId: `trail.${name}`, selector: trailSelector,
  baselineStabilityIntervalMs: 50, baselineStabilitySamples: 2,
  stabilityIntervalMs: 50, stabilitySamples: 2,
});
const labels: Record<string, string> = {
  cardSize: "Card size", cardRadius: "Card radius", length: "Length", sizeFalloff: "Size falloff",
  spacing: "Spacing", tilt: "Tilt", smoothness: "Smoothness", lifetime: "Lifetime", fadeIn: "Fade in",
  fadeOut: "Fade out", resumeDelay: "Resume delay", resumeRamp: "Resume ramp",
  "border.width": "Border width", "shadow.blur": "Shadow blur", "shadow.spread": "Shadow spread",
};

export async function setTrailSlider(page: Page, name: string, value: number) {
  const field = trailField(page, name);
  await field.getByRole("button", { name: `Edit ${labels[name]} value`, exact: true }).click();
  const input = field.getByRole("textbox");
  await input.fill(String(value));
  await input.press("Enter");
  await expect(field.getByRole("slider")).toHaveAttribute("aria-valuenow", String(value));
}

export async function dragTrailSlider(page: Page, name: string, fraction: number) {
  const track = trailField(page, name).locator('[data-slot="slider"]').first();
  await track.scrollIntoViewIfNeeded();
  const box = await track.boundingBox();
  if (!box) throw new Error(`Missing trail slider ${name}`);
  await page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * fraction + 1, box.y + box.height / 2);
  return Number(await trailField(page, name).getByRole("slider").getAttribute("aria-valuenow"));
}

export async function prepareTrail(page: Page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.locator(trailSelector)).toBeVisible();
  const typing = page.locator('[data-toolcraft-control-target="prompt.typing.enabled"]').getByRole("switch");
  if (await typing.isChecked()) await typing.click();
  for (const [name, value] of Object.entries({ lifetime: 10000, fadeIn: 0, smoothness: 0, sizeFalloff: 0, tilt: 0, resumeRamp: 0 })) {
    await setTrailSlider(page, name, value);
  }
  await clearTrail(page);
  return session;
}

export async function parkTrailPointer(page: Page) {
  const chrome = page.getByRole("button", { name: "Reset controls", exact: true });
  const box = await chrome.boundingBox();
  if (!box) throw new Error("Expected visible controls chrome outside the product section");
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("[data-fine-details-section]") === null,
    { x: box.x + box.width / 2, y: box.y + box.height / 2 })).toBe(true);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}

// Read hit-tested visible product coordinates. The native reference scales CSS
// pixels with the editor; no synthetic pointer bridge/state is written here.
export async function trailPath(page: Page) {
  return page.locator("[data-fine-details-section]").evaluate(section => {
    const rect = section.getBoundingClientRect();
    const scale = rect.width / (section as HTMLElement).offsetWidth;
    let best: { x: number; y: number; endX: number; scale: number } | undefined;
    for (const fraction of [0.7, 0.3, 0.85, 0.15]) {
      const y = rect.top + rect.height * fraction;
      if (y < 30 || y > innerHeight - 30) continue;
      let start: number | undefined;
      for (let x = Math.max(30, rect.left + 30); x < Math.min(innerWidth - 30, rect.right - 30); x += 10) {
        const hit = document.elementFromPoint(x, y);
        const valid = !!hit?.closest("[data-fine-details-section]") && !hit.closest("[data-fine-details-prompt]");
        if (valid && start === undefined) start = x;
        if (!valid) start = undefined;
        if (start !== undefined && (!best || x - start > best.endX - best.x)) best = { x: start, y, endX: x, scale };
      }
    }
    if (!best || (best.endX - best.x) / scale < 300) throw new Error(`No 300px unobstructed trail path: ${JSON.stringify({ rect, best })}`);
    return best;
  });
}

export async function spawnTrail(page: Page, count = 3, spacing = 64) {
  const path = await trailPath(page);
  const previous = await page.locator(cardSelector).count();
  const length = Number(await trailField(page, "length").getByRole("slider").getAttribute("aria-valuenow"));
  await parkTrailPointer(page);
  await page.mouse.move(path.x + 10 * path.scale, path.y);
  await expect.poll(() => page.locator(cardSelector).count()).toBeGreaterThan(0);
  if (count > 1) await page.mouse.move(path.x + (10 + (count - 1) * spacing + 1) * path.scale, path.y);
  await expect(page.locator(cardSelector)).toHaveCount(Math.min(length, previous + count));
  await parkTrailPointer(page);
  await expect.poll(() => page.locator(`${cardSelector} img`).evaluateAll(images => images.length > 0 && images.every(image =>
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
  await expect.poll(async () => (await readTrail(page)).every(card => card.opacity === 1)).toBe(true);
}

export async function clearTrail(page: Page) {
  const toggle = trailField(page, "enabled").getByRole("switch");
  await parkTrailPointer(page);
  await toggle.click();
  await expect(page.locator(cardSelector)).toHaveCount(0);
  await toggle.click();
  await parkTrailPointer(page);
}

export const readTrail = (page: Page) => page.locator(cardSelector).evaluateAll(elements => elements.map(element => {
  const style = getComputedStyle(element);
  const image = element.querySelector("img")!;
  const imageStyle = getComputedStyle(image);
  const matrix = new DOMMatrixReadOnly(style.transform);
  return {
    x: parseFloat(style.left), y: parseFloat(style.top), width: parseFloat(style.width), height: parseFloat(style.height),
    radius: parseFloat(style.borderRadius), overflow: style.overflow, borderWidth: parseFloat(style.borderLeftWidth),
    borderColor: style.borderLeftColor, shadow: style.boxShadow, opacity: parseFloat(style.opacity),
    scale: Math.hypot(matrix.a, matrix.b), rotation: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI,
    image: image.currentSrc, imageWidth: parseFloat(imageStyle.width), imageHeight: parseFloat(imageStyle.height),
    imageTransform: imageStyle.transform, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
  };
}));

// Sample every frame and every retained/exiting card; never filter an unexpected
// card, opacity or frame from a temporal acceptance observation.
export async function sampleTrail(page: Page, durationMs: number, afterFrameCommit = false) {
  return page.locator(trailSelector).evaluate(async (root, options) => {
    const start = performance.now();
    const identities = new WeakMap<Element, number>();
    let nextIdentity = 0;
    const read = () => Array.from(root.querySelectorAll("[data-trail-card]"), element => {
      const style = getComputedStyle(element);
      const matrix = new DOMMatrixReadOnly(style.transform);
      if (!identities.has(element)) identities.set(element, ++nextIdentity);
      const image = element.querySelector("img")!;
      return { identity: identities.get(element)!, source: image.src, image: image.currentSrc, decoded: image.complete && image.naturalWidth > 0,
        x: parseFloat(style.left), y: parseFloat(style.top), opacity: parseFloat(style.opacity), scale: Math.hypot(matrix.a, matrix.b) };
    });
    const samples: { time: number; animationFrameTime: number; preCommitCards: ReturnType<typeof read>; cards: ReturnType<typeof read> }[] = [];
    await new Promise<void>(resolve => {
      let ended = false;
      let pendingTasks = 0;
      const complete = () => { if (ended && pendingTasks === 0) resolve(); };
      const sample = (animationFrameTime: number) => {
        const preCommitCards = read();
        const frame = { time: animationFrameTime, animationFrameTime, preCommitCards, cards: preCommitCards };
        samples.push(frame);
        // Schedule the next frame immediately, so a delayed post-rAF task never
        // suppresses the next raw observation. Both phases remain in the data.
        if (performance.now() - start < options.durationMs) requestAnimationFrame(sample);
        else ended = true;
        if (options.afterFrameCommit) {
          pendingTasks += 1;
          setTimeout(() => {
            frame.time = performance.now();
            frame.cards = read();
            pendingTasks -= 1;
            complete();
          }, 0);
        }
        complete();
      };
      requestAnimationFrame(sample);
    });
    return samples;
  }, { durationMs, afterFrameCommit });
}

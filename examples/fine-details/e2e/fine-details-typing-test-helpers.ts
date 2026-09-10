import type { Page } from "@playwright/test";
import { appAcceptance } from "../src/app/app-acceptance-data";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expect } from "./toolcraft-product-test";

export const ghostSelector = "span[data-fine-details-prompt-ghost]";
export const promptSelector = "[data-fine-details-prompt]";
export const typingField = (page: Page, name: string) => page.locator(`[data-toolcraft-control-target="prompt.typing.${name}"]`);
export const typingProof = (name: string) => ({ requirementId: `prompt.typing.${name}`, selector: promptSelector, stabilityIntervalMs: 50, stabilitySamples: 2 });
export function typingTitle(name: string) {
  const row = appAcceptance.find(item => item.id === `prompt.typing.${name}`);
  if (!row) throw new Error(`Missing typing acceptance ${name}`);
  return row.browserTestName;
}
export const readGhost = (page: Page) => page.locator(ghostSelector).evaluate(element => element.firstChild?.nodeType === Node.TEXT_NODE ? element.firstChild.textContent ?? "" : "");
export const typingValue = async (page: Page, name: string) => Number(await typingField(page, name).getByRole("slider").getAttribute("aria-valuenow"));

export async function setTypingSlider(page: Page, name: string, label: string, value: number) {
  const field = typingField(page, name);
  await field.getByRole("button", { name: `Edit ${label} value`, exact: true }).click();
  const input = field.getByRole("textbox");
  await input.fill(String(value));
  await input.press("Enter");
  await expect(field.getByRole("slider")).toHaveAttribute("aria-valuenow", String(value));
}

export async function prepareTyping(page: Page, phrase = "Amber") {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  const mode = page.locator('[data-toolcraft-control-target="images.mode"]');
  await mode.getByRole("button", { name: "Trail", exact: true }).click();
  const enabled = typingField(page, "enabled").getByRole("switch");
  if (!await enabled.isChecked()) await enabled.click();
  const phrases = typingField(page, "phrases");
  await expect(phrases.getByRole("textbox")).toHaveCount(6);
  while (await phrases.getByRole("textbox").count() > 1) await phrases.getByRole("button", { name: "Remove Phrase", exact: true }).click();
  await phrases.getByRole("textbox").fill(phrase);
  await setTypingSlider(page, "typeSpeed", "Type speed", 15);
  await setTypingSlider(page, "deleteSpeed", "Delete speed", 20);
  await setTypingSlider(page, "hold", "Hold", 0.8);
  await setTypingSlider(page, "gap", "Gap", 1.2);
  await setTypingSlider(page, "humanize", "Humanize", 0);
  await expect(page.locator(promptSelector)).toBeVisible();
  return session;
}

export async function restartTyping(page: Page) {
  const input = page.locator("[data-fine-details-prompt-input]");
  await input.focus();
  await expect(page.locator(ghostSelector)).toHaveCount(0);
  await input.press("Tab");
  await expect(page.locator(ghostSelector)).toBeVisible();
  await expect.poll(() => readGhost(page)).toBe("");
}

export async function startTypingDrag(page: Page, name: string, fraction: number) {
  const track = typingField(page, name).locator('[data-slot="slider"]').first();
  await track.scrollIntoViewIfNeeded();
  const box = await track.boundingBox();
  if (!box) throw new Error(`Expected visible typing slider ${name}`);
  await page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * fraction + 1, box.y + box.height / 2);
}

export type TypingSample = { time: number; text: string; caret: boolean };
// Observe normal browser frames and DOM text only: never install a clock,
// override randomness, mutate animation state, or publish synthetic proof.
export async function sampleTyping(page: Page, phrase: string, fullCount = 2, fresh = false) {
  return page.locator(promptSelector).evaluate(async (root, settings) => {
    const samples: { time: number; text: string; caret: boolean }[] = [];
    const start = performance.now();
    let completed = 0;
    let departed = !settings.fresh;
    while (performance.now() - start < 12000) {
      const time = await new Promise<number>(resolve => requestAnimationFrame(resolve));
      const ghost = root.querySelector("span[data-fine-details-prompt-ghost]");
      if (!ghost) continue;
      const text = ghost.firstChild?.nodeType === Node.TEXT_NODE ? ghost.firstChild.textContent ?? "" : "";
      const caret = ghost.querySelector("span") !== null;
      if (text !== settings.phrase) departed = true;
      if (samples.at(-1)?.text !== text || samples.at(-1)?.caret !== caret) {
        samples.push({ time, text, caret });
        if (text === settings.phrase && departed) completed += 1;
        if (completed === settings.fullCount) return samples;
      }
    }
    throw new Error(`Did not observe ${settings.fullCount} completed native phrases: ${JSON.stringify(samples)}`);
  }, { phrase, fullCount, fresh });
}

export function typingMetrics(samples: TypingSample[], phrase: string) {
  const fullIndex = samples.findIndex(sample => sample.text === phrase);
  expect(fullIndex).toBeGreaterThan(0);
  const firstIndex = samples.findIndex(sample => sample.text.length > 0);
  const typed = samples.slice(firstIndex, fullIndex + 1);
  for (const sample of typed) expect(phrase.startsWith(sample.text)).toBe(true);
  const full = samples[fullIndex]!;
  const emptyIndex = samples.findIndex((sample, index) => index > fullIndex && sample.text === "");
  const firstDeletion = samples[fullIndex + 1];
  const empty = samples[emptyIndex];
  const next = samples[emptyIndex + 1];
  return {
    typeRate: (phrase.length - typed[0]!.text.length) / (full.time - typed[0]!.time) * 1000,
    typeIntervals: typed.slice(1).map((sample, index) => (sample.time - typed[index]!.time) / (sample.text.length - typed[index]!.text.length)),
    holdMs: firstDeletion ? firstDeletion.time - full.time : NaN,
    deleteRate: firstDeletion && empty ? (firstDeletion.text.length - empty.text.length) / (empty.time - firstDeletion.time) * 1000 : NaN,
    gapMs: empty && next ? next.time - empty.time : NaN,
    deleted: empty ? samples.slice(fullIndex + 1, emptyIndex + 1).map(sample => sample.text) : [],
  };
}

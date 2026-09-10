import { test as playwright, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";
import { cardSelector, clearTrail, dragTrailSlider, parkTrailPointer, prepareTrail, readTrail, sampleTrail, setTrailSlider, spawnTrail, trailPath, trailProof, trailSelector, trailTitle } from "./fine-details-trail-test-helpers";

async function attachNativeTrailDiagnostic(name: string, data: unknown) {
  const path = playwright.info().outputPath(`${name}.json`);
  await writeFile(path, JSON.stringify(data));
  await playwright.info().attach(name, { path, contentType: "application/json" });
}

async function startSingleCard(page: Page) {
  const path = await trailPath(page);
  await parkTrailPointer(page);
  await page.mouse.move(path.x + 20 * path.scale, path.y);
  await expect(page.locator(cardSelector)).toHaveCount(1);
  await parkTrailPointer(page);
}

type Samples = Awaited<ReturnType<typeof sampleTrail>>;
function cycleMetrics(samples: Samples, fadingIn = false, requireMonotonicExit = false) {
  expect(samples.length).toBeGreaterThan(10);
  for (const sample of samples) {
    expect(sample.cards.length).toBeLessThanOrEqual(1);
    for (const card of sample.cards) {
      expect(card.opacity).toBeGreaterThanOrEqual(0);
      expect(card.opacity).toBeLessThanOrEqual(1);
    }
  }
  const bornIndex = samples.findIndex(sample => sample.cards.length === 1);
  expect(bornIndex).toBeGreaterThanOrEqual(0);
  const born = samples[bornIndex]!;
  for (const sample of samples) for (const card of sample.cards) {
    expect(card.identity).toBe(born.cards[0]!.identity);
    expect(card.source).toBe(born.cards[0]!.source);
    if (card.image !== "") expect(card.image).toBe(card.source);
  }
  expect(samples.some(sample => sample.cards[0]?.decoded)).toBe(true);
  const fullIndex = samples.findIndex((sample, index) => index >= bornIndex && sample.cards[0]?.opacity === 1);
  expect(fullIndex).toBeGreaterThanOrEqual(bornIndex);
  const full = samples[fullIndex]!;
  if (fadingIn) {
    expect(born.cards[0]!.opacity).toBeLessThan(0.5);
    for (let index = bornIndex + 1; index <= fullIndex; index += 1) {
      expect(samples[index]!.cards[0]!.opacity).toBeGreaterThanOrEqual(samples[index - 1]!.cards[0]!.opacity);
    }
  }
  const fadeIndex = samples.findIndex((sample, index) => index > fullIndex && sample.cards[0] && sample.cards[0].opacity < 1);
  const removedIndex = samples.findIndex((sample, index) => index > fullIndex && sample.cards.length === 0);
  if (removedIndex >= 0) {
    expect(fadeIndex).toBeGreaterThan(fullIndex);
    if (requireMonotonicExit) {
      for (let index = fadeIndex + 1; index < removedIndex; index += 1) {
        expect(samples[index]!.cards[0]!.opacity, `Native exit samples: ${JSON.stringify(samples.slice(fadeIndex, removedIndex + 1))}`)
          .toBeLessThanOrEqual(samples[index - 1]!.cards[0]!.opacity);
      }
    }
    expect(samples.slice(removedIndex).every(sample => sample.cards.length === 0)).toBe(true);
  }
  return {
    fadeIn: full.time - born.time,
    lifetime: fadeIndex < 0 ? NaN : samples[fadeIndex]!.time - born.time,
    fadeOut: removedIndex < 0 || fadeIndex < 0 ? NaN : samples[removedIndex]!.time - samples[fadeIndex]!.time,
    removed: removedIndex >= 0,
  };
}

for (const name of ["spacing", "tilt"] as const) {
  test(trailTitle(name), async ({ page }) => {
    const session = await prepareTrail(page);
    await spawnTrail(page);
    const before = await readTrail(page);
    let selected = 0;
    await expectToolcraftProductObservableToChange(session, session.targetAction(`trail.${name}`, async () => {
      try { selected = await dragTrailSlider(page, name, name === "spacing" ? 0.42 : 0.85); }
      finally { await page.mouse.up(); }
      await spawnTrail(page, 3, name === "spacing" ? selected : 64);
      const cards = await readTrail(page);
      expect(cards.slice(0, 3)).toEqual(before);
      const added = cards.slice(3);
      expect(added).toHaveLength(3);
      if (name === "spacing") {
        for (let index = 1; index < added.length; index += 1) {
          expect(Math.hypot(added[index]!.x - added[index - 1]!.x, added[index]!.y - added[index - 1]!.y)).toBeCloseTo(selected, 1);
        }
        expect(selected).toBeGreaterThan(64);
      } else {
        expect(before.every(card => card.rotation === 0)).toBe(true);
        expect(added.every(card => Math.abs(card.rotation) <= selected + 0.01)).toBe(true);
        expect(added.some(card => Math.abs(card.rotation) > 0.01)).toBe(true);
      }
    }), trailProof(name));
  });
}

for (const name of ["lifetime", "fadeIn", "fadeOut"] as const) {
  test(trailTitle(name), async ({ page }) => {
    const session = await prepareTrail(page);
    await setTrailSlider(page, "lifetime", name === "fadeIn" ? 10000 : 600);
    await setTrailSlider(page, "fadeOut", 200);
    const baselineSamples = sampleTrail(page, name === "fadeIn" ? 250 : 1100, true);
    await startSingleCard(page);
    const baselineFrames = await baselineSamples;
    await attachNativeTrailDiagnostic(`native-trail-${name}-baseline`, baselineFrames);
    const baseline = cycleMetrics(baselineFrames, false, name === "fadeOut");
    if (name !== "fadeIn") {
      expect(baseline.removed).toBe(true);
      expect(Math.abs(baseline.lifetime - 600)).toBeLessThan(100);
      expect(Math.abs(baseline.fadeOut - 200)).toBeLessThan(100);
    }
    await clearTrail(page);
    let selected = 0;
    await expectToolcraftProductObservableToChange(session, session.targetAction(`trail.${name}`, async () => {
      try { selected = await dragTrailSlider(page, name, name === "lifetime" ? 0.14 : 0.8); }
      finally { await page.mouse.up(); }
      await startSingleCard(page);
    }), trailProof(name));
    // Protected raster snapshots disable CSS/WAAPI animations. Complete them,
    // clear their card through the real UI, then observe a fresh native cycle.
    // No screenshot is taken while either temporal sampling promise is active.
    await clearTrail(page);
    const afterSamples = sampleTrail(page, name === "lifetime" ? selected + 600 : name === "fadeOut" ? selected + 1000 : selected + 600, true);
    await startSingleCard(page);
    const afterFrames = await afterSamples;
    await attachNativeTrailDiagnostic(`native-trail-${name}-changed`, afterFrames);
    const after = cycleMetrics(afterFrames, name === "fadeIn", name === "fadeOut");
    if (name === "lifetime") {
      expect(after.removed).toBe(true);
      expect(Math.abs(after.lifetime - selected)).toBeLessThan(100);
      expect(after.lifetime).toBeGreaterThan(baseline.lifetime * 1.5);
      expect(Math.abs(after.fadeOut - baseline.fadeOut)).toBeLessThan(100);
    } else if (name === "fadeOut") {
      expect(after.removed).toBe(true);
      expect(Math.abs(after.fadeOut - selected)).toBeLessThan(120);
      expect(after.fadeOut).toBeGreaterThan(baseline.fadeOut * 3);
      expect(Math.abs(after.lifetime - 600)).toBeLessThan(100);
    } else {
      expect(Math.abs(after.fadeIn - selected)).toBeLessThan(100);
      expect(after.fadeIn).toBeGreaterThan(baseline.fadeIn + 500);
      expect(after.removed).toBe(false);
    }
  });
}

async function stepResponse(page: Page, label: string) {
  const path = await trailPath(page);
  await parkTrailPointer(page);
  await page.mouse.move(path.x + 20 * path.scale, path.y);
  await expect(page.locator(cardSelector)).toHaveCount(1);
  const origin = (await readTrail(page))[0]!.x;
  const samples = sampleTrail(page, 1100);
  await page.mouse.move(path.x + 220 * path.scale, path.y);
  const result = await samples;
  await attachNativeTrailDiagnostic(`native-trail-smoothness-${label}`, result);
  await parkTrailPointer(page);
  for (const sample of result) {
    expect(sample.cards.length).toBeGreaterThan(0);
    expect(sample.cards.length).toBeLessThanOrEqual(21);
    for (let index = 1; index < sample.cards.length; index += 1) expect(sample.cards[index]!.x - sample.cards[index - 1]!.x).toBeCloseTo(10, 1);
  }
  const start = result[0]!.time;
  const early = result.find(sample => sample.time - start >= 200)!;
  const settled = result.find(sample => sample.cards.at(-1)!.x - origin >= 199.9);
  expect(settled).toBeDefined();
  return { early: early.cards.at(-1)!.x - origin, final: result.at(-1)!.cards.at(-1)!.x - origin,
    settleTime: settled!.time - start };
}

test(trailTitle("smoothness"), async ({ page }) => {
  const session = await prepareTrail(page);
  await setTrailSlider(page, "length", 24);
  await setTrailSlider(page, "spacing", 10);
  const immediate = await stepResponse(page, "baseline");
  expect(immediate.early).toBeGreaterThanOrEqual(190);
  await clearTrail(page);
  await expectToolcraftProductObservableToChange(session, session.targetAction("trail.smoothness", async () => {
    let selected = 0;
    try { selected = await dragTrailSlider(page, "smoothness", 0.95); }
    finally { await page.mouse.up(); }
    const smoothed = await stepResponse(page, "changed");
    expect(smoothed.early).toBeLessThan(immediate.early - 40);
    expect(smoothed.final).toBeGreaterThanOrEqual(180);
    expect(Math.abs(smoothed.settleTime - selected)).toBeLessThan(100);
  }), trailProof("smoothness"));
});

async function observeResume(page: Page, durationMs: number) {
  return page.locator("[data-fine-details-section]").evaluate(async (root, duration) => {
    let focusOutTime: number | null = null;
    const prompt = root.querySelector("[data-fine-details-prompt]")!;
    const onFocusOut = (event: Event) => {
      if (!prompt.contains((event as FocusEvent).relatedTarget as Node | null)) focusOutTime = performance.now();
    };
    prompt.addEventListener("focusout", onFocusOut);
    const start = performance.now();
    const samples: { time: number; cards: { x: number; y: number; opacity: number; scale: number }[] }[] = [];
    try {
      do {
        const time = await new Promise<number>(resolve => requestAnimationFrame(resolve));
        samples.push({ time, cards: Array.from(root.querySelectorAll("[data-trail-card]"), element => {
          const style = getComputedStyle(element);
          const matrix = new DOMMatrixReadOnly(style.transform);
          return { x: parseFloat(style.left), y: parseFloat(style.top), opacity: parseFloat(style.opacity), scale: Math.hypot(matrix.a, matrix.b) };
        }) });
      } while (performance.now() - start < duration);
      return { focusOutTime, samples };
    } finally { prompt.removeEventListener("focusout", onFocusOut); }
  }, durationMs);
}

async function leavePromptFocus(page: Page) {
  const path = await trailPath(page);
  await page.locator("[data-fine-details-prompt-input]").focus();
  await page.mouse.move(path.x + 20 * path.scale, path.y);
  await expect(page.locator(trailSelector)).toHaveAttribute("data-fine-details-trail", "suppressed");
  await page.mouse.click(path.x + 20 * path.scale, path.y);
  return path;
}

test(trailTitle("resumeDelay"), async ({ page }) => {
  const session = await prepareTrail(page);
  await setTrailSlider(page, "resumeDelay", 200);
  const initialObservation = observeResume(page, 700);
  await leavePromptFocus(page);
  const before = await initialObservation;
  await attachNativeTrailDiagnostic("native-trail-resume-delay-baseline", before);
  expect(before.focusOutTime).not.toBeNull();
  const initialCard = before.samples.find(sample => sample.cards.length > 0)!;
  expect(initialCard.time - before.focusOutTime!).toBeGreaterThanOrEqual(180);
  expect(initialCard.time - before.focusOutTime!).toBeLessThan(280);
  await clearTrail(page);
  await expectToolcraftProductObservableToChange(session, session.targetAction("trail.resumeDelay", async () => {
    let selected = 0;
    try { selected = await dragTrailSlider(page, "resumeDelay", 0.7); }
    finally { await page.mouse.up(); }
    const observation = observeResume(page, selected + 500);
    await leavePromptFocus(page);
    const after = await observation;
    await attachNativeTrailDiagnostic("native-trail-resume-delay-changed", after);
    expect(after.focusOutTime).not.toBeNull();
    const bornIndex = after.samples.findIndex(sample => sample.cards.length > 0);
    expect(bornIndex).toBeGreaterThan(0);
    expect(after.samples.slice(0, bornIndex).every(sample => sample.cards.length === 0)).toBe(true);
    const elapsed = after.samples[bornIndex]!.time - after.focusOutTime!;
    expect(elapsed).toBeGreaterThanOrEqual(selected - 20);
    expect(elapsed).toBeLessThan(selected + 80);
    const bornFrames = after.samples.slice(bornIndex);
    expect(bornFrames.every(sample => sample.cards.length === 1)).toBe(true);
    const fullIndex = bornFrames.findIndex(sample => sample.cards[0]!.opacity === 1);
    expect(fullIndex).toBeGreaterThanOrEqual(0);
    expect(bornFrames[fullIndex]!.time - bornFrames[0]!.time).toBeLessThan(50);
    expect(bornFrames[fullIndex]!.time - after.focusOutTime!).toBeLessThan(selected + 80);
    for (let index = 0; index <= fullIndex; index += 1) {
      expect(bornFrames[index]!.cards[0]!.opacity).toBeGreaterThanOrEqual(index ? bornFrames[index - 1]!.cards[0]!.opacity : 0);
      expect(bornFrames[index]!.cards[0]!.opacity).toBeLessThanOrEqual(1);
    }
    expect(bornFrames.slice(fullIndex).every(sample => sample.cards[0]!.opacity === 1)).toBe(true);
    await parkTrailPointer(page);
  }), trailProof("resumeDelay"));
});

test(trailTitle("resumeRamp"), async ({ page }) => {
  const session = await prepareTrail(page);
  await setTrailSlider(page, "resumeDelay", 0);
  await setTrailSlider(page, "length", 12);
  await spawnTrail(page);
  expect((await readTrail(page)).every(card => card.opacity === 1 && card.scale === 1)).toBe(true);
  await clearTrail(page);
  await expectToolcraftProductObservableToChange(session, session.targetAction("trail.resumeRamp", async () => {
    let selected = 0;
    try { selected = await dragTrailSlider(page, "resumeRamp", 0.65); }
    finally { await page.mouse.up(); }
    const observation = observeResume(page, selected + 800);
    const path = await leavePromptFocus(page);
    await expect(page.locator(cardSelector)).toHaveCount(1);
    for (let index = 1; index <= 7; index += 1) {
      await sampleTrail(page, 220);
      await page.mouse.move(path.x + (index % 2 ? 85 : 20) * path.scale, path.y);
      await expect(page.locator(cardSelector)).toHaveCount(index + 1);
    }
    const after = await observation;
    await attachNativeTrailDiagnostic("native-trail-resume-ramp-changed", after);
    expect(after.focusOutTime).not.toBeNull();
    const final = after.samples.at(-1)!.cards;
    expect(final).toHaveLength(8);
    expect(final[0]!.opacity).toBeLessThan(0.2);
    expect(final.at(-1)!.opacity).toBe(1);
    for (let index = 0; index < final.length; index += 1) {
      const born = after.samples.find(sample => sample.cards.length > index)!;
      const progress = Math.min(1, Math.max(0, (born.time - after.focusOutTime!) / selected));
      expect(Math.abs(final[index]!.opacity - (1 - (1 - progress) ** 3))).toBeLessThan(0.06);
      expect(final[index]!.scale).toBeCloseTo(final[index]!.opacity, 2);
      if (index > 0) {
        expect(final[index]!.opacity).toBeGreaterThanOrEqual(final[index - 1]!.opacity);
        expect(Math.hypot(final[index]!.x - final[index - 1]!.x, final[index]!.y - final[index - 1]!.y)).toBeCloseTo(64, 1);
      }
    }
    await parkTrailPointer(page);
  }), trailProof("resumeRamp"));
});

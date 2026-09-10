import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";
import {
  prepareTyping, restartTyping, sampleTyping, startTypingDrag,
  typingField, typingMetrics, typingProof, typingTitle, typingValue,
} from "./fine-details-typing-test-helpers";

for (const [name, fraction] of [
  ["typeSpeed", 0.85], ["deleteSpeed", 0.65], ["hold", 0.25], ["gap", 0.25],
] as const) {
  test(typingTitle(name), async ({ page }) => {
    const session = await prepareTyping(page);
    await restartTyping(page);
    const before = typingMetrics(await sampleTyping(page, "Amber"), "Amber");
    const original = await typingValue(page, name);
    const verify = (metrics: typeof before, selected: number) => {
      if (name === "typeSpeed") expect(Math.abs(metrics.typeRate - selected)).toBeLessThan(selected * 0.12);
      if (name === "deleteSpeed") expect(Math.abs(metrics.deleteRate - selected)).toBeLessThan(selected * 0.2);
      if (name === "hold") expect(Math.abs(metrics.holdMs - (selected * 1000 + 50))).toBeLessThan(65);
      if (name === "gap") expect(Math.abs(metrics.gapMs - selected * 1000)).toBeLessThan(65);
    };
    verify(before, original);
    // A real blur restarts the authored gap, giving the raster helper an
    // empty stable baseline. The target edit then starts its own new cycle.
    await restartTyping(page);
    try {
      await expectToolcraftProductObservableToChange(session, session.targetAction(`prompt.typing.${name}`, async () => {
        await startTypingDrag(page, name, fraction);
        const selected = await typingValue(page, name);
        expect(selected).not.toBe(original);
        const after = typingMetrics(await sampleTyping(page, "Amber"), "Amber");
        verify(after, selected);
        const key = { typeSpeed: "typeRate", deleteSpeed: "deleteRate", hold: "holdMs", gap: "gapMs" }[name] as "typeRate" | "deleteRate" | "holdMs" | "gapMs";
        expect((after[key] - before[key]) * Math.sign(selected - original)).toBeGreaterThan(0);
        // This sample ends at the full phrase, which remains visible for the
        // UI-authored hold; semantic cadence and output were observed while held.
      }), typingProof(name));
    } finally {
      await page.mouse.up();
    }
  });
}

test(typingTitle("humanize"), async ({ page }) => {
  const phrase = "amber cobalt green violet";
  const session = await prepareTyping(page, phrase);
  await restartTyping(page);
  const before = typingMetrics(await sampleTyping(page, phrase, 1), phrase);
  for (const interval of before.typeIntervals) expect(Math.abs(interval - 1000 / 15)).toBeLessThan(30);
  await restartTyping(page);
  try {
    await expectToolcraftProductObservableToChange(session, session.targetAction("prompt.typing.humanize", async () => {
      await startTypingDrag(page, "humanize", 0.98);
      expect(await typingValue(page, "humanize")).toBe(1);
      const after = typingMetrics(await sampleTyping(page, phrase, 1), phrase);
      expect(after.typeIntervals.length).toBeGreaterThanOrEqual(18);
      // The implementation's bounded random delays include word-boundary
      // rhythm and possible 0.4–1s pauses. No deterministic pause is demanded
      // from a random run; the actual cadence must leave the zero-jitter band.
      for (const interval of after.typeIntervals) {
        expect(interval).toBeGreaterThanOrEqual(15);
        expect(interval).toBeLessThan(1200);
      }
      const spread = (intervals: number[]) => Math.max(...intervals) - Math.min(...intervals);
      expect(spread(after.typeIntervals)).toBeGreaterThan(spread(before.typeIntervals) + 25);
      expect(after.typeIntervals.filter(interval => Math.abs(interval - 1000 / 15) > 25).length).toBeGreaterThanOrEqual(3);
    }), typingProof("humanize"));
  } finally {
    await page.mouse.up();
  }
});

test(typingTitle("deleteStyle"), async ({ page }) => {
  const session = await prepareTyping(page);
  await restartTyping(page);
  const before = typingMetrics(await sampleTyping(page, "Amber"), "Amber");
  expect(before.deleted).toEqual(["Ambe", "Amb", "Am", "A", ""]);
  await restartTyping(page);
  await expectToolcraftProductObservableToChange(session, session.targetAction("prompt.typing.deleteStyle", async () => {
    await typingField(page, "deleteStyle").getByRole("button", { name: "Instant", exact: true }).click();
    await expect(typingField(page, "deleteStyle").getByRole("button", { name: "Instant", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(typingField(page, "deleteSpeed")).toHaveCount(0);
    const after = typingMetrics(await sampleTyping(page, "Amber"), "Amber");
    expect(after.deleted).toEqual([""]);
    expect(Math.abs(after.holdMs - 800)).toBeLessThan(65);
  }), typingProof("deleteStyle"));
  await typingField(page, "deleteStyle").getByRole("button", { name: "Backspace", exact: true }).click();
  await expect(typingField(page, "deleteSpeed").getByRole("slider")).toHaveAttribute("aria-valuenow", "20");
  expect(typingMetrics(await sampleTyping(page, "Amber"), "Amber").deleted).toEqual(["Ambe", "Amb", "Am", "A", ""]);
});

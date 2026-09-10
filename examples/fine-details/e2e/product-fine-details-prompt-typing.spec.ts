import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";
import {
  ghostSelector, prepareTyping, readGhost, sampleTyping,
  setTypingSlider, typingField, typingProof, typingTitle,
} from "./fine-details-typing-test-helpers";

test(typingTitle("enabled"), async ({ page }) => {
  const session = await prepareTyping(page);
  const toggle = typingField(page, "enabled").getByRole("switch");
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(page.locator(ghostSelector)).toHaveCount(0);
  await expectToolcraftProductObservableToChange(session, session.targetAction("prompt.typing.enabled", async () => {
    await toggle.click();
    await expect(toggle).toBeChecked();
    const samples = await sampleTyping(page, "Amber", 1);
    expect(samples.some(sample => sample.text.length > 0 && sample.text.length < 5)).toBe(true);
    expect(samples.at(-1)?.text).toBe("Amber");
  }), typingProof("enabled"));
  const input = page.locator("[data-fine-details-prompt-input]");
  await input.focus();
  await expect(page.locator(ghostSelector)).toHaveCount(0);
  await input.fill("Visitor authored prompt");
  await input.press("Tab");
  await expect(page.locator(ghostSelector)).toHaveCount(0);
  await input.fill("");
  await input.press("Tab");
  await expect(page.locator(ghostSelector)).toBeVisible();
  for (const mode of ["Carousel", "Loading"]) {
    await page.locator('[data-toolcraft-control-target="images.mode"]').getByRole("button", { name: mode, exact: true }).click();
    await expect(page.locator(ghostSelector)).toHaveCount(0);
    await expect(typingField(page, "enabled")).toHaveCount(0);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator('[data-toolcraft-control-target="images.mode"]').getByRole("button", { name: "Trail", exact: true }).click();
  await expect.poll(() => readGhost(page)).toBe("Amber");
  await expect(page.locator(`${ghostSelector} span`)).toHaveCount(0);
  const stable = await page.locator(ghostSelector).evaluate(async ghost => {
    const start = performance.now();
    const texts: string[] = [];
    while (performance.now() - start < 450) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      texts.push(ghost.textContent ?? "");
    }
    return [...new Set(texts)];
  });
  expect(stable).toEqual(["Amber"]);
  await toggle.click();
  await expect(page.locator(ghostSelector)).toHaveCount(0);
});

test(typingTitle("phrases"), async ({ page }) => {
  const session = await prepareTyping(page, "A");
  const target = "prompt.typing.phrases";
  const collection = typingField(page, "phrases");
  const inputs = collection.getByRole("textbox");
  const add = collection.getByRole("button", { name: "Add Phrase", exact: true });
  const remove = collection.getByRole("button", { name: "Remove Phrase", exact: true });
  await expect(remove).toBeDisabled();
  await setTypingSlider(page, "gap", "Gap", 0.1);
  await setTypingSlider(page, "hold", "Hold", 0.5);
  await typingField(page, "deleteStyle").getByRole("button", { name: "Instant", exact: true }).click();
  const cycle = session.observe(async root => {
    const first = root.querySelector<HTMLInputElement>('[data-toolcraft-control-target="prompt.typing.phrases"] input')!.value;
    const seen: string[] = [];
    const start = performance.now();
    let previous = "";
    while (performance.now() - start < 5000) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const ghost = root.querySelector("span[data-fine-details-prompt-ghost]");
      const text = ghost?.firstChild?.nodeType === Node.TEXT_NODE ? ghost.firstChild.textContent ?? "" : "";
      if (text !== previous && (seen.length > 0 || text === first)) {
        seen.push(text);
        // A complete unfiltered output cycle includes the empty gaps and its
        // wrap. In particular C, empty, B, empty, C cannot pass removal of B.
        if (seen.length > 1 && text === first) return seen;
      }
      previous = text;
    }
    throw new Error(`Native phrase cycle incomplete: ${JSON.stringify(seen)}`);
  });
  // Every part consumes real ordered ghost output. Pixel baselines begin at a
  // just-observed full phrase, never an arbitrary autonomous animation frame.
  for (const part of ["collectionActions.add", "collectionActions.items", "collectionActions.remove"] as const) {
    const baseline = part === "collectionActions.add" ? "A" : "B";
    await sampleTyping(page, baseline, 1, true);
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      const expected = part === "collectionActions.add" ? ["A", "", "B", "", "A"] : part === "collectionActions.items" ? ["C", "", "B", "", "C"] : ["C", "", "C"];
      await expectToolcraftCompoundControlPartOutcome(cycle, session.targetAction(target, async () => {
        if (part === "collectionActions.add") {
          await add.click();
          await expect(inputs).toHaveCount(2);
          await expect(inputs.nth(1)).toHaveValue("");
          await inputs.nth(1).fill("B");
          await expect(inputs.first()).toHaveValue("A");
        } else if (part === "collectionActions.items") {
          await inputs.first().fill("C");
          await expect(inputs.nth(1)).toHaveValue("B");
        } else {
          await remove.click();
          await expect(inputs).toHaveCount(1);
          await expect(inputs.first()).toHaveValue("C");
        }
      }), expected, { requirementId: target, part, stabilityIntervalMs: 50, stabilitySamples: 2 });
      // The full-cycle observation ends freshly at C for edit/remove. Add
      // must instead reach B to differ from its pre-action A pixel baseline.
      if (part === "collectionActions.add") await sampleTyping(page, "B", 1, true);
    }), typingProof("phrases"));
    // Only after the edit alone has passed the complete reactive cycle AND
    // raster proof, independently check its first-start order. A focus restart
    // must never refresh stale settings on behalf of the collection mutation.
    const promptInput = page.locator("[data-fine-details-prompt-input]");
    await promptInput.focus();
    await expect(page.locator(ghostSelector)).toHaveCount(0);
    const firstOutput = page.locator("[data-fine-details-prompt]").evaluate(async root => {
      const started = performance.now();
      while (performance.now() - started < 2000) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        const ghost = root.querySelector("span[data-fine-details-prompt-ghost]");
        const text = ghost?.firstChild?.nodeType === Node.TEXT_NODE ? ghost.firstChild.textContent ?? "" : "";
        if (text) return text;
      }
      throw new Error("Typing did not resume after native focus/blur");
    });
    await promptInput.press("Tab");
    expect(await firstOutput).toBe(part === "collectionActions.add" ? "A" : "C");
  }
  await expect(remove).toBeDisabled();
  for (let index = 1; index < 8; index += 1) {
    await add.click();
    await expect(inputs.nth(index)).toHaveValue("");
    await inputs.nth(index).fill(String.fromCharCode(67 + index));
  }
  await expect(inputs).toHaveCount(8);
  await expect(add).toBeDisabled();
  await expect(inputs.first()).toHaveValue("C");
  await remove.click();
  await expect(inputs).toHaveCount(7);
  await expect(add).toBeEnabled();
});

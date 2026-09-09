# Vestaboard Remove-Only Phrase Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Vestaboard phrase animation strictly shrink from source text by deleting known source characters only.

**Architecture:** Keep the phrase model in `src/app/vestaboard-model.ts`. The greedy source-to-target assignment determines which source indices survive; playback is divided into one deletion step per removable index, with a flip-before-delete phase and a centered next-phrase movement phase where changed cells flicker before settling.

**Tech Stack:** TypeScript, Vitest, Playwright, Creative Apps Kit DOM renderer.

---

### Task 1: Unit Coverage

**Files:**
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Add a failing monotonic shrink assertion**

Add a test near the existing target message animation tests:

```ts
it("target message animation never reveals characters that are not in the source", () => {
  const frames = [0, 0.25, 0.5, 0.75, 1].map((progress) =>
    getVestaboardAnimatedPhrase({
      progress,
      seed: 137,
      source: "ABCD",
      target: "AXBCDZ",
    }),
  );

  expect(frames.at(0)).toBe("ABCD");
  expect(frames.at(-1)).toBe("ABCD");

  for (let index = 1; index < frames.length; index += 1) {
    expect(Array.from(frames[index] ?? "").length).toBeLessThanOrEqual(
      Array.from(frames[index - 1] ?? "").length,
    );
  }
});
```

- [ ] **Step 2: Run the focused test**

Run: `pnpm exec vitest run src/app/app-schema.test.ts --runInBand`

Expected before implementation: FAIL because unmatched target characters can be revealed.

### Task 2: Remove Target Reveal

**Files:**
- Modify: `src/app/vestaboard-model.ts`

- [ ] **Step 1: Remove unmatched-target append logic**

Delete the `unmatchedTargetChars` calculation and the `frameChars.push(...unmatchedTargetChars...)` reveal block from `getVestaboardAnimatedPhrase`.

- [ ] **Step 2: Keep source-only return path**

Ensure the function still returns:

```ts
return normalizeAnimatedFrameSpaces(frameChars.join(""));
```

- [ ] **Step 3: Run unit tests**

Run: `pnpm verify:quick`

Expected: PASS.

### Task 2.5: Sequential Narrowing Movement

**Files:**
- Modify: `src/app/vestaboard-model.ts`
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Replace blank-place anchoring with deletion steps**

Use one deletion step per removable source index. In each step, show the current phrase while the active removable character flickers, then remove it and render the next shortened phrase centered on the same row.

- [ ] **Step 2: Animate moved cells**

Compare previous centered phrase cells and next centered phrase cells. For any next cell whose character differs from the previous map, render a deterministic flicker character until the local step passes the settle threshold.

- [ ] **Step 3: Prove narrowing on the same row**

Add a unit test for `ABCD -> AD` proving that after removals the visible phrase has two letters, stays on the same row, and its columns move inward.

- [ ] **Step 4: Run unit tests**

Run: `pnpm verify:quick`

Expected: PASS.

### Task 3: Browser Coverage

**Files:**
- Modify: `e2e/app-controls.spec.ts`

- [ ] **Step 1: Add a no-growth browser assertion**

Inside `browser: target message drives phrase transform animation`, add a target containing an extra unmatched suffix after the existing end-frame assertion:

```ts
await setMessage(page, "ABCD");
await setTargetMessage(page, "AXBCDZ");
await scrubPlayback(page, "Home");
await expect.poll(() => getPhraseText(page)).toBe("ABCD");
await scrubPlayback(page, "End");
await expect.poll(() => getPhraseText(page)).toBe("ABCD");
```

- [ ] **Step 2: Run targeted browser checks**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3147 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|phrase animation" --workers=1`

Expected: PASS.

### Task 4: Documentation And Build

**Files:**
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Record the remove-only decision**

Add the new spec and plan paths to the Evidence section and update the Timeline/Controls notes if needed.

- [ ] **Step 2: Verify build**

Run: `pnpm build`

Expected: PASS.

# Glow Slider Live Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Glow slider update the SVG poster halo immediately while preserving the renderer pipeline as the single scene authority.

**Architecture:** Add `ink.glow` to the canonical `poster-scene` input/invalidation target list and to `createPosterSceneCacheInput`. The existing model normalization and SVG filter remain unchanged. A focused unit regression protects the cache boundary, and browser coverage proves the real slider produces and removes the filter.

**Tech Stack:** React, TypeScript, Toolcraft renderer pipeline, SVG filters, Vitest, Playwright

---

### Task 1: Protect the renderer cache boundary

**Files:**
- Create: `src/app/renderer-pipeline.test.ts`
- Modify: `src/app/renderer-pipeline.ts`

- [ ] **Step 1: Write the failing cache-input test**

```ts
import { describe, expect, it } from "vitest";
import type { ToolcraftState } from "@/toolcraft/runtime";
import { createPosterSceneCacheInput } from "./renderer-pipeline";

describe("renderer pipeline", () => {
  it("invalidates the poster scene when glow changes", () => {
    const state = {
      canvas: { size: { height: 1350, unit: "px", width: 1080 } },
      values: { "ink.glow": 64 },
    } as unknown as ToolcraftState;

    expect(createPosterSceneCacheInput(state)).toMatchObject({
      "ink.glow": 64,
    });
  });
});
```

- [ ] **Step 2: Run the test and verify the regression**

Run:

```bash
npx vitest run src/app/renderer-pipeline.test.ts
```

Expected: FAIL because the cache input does not contain `ink.glow`.

- [ ] **Step 3: Add Glow to the canonical scene inputs**

In `src/app/renderer-pipeline.ts`, add `"ink.glow"` beside `"ink.color"` in
`posterTargets`, which automatically updates `changeTargets`,
`posterCacheKeys`, pass inputs, cache keys, invalidators, and the canonical
control-change performance path.

Add the current runtime value to `createPosterSceneCacheInput`:

```ts
"ink.glow": state.values["ink.glow"],
```

- [ ] **Step 4: Run the focused unit test**

Run:

```bash
npx vitest run src/app/renderer-pipeline.test.ts
```

Expected: PASS.

### Task 2: Prove the live canvas behavior

**Files:**
- Modify: `src/app/app-acceptance-data.ts`
- Create: `e2e/app-glow.spec.ts`

- [ ] **Step 1: Add a focused Glow acceptance**

Override the `ink-glow` row's `browserTestName` with
`browser: glow slider updates the poster filter live`. Add that focused test so
it:

1. Open the app.
2. Assert the foreground has no `filter` and no
   `[data-micrographics-glow]` exists at the zero default.
3. Set the uniquely located `Glow` slider above zero using keyboard input.
4. Assert the foreground filter is `url(#micrographics-glow)`, the filter node
   exists, and `feGaussianBlur` has a positive `stdDeviation`.
5. Return the slider to zero and assert the filter is removed.

- [ ] **Step 2: Run the focused browser test**

Run:

```bash
npm run test:browser -- --grep "browser: glow slider updates the poster filter live"
```

Expected: PASS.

### Task 3: Record and deliver the Tier 3 fix

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`
- Verify: `src/app/app-performance-impact.json`

- [ ] **Step 1: Confirm performance ownership**

Verify that `src/app/renderer-pipeline.ts` owns the `poster-scene` pass and that
the new test files are correctly classified by the existing impact inventory.
Change the inventory only if the protected checker identifies a missing or stale
entry.

- [ ] **Step 2: Update the worklog**

Record the request, root cause, chosen pipeline fix, rejected local-state and
pipeline-bypass alternatives, Tier 3 classification, changed files, focused
tests, exact targeted delivery command, and the skipped full audit.

- [ ] **Step 3: Run focused development checks**

Run:

```bash
npm run ai:check
npm run typecheck
npx vitest run src/app/renderer-pipeline.test.ts src/app/app-schema.test.ts
```

Expected: all pass.

- [ ] **Step 4: Run the protected delivery gate once**

Run `npm run verify:delivery` with Tier 3, the exact unit/browser selectors, the
four exact `poster-scene` performance paths, and the accumulated `export-png`
path required by the impact inventory.

Expected: a passed ordinary targeted delivery receipt.

- [ ] **Step 5: Leave the app running**

Run:

```bash
npm run dev
```

Expected: Toolcraft verifies Micrographics at the saved local URL.

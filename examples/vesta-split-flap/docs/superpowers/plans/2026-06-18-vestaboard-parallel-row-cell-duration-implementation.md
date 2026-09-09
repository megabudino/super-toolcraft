# Vestaboard Parallel Row Cell Duration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a range slider for per-cell animation duration and make phrase shortening advance in all rows simultaneously.

**Architecture:** Extend `VestaboardSettings` with `board.text.cellDurationRange`. Generate phrase cells row-by-row so each row consumes the same timeline progress while each removable source cell uses a deterministic duration from the configured range.

**Tech Stack:** TypeScript, Creative Apps Kit schema controls, DOM renderer, Vitest, Playwright.

---

### Task 1: Schema And Coverage

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-schema.test.ts`

- [x] **Step 1: Add `Cell duration` range slider**

Add `cellDurationRange` to `Board Message` with target `board.text.cellDurationRange`, type `rangeSlider`, min `5`, max `95`, default `[35, 75]`, unit `%`, and workload performance metadata.

- [x] **Step 2: Add acceptance and performance rows**

Add acceptance for `cell duration range changes per-cell phrase animation timing` and a performance scenario `cell-duration-range-drag`.

- [x] **Step 3: Update schema tests**

Add `board.text.cellDurationRange` to control order and workload target assertions.

### Task 2: Row-Parallel Animation Model

**Files:**
- Modify: `src/app/vestaboard-model.ts`
- Modify: `src/app/app-schema.test.ts`

- [x] **Step 1: Resolve duration range**

Add `cellDurationRange` to `VestaboardSettings`, resolved from `board.text.cellDurationRange`.

- [x] **Step 2: Generate row-local phrase cells**

Build phrase cells from wrapped source rows. For each row, match target row characters as a subsequence, compute removable source cells, and advance row deletion from the shared progress.

- [x] **Step 3: Add deterministic per-cell duration**

For each removable source cell, choose a duration percent within the slider range using the seed plus row/local index. Use that value as the flicker/disappear threshold inside that cell's deletion step.

- [x] **Step 4: Add unit tests**

Add tests proving rows shrink in parallel and changing duration range changes an intermediate frame.

### Task 3: Browser And Build

**Files:**
- Modify: `e2e/app-controls.spec.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [x] **Step 1: Exercise slider in browser**

Add browser acceptance for `Cell duration` in the phrase animation test area and a browser perf test for `cell-duration-range-drag`.

- [x] **Step 2: Run verification**

Run:

```bash
pnpm verify:quick
CREATIVE_APPS_KIT_TEST_PORT=3150 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|cell duration|phrase animation" --workers=1
pnpm build
CREATIVE_APPS_KIT_TEST_PORT=3151 pnpm verify:perf
```

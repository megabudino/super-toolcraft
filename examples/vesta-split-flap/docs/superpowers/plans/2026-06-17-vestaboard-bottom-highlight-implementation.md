# Vestaboard Bottom Highlight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the removed depth controls with a deterministic bottom-border highlight opacity distribution and allow the permanent message textarea to stay empty.

**Architecture:** Keep the existing DOM preview and Canvas 2D export renderers. Extend the Vestaboard model with `cellBottomHighlightOpacityRange`, `cellBottomHighlightSeed`, and per-cell `bottomHighlightOpacity`, then render that value as a bottom edge overlay in preview and export.

**Tech Stack:** Creative Apps Kit schema, React DOM renderer, Canvas 2D export renderer, Vitest, Playwright browser tests.

---

### Task 1: Schema And Model

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/vestaboard-model.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] **Step 1: Remove depth schema/model**

Remove `board.cell.depth`, `board.cell.depthSeed`, per-cell `depth`, and the depth style/metric helpers.

- [ ] **Step 2: Add bottom highlight schema/model**

Add `board.cell.bottomHighlightOpacityRange` and `board.cell.bottomHighlightSeed` controls. Resolve them in `resolveVestaboardSettings`, generate deterministic `bottomHighlightOpacity` values in `buildVestaboardModel`, and clamp opacity to `0..100`.

- [ ] **Step 3: Add model tests**

Assert that `Bottom opacity` constrains all cell bottom-highlight values, `Bottom seed` is deterministic, and an empty Message creates no phrase cells.

### Task 2: Preview And Export Rendering

**Files:**
- Modify: `src/app/vestaboard-renderer.tsx`
- Modify: `src/app/vestaboard-model.ts`

- [ ] **Step 1: Render preview highlight**

Render an absolutely positioned bottom line inside each cell when `bottomHighlightOpacity > 0`. Use the current `Cell border` hex color and keep the base full-cell border intact.

- [ ] **Step 2: Render export highlight**

In `drawVestaboardToCanvas`, draw a bottom line after the base border using the same color and per-cell opacity.

### Task 3: Acceptance, Performance, Browser Tests, Worklog

**Files:**
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-acceptance.test.ts`
- Modify: `src/app/app-schema.test.ts`
- Modify: `e2e/app-controls.spec.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Replace depth coverage**

Remove depth acceptance/performance/browser rows and replace them with bottom highlight rows.

- [ ] **Step 2: Add empty message coverage**

Update the message default, acceptance, and browser test so empty textarea behavior is proven after blur and reset.

- [ ] **Step 3: Update worklog**

Record the bottom-highlight renderer/export/performance decision and remove references to depth.

### Task 4: Verification

**Files:**
- No source edits expected.

- [ ] **Step 1: Run quick verification**

Run: `pnpm verify:quick`

Expected: docs, integrity, and unit tests pass.

- [ ] **Step 2: Run build**

Run: `pnpm build`

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Run browser acceptance**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm test:browser`

Expected: browser acceptance and browser perf tests pass.

- [ ] **Step 4: Run final gate**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3150 pnpm verify:final`

Expected: full final verification passes.

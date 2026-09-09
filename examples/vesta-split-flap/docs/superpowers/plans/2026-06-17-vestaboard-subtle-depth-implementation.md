# Vestaboard Subtle Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subtle seeded depth controls that make Vestaboard cells feel gently raised or recessed in preview and PNG export.

**Architecture:** Extend the existing Vestaboard model with `cellDepth` and `cellDepthSeed`, then derive a deterministic per-cell depth value alongside the existing filler and cell-fill opacity fields. Render depth as restrained DOM style changes in preview and Canvas 2D shadows/filter-like fill adjustments in export, with acceptance and performance metadata matching the new controls.

**Tech Stack:** Creative Apps Kit schema, React DOM renderer, Canvas 2D export renderer, Vitest, Playwright browser tests.

---

### Task 1: Add Depth To The Schema And Model

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/vestaboard-model.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] **Step 1: Write failing schema/model tests**

Add expectations for `board.cell.depth` and `board.cell.depthSeed` in control order and workload targets. Add model tests asserting default depth is flat, max depth produces non-zero per-cell values, and changing `Depth seed` changes the distribution.

- [ ] **Step 2: Implement schema controls**

Add `Depth` and `Depth seed` sliders to the Board Surface section after `Cell seed`. Use `performanceRole: "workload"` for both controls.

- [ ] **Step 3: Implement model fields**

Add `cellDepth`, `cellDepthSeed`, and `depth` fields. Resolve values with clamps `0..100` and `1..9999`, generate a separate seeded random stream, and keep depth independent of text and fill opacity seeds.

- [ ] **Step 4: Run targeted unit tests**

Run: `pnpm test src/app/app-schema.test.ts src/app/app-performance.test.ts src/app/app-acceptance.test.ts -- --run`

Expected: targeted tests identify the new acceptance and performance expectations until Task 3 adds them, then pass.

### Task 2: Render Subtle Depth In Preview And Export

**Files:**
- Modify: `src/app/vestaboard-renderer.tsx`
- Modify: `src/app/vestaboard-model.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] **Step 1: Add preview style helper**

Add a model helper that converts `cell.depth` and `settings.cellDepth` into DOM style values: tiny translateY, brightness, contrast, and soft box shadow. At depth strength `0`, return no transform/filter/shadow.

- [ ] **Step 2: Apply preview depth**

Apply helper values to each cell without changing `left`, `top`, `width`, `height`, or the foreground layer centering.

- [ ] **Step 3: Add Canvas 2D depth approximation**

Before drawing each rounded rect, set a restrained `shadowColor`, `shadowBlur`, `shadowOffsetX`, and `shadowOffsetY` based on depth. Clear shadow before drawing text so characters remain crisp.

### Task 3: Update Acceptance, Performance, Browser Tests, And Worklog

**Files:**
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-acceptance.test.ts`
- Modify: `src/app/app-schema.test.ts`
- Modify: `e2e/app-controls.spec.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Add acceptance rows**

Add observable rows for `Depth` and `Depth seed` with browser test names.

- [ ] **Step 2: Add performance scenarios**

Add workload scenarios and workload targets for `board.cell.depth` and `board.cell.depthSeed`.

- [ ] **Step 3: Add browser coverage**

Add tests that drag `Depth`, observe non-flat cell styles, change `Depth seed`, and compare sampled cell style distribution.

- [ ] **Step 4: Update worklog**

Record the depth decision, renderer/export behavior, and performance coverage.

### Task 4: Verify And Serve

**Files:**
- No source edits expected.

- [ ] **Step 1: Run quick verification**

Run: `pnpm verify:quick`

Expected: docs, integrity, unit tests, and build pass.

- [ ] **Step 2: Run browser acceptance**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3100 pnpm test:browser`

Expected: all browser acceptance and browser perf tests pass.

- [ ] **Step 3: Run performance gate**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3100 pnpm verify:perf`

Expected: performance matrix and sequential browser perf tests pass.

- [ ] **Step 4: Keep the local server available**

Run or confirm: `pnpm dev`

Expected: a local URL is available for the user, preferably `http://localhost:3002/`.

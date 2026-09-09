# Vestaboard Bottom Fill Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Fill canvas` slider that controls how many cells receive the seeded bottom edge opacity overlay.

**Architecture:** Keep the existing DOM and Canvas 2D renderer split. Add one schema-backed numeric coverage setting, use `Bottom seed` to choose a deterministic subset of highlighted cells, and let preview/export read the same per-cell `bottomHighlightOpacity` values.

**Tech Stack:** Creative Apps Kit schema controls, React DOM renderer, Canvas 2D export, Vitest, Playwright.

---

### Task 1: Schema And Model

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/vestaboard-model.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] **Step 1: Add schema control**

Add `cellBottomHighlightFillCanvas` with target `board.cell.bottomHighlightFillCanvas`, label `Fill canvas`, type `slider`, default `100`, min `0`, max `100`, unit `%`, and workload performance metadata.

- [ ] **Step 2: Resolve setting**

Add `cellBottomHighlightFillCanvas: number` to `VestaboardSettings` and resolve it by clamping `values["board.cell.bottomHighlightFillCanvas"]` to `0..100`.

- [ ] **Step 3: Add unit coverage**

Assert default `100`, explicit low coverage, and include the new target in control order and workload expectations.

### Task 2: Model, DOM, And Canvas Coverage

**Files:**
- Modify: `src/app/vestaboard-renderer.tsx`
- Modify: `src/app/vestaboard-model.ts`

- [ ] **Step 1: Generate coverage mask**

Use a seeded random stream derived from `Bottom seed` to decide whether each cell is inside the `Fill canvas` coverage percentage. Set `bottomHighlightOpacity` to `0` outside coverage.

- [ ] **Step 2: Keep DOM spans inside cells**

Render bottom and optional left spans only when `bottomHighlightOpacity > 0`. Keep bottom height `1px` and left width `1px` inside each overlay cell.

- [ ] **Step 3: Mirror in Canvas 2D**

In `drawVestaboardToCanvas`, draw bottom and optional left strokes only for cells with `bottomHighlightOpacity > 0`.

### Task 3: Acceptance, Performance, And Browser Tests

**Files:**
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-acceptance.test.ts`
- Modify: `e2e/app-controls.spec.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Add acceptance row**

Add a slider acceptance entry for `board.cell.bottomHighlightFillCanvas` proving highlighted cell coverage changes.

- [ ] **Step 2: Add performance scenario**

Add `bottom-fill-canvas-drag` and list the new target in `workloadTargets`.

- [ ] **Step 3: Add browser tests**

Add a browser acceptance test that raises `Bottom opacity`, verifies full highlight coverage at `100%`, drags `Fill canvas` toward `0%`, then verifies fewer highlighted cells while cell boxes remain unchanged.

- [ ] **Step 4: Update worklog**

Record the bottom edge fill-canvas decision, evidence, verification, and risk.

### Task 4: Verification

**Files:**
- No code files.

- [ ] **Step 1: Run quick verification**

Run: `pnpm verify:quick`

- [ ] **Step 2: Run focused browser tests**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm exec playwright test e2e/app-controls.spec.ts --grep "bottom fill canvas|bottom opacity range|edge sides|browser perf: bottom fill canvas" --workers=1`

- [ ] **Step 3: Run build**

Run: `pnpm build`

- [ ] **Step 4: Run final verification**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm verify:final`

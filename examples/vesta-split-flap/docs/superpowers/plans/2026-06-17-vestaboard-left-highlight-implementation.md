# Vestaboard Left Highlight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add independent seeded left-edge glow controls and rendering to Vestaboard cells.

**Architecture:** Extend the existing bottom-highlight pattern with separate left highlight schema targets, settings, per-cell model values, DOM preview layers, Canvas 2D export strokes, acceptance rows, performance scenarios, and browser tests. Keep `Cell border` as the shared color source.

**Tech Stack:** Creative Apps Kit schema, React DOM preview, Canvas 2D PNG export, Vitest, Playwright.

---

### Task 1: Extend Schema And Model

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/vestaboard-model.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] **Step 1: Add controls**

Add `cellLeftHighlightOpacityRange` and `cellLeftHighlightSeed` to Board Surface:

```ts
cellLeftHighlightOpacityRange: {
  defaultValue: [0, 0],
  label: "Left opacity",
  max: 100,
  min: 0,
  orderRole: "strength",
  performanceReason:
    "Left opacity range changes deterministic left-edge alpha across every computed cell.",
  performanceRole: "workload",
  step: 1,
  target: "board.cell.leftHighlightOpacityRange",
  type: "rangeSlider",
  unit: "%",
},
cellLeftHighlightSeed: {
  defaultValue: 547,
  label: "Left seed",
  max: 9999,
  min: 1,
  orderRole: "advanced",
  performanceReason:
    "Left seed regenerates deterministic left-edge alpha distribution.",
  performanceRole: "workload",
  step: 1,
  target: "board.cell.leftHighlightSeed",
  type: "slider",
},
```

- [ ] **Step 2: Add settings and cell fields**

Add `cellLeftHighlightOpacityRange`, `cellLeftHighlightSeed`, and `leftHighlightOpacity`. Resolve targets with defaults `[0, 0]` and `547`, generate values with a separate seeded random stream.

- [ ] **Step 3: Add unit expectations**

Update control order and workload target tests. Add tests that left highlight opacity stays inside range and that changing `Left seed` changes the deterministic distribution.

### Task 2: Render Left Glow

**Files:**
- Modify: `src/app/vestaboard-renderer.tsx`
- Modify: `src/app/vestaboard-model.ts`

- [ ] **Step 1: Render DOM preview**

Add a `vestaboard-left-highlight-row-col` span when `leftHighlightOpacity > 0`. Use `linear-gradient(to right, ...)`, `boxShadow`, width `4`, and anchor it to `left: -1`.

- [ ] **Step 2: Render Canvas export**

In `drawVestaboardToCanvas`, draw left-edge stacked vertical strokes with alpha multipliers `0.25`, `0.5`, and `1`, mirroring the bottom glow.

### Task 3: Coverage And Verification

**Files:**
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `e2e/app-controls.spec.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Add acceptance and performance rows**

Add observable rows for `Left opacity` and `Left seed`. Add workload scenarios and workload targets for both controls.

- [ ] **Step 2: Add browser tests**

Add browser tests for left opacity gradient/glow style, left-edge alignment, and deterministic left seed changes. Add perf tests for `Left opacity` and `Left seed`.

- [ ] **Step 3: Verify**

Run:

```bash
pnpm verify:quick
CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm verify:final
```

Expected: PASS.

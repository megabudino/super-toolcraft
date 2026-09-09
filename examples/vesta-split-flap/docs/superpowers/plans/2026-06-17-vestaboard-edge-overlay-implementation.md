# Vestaboard Edge Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-cell inline left/bottom highlights with a duplicate overlay layer that can render bottom-only or bottom-plus-left 1px highlighted edges.

**Architecture:** Keep one seeded edge opacity distribution (`Bottom opacity` / `Bottom seed`) and add one segmented mode (`Edge sides`). Remove left-specific settings and per-cell left opacity. DOM preview renders an overlay layer that duplicates cell geometry, and Canvas 2D export draws the same overlay strokes.

**Tech Stack:** Creative Apps Kit schema, React DOM preview, Canvas 2D PNG export, Vitest, Playwright.

---

### Task 1: Schema And Model

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/vestaboard-model.ts`
- Modify: `src/app/app-schema.test.ts`
- Modify: `src/app/app-acceptance.test.ts`

- [ ] **Step 1: Remove left-specific controls**

Delete `cellLeftHighlightOpacityRange` and `cellLeftHighlightSeed` from Board Surface controls, layout groups, settings, model resolution, cell values, tests, acceptance, and performance.

- [ ] **Step 2: Add edge mode control**

Add a segmented control:

```ts
cellEdgeMode: {
  defaultValue: "bottom",
  label: "Edge sides",
  options: [
    { label: "Bottom", value: "bottom" },
    { label: "+ left", value: "bottom-left" },
  ],
  orderRole: "mode",
  performanceReason:
    "Edge sides switches the overlay between bottom-only and bottom-plus-left strokes for every computed cell.",
  performanceRole: "workload",
  target: "board.cell.edgeMode",
  type: "segmented",
},
```

- [ ] **Step 3: Add model mode**

Add `cellEdgeMode: "bottom" | "bottom-left"` to settings and resolve invalid values to `"bottom"`.

### Task 2: Overlay Rendering

**Files:**
- Modify: `src/app/vestaboard-renderer.tsx`
- Modify: `src/app/vestaboard-model.ts`

- [ ] **Step 1: Create DOM overlay layer**

Add a `vestaboard-edge-overlay-layer` sibling above the main cell layer. It duplicates `model.cells` and renders transparent absolute overlay cells with `data-testid="vestaboard-edge-cell-row-col"`.

- [ ] **Step 2: Render overlay edges**

Inside each overlay cell, render `vestaboard-bottom-highlight-row-col` as a 1px bottom edge. Render `vestaboard-left-highlight-row-col` only when `settings.cellEdgeMode === "bottom-left"`.

- [ ] **Step 3: Mirror export**

In `drawVestaboardToCanvas`, draw the bottom edge for each cell with `bottomHighlightOpacity`. Draw the left edge only when `settings.cellEdgeMode === "bottom-left"`.

### Task 3: Coverage

**Files:**
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `e2e/app-controls.spec.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Update acceptance/performance matrices**

Remove `Left opacity` and `Left seed` rows/scenarios. Add `Edge sides` acceptance and perf scenarios.

- [ ] **Step 2: Update browser tests**

Remove left opacity/seed tests. Add an `Edge sides` test that verifies default bottom-only output, switches to `+ left`, then verifies left overlay edges appear and remain 1px.

- [ ] **Step 3: Verify**

Run:

```bash
pnpm verify:quick
CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm verify:final
```

Expected: PASS.

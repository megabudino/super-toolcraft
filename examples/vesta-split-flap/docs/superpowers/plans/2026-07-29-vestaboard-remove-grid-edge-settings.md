# Vestaboard Remove Grid And Edge Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Board Surface `Grid` and `Edge sides` controls from the app.

**Architecture:** Keep Creative Apps Kit runtime and renderer shell unchanged. Update app schema, model settings, renderer branches, acceptance/performance metadata, and browser tests so removed controls are neither visible nor hidden settings.

**Tech Stack:** React 19, Vite 8, TypeScript, Vitest, Playwright, Creative Apps Kit local runtime.

---

### Task 1: Remove Controls From Schema

**Files:**
- Modify: `src/app/app-schema.ts`

- [x] **Step 1:** Remove `gridPreset` and `cellEdgeMode` controls from Board Surface.
- [x] **Step 2:** Remove Width/Height `disabledWhen` references to `board.grid.preset`.

### Task 2: Remove Hidden Model Branches

**Files:**
- Modify: `src/app/vestaboard-model.ts`
- Modify: `src/app/vestaboard-renderer.tsx`

- [x] **Step 1:** Remove `cellEdgeMode` from model settings and renderer/export left-edge branches.
- [x] **Step 2:** Remove `gridPreset` from model settings and keep grid geometry tile-derived.

### Task 3: Update Coverage

**Files:**
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-schema.test.ts`
- Modify: `src/app/app-acceptance.test.ts`
- Modify: `e2e/app-controls.spec.ts`

- [x] **Step 1:** Remove acceptance/performance entries for `board.grid.preset` and `board.cell.edgeMode`.
- [x] **Step 2:** Remove browser tests that interact with `Grid` and `Edge sides`.
- [x] **Step 3:** Add a browser assertion that `Grid` and `Edge sides` are absent.

### Task 4: Verify

Run:

```bash
./node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts
CREATIVE_APPS_KIT_TEST_PORT=3030 pnpm exec playwright test e2e/app-controls.spec.ts --grep "Board Surface controls render as separate rows" --workers=1
pnpm verify:quick
```

Expected: all commands pass, and visual smoke confirms the two removed controls no longer appear.

## Plan Self-Review

- Exact files and commands are listed.
- No runtime copy edits.
- Removed settings cannot survive as hidden imported values.

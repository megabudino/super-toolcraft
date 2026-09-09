# Vestaboard Cell-Based Line Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the incorrect glyph-offset movement with cell-only Vestaboard movement.

**Architecture:** Keep the existing phrase keep-plan and per-letter timing, but compute only integer cell row/column positions. Expose source-index metadata for tests, and display flicker characters in moving cells until each kept character settles.

**Tech Stack:** TypeScript, Creative Apps Kit schema model, React DOM renderer, Canvas 2D export renderer, Vitest, Playwright.

---

### Task 1: Remove Glyph Offsets

**Files:**
- Modify: `src/app/vestaboard-model.ts`
- Modify: `src/app/vestaboard-renderer.tsx`

- [ ] **Step 1: Remove offset fields**

Delete `charOffsetX`, `charOffsetY`, `visualCol`, and `visualRow`.

- [ ] **Step 2: Restore cell-bound renderers**

DOM preview uses `overflow-hidden` cells without transform. Canvas text draws centered in the current cell.

### Task 2: Cell-Based Transition

**Files:**
- Modify: `src/app/vestaboard-model.ts`
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Keep per-letter integer position**

Use per-letter layout progress only to choose integer `row` and `col`.

- [ ] **Step 2: Flicker moving kept letters**

When a kept letter has local progress between 0 and 1, render deterministic flicker in the current cell. At local progress 1, render the target letter.

- [ ] **Step 3: Test source-index tracking**

Track moving kept letters by `sourceIndex` and assert movement stays on integer rows while showing flicker during the transition.

### Task 3: Verification

**Files:**
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Run checks**

Run `pnpm verify:quick`, `pnpm build`, and targeted Playwright phrase animation checks.

- [ ] **Step 2: Record evidence**

Update worklog with the cell-based transition decision and commands.

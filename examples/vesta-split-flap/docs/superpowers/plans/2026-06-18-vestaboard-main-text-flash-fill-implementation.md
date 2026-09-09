# Vestaboard Main Text Flash Fill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add colored filled cell flashes to active disappearing phrase letters, controlled by active palette count, four palette colors, and flash frequency.

**Architecture:** Extend schema-backed Board Message controls and resolved settings. Compute deterministic disappearing-letter flash fill colors inside phrase animation state from the same removal lifecycle that flickers outgoing characters, then render the selected flash color in DOM preview and Canvas 2D export through the existing model. Multiple active palette slots cycle across the active removal progress of a single disappearing letter.

**Tech Stack:** TypeScript, Creative Apps Kit schema controls, DOM renderer, Canvas 2D export renderer, Vitest, Playwright.

---

### Task 1: Schema And Settings

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/vestaboard-model.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] **Step 1: Add Board Message controls**

Add `Flash colors`, `Flash frequency`, and `Flash 1` through `Flash 4` controls with targets under `board.text.flash*`.

- [ ] **Step 2: Resolve settings**

Resolve `messageFlashColorCount`, `messageFlashFrequency`, and four `messageFlashColors` in `resolveVestaboardSettings`.

### Task 2: Model And Renderers

**Files:**
- Modify: `src/app/vestaboard-model.ts`
- Modify: `src/app/vestaboard-renderer.tsx`
- Test: `src/app/app-schema.test.ts`

- [ ] **Step 1: Add model cell flash data**

Add an optional phrase flash fill color to `VestaboardCell`.

- [ ] **Step 2: Compute deterministic flash fills**

For active removable phrase letters only, choose a flash fill color when active color count and frequency allow it. Kept letters, pending removable letters, removed letters, and random field cells do not receive the flash fill. When two or more colors are active, use the active removal progress to cycle through the selected palette during the letter's lifetime.

- [ ] **Step 3: Render flash fills**

Use the flash fill color as the cell background in the DOM renderer and Canvas 2D export before text is drawn.

### Task 3: Coverage And Worklog

**Files:**
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-acceptance.test.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-schema.test.ts`
- Modify: `e2e/app-controls.spec.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Add acceptance and performance metadata**

Cover flash count, frequency, and palette color controls.

- [ ] **Step 2: Add browser coverage**

Verify flash fills appear only on active disappearing letters, frequency changes coverage, palette colors change fill color, two active colors animate during one disappearing letter lifetime, and related perf scenarios stay responsive.

- [ ] **Step 3: Run verification**

Run targeted Vitest, `pnpm verify:quick`, `pnpm build`, targeted Playwright, and relevant perf checks.

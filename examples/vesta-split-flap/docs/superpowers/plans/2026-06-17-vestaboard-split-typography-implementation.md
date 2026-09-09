# Vestaboard Split Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split Vestaboard typography into separate controls for permanent phrase text and random background field text.

**Architecture:** Keep the existing schema/model/renderer split. Add two schema-backed font picker targets, resolve both into `VestaboardSettings`, and have DOM preview plus Canvas 2D export choose the right typography from `cell.isPhrase`.

**Tech Stack:** Creative Apps Kit schema controls, React DOM renderer, Canvas 2D export, Vitest, Playwright.

---

### Task 1: Schema And Settings

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/vestaboard-model.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] **Step 1: Replace the message font control**

Rename the Board Message font picker to `messageTypography`, label it `Main font`, and target `board.text.messageTypography`.

- [ ] **Step 2: Add the background font control**

Add `fieldTypography` to the Random Field section, label it `Background font`, and target `field.typography`.

- [ ] **Step 3: Resolve both typography values**

Add `messageTypography` and `fieldTypography` to `VestaboardSettings`. Resolve each value independently and fall back to old `board.text.typography` when the new target is missing.

- [ ] **Step 4: Update unit expectations**

Update control order, workload targets, and model tests so both typography settings are covered.

### Task 2: Preview And Export Rendering

**Files:**
- Modify: `src/app/vestaboard-renderer.tsx`
- Modify: `src/app/vestaboard-model.ts`

- [ ] **Step 1: Choose typography in DOM cells**

For each visible character, use `messageTypography` when `cell.isPhrase` is true and `fieldTypography` otherwise.

- [ ] **Step 2: Choose typography in Canvas export**

Before drawing each character in `drawVestaboardToCanvas`, set `context.font` and `letterSpacing` from the same per-cell typography choice.

### Task 3: Acceptance, Performance, And Browser Tests

**Files:**
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-acceptance.test.ts`
- Modify: `e2e/app-controls.spec.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Split acceptance entries**

Replace the old typography entry with `main font changes permanent phrase typography` and `background font changes random field typography`.

- [ ] **Step 2: Split performance scenarios**

Replace the old `font-picker-change` scenario with `main-font-picker-change` and `background-font-picker-change`.

- [ ] **Step 3: Add browser tests**

Add focused browser tests proving each font picker affects only its text class.

- [ ] **Step 4: Update worklog**

Record the split typography decision, renderer/export behavior, verification tier, and risk.

### Task 4: Verification

**Files:**
- No code files.

- [ ] **Step 1: Run quick verification**

Run: `pnpm verify:quick`

- [ ] **Step 2: Run focused browser tests**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm exec playwright test e2e/app-controls.spec.ts --grep "main font|background font|browser perf: .*font" --workers=1`

- [ ] **Step 3: Run build**

Run: `pnpm build`

- [ ] **Step 4: Run final verification**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm verify:final`

# Vestaboard Single Column Board Surface Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render Vestaboard Board Surface controls as standalone rows instead of side-by-side rows.

**Architecture:** Change only the app schema layout groups and matching tests. Keep Creative Apps Kit runtime rendering intact and let the existing schema-backed controls render full-width when not explicitly grouped.

**Tech Stack:** React 19, Vite 8, TypeScript, Vitest, Playwright, Creative Apps Kit local runtime.

---

### Task 1: Add Schema Regression

**Files:**
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Add a test that rejects Board Surface inline groups**

Add a test that finds the `Board Surface` section and fails when it has any `layoutGroups`.

- [ ] **Step 2: Run the targeted test**

Run:

```bash
./node_modules/.bin/vitest run src/app/app-schema.test.ts -t "does not place Board Surface controls in inline rows"
```

Expected before schema fix: fail with the current Board Surface inline groups.

### Task 2: Remove Inline Board Surface Groups

**Files:**
- Modify: `src/app/app-schema.ts`

- [ ] **Step 1: Remove Board Surface `layoutGroups`**

Remove the Board Surface `layoutGroups` property. Do not change targets, defaults, labels, order roles, performance roles, or renderer code.

- [ ] **Step 2: Run schema test again**

Run:

```bash
./node_modules/.bin/vitest run src/app/app-schema.test.ts -t "does not place Board Surface controls in inline rows"
```

Expected: pass.

### Task 3: Add Browser Layout Regression

**Files:**
- Modify: `e2e/app-controls.spec.ts`

- [ ] **Step 1: Add a Board Surface row-position assertion**

Add a focused browser test that measures the right-panel field boxes for Width, Height, Gap, Radius, Cell fill, Cell border, Cell opacity, Bottom opacity, Cell seed, and Bottom seed, then asserts each consecutive pair has different `top` coordinates.

- [ ] **Step 2: Run the focused browser test**

Run:

```bash
CREATIVE_APPS_KIT_TEST_PORT=3030 pnpm exec playwright test e2e/app-controls.spec.ts --grep "Board Surface controls render as separate rows" --workers=1
```

Expected: pass after the schema fix.

### Task 4: Verify And Record

**Files:**
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Run quick verification**

Run:

```bash
pnpm verify:quick
```

Expected: docs, runtime integrity, and app tests pass.

- [ ] **Step 2: Browser-smoke the running app**

Use Playwright against the active dev URL and confirm the measured slider row pairs no longer share a row.

- [ ] **Step 3: Update the worklog**

Record the Tier 2 verification evidence and the running local URL.

## Plan Self-Review

- The plan has exact files and commands.
- It does not edit `src/creative-apps-kit`.
- The change is limited to controls-panel layout.

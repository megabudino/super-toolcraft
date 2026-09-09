# Remove Duplicate Format Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the redundant product-authored canvas Format section while preserving Toolcraft Setup sizing and Image Export file-format controls.

**Architecture:** Canvas sizing remains entirely owned by the built-in Toolcraft Setup block. Product schema, acceptance inventory, and tests stop declaring the `canvas.commands` action surface. The non-exposed compatibility handler remains unchanged so renderer and export modules stay outside this panel-only batch.

**Tech Stack:** TypeScript, Toolcraft schema/runtime, Vitest, Playwright.

---

### Task 1: Lock the panel contract with tests

**Files:**
- Modify: `src/app/app-schema.test.ts`
- Modify: `e2e/app-controls.spec.ts`

- [ ] **Step 1: Replace the schema expectation for `canvas.commands`**

Assert that no product section is titled `Format`, no control targets `canvas.commands`, the built-in canvas remains `editable-output`, and `export.image.format` still exists.

- [ ] **Step 2: Add a focused browser assertion**

Assert that the visible controls panel has no collapsible `Format` section while Setup still exposes `Aspect ratio`, `Canvas width`, and `Canvas height`.

- [ ] **Step 3: Run the tests to verify the current schema fails**

Run:

```bash
npx vitest run src/app/app-schema.test.ts
npm run test:browser -- --grep "browser: duplicate format section is absent"
```

Expected: the new absence assertions fail before implementation.

### Task 2: Remove the duplicated product control path

**Files:**
- Modify: `src/app/app-schema.ts`

- [ ] **Step 1: Remove the app-authored `Format` section**

Delete the section containing the `canvas.commands` actions and remove the unused `micrographPosterFormats` schema import.

- [ ] **Step 2: Run the targeted schema test**

Run:

```bash
npx vitest run src/app/app-schema.test.ts
```

Expected: all schema tests pass.

### Task 3: Align acceptance and decision records

**Files:**
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Remove stale acceptance coverage**

Delete the `canvas-format` acceptance row and the `Format` control-section inventory entry. Keep `Image Export` and `export.image.format` coverage intact.

- [ ] **Step 2: Record the Tier 2 decision**

Add a worklog iteration stating that Toolcraft Setup is the sole aspect/size owner, the duplicate app section and dead command path were removed, and export format remains unchanged.

- [ ] **Step 3: Run targeted development checks**

Run:

```bash
npm run typecheck
npx vitest run src/app/app-schema.test.ts
npm run test:browser -- --grep "browser: duplicate format section is absent"
```

Expected: all checks pass.

### Task 4: Deliver and restart

**Files:**
- Verify all files above without further source edits after the receipt.

- [ ] **Step 1: Run exact protected delivery**

Run `npm run verify:delivery -- --tier=2` with the exact unit and browser selectors required by the impact report.

- [ ] **Step 2: Confirm the saved app server**

Run:

```bash
npm run dev
```

Expected: Toolcraft confirms the app identity at the saved local URL.

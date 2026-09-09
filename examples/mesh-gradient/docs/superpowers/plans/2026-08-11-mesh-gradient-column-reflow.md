# Mesh Gradient Column Reflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the mesh rectangular and non-crossing whenever the Columns control changes.

**Architecture:** Make the point layout self-describing with `baseColumns`. Reconcile a requested column count against that stored topology and use the existing grid-reflow path while preserving independent inserted points.

**Tech Stack:** React, TypeScript, Vitest, Playwright, WebGL2, Toolcraft runtime commands.

---

### Task 1: Lock the regression in unit coverage

**Files:**
- Test: `src/app/mesh-gradient/mesh-collection-topology.test.ts`

- [ ] **Step 1: Write a failing valid-column-change test**

Add a test that creates a 12-point four-column layout, requests two columns, and expects a two-column grid with unchanged color and point counts.

- [ ] **Step 2: Run the focused test and confirm the current failure**

Run: `npx vitest run src/app/mesh-gradient/mesh-collection-topology.test.ts`

Expected before the fix: the reconciliation result is `null` for `4 -> 2`.

### Task 2: Persist and reconcile structural columns

**Files:**
- Modify: `src/app/mesh-gradient/mesh-model.ts`
- Modify: `src/app/mesh-gradient/mesh-collection-topology.ts`
- Modify: `src/app/mesh-gradient/mesh-point-interaction.ts`
- Test: `src/app/mesh-gradient/mesh-model.test.ts`
- Test: `src/app/mesh-gradient/mesh-collection-topology.test.ts`

- [ ] **Step 1: Add `baseColumns` to the layout model**

Write validated optional metadata from `createMeshPointLayout` and `readMeshPointLayout`, preserving backward compatibility for imported layouts.

- [ ] **Step 2: Reflow when stored and requested columns differ**

Read raw `baseColumns` before normalizing the layout. Migrate missing metadata without moving points; for a real mismatch, call the existing complete-grid reflow and preserve inserted points and selection.

- [ ] **Step 3: Keep structural editing outputs self-describing**

Set `basePointCount` and `baseColumns` in row/column insertion and deletion results so later Columns edits have an authoritative source topology.

- [ ] **Step 4: Run focused unit tests**

Run: `npx vitest run src/app/mesh-gradient/mesh-model.test.ts src/app/mesh-gradient/mesh-collection-topology.test.ts src/app/mesh-gradient/mesh-point-interaction.test.ts src/app/mesh-gradient/mesh-cell-triangulation.test.ts`

Expected: all focused tests pass.

### Task 3: Prove the real slider path

**Files:**
- Modify: `e2e/mesh-collection-topology.spec.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Add the browser regression**

Use the real Columns slider to move the Sunset preset from four to two columns. Assert 12 handles remain, the guide edges match a `2 x 6` grid, handle coordinates are row-major, canvas bounds are unchanged, and the render signature changes.

- [ ] **Step 2: Run product verification**

Run `npm run ai:check`, TypeScript, focused Vitest, focused Playwright, and `npm run build -- --base /demos/mesh-gradient/`.

Expected: all targeted checks pass.

- [ ] **Step 3: Record the delivery and run the protected gate**

Append the root cause, files, evidence, skipped checks, and risks to the worklog. Run the Tier 3 protected delivery command with exact unit and browser selectors, recording any signed-infrastructure limitation verbatim.

- [ ] **Step 4: Commit and deploy production**

Stage only `examples/mesh-gradient` files, commit the fix, deploy the linked `pixelpoint/mesh-gradient` project to production, and inspect the stable alias `https://mesh-gradient-pixelpoint.vercel.app/demos/mesh-gradient`.

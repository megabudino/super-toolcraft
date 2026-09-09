# Vestaboard Background Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animate the random background field from start fill to end fill across the playback timeline, with independent duration distribution and flicker speed controls.

**Architecture:** Reuse the existing timeline progress passed to `buildVestaboardModel`. Extend schema/settings with start fill, end fill, field duration range, and field speed. Compute deterministic per-cell start/end occupancy inside the model, make every changing background cell begin flickering on the first non-zero frame while its seeded duration controls when it settles, and use field speed to control active flicker bucket frequency.

**Tech Stack:** TypeScript, Creative Apps Kit schema controls, DOM/Canvas renderers via existing model, Vitest, Playwright.

---

### Task 1: Schema And Metadata

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-acceptance.test.ts`
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Replace static Fill control**

Add `Start fill` (`field.fillStart`), `End fill` (`field.fillEnd`), `Field duration` (`field.durationRange`), and `Field speed` (`field.speed`) controls in Random Field.

- [ ] **Step 2: Update product coverage**

Update acceptance rows, workload targets, and performance scenarios to cover the new controls.

### Task 2: Model Behavior

**Files:**
- Modify: `src/app/vestaboard-model.ts`
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Extend settings**

Resolve `fillStart`, `fillEnd`, `fieldDurationRange`, and `fieldSpeed`, with legacy `field.fill` fallback.

- [ ] **Step 2: Animate background occupancy**

For non-phrase cells, compute start and end occupancy from deterministic seeded values. For cells whose occupancy changes, show deterministic flicker immediately after progress 0 until their seeded duration ends. Use Field speed to change active flicker buckets without changing final settled characters.

- [ ] **Step 3: Add tests**

Add tests for start/end occupancy, first-non-zero-frame flicker, mid-frame flicker, Field speed, and legacy `field.fill` compatibility.

### Task 3: Browser And Worklog

**Files:**
- Modify: `e2e/app-controls.spec.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Update browser checks**

Drag `Start fill`, `End fill`, `Field duration`, and `Field speed`, then verify the output remains visible and timeline frames respond.

- [ ] **Step 2: Run verification**

Run `pnpm verify:quick`, `pnpm build`, and targeted Playwright checks.

- [ ] **Step 3: Record evidence**

Update the worklog with the background animation decision and command results.

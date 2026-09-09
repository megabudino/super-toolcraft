# Vestaboard Letter Speed And Duration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace single-step phrase duration timing with duration spread plus launch speed so simultaneous outgoing letters are derived from overlap.

**Architecture:** Keep the existing Creative Apps Kit schema and DOM/Canvas renderer. Update only app-specific schema, model, acceptance/performance metadata, tests, browser scenarios, and worklog. The renderer continues to consume `buildVestaboardModel`; the timing schedule stays inside `vestaboard-model.ts`.

**Tech Stack:** TypeScript, Creative Apps Kit schema controls, Vitest, Playwright.

---

### Task 1: Schema And Metadata

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-acceptance.test.ts`
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Rename timing range and add speed control**

Change Board Message controls so `Duration spread` targets `board.text.letterDurationRange` and new `Letter speed` targets `board.text.letterSpeed`.

- [ ] **Step 2: Update acceptance and performance rows**

Replace "Cell duration" naming with "Duration spread" and add an acceptance/performance row for `Letter speed`.

- [ ] **Step 3: Update schema-order and metadata tests**

Expect both `board.text.letterDurationRange` and `board.text.letterSpeed` in product control order and workload targets.

### Task 2: Timing Model

**Files:**
- Modify: `src/app/vestaboard-model.ts`
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Add settings fields**

Resolve `letterDurationRange` from `board.text.letterDurationRange`, falling back to legacy `board.text.cellDurationRange`, and resolve `letterSpeed` from `board.text.letterSpeed`.

- [ ] **Step 2: Replace single active removal phase**

Use a deterministic per-letter schedule: start time from speed-compressed launch window, duration from seeded range, active flicker while `start <= progress < end`, removed after `end`.

- [ ] **Step 3: Add tests**

Add Vitest coverage showing higher speed and longer duration produce more active outgoing letters at the same playback progress, while final target text remains correct.

### Task 3: Browser And Worklog

**Files:**
- Modify: `e2e/app-controls.spec.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Update browser controls**

Drag `Duration spread`, `Letter speed`, and existing `Outgoing opacity` in targeted browser tests.

- [ ] **Step 2: Run verification**

Run `pnpm verify:quick`, `pnpm build`, and targeted Playwright grep for timing and phrase animation.

- [ ] **Step 3: Record evidence**

Update worklog decisions and verification with the new timing model and commands.

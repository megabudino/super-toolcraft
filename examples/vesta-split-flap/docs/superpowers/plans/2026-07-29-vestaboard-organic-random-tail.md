# Vestaboard Organic Random Tail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the random-field tail's visible linear index pattern with deterministic, organic per-cell seeded randomness.

**Architecture:** Keep the Vestaboard model as the single source of product frames. Add a regression test around the user's sparse-tail settings, then route the random-field occupancy, duration, opacity, and glyph choices through an avalanche-mixed 32-bit hash while preserving the existing phrase/drum seeded stream.

**Tech Stack:** React 19, Vite 8, TypeScript, Vitest, Playwright, Creative Apps Kit local runtime.

---

### Task 1: Model Regression

**Files:**
- Modify: `src/app/app-schema.test.ts`

- [x] **Step 1:** Add a test that builds the user's sparse-tail frame with `field.fillStart=100`, `field.fillEnd=0`, `field.durationRange=[39,74]`, `field.seed=137`, a `1920x1080` canvas, and `fieldProgress` in the late tail.
- [x] **Step 2:** Count non-phrase visible background cells by column.
- [x] **Step 3:** Assert the sparse tail avoids regular column cadence and leaves enough tail cells to evaluate the sparse field.

### Task 2: Hash Mixer

**Files:**
- Modify: `src/app/vestaboard-model.ts`

- [x] **Step 1:** Add a pure 32-bit avalanche mixer.
- [x] **Step 2:** Add organic seeded range/duration helpers for the random-field path instead of changing the global phrase/drum helper.
- [x] **Step 3:** Route random-field glyph and trail character selection through the same mixed stream so active field glyphs do not inherit linear index patterns.

### Task 3: Verification

**Files:**
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [x] **Step 1:** Run `./node_modules/.bin/vitest run src/app/app-schema.test.ts -t "random field tail"`.
- [x] **Step 2:** Run `./node_modules/.bin/tsc -p tsconfig.json --noEmit`.
- [x] **Step 3:** Run `./node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-performance.test.ts src/app/app-acceptance.test.ts`.
- [x] **Step 4:** Run `pnpm verify:quick`.
- [x] **Step 5:** Run focused Playwright for the Final hold sparse-tail scenario and relevant perf checks.
- [x] **Step 6:** Update the worklog with evidence and any residual risks.

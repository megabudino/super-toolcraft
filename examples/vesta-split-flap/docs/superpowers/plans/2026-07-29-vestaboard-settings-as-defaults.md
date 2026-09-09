# Vestaboard Settings as Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the exported Vestaboard settings JSON the default app setup for fresh sessions and control resets.

**Architecture:** Add app-owned default constants, wire schema control defaults and canvas size to them, and seed the initial runtime timeline through an app-specific persistence bootstrap. Bump persistence version so previous localStorage snapshots do not mask the new defaults.

**Tech Stack:** React 19, Vite 8, TypeScript, Vitest, Playwright, Creative Apps Kit local runtime.

---

### Task 1: Default Constants

**Files:**
- Create: `src/app/vestaboard-defaults.ts`

- [x] **Step 1:** Add constants for the exported canvas size, values block, persistence version, and reusable initial timeline.
- [x] **Step 2:** Add a null runtime component that applies the default timeline through commands only on a clean initial state.

### Task 2: Schema Defaults

**Files:**
- Modify: `src/app/app-schema.ts`

- [x] **Step 1:** Import the default constants.
- [x] **Step 2:** Replace supported control `defaultValue` entries with values from the exported JSON.
- [x] **Step 3:** Set default canvas size to `1920x1080`.
- [x] **Step 4:** Bump persistence version.

### Task 3: Startup Bootstrap

**Files:**
- Modify: `src/routes/index.tsx`

- [x] **Step 1:** Mount the app-specific timeline default component inside `canvasContent` without rendering app UI.
- [x] **Step 2:** Keep route composition through `CreativeAppsKitApp`.

### Task 4: Tests and Worklog

**Files:**
- Modify: `src/app/app-schema.test.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [x] **Step 1:** Add a schema regression proving every exported value target is now a control default.
- [x] **Step 2:** Add a regression for the default persistence payload and version bump.
- [x] **Step 3:** Run targeted tests, TypeScript, app contract tests, `pnpm verify:quick`, and browser smoke.
- [x] **Step 4:** Record verification evidence in the worklog.

# Unified Preset Viewport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every named donut preset use the Matcha camera, 170% zoom, and Infinity canvas while preserving all appearance settings.

**Architecture:** Centralize camera and Infinity normalization in `donut-preset-library.ts`, the existing boundary used by factory, imported, updated, reset, and exported presets. Set exact zoom through the built-in Toolcraft `canvas.setViewport` command only when a named preset is applied, preserving the current pan offset.

**Tech Stack:** React, TypeScript, Toolcraft runtime schema and command bus.

---

### Task 1: Canonical preset viewport

**Files:**
- Modify: `src/app/donut/donut-preset-library.ts`
- Modify: `src/app/donut/donut-preset-defaults.json`

- [x] Replace preset-specific orientations with `DONUT_DEFAULT_PRESET_ORIENTATION` during normalization.
- [x] Force normalized `canvas.infinity` to `true`.
- [x] Align every bundled JSON entry with the canonical Matcha orientation and Infinity flag without changing any other value.

### Task 2: Set 170% zoom when applying a named preset

**Files:**
- Modify: `src/app/donut/donut-canvas.tsx`

- [x] Dispatch the built-in `canvas.setViewport` command with `zoom: 170` after applying a named preset while preserving the current pan offset.
- [x] Keep Custom mode free from automatic zoom changes.

### Task 3: Acceptance ownership and decision trail

**Files:**
- Modify: `src/app/donut/donut-preset-acceptance.ts`
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/app-verification-impact.json`
- Modify: `docs/toolcraft/agent-worklog.md`

- [x] Describe the shared camera, Infinity, and zoom behavior in product acceptance metadata.
- [x] Map changed preset/viewport modules to the existing preset, orientation, Infinity, and viewport owners.
- [x] Record the user-requested verification skip and the exact state/output boundary.

### Task 4: Verification

- [x] Do not run tests, typecheck, build, browser checks, performance checks, or `npm run verify:delivery`, per the user's explicit instruction.

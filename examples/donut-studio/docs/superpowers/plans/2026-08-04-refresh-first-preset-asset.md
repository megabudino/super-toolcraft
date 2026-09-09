# Refresh First Preset Asset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the supplied first Matcha scene as the first factory asset and align every other preset to its orientation without changing their appearance.

**Architecture:** Update the bundled preset resource at its existing factory-data boundary. Replace `matcha-cream.values` completely from the supplied embedded library, then copy only its `scene.orientation` into the other entries; keep runtime normalization, 170% zoom, and Infinity behavior unchanged.

**Tech Stack:** JSON, TypeScript, React, Toolcraft runtime preset persistence.

---

### Task 1: Refresh bundled preset data

**Files:**
- Modify: `src/app/donut/donut-preset-defaults.json`

- [x] Replace all 65 values of the first `matcha-cream` entry from the supplied embedded library.
- [x] Copy only the first preset's `scene.orientation` into every remaining preset.

### Task 2: Align defaults and acceptance expectations

**Files:**
- Modify: `src/app/donut/donut-values.ts`
- Modify: `src/app/donut/donut-values.test.ts`
- Modify: `src/app/donut/donut-preset-library.test.ts`
- Modify: `e2e/donut-presets.spec.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [x] Align nested Matcha schema defaults with the refreshed first asset.
- [x] Update source-backed expectations for the changed Matcha values.
- [x] Record source identity, merge scope, and preserved other-preset appearance.

### Task 3: Verification

- [x] Do not run tests, typecheck, build, browser checks, performance checks, or `npm run verify:delivery`, per the user's standing instruction.

# Vestaboard Gap And Fill Opacity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add negative minimum gap and deterministic random cell background opacity distribution.

**Architecture:** Keep controls schema-backed. Extend the shared Vestaboard model with per-cell fill opacity, then consume it in DOM preview and Canvas export.

**Tech Stack:** Creative Apps Kit schema controls, TypeScript, React DOM preview, Canvas 2D export, Vitest, Playwright.

---

### Task 1: Schema And Model

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/vestaboard-model.ts`

- [ ] Set `board.tile.gap` min to `-1`.
- [ ] Replace fill opacity with `board.cell.fill` color, `board.cell.fillOpacityRange` rangeSlider, and `board.cell.fillSeed` slider.
- [ ] Add deterministic per-cell `fillOpacity` using the cell fill seed.

### Task 2: Renderer, Export, And Metadata

**Files:**
- Modify: `src/app/vestaboard-renderer.tsx`
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] Render/export every cell fill with its computed opacity.
- [ ] Update acceptance and performance rows for gap min, fill opacity range, and fill seed.
- [ ] Update worklog decisions.

### Task 3: Tests

**Files:**
- Modify: `src/app/app-schema.test.ts`
- Modify: `src/app/app-acceptance.test.ts`
- Modify: `e2e/app-controls.spec.ts`

- [ ] Add unit coverage for negative gap and deterministic fill opacity distribution.
- [ ] Add browser coverage for cell fill color, opacity range, seed, and negative gap.
- [ ] Run `pnpm test`, `pnpm build`, `pnpm test:browser`, `pnpm test:browser:perf`, and `pnpm verify:final`.

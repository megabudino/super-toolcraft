# Vestaboard Cell Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed, predesigned Vestaboard tile field with a neutral full-canvas cell grid controlled by user-provided geometry, fill, border, and opacity settings.

**Architecture:** Keep the app inside Creative Apps Kit schema/runtime. Extend the schema with cell radius and `colorOpacity` controls, update the shared model to derive grid dimensions from canvas size, and let both DOM preview and Canvas 2D export consume the same computed model.

**Tech Stack:** React, TypeScript, Creative Apps Kit schema controls, DOM preview renderer, Canvas 2D export, Vitest, Playwright.

---

### Task 1: Schema And Acceptance

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`

- [ ] Add `board.cell.radius` slider and `board.cell.fill` / `board.cell.border` `colorOpacity` controls in the Board Surface section.
- [ ] Add acceptance rows proving radius changes CSS border radius, fill color and opacity affect the cell background, and border color and opacity affect the cell border.
- [ ] Add performance scenarios for radius, cell fill, and cell border responsiveness.

### Task 2: Model And Renderer

**Files:**
- Modify: `src/app/vestaboard-model.ts`
- Modify: `src/app/vestaboard-renderer.tsx`
- Modify: `src/routes/index.tsx`

- [ ] Replace fixed 22 by 6 dimensions with computed columns and rows based on canvas size, target cell size, and gap.
- [ ] Compute actual tile width and height so cells fill all available canvas space exactly.
- [ ] Remove hardcoded cell background, border, radius, and shadow from DOM preview.
- [ ] Draw runtime cell fill and border styles in Canvas 2D export.

### Task 3: Tests And Worklog

**Files:**
- Modify: `src/app/app-schema.test.ts`
- Modify: `src/app/app-acceptance.test.ts`
- Modify: `e2e/app-controls.spec.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] Update unit tests for dynamic grid dimensions and new cell style settings.
- [ ] Update browser tests for full-canvas filling, dynamic row/column changes, cell radius, cell fill color opacity, and border color opacity.
- [ ] Update worklog decisions and verification notes.
- [ ] Run `pnpm verify:quick`, `pnpm verify:perf`, `pnpm verify:final`, then start `pnpm dev`.

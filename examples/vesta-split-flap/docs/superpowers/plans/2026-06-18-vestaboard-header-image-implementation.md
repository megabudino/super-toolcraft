# Vestaboard Header Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Vesta header image and render the Vestaboard grid below the 52px header.

**Architecture:** Store a resized app asset, expose shared header constants and board-area helpers, render an absolute DOM image layer at the top, build the board model from the canvas area below the header, and draw the same composition into Canvas 2D export paths.

**Tech Stack:** TypeScript, React DOM renderer, Canvas 2D export renderer, Vite asset imports, Vitest, Playwright.

---

### Task 1: Asset And Shared Constants

**Files:**
- Create: `src/app/assets/vesta-header.png`
- Create: `src/app/vestaboard-header.ts`

- [ ] **Step 1: Resize the uploaded image**

Create a 1920px by 52px PNG from `/Users/kusnizza/Desktop/Frame 2147230572.png`.

- [ ] **Step 2: Add shared header constants**

Export the asset URL, width, height, board area helper, board offset, a loader for Canvas 2D, and a draw helper.

### Task 2: Preview And Export

**Files:**
- Modify: `src/app/vestaboard-renderer.tsx`
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Render DOM image layer**

Add an absolutely positioned image at the top of `VestaboardOutput`, centered with width 1920 and height 52. Build the Vestaboard model with `canvas.height - 52` and position its foreground layer at `top: 52`.

- [ ] **Step 2: Draw image in export paths**

Load the header image before PNG/video export, draw the board with a 52px y-offset, and draw the header image at the top.

### Task 3: Coverage And Worklog

**Files:**
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-schema.test.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `e2e/app-controls.spec.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Add acceptance and layer metadata**

Cover the new header image layer as product output and renderer technique metadata.

- [ ] **Step 2: Add browser coverage**

Verify the header image is visible, top-aligned, 1920px wide, and the board begins immediately below it.

- [ ] **Step 3: Run verification**

Run targeted TypeScript, Vitest, browser acceptance, `pnpm verify:quick`, and `pnpm build`.

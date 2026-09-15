# Landing Globe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Toolcraft product that renders and exports a configurable black 3D globe with white latitude and meridian lines for a landing-page background.

**Architecture:** Keep all user-editable state in `src/app/app-schema.ts`. Put Three/WebGL preview and deterministic 2D export drawing in product-owned modules imported by `src/app/app-composition.tsx`. Keep acceptance, performance, and worklog declarations aligned with the visible product.

**Tech Stack:** React, TypeScript, Toolcraft runtime schema/composition, Three.js WebGL preview, Canvas 2D runtime image export, Vitest/Playwright delivery verification.

---

### Task 1: Schema And Product Readiness

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Declare controls**

Add one authored `Background` source section and one `Globe` section. Use schema `color`, `slider`, and `orientationGizmo` controls with default values for `appearance.background`, `globe.sphereColor`, `globe.lineColor`, `globe.latitudeCount`, `globe.meridianCount`, `globe.lineWidth`, and `globe.orientation`.

- [ ] **Step 2: Declare product readiness**

Switch readiness from `starter` to `product`, set export intent to image-only, set `viewInteraction.mode` to `orbit`, and declare panel/canvas interaction ownership for exact style/count edits versus spatial orientation.

- [ ] **Step 3: Declare performance structure**

Set `usesCustomRenderer: true`, choose a WebGL custom renderer strategy, declare workload dimensions for latitude count, meridian count, and line width only where they materially change geometry or fragment cost, and keep measured performance unauthorised for first delivery.

### Task 2: Globe Renderer

**Files:**
- Create: `src/app/globe-model.ts`
- Create: `src/app/globe-renderer.tsx`
- Create: `src/app/globe-renderer.module.css`
- Modify: `src/app/app-composition.tsx`

- [ ] **Step 1: Add deterministic geometry helpers**

Create helpers for clamping numeric controls, reading color/orientation values, and building latitude/meridian line point data. Keep continents and texture code absent.

- [ ] **Step 2: Add Three.js preview**

Render a full-surface WebGL canvas inside `canvasContent`, using `useToolcraftProductSceneFrame()` for dimensions. Draw an opaque black sphere and white line rings. Rebuild geometry only when count/thickness/color/orientation changes. Dispose Three resources on cleanup.

- [ ] **Step 3: Add orientation interaction**

Use the runtime model orbit hook for the `globe.orientation` target and a hit test based on the projected globe circle. Misses remain available to the runtime canvas pan behavior.

### Task 3: Export Renderer And Acceptance

**Files:**
- Modify: `src/app/globe-renderer.tsx`
- Modify: `src/app/app-composition.tsx`
- Modify: `src/app/app-acceptance-data.ts`

- [ ] **Step 1: Add image export callback**

Provide `exportRenderer.renderFrame` that draws the same deterministic globe in scene coordinates on the runtime-owned export context. Do not allocate export canvases or create downloads in product code.

- [ ] **Step 2: Add acceptance entries**

Cover persistence reload, line count controls, line width, background output, orientation gizmo, render-scale backing pixels, and image export artifact behavior with product acceptance IDs.

### Task 4: Verification

**Files:**
- Modify only if checks reveal product bugs.

- [ ] **Step 1: Run code health**

Run `npm run ai:check`. Expected: pass.

- [ ] **Step 2: Run targeted tests**

Run focused Vitest tests for schema/readiness/performance changes during development. Expected: pass.

- [ ] **Step 3: Run first delivery gate**

Run `npm run verify:delivery`. Expected: one protected initial functional receipt with no measured performance.

- [ ] **Step 4: Start local app**

Run `npm run dev` and report the local URL.

## Self-Review

Spec coverage: The plan covers black 1920px canvas, opaque black globe, white latitude/meridian lines, no continents, adjustable line counts/thickness, axis orientation, image export, persistence, and first-delivery verification.

Placeholder scan: No placeholder steps remain.

Type consistency: Targets use the `globe.*`, `appearance.background`, and `export.*` namespaces consistently across schema, renderer, readiness, acceptance, and performance.

# Independent Mesh Color Points Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Color Points selection explicit and make each Add/Remove action change exactly one integrated mesh point without changing canvas size or column count.

**Architecture:** Extend the product-owned point layout with a stable rectangular base and appended cell insertions. Replace the insufficient built-in collection renderer with a product-owned runtime-backed control, and render inserted points through local parameter-space triangulation while leaving untouched cells on the existing Coons path.

**Tech Stack:** React, TypeScript, Toolcraft runtime schema/commands, SVG editor overlay, WebGL2, Vitest, Playwright.

---

### Task 1: Define independent-point topology

**Files:**
- Modify: `src/app/mesh-gradient/mesh-model.ts`
- Replace: `src/app/mesh-gradient/mesh-collection-topology.ts`
- Modify: `src/app/mesh-gradient/mesh-collection-topology.test.ts`

- [ ] Write failing tests proving a 12-point/four-column add returns 13 points/four columns and a matching inserted-cell record.
- [ ] Write a failing test proving removal deletes only the selected inserted index and preserves every structural point.
- [ ] Add `basePointCount` and sanitized insertion metadata to `MeshPointLayout`.
- [ ] Implement deterministic cell selection, insertion slots, index-safe removal, and count-change reconciliation.
- [ ] Run `npx vitest run src/app/mesh-gradient/mesh-collection-topology.test.ts` and expect all focused tests to pass.

### Task 2: Build the selected Color Points control

**Files:**
- Create: `src/app/mesh-gradient/mesh-color-points-control.tsx`
- Create: `src/app/mesh-gradient/mesh-color-points-control.module.css`
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-composition.tsx`
- Modify: `src/app/app-acceptance-data.ts`

- [ ] Change the schema control type from `collectionActions` to `meshColorPoints` while preserving `mesh.colors` defaults and bounds.
- [ ] Render every color as a selectable row with a native color input and editable hex Input; mark the row active from `mesh.points.selectedIndices`.
- [ ] Dispatch history-skipped selection to `mesh.points`; use `setValue` for color edits and one-item additions/removals.
- [ ] Disable Add at sixteen points and Remove unless the active point is an inserted node.
- [ ] Register the renderer and add the required built-in fit-check/custom-control acceptance metadata.

### Task 3: Integrate inserted points into preview and guides

**Files:**
- Create: `src/app/mesh-gradient/mesh-cell-triangulation.ts`
- Create: `src/app/mesh-gradient/mesh-cell-triangulation.test.ts`
- Modify: `src/app/mesh-gradient/mesh-webgl.ts`
- Modify: `src/app/mesh-gradient/mesh-editor-overlay.tsx`
- Modify: `src/app/mesh-gradient/mesh-canvas.tsx`

- [ ] Write failing tests for deterministic cell triangulation and unique connector edges.
- [ ] Keep complete unsplit cells on the existing Coons geometry path.
- [ ] Tessellate split-cell triangles in local parameter space and interpolate inserted displacement/color barycentrically.
- [ ] Limit structural grid guides and edge pinning to `basePointCount`; draw connector edges for inserted points and suppress their Bezier handles.
- [ ] Replace the row/column collection reconciler effect with the independent-point reconciler and verify columns/canvas size are never dispatched by Add/Remove.

### Task 4: Align product contracts and browser proof

**Files:**
- Modify: `e2e/mesh-collection-topology.spec.ts`
- Modify: `e2e/app-controls.spec.ts`
- Modify: `src/app/app-performance-impact.json`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] Update browser assertions from 12→15/4→5 to 12→13/4→4 and verify unchanged canvas bounds.
- [ ] Assert canvas-point selection activates the matching panel row and panel selection activates the matching handle.
- [ ] Assert one Remove returns 13→12 without moving structural handles.
- [ ] Add every new product module to the performance impact inventory with exact pass ownership.
- [ ] Record the superseded design, selected custom-control fit, state/output mapping, targeted checks, delivery result, and skipped full refresh.

### Task 5: Verify and deploy

**Files:**
- Verify only.

- [ ] Run focused Vitest files and the focused Playwright topology test during development.
- [ ] Run the Tier 3 impact-derived `npm run verify:delivery` command once at the delivery boundary.
- [ ] Start or reuse `npm run dev` and perform the final browser check on the saved app URL.
- [ ] Commit only `examples/mesh-gradient` changes, deploy the linked Vercel project from the monorepo root, and verify `https://mesh-gradient-pixelpoint.vercel.app/demos/mesh-gradient` serves the new assets and behavior.

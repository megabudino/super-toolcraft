# Orientation Handedness Fix Implementation Plan

> **For Codex:** Follow the local Toolcraft workflow, change only the app renderer integration, and verify the real canvas interaction before completion.

**Goal:** Remove the apparent mirror between the starter orientation gizmo and the 3D mosaic relief.

**Architecture:** Keep the runtime `view.orbit` pose and right-handed gizmo contract unchanged. Convert the renderer’s canvas-space Y-down point coordinates into world-space Y-up before applying the camera basis, then map the projected Y-up value directly to WebGL clip space. Preview, PNG, and video already share the same renderer, so the correction applies to every output path.

**Verification tier:** Tier 3

**Reason:** The change affects WebGL projection, live 3D rotation, and export pixels without changing schema or runtime state.

**Run:** `npm run verify:quick`; focused orientation browser acceptance; targeted agent-browser gizmo/model drag with frame sampling, export cleanliness, and visual inspection.

**Skip:** Full performance checkpoint because this is a post-first-working visual-correctness fix and the user did not report performance. No dependency install because package files are unchanged.

## Implementation

- [x] Update `src/app/kinetic-mosaic-renderer.tsx` so canvas Y-down coordinates become world Y-up before `u_viewRight`, `u_viewUp`, and `u_viewBack` projection.
- [x] Export the production vertex-shader source and add a targeted assertion in `src/app/app-schema.test.ts` that locks the non-reflected coordinate conversion.
- [x] Keep schema controls, timeline, persistence, Infinity Canvas, direct-hit ownership, and runtime gizmo math unchanged.
- [x] Update `docs/toolcraft/product-spec.md` with the right-handed renderer convention.
- [x] Update `docs/toolcraft/agent-worklog.md` with diagnosis, rejected axis/color swaps, verification evidence, and skipped full-performance rationale.

## Browser Verification

- [x] Run the existing orientation acceptance covering gizmo drag, direct object drag, background pan, fixed handle placement, and export exclusion.
- [x] In the controlled browser, drag horizontally and vertically through the gizmo and visible object, confirm the relief follows the right-handed axes without reflection, sample frame gaps, inspect the canvas, and confirm zero page/console errors.

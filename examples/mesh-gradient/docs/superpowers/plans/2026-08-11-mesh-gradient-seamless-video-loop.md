# Mesh Gradient Seamless Video Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the visible color jump at the Mesh Gradient animation seam so preview playback and exported video repeat as one continuous forward loop.

**Architecture:** Keep Toolcraft timeline playback and video export unchanged. Extract the animated hue offset into a small pure function inside the existing WebGL renderer, make its temporal phase complete an integer number of full sine periods per loop, and use that function when rendering every frame.

**Tech Stack:** TypeScript, React, WebGL2, Vitest, Playwright, MediaRecorder, FFmpeg diagnostics.

---

### Task 1: Lock the color seam behavior with a focused test

**Files:**
- Modify: `src/app/mesh-gradient-acceptance.test.ts`
- Modify: `src/app/mesh-gradient/mesh-webgl.ts`

- [x] **Step 1: Write the failing test**

Import `getMeshColorLoopOffset` from `mesh-webgl.ts` and assert that it returns the same offset at progress `0` and `1` for one and multiple loop cycles, while still producing a non-zero offset inside the cycle.

- [x] **Step 2: Run the focused test to verify it fails**

Run: `pnpm exec vitest run src/app/mesh-gradient-acceptance.test.ts`

Expected: FAIL because `getMeshColorLoopOffset` does not exist yet.

- [x] **Step 3: Implement the minimal periodic color phase**

Add a pure `getMeshColorLoopOffset` helper to `mesh-webgl.ts`. Preserve the existing per-point base phase, but advance the temporal component by `2π × progress × cycles` and subtract the starting sine value. Replace the current half-speed hue formula with this helper. Do not change the timeline, video exporter, controls, or component styling.

- [x] **Step 4: Run the focused test to verify it passes**

Run: `pnpm exec vitest run src/app/mesh-gradient-acceptance.test.ts`

Expected: PASS.

### Task 2: Verify the real rendered and encoded seam

**Files:**
- Modify only if the test exposes another defect: `src/app/mesh-gradient/mesh-webgl.ts`

- [x] **Step 1: Run the existing browser timeline acceptance**

Run: `pnpm exec playwright test e2e/app-controls.spec.ts --grep "mesh timeline drives one seamless animation loop"`

Expected: PASS for playback, scrub, duration edit, forward loop, and renderer response.

- [x] **Step 2: Export a one-second local video through the real UI**

Open the local app, set the timeline duration to one second, click `Export Video`, and save the artifact under `/tmp`.

- [x] **Step 3: Compare the encoded seam with ordinary adjacent-frame motion**

Use `ffprobe` to confirm duration and frame timestamps. Decode the first two and final two frames with `ffmpeg`, then compare the final-to-first transition against an ordinary adjacent-frame transition. The seam must no longer contain the large color discontinuity diagnosed before the fix.

- [x] **Step 4: Run the app build**

Run: `pnpm build`

Expected: PASS with no TypeScript or Vite errors.

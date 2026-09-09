# Dual Rotation Audio Smoothing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Dot Ring Studio expose separate global ring rotation and natural waveform rotation while smoothing audio spikes so high peaks feel connected.

**Architecture:** Keep the Toolcraft schema/runtime as the source of truth. Add a new `wave.globalRotationSpeed` slider for physical bead-chain orbit, keep `wave.rotationSpeed` as the travelling active-sector waveform speed, and update the Canvas 2D draw path to use both values independently. Smooth audio displacement by sampling neighboring angular positions and compressing transient impact before applying the active sector envelope.

**Tech Stack:** Toolcraft schema controls, TypeScript, Canvas 2D renderer, Vitest, Playwright browser acceptance/performance tests.

---

### Task 1: Schema And Metadata

**Files:**
- Modify: `/Users/alex/Projects/tmp/toolcraft-app-2/src/app/app-schema.ts`
- Modify: `/Users/alex/Projects/tmp/toolcraft-app-2/src/app/app-acceptance.ts`
- Modify: `/Users/alex/Projects/tmp/toolcraft-app-2/src/app/app-performance.ts`

- [ ] **Step 1: Add `wave.globalRotationSpeed` to the Wave Motion section**

Add a slider after `rotationSpeed` with label `Global rotation`, target `wave.globalRotationSpeed`, default `0`, min `-2`, max `2`, step `0.05`, unit `turns`, and a description explaining that it physically orbits the full bead chain.

- [ ] **Step 2: Reword `wave.rotationSpeed`**

Keep the label `Rotation`, but describe it as natural clockwise waveform travel around the circle. Keep min `0`, max `4`, step `0.05`, and default `2`.

- [ ] **Step 3: Add acceptance and performance rows**

Add an acceptance row and browser test name for `wave.globalRotationSpeed`; update the existing rotation row to describe travelling waveform phase. Add `global-rotation-drag` to performance scenarios with the same responsiveness budget as other non-workload waveform sliders.

### Task 2: Renderer Math

**Files:**
- Modify: `/Users/alex/Projects/tmp/toolcraft-app-2/src/app/dot-ring-drawing.ts`

- [ ] **Step 1: Extend settings**

Add `globalRotationSpeed` to `DotRingSettings`, read it from state with clamp `-2..2`, and preserve fractional values.

- [ ] **Step 2: Separate phases**

Use `wave.rotationSpeed` for `sectorCenter` in both audio and procedural modes. Use `wave.globalRotationSpeed` only for the final draw angle of the beads.

- [ ] **Step 3: Smooth audio displacement**

Sample audio at the bead angle and two nearby angular offsets, blend the three samples, reduce high-frequency per-bead noise, and compress transient kick with a bounded nonlinear gain. Keep `wave.affectedAmplitude` able to produce visible high spikes, but make the active envelope carry the spike shape so adjacent beads move as a connected wave.

### Task 3: Tests

**Files:**
- Modify: `/Users/alex/Projects/tmp/toolcraft-app-2/src/app/app-schema.test.ts`
- Modify: `/Users/alex/Projects/tmp/toolcraft-app-2/src/app/app-product.test.ts`
- Modify: `/Users/alex/Projects/tmp/toolcraft-app-2/e2e/app-controls.spec.ts`
- Modify: `/Users/alex/Projects/tmp/toolcraft-app-2/e2e/dot-ring-performance.spec.ts`

- [ ] **Step 1: Update schema order expectations**

Insert `wave.globalRotationSpeed` after `wave.rotationSpeed`.

- [ ] **Step 2: Add product mapping coverage**

Assert fractional values for both natural rotation and global rotation are preserved.

- [ ] **Step 3: Add browser acceptance and perf**

Keep the existing `Rotation` browser test as a waveform-phase output test. Add a `Global rotation` browser test and a matching performance drag test.

### Task 4: Worklog And Verification

**Files:**
- Modify: `/Users/alex/Projects/tmp/toolcraft-app-2/docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Record Iteration 4**

Document the visual regression, root cause, chosen dual-rotation model, smoothing changes, files touched, and verification.

- [ ] **Step 2: Run checks**

Run `pnpm test`, focused browser acceptance/performance for rotation controls, `pnpm verify:final`, then start `pnpm dev`.

# Vestaboard Final Hold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a configurable Final hold duration that extends total playback/video duration while preserving the main phrase animation duration.

**Architecture:** Add one schema-backed Board Message slider rendered by an app-level custom control that atomically updates `board.text.finalHoldSeconds` and the runtime timeline duration by the same delta. Live preview, PNG export, and video export call one shared progress helper so phrase and field progress stay consistent across all outputs, and phrase shake is isolated from background-only flipping.

**Tech Stack:** React 19, Vite 8, TypeScript, Vitest, Playwright, Creative Apps Kit local runtime.

---

### Task 1: Add Settings And Split Progress Helper

**Files:**
- Modify: `src/app/vestaboard-model.ts`
- Test: `src/app/app-schema.test.ts`

- [x] **Step 1:** Add `finalHoldSeconds` to `VestaboardSettings` and resolve `board.text.finalHoldSeconds` clamped from `0` to `8`.
- [x] **Step 2:** Export `getVestaboardAnimationProgress`, returning `fieldProgress`, `phraseProgress`, and `effectiveFinalHoldSeconds`.
- [x] **Step 3:** Add unit coverage proving `Final hold` makes phrase progress reach `1` before field progress reaches `1`.
- [x] **Step 4:** Update unit coverage so the helper treats runtime duration as total duration, not shortened phrase duration.

### Task 1b: Sync Runtime Timeline Duration

**Files:**
- Create: `src/app/final-hold-control.tsx`
- Modify: `src/routes/index.tsx`
- Test: `e2e/app-controls.spec.ts`

- [x] **Step 1:** Add an app-level custom control renderer that dispatches `timeline.setDuration` by the direct Final hold delta during control interaction.
- [x] **Step 2:** Register the custom control renderer through `CreativeAppsKitApp controlRenderers`.
- [x] **Step 3:** Add browser coverage proving changing Final hold increases the timeline range.

### Task 2: Add Schema Control

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Test: `src/app/app-schema.test.ts`
- Test: `src/app/app-acceptance.test.ts`

- [x] **Step 1:** Add `Final hold` slider after `Target message`.
- [x] **Step 2:** Add acceptance and performance rows for `board.text.finalHoldSeconds`.
- [x] **Step 3:** Update control order and workload target expectations.

### Task 3: Use Split Progress In Outputs

**Files:**
- Modify: `src/app/vestaboard-renderer.tsx`
- Modify: `src/routes/index.tsx`
- Test: `e2e/app-controls.spec.ts`

- [x] **Step 1:** Replace direct `time / duration` phrase/field progress calculations in live preview with `getVestaboardAnimationProgress`.
- [x] **Step 2:** Replace direct progress calculations in PNG and video export paths with the same helper.
- [x] **Step 3:** Add browser coverage that scrubs into the final hold window and verifies final phrase text while field cells are still not at the final background frame.
- [x] **Step 4:** Keep video export length equal to the extended runtime timeline duration.

### Task 3b: Stabilize Final Phrase During Background Tail

**Files:**
- Modify: `src/app/vestaboard-model.ts`
- Test: `src/app/app-schema.test.ts`
- Test: `e2e/app-controls.spec.ts`

- [x] **Step 1:** Compute shake amplitude from phrase flipping cells instead of all field/background cells.
- [x] **Step 2:** Add model coverage proving background-only flipping no longer produces foreground shake.
- [x] **Step 3:** Add browser coverage with the provided settings shape proving the final phrase stays position-stable in the hold tail.

### Task 4: Verify

Run:

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
./node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts
CREATIVE_APPS_KIT_TEST_PORT=3030 pnpm exec playwright test e2e/app-controls.spec.ts --grep "final hold|target message drives phrase transform animation" --workers=1
pnpm verify:quick
```

Expected: all commands pass, and visual smoke confirms `Final hold` is visible in Board Message.

## Plan Self-Review

- Every spec requirement maps to a task.
- No placeholders.
- The plan keeps changes scoped to schema, model progress mapping, output callers, tests, and worklog.

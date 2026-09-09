# Vestaboard Phrase Transform Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a target-message textarea and timeline-driven Vestaboard phrase transform animation with PNG current-frame export and video export.

**Architecture:** Keep schema state authoritative. Enable `panels.timeline` in playback mode, compute phrase animation frames in the Vestaboard model from normalized source/target text plus timeline progress, and reuse the same Canvas 2D renderer for PNG and MediaRecorder video export.

**Tech Stack:** Creative Apps Kit schema controls, playback TimelinePanel, React DOM renderer, Canvas 2D export, MediaRecorder video export, Vitest, Playwright.

---

### Task 1: Schema And Product Contract

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-schema.test.ts`
- Modify: `src/app/app-acceptance.test.ts`

- [ ] **Step 1: Enable playback timeline**

Set `panels.timeline: { mode: "playback" }`, add `timeline` to persistence, and change `appTransferMode.animationIntent.mode` to `timeline-playback`.

- [ ] **Step 2: Add target textarea**

Add `targetMessage` to `Board Message`, label it `Target message`, target `board.text.targetMessage`, type `code`, and workload performance metadata.

- [ ] **Step 3: Add Video Export section**

Add `export.video.format` and `export.video.quality` controls in a separate `Video Export` section with `auto`, `webm`, `mp4` and `high`, `4k` options.

- [ ] **Step 4: Update footer actions**

Make `Export Video` the primary footer action and keep `Export PNG` as secondary.

### Task 2: Phrase Animation Model

**Files:**
- Modify: `src/app/vestaboard-model.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] **Step 1: Resolve target text**

Add `targetMessage` to `VestaboardSettings` and read `board.text.targetMessage`.

- [ ] **Step 2: Add text normalization**

Normalize target lines by trimming and collapsing runs of spaces/tabs to a single space.

- [ ] **Step 3: Add deterministic frame builder**

Add a phrase frame helper that returns source text at progress `0`, normalized target at progress `1`, removes extra source characters during the animation, and flips unsettled kept characters through deterministic glyphs.

- [ ] **Step 4: Feed animated phrase into cells**

Let `buildVestaboardModel(settings, { phraseProgress })` build phrase cells from the animated phrase instead of always using source `message`.

### Task 3: DOM, PNG, And Video Export

**Files:**
- Modify: `src/app/vestaboard-renderer.tsx`
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Read timeline progress in DOM**

Compute `phraseProgress` from `state.timeline.currentTimeSeconds / state.timeline.durationSeconds` and pass it to `buildVestaboardModel`.

- [ ] **Step 2: Export current PNG frame**

Use the same progress calculation inside `exportVestaboardPng`.

- [ ] **Step 3: Add MediaRecorder video export**

Create a retina canvas with `getCreativeAppsKitRetinaExportSize`, draw frames from `0` to duration, choose MIME with `MediaRecorder.isTypeSupported`, record `captureStream`, and download the resulting video blob.

### Task 4: Browser Acceptance And Performance

**Files:**
- Modify: `e2e/app-controls.spec.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Add phrase transform browser test**

Set source and target text, scrub the timeline to start/end, and assert source at start, normalized target at end.

- [ ] **Step 2: Add timeline runtime browser test**

Edit timeline duration through the real duration editor, scrub playback, pause/resume, toggle loop, and prove rendered frames change.

- [ ] **Step 3: Add video export browser test**

Export video, load the blob into a `<video>`, wait for `loadedmetadata`, and compare `video.duration` to timeline duration.

- [ ] **Step 4: Add performance coverage**

Add workload scenarios for target message changes, phrase animation frame render, and video export.

### Task 5: Verification

**Files:**
- No code files.

- [ ] **Step 1: Run quick verification**

Run: `pnpm verify:quick`

- [ ] **Step 2: Run focused browser tests**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|timeline playback|export video|phrase animation" --workers=1`

- [ ] **Step 3: Run build**

Run: `pnpm build`

- [ ] **Step 4: Run perf verification**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm test:browser:perf`

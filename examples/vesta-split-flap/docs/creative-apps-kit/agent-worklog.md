# Implementation Worklog

Active change: template-release-2026-09-09

This file records product decisions and the evidence behind them. Keep it short, factual, and current.

## Status

Mode: product

Vestaboard is a playback-timeline Creative Apps Kit app that renders a full-canvas rectangular tile field with deterministic filler characters, source and target phrase textareas, and a Vestaboard-style phrase shortening animation.

## Decisions

### Renderer

- Decision: Use a DOM preview renderer, Canvas 2D PNG export renderer, and Canvas 2D plus MediaRecorder video export renderer.
- Reason: The product is native text plus computed tile geometry across the full canvas and a duplicate edge overlay layer; DOM keeps preview text crisp and renders strict visible 1px edge accents inside covered cells, while Canvas 2D integrates with the standard retina helpers for still frames and records the same board model over runtime playback duration for video. Playback preview coalesces DOM frame updates to a 30 fps cadence and briefly holds product-output mutations while the controls panel collapses or the user drags the canvas viewport, then catches up to the runtime timeline without changing playback state.
- Evidence: `src/app/vestaboard-renderer.tsx`, `src/app/vestaboard-model.ts`, `src/routes/index.tsx`, and `src/app/app-performance.ts` rendererTechnique.

### Timeline

- Decision: Use the Creative Apps Kit playback timeline.
- Reason: The requested target phrase transform and random background fill are duration-based product animations. Runtime playback owns play/pause, loop, scrub, and duration; the renderer maps timeline time through a shared split-progress helper so `Final hold` can settle the phrase before the background field reaches the end of the same timeline. The custom Final hold control updates `board.text.finalHoldSeconds` and extends `state.timeline.durationSeconds` by the same direct user delta, so the phrase transform keeps its original duration while the overall playback and background tail become longer. With Final hold at `0s`, phrase and field progress both follow `state.timeline.currentTimeSeconds / state.timeline.durationSeconds`; with a nonzero hold, phrase progress reaches `1` at `duration - Final hold` while field progress keeps running to timeline end. Target textarea newlines are layout boundaries, not source characters to consume; target spaces can match source whitespace, including source newlines. Source rows animate from one global keep-plan: outgoing characters receive a seeded duration from Duration spread, launch according to Letter speed, flicker with outgoing opacity, disappear during the removal stage, and re-center the row after each disappearance. The number of simultaneously flickering outgoing letters is derived from overlap between launch spacing and duration. Target-line movement overlaps the removal stage, but movement is cell-bound: kept letters advance through integer cells only, and a moving kept letter is represented by Vestaboard flicker in the current cell until it settles into the target cell. Background cells that change between Start fill and End fill start flickering on the first non-zero frame, receive seeded per-cell Field duration timing before settling, and use Field speed for active flicker rate.
- Evidence: `appTransferMode.animationIntent.mode` is `timeline-playback`, `appSchema.panels.timeline.mode` is `playback`, and browser tests edit the real timeline duration, scrub start/end frames, and verify pause/resume plus loop controls.

### Layers

- Decision: No Layers panel.
- Reason: The app has one product layer: the complete full-canvas board. Users do not select, hide, reorder, group, or edit separate objects.
- Evidence: `appSchema.panels.layers` is omitted; renderer layer inventory is performance metadata, not user-editable layers.

### Controls

- Decision: Controls are grouped by product entity or delivery stage: Board Surface, Board Message, Flip Mechanics, Random Field, Video Export, Background, and Export.
- Reason: These groups match what the user edits: target tile geometry, -1px minimum gap, cell radius, cell fill color, seeded cell fill opacity distribution, seeded bottom-edge highlight opacity distribution, edge Fill canvas coverage, cell border treatment, optional source phrase text, target phrase text, Final hold duration for a clean readable ending, Duration spread, Letter speed, Outgoing opacity range for removing phrase characters, animated phrase flash color count/frequency/palette, main phrase typography, random filler behavior with Start fill, End fill, per-cell Field duration, Field speed, Seed, and its own Background font, video format and quality, output background, and product delivery. Final hold uses a custom slider-like control because it must atomically update both a schema value and the runtime timeline duration. Board Surface controls render as standalone full-width rows in the right panel. The previous `Grid` and `Edge sides` settings have been removed entirely; imported legacy values for those targets are ignored by the model.
- Evidence: `src/app/app-schema.ts` control sections, `docs/superpowers/specs/2026-06-16-vestaboard-design.md`, `docs/superpowers/specs/2026-06-16-vestaboard-cell-restyle-design.md`, `docs/superpowers/specs/2026-06-17-vestaboard-bottom-highlight-design.md`, `docs/superpowers/specs/2026-06-17-vestaboard-left-highlight-design.md`, `docs/superpowers/specs/2026-06-17-vestaboard-edge-overlay-design.md`, `docs/superpowers/specs/2026-06-17-vestaboard-bottom-fill-canvas-design.md`, `docs/superpowers/specs/2026-06-17-vestaboard-split-typography-design.md`, `docs/superpowers/specs/2026-06-17-vestaboard-phrase-transform-animation-design.md`, `docs/superpowers/specs/2026-06-18-vestaboard-letter-speed-duration-design.md`, `docs/superpowers/specs/2026-06-18-vestaboard-background-animation-design.md`, `docs/superpowers/specs/2026-06-18-vestaboard-main-text-flash-fill-design.md`, and acceptance rows in `src/app/app-acceptance.ts`.

### Export

- Decision: Expose Export Video as the primary sticky action and Export PNG as the secondary sticky action.
- Reason: This is now an animated product. PNG export uses `createCreativeAppsKitPngExportCanvas` with runtime background and include-background values for the selected timeline frame, then draws the board across the full canvas. Video export uses `getCreativeAppsKitRetinaExportSize`, `shouldIncludeCreativeAppsKitExportBackground`, runtime video format/quality settings, and MediaRecorder capability fallback to record the full phrase transform duration with the same full-canvas board composition.
- Evidence: `src/routes/index.tsx` handles `export-video` and `export-png`; `appSchema.export.png.background` is `include`; browser tests verify PNG retina dimensions, video dimensions, MIME fallback behavior, and video metadata duration against edited timeline duration.

### Settings Transfer

- Decision: Enable Creative Apps Kit runtime Settings Transfer with `appId: "vesta-split-flap"` and `vesta-split-flap-settings.json` export filename.
- Reason: The app now has many user-edited board, field, export, canvas, and timeline settings that should be portable between sessions. Runtime Settings Transfer handles import/export through schema-backed controls, includes canvas and timeline state, ignores unknown targets, and avoids route-local file inputs.
- Evidence: `src/app/app-schema.ts` enables `settingsTransfer`, `src/app/app-acceptance.ts` covers `runtime.settingsTransfer`, and browser tests download, inspect, re-import, and apply the exported JSON.

### Default Settings

- Decision: Use `/Users/kusnizza/Downloads/vestaboard-settings (3).json` as the default visual setup for new sessions and control resets.
- Reason: The latest accepted composition should be the app's starting point: 1920×1080 canvas, 39×66 cells, 6px gap, uppercase source/target phrase, 0.5s Final hold, sparse-ending random field, and the matching color/opacity/seed/font/export settings. The exported mid-animation timestamp is not reused; new sessions start at `0s`, with playback paused to match the exported file and avoid WebAudio autoplay warnings while Sound defaults on. Persistence version moved to `2` so older saved state does not hide the new defaults.
- Evidence: `src/app/vestaboard-defaults.ts`, `src/app/app-schema.ts`, `src/app/vestaboard-default-timeline.tsx`, and schema regression `uses the exported settings file values as schema defaults`.

### Canvas Interaction

- Decision: Add app-level safeguards for controls-panel collapse around the Creative Apps Kit shell.
- Reason: The floating controls panel overlays the canvas. Trackpad or wheel input inside the open controls panel is ignored by the canvas, but immediately after collapsing the panel the same screen area becomes canvas; residual wheel events can then pan the canvas unexpectedly. Separately, when playback is active, collapsing the right panel competes with the dense DOM renderer on the main thread; the preview renderer now coalesces product-output updates during that collapse window so the panel can collapse without thousands of simultaneous Vestaboard mutations.
- Evidence: `src/app/panel-wheel-guard.tsx`, `src/app/vestaboard-renderer.tsx`, `src/routes/index.tsx`, and browser regressions `browser: collapsed controls panel does not pan canvas from residual wheel input` and `browser: controls panel collapse coalesces playback renderer`.

### Canvas Visual Fit

- Decision: Keep the current Vestaboard product output clear of the right controls panel with an app-level visual fit guard.
- Reason: At the minimum supported app width, the floating right controls panel can cover part of the canvas output while open. The guard applies a CSS-only `panel-safe` transform to the runtime canvas world when the open controls panel would overlap the board, holds that transform through the heavy controls-panel collapse window so the canvas does not jump during playback, then clears it after collapse. This preserves schema state, exports, timeline playback, and the copied Creative Apps Kit runtime.
- Evidence: `src/app/canvas-visual-fit-guard.tsx`, `src/styles.css`, `src/routes/index.tsx`, and browser regression `browser: open controls panel keeps vestaboard output clear at minimum app width`.

### Realistic Flip

- Decision: Add a `Flip mode` engine choice (`board.flip.mode`, default `random`) where Drum mode steps every animated cell forward-only through the fixed split-flap drum sequence `" ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!?$&@#%+-*/=:."`, with spin duration derived from drum distance at a mechanical flap rate.
- Reason: A real Vestaboard module can only rotate forward through its flap drum, so intermediate characters are drum neighbors and finish times are proportional to distance; Random mode preserves the previous deterministic flicker byte-for-byte so existing saved settings and coverage stay stable. In Drum mode `Letter speed` and `Field speed` map to flap rate (3–20 flaps/second), all modules launch near progress 0 with up to 120 ms seeded jitter, each module carries a seeded ±3% rate variance, and the per-module rate is floored so every spin finishes inside its stage window, keeping final frames exact. Phrase removal spins letters to the blank flap, background fill-in spins from blank, and `Duration spread` / `Field duration` disable in Drum mode because timing is physical. Flash palette colors become drum color chips gated per cell by `Flash frequency`, so color flashes are physically motivated flap passes rendered as full-tile fills. `Wear` gives a seeded share of drum spins one 100–350 ms sticky mid-spin pause. `Trail` ghosts the previous drum character behind actively flipping cells in DOM preview and Canvas export via the shared `getVestaboardTrailAlpha`. `Vibration` applies a deterministic sub-pixel board offset (max ~1.1 px) scaled by the flipping-module count, applied to the DOM foreground transform and the Canvas export offset, and settles to zero at rest. `Sound` plus `Volume` synthesize WebAudio flap clicks from per-frame character diffs (stereo pan by column, pitch jitter, compressor-limited) during playback, and video export mixes the same clicks into MediaRecorder through a `MediaStreamAudioDestinationNode` with audio-capable MIME candidates; with sound off the export pipeline and MIME selection are unchanged. `Uppercase` remaps Message and Target message before layout like the all-caps hardware. The board model accepts `durationSeconds` from the runtime timeline so drum timing works in wall-clock seconds while staying a pure function of progress for deterministic scrubbing and export parity.
- Evidence: `src/app/vestaboard-model.ts` drum engine, `src/app/vestaboard-audio.ts`, `src/app/vestaboard-renderer.tsx` trail/shake/sound integration, `src/routes/index.tsx` audio-in-video export, `docs/superpowers/specs/2026-07-29-vestaboard-realistic-flip-design.md`, acceptance and performance rows for `board.text.uppercase`, `board.flip.mode`, `board.flip.wear`, `board.flip.trailOpacity`, `board.flip.shake`, `board.sound.enabled`, and `board.sound.volume`, plus drum unit suites in `src/app/app-schema.test.ts`.

### Performance

- Decision: Classify the renderer as custom DOM `text-output` with animated playback coverage and video delivery coverage.
- Reason: Target tile dimensions, canvas size, source and target message text, phrase Final hold, Duration spread, Letter speed, outgoing phrase opacity range, animated phrase flash color count/frequency/palette cycling, background Start fill, End fill, Field duration, Field speed, playback time, main typography, background typography, character fill, cell radius, cell fill color, cell fill opacity range/seed, edge highlight range/seed/fill-canvas setting, cell border controls, and video quality can repaint, rebuild, animate, or export many full-canvas cells. Preview-time coalescing is part of the renderer workload policy for controls-panel collapse and canvas viewport drag; PNG and video exports still render exact timeline frames.
- Evidence: `src/app/app-performance.ts` scenarios and workloadTargets; e2e perf tests use `getCreativeAppsKitPerformanceStressValue`, `measureCreativeAppsKitAnimationFrames`, `dragCreativeAppsKitCanvasViewport`, and `expectCreativeAppsKitScenarioPerformanceBudget`.

### Random Field Generator

- Decision: Use an avalanche-mixed deterministic seed stream for random-field occupancy, duration, opacity, active glyphs, and trail glyphs while leaving the phrase/drum seeded stream unchanged.
- Reason: Sparse late random-field tails with high Start fill, zero End fill, and a long Field duration exposed regular column cadence from the older linear cell-index hash. Mixing only the field stream removes the synthetic vertical pattern without shifting the existing target phrase animation.
- Evidence: `src/app/vestaboard-model.ts`, regression `random field tail avoids linear column cadence`, and visual smoke with `/Users/kusnizza/Downloads/vestaboard-settings (2).json`.

### Starter Tooling

- Decision: Keep dev and browser-test port selection on explicit `127.0.0.1` localhost binding.
- Reason: The latest starter contract requires `pnpm dev` and Playwright webServer flows to prefer `3002` but move to the next free port without stopping other local servers. On macOS, checking an unspecified host can miss a process bound to `127.0.0.1`, so the helper now tests the same IPv4 localhost surface used by the running Vite apps.
- Evidence: `scripts/creative-apps-kit-port.mjs`, `scripts/creative-apps-kit-port.test.mjs`, and `package.json` test coverage.

## Evidence

- Source reviewed: `AGENTS.md`, local Creative Apps Kit docs, starter app files, runtime schema/types, export helper, controls panel, and performance validators.
- Contract applied: runtime shell via `defineCreativeAppsKit` and `CreativeAppsKitApp`; product output only in `canvasContent`; no manual runtime surfaces in routes; no edits to `src/creative-apps-kit`.
- Evidence: Specs saved at `docs/superpowers/specs/2026-06-16-vestaboard-design.md`, `docs/superpowers/specs/2026-06-17-vestaboard-bottom-highlight-design.md`, `docs/superpowers/specs/2026-06-17-vestaboard-left-highlight-design.md`, `docs/superpowers/specs/2026-06-17-vestaboard-edge-overlay-design.md`, `docs/superpowers/specs/2026-06-17-vestaboard-bottom-fill-canvas-design.md`, `docs/superpowers/specs/2026-06-17-vestaboard-split-typography-design.md`, `docs/superpowers/specs/2026-06-17-vestaboard-phrase-transform-animation-design.md`, `docs/superpowers/specs/2026-06-18-vestaboard-settings-transfer-design.md`, `docs/superpowers/specs/2026-06-18-vestaboard-remove-only-phrase-animation-design.md`, `docs/superpowers/specs/2026-06-18-vestaboard-parallel-row-cell-duration-design.md`, `docs/superpowers/specs/2026-06-18-vestaboard-letter-speed-duration-design.md`, `docs/superpowers/specs/2026-06-18-vestaboard-cell-based-line-transition-design.md`, `docs/superpowers/specs/2026-06-18-vestaboard-background-animation-design.md`, `docs/superpowers/specs/2026-06-18-vestaboard-main-text-flash-fill-design.md`, and `docs/superpowers/specs/2026-06-18-vestaboard-header-image-design.md`; plans saved at `docs/superpowers/plans/2026-06-16-vestaboard-implementation.md`, `docs/superpowers/plans/2026-06-17-vestaboard-bottom-highlight-implementation.md`, `docs/superpowers/plans/2026-06-17-vestaboard-bottom-highlight-glow-fix.md`, `docs/superpowers/plans/2026-06-17-vestaboard-left-highlight-implementation.md`, `docs/superpowers/plans/2026-06-17-vestaboard-edge-overlay-implementation.md`, `docs/superpowers/plans/2026-06-17-vestaboard-bottom-fill-canvas-implementation.md`, `docs/superpowers/plans/2026-06-17-vestaboard-split-typography-implementation.md`, `docs/superpowers/plans/2026-06-17-vestaboard-phrase-transform-animation-implementation.md`, `docs/superpowers/plans/2026-06-18-vestaboard-settings-transfer-implementation.md`, `docs/superpowers/plans/2026-06-18-vestaboard-remove-only-phrase-animation-implementation.md`, `docs/superpowers/plans/2026-06-18-vestaboard-parallel-row-cell-duration-implementation.md`, `docs/superpowers/plans/2026-06-18-vestaboard-letter-speed-duration-implementation.md`, `docs/superpowers/plans/2026-06-18-vestaboard-cell-based-line-transition-implementation.md`, `docs/superpowers/plans/2026-06-18-vestaboard-background-animation-implementation.md`, `docs/superpowers/plans/2026-06-18-vestaboard-main-text-flash-fill-implementation.md`, and `docs/superpowers/plans/2026-06-18-vestaboard-header-image-implementation.md`.
- Evidence: Sparse-tail generator spec and plan saved at `docs/superpowers/specs/2026-07-29-vestaboard-organic-random-tail-design.md` and `docs/superpowers/plans/2026-07-29-vestaboard-organic-random-tail.md`.
- Evidence: Default-settings spec and plan saved at `docs/superpowers/specs/2026-07-29-vestaboard-settings-as-defaults-design.md` and `docs/superpowers/plans/2026-07-29-vestaboard-settings-as-defaults.md`.

## Verification

- Verification tier: Tier 2. Reason: Changed schema control defaults, default canvas size, persistence version, and initial timeline startup state without changing renderer/model workload.
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts -t "exported settings file values|fresh sessions"` (2 default-setting regressions passed).
- Run: `./node_modules/.bin/tsc -p tsconfig.json --noEmit` (typecheck passed).
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-performance.test.ts src/app/app-acceptance.test.ts` (178 app contract tests passed after removing direct storage bootstrap and routing timeline defaults through command bus).
- Run: `pnpm verify:quick` (workflow skills, local docs, Creative Apps Kit integrity, and 180 Vitest tests passed).
- Run: browser smoke against `http://127.0.0.1:3006/` with clean localStorage (Canvas width `1920`, Canvas height `1080`, grid `42×15`, tile `39×66`, gap `6`, border opacity `8`, Start fill `100`, End fill `0`, Final hold `0.5`, timeline duration `3.5s`, Play button visible, Sound checked, and `0` WebAudio autoplay warnings).
- Verification tier: Tier 3. Reason: Changed deterministic animated random-field model output for sparse late-tail frames, affecting preview/export parity and renderer workload while keeping schema controls unchanged.
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts -t "random field tail avoids linear column cadence"` first reproduced the issue with cadence ratio `0.5675675675675675`, then passed after routing the field stream through the mixer.
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts -t "random field tail avoids linear column cadence|target message moves kept letters"` (random-tail regression and phrase-movement guard passed).
- Run: `./node_modules/.bin/tsc -p tsconfig.json --noEmit` (typecheck passed).
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-performance.test.ts src/app/app-acceptance.test.ts` (176 app contract tests passed).
- Run: `pnpm verify:quick` (workflow skills, local docs, Creative Apps Kit integrity, and 178 Vitest tests passed).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3038 pnpm exec playwright test e2e/app-controls.spec.ts --grep "final hold|field duration range drag" --workers=1` (Final hold acceptance/perf and Field duration range drag perf passed).
- Run: browser visual smoke against `http://127.0.0.1:3006/` with `/Users/kusnizza/Downloads/vestaboard-settings (2).json`, `Final hold=2s`, and scrubbed time `3.40/5s`; late-tail cadence ratio measured `0` across 42 columns with 103 visible tail cells. Screenshot: `/tmp/vestaboard-organic-random-tail.png`.
- Verification tier: Tier 3. Reason: Corrected Final hold semantics to extend total runtime duration instead of shortening the phrase transform, stabilized final phrase shake during background-only flips, and coalesced animated preview work during canvas viewport drag.
- Run: `./node_modules/.bin/tsc -p tsconfig.json --noEmit` (typecheck passed).
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-performance.test.ts src/app/app-acceptance.test.ts` (175 app contract tests passed).
- Run: `pnpm verify:quick` (workflow skills, local docs, Creative Apps Kit integrity, and 177 Vitest tests passed).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3035 pnpm exec playwright test e2e/app-controls.spec.ts --grep "final hold|phrase animation viewport drag|vibration shakes" --workers=1` (Final hold acceptance, Final hold perf, phrase viewport-drag perf, and Vibration acceptance passed).
- Attempted: first `pnpm verify:perf` before viewport coalescing and budget sync (failed on marginal duration budgets: tile Width/Height and phrase viewport drag).
- Run: `pnpm verify:perf` after coalescing and budget sync (performance matrix plus 52 browser perf checks passed).
- Verification tier: Tier 3. Reason: Added schema-backed Final hold timing and split live/export timeline progress so phrase animation can settle before the background field ends.
- Run: `./node_modules/.bin/tsc -p tsconfig.json --noEmit` (typecheck passed).
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts` (174 app contract tests passed).
- Attempted: `CREATIVE_APPS_KIT_TEST_PORT=3030 pnpm exec playwright test e2e/app-controls.spec.ts --grep "final hold|target message drives phrase transform animation" --workers=1` before fixture correction (Final hold acceptance failed because the test scrubbed after the default background field had already settled).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3030 pnpm exec playwright test e2e/app-controls.spec.ts --grep "final hold|target message drives phrase transform animation" --workers=1` after fixture correction (Target message, Final hold acceptance, and Final hold perf tests passed).
- Run: `pnpm verify:quick` (workflow skills, docs, integrity, and 176 Vitest tests passed).
- Run: browser visual smoke against `http://127.0.0.1:3005/` (`/tmp/vestaboard-final-hold-control.png`; Final hold visible, product output visible).
- Verification tier: Tier 2. Reason: Removed the Board Surface `Grid` and `Edge sides` settings from schema controls, model settings, renderer branches, acceptance rows, performance rows, and browser tests while preserving the remaining Board Surface behavior.
- Run: `./node_modules/.bin/tsc -p tsconfig.json --noEmit` (typecheck passed).
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts` (172 app contract tests passed).
- Run: `node scripts/check-creative-apps-kit-docs.mjs && node scripts/check-creative-apps-kit-integrity.mjs` (local docs and Creative Apps Kit integrity checks passed).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3030 pnpm exec playwright test e2e/app-controls.spec.ts --grep "Board Surface controls render as separate rows|tile width changes vestaboard cell geometry|tile height changes vestaboard cell geometry|bottom fill canvas changes highlighted border coverage" --workers=1` (4 focused browser tests passed).
- Run: `pnpm verify:quick` (workflow skills, docs, integrity, and 174 Vitest tests passed).
- Run: browser visual smoke against `http://127.0.0.1:3005/` (`/tmp/vestaboard-board-surface-removed-grid-edge.png`; exact `Grid` count 0, exact `Edge sides` count 0, product output visible, and left-edge highlight DOM absent).
- Verification tier: Tier 2. Reason: Changed schema-backed controls-panel presentation so Board Surface controls render as standalone rows while preserving targets, defaults, renderer output, exports, timeline, and runtime shell.
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts -t "does not place Board Surface controls in inline rows"` before the final fix (failed on the remaining Board Surface inline group: Cell fill/Cell border).
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts -t "does not place Board Surface controls in inline rows"` after the schema fix (passed).
- Run: `./node_modules/.bin/tsc -p tsconfig.json --noEmit` (typecheck passed).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3030 pnpm exec playwright test e2e/app-controls.spec.ts --grep "Board Surface controls render as separate rows" --workers=1` (focused browser layout regression passed, including Cell fill/Cell border).
- Run: `pnpm verify:quick` (workflow skills, local docs, Creative Apps Kit integrity, and 174 Vitest tests passed after syncing the acceptance control-order expectation with the new schema controls).
- Run: browser visual smoke against `http://127.0.0.1:3004/` (`/tmp/vestaboard-board-surface-single-column-controls.png`; Width/Height, Gap/Radius, Cell fill/Cell border, Cell opacity/Bottom opacity, and Cell seed/Bottom seed all measured with different top coordinates).
- Verification tier: Tier 4. Reason: Ran a rebuild-style refresh against the latest local Creative Apps Kit starter contract while preserving the current Vestaboard product behavior, adding app-level visual fit coverage for the current right-panel layout.
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3010 pnpm exec playwright test e2e/app-controls.spec.ts --grep "open controls panel keeps vestaboard output clear|collapsed controls panel|controls panel collapse|toolbar viewport" --workers=1` (4 focused visual, toolbar, residual wheel, and collapse playback regressions passed after the visual fit guard hold fix).
- Run: `pnpm verify:quick` (workflow skills, local docs, Creative Apps Kit integrity, and 163 Vitest tests passed).
- Attempted: `pnpm verify:final` (build and 108/110 browser tests passed; two browser perf interactions exceeded budget by 45ms and 21.1ms during the parallel acceptance run).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3020 pnpm exec playwright test e2e/app-controls.spec.ts --grep "start fill drag stays responsive|phrase animation viewport drag stays responsive" --workers=1` (the two marginal perf scenarios passed when isolated, confirming no stable regression from the visual fit guard).
- Run: `pnpm verify:final` rerun (workflow skills, docs, integrity, 163 Vitest tests, production build with the existing chunk-size warning, 110 browser acceptance/perf tests, 3 browser performance matrix checks, and 45 sequential browser perf tests passed).
- Run: browser visual smoke against `http://127.0.0.1:3005/` (desktop open, minimum-width open, and minimum-width collapsed screenshots saved under `/tmp/vestaboard-rebuild-visual-*.png`; deprecated header image count 0, Layers panel count 0, product-output UI count 0, and overlap area 0 in all checked layouts).
- Run: `pnpm dev -- --host 127.0.0.1` (server selected free port `3005` because `3002` was busy).
- Verification tier: Tier 4. Reason: Refreshed the Vestaboard app against the latest local Creative Apps Kit starter contract, including starter tooling, final browser gates, and browser performance coverage.
- Run: `pnpm ai:check` (required workflow skills installed).
- Run: `pnpm verify:quick` (local docs, Creative Apps Kit integrity, 163 Vitest tests passed, including the new localhost port-helper regression).
- Run: `./node_modules/.bin/vitest run scripts/creative-apps-kit-port.test.mjs` (2 port-helper tests passed).
- Attempted: `pnpm verify:final` before the port-helper fix (failed because Playwright selected `localhost:3002` while another project was bound to `127.0.0.1:3002`).
- Run: `pnpm verify:final` after the port-helper fix (build passed with the existing chunk-size warning; browser suite selected free ports, 109 browser tests passed, browser performance matrix passed, and 45 perf-only tests passed).
- Run: browser smoke against `http://127.0.0.1:3004/` (active Vite process cwd is the Vesta project; `vestaboard-output` and `Vestaboard Controls` are visible).
- Verification tier: Tier 3. Reason: Changed timeline-driven phrase flash model behavior so palette fills continue beyond the first half, then clear before the text animation completes, plus acceptance/performance wording and browser regression coverage.
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts -t "flash palette clears before text animation completes"` (new regression covers flash visibility at 68%, flash cleanup at 76%, and text still differing from the final frame at 76%).
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts -t "flash palette clears before text animation completes|flash|two active"` (9 flash model tests passed, including late target-layout flash coverage and pre-final flash cleanup).
- Run: `./node_modules/.bin/tsc -p tsconfig.json --noEmit` (phrase flash timing typecheck pass).
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts` (161 schema, acceptance, and performance contract tests passed).
- Run: direct Playwright browser regression against `http://127.0.0.1:3002/` (real controls enabled Flash colors and Flash frequency on the long target-layout fixture; scrubbed to 68% with 34 flash cells, then scrubbed to 76% and final frame with flash count 0; text signature still differed from final at 76%).
- Run: `node scripts/check-ai-skills.mjs && node scripts/check-creative-apps-kit-docs.mjs && node scripts/check-creative-apps-kit-integrity.mjs` (workflow skill, local docs, and Creative Apps Kit integrity checks passed).
- Run: `./node_modules/.bin/vite build` (production build passed; existing chunk-size warning only).
- Verification tier: Tier 3. Reason: Coalesced animated DOM preview work during controls-panel collapse without changing runtime schema, copied Creative Apps Kit runtime, or export renderers.
- Run: `./node_modules/.bin/tsc -p tsconfig.json --noEmit` (controls-panel collapse coalescing typecheck pass).
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts` (160 schema, acceptance, and performance contract tests passed).
- Run: direct Playwright browser regression against `http://127.0.0.1:3002/` with `/Users/kusnizza/Downloads/vestaboard-settings (3).json` (2904-cell playback fixture mutated output before collapse, produced 0 product-output mutations during the first 160ms after controls collapse pointerdown, resumed playback mutations after the coalescing window, and kept canvas world transform stable).
- Run: direct Playwright browser regression against `http://127.0.0.1:3002/` (wheel inside the open controls panel and residual wheel in the collapsed panel area kept canvas world transform stable).
- Run: `node scripts/check-ai-skills.mjs` (required workflow skills installed).
- Run: `node scripts/check-creative-apps-kit-docs.mjs` (local docs check passed).
- Run: `node scripts/check-creative-apps-kit-integrity.mjs` (Creative Apps Kit integrity check passed for 144 files).
- Run: `./node_modules/.bin/vite build` (production build passed; existing chunk-size warning only).
- Attempted: `CREATIVE_APPS_KIT_TEST_PORT=3210 ./node_modules/.bin/playwright test e2e/app-controls.spec.ts --grep "controls panel collapse|collapsed controls panel" --workers=1` (blocked before tests because the configured Playwright webServer invokes `pnpm exec vite dev`, and pnpm attempted a non-TTY modules purge).
- Verification tier: Tier 3. Reason: Removed a product renderer/export image layer and changed board canvas occupancy from header-offset to full-height output.
- Run: `./node_modules/.bin/tsc -p tsconfig.json --noEmit` (remove header PNG layer typecheck pass).
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts` (160 schema, acceptance, and performance contract tests passed).
- Run: direct Playwright browser QA against `http://127.0.0.1:3002/` (output and foreground visible, `vestaboard-header-image` absent, foreground top `0px`, foreground height `720px`, no console errors).
- Run: `node scripts/check-ai-skills.mjs` (required workflow skills installed).
- Run: `node scripts/check-creative-apps-kit-docs.mjs` (local docs check passed).
- Run: `node scripts/check-creative-apps-kit-integrity.mjs` (Creative Apps Kit integrity check passed for 144 files).
- Run: `./node_modules/.bin/vite build` (production build passed; existing chunk-size warning only).
- Run: direct Playwright PNG export smoke against `http://127.0.0.1:3002/` (downloaded `vestaboard.png`, 179056 bytes, no console errors).
- Verification tier: Tier 4. Reason: Investigated controls-panel collapse as a runtime interaction issue, then applied an app-level guard without modifying the copied Creative Apps Kit runtime.
- Run: `./node_modules/.bin/tsc -p tsconfig.json --noEmit` (residual panel wheel guard typecheck pass).
- Run: `./node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts` (160 schema, acceptance, and performance contract tests passed).
- Run: `node scripts/check-creative-apps-kit-integrity.mjs` (Creative Apps Kit integrity check passed for 144 files).
- Run: `node scripts/check-creative-apps-kit-docs.mjs` (local docs check passed).
- Run: direct Playwright browser regression against `http://127.0.0.1:3002/` with `/Users/kusnizza/Downloads/vestaboard-settings (3).json` (wheel inside open controls panel and five residual wheel events in the former collapsed panel area left the canvas world transform unchanged, no console errors).
- Run: `./node_modules/.bin/vite build` (production build passed; existing chunk-size warning only).
- Run: `pnpm ai:check`.
- Run: `pnpm verify:quick`.
- Run: `pnpm build`.
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|timeline playback|video format|video quality|export actions" --workers=1`.
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm exec playwright test e2e/app-controls.spec.ts --grep "phrase animation" --workers=1`.
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3141 pnpm test:browser:perf` (35 browser perf/matrix checks passed).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3142 pnpm test:browser` (79 browser acceptance and perf checks passed).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3143 pnpm verify:final` (blocked by a Playwright webServer startup race: first test hit `ERR_CONNECTION_REFUSED` on auto-selected port 3144; the other 78 browser tests in that phase passed).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3145 pnpm exec playwright test e2e/app-controls.spec.ts --grep "browser: canvas width changes vestaboard output bounds" --workers=1` (rerun of the startup-refused test passed).
- Run: `pnpm verify:quick` (settings transfer pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3146 pnpm exec playwright test e2e/app-controls.spec.ts --grep "settings transfer" --workers=1` (settings import/export and settings export perf checks passed).
- Run: `pnpm build` (settings transfer pass).
- Run: `pnpm verify:quick` (remove-only phrase animation pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3147 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|phrase animation" --workers=1` (remove-only phrase animation and related perf checks passed).
- Run: `pnpm build` (remove-only phrase animation pass).
- Run: `pnpm verify:quick` (source-anchored remove-only phrase animation pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3148 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|phrase animation" --workers=1` (source-anchored remove-only phrase animation and related perf checks passed).
- Run: `pnpm build` (source-anchored remove-only phrase animation pass).
- Run: `pnpm verify:quick` (sequential shrink phrase animation pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3149 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|phrase animation" --workers=1` (sequential shrink phrase animation and related perf checks passed).
- Run: `pnpm build` (sequential shrink phrase animation pass).
- Run: `pnpm verify:quick` (parallel row phrase animation and cell duration range pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3150 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|cell duration|phrase animation" --workers=1` (parallel row phrase animation, cell duration range, and related perf checks passed).
- Run: `pnpm build` (parallel row phrase animation and cell duration range pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3151 pnpm verify:perf` (performance matrix plus 34 browser perf checks passed, including Cell duration drag).
- Run: `pnpm exec vitest run src/app/app-schema.test.ts -t "target message final frame can use characters from wrapped source rows"` (regression reproduced, then passed after global final-frame fix).
- Run: `pnpm verify:quick` (wrapped source final-frame fix).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3152 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|cell duration|phrase animation" --workers=1` (wrapped source final phrase, cell duration range, and phrase animation checks passed).
- Run: `pnpm build` (wrapped source final-frame fix).
- Run: `pnpm exec vitest run src/app/app-schema.test.ts -t "target message final frame preserves target line integrity"` (target-line integrity regression reproduced, then passed after treating target newlines as layout boundaries).
- Run: `pnpm verify:quick` (target-line integrity fix).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3153 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|cell duration|phrase animation" --workers=1` (user-provided LLM context example, cell duration range, and phrase animation checks passed).
- Run: `pnpm build` (target-line integrity fix).
- Run: `pnpm exec vitest run src/app/app-schema.test.ts -t "target message animates|target message final frame preserves|target message animation removes|target message animation narrows|target message animation never"` (general target-line matching and whitespace behavior).
- Run: `pnpm verify:quick` (global keep-plan and target layout boundary fix).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3154 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|cell duration|phrase animation" --workers=1` (general target-line matching through browser UI plus affected perf checks).
- Run: `pnpm build` (global keep-plan and target layout boundary fix).
- Run: `pnpm verify:quick` (staged keep-plan phrase shrink, target layout movement, and outgoing opacity range pass).
- Run: `pnpm build` (staged keep-plan phrase shrink and outgoing opacity range pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3158 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|cell duration|outgoing opacity|phrase animation" --workers=1` (8 browser acceptance and affected perf checks passed).
- Run: `pnpm verify:quick` (letter speed plus duration spread pass).
- Run: `pnpm exec vitest run src/app/app-schema.test.ts -t "duration spread and letter speed"` (derived simultaneous outgoing letter count passed).
- Run: `pnpm build` (letter speed plus duration spread pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3159 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|letter duration|duration spread|letter speed|outgoing opacity|phrase animation" --workers=1` (10 browser acceptance and affected perf checks passed).
- Run: `pnpm exec vitest run src/app/app-schema.test.ts -t "moves kept letters toward target rows"` (regression reproduced the gather-then-move pause, then passed after overlapping layout movement with removal).
- Run: `pnpm verify:quick` (continuous target-row movement pass).
- Run: `pnpm build` (continuous target-row movement pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3160 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|duration spread|letter speed|outgoing opacity|phrase animation" --workers=1` (10 browser acceptance and affected perf checks passed).
- Run: `pnpm exec vitest run src/app/app-schema.test.ts -t "discrete cells|final frame preserves|near-final|duration spread and letter speed|outgoing opacity"` (cell-bound movement plus flicker regression checks passed).
- Run: `pnpm verify:quick` (cell-bound transition pass).
- Run: `pnpm build` (cell-bound transition pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3161 pnpm exec playwright test e2e/app-controls.spec.ts --grep "target message|duration spread|letter speed|outgoing opacity|phrase animation" --workers=1` (10 browser acceptance and affected perf checks passed).
- Run: `pnpm exec tsc -p tsconfig.json --noEmit` (background field animation pass).
- Run: `pnpm exec vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts` (background Start fill, End fill, Field duration, and legacy `field.fill` compatibility passed).
- Run: `pnpm verify:quick` (background field animation pass).
- Run: `pnpm build` (background field animation pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3162 pnpm exec playwright test e2e/app-controls.spec.ts --grep "start fill|end fill|field duration|background font|opacity range|seed slider" --workers=1` (17 browser acceptance and affected perf checks passed).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3163 pnpm verify:perf` (performance matrix plus 38 browser perf checks passed, including Start fill, End fill, and Field duration drag).
- Run: `pnpm exec vitest run src/app/app-schema.test.ts -t "background field animation starts immediately|field duration range|start and end fill|legacy field fill"` (background immediate-start regression reproduced, then passed after removing delayed per-cell start).
- Run: `pnpm exec tsc -p tsconfig.json --noEmit` (Field speed pass).
- Run: `pnpm exec vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts` (Field speed, Field duration range, and immediate-start coverage passed).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3169 pnpm exec playwright test e2e/app-controls.spec.ts --grep "start fill|end fill|field duration|field speed" --workers=1` (8 browser acceptance and affected perf checks passed).
- Run: `pnpm verify:quick` (Field speed and immediate-start pass).
- Run: `pnpm build` (Field speed and immediate-start pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3171 pnpm verify:perf` (performance matrix plus 39 browser perf checks passed, including Field speed drag).
- Run: `pnpm exec tsc -p tsconfig.json --noEmit` (main text flash fill typecheck pass).
- Run: `pnpm exec vitest run src/app/app-schema.test.ts --testNamePattern "flash|two active"` (disappearing-letter flash fill, frequency, palette slot, and two-color lifetime-cycle checks passed).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3176 pnpm exec playwright test e2e/app-controls.spec.ts --grep "flash color|flash frequency|flash palette" --workers=1` (13 browser acceptance/perf flash checks passed, including two selected colors during one disappearing letter lifetime).
- Run: `pnpm verify:quick` (main text flash fill pass).
- Run: `pnpm build` (main text flash fill pass; Vite emitted the existing chunk-size warning only).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3177 pnpm verify:perf` (performance matrix plus 45 browser perf checks passed, including flash count, frequency, palette slots, phrase animation frames, and viewport stress).
- Run: `pnpm exec tsc -p tsconfig.json --noEmit` (header image layer typecheck pass).
- Run: `pnpm exec vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts` (header image acceptance name and renderer layer metadata pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3178 pnpm exec playwright test e2e/app-controls.spec.ts --grep "header image|renderer exposes" --workers=1` (header image is visible, top-aligned, centered, and 1920px wide).
- Run: `pnpm verify:quick` (header image pass).
- Run: `pnpm build` (header image pass; the Vesta header asset was bundled; Vite emitted the existing chunk-size warning only).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3179 pnpm verify:perf` (performance matrix plus 45 browser perf checks passed, including layer selector, preview render, export actions, animation frames, and viewport stress).
- Run: `pnpm exec tsc -p tsconfig.json --noEmit` (updated header image and shifted board area typecheck pass).
- Run: `pnpm exec vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts` (updated header acceptance and renderer metadata pass).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3180 pnpm exec playwright test e2e/app-controls.spec.ts --grep "header image|renderer exposes" --workers=1` (header image renders at canvas top and foreground grid starts at y=52 with remaining logical canvas height).
- Run: `pnpm verify:quick` (updated header image and shifted board area pass).
- Run: `pnpm build` (updated header image pass; the Vesta header asset was bundled; Vite emitted the existing chunk-size warning only).
- Run: `CREATIVE_APPS_KIT_TEST_PORT=3181 pnpm verify:perf` (performance matrix plus 45 browser perf checks passed, including layer selector, preview render, export actions, animation frames, and viewport stress after the board-area shift).
- Run: `pnpm dev`; local server is available at `http://localhost:3002/`.
- Run (realistic flip pass, cloud sandbox): isolated `tsc --strict` typechecks of `src/app/vestaboard-model.ts` and `src/app/vestaboard-audio.ts` passed with TypeScript 6.0.3.
- Run (realistic flip pass, cloud sandbox): a 35-check functional harness over the drum engine passed, including byte-identical Random-mode output against the pre-change model across configs and progresses, forward-only drum adjacency, exact final frames, removal-stage completion, distance-ordered finishes, wear divergence with exact finals, chip gating, drum/random field end-state parity, trail presence/rest, shake determinism/bounds/rest, 22×6 preset geometry, uppercase mapping, and sound setting resolution.
- Pending (development machine, network required): `pnpm verify:quick`, `pnpm build`, focused Playwright on the new control names, and `pnpm verify:perf` — the realistic-flip pass was authored in a sandbox without registry access, so the browser gates must run locally before this pass is considered delivered.

### 2026-07-29 — Default playback

- Verification tier: Tier 2 — schema/product behavior.
- Reason: The Vesta-specific timeline default changes from paused to playing; renderer workload, canvas behavior, exports, and runtime architecture are unchanged.
- Run: focused schema regression test, `pnpm verify:quick`, production build with the deployed base path, and a browser check that a fresh session opens with the Pause transport visible and the timeline advancing.
- Skip: performance verification because the existing animation loop and workload are unchanged.
- Result: `pnpm vitest run src/app/app-schema.test.ts` failed with `expected false to be true`, then passed all 77 tests after changing the Vesta timeline default.
- Result: `pnpm verify:quick` passed Creative Apps Kit docs and integrity checks plus all 180 tests.
- Result: `pnpm build --base /demos/vesta-split-flap/` passed; Vite emitted only the existing chunk-size warning.
- Result: local browser verification at `http://localhost:3004/` found one `Pause playback` button, observed the playback position advance from `0.25` to `0.85` in 250 ms, and found no console errors.
- Result: the persisted-pause browser regression first reproduced a paused second page, then passed after the existing Vesta timeline initializer resumed playback once on load.
- Result: the final Tier 2 gate passed all 180 quick tests, both focused browser playback tests, and the production build.

## Risks

- Risk: Browser and Canvas 2D text metrics can differ slightly for some font picker choices, so PNG text may not be pixel-identical to DOM preview.
- Risk: Browser MediaRecorder duration metadata can have small container-level timing variance; browser coverage compares exported metadata against edited timeline duration with tolerance while still requiring finite duration and retina dimensions.
- Risk: Font picker browser selectors depend on the current Creative Apps Kit compound control DOM and may need adjustment if the runtime changes.
- Risk: Browser autoplay policy keeps the WebAudio context suspended until a user gesture; the renderer resumes on pointerdown while Sound is on, but programmatic playback started without any gesture stays silent by design.
- Risk: MP4 audio recording (`mp4a.40.2`) support varies by browser; the MIME candidate list falls back to WebM/Opus or silent containers, so exported extension can differ from the requested format when sound is on.
- Risk: Sound synthesis is intentionally non-deterministic (pitch/timing jitter), so exported audio differs between runs while video frames stay deterministic.


## 2026-08-05 — Canonical product identity and deployment path

- User-visible result: Renamed the standalone product to `Vesta Split-Flap` and aligned its repository package plus public demo base to `vesta-split-flap`. Product rendering, controls, defaults, and export behavior remain unchanged.
- Request: Apply the approved complete rename across code, folders, gallery identity, and deployment wiring without preserving old route aliases.
- Source/reference checked: The approved complete-app-renaming design and implementation plan, the current standalone package metadata, Vite/router base handling, `vercel.json`, identity metadata, and active acceptance/deployment assertions.
- Contract rules applied: Broad identity/deployment migration because the directory and public deployment identity change across the generated app boundary. Existing product-domain modules remain semantically named; the external Vercel stage must retain the current Project ID.
- State/output mapping: Package name, HTML title, control/acceptance identity, persistence/settings-transfer namespace where present, Vite base, public asset prefix, and Vercel rewrites now use `vesta-split-flap`. Changed persistence namespaces intentionally reset prior browser-local settings.
- Verification: Canonical package/title/base audit and every available standalone `demo-deployment.test.mjs` passed for this migration batch.
- Risks: Old demo paths are intentionally absent; no compatibility redirect is retained.

## Decision Trail

### Template release repair — 2026-09-09

- Change ID: template-release-2026-09-09
- Entry type: focused
- Request: Make every gallery app cloneable through the published Toolcraft CLI and verify installation/startup.
- Changed owner: Upstream example snapshot packaging, integrity restoration, and public distribution metadata.
- User-visible result: The `vesta-split-flap` template is admitted as a complete standalone snapshot; original framework hashes remain authoritative. Canonical identity regeneration, where needed, uses the upstream identity generator.
- Verification: Source template admission passed. Published dependency installation and browser startup results are recorded in the upstream `docs/template-release-report.md`; these smoke checks do not claim renderer or export certification.

## 2026-09-10 — Bounded legacy launcher environment check

- Request: Finish known gallery launcher checks without editing shared/protected scripts, config, runtime, dependencies or acceptance records.
- Task type: Environment diagnosis and exact existing feature verification; no product implementation change.
- User-visible result: The existing `board.tile.gap` scenario passes on a free legacy-compatible test port; its real slider changes visible cell spacing.
- Source/reference checked: Original failed and successful audit logs in `gallery-all-cli-check-jQeXGb`; local `playwright.config.ts`, `creative-apps-kit-port.mjs`, gallery feature/process runner, acceptance row and tile-gap browser assertions.
- Reference inputs: Existing local app/audit only.
- Docs/contracts read: Root/local AGENTS.md, gallery-workflow.md and legacy acceptance-testing.md; systematic-debugging skill.
- Contract rules applied: Keep pinned launcher/runtime intact; verify exact functional scenario only; never attach to an unrelated listener or treat owner acceptance as current test evidence.
- Decision: The protected gallery runner exports `TOOLCRAFT_TEST_PORT`, but the legacy config reads `CREATIVE_APPS_KIT_TEST_PORT`. Its IPv4-only free-port probe can miss a localhost/IPv6 listener such as the original Docker collision at 3003. Read-only socket checks verified port 53202 was free on both 127.0.0.1 and ::1; provide both existing environment variable names with that same value for this run. `pnpm` is installed on this host, as required by the unchanged legacy web-server command.
- Alternatives rejected: Edit/re-sign the protected compatibility runner or Playwright config; enable `reuseExistingServer`; kill Docker or unrelated servers; bypass the selected feature route.
- State/output mapping: The unchanged browser scenario drags the real Gap slider and compares actual neighboring cell bounds/spacing.
- Files changed: This worklog only.
- Verification: `CREATIVE_APPS_KIT_TEST_PORT=53202 TOOLCRAFT_TEST_PORT=53202 TOOLCRAFT_TEST_DEPENDENCY_ROOT=/Users/kusnizza/Projects/toolcraft-website/primeui-v2/examples/vesta-split-flap/node_modules npm run test:feature -- board.tile.gap` passed: one selected scenario, 4.8s test / 6.6s total. Test-owned server processes exited normally. No new unit code was changed.
- Skipped checks: No global test/typecheck, build, delivery, performance, dependency installation or other browser scenarios.
- Risks: Permanent default-port/host compatibility and the inherited `pnpm` launcher dependency remain in excluded protected source owners. This environment-only pass does not claim those defaults are repaired. Reusing external node_modules produced an Inter font request outside Vite's serving allow-list; the selected spacing assertions passed, but typography/startup-with-zero-resource-errors was not certified.
- Risks: Historical templates retain their original runtime and workflow versions.

## 2026-09-10 — Authorized focused-launcher compatibility repair

- Request: User approved the narrow shared gallery-workflow fix plus regeneration into Vesta and requested an independent functionality agent for all repaired applications.
- Task type: Later-edit launcher compatibility, not new product delivery. No product renderer, defaults, UI, assets, dependencies or legacy framework configuration changed.
- Source/reference checked: `gallery-installers/workflow/feature.mjs` and `process.mjs`, Vesta's legacy Playwright port reader, signed gallery release and exact native Gap scenario. Reference inputs are existing local code and reproduced launch logs; no new visual/motion reference.
- Contracts applied: Root/local AGENTS.md and accepted-gallery workflow; systematic-debugging, bounded source-owner regeneration, proportional focused verification and independent review. The previous worklog's excluded shared-owner blocker is superseded only by this explicit narrow authorization.
- Decision/state mapping: Resolve one free port in the existing focused runner, pass it through `browserEnvironment`, and mirror it to the legacy port variable. Both Playwright's URL and Vite's command now use the same selected port. Legacy-only environment callers and performance-variable filtering remain unchanged.
- Alternatives rejected: Hand-edit the pinned Playwright config, introduce a second resolver, reuse or kill unrelated servers, require permanent manual port overrides, or update unrelated applications/framework copies.
- Files changed: Two shared source-owner files and two targeted regression cases; bounded `scripts/gallery-migration/vesta-launcher-patch.mjs`; Vesta's two regenerated workflow files and only their two hashes plus signature in `toolcraft-release.json`; this worklog and upstream planning/progress documentation. Original acceptance/provenance, baseline, package scripts and legacy framework manifest are preserved.
- Verification: The alias regression first failed (`3003` instead of selected `42817`). After the fix, four exact environment/port/portable-acceptance unit cases passed in 128ms. Source/copy/regeneration specification and quality review approved with no findings. Repeating the bounded regeneration emitter is a no-op.
- Verification: `env -u TOOLCRAFT_TEST_PORT -u CREATIVE_APPS_KIT_TEST_PORT TOOLCRAFT_TEST_DEPENDENCY_ROOT=/Users/kusnizza/Projects/toolcraft-website/primeui-v2/examples/vesta-split-flap/node_modules DEBUG=pw:webserver npm run test:feature -- board.tile.gap` passed: native Gap slider/neighboring-cell bounds, 4.8s test / 6.3s total, automatically selected port 56554 used by both Vite and Playwright. A separate agent independently repeated it: 4.8s / 6.2s total on automatically selected port 56588. Both test-owned servers exited normally.
- Verification: Read-only validation passed all 24 existing signed gallery records; the other 23 record files remain byte-identical to HEAD. Vesta's original acceptance/evidence is unchanged; no new delivery/performance receipt was fabricated or generated.
- Limits: The inherited test starts a fresh browser context and clears localStorage before first navigation; this confirms clean-session Gap behavior, not persistence/reload. Reused external node_modules still produces the existing Inter-font Vite allow-list warning, so zero-resource-error typography is not certified. Historical runtime versions and the existing `pnpm` launcher dependency remain pinned.
- Skipped: Full delivery, build, global tests/typecheck, measured performance, dependency installation, CLI release, commit, push and deployment. See upstream `examples/gallery-independent-functionality-check.md` for the separate nine-app report.

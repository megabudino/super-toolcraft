# Vestaboard Phrase Transform Animation Design

## Goal

Add a second textarea that defines the target phrase and animate the main Vestaboard phrase from the current `Message` text into that target by removing extra characters and flipping the remaining characters like a Vestaboard.

## Animation Intent Inventory

- Mode: `timeline-playback`.
- Owner: Creative Apps Kit top timeline.
- Reason: The user wants a configurable animation duration, pause/resume, scrubbing, and deterministic frames. Runtime `state.timeline.currentTimeSeconds / state.timeline.durationSeconds` is the source of truth.
- Export: animated products expose `Export Video` and `Export PNG`; PNG exports the currently rendered timeline frame.

## Control Section Inventory

- `Board Message`: source phrase, target phrase, main typography, and text color. These controls describe the authored phrase workflow.
- `Random Field`: filler density, background typography, opacity, and seed. These controls remain independent from phrase animation.
- `Video Export`: video format and quality. This section is separate because video settings are delivery settings, not board styling.
- `Background`: product background and PNG background inclusion.
- `Export`: sticky product delivery actions: primary `Export Video`, secondary `Export PNG`.

## Product Behavior

- Add `Target message` as a second multiline textarea with target `board.text.targetMessage`.
- `Message` remains the source/permanent phrase textarea.
- During playback, the visible phrase is computed from source to target based on timeline progress.
- At timeline progress `0`, the source phrase is shown.
- At timeline progress `1`, the target phrase is shown after normalizing spaces so no line contains more than one consecutive space between words.
- Between start and finish, extra source characters are removed over time and the remaining phrase characters flip through deterministic filler glyphs before settling to target characters.
- If the target is not a strict subsequence of the source, the final frame still shows the normalized target; unmatched target characters appear near the end of the animation.
- Random field filler cells stay independent and continue using `field.fill`, `field.seed`, and `field.typography`.

## Renderer And Export

- DOM preview reads runtime timeline state directly through `useCreativeAppsKit`.
- The board model accepts an animation progress value and builds phrase cells from the animated frame text.
- Canvas 2D PNG export draws the current frame from `state.timeline.currentTimeSeconds`.
- Video export renders frames from `0..durationSeconds` into a retina canvas, records via `MediaRecorder`, chooses a supported MIME/container through `MediaRecorder.isTypeSupported`, and keeps the product background.

## Acceptance

- Unit tests cover target normalization and deterministic phrase frame generation.
- Browser tests cover source textarea, target textarea, timeline scrubbed start/end frames, and space normalization.
- Runtime acceptance covers playback timeline pause/resume, scrub, duration edit, loop, and rendered-frame behavior.
- Export acceptance covers PNG current-frame output and video metadata duration matching the runtime timeline duration.

## Verification

- `pnpm verify:quick`
- Focused Playwright tests for phrase transform, timeline playback, and video export.
- `pnpm build`
- `CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm test:browser:perf`

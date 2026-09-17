# Plate separation animation

Verification tier: Tier 2
Reason: Timeline playback changes schema, persisted defaults, the WebGL preview invalidation path, current-frame image export, acceptance metadata, and playback render-scale coverage.
Run: Focused animation unit tests; structural renderer/product contract tests; `npm run test:feature -- renderer.timeline`; embedded browser checks for start/end frames, duration editing, loop, scrub, pause/resume, current-frame PNG, and playback backing pixels.
Skip: Unrelated control cases, the aggregate delivery gate, video export, layers, keyframes, and measured performance because this is a later functional edit with no new workload boundary.

## Implementation

1. Add Toolcraft playback Timeline to `src/app/app-schema.ts` with a short product-derived default duration. Keep play/pause, scrub, duration (speed), and loop in the runtime-owned timeline surface; add no duplicate transport controls to the product panel.
2. Add a pure `src/app/iceberg-animation.ts` mapping from timeline time to a fast ease-out separation progress. It renders `plateGap = 0` at the start and the existing `Plate gap` value at the end, so that slider remains the final-state distance.
3. Apply the evaluated frame settings in `src/app/IcebergCanvas.tsx` and `src/app/app-composition.tsx`. Coalesce playback while viewport/orbit interaction is active and resume at current runtime time. Image export renders the current timeline frame through the existing WebGL export path.
4. Declare `timeline.time` preview invalidation and playback/scrub paths in `src/app/iceberg-pipeline.ts`; update `src/app/app-performance.ts` for playback backing coverage without adding a workload dimension.
5. Update `src/app/app-defaults.json`, `src/app/app-acceptance-data.ts`, `src/app/iceberg-inventory.ts`, and `docs/toolcraft/agent-worklog.md` for timeline intent, persistence, controls, settings transfer, image export, and focused proof.
6. Add product-owned unit and Playwright coverage for closed/open rendered frames and the runtime timeline controls, then run the focused checks named above.

# Saturated Shuffle Backgrounds Plan

Verification tier: Tier 2
Reason: This pass changes the product behavior of the existing Shuffle all action and its generated color values, but does not change schema targets, renderer structure, workload, export dimensions, controls, timeline, layers, or media.
Run: `npm run ai:check`; focused palette and composition-shuffle unit tests across a broad deterministic seed range; `npm run verify:quick`; repeated real-browser Shuffle all acceptance with measured HSL saturation and existing text/line contrast thresholds; `npm run verify:final`; deploy and verify the production URL.
Skip: Full performance and targeted workload suites are not required because color arithmetic does not change primitive count, animation duration, renderer invalidation, viewport behavior, or export cost. Timeline, layers, media, and control layout are untouched.

1. Update `specs/editorial-pattern-spec.md` so Preserve colors off generates only bold chromatic backgrounds: at least 90% HSL saturation, no neutral/near-white results, and nearest deep-or-bright adjustment for 7:1 text polarity.
2. Update `src/app/palette-harmonies.ts` with a deterministic vivid-background generator that begins near the depth range of `#000ECC`, evaluates black and white contrast directions, and moves the minimum necessary lightness distance while preserving saturation.
3. Strengthen `src/app/palette-harmonies.test.ts` and `src/app/composition-shuffle.test.ts` to prove deterministic variety, high background saturation, both black-ink and white-ink polarities, 7:1 text contrast, 3:1 rule/line contrast, and distinct line colors across broad seed and sequential-shuffle samples.
4. Strengthen the existing Shuffle all browser acceptance in `e2e/app-controls.spec.ts` to repeat the real action and assert every settled background is strongly saturated and non-neutral while retaining the existing morph and contrast checks.
5. Update `docs/toolcraft/agent-worklog.md`, run the gates, inspect a contact sheet of repeated shuffled compositions, then deploy and verify production.

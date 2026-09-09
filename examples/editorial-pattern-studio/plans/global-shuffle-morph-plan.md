# Global Shuffle and Pattern Morph — Implementation Plan

Verification tier: Tier 4

Reason: The change coordinates multiple persisted schema targets through a new product action and introduces a transient animation pipeline inside the custom SVG renderer. Contrast, history/reset, exports, viewport stability, and performance all cross file boundaries.

## Files and behavior

1. Extend `src/app/palette-harmonies.ts` with exported WCAG contrast utilities and a seeded whole-poster palette generator. Preserve the local three-color harmony API. Add `src/app/palette-harmonies.test.ts` coverage across many seeds for determinism, valid/distinct hex colors, text contrast `>= 7`, and line/rule contrast `>= 3`.
2. Add `src/app/composition-shuffle.ts` as a pure seeded state-to-target generator. It chooses a different template/equation, five in-range equation parameters, authored copy mode, included background, and the accessible palette. Add unit tests for deterministic advancement, same-option avoidance, range constraints, and required targets.
3. Add `src/app/pattern-morphing.ts` for closed-loop resampling, bounded winding/phase alignment, interpolation, easing, and the interruptible reduced-motion-aware React hook. Cap transient geometry at 1,200 points after browser profiling while keeping full-detail final output. Add pure unit tests for endpoint fidelity, closed-loop alignment, reversal, cyclic shifts, and interpolation.
4. Add an `Explore` section at the top of `src/app/app-schema.ts` with a built-in `actions` control targeting `composition.shuffle`; retain the local Line Palette shuffle and sticky Export PNG action. Persistence remains localStorage; bump its key/version because the product state contract changes.
5. Update `src/app/editorial-pattern-renderer.tsx` to route Shuffle all through runtime `controls.setValue` commands; transition equation geometry, template-owned position/radius, direct position, scale, stroke, normalized segmentation values, palette, background, and inks on one progress clock; keep segmentation seeds and path keys stable; expose morph observables; honor reduced motion; and keep Canvas export on the full-detail final state.
6. Update `src/app/app-acceptance.ts`, schema/acceptance tests, `src/app/app-performance.ts`, and browser tests so every new action and animated observable is proven. Declare morph alignment/interpolation passes, animation-frame workload, and animation-viewport-drag stability; keep timeline/layers/media absent.
7. Update `docs/toolcraft/agent-worklog.md` with the user-visible result, source references, contract decisions, rejected alternatives, state/output mapping, verification evidence, and remaining risks.

## Verification

- Run `npm run ai:check` before implementation.
- Run focused Vitest files while implementing palette, shuffle, morph, schema, acceptance, and performance inventories.
- Run `npm run verify:quick` after integration.
- In the real app, trigger Shuffle all repeatedly and verify different template/equation/parameters, authored text, light/dark palettes, computed contrast thresholds, history/reset, persistence, and export.
- In the real app, verify intermediate path geometry, mid-morph interruption, final target settlement, reduced-motion bypass, and stable colored segment identities.
- Run targeted animation-frame and animation-viewport-drag performance checks at heavy Detail/minimum Segment size; the full performance checkpoint remains unnecessary for this post-first-working non-performance request.
- Run `npm run verify:final`, restart/verify the app server, deploy production to Vercel, and validate the public alias with no console errors.

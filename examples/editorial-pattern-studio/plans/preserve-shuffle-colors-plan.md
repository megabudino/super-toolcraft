# Preserve Shuffle Colors — Implementation Plan

Verification tier: Tier 2

Reason: This adds one persisted schema switch and conditionally changes the runtime targets emitted by an existing action. Renderer geometry, export code, timeline, layers, media, and workload limits remain unchanged.

## Files and behavior

1. Add `composition.preserveColors` as a built-in switch in the existing Explore section of `src/app/app-schema.ts`, defaulting to false with a concise description. Keep the existing localStorage persistence key/version so current user settings are not discarded; missing values resolve through the schema default.
2. Extend `src/app/composition-shuffle.ts` with a `preserveColors` option. The default branch remains unchanged. The preserve branch emits template, authored-copy mode, equation, and five equation variables only; it must omit background inclusion, background, three editorial inks, and three line colors.
3. Read the switch in `src/app/editorial-pattern-renderer.tsx` and pass it to the pure shuffle generator. No renderer, transition, or export algorithm changes are required.
4. Update schema/unit tests, `src/app/app-acceptance.ts`, `starterControlSectionInventory`, control-order expectations, `src/app/app-performance.ts`, and browser acceptance. Browser proof edits user colors and Background Include, enables Preserve colors, clicks Shuffle all, then proves all preserved targets remain exact while template/equation/output change.
5. Record the decision and verification in `docs/toolcraft/agent-worklog.md`.

## Verification

- Run `npm run ai:check` before implementation.
- Run focused shuffle, schema, acceptance, and performance unit tests.
- Run `npm run verify:quick` and the focused real-browser preserve-colors scenario.
- Run `npm run verify:final` before updating the production deployment, then validate the public alias and error logs.
- Skip the full performance checkpoint because this post-first-working switch does not change renderer workload; the existing global action responsiveness scenario covers the action path.

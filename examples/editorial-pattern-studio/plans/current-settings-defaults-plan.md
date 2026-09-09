# Current Settings Defaults — Implementation Plan

Verification tier: Tier 3

Reason: The supplied settings snapshot changes schema defaults and the initial editable canvas size from 480×600 to 1440×1080. Renderer algorithms, control ranges, persistence structure, timeline/layers policy, and export implementation remain unchanged.

## Files and behavior

1. Update `src/app/editorial-pattern-defaults.ts` from `/Users/kusnizza/Downloads/editorial-pattern-studio-settings.json`: use the 1440×1080 canvas, Negative Space template, Harmonic Halo equation, supplied equation/position/segmentation values, line palette, white editorial inks, included green background, Preserve colors on, and PNG/4K export. Normalize vector strings to numbers and the background `{ hex }` object to the built-in color string shape.
2. Keep `src/app/app-schema.ts` and the renderer wired to the shared defaults module. Preserve localStorage key/version `toolcraft:editorial-pattern-studio:state:v3`, so clean launches and Reset use the new defaults while existing persisted work still wins.
3. Update exact schema expectations, clean-launch browser assertions, reset palette expectations, acceptance/performance fixture copy, and the product spec. Do not change the control-section inventory, settings-transfer ownership, timeline, layers, media, renderer pipeline, or export paths.
4. Add a new decision-trail entry to `docs/toolcraft/agent-worklog.md` naming the supplied JSON, normalization decisions, state/output mapping, verification, and the intentionally skipped full performance checkpoint.

## Verification

- Run `npm run ai:check` before implementation.
- Run focused schema tests and the clean-first-launch browser scenario.
- Run `npm run verify:quick`.
- Run targeted browser coverage for clean launch/defaults, palette Reset, background/export, and canvas/toolbar viewport stability.
- Skip the full performance checkpoint because this is a post-first-working defaults-only change and does not alter renderer workload limits or interaction algorithms.

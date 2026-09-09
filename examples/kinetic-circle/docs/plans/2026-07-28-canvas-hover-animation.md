# Canvas Hover Animation Plan

## Product decision

- Keep playback running while the pointer merely hovers or moves across the canvas.
- Preserve the existing interaction throttle for real canvas drag/pan, wheel/zoom, and Resolution scale interaction.
- Do not change timeline mode, loop timing, layers, persistence, exports, schema controls, panel actions, or product output.
- Keep the existing `starterControlSectionInventory` unchanged because no control section or product entity changes.

## Verification tier

Verification tier: Tier 3

Reason: The change affects animated renderer scheduling during canvas viewport interaction.

Run: `npm run verify:quick`; the focused Playwright timeline/hover test; existing viewport interaction coverage; manual browser verification on the running app.

Skip: The full performance checkpoint is not required for this post-first-working behavior fix because the user did not request performance optimization and the renderer workload, quality, and viewport drag throttle remain unchanged.

## Implementation

1. Update `src/app/kinetic-mosaic-renderer.tsx` so `pointermove` refreshes the interaction throttle only while a pointer button is pressed.
2. Extend `e2e/app-controls.spec.ts` with a regression assertion that repeated pointer movement over the canvas advances the rendered animation phase while playback remains active.
3. Update `docs/toolcraft/agent-worklog.md` with the root cause, unchanged product decisions, files changed, verification evidence, skipped full performance checkpoint, and remaining risk.

## Acceptance

- Moving the pointer repeatedly across the canvas without pressing a button does not freeze `data-mosaic-phase`.
- Playback state stays active during hover.
- Real canvas drag/pan still completes successfully and does not destabilize the viewport.
- Paused timeline behavior remains deterministic.

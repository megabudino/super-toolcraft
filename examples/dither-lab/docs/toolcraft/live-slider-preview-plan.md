# Live Slider Preview

## Product Decision

Every existing slider continues to write through Toolcraft runtime state on each
pointer move. The product canvas must visibly repaint before pointer release and
must keep following a longer drag. No controls, sections, persistence targets,
settings-transfer fields, timeline, layers, or export behavior change.

## Control Section Inventory

- `Pixel Effect`: Size, Fill, Density, Exposure, Scatter, and Seed receive live
  preview feedback.
- `Tone`: Brightness, Contrast, Saturation, and Hue receive live preview feedback.
- `Texture & Lens`: Noise, Grain, Glow, and Vignette receive live preview feedback.
- `Layer`: Opacity receives live preview feedback.
- Runtime `Setup`: Resolution scale continues to update preview through the same
  scheduler.

## Implementation Plan

1. Replace the cancel-on-change trailing debounce in
   `src/app/dither-renderer.tsx` with a retained leading/trailing scheduler.
   Keep the newest render request in a ref, render the first update immediately,
   throttle continuing updates to a bounded interval, and cancel scheduled work
   only on unmount.
2. Strengthen `e2e/app-controls.spec.ts` so the existing Size acceptance test
   proves the canvas changes twice while the pointer is still held down.
3. Update `docs/toolcraft/agent-worklog.md` with the scheduling decision, evidence,
   rejected alternatives, and verification results.

## Verification Note

Verification tier: Tier 3

Reason: preview scheduling changes for every high-frequency slider and the custom
Canvas 2D renderer, while schema state, export output, and Toolcraft runtime remain
unchanged.

Run: reproduce the old release-only behavior with the focused browser acceptance;
run `pnpm verify:quick`; run focused browser acceptance for live Size dragging and
targeted performance scenarios for Size, Fill, Glow, Opacity, and Resolution scale;
then run `pnpm verify:final`.

Skip: full `pnpm verify:perf`; this is a behavior correction rather than a reported
performance regression, and the directly affected workload paths receive targeted
sequential performance coverage.

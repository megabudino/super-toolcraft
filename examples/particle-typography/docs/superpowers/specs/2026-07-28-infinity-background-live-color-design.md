# Infinity Background Live Color Design

## Goal

Keep the complete Infinity canvas painted with the selected Background color while the color picker is being manipulated, without making the Dots product renderer redraw hidden finite-background pixels or recompute scene bounds for background-only changes.

## Root cause

- Runtime accepts both string colors and structured `{ hex }` colors, but the Infinity viewport resolver only accepted strings. The color picker writes `{ hex }` during live interaction, so `CanvasShell` removed its inline background and exposed the black application theme.
- `DotsRenderer` subscribed to the entire values record. In Infinity mode, a background-only update still recomputed scene bounds and synchronously redrew the particle canvas even though the product background is intentionally suppressed and the runtime viewport owns the visible color.

## Design

- Resolve the runtime Infinity background from either a non-empty string or a structured value with a non-empty `hex`.
- Keep finite preview and all export behavior unchanged.
- In Dots, treat an `appearance.background`-only values change as renderer-equivalent only while both states are in Infinity mode. Any other value change, canvas-mode change, canvas-size change, or timeline change continues to invalidate the renderer.
- Runtime `CanvasShell` remains the visible Infinity background owner, so live color changes become a cheap style update.
- The normalized Setup `Background` switch is self-explanatory and drops the product source description so it renders without a help icon.

## Verification tier

Verification tier: Tier 4

Reason: The batch fixes shared runtime background normalization and a generated app's Canvas renderer invalidation, with visible canvas and responsiveness impact.

Run: Targeted runtime unit tests; targeted Dots renderer unit tests; focused browser reproduction proving the live structured color paints the viewport and does not change the product frame signature; one bare `npm run verify:delivery`; restart the app and visually inspect the real UI.

Skip: Full `npm run verify:perf` because the request authorizes one bounded performance iteration, not a complete maximum-workload audit.


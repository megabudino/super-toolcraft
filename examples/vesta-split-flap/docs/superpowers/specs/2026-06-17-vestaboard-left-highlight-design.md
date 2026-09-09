# Vestaboard Left Highlight Design

## Product Decision

Add the same seeded edge-glow behavior to the left side of each cell that currently exists on the bottom side. The left highlight is a visual accent on the cell edge, not a new depth effect and not a replacement for `Cell border`.

## Controls

- Add `Left opacity` as a range slider from `0` to `100`, default `[0, 0]`.
- Add `Left seed` as a slider from `1` to `9999`, default `547`.
- The left highlight color follows the existing `Cell border` hex color.
- Left and bottom highlight distributions are independent, so users can tune each edge separately.

## Rendering

- Each cell receives a deterministic `leftHighlightOpacity` value from `Left opacity` and `Left seed`.
- Preview renders the left edge as a vertical 4px gradient/glow layer clipped inside the cell.
- PNG export mirrors the preview by drawing stacked vertical strokes at the left edge.
- The effect does not change cell position, size, count, message placement, canvas size, or export dimensions.

## Acceptance

- `Left opacity` changes left-edge glow opacity distribution across cells.
- `Left seed` changes the deterministic left-edge opacity distribution.
- Existing bottom highlight behavior remains independent.

## Verification

- Unit tests cover left highlight range and deterministic seed behavior.
- Browser tests cover visible left-edge gradient/glow styling, edge alignment, and seed distribution changes.
- Performance tests cover both left highlight controls because they repaint the full computed cell field.

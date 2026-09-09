# Vestaboard Bottom Highlight Design

## Product Decision

Remove the subtle depth feature and replace it with a simpler bottom-border highlight on every cell. The highlight is a thin bottom-edge overlay that keeps the grid flat while adding a controlled lower-edge accent.

## Controls

- Remove `Depth` and `Depth seed`.
- Add `Bottom opacity` as a range slider from `0` to `100`, default `[0, 0]`.
- Add `Bottom seed` as a slider from `1` to `9999`, default `421`.
- The bottom highlight color follows the existing `Cell border` hex color so users do not need another color control.

## Rendering

- Each cell receives a deterministic `bottomHighlightOpacity` value from the `Bottom opacity` range and `Bottom seed`.
- Preview renders the highlight as a bottom inset line while preserving the existing fill, radius, and full-cell border.
- PNG export draws the same bottom line through Canvas 2D after the base fill/border.
- The effect does not change cell positions, sizes, grid count, phrase placement, or canvas dimensions.

## Empty Message

- The Message textarea may be left empty.
- An empty message renders no permanent phrase cells.
- The default message is empty so clearing the textarea does not restore a phrase on blur or reset.
- Random field behavior remains controlled only by `Fill`, `Opacity`, and `Seed`.

## Acceptance

- `Bottom opacity` changes bottom-edge opacity distribution across cells.
- `Bottom seed` changes the deterministic bottom-edge opacity distribution.
- Empty Message leaves the board without phrase cells and remains empty after blur and reset.

## Verification

- Unit tests cover bottom highlight range, bottom seed determinism, and empty message behavior.
- Browser tests cover visible bottom-line styles and empty textarea behavior.
- Performance tests cover both bottom highlight controls because they repaint the full computed cell field.

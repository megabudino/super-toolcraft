# Vestaboard Edge Overlay Design

## Product Decision

Move the highlighted cell border off the main cell nodes and into a separate overlay layer that duplicates the current cell pattern geometry. The overlay layer renders only edge borders, while the main cells keep fill, full border, and text.

## Controls

- Remove `Left opacity` and `Left seed`.
- Keep `Bottom opacity` and `Bottom seed` as the single opacity distribution and seed for the overlay edge border.
- Add `Edge sides` as a segmented mode:
  - `Bottom` is the default and renders only the lower edge.
  - `Bottom + left` renders both lower and left edges using the same seeded opacity distribution.

## Rendering

- Preview has a dedicated `vestaboard-edge-overlay-layer` above the base cell layer.
- The overlay duplicates every computed cell position and size from the current board model.
- Overlay cells have transparent fill and a strict 1px highlighted edge.
- In `Bottom` mode each overlay cell renders only the bottom edge.
- In `Bottom + left` mode each overlay cell renders bottom and left edges.
- PNG export mirrors the overlay layer by drawing edge strokes after base cells and before text.

## Acceptance

- `Bottom opacity` changes the overlay edge opacity distribution.
- `Bottom seed` changes the deterministic overlay edge distribution.
- `Edge sides` switches between bottom-only and bottom-plus-left output.
- Removing left-specific controls does not remove the ability to render left edges; left edges are controlled by `Edge sides`.

## Verification

- Unit tests cover edge mode defaults and model values.
- Browser tests cover overlay layer presence, bottom-only default, bottom-plus-left mode, strict 1px edge thickness, and seed distribution changes.
- Performance tests cover `Edge sides` because switching it repaints the full overlay layer.

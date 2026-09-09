# Vestaboard Bottom Fill Canvas Design

## Goal

Add a `Fill canvas` parameter for the bottom edge opacity overlay so the user can control how many cells receive a highlighted edge border.

## Product Behavior

- Add a `Fill canvas` slider in `Board Surface` for the bottom/edge overlay.
- The slider runs from `0%` to `100%`.
- Default is `100%` so current Bottom opacity behavior remains full coverage.
- At `0%`, no cells render the highlighted bottom/left overlay border.
- At `100%`, all cells can render the highlighted overlay border when `Bottom opacity` is above zero.
- Intermediate values use the existing `Bottom seed` to choose a deterministic subset of cells.
- The slider does not change cell count, tile size, gap, cell fill, text, field fill, or permanent phrase placement.

## Renderer And Export

- DOM preview keeps `vestaboard-edge-overlay-layer` as the highlight layer.
- Overlay cells keep their current `vestaboard-edge-cell-row-col` test ids.
- Bottom highlight spans use seeded `bottomHighlightOpacity` values and 1px height.
- Cells outside the `Fill canvas` coverage get `bottomHighlightOpacity = 0`.
- Canvas 2D export mirrors the DOM geometry and skips the same cells.

## Acceptance

- Browser tests verify the default bottom highlight remains inside a cell.
- Browser tests verify `100%` coverage renders highlights on every cell.
- Browser tests drag `Fill canvas` left and verify fewer cells render highlights without changing cell geometry.
- In `+ left` mode, browser tests verify left highlight count matches the same coverage subset.
- Performance tests cover the slider because it changes every edge overlay primitive.

## Verification

- `pnpm verify:quick`
- Focused Playwright tests for bottom fill canvas and edge mode.
- `pnpm build`
- `CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm verify:final`

# Vestaboard Gap And Fill Opacity Design

## Goal

Let the board support a `-1px` minimum gap and random cell fill opacity distribution controlled by a two-thumb range plus seed.

## Decisions

- `board.tile.gap` min becomes `-1` so cells can visually overlap by one pixel.
- Cell fill keeps a single color target, while opacity distribution moves to `board.cell.fillOpacityRange`.
- `board.cell.fillSeed` deterministically distributes fill background alpha per cell and does not affect character filler seed.
- Border remains `colorOpacity`; it is a uniform outline style, not a distribution.
- DOM preview and Canvas 2D export both read the same per-cell `fillOpacity` from the shared model.

## Control Section Inventory

- Board Surface: target tile size, gap, radius, cell fill color, cell fill opacity range, cell fill seed, and cell border. All controls style or size the cell surface.
- Board Message: permanent phrase and text style.
- Random Field: character fill, character opacity, and character seed.
- Background: canvas/export background.

## Verification

Tier 3 because renderer/model/export and workload metadata change. Run unit tests, build, browser acceptance, browser perf, and final gate.

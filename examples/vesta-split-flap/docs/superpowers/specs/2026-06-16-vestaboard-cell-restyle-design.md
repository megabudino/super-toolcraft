# Vestaboard Cell Restyle Design

## Goal

Revise the existing Vestaboard app so the cell grid is a neutral, user-styled field rather than a predesigned board. Cells must fill the full canvas area, and the user's target cell size controls how many cells fit rather than leaving a fixed 22 by 6 board floating in the middle.

## Product Decisions

- The board remains a still-output Creative Apps Kit product with no timeline and no Layers panel.
- Width and Height are target cell dimensions. The renderer computes column and row counts from canvas size, target size, and gap, then flexes actual cell dimensions so the complete grid exactly fills the canvas.
- The permanent message centers inside the current computed grid. Textarea line breaks remain board line breaks, and long lines wrap at the current computed column count.
- Fill and seed apply only to non-message cells. Fill 0 leaves non-message cells empty; Fill 100 fills every non-message cell.
- The hardcoded tile style is removed. Cells consume runtime settings for radius, fill color plus opacity, and border color plus opacity.
- `colorOpacity` is used for cell fill and border because each product entity owns both color and opacity.

## Control Section Inventory

- Board Surface: `board.tile.width`, `board.tile.height`, `board.tile.gap`, `board.cell.radius`, `board.cell.fill`, `board.cell.border`. These all describe the cell field geometry and surface treatment.
- Board Message: `board.text.message`, `board.text.typography`, `board.text.color`. These describe permanent phrase content and text rendering.
- Random Field: `field.fill`, `field.opacityRange`, `field.seed`. These describe seeded non-message characters.
- Background: `appearance.background`, `export.includeBackground`. These describe canvas/export backing, not cell styling.
- Export: `panel.actions`. This remains the sticky PNG output action.

## Renderer And Export

The DOM preview and Canvas 2D export share the same `VestaboardModel`. The model exposes computed `columns`, `rows`, `cellCount`, `tileWidth`, `tileHeight`, and `boardWidth/boardHeight`. The preview uses absolute-positioned cells with no shadows or preset colors. The export draws the same cells using runtime fill and border RGBA values.

## Verification Tier

Tier 3: renderer/canvas behavior changes plus schema, acceptance, and performance metadata updates. Run `pnpm verify:quick`, browser acceptance/perf for the touched app, then `pnpm verify:final` before delivery.

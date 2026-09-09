# Vestaboard Cell-Based Line Transition Design

## Context

The phrase transform should never move glyphs freely across the board. A Vestaboard character exists only inside a cell. When a kept character changes position, the transition must be represented by a cell flipping through characters, not by CSS or Canvas translation.

## Decision

Kept letters use a per-letter, cell-based layout schedule:

- Each kept source character has a deterministic target cell.
- During the transition, each kept character advances through integer row/column cells only.
- While a kept character is between its source and target layout, the current cell shows deterministic Vestaboard flicker characters.
- Once its local transition completes, the final target cell shows the kept target character.

The board grid, clipping, export, and preview all remain cell-bound.

## Verification

- A unit test tracks kept letters by source index and proves their intermediate rows are integer cells.
- The same test proves at least one moving kept letter is showing a flicker character instead of its final target character.
- Existing final-frame, target-line integrity, and browser phrase animation tests must keep passing.

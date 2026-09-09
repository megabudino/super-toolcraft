# Mesh Gradient Column Reflow Design

## Problem

`mesh.columns` can change while `mesh.points` keeps the point order and handles from the previous grid. The point layout stores `basePointCount`, but it does not store the column count that defines that order. A valid transition such as 12 points from four columns to two columns therefore bypasses reconciliation and the renderer interprets unrelated points as neighbors, producing crossing patches.

## Product Behavior

Changing Columns reflows the structural mesh into a complete rectangular grid for the accepted column count. The color count, canvas size, selection, and independently inserted color points stay intact. An unsupported column count continues to settle on the nearest valid factor.

Existing saved layouts that predate the fix are migrated in place by recording their current column count before a later column edit. Preset transitions, undo/redo, point dragging, and one-point collection add/remove retain their current behavior.

## Architecture

Add optional `baseColumns` metadata to `MeshPointLayout`. Every newly created or structurally changed layout writes it. Collection topology reconciliation compares stored `baseColumns` with requested Columns; a mismatch reuses the existing complete-grid reflow path and remaps inserted points to cells in the new grid.

Layouts without `baseColumns` receive a metadata-only reconciliation using the currently active Columns. This is deterministic and avoids trying to infer topology from point coordinates that users may have deformed.

## Error Handling

The stored column count is accepted only when it is an integer within mesh limits and divides the structural point count into at least two rows. Invalid metadata falls back to the current accepted Columns and is rewritten during migration.

## Verification

Verification tier: Tier 3.

Unit coverage proves `4 -> 2`, metadata migration, inserted-point preservation, and existing invalid-factor normalization. Browser coverage changes the real Columns slider and asserts a complete non-crossing row-major guide grid, stable point count, stable canvas bounds, and a changed render signature. Typecheck, focused tests, production-base build, and the protected delivery gate complete the batch.

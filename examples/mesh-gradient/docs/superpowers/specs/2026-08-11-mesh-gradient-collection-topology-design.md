# Mesh Gradient Collection Topology Design

## Problem

The Color Points collection currently mutates `mesh.colors` one item at a time while leaving `mesh.columns` and `mesh.points` unchanged. A rectangular 12-point, four-column mesh therefore becomes a 13-point mesh with a one-point final row. The WebGL renderer only builds complete four-node Coons patches, so the appended point is visible in the editor but does not belong to a rendered patch. Manual Reflow preserves the incomplete row and leaves part of the canvas uncovered.

## Product Behavior

Color Points must always describe a complete rectangular mesh. Using the collection `+` action expands the current topology by the smallest available complete grid line: a column when that adds fewer nodes, otherwise a row. The new line is inserted through the existing Bezier topology helpers, so existing points and curves remain in the mesh instead of being replaced by a detached fallback point. The collection `-` action removes the smallest complete edge line for the same reason.

If no row or column can be inserted within the 16-point limit but the collection mutation itself reaches a valid rectangular count, the app reflows to the closest balanced rectangular dimensions. The four-point minimum and sixteen-point maximum remain unchanged.

## Architecture

A product-owned reconciliation helper compares the stored point-layout count with the color collection count. It handles only collection count mutations; ordinary color edits, preset application, point dragging, and explicit line insertion keep their current paths.

For an addition, the helper starts from the last complete topology, chooses an allowed row or column insertion, and produces synchronized colors, columns, and layout. For a removal, it deletes the smallest eligible edge line. The result is applied through the existing topology-snapshot handshake so the three runtime targets settle together without editing the signed Toolcraft runtime.

The renderer remains a rectangular Coons-patch mesh. No triangulation, implicit hidden points, or app-local replacement of the built-in collection control is introduced.

## Error Handling

Reconciliation returns no change when the stored topology is already synchronized, when the topology-snapshot handshake owns the update, or when the input cannot be recognized safely. Preset transitions remain eligible when the collection count changes so reconciliation can read the original stored point count before preset deselection normalizes the layout. A stale incomplete topology is repaired to the nearest valid rectangular topology within the existing point and column bounds.

## Verification

Verification tier: Tier 3.

Reason: collection actions now coordinate renderer topology, point handles, and canvas coverage.

The focused unit proof covers add and remove reconciliation. The browser proof clicks `Add color point` from a 12-point preset and asserts that the resulting point count is rectangular, every handle belongs to the guide grid, the canvas remains covered, and undo/redo returns complete topologies. Existing color-edit, line-insertion, build, and production-base checks remain green. Full performance refresh is skipped because the workload envelope, render passes, and tessellation are unchanged.

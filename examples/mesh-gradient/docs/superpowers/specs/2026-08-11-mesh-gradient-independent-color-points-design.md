# Independent Mesh Color Points Design

## Status

This design supersedes `2026-08-11-mesh-gradient-collection-topology-design.md`. The earlier reconciliation expanded and contracted complete rows or columns. That behavior changed the visible grid and did not match the requested one-action/one-point interaction.

## User-visible behavior

- Clicking a color point on the canvas selects the matching color in the Color Points panel.
- Clicking a color row in the panel selects the matching canvas point. The active row has a persistent selected treatment that remains visible while its color picker is open.
- Add creates exactly one color and exactly one canvas point. It never changes `mesh.columns`, the canvas dimensions, or existing point positions.
- The new point is inserted into the mesh cell adjacent to the selected structural point. With no selection, the central cell is used. Repeated additions use deterministic positions inside that cell.
- A new point splits its host Coons cell into a triangulated local surface, so its color and position affect rendered output instead of appearing as a detached editor handle.
- Remove deletes exactly the selected inserted point. Structural row/column points remain the stable Coons grid and cannot be removed individually; Remove is disabled while a structural point is active or no inserted point is active.
- The four-to-sixteen total point bound remains enforced. Add is disabled at sixteen points.

## State and topology

`MeshPointLayout` gains explicit structural topology metadata:

- `basePointCount` records the immutable rectangular Coons grid prefix.
- `insertedPoints` records each appended point's stable host cell and local coordinates inside that cell.
- `selectedIndices` remains the shared selection source for canvas and panel.

Legacy and preset layouts without this metadata treat their complete rectangular point array as the base grid. Adding a point appends one position, one zero-handle record, one color, and one insertion record. Removing an inserted point removes the same index from points, handles, colors, insertion metadata, and selection.

The custom Color Points renderer targets `mesh.colors` and reads/writes `mesh.points` through the runtime command bus. Color edits use the control's `setValue`; selection uses a history-skipped `mesh.points` command. Add and remove are reconciled deterministically from the color-count change, so undo/redo of the recorded color mutation restores the matching point topology without app-local state.

## Rendering

Cells with no inserted points retain the existing tessellated Coons patch path. A cell with inserted points is triangulated in its local `(u, v)` parameter space using its four corners plus its inserted nodes. Each triangle evaluates the original Coons surface and applies inserted-node displacement barycentrically, preserving the cell boundary while making every inserted point part of the rendered surface. Colors interpolate barycentrically through the same triangles.

The SVG editor draws the unchanged structural grid plus local connector edges for inserted points. Inserted points remain draggable and selectable but do not expose directional Bezier handles; those handles belong only to structural Coons nodes.

## Controls decision

Closest built-ins checked: `collectionActions`, `actions`, and `color`.

`collectionActions` owns a growable color list, but it cannot represent the active mesh-point selection, disable removal for structural nodes, or coordinate one color mutation with local cell topology. A custom control is therefore required. It uses Toolcraft Button and Input primitives, contains only color selection/editing plus Add/Remove actions, and keeps all persistent values in runtime state.

## Error handling

Malformed insertion metadata is ignored and sanitized when the layout is read. Add returns no change at sixteen points or when no valid rectangular base cell exists. Remove returns no change unless exactly one inserted point is active. Renderer triangulation falls back to the original Coons patch when a cell's insertion metadata cannot form a valid local topology.

## Verification

Verification tier: Tier 3.

Reason: the delivery changes a custom collection control, SVG editing topology, and WebGL geometry while preserving the existing canvas and export pipeline.

Run targeted unit tests for one-point add/remove, metadata migration, active selection, and triangulated geometry. Run the focused browser scenario proving 12→13→12, unchanged columns and canvas bounds, panel↔canvas selection, and visible output change. At delivery run the impact-derived Tier 3 `verify:delivery` gate and then keep the app available through its saved development port. A full performance refresh is skipped because the user reported functional topology behavior, not renderer lag or jank.

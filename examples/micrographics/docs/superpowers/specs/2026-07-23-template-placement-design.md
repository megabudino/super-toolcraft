# Template Placement Interaction

## Goal

Make the Template Library a direct source for placing micrographic elements on the poster. A template can be inserted either by selecting a tile and clicking the poster or by dragging the tile onto the poster. A successful insertion clears the template selection. The poster canvas itself has no border, outline, or shadow.

## Root Cause

The existing built-in `imagePicker` writes the selected id to `library.template`, but the canvas enters placement mode only when a separate `Place` action writes `place-element` to `library.commands`. Selecting a tile therefore cannot place anything by itself. The built-in picker also renders non-draggable buttons and the SVG canvas has no drop handlers. After the old placement flow, only `library.commands` is cleared, so the template remains selected.

## Chosen Design

Replace the built-in picker plus `Place` action with one Toolcraft custom control registered through `controlRenderers`.

The custom control:

- renders the existing 38 generated thumbnails;
- writes the clicked template id to `library.template`;
- exposes each tile as an HTML draggable source;
- writes a typed template id into a product-specific `DataTransfer` MIME payload;
- shows a selected tile only while a placement is pending;
- uses Toolcraft tokens and compact panel spacing.

The canvas:

- treats a valid `library.template` value as placement mode;
- inserts a default-sized, aspect-aware element centered on a simple click;
- preserves click-drag region placement when the pointer moves beyond the click threshold;
- accepts the product-specific drag payload and inserts a default-sized element centered at the drop point;
- clamps every inserted rectangle to the poster bounds;
- selects the newly inserted element for immediate move/resize;
- clears `library.template` after every successful click, region, or drop insertion;
- ignores invalid drag payloads without changing the poster;
- explicitly renders without border, outline, or box shadow.

`library.template` has an empty-string default. It represents transient pending placement, not a persistent visual choice. The obsolete `library.commands` schema target and `Place` action are removed.

## Interaction Ownership

- Template choice remains panel-owned because the library is structured application UI.
- Spatial placement is canvas-owned because the user explicitly requested insertion at a poster coordinate.
- The panel does not expose duplicate X/Y/width/height placement fields.
- The canvas does not contain a duplicate template palette.

## Alternatives Rejected

1. Keep `imagePicker` and add another `Place` action: preserves the broken two-step interaction and cannot supply native drag data.
2. Put the template palette on the canvas: violates the Toolcraft product-output boundary.
3. Attach document-level listeners to runtime-owned picker buttons: couples product code to host DOM structure and bypasses `controlRenderers`.

## State And Data Flow

1. Tile click or drag start writes a valid template id to `library.template`.
2. `MicrographicsCanvas` derives placement mode from that value.
3. Click/region/drop resolves a bounded poster rectangle.
4. A shared placement helper creates deterministic template content and appends the new element to `composition.layout`.
5. The canvas records the layout mutation in history, selects the new element, and clears `library.template` with history skipped.

## Verification

Verification tier: Tier 3

Reason: The delivery changes canvas pointer/drop behavior, a custom panel control, product layout mutations, and visible canvas presentation.

Run:

- targeted unit tests for placement geometry and schema defaults;
- targeted browser test `browser: direct micrographics placement`;
- existing canvas handle/export-clean test;
- `npm run verify:delivery` with the exact affected functional browser selector and Tier 3;
- start or reuse `npm run dev` and visually verify the running app.

Skip:

- the complete performance audit because no workload boundary, renderer pass cost, export path, animation, media decode, or pipeline lifecycle changes.


# Remove Duplicate Format Section

## Goal

Remove the app-authored `Format` section containing the 4:5, 2:3, and 9:16 actions. Poster size and aspect ratio remain editable through Toolcraft's built-in Setup controls at the top of the panel.

## Scope

- Remove the `Format` controls section and its `canvas.commands` action target from the product schema.
- Remove the corresponding acceptance entity, control-section inventory entry, browser step, and schema expectation.
- Leave the non-exposed compatibility action handler unchanged so this panel-only cleanup does not expand into the export renderer path.
- Keep `Image Export → Format` unchanged because it selects PNG versus JPG rather than canvas aspect ratio.
- Keep current canvas sizing mode, default dimensions, renderer, export dimensions, and persistence behavior unchanged.

## Interaction Ownership

Toolcraft Setup is the sole panel owner for canvas aspect ratio and dimensions. The product canvas continues to own direct element manipulation. No new controls or canvas interactions are introduced.

## Verification

Verification tier: Tier 2.

- Unit coverage proves the schema no longer exposes `canvas.commands` or a `Format` section while `Image Export` still exposes `export.image.format`.
- Browser coverage proves the duplicate section is absent and the built-in Setup aspect and dimension controls remain visible.
- The protected delivery gate runs the exact affected unit and browser selectors.

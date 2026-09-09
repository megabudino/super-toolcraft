# Complete Reset Default State Design

## Goal

Make the runtime `Reset controls` command restore the complete Micrographics
product state, including manually authored element placement, while preserving
the existing imported defaults, media reset, canvas-size reset, persistence,
settings transfer, and undo/redo behavior.

## Root Cause

Canvas placement, movement, resize, text editing, recoloring, and deletion write
the serialized composition to `composition.layout`. The value is currently
allowlisted only as an additional persistence and settings-transfer target; it
is not owned by a schema control and therefore has no entry in
`state.defaults`.

When Reset only changes values, the runtime replaces the values record and the
layout happens to disappear. When Reset also restores uploaded media or canvas
size, the runtime commits a state patch and updates only declared default
targets. In that path `composition.layout` survives, leaving the poster partly
edited after Reset.

The real-browser reproduction starts with five generated elements, inserts a
sixth element, uploads a source image, and invokes Reset. The image is removed
but six elements remain.

## Design

The existing Compose `actions` control will own `composition.layout` and declare
the authored layout from `default-settings.snapshot.json` as its `defaultValue`.
The supplied snapshot remains the single source of truth for the coupled
product defaults: seed `447`, count `3`, Minimal kit, scale `71`, Fitness cover,
and the eight visible authored templates. Shuffle intentionally updates the
seed and clears authored layout, while Reset layout restores the authored
layout snapshot through the functional composition handler before delegating
unrelated actions to the existing export handler. The target therefore names
the product entity those actions operate on and supplies the runtime default
used by global reset without changing the export pass.

Because `composition.layout` becomes an ordinary schema target, persistence and
settings transfer discover it automatically. Their
`additionalValueTargets` entries will be removed instead of maintaining two
ownership declarations.

The acceptance target and section inventory will move from the synthetic
`composition.commands` target to `composition.layout`. Browser helpers that
scope Compose actions by target will follow the same change. The regression
will assert the exact default snapshot before and after reset, including all
eight visible templates, the Fitness cover, and media removal. No visible
control, renderer, canvas interaction, export path, or workload boundary
changes.

## Rejected Alternatives

- A hidden technical control would create a fake product entity and unnecessary
  conditional-visibility coverage.
- A React effect that watches runtime history would depend on private reset
  metadata and split one reset across multiple commands.
- Editing the signed copied runtime is forbidden in this generated app and is
  unnecessary once the product-owned layout has a schema default.

## Verification

Verification tier: Tier 3

Reason: The batch changes schema target/default ownership, persistence
declaration, acceptance mapping, Reset behavior, and the initial/reset canvas
output snapshot without changing renderer technique, export mechanics, or
workload dimensions.

Run:

- focused schema and acceptance Vitest coverage;
- the complete-default-state browser regression with authored layout plus media;
- the focused complete-default-state browser scenario for both Compose actions;
- one exact Tier 3 `verify:delivery` invocation;
- `npm run dev` to confirm the saved app URL.

Skip:

- performance scenarios because the functional Reset handler is separated from
  the unchanged export implementation and no renderer pass, workload boundary,
  lifecycle, or invalidation behavior changes;
- the operator-only full performance audit because it was not requested.

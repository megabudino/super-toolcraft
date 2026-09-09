# Studio Room Wall Fill Design

## Goal

Let Toolcraft authors change the opaque background fill of the Studio Room inner back-wall rectangle.

## Product behavior

- Add a `Wall fill` color control to the existing `Room` section.
- The control changes only the inner back-wall rectangle shown behind the section content.
- The outer room surfaces, grid, tile imagery, wall border, and motion remain unchanged.
- The default fill remains the current `#F1F6DE` color.
- Live edits update the website preview immediately.
- Apply persists the fill with the rest of the Studio Room settings; Reset restores the default.

## Settings and protocol

Add one opaque hex-color field at `room.wallFill`. Keep it separate from `room.wallBorder` and from any future outer-stage background setting.

The Toolcraft target is also `room.wallFill`. The Studio Room preview protocol version increments because the strict settings payload gains a field. Toolcraft and website protocol versions must move together.

Website normalization accepts legacy saved settings without `room.wallFill` and supplies the default color. New payloads and persisted settings include the field and reject malformed colors through the existing color normalization rules.

## Rendering

`PreFooterRoom` publishes the normalized value as a CSS custom property on the back-wall element. The `.backWall` background reads that custom property instead of the hardcoded color. The stage background remains hardcoded and is not affected by this control.

## Toolcraft records

Register the target in the Studio Room values layer, schema, preview pipeline, acceptance coverage, control-section inventory, interaction ownership, and performance coverage following the existing Room border-control pattern.

## Verification

Use focused Studio Room tests to cover:

- default and nondefault target-to-payload mapping;
- schema control registration;
- preview protocol validation and version agreement;
- legacy website settings fallback and persisted round trip;
- application of the CSS custom property to the inner wall;
- acceptance, ownership, inventory, and pipeline coverage.

Do not run broad browser or repository-wide suites for this change.

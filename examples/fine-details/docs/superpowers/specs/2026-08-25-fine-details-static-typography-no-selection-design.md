# Fine Details Static Typography Selection Design

## Request

Disable native selection for the two static Fine Details typography blocks marked in the supplied screenshot: `TRY IT` and the `YOUR WAY` heading with its body copy.

## Root Cause

Both typography owners already use `pointer-events: none`, so they do not own pointer hit-testing. They still inherit the browser default `user-select: auto`, which allows a canvas drag that crosses them to include their text in the native selection range.

The central prompt is a separate editable product interaction. A section-wide selection rule would incorrectly prevent selection and editing inside that prompt.

## Design

Add Tailwind `select-none` to the existing upper-left typography element and the existing lower-right typography group. The lower-right rule is placed on its shared container so both the heading and description inherit one boundary.

Do not change pointer events, z-index, drag ownership, prompt behavior, typography settings, preview protocol, or Toolcraft controls. Do not add JavaScript selection cleanup or a global/section-wide selection rule.

## Verification

This is a later Tier 1 presentation refinement. Add a focused source contract proving both static typography owners carry `select-none` while the draggable prompt owner does not. Run that focused test and a direct browser check that dragging across the marked blocks leaves the selection empty while prompt text remains selectable.

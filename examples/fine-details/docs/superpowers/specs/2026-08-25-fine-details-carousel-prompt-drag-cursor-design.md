# Fine Details — Carousel-only prompt drag affordance

## Request

Enable the prompt block's drag cursor only over surfaces that can actually start a drag while
the Fine Details image mode is `Carousel`. Disable prompt dragging completely in `Trail`.

## Behavior

- `Carousel` owns prompt dragging.
- The prompt root shows `grab` only on its non-interactive drag surface.
- During an active native drag, that surface shows `grabbing`; the retained bridge follows the
  same state when used as a defensive fallback.
- Inputs, buttons, links, labels, editable content, and every existing no-drag descendant keep
  their normal cursor and never start prompt dragging.
- Double-click reset remains available only on the draggable Carousel surface.
- `Trail` disables native drag, iframe-bridge drag, double-click reset, and drag cursors.
- Entering `Trail` cancels any active gesture and returns the transient prompt offset to zero so
  a Carousel drag cannot leak into the Trail layout.

## Architecture

`FineDetailsSection` derives one boolean from `settings.imagesMode === 'carousel'` and passes it
to `FineDetailsDraggablePrompt` as `dragEnabled`.

`FineDetailsDraggablePrompt` owns the website gesture lifecycle. In Toolcraft, the Carousel iframe
is pointer-interactive, so the same native website path owns drag and cursor behavior; Trail makes
the iframe pointer-transparent so the outer preview resumes trail-pointer ownership. The retained
bridge is a defensive compatibility path. Both sides gate gestures, double-click reset, cursor
state, and geometry publication with the current mode. When disabled, they clear bridge geometry
and release any active capture.

A local CSS module owns the cursor presentation. The root gets `grab`; the active root gets
`grabbing`; existing interactive/no-drag selectors restore their native cursor while idle. No
global styles or duplicated prompt component are introduced.

## State and transitions

- `Trail -> Carousel`: the iframe becomes pointer-interactive, geometry is published, and the
  native drag affordance becomes active.
- `Carousel -> Trail`: active pointer ownership is cancelled, pointer capture is released when
  present, transient offset resets immediately, bridge geometry is cleared, and the cursor
  returns to normal.
- Reduced-motion behavior for the existing double-click animation is unchanged in Carousel.

## Verification

Verification tier: Tier 2 — localized product interaction behavior.

Run focused component/unit tests for mode gating, interactive descendants, cursor state,
bridge geometry, host-mode authority, cancel/reset behavior, and the existing prompt drag
bounds/reset contracts.
Run the directly affected Fine Details browser acceptance for prompt dragging in Carousel and
the absence of dragging in Trail. Run focused formatting and `git diff --check`; do not run
aggregate delivery or measured performance checks.

## Non-goals

- No prompt position schema, protocol version, persistence, or visual panel changes.
- No changes to carousel motion, image trail behavior, prompt input actions, or click handling.
- No second prompt implementation and no CSS-only workaround that leaves Trail dragging active.

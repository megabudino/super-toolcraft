# Hero Viewport Anchor Layout Design

## Goal

Keep the published website hero fitted to the visitor's available screen height while letting Toolcraft use `Canvas height` only to emulate that viewport during authoring. Anchor the heading near the top of the visual area and the prompt near its bottom, with their existing vector pads continuing to tune the final offsets.

## Current behavior

The hero already uses `height: calc(100svh - 4rem)`, so the website follows the visitor viewport and the Toolcraft iframe follows the configured test height. However, the heading and prompt currently live in one centered content group. Moving either group changes its transform but does not give it a stable top or bottom relationship as the viewport height changes.

## Design

Preserve the existing two-row hero grid: a flexible visual row followed by the fixed 5rem announcement ticker. The hero itself remains exactly `calc(100svh - 4rem)` tall; no minimum, maximum, fixed production height, or preview-protocol height field is added.

Turn the first grid row into a full-height vertical flex layout with `justify-between` and responsive edge padding:

- the heading group is the first child and therefore starts at the top inset;
- the prompt group is the last child and therefore ends at the bottom inset, immediately above the ticker row;
- the existing heading and prompt transforms remain on those children, so Toolcraft X/Y vector-pad values act as adjustments relative to their new anchors;
- screen-coordinate semantics remain unchanged: positive Y moves an item downward and negative Y moves it upward.

Remove the prompt's former margin from the centered stack because separation now comes from the available viewport space. Preserve the current stacking order: heading at `z-0`, card scene at `z-10`, prompt at `z-20`, and ticker at `z-30`.

## Toolcraft ownership

`Canvas height` remains a runtime-owned preview dimension. It changes the iframe viewport used for testing but does not become product state and is not sent through the hero preview payload. The existing `Heading position` and `Prompt position` panel pads remain the only controls for their authored offsets. No duplicate drag interaction or new control is introduced.

## Alternatives rejected

- Absolute `top` and `bottom` positioning would reproduce the anchors but add manual overlap and containing-block bookkeeping that the grid/flex structure already provides.
- Sending a hero height in the preview protocol would couple published layout to an authoring test dimension and duplicate the iframe viewport.
- Scaling a fixed-height design to every viewport would distort typography and prompt geometry instead of preserving responsive layout.

## Data flow

Published site: visitor viewport → `100svh` → hero height minus the 4rem site header → flexible visual row plus 5rem ticker → top heading anchor and bottom prompt anchor.

Toolcraft preview: `Canvas height` → iframe viewport → the same website viewport calculation → the same two anchors. Heading/prompt vector pads → their existing CSS transforms → final authored offsets.

## Verification boundary

This is a later Tier 3 viewport-layout edit. Per the user's standing instruction for this application, no automated checks, browser checks, lint, typecheck, formatting, or build will be run; the implementation will be handed off directly for user review.

## Risks

Extremely short viewports or extreme vector-pad values can make the heading and prompt overlap or move beyond their intended insets. The layout intentionally preserves direct pad control rather than clamping authored positions or reintroducing a minimum hero height.

# Fine Details Trail Prompt Focus and Layering Design

## Goal

Let the cursor image trail move continuously through the prompt's screen area while keeping the cards visually beneath the prompt. The trail must render above both typography compositions. Focusing any interactive element inside the prompt pauses new card creation without abruptly removing cards already on screen.

## Layer Order

The Fine Details section uses one explicit stacking order:

1. Background and grid.
2. Upper-left and lower-right typography at `z-index: 1`.
3. Image trail at `z-index: 5`.
4. Prompt at `z-index: 10`.

Trail cards may therefore cover both text compositions but always pass underneath the complete prompt panel.

## Pointer Behavior

The current prompt-rectangle hit test is removed. Pointer movement over the prompt's coordinates is treated like movement over any other point in the section, so the smoothed path is continuous and does not reset, pause, or ramp merely because it intersects the prompt rectangle.

The prompt remains interactive because the trail layer keeps `pointer-events: none`.

## Focus Behavior

The trail listens for bubbling `focusin` and `focusout` events on the prompt root identified by `data-fine-details-prompt`.

- On `focusin`, spawning is suppressed and the next spawn anchor is cleared.
- Existing cards are not removed. Their current lifetime and fade-out behavior continues normally.
- Moving the pointer while the prompt is focused still updates the smoothed pointer position, but creates no new cards.
- A `focusout` that moves focus to another element inside the same prompt does not resume the trail.
- When focus leaves the prompt entirely, spawning resumes through the existing `Resume delay` and `Resume ramp` settings.
- If focus is already inside the prompt when the trail mounts or settings re-enable it, the trail starts suppressed.

Focus suppression replaces prompt-coordinate suppression. Touch, reduced-motion, disabled-trail, and missing-image gates remain unchanged.

## State and Cleanup

The trail keeps the focus-suppression flag inside `FineDetailsImageTrail`; no new cross-component prop or global store is introduced. Event listeners are installed on the current prompt root and removed when the trail unmounts. The existing lifetime timers remain authoritative for cards created before focus.

## Verification

Focused checks only:

- A source/component test proves the trail layer is above typography and below the prompt.
- A behavior test or source contract proves prompt rectangle hit-testing is gone.
- Focus-in prevents new spawns without clearing existing cards.
- Moving focus between prompt descendants remains suppressed.
- Focus leaving the prompt applies the configured resume delay and ramp.
- A local smoke-check moves through the prompt area, focuses the prompt, then blurs it and confirms the three states visually.

Repository-wide build, lint, and broad browser suites remain outside this handoff unless requested.

## Out of Scope

- Changing card geometry, image order, shadows, lifetimes, fades, smoothing, spacing, or tilt.
- Disabling pointer interaction with the prompt.
- Adding new Toolcraft controls.
- Removing existing cards immediately when prompt focus begins.

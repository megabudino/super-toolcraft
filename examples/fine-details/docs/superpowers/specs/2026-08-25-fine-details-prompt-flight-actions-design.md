# Fine Details Prompt Flight Actions Design

## Goal

Add `Run` and `Reset` actions inside the existing Toolcraft `Prompt Flight` section so the flight can be controlled directly without changing `Images`.

## User-visible behavior

- `Run` plays the prompt flight using the current `Prompt Flight` settings and current prompt position.
- `Reset` cancels any active flight, removes all ghosts, and returns the prompt to its authored base position.
- Neither action changes `Images`, edits a flight setting, persists a new value, or resets the section controls.
- With `Active` off or reduced motion enabled, `Run` snaps to the configured landing point; `Reset` still snaps to base.

## Architecture

The Toolcraft section gains one built-in `actions` control with two commands: `prompt.flight.run` and `prompt.flight.reset`. The existing panel-action handler routes these commands through the active Fine Details preview sender.

The atomic preview protocol advances from v9 to v10 and adds one nonce-bearing prompt-flight command envelope. The Toolcraft preview posts that envelope to the trusted website iframe. The website boundary validates origin, source, version, nonce, and command before forwarding it to the section flight hook.

The flight hook handles commands independently from `images.mode`:

- `run` cancels the current trajectory/ghost run, measures the latest geometry, and starts or snaps the outbound flight with current settings;
- `reset` flushes pending drag-reset compensation, cancels the trajectory, clears ghosts, snaps the flight offset to zero, clears the landing drag anchor, and exposes `idle`.

The existing `Trail`/`Carousel` transition behavior remains unchanged.

## Ownership and failure handling

The Toolcraft panel owns both direct commands. The iframe remains the output/interaction surface and does not duplicate their controls. A command sent before preview readiness reports concise panel feedback and does not mutate settings.

Repeated commands are distinguished by nonce. A newer command cancels the prior flight safely.

## Focused verification

- Website unit coverage: protocol validation plus run/reset hook wiring and reset cleanup semantics.
- Toolcraft unit/product coverage: exact action schema, v10 message shape, sender routing, no settings mutation, and feedback when the preview is unavailable.
- Format touched files, run only the focused tests, and run diff checks.
- Do not run browser, build, delivery, performance, or broad suites.


# Vestaboard Letter Speed And Duration Design

## Context

The phrase transform already uses a source-to-target keep-plan: outgoing letters flicker, disappear, rows re-center, and the remaining kept letters move into the target line layout. The current timing control is a two-handle `Cell duration` range that changes how long a single removal step lasts, but it does not model multiple outgoing letters animating at once.

## Decision

Replace the user-facing `Cell duration` concept with two controls in Board Message:

- `Duration spread`: a two-handle range for the minimum and maximum flicker duration of each outgoing letter.
- `Letter speed`: a single slider for how tightly outgoing-letter starts are launched across the removal stage.

The app does not expose a direct "animated letters count" setting. The number of simultaneously flickering letters is derived from the overlap between launch spacing and individual flicker durations:

- Higher `Letter speed` starts outgoing letters closer together, increasing overlap.
- Longer `Duration spread` values keep outgoing letters flickering longer, increasing overlap.
- Lower speed or shorter duration reduces overlap and makes the shrink feel more sequential.

## Behavior

For each source row, removable letters get a deterministic schedule:

1. The global keep-plan identifies letters that will stay and letters that will leave.
2. Each removable letter receives a seeded duration from `Duration spread`.
3. `Letter speed` determines the row's launch window; higher speed compresses starts into an earlier window.
4. A letter is visible normally before its start, flickers with outgoing opacity during its duration, and disappears after its duration.
5. Every disappearance re-centers the current row, including kept letters.
6. After the removal stage, the remaining kept letters move into the target line layout.

Existing imported settings that still contain `board.text.cellDurationRange` should continue to map into `Duration spread`.

## Verification

- Unit tests prove speed and duration spread change the number of active outgoing letters.
- Existing final-frame and target-line integrity tests must keep passing.
- Browser tests drag `Duration spread`, `Letter speed`, and `Outgoing opacity`, then verify start/end phrase frames.
- Performance matrix includes both timing controls as workload controls.

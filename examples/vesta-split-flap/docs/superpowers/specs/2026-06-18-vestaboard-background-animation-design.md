# Vestaboard Background Animation Design

## Context

The board already uses the playback timeline for the phrase transform. The random background field is currently static: one Fill value controls how many non-phrase cells show filler characters.

## Decision

The random background field should also be timeline-driven:

- `Start fill` controls how many non-phrase cells are filled at progress 0.
- `End fill` controls how many non-phrase cells are filled at progress 1.
- `Field duration` is a two-handle range that controls how long each changing background cell flickers before settling.
- `Field speed` controls how quickly active background cells cycle through Vestaboard flicker characters during that duration.
- All changing background cells start flickering immediately on the first non-zero timeline frame, so the background begins with the rest of the product animation.
- Existing legacy `field.fill` settings map to both start and end fill so imported old settings remain visually stable.

## Behavior

For each non-phrase cell, deterministic seeded presence values decide whether it is filled at the start and at the end. If the start and end state differ, that cell starts animating as soon as playback leaves progress 0 and receives its own deterministic duration:

- During its duration, it shows Vestaboard flicker characters.
- Field speed changes the flicker bucket count, so users can make active cells cycle more slowly or more quickly without changing when those cells settle.
- After its duration, it shows the end state.

Phrase cells remain owned by phrase animation and are not affected by background fill.

## Verification

- Unit tests prove start/end fill affect background occupancy at progress 0 and 1.
- Unit tests prove changing cells are already active on the first non-zero frame.
- Unit tests prove a mid-frame contains flickering background cells.
- Unit tests prove Field speed changes the active background character pattern.
- Browser tests drag `Start fill`, `End fill`, `Field duration`, and `Field speed`.
- Performance coverage includes the new workload controls.

# Slider Drag Performance Design

## Product goal

Keep Dot Ring Studio responsive while users drag spatial sliders, including the
reachable Infinity canvas workload during active timeline playback.

## Reproduced failure

At Infinity canvas, density 280, rows 12, render scale 2, and active playback,
six real pointer steps on the Density slider took 7.8 seconds. Every step
produced a main-thread Long Task between 906 ms and 1655 ms, and the maximum
animation frame gap was 1665.7 ms.

The slider and Canvas 2D frame draw are not the root cause. Each intermediate
spatial value synchronously samples the complete 12-second animation at 30 fps
to rebuild the Infinity scene envelope. That full-cycle calculation blocks
React, pointer events, and animation on the main thread.

## Behavior decisions

- Spatial slider values continue to update the visible ring during the gesture.
- The full-cycle Infinity envelope moves to a dedicated worker and never blocks
  the main thread.
- Rapid spatial updates coalesce: a newer value cancels the stale worker request,
  and only the latest settled value completes a full-cycle envelope.
- A one-frame safety envelope is computed synchronously for immediate preview,
  then unioned with the last completed full-cycle envelope until the worker
  returns the exact new result.
- Finite canvas behavior, exact export bounds, selected density, rows, render
  scale, animation timing, flat bead appearance, and closed-ring motion remain
  unchanged.
- Image export precomputes the same deterministic frame geometry, yields once,
  and paints ordered ring rows across short browser tasks through the standard
  Toolcraft PNG canvas so 4K output does not monopolize the main thread.
- Reducing sampling quality, silently lowering render scale, or delaying the
  product value itself is not allowed.

## Control Section Inventory

The existing Source Audio, Ring Pattern, Bead Colors, Wave Motion, Image Export,
and Video Export sections remain unchanged. Runtime Setup continues to own
Background, Infinity canvas, finite sizing, render scale, Timeline, and settings
transfer.

## Runtime decisions

- `viewInteraction` remains `non-spatial`.
- Panel controls remain the sole owners of ring and wave parameter edits.
- The playback timeline remains enabled and runtime-owned.
- Layers remain disabled.
- Persistence, settings transfer, and product exports remain unchanged.
- The worker is a renderer-owned resource created after commit and terminated
  whenever its request becomes stale or the renderer unmounts.

## Performance authority

Request evidence:

`когда я двигаю слайдер все тормозит дико, давай разбираться с этим`

Affected canonical path:

- `performance-path:%5B%22interactive-continuous%22%2C%22control-drag%22%2C%5B%22dot-ring.preview-frame%22%5D%2C%5B%22main%22%5D%2C%5B%22ring-density%22%2C%22ring-rows%22%5D%5D`

## Verification tier

Verification tier: Tier 3

Reason: the renderer invalidation lifecycle and the canonical spatial
control-drag performance path change.

Run: focused scene-bounds tests, TypeScript/code-health checks, one real-browser
Infinity slider-drag probe during playback, and one bare
`npm run verify:delivery`.

Skip: the complete `verify:perf` audit because the request authorizes one
bounded targeted performance iteration, not full certification.

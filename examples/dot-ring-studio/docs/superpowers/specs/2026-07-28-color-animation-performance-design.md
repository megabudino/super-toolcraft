# Color Animation Performance Design

## Product goal

Keep Dot Ring Studio responsive while users change bead colors during timeline playback, including Infinity canvas at the reachable high-density workload.

## Reproduced failure

At Infinity canvas, density 280, rows 12, render scale 2, and active playback, one real `color1` change produced a 1766.6 ms maximum frame gap and a 1769 ms long task. The same animated renderer stayed near one 16.7 ms frame in finite mode.

The color picker is not the root cause. Palette changes currently invalidate the memoized full-cycle Infinity scene envelope because both scene-bound memos depend on the complete settings object. Color and background values do not change bead positions, so that expensive invalidation is unnecessary.

## Behavior decisions

- Palette changes update the next visible Canvas 2D frame without recomputing spatial scene bounds.
- Geometry, wave, audio, canvas size, and timeline-duration changes continue to recompute the Infinity envelope because they can move beads.
- Scene-bounds sampling uses spatial geometry only; palette selection and CSS color conversion stay out of that path.
- The visible flat-circle renderer preserves current quality, density, rows, render scale, animation timing, Infinity crop behavior, PNG/video output, and forward-only timeline playback.

## Control Section Inventory

The existing Source Audio, Ring Pattern, Bead Colors, Wave Motion, Image Export, and Video Export product sections remain unchanged. Runtime Setup continues to own Background, Infinity canvas, finite sizing, render scale, Timeline, and settings transfer.

## Runtime decisions

- `viewInteraction` remains `non-spatial`.
- Interaction ownership remains unchanged: Bead Colors owns palette edits in the panel; there is no duplicate canvas color interaction.
- The playback timeline remains enabled and runtime-owned.
- Layers remain disabled.
- Persistence and settings transfer remain unchanged.

## Performance authority

Request evidence:

`приложение дико тормозит при смене цветов во время анимации. и в целом ест ьпроблемы с перфомансом`

Affected canonical paths:

- `performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22dot-ring.preview-frame%22%5D%2C%5B%22main%22%5D%2C%5B%22ring-density%22%2C%22ring-rows%22%5D%5D`
- `performance-path:%5B%22interactive-continuous%22%2C%22animation-frame%22%2C%5B%22dot-ring.preview-frame%22%5D%2C%5B%22main%22%5D%2C%5B%22ring-density%22%2C%22ring-rows%22%5D%5D`

## Verification tier

Tier 3 — renderer/canvas performance issue.

Run focused unit and browser checks while editing, then one bare `npm run verify:delivery` for the complaint-authorized targeted iteration. Do not run the full performance audit.

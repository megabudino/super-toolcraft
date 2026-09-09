# Smooth short rest design

## Request

The transition from formation into the settled state currently looks abrupt. Keep
only about one second of calm, then begin the next forward animation cycle.

## Product behavior

- Keep the active formation compact at 3 seconds, removing its nearly static
  tail.
- Replace the current approximately 4.2-second settled hold with a 1-second hold.
- Use a 1-second curved release to the launch
  ring so the forward-only loop still has an exact positional seam.
- Set the default Toolcraft playback duration to 5 seconds.
- Advance the persistence version so the prior saved 10.5-second duration
  cannot override the corrected default.
- Make the convergence envelope reach the target with zero terminal velocity.
- Make the subtle settled breathing envelope equal zero, with zero slope, at
  both the formation/hold and hold/release boundaries.
- Keep timeline play, pause, scrub, duration editing, PNG export, and video
  export owned by the Toolcraft playback timeline.

## State and output mapping

No new control or state target is introduced. The runtime timeline progress
continues to drive the same deterministic analytic renderer and export paths.
Changing the timeline duration scales the full 7.3-second phase design while
preserving the seamless first/last frame match.

## Acceptance

- Unit proof samples both sides of the formation/hold and hold/release
  boundaries and requires positional continuity.
- Unit proof confirms the one-second hold in the 5-second default cycle.
- Existing timeline browser acceptance reproves forward-only playback, scrub,
  duration edits, and the loop seam.
- A focused browser proof observes the shortened settled interval and stable
  canvas output at the phase boundaries.

## Verification tier

Verification tier: Tier 3
Reason: The change modifies custom Canvas 2D animation timing and motion output
for preview, PNG frames, and video frames.
Run: Focused motion/schema tests and one focused real-browser animation check
during development; exact impact-derived Tier 3 delivery proof; restart the
saved app server and inspect the live loop.
Skip: The complete performance matrix is not requested; workload boundaries,
renderer architecture, and viewport invalidation do not change.

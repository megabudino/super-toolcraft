# Adjustable Loop Timing Design

Verification tier: Tier 3

Reason: The change adds schema controls, synchronizes product timing with the
runtime playback timeline, and changes preview, PNG, and video frame phase
mapping.

Run: Focused schema/motion tests, browser acceptance for both timing sliders and
the seamless phase boundaries, affected preview/image/video performance paths,
then one exact `npm run verify:delivery` invocation.

Skip: The complete performance audit and viewport-only paths because the request
does not change workload limits, viewport interaction, canvas sizing, or render
scale.

## Product Goal

Let users set two independent phase timings with built-in sliders:

- `Active`: the complete moving portion of the loop.
- `Calm`: the settled, subtly animated portion of the loop.

Changing either slider updates the runtime timeline duration to their sum. The
loop stays forward-only and seamless for every reachable combination.

## Timing Model

- `motion.activeDuration`: default 4 seconds, range 1–12 seconds, 0.25-second
  step.
- `motion.calmDuration`: default 1 second, range 0.25–6 seconds, 0.25-second
  step.
- Active motion keeps the existing visual proportions: 75% formation and 25%
  curved release.
- Calm motion sits between formation and release.
- Calm duration changes only how long the idle phase remains active. Its subtle
  internal breathing runs at a fixed one-cycle-per-second rate in actual
  timeline seconds, so making Calm longer adds more motion cycles instead of
  slowing the idle animation.
- Default timing remains 3 seconds formation, 1 second calm, and 1 second
  release: a 5-second loop.
- Slider changes set the top Toolcraft playback duration to
  `activeDuration + calmDuration`.
- A later manual edit of the top timeline duration changes global loop speed
  while preserving the active/calm ratio, matching the runtime duration
  contract.

## Seam Contract

- Formation reaches the settled targets with zero positional jump and zero
  turbulence-envelope slope.
- Calm breathing uses fixed real-time frequency plus short time-bounded
  smoothstep fades, and is zero with zero slope at both boundaries.
- Release uses smoothstep time and a zero-ended arc, returns every particle to
  its exact launch position, and stitches to the first frame.
- Preview, PNG, and video read the same timing settings and normalized runtime
  timeline progress.

## Control Selection Inventory

Product need: edit the moving phase duration.

Value model: one bounded numeric duration in seconds.

Candidate built-ins checked: slider, input, range slider.

Best built-in: slider.

Why: the user explicitly requested slider-based duration adjustment and the
value is one continuous scalar.

Rejected alternatives: input is less immediate; range slider incorrectly models
two endpoints of one range.

Target: `motion.activeDuration`.

Renderer/export mapping: defines 75% formation and 25% release and contributes
to runtime total duration.

Acceptance coverage: schema default/range, real slider change, runtime duration,
phase boundaries, rendered movement, and seam.

Product need: edit the calm phase duration.

Value model: one bounded numeric duration in seconds.

Candidate built-ins checked: slider, input, range slider.

Best built-in: slider.

Why: same scalar timing model and requested interaction as Active.

Rejected alternatives: input and range slider for the same reasons above.

Target: `motion.calmDuration`.

Renderer/export mapping: defines the complete settled interval and contributes
to runtime total duration without changing the idle animation rate.

Acceptance coverage: schema default/range, real slider change, runtime duration,
calm phase length, equal idle-motion speed at different Calm values, rendered
calm motion, and seam.

## Control Section Inventory

Title: `Timing`.

Product entity: loop phase timing.

Targets: `motion.activeDuration`, `motion.calmDuration`.

Grouping reason: both controls divide one forward playback cycle into moving and
settled product phases; they do not belong to particle physics or transport.

## Animation Intent Inventory

Classification: playback timeline.

Transport owner: top Toolcraft timeline for play, pause, scrub, looping, current
time, and optional global duration scaling.

Panel owner: the new Timing section for the product-specific active/calm phase
design.

Timeline: remains enabled because the product is animated and exports video.

Direction: forward-only; reverse, mirror, and ping-pong are forbidden.

Export: video length follows runtime timeline duration; still export renders the
currently selected timeline frame.

## Persistence And Transfer

Both targets use ordinary runtime values, so existing `values` persistence,
Reset, undo/redo, and automatic settings transfer cover them. Persistence stays
at version 2 because the new defaults are compatible with the existing 5-second
timeline and no old value is reinterpreted.

## Observable Output

The renderer exposes active duration, calm duration, total product duration, and
the current semantic phase as data attributes. Browser acceptance also samples
real canvas pixels before and after phase boundaries.

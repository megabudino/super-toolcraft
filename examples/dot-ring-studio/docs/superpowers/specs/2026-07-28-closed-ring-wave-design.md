# Closed Ring Wave Design

## Goal

Dot Ring Studio must render every row as one visually continuous closed ring on
every animation frame. The angular transition from the last bead back to the
first bead must behave like any other neighboring pair for every formula,
including uploaded or bundled audio.

## Root Cause

The renderer distributes beads around a circular parameter domain, but parts of
the displacement field are not circular:

- audio sampling offsets time with a linear `angle / TAU` ramp;
- procedural texture seeds use the discrete bead index.

Both inputs jump at the `2π -> 0` boundary. At density 280 and 12 rows the
measured seam reached 227 px while the median interior neighbor distance was
6.1 px.

## Product Decisions

- Make the wave field periodic by construction; do not draw a cosmetic bridge.
- Replace raw angular audio travel with a smooth periodic angular offset.
- Replace index-discontinuous texture noise with deterministic periodic angular
  noise that remains row-specific.
- Apply one short eased circular seam transition to each row before relaxation,
  so future formulas cannot reintroduce a last-to-first outlier.
- Preserve the existing audio-reactive character, formula choices, amplitudes,
  density, rows, render scale, palette, timeline, Infinity canvas, and exports.
- Keep the Canvas 2D renderer, canonical pipeline registration, persistence,
  view interaction `non-spatial`, playback timeline, and disabled Layers.
- Keep the control section inventory unchanged: Source Audio, Ring Pattern,
  Bead Colors, Wave Motion, Image Export, and Video Export. Runtime Setup
  continues to own Background, Infinity canvas, sizing, render scale, timeline,
  and settings transfer.

## Acceptance

- At maximum interactive density and rows, the last-to-first distance of each
  row stays within the same bounded neighborhood envelope as interior
  last-to-next distances across sampled frames and every wave formula.
- The ring is visibly closed during playback and scrubbing.
- The first and last animation frames still stitch as a forward-only loop.
- Preview, PNG export, video export, and Infinity bounds consume the same closed
  geometry.
- No quality setting, workload boundary, or product control is reduced.

## Verification

Verification tier: Tier 3

Reason: The shared animated wave geometry changes for preview, scene bounds,
image export, and video export.

Run: focused wave/drawing tests, typecheck, code-health, real-browser visual and
numeric seam checks, protected Canvas kernel benchmark, then one bare
`npm run verify:delivery`.

Skip: full maximum-fixture performance certification because this is a visual
correctness fix, not an operator-requested full audit.

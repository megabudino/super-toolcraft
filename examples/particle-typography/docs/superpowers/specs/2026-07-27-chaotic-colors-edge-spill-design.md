# Chaotic Particle Colors And Edge Spill Design

## Request

Make the settled particle object match `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-2e201d51-3d55-46f8-bd2b-f8218a4eae62.png`: neighboring circles should use chaotic, saturated, discrete colors, and an editable density-like slider should allow circles to extend beyond the object boundary.

## Root Cause

The current renderer derives color from each target's spatial gradient coordinate, interpolates between adjacent stops, and mixes the result 14% toward the FontPicker color. With the default white text tint, this creates large spatial color clusters, intermediate muddy colors, and reduced saturation. The reference instead keeps one bright color identity per particle.

Target anchors are currently selected from pixels whose text-mask alpha is at least 96. Apart from a tiny collision offset used only when a candidate repeats, targets stay inside that opaque mask. Circle radius can overlap an edge, but there is no state value that moves particle centers beyond it.

## Approaches Considered

1. **Deterministic discrete color bank plus mask-normal edge spill. Selected.** Use each particle seed to choose one exact gradient stop, retain a small spatial phase so Gradient type/angle and stop positions remain meaningful, and move selected edge anchors outward along the sampled mask normal. This matches the reference while remaining stable across preview, timeline scrubbing, PNG, and video.
2. **Randomize colors and positions during every draw. Rejected.** It would flicker between frames, break particle identity, and make preview/export nondeterministic.
3. **Dilate the whole text mask. Rejected.** It changes the authored glyph silhouette everywhere and cannot express a loose mix of inside and outside circles.

## Product Design

### Color allocation

- Keep the existing built-in `gradient` control as the editable particle color bank.
- Convert the spatial gradient coordinate into a small phase applied to a dominant stable seed coordinate.
- Select the nearest stop without interpolating RGB values. Stop positions control the relative assignment boundaries; Gradient type and angle alter the spatial phase; stop color and opacity remain exact.
- Do not mix the default `#FFFFFF` typography tint into palette colors. A non-white authored typography color still applies a subtle tint so the FontPicker color remains meaningful.
- Dots and their trails use the same stable per-particle color.

### Edge spill

- Add a built-in continuous slider in `Particles`:
  - label: `Edge spill`;
  - target: `particles.edgeSpill`;
  - domain: `0–100%`;
  - default: `55%`;
  - meaning: probability and maximum distance of deterministic outward displacement.
- Sample a local outward normal for text-mask edge candidates.
- At `0%`, preserve current target placement.
- As the value rises, an increasing share of edge candidates move farther beyond the mask; interior candidates receive only a small irregular offset so the glyph remains readable.
- Preserve the same seed, target, and color across every frame and export.

## Runtime And Performance

- `particles.edgeSpill` belongs to schema values, persistence, settings transfer, Reset, and history through the normal Toolcraft slider path.
- It changes target construction, so the shape-sample pass and preview pass invalidate during slider drag/change.
- It does not change particle count, primitive count, mask resolution, trail count, export resolution, or workload envelope boundaries.
- Shape sampling remains linear in particle count and Canvas 2D remains the canonical renderer; no kernel benchmark is required because the renderer technique and pass relationship are unchanged.

## Acceptance

- Unit proof:
  - seeded color selection is deterministic;
  - neighboring particles can receive different exact palette stops;
  - default white typography does not wash out stop colors;
  - `0%` spill keeps targets inside a rectangular fixture mask;
  - `100%` spill moves a deterministic subset beyond the fixture mask.
- Browser proof at the settled hold phase:
  - at least eight reference palette colors appear;
  - the same colors span multiple regions instead of forming one spatial gradient band;
  - moving `Edge spill` from `0%` to `100%` expands visible particles beyond the strict-shape baseline;
  - Reset restores `55%`;
  - no playback, canvas-size, or export state jumps.

## Verification

Verification tier: Tier 3

Reason: The batch changes target generation, renderer color output, pipeline invalidation, schema state, acceptance coverage, preview pixels, and exported image/video frames without changing renderer technology or workload boundaries.

Run:

- Focused Vitest for particle planning, color allocation, schema defaults, acceptance, and render-plan gates.
- Focused Playwright for the settled chaotic palette and `Edge spill`.
- Exact impact-derived canonical performance paths for the changed shape/preview/image/video passes.
- One protected `npm run verify:delivery` after the batch stabilizes.
- `npm run dev:restart` and manual browser inspection on the saved port.

Skip:

- Full performance certification because the user requested product behavior, not the separate complete audit.

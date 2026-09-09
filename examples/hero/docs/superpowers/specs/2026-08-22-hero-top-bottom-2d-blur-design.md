# Hero Top/Bottom 2D Blur Design

## Context

In the Sphere post pass, `Blur` is currently added to the same scalar `span` as chromatic dispersion. Every sample then applies that complete span along the active zone direction. At the left and right lens edges this is the established horizontal treatment. At the top and bottom lens edges the active direction is `dirPhi`, so Blur becomes a long vertical resample and produces a hard, duplicated horizontal strip at the zone boundary.

The defect is isolated to the Sphere post pass. Toolcraft values, protocol v14, the field target, lens-zone geometry, Rows rendering, and the supplied image sources are correct.

## Goal

Keep chromatic dispersion aligned to the curved lens field while making `Blur` enter the top and bottom zone as a soft, genuine two-dimensional blur. Preserve the current left/right effect exactly.

## Non-goals

- Do not change the side-zone sample formula or its visual result.
- Do not change `Blur`, `Dispersion`, `Samples`, `Aura`, `Top and bottom`, or any other control range/default.
- Do not add a render pass, framebuffer, texture, setting, protocol field, or persisted value.
- Do not change Rows mode, lens geometry, card layout, Pan behavior, motion response, gate placement, or warp mechanics.
- Do not fold the separate Sphere card-visibility correction into this shader change.

## Selected Design

The post shader will retain the existing side-dominance test. When `sideDistance >= verticalDistance`, the current sample and aura offsets remain byte-for-byte equivalent: Blur continues to contribute to the directional span and to the perpendicular jitter exactly as today.

When `verticalDistance > sideDistance`, the shader will separate the two meanings:

- `Dispersion` remains directional along `verticalDirection`, following the curved `phi` field.
- `Blur` no longer contributes to that directional dispersion span.
- Each post sample derives a deterministic two-dimensional disk offset from the existing two dither values. The radial distribution uses `sqrt(radiusSample)` so sample density is uniform across the disk rather than concentrated in the centre.
- The blur radius is multiplied by a short `smoothstep` over the inner part of `verticalDistance`, producing a soft transition into the top/bottom zone.
- Direct Pan/row motion remains independent and is added exactly as before.

The aura loop uses the same vertical two-dimensional kernel shape at its larger radius. This prevents the removed hard strip from reappearing through the halo while keeping the side aura unchanged.

## Shader Data Flow

1. Decode the same lens `theta`/`phi` field and gradients.
2. Compute the same side and vertical distances and directions.
3. Determine `verticalDominant` only from the existing distance comparison.
4. Compute the unchanged static zone envelope and Blur/Dispersion extents.
5. Side-dominant pixels use the current offset expression without altered constants.
6. Vertical-dominant pixels use directional dispersion plus a deterministic 2D blur-disk offset.
7. The existing spectral weights, alpha accumulation, motion velocity, turbulence, gate, fade, and final coverage cleanup remain in place.

No new uniform or CPU-side wiring is required.

## Error And Boundary Handling

- `Top and bottom = 0` keeps the vertical branch inactive.
- `Blur = 0` produces no 2D blur offset; directional dispersion continues normally.
- At corners, the existing greater-distance rule selects side or vertical ownership. Equal distances remain side-owned, preserving the established side appearance.
- The disk offset is bounded by the existing authored Blur extent and sample count; no sample-loop or framebuffer budget changes.
- Invalid field pixels continue to return the unmodified scene sample.

## Verification

- Add a focused shader-contract regression that first fails while vertical Blur is still part of the directional span.
- Assert the side offset expression remains unchanged.
- Assert vertical-dominant offsets use directional dispersion plus a two-axis disk kernel and a smooth vertical-zone entrance.
- Assert the aura loop follows the same branch rule and does not put vertical Blur back into the directional halo span.
- Run the focused post-shader/pass test and existing motion/layout regressions only.
- In the real Toolcraft iframe, isolate the top/bottom zone with `Edge width = 0`, increase `Top and bottom`, and compare before/after at the same Pan and settings. The hard duplicated horizontal strip must disappear, the entry must be soft, and the lens-following dispersion must remain.
- Restore the supplied settings after the diagnostic check and confirm the side effect is visually unchanged.

## Performance And Risk

The implementation reuses the same post loop, dither inputs, sample count, textures, and passes. It adds only a few scalar/vector operations inside vertical-dominant samples. No measured performance iteration is authorized by this visual bug fix.

The main risk is accidental side-effect drift from sharing variables between side and vertical branches. Focused source-contract assertions therefore pin the side offset formula and isolate all new math behind `verticalDominant`.

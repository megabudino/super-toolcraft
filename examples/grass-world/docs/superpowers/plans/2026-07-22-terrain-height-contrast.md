# Terrain Height Contrast Plan

Verification tier: Tier 3

Reason: A new persisted Terrain control changes procedural height remapping, ground geometry, normals/slopes, Terrain-attached placement, the grayscale preview, and exported output. It does not change mesh resolution, sample count, noise octave workload, draw calls, resources, or renderer technique.

## Diagnosis

- Current default field samples cover approximately `0.214–0.881`, so only 66.7% of the authored Height range reaches geometry.
- The height-map preview renders raw grayscale plus decorative contour darkening, while geometry linearly maps the unexpanded fBm range.
- Increasing Height range scales the whole field but cannot make dark valleys and bright peaks independently reach the authored extrema.

## Product decision

- Add built-in continuous `Contrast` to `Terrain`: 0–400%, default 100%, step 5%.
- Remap around the neutral midpoint: `clamp(0.5 + (value - 0.5) * contrast, 0, 1)`.
- Use the same remap for terrain height, slopes/normals, Terrain-attached objects, the grayscale height-map preview, preview/export rendering, persistence, and settings transfer.
- Preserve the current scene exactly at 100%.

## Implementation

1. Add `terrain.heightContrast` to defaults, settings type/reader, the Terrain section, render targets, layout keys, renderer pass inputs, acceptance inventory, and product readiness.
2. Add one shared CPU remap helper in `terrain-noise.ts`; apply it before Height range interpolation.
3. Add the equivalent uniform/remap to the retained WebGL noise-preview shader and include it in preview cache/signature inputs.
4. Update focused unit and browser acceptance so 100% is neutral, 200% uses the full height range on the current fixture, 400% is bounded, and the real slider changes both preview and terrain output.
5. Record the delivery in `docs/toolcraft/agent-worklog.md`.

## Verification

- Run focused terrain/schema/layout/acceptance tests, TypeScript, and AI/code-health.
- Run the exact protected terrain height-map Chromium scenario.
- Run only affected performance gates, refresh the source-bound kernel receipt if required, build production, and invoke protected delivery once.
- Skip a full performance refresh because contrast adds constant arithmetic per existing sample without changing workload boundaries or lifecycle.

# Terrain Height Mask Rebuild

Verification tier: Tier 3

Reason: This replaces the persisted Terrain elevation controls and the CPU/WebGL height-field mapping consumed by Terrain, grass, scans, rocks, preview, and export. It keeps the renderer technique and workload bounds but changes visible geometry and renderer invalidation targets.

## Product behavior

- Treat Terrain as one normalized grayscale height mask: black is zero elevation and white is the authored maximum elevation.
- Remove the fixed Gaussian reference composition, `Contrast`, and `Height range`.
- Keep the existing draggable Height map plus `Scale`, `Detail`, `Roughness`, and `Seed`, but make them author the dominant height field rather than a small micro-noise term.
- Add `Black / white` as the standard two-point smooth mask remap used by the other procedural masks.
- Add one `Max height` slider in metres. It scales the completed normalized mask and does not change its pattern.
- Multiply the remapped mask by a smooth perimeter envelope so the island reaches zero elevation without a discontinuous edge.
- Make the preview show the exact normalized elevation mask used by geometry, without decorative contour darkening.

## Control selection inventory

- Product need: Remap grayscale noise into usable elevation coverage.
- Value model: Two ordered normalized bounds.
- Candidate built-ins: `rangeSlider`, `curves`, custom preview.
- Best built-in: Existing `rangeSlider` labelled `Black / white`; the custom preview remains only for direct two-axis map translation and visualization.
- Rejected alternatives: `Contrast` because high values clamp broad plateaus into steep walls; `curves` because two mask endpoints are sufficient; custom level handles because the built-in range slider owns this value model.
- Target: `terrain.heightLevels`.
- Renderer/export mapping: Smoothly remaps normalized fBM before the shared preview/layout/export surface height.
- Acceptance: Both thumbs change the preview and WebGL surface.

- Product need: Set the physical elevation amplitude.
- Value model: One bounded scalar distance.
- Candidate built-ins: `slider`, `rangeSlider`.
- Best built-in: Continuous `slider` labelled `Max height`.
- Rejected alternative: `Height range`; black already owns zero and only the white-point amplitude remains authorable.
- Target: `terrain.maxHeight`.
- Renderer/export mapping: Multiplies the completed 0–1 mask into metres for Terrain and every attached object.
- Acceptance: A real slider change scales WebGL elevation without changing the preview mask pattern.

## Implementation

1. Replace Terrain defaults/types/readers and section schema targets with `terrain.heightLevels` and `terrain.maxHeight`; preserve persistence/reset/settings transfer through the normal schema.
2. Rewrite the shared height sampler to use normalized multi-octave noise, smooth black/white remapping, a continuous perimeter falloff, and one maximum-height multiplier.
3. Make the WebGL mask preview mirror the CPU sampler exactly and remove fixed Gaussian masses, contrast clamping, and contour decoration.
4. Update layout signatures, pipeline targets, scan invalidation, diagnostics, product readiness, acceptance rows, and the control-section inventory.
5. Replace the former reference-composition test with focused mask/remap/continuity/amplitude tests and update the Terrain browser scenario to prove offset, noise parameters, both level handles, and maximum height against real product output.
6. Keep timeline, layers, materials, lighting, wind, camera, media, and export actions unchanged; PNG/video continue to consume the same shared full-quality Terrain geometry.

## Performance

- Reachable inputs change from `heightContrast + heightRange` to `heightLevels + maxHeight`; `Detail` remains the only Terrain workload dimension and keeps its existing 1–6 boundary.
- Pass cost, geometry counts, draw calls, renderer resources, animation cadence, output resolution, and lifecycle remain unchanged.
- Update exact invalidation/cache-key target names for layout, scan placement, noise preview, scene resource, and export reuse.
- Run the existing render-plan/performance validation and only impact-derived targeted performance proof; do not request a full performance refresh.

## Verification

- `npm run ai:check`
- Focused Terrain mask, schema, acceptance, readiness, pipeline, and performance Vitest
- `npm run typecheck`
- Exact Chromium test: `terrain height map preview and controls reshape the field`
- Visual browser inspection at aggressive Scale/Detail/Roughness/levels values for smooth slopes and exact preview/geometry correspondence
- `npm run build`
- One `npm run verify:delivery`
- `npm run dev`


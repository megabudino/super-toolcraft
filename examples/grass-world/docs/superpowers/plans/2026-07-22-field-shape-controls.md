# Editable Field Shape

Verification tier: Tier 3

Reason: Two persisted Field controls change the shared CPU placement boundary, Terrain geometry, exact Terrain mask preview, global surface fade, scan/rock attachment, preview, and export. Renderer technique, geometry/sample bounds, resource lifecycle, draw calls, and animation cadence stay unchanged.

Run: AI/code-health preflight; focused field-shape/schema/layout/shader tests; TypeScript and build; exact Chromium shape-control acceptance; affected performance gates and current-source kernel receipt; one protected delivery invocation; existing dev server identity.

Skip: No explicit full performance refresh because the controls add fixed-cost arithmetic to the existing bounded samples and uniforms without changing workload dimensions or renderer topology.

## Product behavior

- Add `Roundness` to `Field`, persisted as `field.shapeRoundness`, with `0%` producing a softly rounded square/rectangle and `100%` preserving the current ellipse.
- Add `Irregularity`, persisted as `field.edgeIrregularity`, from a clean contour at `0%` to a visibly uneven but bounded contour at `30%`; preserve the current authored feeling with a `7%` default.
- Keep Width and Length together in their existing inline row, followed by the two full-width built-in sliders.
- Keep the current deterministic phase source (`terrain.seed`) so the same settings always recreate the same boundary without adding another seed control.
- Apply the shape to Terrain mesh vertices, Tall/Lawn placement, scan/rock/boulder placement, height falloff, global edge fade, Terrain mask preview, preview output, and export.

## Implementation

1. Add defaults, typed settings, bounded readers, schema sliders, product-readiness copy, and Field section inventory targets.
2. Replace the fixed ellipse helpers in `grass-field-shape.ts` with one superellipse-relative distance and radial mapping shared by point inclusion, deterministic placement, Terrain geometry, and height falloff.
3. Thread the two settings through placement candidates, geometry, scan/boulder layout, layout keys/pass inputs, renderer target declarations, pipeline inputs, and diagnostics.
4. Reproduce the same superellipse and irregular-edge math in the Terrain preview shader and shared surface-edge-fade shader through retained uniforms.
5. Add focused unit tests for square-vs-rounded corners, zero-vs-strong irregularity, bounded/deterministic placement, and exact Terrain perimeter behavior.
6. Add acceptance rows and one exact browser scenario that proves each real slider changes the persistent WebGL surface silhouette while output dimensions remain stable.

## Performance model

- Both controls are `responsiveness`: they change values for existing bounded terrain/layout samples but do not change sample count, vertex count, instance caps, octaves, passes, draw calls, texture allocation, or frame cadence.
- Add them to the existing shared layout invalidation targets and Terrain preview inputs; reuse current layout/scene/noise-preview passes and existing implementation ownership in `app-performance-impact.json`.
- Refresh only required current-source benchmark evidence and affected targeted paths; do not request an explicit-performance full checkpoint.

## Acceptance

- Automated: `field shape controls map to one shared perimeter`.
- Browser: `field shape controls reshape the complete surface`.
- Prove `Roundness` reveals substantially more corner extent at the square end than at the rounded end.
- Prove `Irregularity` changes boundary radius across angles while keeping the center stable and every generated point inside the same boundary contract.
- Prove both controls change the visible product through the real panel and update one field-shape signature consumed by preview/export.

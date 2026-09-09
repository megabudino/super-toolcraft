# Sprinkle Surface Conformance

## Product behavior

Every sprinkle instance must be placed against the currently generated icing
surface, including the active donut proportions, icing coverage, thickness,
detail, flow, drip amount, and drip frequency. The primitive's outer surface,
not its center, is offset from the icing by `sprinkles.surfaceOffset`.
Overlap relaxation may move instances across the coating, but must project them
back to that same current surface before the scene is rendered.

The existing controls, sections, persistence, layers, timeline, export, and
interaction ownership remain unchanged. The canvas remains the sole spatial
inspection surface and continues to use `orbit`.

## Verification tier

Verification tier: Tier 3
Reason: This changes procedural icing/sprinkle geometry mapping and renderer-pass invalidation, while retaining the existing schema, workload envelope, scene resources, and export architecture.
Run: focused icing/sprinkle/scene-graph/pipeline Vitest coverage; `pnpm typecheck`; a focused real-browser check at default and high-flow Pearl settings; one bare `npm run verify:delivery`; then restart the existing dev server.
Skip: measured performance and `npm run verify:perf`, because this is ordinary functional renderer work and the user did not authorize a performance iteration or full audit.

## Renderer and workload assessment

- Reachable inputs: donut shape controls; icing coverage, thickness, flow,
  drip amount, drip frequency, detail, and clear mode; sprinkle count, scale,
  seed, coverage, variation, rotation, surface offset, and shape.
- Workload boundaries: unchanged fixed icing tessellation and the existing
  maximum of 900 instanced sprinkles.
- Pass mapping: icing-shape changes invalidate icing geometry, sprinkle layout,
  and preview; sprinkle-only changes invalidate sprinkle layout and preview;
  style-only changes remain preview-only.
- Cost and lifecycle: the retained meshes, materials, textures, lights, shadow
  map, and WebGL renderer remain unchanged. Surface sampling runs only when
  icing geometry or sprinkle layout is rebuilt, never on each preview frame.
- Render-plan decision: keep the existing canonical pipeline and workload
  envelope. No new execution location, resource lifecycle, or benchmark
  candidate is introduced, so no protected kernel benchmark is required.
- Derived performance paths and fixtures remain unchanged. This batch receives
  functional proof only.

## Implementation

1. `src/app/donut/donut-icing-geometry.ts`
   - Extract one canonical parametric icing-surface sampler.
   - Generate mesh vertices and sprinkle contact samples from the same formula.
   - Expose the current surface position, normal, and tangent directions needed
     for placement and surface-constrained relaxation.

2. `src/app/donut/donut-sprinkle-layout.ts`
   - Sample the complete current icing settings instead of an approximate torus.
   - Add each shape's support radius before applying the authored surface offset.
   - Reproject relaxed instances to the curved surface and recompute their
     orientation from the final surface tangents.

3. `src/app/donut/donut-scene-graph.ts`,
   `src/app/donut/donut-scene.ts`, and `src/app/donut/donut-pipeline.ts`
   - Include every icing geometry input in the sprinkle-layout cache key and
     pipeline evidence.
   - Make clear-mode changes invalidate sprinkle layout as well as icing
     geometry, without changing visibility-only behavior.

4. Focused tests
   - Add exact surface-clearance assertions for Pearl instances at default and
     high-flow/high-drip settings.
   - Prove relaxation retains surface contact.
   - Prove scene-graph and pipeline invalidation rebuild the layout when the
     current icing surface changes.

5. Product records
   - Keep `src/app/app-verification-impact.json` aligned with changed production
     ownership.
   - Add one ordinary-product-work decision entry to
     `docs/toolcraft/agent-worklog.md`.

## Acceptance

- At `surfaceOffset = 0`, Pearl geometry is tangent to the generated icing
  within mesh-tessellation tolerance.
- Changing icing flow, drip length, detail, coverage, thickness, or donut shape
  resamples all sprinkles from the new surface.
- Overlap relaxation does not leave instances in the tangent plane above a
  curved region.
- Existing deterministic count, palette, shape, clear, orbit, shadow, material,
  persistence, and export behavior remains intact.

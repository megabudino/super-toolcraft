# Donut Studio Deep Port Implementation Plan

## 1. Expand normalized product state

Files:

- `src/app/donut/donut-types.ts`
- `src/app/donut/donut-values.ts`
- `src/app/donut/donut-reference.ts`
- focused value tests

Add typed donut shape, material, distribution, environment, and light settings.
Use source-derived defaults and bounded normalization for every schema target.

## 2. Expand Toolcraft controls

Files:

- `src/app/app-schema.ts`
- a focused product-owned schema-section module if needed for source budgets
- `src/app/app-acceptance-data.ts`

Create the semantic sections from the specification using built-in switches,
colors, sliders, segmented/select controls, actions, Orientation Gizmo, and
panel actions. Keep sections at seven or fewer visible controls and update
`appControlSectionInventory`.

## 3. Port source geometry domains

Files:

- new `src/app/donut/donut-base-geometry.ts`
- `src/app/donut/donut-icing-geometry.ts`
- `src/app/donut/donut-sprinkle-layout.ts`
- focused geometry/layout tests

Deform the exact source Base from cached original positions. Rebuild icing from
donut shape plus coverage, thickness, drips, frequency, and detail. Extend
deterministic sprinkle placement with seed, coverage, size variation, rotation,
and surface offset.

## 4. Port visible material and studio settings

Files:

- `src/app/donut/donut-materials.ts`
- `src/app/donut/donut-scene-graph.ts`
- `src/app/donut/donut-scene.ts`
- focused scene/material tests

Update retained physical materials from current Toolcraft settings. Retain
references to environment and the three area lights, then apply source-derived
strength, rotation, power, color, and size values without recreating the scene.

## 5. Keep preview and export canonical

Files:

- `src/app/donut/donut-export.ts`
- `src/app/donut/donut-scene.ts`
- export tests

Ensure isolated export consumes the identical normalized shape, simulation,
material, background, environment, light, and orientation settings.

## 6. Update renderer ownership

Files:

- `src/app/donut/donut-pipeline.ts`
- `src/app/app-performance.ts`
- `e2e/app-performance-path-adapters.ts`
- renderer pipeline tests

Add base deformation ownership, expand invalidation targets, keep only Flow and
image long edge as workload dimensions, derive canonical paths, and update
adapters for every new interaction category.

## 7. Expand functional proof

Files:

- `src/app/app-acceptance-data.ts`
- `src/app/app-verification-impact.json`
- `e2e/donut-product.spec.ts`
- `e2e/donut-export.spec.ts`
- `e2e/donut-test-helpers.ts`

Add one acceptance id and unique browser test for every visible target. Observe
renderer signatures, retained scene attributes, conditional visibility,
persistence, real backing pixels, and decoded export output.

## 8. Update decision trail

File:

- `docs/toolcraft/agent-worklog.md`

Record this follow-up as one coherent ordinary product iteration, the direct
source audit, the expanded section inventory, static timeline decision, changed
renderer mapping, and the single bare delivery command.

## 9. Verification

Development:

- `pnpm ai:check`
- `pnpm typecheck`
- focused Vitest files for values, geometry, layout, materials, pipeline, schema,
  and acceptance
- catalog reporter list
- focused Playwright product/export tests
- `npm run test`

Delivery:

- one bare `npm run verify:delivery`
- `npm run dev`

Do not run measured performance or the full performance audit.

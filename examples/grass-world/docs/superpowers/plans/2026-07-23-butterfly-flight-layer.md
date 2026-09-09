# Butterfly Flight Layer Implementation Plan

Date: 2026-07-23

Spec: `docs/superpowers/specs/2026-07-23-butterfly-flight-layer-design.md`

## Verification Note

Verification tier: Tier 3

Reason: adds a WebGL layer, PBR source assets, Timeline animation, hover
interaction, schema workload controls, pipeline ownership, persistence, and
preview/export output.

Run: targeted Vitest, TypeScript, `npm run ai:check`, affected browser
acceptance and performance scenarios, then one impact-derived
`npm run verify:delivery -- --tier=3` and `npm run dev`.

Skip: no full performance refresh; the user requested a feature rather than
explicit performance optimization.

## Task 1 — Add Exact Butterfly Sources And Product State

Files:

- `src/app/grass/assets/butterflies/` (four exact source maps)
- `src/app/grass/grass-defaults.ts`
- `src/app/grass/grass-settings-types.ts`
- `src/app/grass/grass-butterfly-controls.ts` (new)
- `src/app/grass/grass-controls.ts`
- `src/app/grass/grass-values.ts`
- focused value-reader module used by the current stabilization split

Actions:

1. Copy the 4K Base Color, Opacity, Normal, and Roughness JPEGs unchanged.
2. Add defaults for visibility, count, size range, seed, flight-height range,
   integer flight/wing cycles, and landing time.
3. Add `Butterflies` and `Butterfly Flight` sections using only built-ins.
4. Read bounded values into `GrassSettings["butterflies"]`.
5. Keep persistence at `v20`.

## Task 2 — Build Deterministic Layout And One Instanced PBR Resource

Files:

- `src/app/grass/grass-butterfly-assets.ts` (new)
- `src/app/grass/grass-butterfly-layout.ts` (new)
- `src/app/grass/grass-butterfly-resource.ts` (new)
- focused tests for layout and shader/resource contracts
- `src/app/grass/grass-scene.ts`

Actions:

1. Generate stable anchors/species/scales/headings/phases inside the Field and
   read landing height from the shared reference surface.
2. Create one two-wing instanced geometry with wing-side, atlas-index, and
   per-instance phase attributes.
3. Load the four exact maps once and configure Base Color as sRGB, all other
   maps as linear, alpha test, normal map, roughness map, and double-sided PBR.
4. Patch the retained material shader to select atlas cells and flap both wings
   without per-butterfly meshes or materials.
5. Update instance transforms from Timeline progress and the hover blend.
6. Dispose geometry, material, texture ownership, and animation state exactly
   once.

## Task 3 — Integrate Timeline, Hover, Diagnostics, And Export

Files:

- `src/app/grass/use-grass-butterfly-hover.ts` (new)
- `src/app/grass/use-grass-simulation-interactions.ts`
- `src/app/grass/grass-output.tsx`
- `src/app/grass/grass-render-diagnostics.ts`
- `src/app/grass/grass-export.ts`
- `src/app/grass/grass-scene.ts`

Actions:

1. Prepare butterfly assets and update layout through retained scene methods.
2. Render the flock in preview and both export paths at Toolcraft Timeline
   progress.
3. Raycast unpressed mouse/pen hover against Terrain; hover hit lands the flock,
   miss/leave/drag releases it.
4. Schedule bounded transition frames until landing/takeoff settles, including
   while playback is paused.
5. Publish layer visibility, requested/rendered counts, hover state, landing
   blend, and texture dimensions as observable diagnostics.
6. Keep touch and model-orbit ownership unchanged.

## Task 4 — Register Pipeline And Performance Ownership

Files:

- `src/app/grass/grass-render-targets.ts`
- `src/app/app-renderer-pass-definitions.ts`
- `src/app/app-renderer-interactions.ts`
- `src/app/app-renderer-pipeline.ts`
- `src/app/app-renderer-pipeline-types.ts`
- `src/app/grass/grass-performance-envelope.ts`
- `src/app/grass/grass-performance-scenarios.ts`
- `src/app/app-performance.ts`
- `src/app/app-performance-impact.json`
- `e2e/app-performance-path-adapters.ts`
- `e2e/app-kernel-benchmarks.ts` only if assessment requires a candidate

Actions:

1. Add executable resource and layout passes.
2. Add `butterfly-count` to the numeric envelope and real fixture adapter.
3. Add the count cost to scene render and export.
4. Map initial render, count/layout controls, motion controls, Timeline, hover,
   viewport, and export invalidation exactly.
5. Run render-plan assessment and implement no new kernel candidate unless the
   protected assessment requires it.

## Task 5 — Integrate Layer Semantics And Acceptance

Files:

- `src/app/grass/grass-world-generator.ts`
- `src/app/grass/grass-randomizer.test.ts`
- `src/app/app-control-section-inventory-data.ts`
- `src/app/app-acceptance-butterfly-data.ts` (new)
- `src/app/app-acceptance-data.ts`
- `src/app/app-product-readiness.ts`
- focused schema/product tests
- `e2e/grass-butterflies.spec.ts` (new)
- `e2e/grass-layer-visibility.spec.ts`
- `docs/toolcraft/agent-worklog.md`

Actions:

1. Add Butterflies to Scratch visibility and deterministic Scene Randomize.
2. Inventory both control sections and every target.
3. Add acceptance rows for visible/count/size/seed/height/cycles/landing time.
4. Prove Timeline movement, hover landing, pointer leave takeoff, independent
   visibility, reset/persistence, and preview/export inclusion.
5. Record source maps, renderer choice, interaction ownership, export mapping,
   performance role, proof, and remaining risks in the worklog.

## Focused Development Checks

```bash
npx vitest run \
  src/app/grass/grass-butterfly-layout.test.ts \
  src/app/grass/grass-butterfly-resource.test.ts \
  src/app/grass/grass-randomizer.test.ts \
  src/app/app-schema.test.ts \
  src/app/app-renderer-pipeline.test.ts \
  src/app/app-performance.gates.test.ts
npm run typecheck
npm run ai:check
npx playwright test e2e/grass-butterflies.spec.ts --project=chromium
```

If `appRenderPlanAssessment` requires a new butterfly candidate, add its exact
executable benchmark and run `pnpm verify:kernel` before delivery. Otherwise do
not add a fictional benchmark.

## Delivery Gate

```bash
npm run verify:delivery -- \
  --tier=3 \
  --unit-test=src/app/grass/grass-butterfly-layout.test.ts \
  --unit-test=src/app/grass/grass-butterfly-resource.test.ts \
  --browser-test="butterflies fly, land on terrain hover, and take off on leave" \
  --browser-test="butterfly controls update one independent PBR layer" \
  --performance-test="browser perf: butterfly count updates the retained flock"
npm run dev
```

## Steering Amendment — Realistic Staggered Landing

Files:

- `src/app/grass/grass-butterfly-layout.ts`
- `src/app/grass/grass-butterfly-resource.ts`
- `src/app/grass/grass-butterfly-controls.ts`
- `src/app/grass/grass-butterflies.test.ts`
- `e2e/grass-butterflies.spec.ts`

Actions:

1. Add a unique Seed-derived landing-order factor to every retained instance.
2. Keep delayed instances flying, then capture each instance's current pose at
   the moment its own approach starts.
3. Replace vertical interpolation with a curved horizontal approach, eased
   descent, turn bank, contact flare, and level landing pose.
4. Drive wing folding through a dynamic per-instance shader attribute.
5. Reverse the same staggered paths for takeoff and preserve interrupted
   transition continuity.
6. Interpret Landing time as the complete landing/takeoff wave and advance it
   from real elapsed time so low preview FPS cannot stall the transition.
7. Extend deterministic layout/resource tests and rerun the focused hover
   browser smoke before the protected delivery attempt.

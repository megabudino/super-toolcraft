# Independent Layer Distribution Maps Implementation Plan

Verification tier: Tier 3

Reason: Add one persisted Lawn map section and change Tall/Lawn/scan CPU layout ownership, visible counts, and renderer invalidation without changing material, lighting, export, animation, or draw-pass technique.

Run: Focused red/green Vitest, TypeScript, AI/code-health, targeted Tall/Lawn/scan browser acceptance, affected performance-config validation and only impact-required paths, then one protected delivery invocation.

Skip: No explicit full performance refresh because this is correctness work rather than a performance request; unrelated lighting, material-grade, wind, export-format, and navigation browser suites stay outside the development loop.

## 1. Lock The Correct Ownership With Failing Tests

Files:

- `src/app/grass/grass-layout-distribution.test.ts`
- `src/app/grass/grass-world-coverage.test.ts`
- `src/app/grass/grass-scan-layout.test.ts`
- `src/app/grass-product.test.ts`
- `src/app/app-schema.test.ts`
- `src/app/grass/grass-world-generator.test.ts`
- `src/app/grass/grass-randomizer.test.ts`

Add expectations that Tall uses raw Tall noise, Lawn uses a different `lawn.distribution` object, Tall edits leave Lawn/scans unchanged, Lawn endpoints give full/zero coverage, scan actual counts equal Count, and the schema exposes one `Lawn Distribution` section with the existing preview plus built-ins.

Run the focused tests and record the expected failures before implementation.

## 2. Add Lawn Distribution State And Controls

Files:

- `src/app/grass/grass-defaults.ts`
- `src/app/grass/grass-settings-types.ts`
- `src/app/grass/grass-values.ts`
- `src/app/grass/grass-distribution-values.ts`
- `src/app/grass/grass-lawn-controls.ts`
- `src/app/grass/grass-controls.ts`
- `src/app/grass/grass-noise-preview.tsx`

Add six `lawn.distribution*` defaults and normalized settings. Export `grassLawnDistributionSection` after `Lawn Cover`. Reuse `grassNoisePreview` for `lawn.distributionOffset`, add built-in Scale/Detail/Roughness/Seed/Black-white controls, and make the preview distinguish Tall and Lawn while sharing one Voronoi implementation and explicit `[0,0]`/`[1,1]` endpoint handling.

Persistence remains the existing localStorage policy; absent targets from older state fall back to defaults without a destructive persistence-version bump. Timeline, layers, media, settings transfer framework, and export surfaces are unchanged.

## 3. Make Tall And Lawn Maps Authoritative

Files:

- `src/app/grass/grass-layout.ts`
- `src/app/grass/grass-placement-candidates.ts`
- `src/app/grass/grass-world-coverage.ts`
- `src/app/grass/grass-layout-pass-inputs.ts`

Build one requested-size deterministic base candidate list and filter it once through the owning layer map. Remove larger-pool replacement from Tall/Lawn layout. Simplify `sampleGrassWorldCoverage` to direct Tall/Lawn mask evaluation and neutral coverage for non-grass channels, retaining coordinate-signature helpers.

## 4. Decouple Scans And Preserve Exact Count

Files:

- `src/app/grass/grass-scan-layout.ts`
- `src/app/grass/grass-field-shape.ts` only if a reusable inward footprint helper is necessary

Remove Tall/world coverage reads from Tufted, Wild, White, Yellow, Rocks, and Boulder. Generate deterministic centers from each scan Seed, apply Clumping, repair invalid footprint positions inward or to the valid base point, and retain exactly Count transforms. Choose the boulder from a deterministic footprint-safe candidate list.

## 5. Narrow Renderer Invalidation And Randomizer Output

Files:

- `src/app/grass/grass-render-targets.ts`
- `src/app/app-renderer-pipeline.ts`
- `src/app/app-renderer-scan-pipeline.ts`
- `src/app/grass/grass-world-generator.ts`
- `src/app/grass/grass-world-scale.ts` if target partitions require it
- `src/app/grass/grass-randomizer-test-utils.ts`
- `e2e/grass-scene-randomizer-palette-helpers.ts` only if canonical settings extraction needs the new Lawn map

Tall distribution invalidates only Tall layout, noise preview, and scene render. Lawn distribution invalidates only Lawn layout, noise preview, and scene render. Add Lawn map targets to Randomize and compile visible Lawn settings directly; keep scan diversity in their existing Count/Clumping/Seed controls rather than a hidden coverage system.

## 6. Update Acceptance And Performance Declarations

Files:

- `src/app/app-acceptance-basic-control-data.ts`
- `src/app/app-acceptance-data.ts`
- `src/app/app-product-readiness.ts`
- `e2e/grass-basic-control-fixtures.ts`
- `e2e/grass-tall-distribution.spec.ts`
- new `e2e/grass-lawn-distribution.spec.ts`
- `e2e/grass-megascans.spec.ts`
- `src/app/app-performance.ts`
- `src/app/app-performance-impact.json`
- affected performance tests/adapters only when required by the compiled path model

Declare the new section inventory and six controls, real preview/range compound coverage, Tall/Lawn isolation, exact scan Count, and Lawn-detail workload dimension. Map changed production modules only to the passes they can alter.

## 7. Verification And Worklog

Before proof, read the routed Verification documents. Then run:

- focused distribution/scan/schema/randomizer Vitest;
- focused acceptance and performance-config Vitest;
- `pnpm run typecheck`;
- `pnpm run ai:check`;
- targeted browser scenarios for Tall direct map, Lawn direct map, scan exact counts and isolation;
- impact-derived affected performance scenario only if the changed pipeline declaration requires it;
- `npm run verify:delivery` once at the completed batch boundary;
- `pnpm dev` and confirm the saved Toolcraft app URL.

Update `docs/toolcraft/agent-worklog.md` with Iteration 74, concrete state/output mapping, verification, and remaining risks. Do not edit `src/toolcraft`, signed host files, shared runtime configuration, timeline, layers, lighting, materials, wind, or export behavior.

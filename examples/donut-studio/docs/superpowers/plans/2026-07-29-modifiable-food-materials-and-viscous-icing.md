# Modifiable Food Materials and Viscous Icing Implementation Plan

## Scope

Implement the approved behavior in
`docs/superpowers/specs/2026-07-29-modifiable-food-materials-and-viscous-icing-design.md`
as one Tier 3 functional/visual delivery.

## 1. Lock the failing behavior with focused tests

- Extend `src/app/donut/donut-icing-geometry.test.ts` to require:
  - fixed deterministic topology;
  - continuous displacement across multiple tube rows;
  - an explicit `icing.flow` response;
  - independent visible thickness and drip-length bounds;
  - no single-row triangular teeth.
- Extend `src/app/donut/donut-materials.test.ts` to require strong bounded
  optical ranges and the new shader formulation/cache key.
- Update schema/value tests to require `icing.flow` and the split Icing Shape /
  Icing Flow section ownership.

## 2. Rebuild the icing boundary as viscous flow

- Add `flow` to `DonutSettings["icing"]`, defaults, clamped value reading, and
  scene/canvas geometry-setting dependencies.
- Replace single-row sine spikes in
  `src/app/donut/donut-icing-geometry.ts` with a deterministic periodic field of
  broad smooth lobes.
- Use smooth tube-row easing to pull a continuous coating patch downward and
  outward.
- Increase only fixed tessellation if the silhouette needs more sampling;
  vertex count remains invariant across control values.
- Add `icing.flow` to the icing-geometry renderer invalidation target set and
  bump the product renderer runtime id.

## 3. Make supplied PBR textures editable instead of colour-authoritative

- Rework `src/app/donut/donut-food-shader.ts` so scan luminance, normal, and
  roughness provide surface detail while selected colours remain dominant.
- Give Bake, Pores, Moisture, Variation, Glaze, and Texture clearly separated
  shader roles with visible 0–1 ranges.
- Rebalance `src/app/donut/donut-materials.ts` physical properties for food:
  broad useful roughness, restrained specular/clearcoat, negligible
  transmission, and soft bounded sheen.
- Keep retained materials and uniform-only updates; do not rebuild or recompile
  on slider movement.

## 4. Update Toolcraft schema and product contracts

- Split current icing controls in
  `src/app/donut/donut-schema-sections.ts`:
  - Icing Shape: Include, Coverage, Thickness, Clear.
  - Icing Flow: Flow, Drip length, Drip frequency, Detail.
- Update `appControlSectionInventory` and control acceptance rows in
  `src/app/app-acceptance-data.ts`.
- Update reference feature mapping in
  `src/app/donut/donut-reference-acceptance.ts`, marking viscous flow as an
  intentional user-requested improvement over the previous approximation.
- Keep panel ownership, orbit, persistence, timeline-none, layers-none, and PNG
  export unchanged.

## 5. Add real visual proof

- Extend `e2e/donut-product.spec.ts` with actual canvas-pixel comparison helpers
  that copy the WebGL canvas into a 2D buffer and compute changed-pixel ratio
  and mean RGB delta.
- Require representative donut colour/surface and icing colour/material
  extremes to cross meaningful pixel thresholds before the protected output
  helper emits evidence.
- Prove icing Flow, Thickness, and Drip length through the real browser canvas.
- Keep protected helpers as evidence authority; the new pixel assertions run
  before them and prevent state-only false positives.

## 6. Ownership and decision records

- Update `src/app/app-verification-impact.json` for every changed product module
  and nearest acceptance/pass ownership.
- Add Iteration 4 to `docs/toolcraft/agent-worklog.md` with the user's request,
  supplied material source, root-cause evidence, control/output mapping,
  renderer decision, unchanged timeline/layers/export decisions, and one bare
  delivery narrative.

## 7. Verification

During development:

```bash
pnpm vitest run src/app/donut/donut-icing-geometry.test.ts
pnpm vitest run src/app/donut/donut-materials.test.ts
pnpm vitest run src/app/donut/donut-schema.test.ts src/app/donut/donut-values.test.ts
pnpm ai:check
pnpm playwright test e2e/donut-product.spec.ts --grep "icing.flow|icing.thickness|icing.dripAmount|material"
```

At the delivery boundary:

```bash
npm run verify:delivery
npm run dev
```

Inspect the running app in a real browser at its verified Toolcraft URL. Do not
run measured performance or `npm run verify:perf`; the request authorizes a
functional/visual correction only.

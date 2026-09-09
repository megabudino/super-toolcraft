# Reference Fidelity Pass Implementation Plan

## Verification note

Verification tier: Tier 3

Reason: This batch changes default state, persistence, terrain/layout generation, grass vertex shaping, Megascans card reconstruction, instanced surface geometry, physical lights/shadows, camera framing, and preview/export pixels.

Run: AI check, focused unit tests, typecheck, build, affected browser acceptance and visual comparison, impact-derived delivery verification, and the existing/saved dev server URL.

Skip: Do not request an explicit full performance refresh because no performance complaint or optimization was requested. Do not alter render scale, export resolution, workload bounds, shell, controls, layers, or timeline behavior.

## Implementation tasks

1. Add deterministic reference composition math.
   - Create `src/app/grass/grass-reference-composition.ts` with field-scaled macro terrain, central-passage depression, surface height/slope helpers, tall-grass zone weight, and bounded moss-cushion layout.
   - Add `src/app/grass/grass-reference-composition.test.ts` proving the rear crown, lower left mound, central trough, low perimeter, deterministic cushions, and localized tall-grass weights.
   - Keep raw terrain noise helpers intact for the existing Terrain control preview and reuse them as micro-detail input.

2. Route every scene stratum through the same authored surface.
   - Update `grass-geometry.ts` so the plane follows reference surface height.
   - Update `grass-layout.ts` so Lawn and Tall Grass share the same height/slope; multiply Tall Grass visibility by the authored crown/tuft mask.
   - Update `grass-scan-layout.ts` so scans use the same height/slope and deterministic kind-specific cluster anchors rather than arbitrary whole-field walls.
   - Extend focused layout/scan tests for shared surface placement and restrained scan clusters.

3. Add true low-volume moss geometry.
   - Create `src/app/grass/grass-moss-cushion-resource.ts` with one retained low-segment hemisphere geometry and one bounded `InstancedMesh` sharing the ground material.
   - Update `grass-scene.ts` to build cushions with ground layout invalidation, preserve preview/export parity, configure bounded directional shadows, and dispose retained resources.
   - Ensure ground, moss cushions, scans, and rocks share physical tint/normal/roughness response without washing the material toward white.

4. Make grass read as fibers instead of pegs or cards.
   - Update `grass-material.ts` so per-instance tilt follows blade rotation and receives slight phase variation in both PBR and stylized shaders.
   - Reduce Tufted reconstruction in `grass-scan-resource.ts` from five crossed cards to three, retain alpha cutout and corrected DirectX normal scale, and enable bounded scan shadow participation.
   - Update shader/material tests or add source-level assertions where the current product tests inspect compile hooks.

5. Author the v4 reset composition.
   - Update `grass-defaults.ts` for a smaller field, denser but finer single-ribbon lawn, thin localized long procedural grass, restrained scan sizes/counts, deeper green PBR material, warm-lime light, and revised camera framing.
   - Update `app-schema.ts` persistence to `toolcraft:grass-studio:state:v4`.
   - Update realistic preset/product/schema tests and browser reset expectations to exact v4 values.
   - Do not add controls; `appControlSectionInventory`, panel actions, timeline, layers, settings transfer, and export paths stay structurally unchanged.

6. Keep performance ownership and product evidence current.
   - Add new production modules and exact affected pass ids to `app-performance-impact.json`.
   - Update `docs/toolcraft/agent-worklog.md` with this batch’s reference study, renderer decisions, rejected alternatives, state/output mapping, targeted checks, delivery result, and known performance risk.

7. Verify incrementally, then at delivery.
   - Run `npm run ai:check` before implementation feedback is considered complete.
   - Run focused Vitest files for reference composition, field/scan layout, realistic preset, product, and schema; then `npm run typecheck` and `npm run build`.
   - Use the real browser at the app’s saved port to inspect reset framing, macro silhouette, passage, lawn fibers, tall clusters, scan opacity, ground relief, and PBR rim/shadows against the supplied PNG.
   - Run focused PBR/HDRI, Megascans, dual-layer, output/export, orientation, and persistence browser tests selected by the implementation impact.
   - Run the protected `npm run verify:delivery` once for the coherent batch, preserving the documented skill-directory wrapper if the synthetic fallback test still requires it.
   - Run `npm run dev` and report the verified local URL. If protected delivery remains blocked only by the already documented maximum performance budgets, report exact counts without degrading visual quality.

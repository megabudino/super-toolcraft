# Tall Grass Density and Voronoi Distribution Plan

Verification tier: Tier 3
Reason: changes Tall Grass workload semantics, deterministic layout generation, a custom mask preview, renderer-pipeline invalidation, persisted controls, and visible canvas output.
Run: focused layout/value/schema tests, focused browser acceptance for exact authored count and mask interaction, typecheck, build, AI/code-health checks, current-source kernel verification if the render-plan assessor requires it, then one targeted `verify:delivery` invocation.
Skip: full performance refresh because the request fixes distribution correctness and adds controls; it does not request renderer speed or jank optimization.

## Root cause

1. `field.densityMax = 10_000` is first accepted by spacing capacity for the 7 × 5 m field.
2. `createGrassLayout` then silently multiplies that target by the baked reference mask average, `0.2602902879901961`, reducing the target to `2_603` roots.
3. The mask is fixed in source and has no editor controls, so the user cannot make the whole ground available.
4. The candidate budget also stops early: a full mask with 10,000 roots and 0.04 m spacing currently returns 9,172 roots.
5. Existing tests encode the baked-mask reduction as expected behavior and therefore protect the bug.

## Product decisions

- `Density max` is the authored target count, bounded only by the Tall Grass hard cap.
- `Distance min` is enforced during placement and is the only geometric reason the actual count may be below the target.
- Tall Grass receives an explicit procedural Voronoi distribution. White means maximum placement probability; black means no Tall Grass.
- The distribution owns Offset, Scale, Detail, Roughness, Seed, and Black/white levels, matching the editable shape of the terrain height-map workflow without coupling the two noise fields.
- The default mask covers the complete field with varied density and must still place the complete default/authored target whenever spacing permits.
- Lawn distribution and all PBR/material behavior remain unchanged.
- Persistence stays localStorage and advances to a new version for the new targets.
- Timeline, layers, image export, and video export behavior do not change; export consumes the same deterministic full layout as preview.

## Control Section Inventory

- `Tall Grass`: visibility, target count, minimum distance, surface offset, placement seed. This section owns layer capacity and root identity.
- `Tall Grass Distribution`: Voronoi preview, scale, detail, roughness, mask seed, and black/white levels. This section owns where Tall Grass may grow.
- `Tall Grass Placement`: normal alignment, azimuth variation, and optional top-facing filtering. This section owns orientation and terrain-facing rules after distribution.

Built-in controls: sliders for scale/detail/roughness/seed, `rangeSlider` for black/white levels. The existing custom preview interaction remains necessary because a built-in vector cannot display the generated grayscale field or support direct map panning.

## Implementation

1. Replace the baked raster mask module with a typed procedural Voronoi sampler shared by layout policy and preview semantics.
2. Separate target-count policy from spacing acceptance; make candidate exhaustion explicit and sufficiently bounded to fill 10,000 roots at 0.04 m under the default mask.
3. Add distribution defaults, typed settings parsing, schema controls, signatures, persistence, and settings-transfer coverage.
4. Extract reusable preview infrastructure from the terrain preview, then add the Tall Grass Voronoi preview without duplicating pointer/history/WebGL lifecycle code.
5. Register the preview and layout inputs in the canonical renderer pipeline and performance-impact inventory.
6. Update canvas diagnostics to expose target, actual, and distribution signature.
7. Replace bug-preserving tests with exact-count, deterministic-mask, black/white, seed, spacing, and full-field distribution coverage.
8. Update acceptance data, browser coverage, product readiness, and the Toolcraft worklog.

## Acceptance

- At `field.densityMax = 10_000`, 7 × 5 m, 0.04 m spacing, and the default distribution, the Tall layout contains exactly 10,000 roots.
- Raising/lowering Density changes the actual root count up to the physically permitted target and never applies a hidden mask-average multiplier.
- Changing each distribution target changes the preview signature and deterministic Tall layout without affecting Lawn.
- Black regions contain no roots; whiter regions receive more roots.
- Reset restores every distribution control and the preview offset.
- Settings survive reload and settings transfer under the new persistence version.
- Preview and export continue to use the same full-quality deterministic layout and unchanged materials.


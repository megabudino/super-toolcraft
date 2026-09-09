# Layer Solo Controls Design

## Goal

Add a built-in `switch` named `Solo` to every renderable scene layer so an artist can inspect that layer without permanently changing the other layers' `Include`, counts, seeds, placement, terrain shape, or material settings. Present `Solo` before `Include` wherever the two switches share a row.

## Renderable entities

- Tall Grass
- Lawn Cover
- Terrain surface and moss cushions
- Tufted Grass
- Wild Grass
- White Flowers
- Yellow Flowers
- Rocks
- Tundra Boulder

Lighting, color grade, export, blade-shape, and PBR-detail sections do not receive Solo because they are settings, not independently renderable entities. Terrain owns `solo.terrain` in its existing section; its separate `field.showGround` Include state remains in Surface and is never rewritten.

## State and behavior

Each entity owns one persisted boolean target under `solo.*`, defaulting to `false`. When no Solo target is active, each entity follows its existing `Include`/enabled value. When at least one Solo target is active, only active Solo entities render, and an active Solo still respects its own `Include` value. `solo.terrain` gates the retained ground mesh and moss cushions; any vegetation/rock Solo hides Terrain unless `solo.terrain` is also active. Multiple Solo switches may be active together for A/B inspection; disabling the last Solo restores the full composition exactly because no enabled/count/seed/layout value is rewritten.

## Control Section Inventory update

- Terrain / Shape: prepend built-in `Solo` targeting `solo.terrain` before Height map; the control isolates the renderable terrain result while the remaining controls continue to shape it.
- Tall Grass, Lawn Cover, Tufted Grass, Wild Grass, White Flowers, Yellow Flowers, Small Rocks, and Tundra Boulder / Distribute or Composite: keep the existing `Solo` and `Include` switches in one inline row, but order the row and schema controls as `Solo`, then `Include`.

## Control selection

Product need: temporarily isolate a renderable entity.

Value model: persisted boolean.

Candidate built-ins checked: `switch`, `actions`, `segmented`.

Best built-in: `switch`, because Solo is a stable on/off viewing state that must participate in reset, persistence, settings transfer, and acceptance.

Rejected alternatives: an action would require hidden local state; a segmented control cannot be repeated cleanly per entity; a custom control is unnecessary.

## Renderer mapping

Derive one shared solo mask from runtime settings. Apply it at existing layer visibility boundaries before rendering Terrain, Tall Grass, Lawn, scan families, rocks, and the boulder. Do not regenerate layouts or mutate source settings. Export consumes the same settings and therefore matches the live isolated preview.

## Verification

Verification tier: Tier 3.

Reason: extends schema behavior and custom-renderer visibility from eight to nine existing entities without changing workload limits, geometry generation, or renderer passes.

Run: focused unit/schema tests plus browser verification that Terrain Solo isolates the ground, another layer Solo hides Terrain, two simultaneous Solo layers form their union, reordered switch rows render Solo first, and clearing Solo restores the untouched composition; inspect console and source transforms; run the exact impact-derived delivery gate once.

Skip: full performance refresh because the change adds only a constant-time visibility target to existing scene-render passes and does not alter workload, resources, geometry, animation, export sizing, or viewport interaction.

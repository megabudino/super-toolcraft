# Logical control section order

Status: Complete

## Verification note

Verification tier: Tier 2

Reason: This batch changes only the order of existing schema sections in the controls panel. Targets, defaults, visibility, persistence, renderer output, timeline, layers, settings transfer, and export behavior remain unchanged.

Run: focused schema/order Vitest; TypeScript; AI/code-health; production build; a focused browser check that reads the real rendered section-heading sequence; one protected `verify:delivery` invocation with the exact affected unit/browser selectors; keep the app available on its saved development URL.

Skip: renderer performance scenarios and full performance refresh because section ordering does not change renderer passes, invalidation, resources, workload boundaries, canvas output, or animation.

## Product order

The controls panel follows the scene-authoring workflow and keeps every product entity contiguous:

1. Runtime setup and preview quality.
2. Scene generation, environment, lighting, and grade.
3. Field boundary, Terrain, Surface, and Surface Fade.
4. All Lawn sections: Cover, Blade, Appearance, gradient, instance colors.
5. All Tall sections: layer, distribution, placement, blade, appearance, gradient, instance colors.
6. Scanned vegetation, then rocks.
7. Wind and Surface Tilt.
8. Background and export.

Within Lawn and Tall, the sequence moves from presence/distribution to geometry and then material/color styling. No section is renamed, merged, split, added, or removed.

## Implementation

1. Reorder `grassControlSections` in `src/app/grass/grass-controls.ts` so Surface precedes the complete Lawn block and the complete Tall block.
2. Update the exact semantic section-order expectation in `src/app/app-schema.test.ts`.
3. Add a focused product Playwright test that proves the visible runtime headings render in the same order.
4. Update `docs/toolcraft/agent-worklog.md` with the decision trail and proof.

## Acceptance

- Lawn sections are adjacent with no Tall, Surface, scan, wind, or export section between them.
- Tall sections are adjacent with no Lawn, Surface, scan, wind, or export section between them.
- Surface and Surface Fade appear immediately after Terrain and before vegetation.
- Scanned vegetation and rocks remain after authored grass layers.
- Wind remains after scene content; Background and export remain last.
- The set of section titles and every control target remain unchanged.

## Verification result

- Exact schema-order and randomizer Vitest: 14/14 passed.
- TypeScript, Toolcraft AI/code-health, product boundary, and production build passed.
- Focused Playwright section-order scenario passed in Chromium.
- Controlled Chromium on the saved app URL returned the intended visible heading sequence, including contiguous Lawn and Tall blocks.
- Renderer performance was not rerun because this batch only changes schema array order.
- The protected delivery invocation passed integrity, docs, AI/code-health, product boundary, and 142/143 signed Node tests, then stopped at the pre-existing signed clean-home skills fallback assertion before product Vitest; no protected file was changed to bypass it.

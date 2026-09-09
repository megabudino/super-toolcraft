# Per-Layer Color Controls Implementation Plan

## Verification Note

Verification tier: Tier 3
Reason: The batch changes schema state, persistence, renderer invalidation, generated-grass shaders, and PBR scan/ground materials.
Run: Static source, schema-target, acceptance, and performance-impact audit only.
Skip: Executable tests and protected delivery proof at the user's request.

## Implementation

- [x] Add neutral per-layer defaults and built-in Contrast/Saturation sliders to Tall Grass, Lawn Cover, Surface, every scan section, and Tundra Boulder.
- [x] Extend `appControlSectionInventory`, acceptance rows, product readiness, and persistence expectations while preserving the existing v10 scene state.
- [x] Parse every target into bounded 0–2 material settings and add the targets to the existing render-only invalidation list.
- [x] Add one reusable material-color shader helper that chains with existing Standard/Physical material extensions without replacing sun-patch or grass shader behavior.
- [x] Apply independent retained uniforms to generated grass in stylized and PBR modes, ground/moss, all scan families, small rocks, and the Tundra Boulder.
- [x] Update renderer-pipeline metadata, performance risks, source-impact ownership, focused product tests, browser acceptance coverage, and worklog decisions without executing tests.
- [x] Perform a static audit for target/default/control/setting/uniform coverage and leave the existing local server running.

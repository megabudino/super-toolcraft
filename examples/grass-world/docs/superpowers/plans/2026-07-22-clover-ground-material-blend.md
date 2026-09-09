# Clover Ground Material Blend Plan

Verification tier: Tier 3
Reason: adds a second retained 4K PBR texture set, procedural mask controls and preview, ground-fragment shader blending, persistence, export-visible output, renderer invalidation, acceptance, and performance declarations.
Run: focused mask/value/schema/material tests, current-source render-plan and kernel proof when required, focused Playwright for black/current, white/Clover, mixed mask, reset and persistence, TypeScript, build, AI/code-health, then one protected delivery invocation with exact selectors when the lifecycle permits.
Skip: no explicit full performance refresh because the request adds a material feature rather than asking for renderer optimization; the protected delivery runner owns impact-derived performance proof.

## Source study

- Source: `/Users/kusnizza/Desktop/Clover Patches on Grass 4K.zip`.
- Asset: Megascans `Clover Patches on Grass` (`sgmkajak`), tileable 2 × 2 m surface, calibrated 4096 px/m source family.
- Use the supplied 4096 × 4096 BaseColor, AO, Normal, and Roughness maps as the second PBR material.
- Exclude Gloss and Specular because the renderer uses the metalness/roughness workflow; exclude Bump and Cavity because Normal and AO already own those responses; exclude Displacement because Toolcraft Terrain Height Map owns ground geometry and a material displacement pass would double-sculpt the surface.
- Preserve BaseColor in sRGB and treat AO, Normal, and Roughness as linear data.

## Product decisions

- Keep the existing Uncut Grass ground as material A and add Clover Patches as material B.
- Mix all four PBR channels with one procedural mask: black is existing ground, white is Clover, grey is a smooth physical blend.
- Use independent seeded fractal value noise with the same editable vocabulary as Height Map: draggable offset preview, Scale, Detail, Roughness, Seed, and Black/white levels.
- Keep mask settings independent from terrain height and Tall Grass distribution.
- Default to broad, softly blended Clover patches so both materials are visible.
- Keep current ground color grade, environment, Sun Patches, shadows, timeline, layers, and export actions. Preview and image/video export consume the same retained textures and mask uniforms.
- Advance localStorage persistence to v18 for the new targets.

## Control Section Inventory

- `Surface`: one complete ground-material workflow. It contains the current material controls, Clover texture scale/normal/roughness, and the draggable blend-mask preview with Scale, Detail, Roughness, Seed, and Black/white levels. Labels explicitly distinguish `Current` and `Clover` material parameters.

Control selection:

- Scalar material and mask parameters use built-in sliders.
- Black/white thresholds use built-in `rangeSlider` because they are a lower/upper remap pair.
- The map remains the existing shared `grassNoisePreview` custom control because built-in Vector cannot display the generated field or combine visual inspection with direct offset panning.

## Renderer and performance plan

1. Add compressed app-owned 4K WebP maps for BaseColor, AO, Normal, and Roughness.
2. Load and retain the Clover set in the existing source-scoped scan resource next to the current ground textures; clone per scene and dispose with that scene.
3. Add one focused ground-blend shader extension that preserves the existing ground result at mask 0 and mixes Clover base color, tangent normal, roughness, and AO at mask 1.
4. Evaluate bounded 1–6 octave procedural mask noise only in the existing ground draw, without new geometry or draw calls.
5. Extend the shared fixed-size WebGL noise preview with a third `clover` kind and a distinct cache identity.
6. Declare `clover-mask-octaves` as a bounded workload dimension consumed by the preview, scene-render, and export paths; keep resource decode source-scoped and all other material controls render-only.
7. Update exact invalidation: mask and Clover material controls redraw preview/scene as applicable but never rebuild Tall, Lawn, terrain, or scan layouts.

## Implementation

1. Add defaults, typed surface settings, value normalization, mask signatures, schema controls, section inventory, persistence v18, and settings-transfer coverage.
2. Add Clover texture assets and asset declarations.
3. Implement retained texture loading and the ground blend uniforms/shader.
4. Extend the shared noise preview, pipeline targets, runtime id, workload envelope, fixture adapter, kernel declaration, and impact inventory.
5. Expose a ground-blend signature diagnostic and update product readiness/acceptance.
6. Add unit and focused browser coverage, update the Toolcraft worklog, then run targeted and protected verification.

## Placement correction

Verification tier: Tier 2
Reason: renderer state, persistence targets, texture resources, shader behavior, and export output stay unchanged; only the schema grouping and visible acceptance inventory move the existing Clover controls into their expected `Surface` owner.
Run: exact schema/section inventory tests, TypeScript, AI/code-health, and one focused browser assertion that `Surface` contains the current material, Clover material, mask preview, and every blend control while no separate Clover sections remain.
Skip: kernel and performance refresh because no renderer pass, invalidation target, workload boundary, or source module changes.

Implementation: merge the existing Clover control records into `grassSurfaceSection` with unique internal keys and unambiguous labels; remove the two standalone section exports/order entries; consolidate `appControlSectionInventory`; adapt focused product and browser acceptance; update the worklog.

## Acceptance

- With the mask forced black, canvas output matches the current Uncut Grass ground material.
- With the mask forced white, BaseColor, AO, Normal, and Roughness come from Clover Patches across the ground.
- Intermediate levels produce stable soft spatial mixing without seams or a second draw call.
- Dragging the preview changes mask offset and ground output while Tall/Lawn layout signatures remain unchanged.
- Scale, Detail, Roughness, Seed, and both Black/white handles change the mask deterministically.
- Clover texture scale, normal strength, and roughness visibly affect only material B.
- Reset restores every Clover and blend default; v18 persistence and settings transfer retain them.
- Preview, PNG, and video use the same material blend and full-quality PBR maps.

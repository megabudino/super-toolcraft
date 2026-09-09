# Realistic Meadow Preset Design

## Goal

Make the default Grass Studio composition resemble the supplied compact mossy meadow reference: two broad terrain masses, a dense short carpet, restrained patches of tall grass and scans, a dark isolated backdrop, and believable physically based highlights and surface relief.

## Visible result

- Static preview opens with PBR enabled and wind disabled for look development.
- Broad low-frequency terrain replaces the current fine rolling field.
- Lawn Cover becomes the dominant vegetation layer; Tall Grass becomes a sparse accent restricted toward upward-facing terrain.
- Scan grasses form a few larger clusters, flowers remain rare, and rocks appear as isolated accents.
- Sunrise HDRI lights every material from a rotated back/side direction while the HDRI itself stays hidden against a near-black included background.
- Ground, rocks, grass scans, and flower scans use their downloaded normal maps with the correct DirectX-to-Three.js Y convention.
- Preview, image export, and video export continue to use the same scene and materials.

## Product decisions

- Update schema defaults rather than add another mode selector. The requested look becomes the product reset state and remains individually editable through the existing semantic sections.
- Advance persistence to `v3` so the requested preset is visible immediately instead of being masked by an older persisted `v2` state. Existing v2 browser state remains under its old key and is not overwritten.
- Keep Toolcraft Layers disabled: fixed renderer strata do not become reorderable document layers.
- Keep the playback timeline; the new reset state uses Wind Off, but users can still choose Breeze, Gust, or Blast and export video.
- Keep renderer strategy WebGL and the existing retained PMREM/instancing pipeline.
- Add controlled physical key/rim contribution alongside PMREM in PBR mode; do not replace HDRI illumination or create UI-only lights.

## PBR and normal-map correction

- Quixel normal atlases are treated as DirectX tangent-space maps. Three.js expects OpenGL tangent-space orientation, so use a negative Y normal scale.
- Ground normal strength remains user-controlled and maps percentage to `(x, -y)` scale.
- Rock normals use the full atlas at a strong but bounded scale.
- Double-sided foliage uses the supplied normal atlas at a moderate scale, preserving alpha cutout, AO, roughness, sheen, and environment response without the previous black-backface result.
- Normal maps remain linear data; Base Color remains sRGB.

## Control and state mapping

No new controls are introduced. Existing sections retain their ownership:

- Field / Terrain: compact dimensions, broad two-mass terrain and height range.
- Lawn Cover / Lawn Blade / Lawn Appearance: dominant short carpet.
- Tall Grass / Placement / Blade / Appearance: sparse upward-facing accent layer.
- Tufted Grass / Wild Grass / White Flowers / Yellow Flowers / Small Rocks: restrained clustered scan layers.
- Surface: moss texture scale, normal strength, roughness and tint.
- Scene Environment / Scene Lighting / Background: Sunrise PMREM, rotated backlight, hidden HDRI, near-black included background.
- Preview: Static and low three-quarter orientation.

## Verification tier

Verification tier: Tier 3

Reason: Defaults, persistence reset state, scene lighting, PBR foliage/rock/ground materials, preview pixels, and shared export rendering change without altering the runtime shell or renderer architecture.

Run: AI/code-health, typecheck, focused defaults/schema/material/product tests, current-source kernel gate if required by impact analysis, exact PBR/HDRI and Megascans browser proofs, one visual browser inspection of the reset state, and impact-derived `npm run verify:delivery` selectors.

Skip: No full performance refresh; the user requested visual fidelity, not performance work, and the existing quality-first maximum checkpoint is already documented.

## Acceptance

- Reset/default state reports Static preview, PBR enabled, Wind Off, Sunrise HDRI, hidden HDRI backdrop, included near-black background, and the authored preset counts/ranges.
- Every scan family remains non-empty and independently editable.
- Normal-map textures are bound on ground, rocks, and all plant materials with negative Y scale.
- Sunrise rotation/intensity changes visible rendered pixels while hidden HDRI continues to light materials.
- Preview and exported still use the same preset settings and non-empty PBR output.

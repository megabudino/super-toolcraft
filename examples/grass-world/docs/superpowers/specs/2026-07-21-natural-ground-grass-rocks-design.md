# Natural Ground, Grass, And Rocks Design

## Goal

Keep the current WebGL scene, Quixel scans, camera, HDRI, controls, and export path while removing the artificial visual cues visible in the current preset: washed-out moss, uniformly green ribbon grass, upright rocks, weak ground contact, and coarse shadow separation.

## Chosen Approach

Use a targeted renderer and deterministic layout pass. A settings-only change is insufficient because blade color and width are currently uniform and rock orientation has no seeded pitch or roll. Replacing the terrain renderer or scan assets would be disproportionate and would discard working controls and assets.

## Renderer Design

### Ground PBR

- Preserve the scanned 2K base color instead of recoloring it bright green.
- Use a near-neutral ground tint and remove the additional white mix.
- Reduce the global HDRI intensity and PBR tone-mapping exposure so the base color keeps midtone contrast.
- Use a moderately rough moss response, stronger normal response, and full AO contribution.
- Keep the existing texture scale and sun-patch projection.

### Grass Variation

- Derive deterministic micro and macro variation from the existing instance phase and world-space root position; no additional buffer, control, or random state is introduced.
- Vary ribbon width, height, rest bend, and albedo within narrow natural limits.
- Add a small warm/dry component to a minority of blades and clump-level value variation. Both Static PBR and the stylized fallback consume the same deterministic variation.
- Preserve current height ranges, wind response, density limits, and layout invalidation.

### Rocks

- Keep the five real scan meshes and their Base Color, AO, Normal, and Roughness maps on `MeshStandardMaterial`.
- Add deterministic pitch and roll in addition to the existing terrain-normal alignment and yaw.
- Add scale-aware automatic burial below the terrain while preserving the user-authored surface-offset adjustment.
- Apply subtle per-instance neutral color/value variation so repeated scans do not read as clones.
- Keep rocks static; rigid-body simulation is not needed for a composed landscape.

### Shadows And Lighting

- Retain directional shadow casting/receiving for ground, grass, scans, and rocks.
- Use softer higher-resolution PCF shadows, a tighter directional shadow volume, and smaller bias so small rocks make visible contact shadows without obvious detachment.
- Reduce fill/exposure rather than increasing sun-patch darkness, preserving the requested lit/shaded composition.

## State And Persistence

No new visible controls are added. Existing Ground Color, HDRI Intensity, Surface Normal, Surface Roughness, rock count/size/clumping/seed/surface-offset, and grass controls remain authoritative. Update their visual defaults where needed and bump persistence so the requested corrected preset becomes the active default while retaining the rest of the imported preset values.

## Performance

The grass variation is constant-cost shader arithmetic using existing attributes. Rock transforms and colors rebuild only on the existing bounded rock-layout pass. The shadow map increases GPU memory and shadow raster cost but remains bounded by the current scene and is justified by the quality-first static/export preset.

Verification tier: Tier 3
Reason: Changes affect WebGL material output, scan transforms, shadow rendering, and persisted defaults.
Run: Static source/impact audit only.
Skip: Automated unit, browser, delivery, and performance tests because the user explicitly requested no tests for this iteration.

## Acceptance

- Ground shows the original brown/olive moss variation without pale green washout.
- Sunlit areas retain texture and normal detail instead of clipping toward flat green.
- Grass contains restrained hue/value/width variation without rainbow noise or visible repeating bands.
- Rocks no longer appear uniformly upright or placed on top of the surface.
- Rocks retain scanned PBR detail and produce readable soft contact shadows.
- Existing controls, density caps, animation, and exports remain structurally unchanged.

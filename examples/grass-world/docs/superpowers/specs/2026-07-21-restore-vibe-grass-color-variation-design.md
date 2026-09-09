# Restore Vibe And Grass Color Variation Design

## Goal

Restore the scene appearance from before the natural-ground/rock pass, then add visible but controlled color diversity to procedural Tall Grass and Lawn Cover without changing their shape, density, lighting, ground, scans, or shadows.

## Regression Finding

The supplied after-frame is darker and less lively because the previous pass simultaneously reduced HDRI intensity and PBR exposure, replaced the saturated ground multiplier with a neutral tint, increased surface contrast, and changed the shadow response. Those scene-wide changes dominate the much smaller grass-color variation.

## Chosen Approach

Revert the entire previous visual pass except for color-only grass variation. This is preferable to tuning the new look because the user explicitly prefers the prior vibe, and preferable to a settings-only approximation because the prior constants and scan layout are known exactly.

## Restored Scene

- Restore Ground Color `#39b844`, HDRI Intensity `176%`, Surface Normal `82%`, Surface Roughness `92%`, and rock Surface offset `-0.015`.
- Restore the five-percent white ground mix, PBR exposure `1.2`, 1024px PCF directional shadows, previous shadow bounds/bias, and previous rock PBR constants.
- Remove the added rock instance color, pitch/roll, and automatic burial fields so the scan layout/resource return to their prior behavior.
- Advance persistence to v9 so the restored defaults replace the disliked v8 state on reload.

## Grass Color Variation

- Add built-in `slider` controls named `Color variation` to `Tall Grass Appearance` and `Lawn Appearance`.
- Use independent targets `appearance.colorVariation` and `lawn.colorVariation`, each ranging from 0–100% and classified as responsiveness controls.
- Default Tall Grass to 58% and Lawn Cover to 38% so the taller patches carry more visible hue/value diversity while the short carpet remains cohesive.
- Derive deterministic per-blade and clump variation from existing `aOffset` and `aPhase` attributes. No buffer, layout rebuild, random per-frame state, or workload dimension is added.
- Blend between the original gradient and a natural cool-green/warm-olive/value-shifted result. At 0% the original shader color path is preserved exactly.
- Apply the same variation model in Static PBR and stylized/Dynamic materials. Do not vary blade height, width, bend, alpha, or wind response.

## State And Output Mapping

Both sliders write through Toolcraft schema state, reset to their defaults, persist through v9, update retained uniforms only, and affect preview, still export, and video export through the shared scene renderer.

## Performance

Both controls invalidate only existing scene-render passes. The shader performs fixed-cost arithmetic over existing attributes, so schema maxima, layout counts, workload dimensions, fixture adapters, and resource lifecycles remain unchanged.

Verification tier: Tier 3
Reason: Reverts WebGL material, scan-transform, shadow, and persisted-default output while adding two renderer-facing schema controls and shader uniforms.
Run: Static source, schema-target, acceptance, and impact audit only.
Skip: Unit, typecheck, shader compilation, browser, performance, and protected delivery tests because the user explicitly requested no tests.

## Acceptance

- Reload restores the brighter, more saturated pre-v8 scene vibe.
- With either Color variation slider at 0%, that layer retains its original editable gradient with no additional tint variation.
- Increasing Tall Grass variation changes only Tall Grass colors; increasing Lawn variation changes only Lawn Cover colors.
- Variation is stable across frames, camera movement, preview modes, and export.
- Ground, scans, rock placement, grass geometry, wind, density, and shadow configuration match the pre-v8 implementation.

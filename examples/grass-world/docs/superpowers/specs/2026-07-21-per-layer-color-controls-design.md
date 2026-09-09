# Per-Layer Color Controls Design

## Goal

Add independent Contrast and Saturation controls for every visible material layer instead of applying one global grade to the completed frame. The controls must cover generated Tall Grass and Lawn Cover in both stylized and PBR modes, the PBR ground, every downloaded scan layer, small rocks, and the Tundra Boulder.

## Chosen Approach

Apply color adjustment to each material's base color inside the material shader. This keeps HDRI lighting, normals, roughness, highlights, shadows, alpha, and the scene background physically independent from color grading. A scene-wide post-process was rejected because it cannot separate grass, flowers, ground, and stones and would also alter the HDRI background.

## Controls

- Tall Grass: `appearance.colorContrast` and `appearance.colorSaturation` in `Tall Grass Appearance`.
- Lawn Cover: `lawn.colorContrast` and `lawn.colorSaturation` in `Lawn Appearance`.
- PBR ground and moss cushions: `surface.colorContrast` and `surface.colorSaturation` in `Surface`.
- Every scanned foliage, flower, and small-rock layer: an independent pair inside that layer's existing section.
- Tundra Boulder: an independent pair inside `Tundra Boulder`.

Every control is a built-in full-width slider from 0–200%, defaults to a neutral 100%, and is a responsiveness input rather than a workload input. Scan color controls are conditionally visible with their corresponding layer.

## Material Model

- Saturation mixes material base color with perceptual luminance. `0%` is grayscale, `100%` is unchanged, and `200%` doubles chroma.
- Contrast expands or compresses base color around a restrained linear-light midpoint. `100%` is unchanged.
- Generated grass shares one grading function and independent uniforms per grass stratum. The function is used by both the physical material and the stylized material.
- Standard/physical scan and ground materials apply the same function after their color texture and tint are combined but before lighting is evaluated.
- Alpha, opacity maps, normals, AO, roughness, sheen, sun patches, and geometry are untouched.

## State And Output Mapping

All sliders write Toolcraft schema state, reset to their schema defaults, persist through the existing v10 namespace, invalidate only the existing scene-render passes, and flow through the shared preview, PNG, and video renderer. Keeping v10 preserves the user's tuned scene; missing new targets resolve to their neutral schema defaults. No material is recreated and no layout is rebuilt when a color slider moves.

## Performance

The feature adds fixed fragment-shader arithmetic and retained uniforms to existing materials. Existing blade, scan, terrain, and pixel workload dimensions already bound the affected passes; no new workload dimension, fixture adapter, resource pass, or kernel benchmark is required.

Verification tier: Tier 3
Reason: Adds renderer-facing controls and material shader behavior across generated and scanned layers, while preserving existing geometry and resource lifecycles.
Run: Static source, schema-target, acceptance, and performance-impact audit only.
Skip: Unit, typecheck, shader compilation, browser, performance, and protected delivery tests because the user explicitly requested no tests.

## Acceptance

- Existing appearance remains unchanged at the neutral 100% defaults.
- Contrast and Saturation affect only their named layer in preview, PNG, and video.
- Tall Grass and Lawn Cover controls work in both stylized and PBR modes.
- A scan layer's controls do not recolor other scans, the ground, or generated grass.
- PBR normals, roughness, light response, shadows, alpha cutouts, and HDRI/background remain unchanged by color controls.

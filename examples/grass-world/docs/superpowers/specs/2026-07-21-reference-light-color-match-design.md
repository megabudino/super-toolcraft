# Reference Light And Color Match

## Goal

Make the Grass Studio reset scene match the supplied reference's color and light as closely as the current geometry allows. The target is a black studio background, a warm high/back-left sun, cool readable shade, golden edge light on long grass, matte mossy surfaces, restrained green saturation, and broad light/shadow masses without crushed blacks or chalky highlights.

Reference: `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-69f0b71e-2365-41cf-825d-af4d585064fa.png`.

## Visual Study

- The reference subject has median luminance `0.376`; the reproduced current scene measures `0.202`.
- The reference 95th-percentile highlight is `0.823`; the current scene is `0.599`.
- The reference median saturation is `0.500`; the current scene is `0.672`.
- Dominant reference colors progress through `#122710`, `#2b4522`, `#486434`, `#6a8549`, `#9eac5d`, and `#d6d983`.
- The reference uses a true black background. The current reset uses `#616161`.
- The light reads as a warm, elevated back-left key with a cooler skylight fill. Highlights collect on upper silhouettes and long blades; front/low masses remain readable rather than black.
- The current result is dark because the light direction and strong Sun Patches attenuation place too much of the field below the useful midtone range. Its reset greens and ground tint are also too saturated, while rocks become too bright when HDRI intensity alone is raised.

## Product Decisions

### Reference reset

- Preserve the user-authored composition exactly: Tall/Lawn counts, all five scan counts, enabled layers, seeds, clumping, size ranges, offsets, terrain, camera, and the visible hero boulder remain unchanged.
- Keep a black studio background and art-direct HDRI, direct sun, fill, rim, exposure, Sun Patches, material grade, and PBR response only.
- Lower only the Lawn physical profile from `6–12 cm` to `3–5 cm` and narrow its blades so the existing 30,000-instance layer reads as ground cover rather than a second tall-grass layer. This change is explicitly requested after the composition-preservation correction; count, seed, and placement remain unchanged.
- Advance persistence only to surface the corrected reference reset; never use persistence to replace authored layout values.

### Light Balance controls

Add one `Light Balance` section using built-in controls:

| Need                    | Built-in | Target                     | Reference intent |
| ----------------------- | -------- | -------------------------- | ---------------- |
| warm direct light       | `color`  | `environment.keyColor`     | warm gold        |
| direct-light energy     | `slider` | `environment.keyStrength`  | defined key      |
| cool shadow color       | `color`  | `environment.fillColor`    | blue-green       |
| cool shadow readability | `slider` | `environment.fillStrength` | restrained fill  |
| silhouette separation   | `color`  | `environment.rimColor`     | soft green-white |
| edge-light energy       | `slider` | `environment.rimStrength`  | bounded edge     |
| ACES exposure trim      | `slider` | `environment.exposure`     | near-neutral     |

The controls remain separate from HDRI source/orientation. They scale retained lights and tone-mapping state; they do not reload or refilter the HDRI.

### Material palette

- Replace acid reset greens with the measured olive/moss family while keeping every existing per-layer Contrast/Saturation/PBR control editable.
- Use reference-derived Tall/Lawn gradients while keeping every per-layer material control editable.
- Use a warmer, less saturated ground tint while preserving the supplied BaseColor/AO/Normal/Roughness maps.
- Keep grass and ground matte; retain enough sheen/backlight for golden upper edges without emission.
- Darken and desaturate stones so they remain accents instead of white focal points.
- Keep the hero boulder enabled and retain scan counts `190 / 402 / 178 / 136 / 18` exactly.

### Final lighting grade

Add one built-in-only `Color Grade` section with global Contrast, Saturation, Highlight warmth, and Shadow coolness. Unlike the existing per-material albedo controls, this grade runs after PBR lighting, Sun Patches, and tone mapping but immediately before output color-space conversion. It therefore creates the spatial warm-highlight/cool-shadow split and S-curve visible in the reference without changing geometry or adding a framebuffer pass.

## Renderer Mapping

- `readGrassSettings` normalizes seven Light Balance targets and four final Color Grade targets.
- `GrassSceneRenderer.updateSceneLighting` applies the authored key color, key multiplier, fill multiplier, rim color, and rim multiplier to retained Three.js lights.
- `GrassSceneRenderer.render` multiplies the existing physically selected ACES exposure by the authored exposure trim.
- Preview, PNG/JPG, MP4, and WebM continue to use the same retained scene and settings.
- The material shader adds bounded post-light grading uniforms but no new render pass, texture, geometry, framebuffer, or per-instance state.

## Control Section Inventory

- `Scene Environment`: HDRI source and custom file.
- `Scene Lighting`: HDRI intensity, XYZ orientation, visible backdrop, and backdrop blur.
- `Light Balance`: key color/energy, fill color/energy, rim color/energy, and exposure trim.
- `Color Grade`: final-scene contrast, saturation, highlight warmth, and shadow coolness.
- `Sun Patches`: deterministic broad light/shadow pattern.
- Existing material sections keep their own PBR and color controls.

## Persistence, Timeline, Layers, Export

- Persistence remains localStorage and advances for the corrected reference reset while preserving the user's layout defaults.
- Timeline mode, layer policy, camera interaction, and export controls remain unchanged.
- The same light/material result is used in preview and every export path.

## Performance And Verification

Verification tier: Tier 3.

Reason: renderer pixels, defaults, persistence, lighting controls, preview, still export, and video export change, while retained resource/workload topology stays fixed.

Development proof: visual browser comparison at the reference camera, console inspection, exact control-to-render target audit, Vite transforms, and current server identity.

Skipped by standing user request: automated unit/typecheck/build/browser-acceptance/performance suites and `npm run verify:delivery`.

## Acceptance Criteria

- Reset/reload shows a black background.
- Reset/reload retains scan counts `190 / 402 / 178 / 136 / 18`, one hero boulder, and the original seeds/placement.
- Lawn Cover remains 30,000 instances but reads as a low `3–5 cm` carpet.
- Subject luminance distribution is materially closer to the reference: readable shadow masses, bright but not white-clipped upper grass, and a strong warm/cool split.
- Greens are visibly less synthetic and less saturated.
- Rocks stay darker than the brightest grass highlights.
- Every Light Balance control changes retained preview pixels and the same export renderer.
- Reset restores the new reference values.

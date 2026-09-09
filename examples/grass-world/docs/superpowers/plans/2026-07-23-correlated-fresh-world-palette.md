# Correlated fresh world palette

Status: Complete

The user approved implementation in this request. Randomize continues to build from the currently authored scene, but color is now varied as one coordinated material palette instead of changing Ground alone.

## Verification note

Verification tier: Tier 3

Reason: The change expands Scene Randomize across existing color targets and corrects the grass fragment shader's strongly yellow procedural variation. This changes rendered canvas pixels in the live scene and export path, while leaving pass topology, resource counts, workload bounds, controls, timeline, layers, camera, lighting, and export mechanics unchanged.

Run: focused palette/generator/randomizer/readiness unit tests; TypeScript and production build; the exact Scene Randomizer browser acceptance; visual browser sampling across several generated worlds; affected renderer-path proof for `grass-scene-resource`, `grass-scene-render`, and `grass-export-frame`; one protected `verify:delivery`; keep the app available on its saved development URL.

Skip: full performance refresh because the request does not optimize performance, add work per frame, change draw counts, or change workload limits. Scan shaders and scan resource layout remain unchanged.

## Product result

- `Randomize` creates one deterministic palette mood for the whole world.
- Current Ground, Clover, Tall grass, Lawn grass, tufted vegetation, wild vegetation, flowers, rocks, and boulders read as members of the same fresh natural composition.
- Generated vegetation cannot drift into the orange/straw band that looks scorched under the authored Sunrise lighting.
- Lighting, HDRI, color grade, PBR response, texture assignments, masks, wind, fade, camera, canvas size, and export settings remain exactly as authored.
- The existing Ground color is no longer the only color that varies.
- Current Ground and Clover albedo receive their own correlated generated hues at a fixed 92% tint strength while retaining each source texture's luminance structure.
- No new control is added. The existing `Scene Setup` / `Randomize` action remains the single entry point.
- Scratch preserves the currently generated palette exactly while returning terrain/content distribution to its authored baseline, as it does today.

## Control and runtime inventory

- Controls: unchanged; no schema target or visible section is added or removed.
- Sections: unchanged.
- Timeline: unchanged.
- Layers: unchanged.
- Persistence: unchanged. Generated values continue to use the current Toolcraft state and persistence behavior.
- Renderer technique: existing WebGL/Three.js renderer and registered passes remain unchanged.
- Export: existing live and export material paths both receive the same shader correction.

## Palette ownership

Randomize owns these existing color targets as one transaction:

1. `appearance.groundColor`
2. `surface.cloverColor`
3. `appearance.bladeGradient`
4. `appearance.instanceColor1`
5. `appearance.instanceColor2`
6. `appearance.instanceColor3`
7. `lawn.bladeGradient`
8. `lawn.instanceColor1`
9. `lawn.instanceColor2`
10. `lawn.instanceColor3`
11. `scan.tufted.pbrTint`
12. `scan.wild.pbrTint`
13. `scan.white.pbrTint`
14. `scan.yellow.pbrTint`
15. `scan.rocks.pbrTint`
16. `scan.boulder.pbrTint`

The two gradients contain three color stops each, so the sixteen targets resolve to twenty concrete colors. Missing or malformed authored values fall back target-by-target to the corresponding `grassDefaults` value before the deterministic transform is applied.

Randomize does not own light colors, background, shadow colors, grade controls, saturation/contrast controls, surface material parameters other than Clover color, or any wind parameter.

## Color model and invariants

Palette construction lives in a focused pure module using OKLCH conversions with deterministic gamut mapping. A single `worldId` selects a shared vegetation hue, chroma character, temperature, and lightness bias. Each material role then receives a small bounded offset from that shared mood.

- Vegetation uses a fresh green family. Chromatic grass and foliage stay in a green/green-yellow range and never enter the orange/straw range.
- Gradient and instance-role ordering stays intact: root is darker than middle, middle is darker than tip; instance 1 is darker than instance 2, which is darker than instance 3.
- Tall and Lawn retain distinct authored contrast and lightness relationships while their hue shifts stay visibly related.
- Current Ground and Clover are independently derived from their authored colors, share one correlated surface role, and retain bounded chroma.
- Tufted vegetation receives a restrained green correction so its baked dry texture no longer dominates the composition.
- Wild vegetation remains chromatic and follows the shared vegetation hue.
- White and yellow flower atlas tints stay near-neutral so petals retain their authored identity; only a very small shared temperature adjustment is allowed.
- Rocks and boulders stay low-chroma neutral materials with a subtle shared temperature shift.
- Gradient metadata (`angle`, type, positions, and opacities) remains byte-identical; only stop colors change.
- A `worldId` plus the same baseline produces a byte-identical palette.
- Repeated generation recovers the authored/manual baseline before applying the next world, so color does not accumulate drift.

## Manual-edit and recovery contract

The Ground-only runtime marker is replaced by a complete palette marker containing deep-cloned generated and reference values per target.

- If a current target still equals its generated marker value, the next randomization starts from its saved reference value.
- If the user manually changes one target, only that target becomes a new reference; unchanged generated targets still recover their original references.
- A manual change to one gradient stop updates the reference for that gradient without corrupting other targets.
- Import/reload without a runtime marker treats the visible imported palette as the new baseline.
- Marker state remains scoped to the existing dispatcher `WeakMap`; it is never serialized as product state.

## Grass shader correction

The grass shader no longer uses the hard warm multiplier `vec3(1.12, 0.93, 0.62)`, which removed too much blue and turned bright blades yellow under warm light. It now uses a small symmetric cool/warm variation and normalizes the varied color back to the base gradient luminance before applying `uColorVariation`.

This preserves spatial color detail and the existing color-variation control without introducing a baked dry/yellow bias. Do not change normals, roughness, AO, lighting, tone mapping, shadows, or material response.

## Ground albedo tint

- `grass-ground-blend-material.ts` applies the selected Current Ground color to the base material and the selected Clover color to the Clover material with a fixed `mix(..., 0.92)` strength.
- The tint is first scaled to the sampled albedo luminance, then gamut pressure compresses chroma only. Texture light/dark structure, normals, roughness, AO, shadows, exposure, and external lighting remain unchanged.
- Live preview and export use the same retained material path, so Ground color does not diverge between outputs.

## Completed implementation

1. `grass-world-color-transform.ts` owns deterministic OKLCH conversion, gamut mapping, world mood generation, and role-aware color transforms.
2. `grass-world-colors.ts` owns all sixteen targets, assembles twenty concrete colors, and performs per-target baseline recovery.
3. `grass-randomizer.ts` retains palette marker state per dispatcher without changing action, history, persistence, or Scratch behavior.
4. Generator/randomizer tests and product copy describe a correlated natural palette and exact preservation of lighting/HDRI/material response.
5. `grass-material.ts` uses luminance-preserving symmetric micro-variation instead of the hard yellow-biased warm multiplier.
6. Acceptance data, product readiness, and the exact E2E scenario cover full-palette variation, correlated/natural bounds, exact environment preservation, and Scratch preservation.
7. `app-performance-impact.json` records the new transform and palette orchestration modules with explicit ownership.

## Performance ownership

- `grass-world-color-transform.ts`, `grass-world-colors.ts`, `grass-randomizer.ts`, and `grass-world-generator.ts` are `functional`: they run only when Randomize compiles a new world and add no per-frame work.
- `grass-material.ts` remains `performance`-owned by `grass-scene-resource`, `grass-scene-render`, and `grass-export-frame`.
- `grass-ground-blend-material.ts` remains `performance`-owned by the same three passes.
- The batch adds no render pass, draw call, texture resource, geometry, workload dimension, animation update, or per-frame CPU loop.

## Verification status

Implementation is complete. Focused palette/generator/randomizer/readiness/Ground-blend Vitest passes 41/41; TypeScript, AI/code-health, product-boundary, and production build checks pass. The exact twenty-color Scene Randomizer Playwright acceptance passes, and controlled Chromium confirms separate correlated Current Ground/Clover colors plus fresh grass/foliage under the unchanged Sunrise lighting. The protected delivery command was invoked in sandbox and with the required elevated localhost retry; the retry passed 142/143 signed infrastructure tests and stopped only on the pre-existing clean-home skill-fallback assertion before product/performance receipt generation, so no protected delivery receipt was minted.

## Acceptance criteria

- Several consecutive generated worlds have different complete palette signatures and no repeated palette within the sampled sequence.
- Tall and Lawn hues move together rather than independently.
- Bright vegetation colors do not fall in the orange/straw hue band.
- Current Ground and Clover vary independently but remain compatible with one another and the vegetation palette.
- Flowers remain recognizably white/yellow and stones remain neutral.
- Light/HDRI/grade/material-response signatures are byte-identical before and after Randomize.
- Scratch keeps the generated palette byte-identical.
- Ninety-six sequential palette generations from an unchanged authored baseline do not accumulate color drift.
- A manual edit to any one palette target becomes only that target's new baseline.
- Live preview and PNG/video export use the same corrected grass color variation.

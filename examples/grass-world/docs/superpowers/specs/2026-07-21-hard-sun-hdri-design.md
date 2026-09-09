# Hard Sun HDRI design

Verification tier: Tier 3

Reason: the batch adds a bundled HDR source and changes scene environment intensity, directional-light balance, stylized lighting contrast, reset persistence, and final WebGL/export pixels without adding a workload dimension or changing schema limits.

Run: focused HDRI/settings/renderer tests, the exact HDRI/PBR browser scenario, controlled Chromium visual comparison, one impact-derived `npm run verify:delivery`, then `npm run dev`.

Skip: a full performance refresh because this is visual lighting work, not an explicit performance request; the retained PMREM source lifecycle and renderer workload boundaries are unchanged.

## Goal

Add a selectable high-contrast CC0 HDRI that produces a bright sun-facing side and a gently shaded opposite side like the supplied meadow reference. Make it the reset environment so the reference lighting is visible immediately.

## Source and visible behavior

- Bundle Poly Haven `Qwantani Noon (Pure Sky)` at 1K Radiance HDR plus its 320×240 picker thumbnail.
- Expose it as `Hard Sun` in the existing `Scene Environment` image picker.
- Keep the HDRI hidden by default against the black product background while using it for reflections and material illumination.
- Reset to 165% intensity and the reference-calibrated 90° rotation.
- Keep `Intensity` and `Rotation` as the only user controls: rotation turns the sun around the island and intensity scales both fill and key light.
- For the preset source only, reduce PMREM/hemisphere fill, strengthen the decoded dominant directional light, reduce the rim, and increase stylized directional contrast. A custom uploaded HDRI continues to use neutral tuning.

## Control section inventory

- `Scene Environment`: existing product entity; target `environment.preset` gains one image-picker item and `environment.hdriFile` remains the custom override. No new control is needed.
- `Scene Lighting`: existing workflow stage; `environment.intensity`, `environment.rotation`, `environment.visible`, and `environment.backgroundBlur` keep their current ownership and behavior.

## State and renderer mapping

- `environment.preset = hardSun` resolves to the new retained HDR source.
- One preset tuning record supplies bounded environment-fill, ambient, key, rim, exposure, and stylized-contrast multipliers.
- The displaced ground and existing 1,800-instance Tall Grass stratum cast the bounded 1024px key shadow; the 30,000-instance Lawn Cover remains excluded.
- `GrassSceneRenderer` applies the tuning only when the effective source is the bundled hard-sun preset; preview, PNG, and every video frame use the same scene path.
- Persistence advances to v6 so current sessions receive the new reset environment.

## Acceptance

- Unit coverage proves the seventh picker item, source/cache mapping, reset state, and contrast tuning.
- HDR decoding coverage proves the new 1024×512 asset and a materially stronger dominant-light ratio than the overcast source.
- Browser coverage selects all seven HDRI items and observes real pixel changes; controlled visual QA confirms a bright and shaded slope with no renderer exception.

## Performance

The source swaps through the existing environment-resource pass and creates no new pipeline pass, control target, or workload dimension. Hard-sun tuning is uniform/light-property work inside existing final-render passes; the added custom-depth draw is bounded to the existing Tall Grass count while Lawn Cover stays out of the shadow map.

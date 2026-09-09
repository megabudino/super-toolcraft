# Strawberry Party Default Design

## Goal

Use `/Users/kusnizza/Downloads/donut-studio-settings (2).json` as the
clean-start authority for Donut Studio, make Strawberry Party the first and
default named flavor, preserve the other nine supplied flavor appearances, and
publish the verified result to the linked `donut` Vercel production project.

## Source Authority

- Source SHA-256:
  `9b66e72baba26f9cdb2738afa95e8e461ec299161b0c16769cf7babeb3f4824a`.
- The top-level Settings Transfer envelope supplies the clean-start canvas,
  selected flavor, render scale, image-export settings, editable product
  values, and Strawberry camera pose.
- The embedded version-1 `donut-studio-presets` document supplies the complete
  ten-flavor factory library.
- Strawberry Party moves to index zero. The remaining flavors keep their
  relative order and their supplied appearance values. Custom stays last in
  the Flavor control.

## Default And Preset Data Flow

The existing typed preset/default boundaries remain in place. The bundled
preset resource receives the embedded factory scenes, reordered with Strawberry
Party first. `DONUT_PRESET_DEFAULT`, schema control defaults, reset behavior,
and the registered preset-library default all resolve to Strawberry Party.

The app-level `DONUT_DEFAULTS` reproduce the top-level settings snapshot,
including the Strawberry geometry, icing, sprinkle, material, plate,
background, studio-light, render-scale, and PNG/4K export values. The supplied
Strawberry camera becomes the shared named-preset orientation through the
existing normalization boundary. Infinity canvas and the existing 170% named
preset zoom remain unchanged.

No new controls, persistence keys, renderer passes, or runtime behavior are
introduced. Existing persisted user work remains authoritative on reload;
Reset controls and Reset flavor expose the new clean-start/factory defaults.

## Compatibility And Error Handling

Imported and persisted preset libraries continue to parse through the current
version-1 normalizer. Known flavor IDs and labels remain stable, so existing
settings files still load. Malformed documents keep the existing last-valid
fallback behavior. Generic validation messages replace Matcha-specific wording
where the first/default preset assumption is enforced.

## Verification And Deployment

Verification tier: Tier 2 — schema/product defaults, preset ordering,
persistence defaults, reset behavior, and Settings Transfer output change.

Development verification covers the preset resource, default settings,
schema, and preset-library unit tests plus focused browser acceptance for
`donut.preset` and `donut.presetLibrary`. At the delivery boundary, one bare
`npm run verify:delivery` produces the protected targeted receipt. Measured
performance is skipped because renderer passes, invalidation, resources, and
workload bounds are unchanged.

After successful verification, deploy from `examples/donut` with the linked
Vercel project `donut` using a production deployment. Confirm the CLI reports a
ready production deployment and stable production alias; do not infer success
from an unrelated repository or website deployment.

# Scan PBR Controls And 1000-Instance Limits

## Product goal

Make every downloaded Megascans material art-directable from its own semantic section instead of hiding important PBR constants in renderer code. Increase the authored population ceiling for every repeatable scan layer to 1000 instances.

## Editable entities and control inventory

Each existing scan section remains the owner of its Include selector, placement controls, and material controls. The large sections use explicit semantic groups rather than splitting the Include selector away from controls it gates.

| Section entity | Distribution and placement                                 | Shared PBR controls                                           | Plant-only PBR controls |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------------------- | ----------------------- |
| Tufted Grass   | Include, Count, Size range, Clumping, Seed, Surface offset | Tint, Brightness, Contrast, Saturation, Roughness, Normal, AO | Sheen, Backlight        |
| Wild Grass     | Include, Count, Size range, Clumping, Seed, Surface offset | Tint, Brightness, Contrast, Saturation, Roughness, Normal, AO | Sheen, Backlight        |
| White Flowers  | Include, Count, Size range, Clumping, Seed, Surface offset | Tint, Brightness, Contrast, Saturation, Roughness, Normal, AO | Sheen, Backlight        |
| Yellow Flowers | Include, Count, Size range, Clumping, Seed, Surface offset | Tint, Brightness, Contrast, Saturation, Roughness, Normal, AO | Sheen, Backlight        |
| Small Rocks    | Include, Count, Size range, Clumping, Seed, Surface offset | Tint, Brightness, Contrast, Saturation, Roughness, Normal, AO | None                    |
| Tundra Boulder | Include, Size, Seed, Surface offset                        | Tint, Brightness, Contrast, Saturation, Roughness, Normal, AO | None                    |

Plain `color` owns Tint. Continuous sliders own all scalar material properties. Metallic remains physically fixed at zero because grass, flowers, and stone are dielectric materials; exposing it would primarily enable incorrect results. Alpha cutoff remains an asset/coverage safety constant rather than a PBR art-direction setting.

## Material behavior

- Tint and Brightness multiply the decoded sRGB BaseColor in the retained material before physical lighting.
- Contrast and Saturation keep the existing linear-base-color shader path.
- Roughness scales the decoded Roughness map.
- Normal scales the decoded DirectX normal map while preserving its inverted Y channel.
- AO changes only ambient-occlusion strength.
- Sheen changes the existing physical foliage sheen.
- Backlight adds a bounded view-dependent thin-foliage diffuse term after physical lights, allowing blades facing away from the key light to remain readable without making them emissive.
- Tufted Grass resets to a white Tint, reduced AO, and modest Backlight so the dark-clump defect is corrected by the new default material rather than a special hidden exception.

## Count limits and performance

`scan.tufted.count`, `scan.wild.count`, `scan.white.count`, `scan.yellow.count`, and `scan.rocks.count` all use a hard maximum of 1000. Their existing defaults remain unchanged. The five existing workload dimensions remain separate and take their new boundaries from schema; retained instanced-mesh capacities and deterministic layout clamps use the same shared contract. Maximum scan cardinality becomes 5000 instances. Boulder remains zero-or-one and Ground remains one continuous surface, so neither receives a Count control.

This raises an existing workload envelope rather than adding a new renderer pass or dimension. Resources remain retained; material sliders invalidate only the existing scene-render/export passes, while Count continues to rebuild only its layer's layout.

## Runtime and product policy

- Custom renderer: retained Three.js/WebGL pipeline stays unchanged in structure.
- Timeline: unchanged; material and count controls feed the same preview and export frames.
- Layers panel: unchanged; fixed semantic strata remain controls-panel entities rather than reorderable generic layers.
- Persistence/settings transfer: keep the current namespace so existing scenes survive; missing material targets resolve to defaults.
- Export: preview, PNG/JPG, MP4, and WebM share the same retained materials and controls.
- Custom controls: none; all values fit built-in Toolcraft controls.

## Verification classification

Verification tier: Tier 3
Reason: Schema controls, workload maxima, retained material parameters, a foliage shader term, preview/export pixels, and maximum instance capacity change.
Run: targeted static target/default/settings/material/invalidation/performance-impact audit plus transformed-module and server-identity checks.
Skip: automated unit, type, build, browser, performance, and protected delivery suites under the user's standing request not to run tests; the in-app browser has already rejected this localhost URL by policy.

# Scene-wide HDRI implementation plan

Verification tier: Tier 4
Reason: This batch moves HDRI ownership from one grass material mode to the whole WebGL scene, changes retained environment decoding and every material response, adds bundled media, and affects preview plus still/video export.
Run: `npm run ai:check`, `npm run typecheck`, focused HDR/HDRI/product tests, focused scene-HDRI Playwright acceptance, affected kernel/performance proof if the render-plan assessment requires it, then one `npm run verify:delivery` and `npm run dev`.
Skip: No full performance refresh is requested; ordinary delivery should use impact-derived targeted renderer proof. Unrelated Megascans or wind behavior will only be touched when required to keep the shared scene environment correct and buildable.

## Product behavior

- `Scene Environment` owns the bundled visual preset picker and one custom Radiance HDR upload. A custom file overrides the selected preset until removed.
- `Scene Lighting` owns environment intensity, world-space rotation, backdrop visibility, and backdrop blur.
- Environment controls remain available in Static and Dynamic preview, independent of the grass `PBR shader` switch.
- The `PBR shader` switch changes only the Lawn Cover and Tall Grass material model in Static preview.
- One retained PMREM environment lights every `MeshStandardMaterial` and `MeshPhysicalMaterial`: terrain, Megascans ground maps, scan vegetation, rocks, PBR lawn, and PBR tall grass.
- Stylized lawn and tall-grass shaders receive an ambient tint, dominant light direction, and intensity derived from the same decoded HDR pixels, including custom uploads.
- Preview, PNG/JPG export, and MP4/WebM frame rendering call the same scene preparation and material mapping.
- The bundled CC0 library expands from Meadow, Alps, and Sunrise to six deliberately distinct conditions: Meadow, Alps, Sunrise, Overcast Field, Forest Shade, and Golden Sunset.

## Control Section Inventory

| Section | Product entity | Targets | Grouping reason |
| --- | --- | --- | --- |
| Scene Environment | Scene image-based lighting source | `environment.preset`, `environment.hdriFile` | The preset and custom file are mutually overriding sources for the same scene environment. |
| Scene Lighting | Shared scene illumination and backdrop | `environment.intensity`, `environment.rotation`, `environment.visible`, `environment.backgroundBlur` | These values tune one retained environment used by every material and both export paths. |
| Tall Grass Appearance | Tall-grass material model and color | existing `appearance.*` targets | PBR remains a material model selector and no longer owns scene lighting. |

Built-ins: `imagePicker` is the exact owner for visual presets, `fileDrop` for custom HDR, sliders for continuous intensity/rotation/blur, and switch for backdrop visibility. No custom controls are needed. Persistence remains `values`, `media`, `canvas`, `panels`, and `timeline`, so both selected presets and custom files restore after reload.

## Renderer and workload plan

1. Keep one memoized `grass-environment-resource` pass keyed only by preset or uploaded source. PBR mode must not invalidate or decode the environment.
2. Decode a compact lighting profile while converting RGBE pixels, without a second file fetch or GPU readback.
3. Retain the PMREM texture and derived lighting profile until the source changes. Intensity and rotation invalidate only scene rendering, not decoding, geometry, or scan resources.
4. Feed profile uniforms to both procedural grass strata and explicit environment intensity to physical scan/ground materials.
5. Apply environment-resource invalidation to both static and dynamic render passes because the scene environment is no longer static-PBR-only.
6. Existing HDR source size remains bounded to one uploaded file; six bundled options are finite and only one is decoded at a time. No workload envelope dimension changes.

## Files and proof

- Controls/schema: split environment schema from `grass-appearance-controls.ts`, compose it in `grass-controls.ts`, and update section inventory/readiness/acceptance wording.
- Assets/data: add three local 1K HDR files and 320×240 previews under `src/app/grass/assets/hdri`; extend `grass-hdri.ts`, defaults, and value parsing.
- Renderer: update `grass-hdr.ts`, `grass-material.ts`, `grass-layer-resource.ts`, `grass-scan-resource.ts`, `grass-scene.ts`, `grass-output.tsx`, and canonical renderer pipeline/impact ownership.
- Tests: extend HDR decoding/profile unit tests, product schema/options tests, conditional visibility coverage, persistence, and a focused browser test that proves the environment remains active with PBR off and in Dynamic while preset/intensity changes alter rendered pixels.
- Worklog: record source URLs/licensing, shared material mapping, export parity, targeted checks, delivery receipt, and remaining risks.

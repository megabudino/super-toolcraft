# Dual Grass Layers Implementation Plan

Verification tier: Tier 4
Reason: The delivery adds a second independently authored instanced layer, changes renderer resources and workload dimensions, and affects Static, Dynamic, image export, video export, persistence, acceptance, and browser performance paths.
Run: `npm run ai:check`; targeted Vitest and Playwright while developing; protected kernel benchmark if the render-plan assessment requires it; one `npm run verify:delivery` at the delivery boundary; `npm run dev`; live browser inspection.
Skip: No product checks are skipped. The Layers panel remains disabled because these are two fixed semantic strata with mandatory order, not a reorderable/groupable item collection.

## Product behavior

- Render two persistent full-field strata:
  - `Lawn Cover` is a short dense surface carpet, never receives wind deformation, and remains spatially distributed over the full terrain in both preview modes.
  - `Tall Grass` is the current grass layer and remains the only layer driven by directed wind, timeline playback, and the Dynamic upper-layer preview count.
- Both strata share field dimensions, terrain, camera, background, HDRI lighting, and export dimensions.
- Both strata expose independent enable, density/spacing, seed, root offset, blade shape, gradient, stylized material, and PBR response values.
- Static renders the authored counts of both strata. Dynamic renders separately adjustable full-field samples for Lawn Cover and Tall Grass; only Tall Grass changes with timeline progress.
- PNG/JPG and video export always render the authored counts of both enabled strata. Video animates only Tall Grass.
- Global PBR remains Static-only and lights both layers from the same environment while each layer retains its own roughness, sheen, and gradient.

## Control Section Inventory

- `Field`: shared field width and length only; both layers consume the same surface extent.
- `Terrain`: shared procedural height-map controls.
- `Preview`: Static/Dynamic mode, Tall Grass preview count, Lawn Cover preview count, and the shared orientation gizmo.
- `Lawn Cover`: enable, density, minimum spacing, root offset, and seed for the fixed lower stratum.
- `Lawn Blade`: curve resolution, thickness, short height range, taper, tilt, and 3D ribbons.
- `Lawn Appearance`: stylized material, physical roughness/sheen, and root-to-tip gradient for Lawn Cover.
- `Tall Grass`: enable, density, minimum spacing, root offset, and seed for the existing upper stratum.
- `Tall Grass Placement`: normal alignment, random rotation, and slope coverage/fade for the upper stratum.
- `Tall Grass Blade`: existing upper blade geometry controls.
- `Tall Grass Wind`: existing directed wind controls; no Lawn Cover targets.
- `Tall Grass Appearance`: existing upper stylized/PBR response and gradient.
- `Surface`: ground visibility and color beneath both grass strata.
- Existing HDRI, Background, Image Export, Video Export, and sticky output sections remain product-owned as before.

## State and schema

- Preserve existing upper-layer targets where practical to keep settings migration stable; add `grass.enabled` for its visibility.
- Add `lawn.enabled`, `lawn.densityMax`, `lawn.distanceMin`, `lawn.depthOffset`, `lawn.seed`, `lawn.curveResolution`, `lawn.thickness`, `lawn.heightRange`, `lawn.taperEnd`, `lawn.tilt2d`, `lawn.use3d`, `lawn.materialStyle`, `lawn.pbrRoughness`, `lawn.pbrSheen`, and `lawn.bladeGradient`.
- Add `preview.lawnBladeCount`; retain `preview.bladeCount` as the Tall Grass Dynamic cap.
- Keep values persistence and settings transfer; Reset returns every new target to a schema default.

## Renderer and export

- Generalize deterministic layout generation around a typed layer specification while retaining the shared terrain sampler.
- Retain separate Lawn Cover and Tall Grass geometry, uniforms, stylized material, physical material, and mesh resources inside one WebGL scene.
- Keep mandatory draw order by root offset/depth semantics: ground, Lawn Cover, then Tall Grass. Do not expose reorder or grouping.
- Set all Lawn Cover wind uniforms to zero and exclude timeline progress from its frame signature.
- Rebuild only the affected layer layout when that layer's distribution or blade topology changes.
- Update preview/export orchestration to pass independent instance limits; export uses unlimited authored counts for both.
- Extend the canonical renderer pipeline with a Lawn Cover layout pass and map both authored and preview counts to exact workload dimensions and combined fixtures.

## Files

- Schema/control/default/value work: `src/app/app-schema.ts`, `src/app/grass/grass-defaults.ts`, `grass-controls.ts`, `grass-appearance-controls.ts`, and focused new layer-control/value modules as needed.
- Renderer work: `src/app/grass/grass-layout.ts`, `grass-geometry.ts`, `grass-material.ts`, `grass-scene.ts`, `grass-output.tsx`, `grass-export.ts`, and focused new retained-layer modules to stay within code-health budgets.
- Pipeline/performance work: `src/app/app-renderer-pipeline.ts`, `app-performance.ts`, `app-performance-impact.json`, and affected e2e adapters/kernel candidates.
- Product proof: `src/app/app-acceptance-data.ts`, focused acceptance data modules, product Vitest tests, and product Playwright tests.
- Decision evidence: `docs/toolcraft/agent-worklog.md`.

## Acceptance

- Lawn Cover and Tall Grass toggles independently add/remove their own visible pixels without changing the other layer's authored state.
- Each layer's density, spacing/seed, blade height/thickness, material, gradient, roughness, and sheen changes that layer's retained output.
- Dynamic playback changes Tall Grass frame evidence while Lawn Cover frame evidence remains stable.
- Static/Dynamic samples cover the complete terrain for both layers.
- PNG/JPG and video include both enabled layers at authored density; background and HDRI behavior remain unchanged.
- Reset, settings transfer, reload persistence, timeline seam, camera orbit/gizmo, and output dimensions remain correct.

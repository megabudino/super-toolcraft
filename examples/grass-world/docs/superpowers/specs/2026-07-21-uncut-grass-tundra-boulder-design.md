# Uncut Grass Ground And Tundra Boulder Design

## Goal

Replace the current Mossy Forest Floor PBR surface with the supplied Uncut Grass scan and add one large, physically shaded Tundra Mossy Boulder whose placement can be changed deterministically with a seed.

## Source Assets

- `/Users/kusnizza/Desktop/Tundra Mossy Boulder 4K.zip` contains the `Uncut_Grass_oeeb70_4K` seamless surface maps. Use BaseColor, AO, Normal, and Roughness for the terrain.
- `/Users/kusnizza/Desktop/Tundra Mossy Boulder.zip` contains `Tundra_Mossy_Boulder_vivvecldw_High.fbx` plus its 4K BaseColor, AO, Normal, and Roughness maps.
- Convert both texture sets to 2048px WebP assets. This preserves the current ground texture memory class, gives the hero boulder twice the linear texture resolution of the existing small-rock atlas, and avoids four 4K maps per asset consuming an excessive uncompressed GPU budget.
- Convert the FBX into the existing compact `meshbin` position/normal/UV format. Normalize its longest dimension to one metre and place the root at the lowest geometry point so runtime scale and surface contact are predictable.
- Do not use Gloss, Specular, Bump, Cavity, Displacement, or Fuzz in this delivery. The renderer already owns metallic/roughness PBR, terrain geometry supplies macro displacement, and the boulder has physical geometry.

## User-visible Output

- The terrain uses the Uncut Grass albedo, AO, normal, and roughness maps everywhere the ground is visible, including preview and all exports.
- One Tundra Mossy Boulder appears by default, uses its own PBR maps, follows the generated terrain height/normal, casts a directional shadow, receives lighting/shadow, and participates in Sun Patches.
- Changing Seed moves the boulder to a different guarded location across the field and changes its yaw while remaining deterministic for the same terrain and seed.
- The boulder remains a fixed semantic stratum rather than a generic Toolcraft layer. Layers stay disabled.

## Control Selection Inventory

### Tundra Boulder

- Product need: include or remove the hero boulder.
- Value model: boolean.
- Best built-in: `switch`.
- Target: `scan.boulder.enabled`.
- Renderer/export mapping: toggles the retained boulder mesh in preview and export.
- Acceptance: visible count changes between zero and one without changing Small Rocks.

- Product need: set hero-boulder scale.
- Value model: continuous scalar in metres.
- Best built-in: `slider`.
- Target: `scan.boulder.size`.
- Domain/default: 0.6–3.2 m, step 0.05 m, default 1.65 m.
- Renderer/export mapping: updates one retained object transform.
- Acceptance: silhouette and shadow size change while placement remains deterministic.

- Product need: choose another deterministic field location.
- Value model: bounded integer seed.
- Best built-in: `slider`.
- Target: `scan.boulder.seed`.
- Domain/default: 0–100, step 1, default 23.
- Renderer/export mapping: rebuilds one deterministic transform from guarded field-space coordinates plus yaw.
- Acceptance: seed changes visible boulder placement and the same seed restores it.

- Product need: seat or lift the boulder relative to the generated surface.
- Value model: continuous metre offset.
- Best built-in: `slider`.
- Target: `scan.boulder.surfaceOffset`.
- Domain/default: −0.6–0.3 m, step 0.01 m, default −0.12 m.
- Renderer/export mapping: shifts the retained boulder root along world Y after terrain sampling.
- Acceptance: contact height changes without changing seed or size.

Rejected controls: Count and Clumping because the product entity is exactly one hero boulder; Vector position because the user explicitly requested seeded placement; orientation gizmo because this control owns scene view rotation, not authored boulder placement; rigid-body controls because the scene is static and deterministic.

## Control Section Inventory

- Title: `Tundra Boulder`
- Product entity: one large mossy boulder.
- Workflow stage: Distribute.
- Targets: `scan.boulder.enabled`, `scan.boulder.size`, `scan.boulder.seed`, `scan.boulder.surfaceOffset`.
- Grouping reason: visibility, scale, seeded placement, and terrain contact fully describe the single hero prop. Four controls remain within the normal two-to-seven section size.

The existing `Surface` section keeps its controls; only its PBR source asset changes. Existing Small Rocks remain independent.

## State And Persistence

- Add a typed `scans.boulder` settings object with `enabled`, `seed`, `size`, and `surfaceOffset`.
- Advance schema persistence from v9 to v10 so the new default hero boulder appears on reload while retaining all current authored defaults.
- Reset restores the four boulder defaults through ordinary schema `defaultValue` behavior.

## Renderer And Resource Design

- Register the ground and boulder URLs in `grass-scan-assets.ts`.
- Extend the retained `GrassScanFieldResource` with one source-lifetime boulder geometry/material/mesh. Prepare it in the existing `grass-scan-resource` pass and dispose it with the scan field.
- Extend the existing rock-layout cache key and `grass-rock-layout-build` invalidation with the four boulder targets. Updating Small Rocks or the boulder can share this pass because the boulder contributes a fixed O(1) transform beside the existing bounded rock-layout work.
- `createGrassBoulderLayout` derives a guarded `unitX/unitZ` pair from the seed, maps it through the existing field-shape helper, samples the current procedural surface height/normal, and generates a deterministic yaw. Size and surface offset remain direct authored values.
- Updating the `rocks` scan layout also updates the hero boulder. The Small Rocks visible count remains independent; a separate boulder observable reports zero or one.
- Extend the renderer-technique inventory with a `tundra-mossy-boulder` WebGL product foreground layer.
- Preview, PNG/JPG, and video reuse the same scene resource and therefore keep asset, transform, lighting, and shadow parity.

## Performance Model

Reachable new inputs are the four boulder controls and two build-time asset archives. The archives are converted before runtime and are not runtime external inputs.

- `grass-scan-resource`: one initial/memoized main-thread decode adds one mesh and four 2K textures. Source lifetime remains unchanged.
- `grass-rock-layout-build`: adds one constant-time transform to the existing bounded small-rock layout pass. Seed, size, offset, field dimensions, and terrain settings invalidate this pass.
- `grass-scene-render` / `grass-dynamic-scene-render` / `grass-export-frame`: add one retained standard-material draw when included.
- All four controls use `performanceRole: responsiveness`. There is no new workload dimension because boulder cardinality is fixed at zero or one and cannot grow.
- No kernel benchmark is required: renderer strategy, execution location, source lifecycle, and draw topology remain the already assessed retained WebGL path.

## Acceptance

- Schema/unit coverage proves all four targets, defaults, bounded parsing, deterministic layout, and independence from Small Rocks.
- Browser acceptance proves the resource signature, default visible boulder, Include visibility/output, Size, Seed, and Surface offset through real controls.
- Ground replacement is asserted through the registered asset URLs/resource signature and visually checked in the running app.
- Renderer/performance inventory names the new layer and the fixed resource/draw risks.

## Verification Note

Verification tier: Tier 3

Reason: New binary texture/geometry assets, a retained PBR mesh, scene resource loading, layout invalidation, four controls, persisted defaults, preview pixels, and export pixels change without altering renderer architecture or numeric workload maxima.

Run: asset conversion diagnostics plus static source/asset/signature/target/impact inspection; keep the existing development server available.

Skip: automated unit, build, browser, performance, and protected delivery checks under the user's standing request not to run tests. No protected receipt will be claimed.


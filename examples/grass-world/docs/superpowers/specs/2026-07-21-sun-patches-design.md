# Sun Patches design

Verification tier: Tier 3

Reason: the batch adds a world-space light/shadow mask to every field material plus seven controls, changing Static PBR, Dynamic, preview, still export, and video pixels without adding a renderer pass, unbounded geometry, or workload dimension.

Run: no automated unit, type, build, browser, performance, or delivery commands because the user asked to keep tests disabled. Keep the existing development server running.

Skip: all automated proof and `verify:delivery`; this implementation does not claim a new protected receipt.

## Goal

Create large controllable islands of sunlight and shade across the field. HDRI rotation continues to set global light direction and color; the new local mask sets where bright and shaded areas appear.

## Visible behavior and controls

Add a `Sun Patches` section immediately after `Scene Lighting`:

- `Include`: enables the local sun/shadow mask.
- `Scale`: controls the world-space size of the patches from fine breakup to broad reference-like masses.
- `Coverage`: controls how much of the field lies in shade.
- `Softness`: widens or tightens transitions between sun and shade.
- `Strength`: controls the light ratio without making shadow regions fully black.
- `Offset`: a built-in two-axis Vector that moves the pattern across the field; both X and Y parts are direct-authored and map to world X/Z.
- `Seed`: chooses a deterministic pattern variation.

The section contains seven controls. `Include` remains visible; the six dependent controls use `visibleWhen` and hide when the effect is off.

## Control selection and inventory

- Sliders are stepped-continuous controls because all numeric domains have many meaningful values and should update live.
- `Offset` uses the built-in `vector` because it is a stable user-authored two-axis position. It is not timeline, camera, model-orbit, or simulation state.
- No custom control, orientation gizmo, layer, timeline change, panel action, or export control is required.
- Existing `Scene Lighting` remains responsible for global HDRI intensity/orientation/background. `Sun Patches` is a separate local illumination entity.

## Renderer mapping

- Add one shared retained uniform record and deterministic GLSL world-space value-noise function.
- Evaluate the same multi-octave mask from world XZ coordinates for the ground/moss material, every Megascans material, Static PBR grass, and Dynamic stylized grass.
- Apply the mask after normal/PBR lighting so downloaded normals, roughness, sheen, HDR-derived tint, and real object shadows remain visible inside both sun and shade.
- Rotate the sampling field with the existing HDRI Y angle so the local pattern remains visually coherent when the sun direction turns.
- Map normalized Vector Offset values to a bounded ±8 world-unit travel range. Preview, PNG/JPG, and each video frame use the same settings and material uniforms.

## Defaults and persistence

- Include: on.
- Scale: 3.6 m.
- Coverage: 42%.
- Softness: 38%.
- Strength: 66%.
- Offset: `{ x: 0, y: 0 }`.
- Seed: 37.
- Keep persistence v6; missing targets in older state resolve to schema defaults while existing field and HDRI settings remain preserved.

## Acceptance and performance

- Acceptance metadata covers every visible control; Offset declares `vector.x` and `vector.y` compound-part coverage.
- Product expectations prove bounded parsing and a changed render key. Authored browser coverage changes all scalar controls and both vector axes through the real UI when verification is next enabled.
- All controls invalidate only `grass-scene-render`, `grass-dynamic-scene-render`, and `grass-export-frame`. They must not invalidate HDR decode/PMREM filtering, layouts, scan decode, or retained scene resources.
- The mask adds a constant, fixed-octave fragment calculation to existing materials. No count, resolution, topology, source-size, or output-size boundary changes, so no workload dimension or kernel comparison is introduced.

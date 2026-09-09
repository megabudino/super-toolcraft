# Ground shadow controls

Status: Complete

## Verification note

Verification tier: Tier 3

Reason: The batch adds one persistent controls section and one retained WebGL shadow mesh that changes preview and image/video export pixels. It adds one fixed draw call to the existing scene-render/export passes but no workload dimension, variable loop, texture, framebuffer, layout rebuild, animation, timeline, layer, or export mechanism.

Run: focused settings/schema/shadow-resource Vitest; TypeScript; AI/code-health and product boundary; render-plan assessment; production build; a focused browser scenario that proves every Ground Shadow control changes the real WebGL result; the exact impacted delivery selectors once at the coherent boundary; keep the saved development URL running.

Skip: full performance refresh because the user requested a visual feature rather than optimization and the new shader is constant-cost within existing bounded passes. No new protected kernel candidate is required because the canonical renderer is already WebGL and the implementation adds no high-frequency variable-cost rasterization strategy choice.

## Product behavior

- Add `Ground Shadow` directly after `Surface Fade`, before Lawn.
- The section owns six built-in controls:
  - `Vertical offset`: negative metres below the ground plane.
  - `Front / back`: signed metres along the field depth axis.
  - `Scale`: uniform horizontal silhouette scale around the field center.
  - `Blur`: world-space edge softness in metres.
  - `Color`: one plain shadow color.
  - `Strength`: 0–100%, where zero disables the layer.
- The shadow follows Field width, length, Roundness, Irregularity, and Terrain seed so its silhouette stays correlated with the authored ground boundary.
- The shadow is a world-horizontal underlay rather than a child of the pointer-driven Surface Tilt transform, so the surface can visibly separate from its grounding shadow.
- The shadow is shown only while Terrain is visible and is rendered identically in live preview, PNG/JPG, MP4, and WebM.
- Randomize does not change shadow settings; settings transfer, persistence, reset, undo, and redo work automatically through schema state.

## Control inventory

Product need: Grounding shadow under the complete field.

Value model: Four bounded geometry sliders, one color, and one strength slider.

Candidate built-ins checked: `slider`, `color`, `colorOpacity`, `vector`.

Best built-ins: Full-width `slider` for spatial/softness/strength values and `color` for hue.

Why: The requested offsets are independent one-dimensional authored parameters; color and strength must remain separate because Strength controls the whole procedural layer, not only color alpha.

Rejected alternatives: `vector` because front/back and vertical use different axes, ranges, and semantics; `colorOpacity` because opacity is the named layer-strength parameter; a blurred texture because it would add resolution-dependent blur and resource lifecycle; real light shadow-map offsets because they would also move cast shadows across vegetation and Terrain.

Targets: `groundShadow.offsetY`, `groundShadow.offsetZ`, `groundShadow.scale`, `groundShadow.blur`, `groundShadow.color`, `groundShadow.strength`.

Renderer/export mapping: Values map to one retained shader uniform set and one transformed plane in `GrassSceneRenderer`; the same renderer instance path is used for preview and exported frames.

Acceptance coverage: Exact schema inventory/order; value parsing and bounds; resource state; real-browser canvas changes for vertical offset, front/back, blur, color, and strength.

## Implementation

1. Add defaults, typed settings parsing, render targets, inventory/readiness, and a `Ground Shadow` schema section.
2. Add a focused `GrassGroundShadowResource` with one retained plane, shader, uniforms, update method, and disposal.
3. Attach the resource directly to the scene, update it every render, include it in export, and keep it out of shadow-map casting/receiving.
4. Update renderer pipeline description/runtime id and performance-impact ownership without adding a new pass or workload dimension.
5. Add focused unit and browser coverage, update exact section order, then record the worklog decision and verification.

## Acceptance

- Strength 0 removes the underlay; non-zero strength creates a visible shadow below Terrain.
- Vertical offset changes visual separation without moving Terrain.
- Front / back translates only the shadow along field depth.
- Scale changes the shadow footprint uniformly across width and depth without resizing Terrain or converting Blur from world metres.
- Blur changes edge softness without reallocating geometry or textures.
- Color affects only the underlay.
- Field dimensions and shape controls keep the shadow silhouette aligned.
- Terrain hidden also hides the Ground Shadow.
- Reset restores all six defaults; settings import/export and persistence retain them.
- Preview and exports consume the same settings.

## Verification result

- Focused Ground Shadow/schema/product Vitest passed 24/24; the broader impacted acceptance suite passed 49/49 before unrelated workspace edits appeared.
- TypeScript, production build, product boundary for 96 production modules, signed integrity for 549 files, and local docs checks passed for the completed batch.
- Exact Playwright `Ground Shadow controls move and style the complete underlay` covers all six controls plus Terrain conditional visibility.
- Exact Playwright `control sections follow the scene authoring workflow` passed with Ground Shadow immediately after Surface Fade.
- Controlled Chrome showed the complete soft field shadow on a temporary light background, retained normalized settings in the renderer signature, and produced no WebGL/shader errors.
- The acceptance section inventory was moved to a focused functional module so the touched acceptance file remains below its code-health ceiling; the new module is declared in the performance-impact inventory.
- The Scale extension passes focused unit coverage, TypeScript, code health, production build, product boundary, and the exact six-control Chromium scenario. One initial browser attempt lost its Vite execution context after an asset fetch failure; the immediate clean retry passed with complete runtime evidence in 3.5 minutes.
- The Scale delivery invocation could not acquire the project verification lock because another workspace process was already running Toolcraft delivery verification; that external process was not interrupted.
- The protected delivery command was invoked once. Its first run stopped at code-health ceilings; the two touched files were repaired without behavior changes. Subsequent workspace-wide checks were then blocked by separate in-progress `Surface Bend` edits: duplicate renderer cache keys, missing acceptance rows/inventory, missing output inputs, and a new `grass-values.ts` line-budget violation. Those unrelated edits were not modified as part of Ground Shadow.

# Simulation Surface Tilt Implementation Plan

Verification tier: Tier 3

Reason: The change adds a transient pointer-driven transform to the retained Three.js scene and a persistent Simulation control, while preserving geometry, materials, workload bounds, timeline transport, and export.

Run: Focused tilt-controller, settings, schema, pipeline, and product tests; TypeScript and code health; one deterministic Chromium Simulation movement/settle/export-neutral scenario; the existing animation-frame performance path only if the impact-derived delivery gate requires it; production build; one protected delivery invocation.

Skip: No full performance refresh or new kernel benchmark because the renderer remains retained WebGL, adds no pass, draw call, resource, texture, geometry, or workload dimension, and the user requested interaction behavior rather than optimization.

## Product behavior

- Apply the effect only in `Simulation` and only after pointer travel over a real Terrain hit.
- Tilt the complete Three.js scene root, so Terrain, grass, scanned vegetation, flowers, rocks, boulder, lights, and shadows remain spatially coherent.
- Map the local Terrain travel vector to small X/Z rotations: forward/back travel drives X and lateral travel drives Z.
- Keep the default restrained at `1.25°`; `0°` disables the effect.
- Reuse `Direction lag` for smooth target following and `Release` for the return to neutral after movement stops or leaves Terrain.
- Keep Static, Sway, Wind, still export, and video export neutral because they have no live Simulation pointer.
- Preserve the existing top playback timeline; the tilt is transient pointer interaction and is not keyframed or written into history.

## Control and state

- Add built-in continuous slider `Surface tilt` to the existing `Simulation` section.
- Target: `wind.surfaceTilt`; domain `0..4°`, step `0.05°`, default `1.25°`.
- Persist/reset/import through ordinary Toolcraft schema state.
- Add the target to `appControlSectionInventory`, acceptance coverage, settings types/defaults/reader, and scene-render invalidation only.

## Renderer and interaction

- Add a focused `GrassSurfaceTiltController` that receives normalized pointer travel, holds the latest target briefly between pointer events, applies frame-rate-independent smoothing, and settles exactly at neutral.
- Add `useGrassSurfaceTilt` to observe the existing pointer-direction/Terrain-hit diagnostics instead of duplicating raycasts.
- Coalesce tilt preview renders to the existing 24 fps preview cadence and continue the return animation while playback is paused.
- Add `GrassSceneRenderer.setSurfaceTilt`; apply its rotation only for `interactive-preview`, and force export purpose to zero.
- Expose bounded diagnostics for browser proof without using them as the acceptance outcome authority.

## Files

- Schema/state: `grass-defaults.ts`, `grass-settings-types.ts`, `grass-values.ts`, `grass-wind-controls.ts`, `grass-render-targets.ts`.
- Interaction/render: new `grass-surface-tilt.ts`, new `use-grass-surface-tilt.ts`, `grass-scene.ts`, `grass-output.tsx`.
- Pipeline/performance ownership: `app-renderer-pipeline.ts` only if target grouping needs explicit adjustment, and `app-performance-impact.json` for the new production modules.
- Product declarations: `app-acceptance-wind-data.ts`, `app-product-readiness.ts`, `docs/toolcraft/agent-worklog.md`.
- Proof: focused Vitest for controller and state mapping plus a product-owned Playwright Simulation tilt scenario.

## Acceptance

- Unit proof: bounds/defaults, direction-to-axis mapping, frame-rate-independent response, release-to-exact-neutral, mode/export neutrality, and no layout/resource invalidation.
- Browser proof: the control is Simulation-only and persists; moving across Terrain produces a small bounded complete-scene tilt in the matching direction; stopping settles smoothly; leaving Terrain and switching mode return to neutral; ordinary orbit state is unchanged.
- Performance: no new envelope dimension; the existing `renderer.pointerDirection` / `renderer.pointerTerrainHit` animation-frame path remains the canonical interaction.

# Kinetic Circle Volumetric Animation Implementation Plan

## Current pass — promote exported settings to defaults

**Goal:** Make the supported values from `/Users/kusnizza/Downloads/kinetic-circle-settings (1).json` the initial and Reset state for Kinetic Circle.

**Verification tier:** Tier 2 — this changes schema defaults and persistence identity plus renderer fallback values, but does not change control ranges, renderer equations, layout, export behavior, or copied Toolcraft runtime.

### Task 1: Defaults and persistence

- [x] Replace every supported product-control `defaultValue` with the corresponding exported setting.
- [x] Keep unchanged canvas, orientation, background, export, and loop-duration defaults where the file matches the app.
- [x] Ignore transport snapshot fields (`timeline.currentTimeSeconds`, paused state) and import metadata because they are session state rather than creative defaults.
- [x] Bump local persistence to v7 so saved v6 values cannot mask the new initial state.

### Task 2: Consistency and documentation

- [x] Synchronize `getMosaicSettings` fallbacks and the schema-test default fixture.
- [x] Update persistence expectations, product spec, and worklog.
- [x] Do not run typecheck, tests, build, browser checks, or performance checks per the user's explicit instruction.

## Completed pass — remove pseudo-3D point shading

**Goal:** Remove the requested pseudo-volume point treatment completely while preserving the genuinely 3D geometry, expanded signed Z shaping, point weight, motion, exports, and responsive gizmo behavior.

**Verification tier:** Tier 3 — one schema target, the WebGL fragment shader, acceptance mapping, and renderer performance inventory change. The copied Toolcraft runtime, dependencies, geometry, playback, exports, and interaction throttle remain unchanged.

### Task 1: Product and renderer

- [x] Remove `pattern.pseudoVolume` and the `3D beads` switch from Dot Field.
- [x] Delete the pseudo-sphere uniform, shader branch, lighting calculations, settings value, and diagnostic canvas attribute.
- [x] Render every point as one flat antialiased color disc in preview, PNG, and video.

### Task 2: Contracts and verification

- [x] Remove the retired target from acceptance, performance scenarios, renderer invalidation metadata, and browser coverage.
- [x] Keep persistence v6 so unrelated saved Z and motion settings are not reset; the retired value becomes inert.
- [x] Run `npm run ai:check`, `npm run verify:quick`, focused browser absence/render checks, and a short agent-browser playback/orbit smoke.
- [x] Record the result in the worklog. Skip the full performance checkpoint because removing fragment arithmetic cannot increase the renderer workload and no new performance regression was reported.

## Completed pass — responsive orbit, deeper signed Z, and bead volume

**Goal:** Remove intermittent orientation-gizmo stalls at the 2× dense workload, make the authored relief visibly convex or concave across a wider Z range, and add an explicit on/off pseudo-volume treatment for every point.

**Diagnosis:** The built-in direct-orbit hook already coalesces pointer deltas to one state write per animation frame, and orientation changes do not rebuild geometry. Real Chrome at Density 100 showed the remaining cost in the 3840×2160 preview path: repeated gizmo drags produced an intermittent 60ms long task at 2× while the same run at 1× produced no long task. The current renderer also drops a requested draw when it lands inside the playing 30ms frame interval instead of guaranteeing a trailing frame. Static relief has only a non-negative 0–100 `Z spread`; `Z twist` reverses helix handedness but cannot turn the whole dome from convex to concave. Point sprites always contain a small fixed highlight and expose no flat/volumetric choice.

**Verification tier:** Tier 3 — schema, static geometry, fragment shader, renderer interaction scheduling, persistence, acceptance, and performance evidence change. The copied Toolcraft runtime and dependencies remain unchanged. The user reported lag, so this pass also requires the full preferred agent-browser performance checkpoint.

### Task 1: Product/schema contract

- [x] Expand `volume.zSpread` to 0–160% with a stronger but bounded response.
- [x] Add the signed built-in slider `volume.zBend` for concave/flat/convex dome direction while keeping `volume.zTwist` responsible only for helical variation.
- [x] Add the built-in `pattern.pseudoVolume` switch, default on, for flat discs versus sphere-like beads.
- [x] Bump local persistence to v6 because the new defaults and target change the saved product state.

### Task 2: Geometry and shading

- [x] Map Z spread through its expanded range and combine it with signed dome bend, ridge, and helix terms.
- [x] Soft-limit the strongest combined depth so convex and concave extremes remain expressive without producing unbounded projection.
- [x] Add a fragment-shader uniform branch: off renders a flat antialiased disc; on reconstructs a sphere normal and applies diffuse, specular, and rim shading.
- [x] Reuse the same setting, geometry, and shader in live preview, PNG, and video.

### Task 3: Gizmo responsiveness

- [x] Distinguish orientation-gizmo/direct-object orbit from background pan without repeated hit-testing on pointer move.
- [x] Render orbit and continuous creative-slider gestures live at a temporary 1× backing scale, then restore the selected full backing scale on release without changing runtime state or playback.
- [x] Guarantee a trailing GPU draw when a state update lands inside the playback frame interval.
- [x] Keep background pan/wheel coalescing and export resolution unchanged.

### Task 4: Coverage and verification

- [x] Add unit and browser coverage for signed Z bend, expanded Z spread, pseudo-volume pixels, persistence v6, and full-quality restoration after orbit.
- [x] Update the section inventory, acceptance matrix, renderer pipeline, workload fixtures, and performance risks.
- [x] Run `npm run verify:quick`, focused browser acceptance, targeted Z/shading/orbit performance, and the full preferred agent-browser performance checkpoint.
- [x] Record exact results and remaining risks in `docs/toolcraft/agent-worklog.md`.

## Current pass — expressive per-slider response

**Goal:** Make every creative slider produce an individually recognizable visual result across a useful subtle-to-expressive range, while preserving one coherent 3D object, seamless playback, exact export parity, and the existing Toolcraft surfaces.

**Diagnosis:** A real Chrome min/max pixel audit showed only 5–14% changed pixels for most controls and 4.75% for Drift. The source confirms conservative shared coefficients: Amount maxed near 3.2% of canvas height, Z motion near 5.5%, Core opening near 5.2%, and Drift near 0.84% at its exposed maximum; Ball weight settled points only about 2% of height. Circle’s near-symmetry also hid Bend/Repeats/Contour angle.

**Verification tier:** Tier 3 — schema ranges/defaults, procedural geometry, shader response, persistence, acceptance, and touched renderer performance paths change; copied runtime and dependencies do not.

### Task 1: Product/schema response ranges

- [x] Keep the existing semantic section inventory and built-in control types.
- [x] Broaden `Repeats` to 2–12, `Density` down to 18, `Dot size` to 2–18px, `Speed` to 1–6, `Frequency` to 0–100%, `Falloff` to 0–100%, and `Drift` to 0–100%.
- [x] Rebalance default Bend/depth/volume/motion/dynamics values for a composed but visibly volumetric initial state.
- [x] Update every slider description to name its independent visible behavior.
- [x] Bump local persistence to v5 because several stored percentages now have materially stronger semantics.

### Task 2: Static geometry response

- [x] Give Bend, Depth, Z spread, and signed Z twist separate nonlinear response curves.
- [x] Strengthen each form family without exceeding the motion-safe radius.
- [x] Add a restrained secondary Circle harmonic so Contour angle and Repeats remain useful on the default form.
- [x] Give Seed deterministic angular, radial, size, and palette variation rather than color-only microvariation.
- [x] Increase authored Z relief and signed helix depth while preserving an exactly flat `Z spread = 0` state.

### Task 3: Shader response

- [x] Centralize the per-slider mappings in a typed/testable motion-uniform response helper.
- [x] Map Amount, Frequency, Falloff, Drift, Z motion, Core opening, Perspective, and Ball weight through separate nonlinear functions.
- [x] Add a gravity-direction bias and stronger depth settling to Ball weight so it does not duplicate Falloff or Z motion.
- [x] Keep all responses phase-derived and deterministic so integer Speed values remain seamless at the timeline boundary.

### Task 4: Acceptance and performance metadata

- [x] Add unit assertions for the exact low/default/high response envelopes.
- [x] Expand browser acceptance to drive every Shape, Volume, Dot Field, Motion, and Dynamics slider independently through a meaningful low/high or signed fixture and prove product-pixel change.
- [x] Update hard-limit fixtures for Dot size 18, Speed 6, Frequency/Falloff/Drift 100, and the combined volumetric stress state.
- [x] Keep geometry-building targets separate from uniform-only targets in `rendererPipeline`.

### Task 5: Verification

- [x] Run focused app tests and `npm run verify:quick`.
- [x] Run the focused per-slider browser acceptance in real Chrome/Playwright.
- [x] Repeat the pixel-delta matrix and visually inspect representative low/high states.
- [x] Run targeted dense preview, playback, viewport drag, and zoom scenarios because the shader amplitudes and maximum dot coverage changed.
- [x] Update `docs/toolcraft/agent-worklog.md` with diagnosis, decisions, evidence, skipped full-suite reason, and remaining risks.

## Current pass

**Goal:** Turn the existing relief animation into an authored 3D volume with useful radial, depth, perspective, opening, and point-inertia controls while preserving the Toolcraft playback/export model.

**Verification tier:** Tier 3 — schema, renderer geometry, WebGL animation, persistence, acceptance, and targeted performance paths change; runtime/template code and dependencies do not.

### Task 1: Schema and product contract

- [ ] Add a `Volume` section with `volume.radiusRange`, `volume.zSpread`, `volume.zTwist`, and `volume.perspective`.
- [ ] Keep trajectory controls in `Motion`; move falloff/drift into `Dynamics` with `motion.zMotion`, `motion.coreOpening`, and `motion.ballWeight`.
- [ ] Use the built-in `rangeSlider` for authored inner/outer radii and built-in sliders for all scalar values.
- [ ] Bump persistence to version 4 so the new defaults have a clean state identity.

### Task 2: Geometry and GPU motion

- [ ] Map concentric rings between the selected lower/upper radius bounds.
- [ ] Generate bounded dome, ridge, and signed helical Z relief from `Depth`, `Z spread`, and `Z twist`.
- [ ] Add perspective, radial-bound, axial-motion, core-opening, and point-weight uniforms.
- [ ] Give Ripple, Breathe, Twist, and Orbit distinct radial, tangential, and axial equations; keep integer-cycle forward seams.
- [ ] Make ball weight deterministic by combining per-point size variation with phase lag, response damping, and Z settling.
- [ ] Reuse the same settings and shader for preview, PNG, and every video frame.

### Task 3: Coverage and inventories

- [ ] Update product readiness, section inventory, acceptance rows, compound range coverage, performance scenarios, renderer pipeline cache keys, and interaction invalidation.
- [ ] Extend unit tests for radius bounds, Z spread/twist, right-handed projection, shader uniforms, persistence, and complete target coverage.
- [ ] Add browser acceptance that drags both radius thumbs and every new scalar control through real UI while checking product pixels.
- [ ] Add targeted performance scenarios for the geometry-changing radial/Z controls and uniform-only perspective/dynamics controls.

### Task 4: Verification and delivery

- [ ] Run focused app tests, then `npm run verify:quick`.
- [ ] If a failure appears, invoke the required `systematic-debugging` workflow before changing behavior.
- [ ] Run the new targeted browser acceptance plus dense preview, timeline playback, animation viewport drag, and viewport zoom scenarios.
- [ ] Update `agent-worklog.md` with the decision trail, exact commands, skipped full-suite reason, evidence, and remaining risks.
- [ ] Keep the identity-verified local app server running and report its URL.

## Historical orientation and Infinity pass

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the starter orientation gizmo, direct 3D object rotation, and starter Infinity Canvas behavior to Kinetic Circle with one authoritative state path across preview, history, persistence, and export.

**Architecture:** Intentionally synchronize the two requested starter runtime capabilities into the copied Toolcraft runtime instead of replacing the established generated app with the incompatible current starter architecture. `canvas.infinity` owns finite/infinite runtime mode, while a built-in `orientationGizmo` and model-orbit interaction both write `view.orbit`; the WebGL renderer converts that pose to camera-basis uniforms and perspective-projects a bounded Z-relief field.

**Tech Stack:** React 19, TypeScript, Toolcraft runtime/state/schema, WebGL 2 point sprites, Canvas 2D editor gizmo, Vitest, Playwright.

---

## File map

- `src/toolcraft/runtime/schema/runtime-targets.ts`: declare `canvas.infinity` as a runtime-owned target.
- `src/toolcraft/runtime/schema/define-toolcraft.ts`: inject Infinity into Setup and conditionally hide finite size controls.
- `src/toolcraft/runtime/state/types.ts`, `create-template-state.ts`, `persistence.ts`, `reducer.ts`: own finite/infinite canvas mode, target reads/writes, reset, undo/redo, and persistence.
- `src/toolcraft/runtime/react/control-conditions.ts`, `controls-panel.tsx`, `canvas-shell.tsx`: resolve runtime mode conditions, omit editor-only orientation controls from the panel, and render finite versus unbounded scene surfaces.
- `src/toolcraft/runtime/react/orientation-gizmo/*`: starter-derived orientation math, 70px Canvas 2D gizmo, schema selection, and direct model-orbit hook adapted to the local runtime context.
- `src/toolcraft/runtime/react/toolcraft-app.tsx`, `index.ts`: mount and export the built-in handle layer/API.
- `src/app/app-schema.ts`, `kinetic-mosaic-renderer.tsx`: declare `view.orbit`, add Z relief and perspective orientation, distinguish object orbit from background pan, and preserve pose in PNG/video.
- App acceptance/performance/tests/docs: prove the two visible capabilities and keep the copied-runtime integrity receipt current.

### Task 1: Runtime canvas mode contract

- [ ] Add `toolcraftCanvasInfinityTarget = "canvas.infinity"` and `isToolcraftCanvasInfinityTarget()` to `runtime-targets.ts`; include it in runtime-owned/reserved targets.
- [ ] Add `mode: "finite" | "infinite"` to `ToolcraftCanvasState`, initialize it to `finite`, and accept only those two values from persisted canvas payloads.
- [ ] Extend history patch application for `canvas.mode` and `canvas.offset`.
- [ ] In `controls.setValue`, translate a boolean `canvas.infinity` value into one undoable patch: enabling writes only `canvas.mode`; disabling writes `canvas.mode = "finite"` plus centered offset.
- [ ] Make global/section reset restore finite mode and preserve the dormant `canvas.size`.
- [ ] Add failing reducer/persistence assertions to `app-schema.test.ts`, run `npm run test:app -- --run`, then implement until they pass.

### Task 2: Runtime Setup and unbounded canvas presentation

- [ ] Inject a built-in `Infinity canvas` switch before finite sizing controls for editable-output apps.
- [ ] Add `visibleWhen: { target: "canvas.infinity", equals: false }` to Aspect ratio, Canvas width, and Canvas height.
- [ ] Resolve `canvas.infinity` from `state.canvas.mode` in conditions and ControlsPanel value reads.
- [ ] In `CanvasShell`, render finite mode with the current sized, clipped artboard; render infinite mode as an overflow-visible, zero-frame scene whose custom output supplies its own world-space size.
- [ ] Fill the full viewport with the selected product background in infinite mode and force the product renderer’s own finite background transparent; disabling Background while infinite restores finite mode.
- [ ] Add stable `data-toolcraft-canvas-mode` and `data-toolcraft-infinite-scene` observables for browser acceptance.

### Task 3: Built-in starter orientation gizmo

- [ ] Port the dependency-free orientation quaternion and pose math from the current starter into focused runtime files.
- [ ] Implement a 70px Canvas 2D gizmo at 16px left/bottom, with RGB axes, hover targets, axis snap animation, merged history writes, and stable `toolcraft-orientation-gizmo` test id.
- [ ] Select at most one visible `orientationGizmo` schema control and render the handle as an editor overlay outside the world transform and export output.
- [ ] Skip `orientationGizmo` in the controls panel while retaining its default, reset, persistence, acceptance target, and renderer access.
- [ ] Implement `useToolcraftModelOrbitInteraction({ target, hitTest })` so direct object drag writes the same pose and stops propagation; a miss falls through to existing viewport pan.
- [ ] Export `readToolcraftOrientationPose`, camera-basis helpers, and the direct orbit hook from the runtime React entry.

### Task 4: 3D relief renderer and interaction

- [ ] Add the `view.orbit` built-in orientation control to Shape with `label: false`, `keyframeable: false`, and a slightly tilted default pose; rename the existing planar `Rotation` label to `Contour angle`.
- [ ] Bump local persistence to version 3.
- [ ] Extend each geometry vertex with Z relief derived from radius, ring phase, form, and `shape.depth`; keep the maximum relief bounded.
- [ ] Extend the vertex shader with right/up/back camera-basis uniforms, perspective projection, depth point-size attenuation, and stable output centering.
- [ ] Read `view.orbit` once per state snapshot and send the same basis through preview, still export, and every video frame.
- [ ] Give the renderer a pointer-active overlay and a hit test based on the rendered object region; attach the built-in model-orbit handlers so object drag rotates while background drag pans.
- [ ] In infinite mode, position the logical renderer canvas around world origin without clipping and clear it transparently; in finite mode preserve current full-artboard sizing/background.

### Task 5: Acceptance, performance inventory, and documentation

- [ ] Add a canvas-handle acceptance row for `view.orbit` with gizmo drag, direct object drag, output observability, reset/history/persistence, and export-clean test names.
- [ ] Add runtime acceptance for `canvas.infinity`, finite-size preservation, Setup visibility, persistence, undo/redo, background behavior, and viewport pan/zoom.
- [ ] Update product readiness, starter control inventory, renderer pipeline, interaction invalidation, and performance scenarios for orientation and Infinity.
- [ ] Update schema/acceptance/performance unit tests and browser tests with exact new targets and test names.
- [ ] Record the intentional copied-runtime starter capability sync, rejected full migration, verification tier, evidence, and risks in `agent-worklog.md`.
- [ ] Regenerate `.toolcraft-manifest.json` hashes only for the intentional runtime sync and verify `node scripts/check-toolcraft-integrity.mjs` passes.

### Task 6: Verification and local delivery

- [ ] Run `npm run ai:check`, targeted app tests, `npm run typecheck`, and `npm run verify:quick`.
- [ ] If any check fails, apply the required systematic-debugging workflow before modifying behavior.
- [ ] Run `npm run verify:final`.
- [ ] Use the required browser workflow against the real app to verify gizmo drag/snap, direct object drag, background pan, fixed gizmo placement through pan/zoom, reset/undo/redo, Infinity toggle, hidden/restored size controls, reload persistence, animation continuity, and clean PNG output.
- [ ] Run a targeted maximum-density orientation + infinite viewport stress pass; skip the full performance suite because this is a post-first-working non-performance iteration.
- [ ] Keep the verified app running and report the identity-verified local URL.

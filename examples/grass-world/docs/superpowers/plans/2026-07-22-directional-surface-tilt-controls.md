# Directional Surface Tilt Controls

Verification tier: Tier 3

Reason: This batch changes persisted Simulation controls, pointer-direction ownership, and the retained WebGL surface-root animation, but does not add geometry, materials, renderer passes, draw calls, textures, or workload dimensions.

Run: TypeScript; focused surface-tilt, pointer-direction, schema, acceptance, product, and performance-impact Vitest; exact Chromium surface-tilt acceptance; AI/code-health; affected performance gates; production build; one impact-derived `verify:delivery`; confirm the saved dev-server identity.

Skip: No full performance refresh because the complaint is target-direction jitter rather than renderer throughput, and the change retains the existing scene-render path, 24 fps interaction invalidation cadence, resource lifecycle, output quality, and bounded transform cost.

## Product behavior

- Replace the single `wind.surfaceTilt` amplitude with four persisted built-in sliders in a new Simulation-only `Surface Tilt` section:
  - `wind.surfaceTiltLeft`, 0–4°, default 1.25°;
  - `wind.surfaceTiltRight`, 0–4°, default 1.25°;
  - `wind.surfaceTiltUp`, 0–4°, default 1.25°;
  - `wind.surfaceTiltDown`, 0–4°, default 1.25°.
- Add `wind.surfaceTiltSmoothing`, 0.1–2 s, step 0.05 s, default 0.6 s. It is one global interpolation duration for both following and neutral return of the complete retained `surfaceRoot`.
- Keep `Direction lag` exclusive to wind direction and `Release` exclusive to the gust/ambient transition.
- Preserve terrain-space raycast direction for wind. Give surface tilt a separate screen-space pointer delta so a horizontal gesture has no vertical tilt component and a vertical gesture has no horizontal component.
- Positive screen X selects Right amplitude and produces negative Z rotation; negative screen X selects Left and produces positive Z rotation. Positive screen Y selects Down and produces positive X rotation; negative screen Y selects Up and produces negative X rotation.
- Normalize diagonal screen motion, apply the matching directional amplitude per component, clamp every rendered axis to 4°, and retain exact neutral state outside Simulation and for every export frame.
- Keep timeline transport, layers, audio, wind shader behavior, camera orientation, persistence policy, settings transfer, and export formats unchanged.

## Control selection inventory

Product need: Author asymmetric maximum lean for four pointer-travel directions and one global scene response smoothness.

Value model: Five bounded continuous numeric values.

Candidate built-ins checked: Slider, range slider, vector, orientation gizmo, custom control.

Best built-in: Five ordinary continuous sliders grouped by the semantic `Surface Tilt` entity.

Why: Each direction and smoothing duration is an independent scalar. A vector cannot express asymmetric positive/negative limits, a range slider would incorrectly couple endpoints, an orientation gizmo owns persistent pose, and custom UI is unnecessary.

Targets: `wind.surfaceTiltLeft`, `wind.surfaceTiltRight`, `wind.surfaceTiltUp`, `wind.surfaceTiltDown`, `wind.surfaceTiltSmoothing`.

Renderer/export mapping: The four degree values select the pointer-owned target rotation; smoothing drives one frame-rate-independent interpolation of the retained surface root; export resolves zero.

Acceptance coverage: Exact schema/default/bounds tests, per-direction controller mapping, screen-axis isolation, smoothing response comparison, conditional visibility, persistence, real pointer gestures, settle, mode reset, and unchanged view orientation.

## Animation intent inventory

The tilt remains a transient pointer-driven Simulation response. The top Toolcraft playback timeline continues to own wind/video transport. Direction and current rotation remain interaction state, not schema pose, history, keyframes, or export state.

## Performance impact

- Reachable inputs: five bounded tuning sliders plus existing pointer move/leave and Simulation mode.
- Workload dimensions: none; slider values do not change counts, pixels, geometry, textures, draw calls, or export size.
- Pass: existing `grass.scene-render` only.
- Frequency: pointer events update one target; retained smoothing frames stay coalesced to the existing 24 fps preview cadence.
- Lifecycle: no new renderer resource; the controller and screen-pointer history are hook-scoped and cancelled/reset on cleanup.
- Invalidation: tuning values change the normal render key; transient motion invalidates only the scene-render preview.
- Render-plan assessment: fixed-cost root-matrix interpolation remains the selected retained WebGL technique; no candidate benchmark is required.

## Implementation

1. Update wind defaults, settings types/readers, render invalidation targets, controls, section inventory, readiness text, and acceptance rows for the five new targets while removing the old common amplitude target.
2. Add pure screen-delta normalization to pointer-direction logic and pass it to the surface controller without changing terrain-space wind direction or its diagnostics.
3. Extend `GrassSurfaceTiltSettings` and controller target selection for four directional amplitudes plus one smoothing duration used for follow and return.
4. Wire the new settings through `useGrassSimulationInteractions` and `useGrassSurfaceTilt`, preserving synchronous first-frame publication, clamped animation time, neutral cleanup, and export behavior.
5. Update focused Vitest and Chromium coverage, app performance ownership, plan, and worklog.


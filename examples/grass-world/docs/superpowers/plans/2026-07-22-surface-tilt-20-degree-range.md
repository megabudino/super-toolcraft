# Surface Tilt 20-Degree Range Plan

Verification tier: Tier 3

Reason: The visible slider domain and the retained scene-transform safety clamp both change from 4° to 20°. The renderer pipeline, resource lifecycle, geometry, draw calls, timeline, and workload envelope remain unchanged.

## Product decision

- Keep the existing Simulation-only `Surface Tilt` section and its built-in `Left`, `Right`, `Up`, `Down`, and `Smoothing` sliders.
- Raise only the four directional amplitude maxima from 4° to 20°.
- Preserve the 1.25° directional defaults, 0.6 s smoothing default, screen-space direction mapping, exact neutral return, persistence/settings transfer, and neutral export pose.

## Implementation

1. Update the four schema slider maxima and descriptions in `src/app/grass/grass-wind-controls.ts`.
2. Update the four settings-reader bounds in `src/app/grass/grass-values.ts` and the controller/transform safety clamps in `src/app/grass/grass-surface-tilt.ts`.
3. Update focused controller, product, and browser acceptance expectations so 20° is proved on every signed direction without cross-axis motion.
4. Update product readiness and acceptance copy where it names the old 4° boundary.
5. Record the delivery in `docs/toolcraft/agent-worklog.md`.

## Verification

- Run focused schema/value/controller/product tests and TypeScript.
- Run the exact surface-tilt Chromium scenario against the real controls and canvas.
- Run AI/code-health, affected performance gates, production build, and one protected delivery invocation.
- Skip a full performance refresh because the change alters only a constant numeric transform boundary, not renderer cost or workload.

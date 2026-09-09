# Surface Lighting Controls

Verification tier: Tier 3
Reason: Adds output-affecting Surface controls and changes the retained WebGL ground material plus preview/export shadow behavior.
Run: targeted Surface/product unit tests, focused browser control proof, `npm run typecheck`, then one impact-derived `npm run verify:delivery` at the delivery boundary.
Skip: full performance refresh because the controls add fixed-cost uniforms/flags and the user did not request performance work.

## Product decision

- Add `surface.brightness` as one shared 0–300% multiplier for the blended Current and Clover ground albedo. Default 100% preserves existing scenes.
- Add `surface.receiveShadows` as a built-in switch. Default on preserves existing scenes; off disables shadow-map receiving only for Terrain.
- Keep PBR directional response, normal maps, AO, HDRI, grading, and Sun Patches active when shadow receiving is off, so Surface retains material depth.
- Apply both controls to interactive preview and image/video export. Do not change timeline, layers, camera, grass, scans, or renderer workload dimensions.

## Implementation

1. Add defaults, schema controls, normalized settings, render targets, section inventory, acceptance rows, and persistence-compatible settings transfer coverage.
2. Add the brightness uniform to the retained ground blend material and update it without recompiling or rebuilding geometry.
3. Set `groundMesh.receiveShadow` from `surface.receiveShadows` on every render so preview and export agree.
4. Add focused unit assertions for control ranges, state mapping, shader uniform wiring, and shadow behavior; extend the existing real-browser Surface control fixture.
5. Record the delivery decision and verification in `docs/toolcraft/agent-worklog.md`.

# Interactive Wind Modes

Verification tier: Tier 4
Reason: This batch replaces the authored wind mode model, changes the retained WebGL deformation shared by every flexible vegetation layer, adds transient canvas interaction state, and updates playback/export behavior.
Run: targeted Vitest for wind, pointer, schema, acceptance, render-plan, and product mapping; focused Playwright for wind modes and pointer transitions; `npm run verify:delivery`; identity-verified `npm run dev`.
Skip: no explicit full performance refresh because the request changes wind behavior rather than asking to optimize renderer performance; fixed-cost uniforms and shader harmonics remain inside the existing `grass-scene-render` and `grass-export-frame` passes.

## Product model

- `Static`: freeze every wind deformation at the rest pose for scene setup.
- `Sway`: render only the low-amplitude ambient motion used while the pointer is outside the terrain.
- `Wind`: render ambient sway plus the complete configured gust at full activation so its shape can be tuned in isolation.
- `Simulation`: render ambient sway outside the terrain; over a terrain hit, ramp the configured gust in and make pointer travel set its target direction. Leaving the terrain ramps the gust out.
- Direction changes follow the shortest angular path and use an adjustable response time. Pointer direction and hover activation are renderer-owned transient state; the authored Direction control remains the fallback and export direction.
- Timeline playback remains the single transport and the six-second forward loop remains seamless. Static ignores timeline progress. Export uses the authored direction and full configured gust for Wind and Simulation because export has no pointer hover.

## Control section inventory

- `Wind Mode`: `wind.mode`, `wind.directionAngle`. Mode owns the four editor states; Direction is the authored fallback and is visible for Wind/Simulation.
- `Ambient Sway`: `wind.swayStrength`, `wind.swayCycles`, `wind.swayVariation`. Visible for Sway/Wind/Simulation.
- `Gust Dynamics`: `wind.strength`, `wind.flow`, `wind.gustCycles`, `wind.gustWidth`, `wind.noiseStrength`, `wind.noiseScale`, `wind.noiseDetail`, `wind.seed`. Visible for Wind/Simulation.
- `Simulation`: `wind.rampUp`, `wind.release`, `wind.directionResponse`. Visible only for Simulation.

All controls use built-in segmented/slider components. No custom panel UI, layers, keyframes, or alternate transport is introduced.

## Implementation

1. Replace `wind.profile` defaults/types/reader/schema controls with the four-state `wind.mode` model and the ambient, gust, and transition parameters. Bump persistence so stale profile values cannot leak into the new schema.
2. Add a frame-level wind controller that owns transient terrain-hover activation and smoothed pointer direction, then resolve one immutable wind frame used by Tall Grass, Lawn, lightweight coverage, clumps, scanned grasses, flowers, color, and depth/shadow materials.
3. Replace the profile shader branches with one fixed-cost ambient-plus-gust model. Preserve root anchoring, delayed tips, crosswind turbulence, exact integer loop harmonics, and the existing response differences between Lawn, Tall Grass, and scan families.
4. Update pointer handling to publish terrain hit and travel direction directly to the retained scene without writing every move into settings history. Request a render on interaction while timeline playback continues to own ongoing animation frames.
5. Update render diagnostics, acceptance rows, product tests, browser tests, persistence tests, renderer target inventories, and performance impact ownership.
6. Record the animation intent, state/output mapping, verification result, and remaining risks in `docs/toolcraft/agent-worklog.md`.

## Animation intent inventory

- Classification: playback timeline.
- Timeline: retained and required by video export.
- Loop: six-second, forward-only, seamless integer harmonics; duration edits remap the same normalized cycle without mutating wind settings.
- Pointer: transient direction/activation input only; it does not replace timeline playback.
- Viewport: retained scene and pipeline invalidation stay unchanged; pointer updates invalidate only `grass-scene-render`.

## Render-plan impact

- Reachable new inputs: the new wind controls plus `renderer.pointerDirection` and `renderer.pointerTerrainHit`.
- Workload dimensions: none; every control changes fixed uniform values and bounded harmonic weights, not geometry counts, draw calls, texture dimensions, or loop counts.
- Passes: `grass-scene-render` and `grass-export-frame`; retained material resources are reused.
- Benchmark decision: no new kernel candidate is required because execution remains one constant-cost vertex deformation in the already selected WebGL pipeline.

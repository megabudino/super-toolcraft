# Wind Audio Volume Plan

Verification tier: Tier 2

Reason: One persisted built-in slider changes preview-only wind audio loudness without changing the WebGL renderer, timeline transport, layers, workload envelope, or export.

Run: Focused schema/value/audio tests, TypeScript, code-health, real-browser slider-to-audio proof, and one protected delivery invocation.

Skip: No performance scenario or full refresh because the slider updates one retained audio-element volume target and adds no renderer work or workload dimension.

## Product behavior

- Add `Volume` to the existing `Simulation` section after transition timing controls.
- Use a continuous 0–100% slider with 1% steps and a 60% default.
- Show it only while `wind.mode` is `simulation`, matching the preview-only sound behavior it controls.
- Persist, reset, undo/redo, and transfer it as `wind.audioVolume` through normal Toolcraft schema state.
- Map 0–100% to 0–1 audio gain. At 0%, do not start or continue the audio element; raising it during an active Terrain hover starts playback and fades toward the new level.
- Keep visual wind, the six-second timeline, and silent PNG/JPG/MP4/WebM export unchanged.

## Implementation

1. Add the default, settings type/value normalization, built-in slider, section inventory target, and acceptance row.
2. Pass normalized gain into `useGrassWindAudio` and let the retained controller update its target volume without restarting playback position.
3. Add exact unit coverage for default/value/schema/controller behavior and extend the focused browser media probe to change Volume through the real slider.
4. Run focused Vitest, TypeScript, AI/code-health, the exact wind-audio Playwright scenario, production build, and one delivery invocation.

# Hover Wind Audio Plan

Verification tier: Tier 3

Reason: A new supplied audio asset and live canvas-hover lifecycle add user-visible media playback to the existing Simulation interaction without changing schema, renderer geometry, timeline transport, persistence, or export.

Run: Focused audio lifecycle tests, TypeScript, code-health, a browser test with deterministic media stubs and real terrain hover/leave, then one protected delivery invocation.

Skip: No full performance refresh because the feature creates one retained audio element and one transition-only volume ramp; it adds no renderer pass, draw call, resource rebuild, workload dimension, or exported media track.

## Product behavior

- Play the supplied Mountain Wind Gusts recording only while `wind.mode` is `simulation` and the pointer is over the projected Terrain, matching the existing interactive gust trigger.
- Fade volume in on terrain entry with the existing Ramp up duration and fade it out on terrain exit, mode change, unmount, or disabled pointer wind with the existing Release duration.
- Preserve playback position across hovers so repeated entries do not replay the same opening gust; loop the 62.832-second source only after it naturally reaches the end.
- Respect browser autoplay policy: attempt playback on active hover and unlock the retained media element on the first trusted pointer interaction. Never surface rejected `play()` promises as application errors.
- Keep audio preview-only. PNG and Video export remain unchanged and silent.

## Implementation

1. Copy the supplied MP3 into `src/app/grass/assets/audio/` and import it as a Vite asset URL.
2. Add a focused `useGrassWindAudio` hook that owns one `HTMLAudioElement`, observes the existing `data-grass-pointer-wind-active` signal, performs bounded `requestAnimationFrame` fades, and cleans up listeners, frames, and playback.
3. Wire the hook into `grass-output.tsx`, enabled only for Simulation. Do not modify schema controls, persistence, timeline state, renderer passes, or export.
4. Add the new production module to `app-performance-impact.json` as functional ownership; the existing output module remains mapped to its current passes.
5. Add unit coverage for the audio transition controller and focused Playwright proof that Simulation terrain hover plays/fades audio while leaving Terrain or changing mode pauses it.
6. Update the product worklog with the asset source, autoplay limitation, preview/export boundary, and verification results.

# Grass Studio settings 20 start-state design

Verification tier: Tier 3

Reason: the reset scene changes camera, environment, terrain, grass geometry and materials, scan-layer workloads, butterflies, wind, background, and export defaults. Renderer architecture, control inventory, limits, and export implementations remain unchanged.

Run: AI/code-health, typecheck, focused default/schema tests, build, and one focused browser check of the clean v21 start state.

Skip: full performance checkpoint because this is a default-scene change, not explicit performance work. Use the existing pass ownership for `grass-defaults.ts`.

## Source of truth

Use `/Users/kusnizza/Downloads/grass-studio-settings (20).json` as the reset/default scene source.

Copy all 240 values that have matching current product targets into `grassDefaults`. Normalize exported color objects such as `{ "hex": "#F2AB26" }` to the schema's equivalent color string. Preserve the current defaults for newer targets that are absent from the settings file, including texture masks, sheen, ambient-occlusion strength, and backlight controls.

The exported canvas already matches the schema: 1920×1080 at render scale 2. Keep the six-second timeline and paused initial playback. Do not make `timeline.currentTimeSeconds: 5.8400` a product default because it is transient animation transport state.

## Persistence and reset behavior

Advance local persistence from v20 to v21. A clean reload and Reset must use the imported state rather than allowing an older v20 browser snapshot to mask the new defaults.

Keep persistence coverage, settings transfer, timeline mode, panels, layer policy, renderer, and exports unchanged.

## Verification

Add a focused source-of-truth test that compares every compatible imported value to the schema default after color normalization. Assert that the canvas and persistence identity are v21. Browser-check the clean start state through real runtime diagnostics without running a full performance audit.

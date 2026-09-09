# Imported Grass Studio defaults design

Verification tier: Tier 3

Reason: the batch changes the reset scene, camera, environment, grass geometry/material defaults, and five scan-family workloads. It changes renderer pixels and the default submitted instance counts without changing schema limits, renderer architecture, export formats, or control inventory.

Run: no automated unit, type, build, browser, performance, or delivery commands because the user previously asked to keep tests disabled. Keep the existing development server running.

Skip: all automated proof and `verify:delivery`; this implementation does not claim a new protected receipt.

## Source of truth

Use `/Users/kusnizza/Downloads/grass-studio-settings.json` as the reset/default scene source. Copy every compatible product value into `grassDefaults`, preserving the existing Toolcraft control targets and value domains.

The exported canvas already matches the schema default: 1920×1080, 16:9, render scale 2. Keep those schema values. Keep timeline duration 6 seconds, loop enabled, and paused initial playback. Do not make the exported `currentTimeSeconds: 1.1739` a product default because it is transient playhead state rather than authored scene configuration.

`environment.hdriFile: null` remains the existing no-custom-file default. Convert the exported background color object `{ hex: "#616161" }` to the equivalent schema color default string `"#616161"`.

## Persistence

Advance local persistence from v6 to v7. This makes a fresh reload and Reset use the newly requested scene instead of allowing the previous v6 state to mask the changed defaults. Continue persisting values, canvas, media, panels, and timeline.

## Product behavior

- Preserve all current sections, controls, timeline, layer policy, renderer, PBR paths, Sun Patches, and exports.
- Change only schema/reset defaults and expectations coupled to those defaults.
- Keep all existing hard workload boundaries. The imported counts remain within the current schema maxima.
- Update default-scene tests and browser-source expectations so future verification targets the imported reset state.

## Performance impact

The reset Tall Grass count rises from 1,800 to 11,100 and scan reset counts rise substantially. Lawn remains 30,000 and all maximum limits remain unchanged. Classify `grass-defaults.ts` as performance-affecting for the existing layout, scan-layout, scene-render, and export-frame passes; no new pass or kernel candidate is introduced.

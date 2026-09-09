# Promote Settings Snapshot To Defaults

## Source and behavior

Use `/Users/kusnizza/Downloads/donut-studio-settings.json` as the authoritative
clean-start snapshot for Donut Studio.

- Start on `Matcha Cream`.
- Use the snapshot's donut geometry, edible materials, icing, sprinkles, plate,
  background, studio lights, shadows, environment, camera pose, render scale,
  image format, and image resolution as schema defaults.
- Enter Infinity canvas on a clean launch through the selected preset's normal
  runtime command path; do not patch the signed runtime or invent a second
  canvas-mode control.
- Keep the other nine named preset snapshots unchanged. Only Matcha Cream
  differs from the current factory library.
- Keep timeline disabled because the imported timeline envelope is generic
  Settings Transfer metadata and the product remains a still-output app.
- Preserve existing workspace persistence. Saved user work remains authoritative
  after reload; the new values apply to clean workspaces and resettable controls.

## Implementation

1. `src/app/donut/donut-values.ts`
   - Preserve the old shared preset fallback as a separate factory-default
     settings object.
   - Promote the supplied top-level visual values and render scale to
     `DONUT_DEFAULTS`.

2. `src/app/donut/donut-presets.ts`,
   `src/app/donut/donut-preset-schema.ts`, and
   `src/app/donut/donut-preset-library.ts`
   - Declare Matcha Cream as the default selection.
   - Build Matcha's factory snapshot over the new app defaults while the other
     nine flavors continue to use the previous factory fallback.

3. `src/app/donut/donut-reference.ts` and
   `src/app/donut/donut-canvas.tsx`
   - Use the supplied camera pose as the reset/default orientation.
   - Apply the initial named preset once so its Infinity canvas value reaches
     runtime-owned canvas state.

4. Tests and records
   - Update unit expectations for defaults, camera, render scale, and Matcha.
   - Update preset browser reference parity and export background expectations.
   - Prove a clean Settings Transfer export matches the supplied snapshot for
     canvas, selected preset, preset library, and all registered values except
     generated timestamp/timeline metadata.
   - Update verification impact and the product worklog.

## Verification

Verification tier: Tier 3
Reason: Changes the clean-start 3D output, camera pose, canvas mode, every resettable product default, and the selected named preset without changing renderer technique or workload boundaries.
Run: `pnpm ai:check`; targeted default/preset/value/schema tests; focused browser clean-start and settings-export checks; one bare `npm run verify:delivery`; keep the saved development server on port 3003.
Skip: measured performance and `npm run verify:perf`, because this is a default-state change and no performance complaint or renderer workload change was requested.

# Reference Light And Color Match Implementation Plan

Verification tier: Tier 3

Reason: changes schema/defaults/persistence plus post-light material shaders, preview, and all export frames without changing counts, seeds, renderer pass topology, or workload maxima.

## 1. Add the authored lighting state

- Update `src/app/grass/grass-defaults.ts` with the reference light/material defaults and a lower Lawn physical profile while preserving all authored counts, seeds, placements, enabled layers, and the hero boulder.
- Update `src/app/grass/grass-environment-controls.ts` with a built-in-only `Light Balance` section for key color/strength, fill strength, rim color/strength, and exposure.
- Export the new section through `src/app/grass/grass-controls.ts` and place it after `Scene Lighting`.
- Extend `src/app/grass/grass-values.ts` with bounded normalized lighting values.
- Add a built-in-only `Color Grade` section for scene contrast, saturation, highlight warmth, and shadow coolness; advance persistence for the corrected reset.

## 2. Apply light balance to retained rendering

- Update `src/app/grass/grass-scene.ts` so retained lights, exposure, Lawn/Tall materials, ground, and scans consume the light/grade values.
- Extend `src/app/grass/grass-color-grade.ts` to grade post-light `outgoingLight` before tone mapping, after existing Sun Patches, with no fullscreen pass.
- Keep HDRI decode/PMREM, geometry, shadow map, scene environment, timeline, and export renderer topology unchanged.
- Update `src/app/grass/grass-render-targets.ts` so the new controls invalidate only existing Static/Dynamic scene render and export-frame consumption.
- Advance `src/app/app-renderer-pipeline.ts` runtime id because measured pixels change.

## 3. Align product metadata and source coverage

- Add `Light Balance` and `Color Grade` to `appControlSectionInventory` and focused acceptance data.
- Align product-owned unit/browser test source declarations without running them.
- Update `src/app/app-product-readiness.ts` and the persistence expectation source.
- Update `src/app/app-performance-impact.json`; treat light/default modules as owners of existing final-scene/export passes only.
- Record the reference study, decisions, verification, skipped checks, and risks in `docs/toolcraft/agent-worklog.md`.

## 4. Browser-tune against the supplied image

- Reload the running app under the corrected persistence namespace and confirm exact preserved composition observables.
- Capture the real canvas in Chrome DevTools.
- Compare black level, warm/cool direction, subject luminance, saturation, highlight clipping, and rock hierarchy with the reference.
- Tune only light, grade, PBR, gradients, and the explicitly requested Lawn height/thickness; never alter counts or placement.
- Inspect browser console for shader/runtime errors.

## 5. Verification boundary

- Run Prettier on changed product files.
- Validate JSON and request live Vite transforms for changed modules.
- Confirm the app identity endpoint and dev server at port 3008.
- Do not run automated unit, typecheck, build, acceptance, performance, or delivery suites under the user's standing request.

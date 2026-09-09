# Layer Solo Controls Implementation Plan

## Files and behavior

1. Extend `grass-defaults.ts`, `grass-values.ts`, and `grass-render-targets.ts` with `solo.terrain`, adding Terrain to the shared derived visibility mask while keeping every Include target independent.
2. Add the built-in `Solo` switch at the start of the Terrain section. Reorder the Tall Grass, Lawn Cover, scan-family, and Boulder control declarations plus inline layout groups so `Solo` precedes `Include`. Update `appControlSectionInventory`, acceptance metadata, readiness copy, and focused Solo tests.
3. Apply Terrain visibility to the retained ground mesh and moss cushions in `grass-scene.ts`; keep existing visibility gates for grass/scans/Boulder and expose an observable Terrain visibility flag in `grass-output.tsx`. Preserve all enabled values, counts, seeds, layouts, material settings, and terrain geometry. Keep the existing renderer pipeline/pass structure and advance only its runtime revision.
4. Update `app-performance-impact.json` ownership only if the touched modules' existing pass declarations do not already cover visibility changes. Record the delivery decision in `docs/toolcraft/agent-worklog.md`.

## Runtime surfaces

- Schema controls: nine built-in switches, with Terrain added and paired rows reordered to Solo first.
- Persistence/settings transfer: `solo.terrain` is included through normal values persistence and defaults to false; the existing persistence namespace can safely hydrate older state because missing values resolve to schema defaults.
- Renderer: existing WebGL scene visibility only; no new pass or resource lifecycle.
- Timeline/layers panel/export: unchanged. Live preview and export share the same derived visibility.

## Verification

- Tier 3 targeted Vitest plus focused browser check on the running app.
- Prove Terrain-only visibility, another-layer Solo hiding Terrain, multiple Solo union, exact restoration after clearing Solo, and Solo-first control order.
- Confirm counts/seeds remain unchanged and no console shader/runtime errors appear.
- Run `npm run typecheck`, the focused Solo test, relevant browser acceptance where available, then one exact impact-derived `npm run verify:delivery` delivery attempt and `npm run dev`.
- Skip a full performance refresh because visibility remains constant-time state applied inside the existing retained scene-render passes.

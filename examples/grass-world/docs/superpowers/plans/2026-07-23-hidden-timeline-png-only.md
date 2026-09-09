# Hidden Timeline and PNG-only delivery implementation plan

1. Omit the Timeline panel in `src/app/app-schema.ts`, remove Timeline persistence, and advance persistence to v22.
2. Add a product-owned six-second autonomous clock in `src/app/grass/use-grass-autonomous-clock.ts`, consume it in `grass-output.tsx`, and stop Static wind from pausing the complete autonomous scene.
3. Preserve the Video Export section/action declarations in `src/app/grass/grass-controls.ts` but exclude them from `grassControlSections` and expose only `Export PNG`.
4. Update product animation intent, readiness copy, control inventory, acceptance rows, performance copy, persistence expectations, and schema expectations for an autonomous PNG-only UI.
5. Record the reversible hidden-code decision and explicit no-verification request in `docs/toolcraft/agent-worklog.md`.
6. Do not run unit, typecheck, build, browser, performance, or delivery verification.

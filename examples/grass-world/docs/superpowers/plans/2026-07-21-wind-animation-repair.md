# Wind Animation Repair Plan

Verification tier: Tier 3

Reason: the fix changes playback lifecycle and retained WebGL vertex deformation, but does not add controls, workload dimensions, passes, geometry, assets, or export formats.

Run: targeted wind/product Vitest, `npm run typecheck`, `npm run build`, exact Playwright wind/timeline proof, `npm run dev`, and controlled live-browser verification.

Skip: all performance commands and the protected delivery checkpoint, per the user's explicit instruction not to run a performance check for this repair.

## Scope

1. Update `src/app/grass/grass-output.tsx` so an initially restored non-Off field in Static preview switches once to Dynamic and starts the existing Toolcraft playback timeline. Preserve later user Pause and explicit Static behavior.
2. Update `src/app/grass/grass-material.ts` so Blast uses timeline-driven forward-traveling pressure variation while its scalar pressure remains positive and its direction vector remains unchanged.
3. Stop pinning Blast frame evidence to progress zero in `grass-output.tsx`; only Off remains timeline-invariant.
4. Update focused unit/product and `e2e/grass-directed-wind.spec.ts` coverage to prove automatic visible motion, different Blast frames at separated timeline samples, constant direction, and real Pause freeze.
5. Align acceptance/readiness wording and `docs/toolcraft/agent-worklog.md` with the corrected behavior. No schema controls, section inventory, persistence format, layers, panel actions, export path, workload envelope, renderer passes, or performance scenarios change.

## Verification

- Targeted unit: wind helper/product/schema expectations affected by the corrected timeline semantics.
- Targeted browser: `grass wind profiles angle and dual-layer blast`, extended to require moving Blast pixels and a paused-frame freeze.
- Development checks: typecheck and production build.
- Live browser: verify non-Off opens in Dynamic playback, Blast moves without reversing direction, Pause freezes, and the console stays clean.
- Performance: intentionally not run; the existing pass cost/frequency and workload envelope are unchanged, and the user explicitly excluded performance verification.

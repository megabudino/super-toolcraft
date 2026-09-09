# Closed Ring Wave Implementation Plan

1. Update `src/app/dot-ring-wave.ts` so every stochastic and audio-spatial input
   is periodic in angular space while preserving row variation and loop timing.
2. Extend the app-owned drawing/wave tests to measure circular neighbor
   continuity at the maximum density/row fixture across every formula and
   representative timeline frames.
3. Keep `src/app/app-verification-impact.json` unchanged unless verification
   proves an ownership gap; the current wave owner already names preview,
   image-export, and video-frame passes.
4. Update `docs/toolcraft/agent-worklog.md` with one ordinary product delivery
   entry covering the reported visual mismatch, unchanged controls/timeline/
   layers/export ownership, numerical reproduction, and residual risk.
5. Run focused tests, `pnpm typecheck`, `pnpm ai:check`, and
   `pnpm verify:kernel`.
6. Verify the running app through the real UI at maximum density/rows, sample
   seam continuity during playback, inspect the canvas, and preserve the
   existing server.
7. Run one bare `npm run verify:delivery` and return the verified app for user
   evaluation.

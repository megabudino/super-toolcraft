# Smooth short rest implementation plan

1. Update `src/app/dots/dots-motion.ts` so the convergence and hold envelopes
   are position- and velocity-continuous, with phase boundaries matching
   3 seconds formation, 1 second hold, and 1 second release in a 5-second
   default loop.
2. Update `src/app/app-schema.ts` and `src/app/app-acceptance-data.ts` so the
   runtime timeline default and typed user-request duration provenance agree;
   advance persistence so the old saved 10.5-second duration is not restored.
3. Update `src/app/dots/dots-product.test.ts` with exact phase-duration and
   boundary-continuity assertions; add a focused browser test only if existing
   timeline sampling cannot directly prove the shortened hold.
4. Keep controls, sections, panel actions, persistence shape, layers, renderer
   technique, settings transfer, PNG export, and video export unchanged.
5. Update `docs/toolcraft/agent-worklog.md` with the Tier 3 decision trail,
   request evidence, state/output mapping, targeted checks, delivery command,
   skipped full certification, and remaining persistence note.
6. Run focused Vitest and Playwright checks, then the single exact
   impact-derived `npm run verify:delivery` command. Restart the app through
   `npm run dev:restart` and inspect the saved Toolcraft URL.

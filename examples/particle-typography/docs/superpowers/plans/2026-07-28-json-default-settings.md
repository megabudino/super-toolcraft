# JSON Default Settings Implementation Plan

1. Update stable schema defaults in `src/app/app-schema.ts` for text, particle
   count, distribution, edge spill, glow, and the runtime timeline duration.
2. Change the Spectrum theme background in
   `src/app/dots/dots-theme.ts` so the default background and the Spectrum
   action both resolve to `#CFBCB0`.
3. Separate the 10-second runtime timeline default from the unchanged 4+1
   product phase values in `src/app/dots/dots-timing.ts`.
4. Update acceptance metadata wording in `src/app/app-acceptance-data.ts` so
   animation intent truthfully describes the 10-second default and the 4:1
   Active/Calm phase design.
5. Update focused schema and timing tests to assert the imported defaults and
   preserve the existing ranges, renderer mapping, and loop seam.
6. Add a focused browser scenario for cleared-storage initial defaults and
   runtime Reset restoration if the existing browser coverage does not already
   prove those exact values.
7. Confirm `src/app/app-verification-impact.json` already maps every changed
   production module to functional and renderer-performance ownership; edit it
   only if coverage is missing.
8. Append a human decision entry to `docs/toolcraft/agent-worklog.md` with the
   supplied JSON as source evidence, the session-state boundary, persistence
   choice, and known risks.
9. Read the selected implementation and verification contract phases, run
   focused unit/type checks and the browser workflow, then run one bare
   `npm run verify:delivery`.
10. Start the development server on the saved Toolcraft port and visually
    confirm the new fresh-state composition.

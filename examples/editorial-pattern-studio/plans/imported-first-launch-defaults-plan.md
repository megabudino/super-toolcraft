# Imported First-Launch Defaults — Implementation Plan

Verification tier: Tier 2

Reason: This changes schema defaults, reset behavior, and clean first-launch state while preserving the existing renderer, controls, persistence contract, export paths, timeline policy, layers policy, and workload limits.

## Files and behavior

1. Add a schema-shaped defaults module under `src/app` derived from `/Users/alex/Downloads/editorial-pattern-studio-settings (1).json`. Include the 480×600 canvas size and every product value represented by an existing control. Normalize exported color objects to the string value shape used by built-in `color` controls. Do not import the external Downloads path at runtime.
2. Update `src/app/app-schema.ts` to consume the shared first-launch defaults for canvas sizing and every resettable control. Keep `editorial.customCopy` false, but retain the supplied hidden authored-copy values so enabling Custom copy after a clean launch exposes the imported settings. Keep the current persistence key/version so returning users retain their stored state and only clean first launches receive the new defaults.
3. Update `specs/editorial-pattern-spec.md` to record the imported first-launch composition and the new Preserve colors default. No control inventory, renderer, timeline, layers, media, settings-transfer, or export structure changes are required.
4. Extend `src/app/app-schema.test.ts` with an exact default-map regression and update existing schema expectations. Extend `e2e/app-controls.spec.ts` to clear localStorage and prove the clean launch renders the imported template, equation, parameters, colors, and canvas/export defaults. Existing reload persistence coverage continues to prove returning state wins.
5. Record the source settings file, decisions, state mapping, verification, and skipped performance checkpoint in `docs/toolcraft/agent-worklog.md`.

## Verification and deployment

- Run `npm run ai:check` before implementation.
- Run focused schema and browser-default checks, then `npm run verify:quick`.
- Run `npm run verify:final` before production deployment.
- Skip the full performance checkpoint because this post-first-working defaults-only change does not alter renderer workload, control responsiveness, viewport behavior, or export algorithms.
- Deploy with the existing `.vercel/project.json` link, verify the public production alias returns the expected app, and confirm a clean public browser session receives the imported defaults.

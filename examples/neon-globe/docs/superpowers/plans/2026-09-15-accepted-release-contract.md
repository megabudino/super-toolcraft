# Neon Globe Accepted Release Implementation Plan

> Execute sequentially in this session using the app-local workflow fallback. The existing gallery workflow and the user's explicit migration request are the approved design.

**Goal:** Give the existing Neon Globe app portable owner acceptance and focused development checks.

**Architecture:** Run the canonical Toolcraft gallery migrator against an isolated copy of the current working tree. Reuse its workflow bytes, signatures, catalog generation and validation. Copy back only the generated contract files after checking preservation of product files and dependencies.

**Tech Stack:** Existing Node.js, Toolcraft gallery migrator, Vite and Playwright.

## Scope and verification

Later maintenance of an accepted existing product. The owner requested the same accepted-release mechanism already used for the gallery. Acceptance is owner approval, not a claim of executed delivery tests. Existing product edits and embed packaging must survive byte-for-byte.

Run only the workflow unit tests, release signature/integrity validation, `npm run verify:delivery`, `npm run test:feature -- --list`, one existing exact browser scenario, and portable-copy checks. Skip application build, full tests, aggregate delivery and performance: no renderer, controls, assets, dependencies or product behavior change.

## Steps

- [x] Locate `/Users/kusnizza/Projects/neon-globe`, read its contract and the canonical gallery workflow, and snapshot every tracked/untracked source file before migration.
- [x] Use `/Users/kusnizza/Projects/toolcraft-website/output/neon-globe-contract-20260915/migrate.mjs` to invoke canonical `migrateApp` in a temporary copy, keeping the original Git baseline and current working files.
- [x] Record the actual Neon Globe owner request in `toolcraft-release.json`, with `testsExecuted: false`, and sign it using the canonical generator authority.
- [x] Validate the generated entry contract, `docs/toolcraft/gallery-workflow.md`, `scripts/gallery-workflow/*.mjs`, feature catalog, package script entries and protected manifest. Preserve all inherited hashes outside generated workflow files.
- [x] Verify copied acceptance before dependency installation or any local receipt, then install the unchanged lockfile and run one exact existing product acceptance scenario.
- [x] Copy only the verified generated files to the source app; compare all other files against the saved baseline, append the worklog and report the results.

No deployment, application asset optimization or publication is part of this request.

## Result

Applied the canonical generated workflow to the standalone source. All 40 IDs map to 41 scenarios. Workflow tests: 12 passed. Fresh installation, portable acceptance without dependencies/receipts, and globe.default-preset browser scenario passed. The existing globe.sphere-color test fails its stationary raster baseline both before and after migration; recorded honestly in the worklog. Concurrent Infinity planning was preserved. No deployment performed.

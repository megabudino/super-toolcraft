# Settings Transfer Editor State Implementation Plan

> **For Codex:** Execute this plan inline. Follow the generated-app contract, update the shared Toolcraft source first, regenerate the signed framework copy, and verify the real browser workflow.

**Goal:** Make Micrographics settings export/import and local persistence preserve authored canvas composition state, including positions, sizes, inserted templates, inline text, per-element colors, and deletions.

**Architecture:** Extend Toolcraft settings transfer and local-storage persistence schemas with explicit `additionalValueTargets` allowlists. Existing control-derived targets remain automatic; product-owned editor state is included only when declared. Micrographics declares `composition.layout` for both settings transfer and persistence.

**Tech Stack:** TypeScript, React, Toolcraft runtime, Vitest, Playwright, Vite.

**Verification tier: Tier 4**

**Reason:** This changes shared runtime schema and generated framework behavior, then refreshes the signed runtime copy inside the standalone app.

**Run:** Focused runtime unit tests, runtime/starter/CLI checks needed by the touched surface, focused app unit and browser tests, one protected `verify:delivery` pass, then `npm run dev:restart`.

**Skip:** Full performance audit because renderer workload, canvas rendering, and interaction frequency are unchanged.

---

### Task 1: Add failing shared-runtime tests

**Files:**

- Modify: `/Users/kusnizza/Projects/primeui-v2-performance-authority-hardening/packages/toolcraft-runtime/src/react/app-shell/settings-transfer.test.ts`
- Modify: `/Users/kusnizza/Projects/primeui-v2-performance-authority-hardening/packages/toolcraft-runtime/src/state/persistence.test.ts`
- Modify: `/Users/kusnizza/Projects/primeui-v2-performance-authority-hardening/packages/toolcraft-runtime/src/schema/define-toolcraft.setup-settings-transfer.test.ts`

1. Add a settings-transfer test declaring `additionalValueTargets: ["composition.layout"]`.
2. Assert export includes that target and continues excluding undeclared state.
3. Assert import applies the declared target and ignores unknown targets.
4. Add persistence coverage proving declared editor state survives snapshot/restore.
5. Add schema resolution coverage for normalized, deduplicated target lists.
6. Run only these focused tests and confirm they fail for the missing feature.

### Task 2: Implement explicit additional state targets

**Files:**

- Modify: `/Users/kusnizza/Projects/primeui-v2-performance-authority-hardening/packages/toolcraft-runtime/src/schema/types.ts`
- Modify: `/Users/kusnizza/Projects/primeui-v2-performance-authority-hardening/packages/toolcraft-runtime/src/schema/runtime-setup-section.ts`
- Modify: `/Users/kusnizza/Projects/primeui-v2-performance-authority-hardening/packages/toolcraft-runtime/src/react/app-shell/settings-transfer.ts`
- Modify: `/Users/kusnizza/Projects/primeui-v2-performance-authority-hardening/packages/toolcraft-runtime/src/state/persistence-snapshot.ts`
- Modify: `/Users/kusnizza/Projects/primeui-v2-performance-authority-hardening/packages/toolcraft-runtime/src/state/persistence-reader-values.ts`

1. Add optional `additionalValueTargets` to settings-transfer and local-storage persistence schemas.
2. Resolve targets as trimmed, non-empty, deduplicated strings while preserving order.
3. Union resolved settings-transfer targets with visible schema-control targets.
4. Union persistence targets with resettable/default-backed targets when writing snapshots.
5. Union persistence targets with visible schema-control targets when restoring snapshots.
6. Re-run focused tests until green.

### Task 3: Document the runtime contract

**Files:**

- Modify: `/Users/kusnizza/Projects/primeui-v2-performance-authority-hardening/starter/docs/toolcraft/schema-reference.md`

1. Document `additionalValueTargets` for Settings Transfer.
2. Document `additionalValueTargets` for local-storage persistence.
3. Explain that the allowlist is for product-owned state not represented by schema controls.

### Task 4: Refresh the standalone app and declare layout state

**Files:**

- Modify: `/Users/kusnizza/Projects/toolcraft-apps/micrographics/src/app/app-schema.ts`
- Modify: `/Users/kusnizza/Projects/toolcraft-apps/micrographics/src/app/app-schema.test.ts`
- Modify: `/Users/kusnizza/Projects/toolcraft-apps/micrographics/e2e/app-settings-transfer.spec.ts`
- Modify: `/Users/kusnizza/Projects/toolcraft-apps/micrographics/docs/toolcraft/agent-worklog.md`
- Regenerate: signed framework-owned files in `/Users/kusnizza/Projects/toolcraft-apps/micrographics`

1. Generate a fresh `micrographics` starter from the patched upstream CLI into a temporary folder.
2. Sync only framework-owned files and the integrity manifest into the standalone app.
3. Declare `composition.layout` under both `settingsTransfer.additionalValueTargets` and `persistence.additionalValueTargets`.
4. Add schema assertions for both declarations.
5. Add browser coverage that edits the canvas, exports settings, mutates the canvas, imports the downloaded file, and observes exact layout restoration.
6. Reload and assert the same layout remains through persistence.
7. Record the runtime decision and verification evidence in the worklog.

### Task 5: Verify and run

1. Run focused upstream runtime tests.
2. Run the applicable runtime typecheck, starter docs check, starter typecheck, and CLI tests.
3. Run focused app unit/browser checks during development.
4. Run one protected app `verify:delivery` pass for the completed Tier 4 batch.
5. Restart the saved app server with `npm run dev:restart`.
6. Confirm the Toolcraft identity endpoint and app title on the saved URL.


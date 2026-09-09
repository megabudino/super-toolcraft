# Vestaboard Settings Transfer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable built-in Creative Apps Kit settings import/export for the Vestaboard editor.

**Architecture:** Use schema `settingsTransfer` so the runtime inserts the Settings section and owns JSON import/export. Update local acceptance validators/tests to allow the runtime-generated Settings section while still rejecting hand-authored generic Settings sections.

**Tech Stack:** Creative Apps Kit schema/runtime, Vitest, Playwright.

---

### Task 1: Enable Schema Settings Transfer

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-schema.test.ts`
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Update schema**

Set `settingsTransfer` to:

```ts
settingsTransfer: {
  appId: "vesta-split-flap",
  enabled: true,
  fileName: "vesta-split-flap-settings.json",
},
```

- [ ] **Step 2: Update schema tests**

Replace the disabled-settings assertion with an enabled-settings assertion:

```ts
expect(appSchema.settingsTransfer.mode).toBe(true);
expect(appSchema.settingsTransfer.enabled).toBe(true);
expect(appSchema.settingsTransfer.appId).toBe("vesta-split-flap");
expect(appSchema.settingsTransfer.fileName).toBe("vesta-split-flap-settings.json");
expect(getCreativeAppsKitControlOrderTargets(appSchema)[0]).toBe("runtime.settingsTransfer");
```

- [ ] **Step 3: Update worklog**

Record that Settings Transfer is enabled through runtime schema, exports/imports values, canvas size, and timeline state, and keeps footer actions for product export only.

### Task 2: Update Acceptance Rules

**Files:**
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-acceptance.test.ts`

- [ ] **Step 1: Add runtime settings acceptance**

Add an acceptance row for `runtime.settingsTransfer` with component type `settingsTransfer`, evidence `command-side-effect`, and browser test name `browser: settings transfer exports and imports board settings`.

- [ ] **Step 2: Exempt runtime Settings section from generic title rejection**

Add a helper that recognizes a section whose only control is `type: "settingsTransfer"`, and skip the generic title check for that section only.

- [ ] **Step 3: Update tests**

Update control order expectations to include `runtime.settingsTransfer` first. Add test coverage for the settings transfer acceptance row and keep the existing test that rejects hand-authored generic Settings sections.

### Task 3: Browser Coverage

**Files:**
- Modify: `e2e/app-controls.spec.ts`

- [ ] **Step 1: Add export/import test**

Create a Playwright test named `browser: settings transfer exports and imports board settings` that:

1. Changes `Message` to `SAVED`.
2. Clicks the runtime `Export settings` button and reads the downloaded JSON.
3. Changes `Message` to `CHANGED`.
4. Re-uploads the JSON through the runtime `Import settings` flow.
5. Asserts the phrase returns to `SAVED`.

- [ ] **Step 2: Keep footer clean**

Assert the sticky footer still contains `Export Video` and `Export PNG`, not settings import/export actions.

### Task 4: Verification

**Files:**
- Test-only task.

- [ ] **Step 1: Run unit and contract tests**

Run: `pnpm verify:quick`

Expected: docs checks, integrity check, and Vitest pass.

- [ ] **Step 2: Run focused browser test**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3146 pnpm exec playwright test e2e/app-controls.spec.ts --grep "settings transfer" --workers=1`

Expected: focused settings transfer browser test passes.

- [ ] **Step 3: Run browser acceptance**

Run: `CREATIVE_APPS_KIT_TEST_PORT=3147 pnpm test:browser`

Expected: browser acceptance and perf tests pass.

- [ ] **Step 4: Run build**

Run: `pnpm build`

Expected: TypeScript and Vite build pass.

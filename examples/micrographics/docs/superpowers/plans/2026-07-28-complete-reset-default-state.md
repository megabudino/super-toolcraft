# Complete Reset Default State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make global Reset restore the complete imported default poster, including the authored default layout and removal of later layout/media edits.

**Architecture:** Load the supplied settings snapshot through one typed defaults module, register `composition.layout` as the defaulted target of the existing Compose actions control, remove its redundant additional-target declarations, align acceptance and target-scoped browser helpers, and prove the media-plus-authored-layout failure path in the real UI.

**Tech Stack:** TypeScript, React, Toolcraft schema/runtime commands, Vitest, Playwright.

---

### Task 1: Lock the broken Reset path with browser coverage

**Files:**
- Modify: `e2e/app-default-state.spec.ts`

- [ ] **Step 1: Extend the Reset scenario before changing the schema**

In `browser: reset restores complete default state`, first assert the supplied
defaults (`447`, `3`, `71`, Fitness, and the eight authored templates). Insert
one template and prove Reset layout restores those eight templates. Then change
seed/count/scale/cover, Shuffle to a generated twelve-element layout, insert
another template, and upload a source image:

```ts
const poster = page.locator(outputSelector);
const templateLibrary = await getToolcraftControlFieldByTarget(
  page,
  "library.template",
);
await templateLibrary
  .getByRole("button", { name: "Simple", exact: true })
  .click();
await templateLibrary
  .getByRole("button", { name: "Radar template", exact: true })
  .click();
const posterBox = await poster.boundingBox();
if (!posterBox) throw new Error("Could not measure the poster.");
await page.mouse.click(
  posterBox.x + posterBox.width * 0.24,
  posterBox.y + posterBox.height * 0.24,
);
await expect(poster.locator("[data-element-index]")).toHaveCount(13);

const sourceImage = await getToolcraftControlFieldByTarget(page, "source.image");
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="red"/></svg>';
await sourceImage.locator('input[type="file"]').setInputFiles({
  buffer: Buffer.from(svg),
  mimeType: "image/svg+xml",
  name: "reset-source.svg",
});
```

After clicking Reset, assert the uploaded data image is absent, all scalar
defaults are restored, and the output contains the exact eight visible template
ids from the supplied layout snapshot.

- [ ] **Step 2: Run the focused test and verify the regression fails**

Run:

```bash
npx playwright test e2e/app-default-state.spec.ts \
  --grep "browser: reset restores complete default state" --workers=1
```

Expected before the fix: FAIL because Reset removes the source image but leaves
the later authored element in `composition.layout`.

### Task 2: Give authored layout a schema default

**Files:**
- Modify: `src/app/app-composition.tsx`
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Add failing schema assertions**

Assert that the Composition `commands` control owns the layout default and that
the resolved persistence/transfer schemas need no additional targets:

```ts
expect(productSections[0]?.controls.commands).toMatchObject({
  defaultValue: defaultMicrographicsValues["composition.layout"],
  target: "composition.layout",
  type: "actions",
});
expect(appSchema.persistence.additionalValueTargets).toEqual([]);
expect(appSchema.settingsTransfer.additionalValueTargets).toEqual([]);
```

- [ ] **Step 2: Run the focused schema test and verify it fails**

Run:

```bash
npx vitest run src/app/app-schema.test.ts --reporter=default
```

Expected before the fix: FAIL because Compose still targets
`composition.commands` and both additional-target arrays still contain
`composition.layout`.

- [ ] **Step 3: Implement the minimal schema ownership change**

Change the existing Compose actions control to:

```ts
commands: {
  actions: [
    { icon: "shuffle", label: "Shuffle", value: "shuffle" },
    {
      icon: "wand-sparkles",
      label: "Reset layout",
      value: "reset-layout",
    },
  ],
  defaultValue: defaultMicrographicsValues["composition.layout"],
  label: "Compose",
  target: "composition.layout",
  type: "actions",
  // Preserve the existing order/performance metadata.
},
```

Load the scalar and authored-layout defaults from
`default-settings.snapshot.json` through `default-settings.ts`. Remove
`additionalValueTargets: ["composition.layout"]` from both
`persistence` and `settingsTransfer`. Do not change their keys, storage mode,
included slices, app id, enabled mode, or file name.

Intercept `reset-layout` in the functional composition handler and write the
same snapshot default before delegating all other panel actions to the existing
export/action handler. This keeps the export implementation unchanged and
prevents a functional Reset edit from claiming the `export-png` pass.

- [ ] **Step 4: Run the focused schema test**

Run:

```bash
npx vitest run src/app/app-schema.test.ts --reporter=default
```

Expected: all schema tests pass.

### Task 3: Align acceptance and target-scoped browser actions

**Files:**
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `e2e/app-controls.spec.ts`

- [ ] **Step 1: Retarget the existing product entity**

Change the `composition-commands` acceptance target and the Composition section
inventory target from `composition.commands` to `composition.layout`:

```ts
controlAcceptance(
  "composition-commands",
  "actions",
  "composition.layout",
  // Preserve the existing interaction, observable, and action coverage.
);
```

Use `"composition.layout"` in target-scoped action coverage. The focused default
state scenario proves Shuffle, Reset layout, and global Reset without depending
on the unrelated full controls scenario.

- [ ] **Step 2: Run focused functional checks**

Run:

```bash
npx vitest run src/app/app-schema.test.ts \
  src/app/default-settings.test.ts \
  src/app/micrographics-generator.test.ts \
  src/app/app-acceptance.base-coverage.test.ts --reporter=default
npx playwright test e2e/app-default-state.spec.ts \
  --grep "browser: reset restores complete default state" \
  --workers=1
```

Expected: the focused Vitest files and browser scenario pass. Reset removes the
uploaded image and restores the exact supplied snapshot.

### Task 4: Record and deliver the Tier 3 batch

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Record the verification note and Decision Trail**

Set the status to Tier 3 for complete Reset behavior and add the next iteration
covering the reproduction, root cause, schema-target decision, rejected hidden
control/history watcher, state/output mapping, files, targeted checks, skipped
performance work, and remaining risks.

- [ ] **Step 2: Read the routed Verification documents**

Read `docs/toolcraft/acceptance-testing.md` and
`docs/toolcraft/performance.md`, one document per terminal/tool read, before
running proof.

- [ ] **Step 3: Run exact protected delivery verification once**

Run:

```bash
npm run verify:delivery -- --tier=3 \
  --unit-test="src/app/default-settings.test.ts" \
  --unit-test="src/app/app-schema.test.ts" \
  --unit-test="src/app/micrographics-generator.test.ts" \
  --unit-test="src/app/app-acceptance.base-coverage.test.ts" \
  --browser-test="browser: reset restores complete default state"
```

Expected: protected integrity, focused unit/browser checks, and the Tier 3
delivery receipt pass. Do not run `verify:perf`.

- [ ] **Step 4: Confirm the running app**

Run:

```bash
npm run dev
```

Expected: the command reports the saved URL if this app is already running, or
starts it on the saved port after verifying the Toolcraft identity marker.

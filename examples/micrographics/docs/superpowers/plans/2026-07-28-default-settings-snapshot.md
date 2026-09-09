# Default Settings Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the complete state from `micrographics-settings (1).json` appear on a fresh app opening and return after either global or local reset.

**Architecture:** Check in the supported `canvas` and `values` payload from the supplied export, then expose its authored layout and five differing visible defaults through one focused product module. Schema controls consume the shared values, including `composition.layout` as the defaulted target of the Compose actions control, so fresh initialization and `controls.reset` converge through the standard runtime defaults path without overwriting persisted or imported layouts before Reset.

**Tech Stack:** TypeScript, React, Toolcraft runtime commands, Vitest, Playwright.

---

### Task 1: Lock the imported snapshot with focused unit tests

**Files:**
- Create: `src/app/default-settings.snapshot.json`
- Create: `src/app/default-settings.ts`
- Create: `src/app/default-settings.test.ts`
- Modify: `src/app/app-performance-impact.json`

- [ ] **Step 1: Write the failing snapshot test**

Create tests that import `defaultMicrographicsValues`, then assert:

```ts
expect(defaultMicrographicsValues["composition.seed"]).toBe(447);
expect(defaultMicrographicsValues["composition.count"]).toBe(3);
expect(defaultMicrographicsValues["composition.kit"]).toBe("minimal");
expect(defaultMicrographicsValues["elements.scale"]).toBe(71);
expect(defaultMicrographicsValues["source.preset"]).toBe("fitness");

const elements = parseElements(
  defaultMicrographicsValues["composition.layout"],
);
expect(
  createHash("sha256")
    .update(defaultMicrographicsValues["composition.layout"])
    .digest("hex"),
).toBe("9acb1b730a3aec116c94c9853b1adc1ca8fe0ac9a76da7f4d53ecdd638de4927");
expect(elements).toHaveLength(22);
expect(elements.filter((element) => element.removed)).toHaveLength(14);
expect(elements.filter((element) => !element.removed).map(({ template }) => template))
  .toEqual([
    "big-number",
    "footer-line",
    "data-table",
    "spec-sheet",
    "contour",
    "barcode",
    "brand-lockup",
    "globe",
  ]);
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npx vitest run src/app/default-settings.test.ts --reporter=default
```

Expected: FAIL because `default-settings.ts` does not exist.

- [ ] **Step 3: Check in the supported source payload**

Create `default-settings.snapshot.json` by copying the supplied export's
top-level `canvas` and `values` objects unchanged. Omit only transfer metadata
and the disabled timeline state. The retained layout is exactly 5,429
characters and has SHA-256
`9acb1b730a3aec116c94c9853b1adc1ca8fe0ac9a76da7f4d53ecdd638de4927`.
The unit test proves that byte identity plus the complete parsed shape.

- [ ] **Step 4: Add the product-owned snapshot module**

Export a target-keyed constant:

```ts
import importedDefaultSettings from "./default-settings.snapshot.json" with {
  type: "json",
};

export const defaultMicrographicsValues = {
  "composition.count": importedDefaultSettings.values["composition.count"],
  "composition.kit": importedDefaultSettings.values["composition.kit"],
  "composition.layout": importedDefaultSettings.values["composition.layout"],
  "composition.seed": importedDefaultSettings.values["composition.seed"],
  "elements.scale": importedDefaultSettings.values["elements.scale"],
  "source.preset": importedDefaultSettings.values["source.preset"],
} as const;
```

- [ ] **Step 5: Classify the new production module**

Add `src/app/default-settings.ts` to `app-performance-impact.json` as
`functional`. It supplies runtime default data and does not alter renderer-pass
execution, invalidation, workload boundaries, lifecycle, or technique.

- [ ] **Step 6: Run the focused snapshot test**

Run:

```bash
npx vitest run src/app/default-settings.test.ts --reporter=default
```

Expected: all snapshot assertions pass.

### Task 2: Route every differing visible default through the snapshot

**Files:**
- Modify: `src/app/app-schema.test.ts`
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/micrographics-generator.test.ts`

- [ ] **Step 1: Update the schema expectations first**

Change the imported-default assertions to:

```ts
expect(composition?.controls.seed?.defaultValue).toBe(447);
expect(composition?.controls.count?.defaultValue).toBe(3);
expect(composition?.controls.kit?.defaultValue).toBe("minimal");
expect(elements?.controls.scale?.defaultValue).toBe(71);
expect(sourcePhoto?.controls.preset?.defaultValue).toBe("fitness");
```

Keep the 1080 × 1350 canvas assertion.

- [ ] **Step 2: Run the schema test and verify the old defaults fail**

Run:

```bash
npx vitest run src/app/app-schema.test.ts --reporter=default
```

Expected: FAIL for the five changed defaults.

- [ ] **Step 3: Apply the shared defaults in the schema**

Import `defaultMicrographicsValues` and use the exact target keys:

```ts
defaultValue: defaultMicrographicsValues["composition.seed"];
defaultValue: defaultMicrographicsValues["composition.count"];
defaultValue: defaultMicrographicsValues["composition.kit"];
defaultValue: defaultMicrographicsValues["elements.scale"];
defaultValue: defaultMicrographicsValues["source.preset"];
```

Give the existing Compose actions control target
`composition.layout` with
`defaultMicrographicsValues["composition.layout"]`. Remove the now-redundant
`additionalValueTargets` entries from persistence and settings transfer. Leave
every already-matching schema default, canvas size, persistence policy, and
disabled timeline behavior unchanged.

- [ ] **Step 4: Align the generator’s schema-baseline assertions**

For `createToolcraftState(appSchema)`, expect the schema base to contain the
eight visible authored default elements, seed `447`, and kit `minimal`.

- [ ] **Step 5: Run focused schema and generator tests**

Run:

```bash
npx vitest run src/app/app-schema.test.ts src/app/micrographics-generator.test.ts --reporter=default
```

Expected: both files pass.

### Task 3: Reset the exact authored layout through schema ownership

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-composition.tsx`

- [ ] **Step 1: Register the authored layout as a runtime default**

Target the existing Compose actions control at `composition.layout` and use the
snapshot string as its `defaultValue`. The runtime now includes the layout in
`state.defaults`, so global Reset stays atomic with scalar and media reset.

- [ ] **Step 2: Align the local reset action**

Intercept `reset-layout` in the functional composition handler and write:

```ts
defaultMicrographicsValues["composition.layout"]
```

Keep Shuffle clearing authored layout to `"[]"`; Shuffle intentionally requests
a newly generated composition rather than the imported default. Delegate all
other panel actions to the unchanged export/action handler.

- [ ] **Step 3: Run the focused unit suite**

Run:

```bash
npx vitest run src/app/default-settings.test.ts src/app/app-schema.test.ts src/app/micrographics-generator.test.ts --reporter=default
```

Expected: all focused tests pass.

### Task 4: Prove opening and Reset controls in the real app

**Files:**
- Modify: `e2e/app-default-state.spec.ts`

- [ ] **Step 1: Assert the clean opening**

Before mutating the app, assert:

```ts
await expect(seed.getByRole("slider")).toHaveAttribute("aria-valuenow", "447");
await expect(count.getByRole("slider")).toHaveAttribute("aria-valuenow", "3");
await expect(scale.getByRole("slider")).toHaveAttribute("aria-valuenow", "71");
await expect(
  sourcePreset.getByRole("button", { name: "Fitness", exact: true }),
).toHaveAttribute("data-selected", "true");
await expect(poster.locator("[data-element-index]")).toHaveCount(8);
```

Also assert the visible `data-template-id` sequence is exactly
`big-number`, `footer-line`, `data-table`, `spec-sheet`, `contour`, `barcode`,
`brand-lockup`, and `globe`, and the cover href is
`/covers/fitness-explore.jpg`.

- [ ] **Step 2: Assert global reset restores the same snapshot**

After changing controls, placing a template, and uploading media, click
`Reset controls` and repeat the exact default control, template, count, and
cover assertions. Confirm the uploaded image is removed.

- [ ] **Step 3: Run the focused browser check**

Run:

```bash
npx playwright test e2e/app-default-state.spec.ts \
  --grep "browser: reset restores complete default state" --workers=1
```

Expected: the browser scenario passes and protected runtime evidence is emitted
only after its assertions succeed.

### Task 5: Record and deliver the coherent Tier 3 batch

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Record the decision trail**

Append one Tier 3 entry naming the supplied JSON, complete layout initialization,
the five changed schema defaults, global and local reset behavior, preserved
persistence/import behavior, exact changed files, focused checks, skipped
timeline/media/performance certification, and any remaining risk.

- [ ] **Step 2: Read the Verification-phase contract**

Read `docs/toolcraft/acceptance-testing.md` in full before writing or running
delivery proof, then select the exact unit and browser names required by the
impact inventory and acceptance data.

- [ ] **Step 3: Run the protected delivery gate once**

Run the exact selector set:

```bash
npm run verify:delivery -- --tier=3 \
  --unit-test="src/app/default-settings.test.ts" \
  --unit-test="src/app/app-schema.test.ts" \
  --unit-test="src/app/micrographics-generator.test.ts" \
  --unit-test="src/app/app-acceptance.base-coverage.test.ts" \
  --browser-test="browser: reset restores complete default state"
```

Expected: integrity, exact focused functional/browser proof, and the ordinary
Tier 3 delivery receipt pass. Do not run the full performance audit.

- [ ] **Step 4: Start or confirm the app server**

Run:

```bash
npm run dev
```

Expected: the saved Toolcraft port serves this app’s identity endpoint and
`toolcraft-app-title` marker. If the same app is already serving there, report
that existing URL instead of starting a duplicate.

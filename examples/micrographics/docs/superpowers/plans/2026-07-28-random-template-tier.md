# Random Template Tier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Mega the initial Template Library tab and add a seeded-generation tier selector for Simple, Mega, or Both.

**Architecture:** Add one built-in segmented schema control at `composition.templateTier`. Resolve that runtime value into explicit simple and Mega pools in `poster-model.ts`, preserving Kit filtering for Simple while keeping the catalog-wide Mega pool available. Model tier density as an exhaustive discrete workload dimension consumed by the existing poster and export passes; manual template placement remains unchanged.

**Tech Stack:** React, TypeScript, Toolcraft schema/runtime state, Vitest, Playwright.

---

### Task 1: Lock the new schema and generation behavior with tests

**Files:**
- Modify: `src/app/app-schema.test.ts`
- Modify: `src/app/micrographics-generator.test.ts`

- [ ] **Step 1: Add a schema assertion for the segmented control**

```ts
expect(productSections[0]?.controls.templateTier).toMatchObject({
  defaultValue: "both",
  options: [
    { label: "Simple", value: "simple" },
    { label: "Mega", value: "mega" },
    { label: "Both", value: "both" },
  ],
  target: "composition.templateTier",
  type: "segmented",
});
```

- [ ] **Step 2: Add generator assertions for all three modes**

Create states with `composition.templateTier` set to `simple`, `mega`, and `both`; call `buildPosterScene`; assert each output tier with `templateTier(element.template)`. For `both`, assert the output contains both tier values and remains equal across repeated calls with the same seed.

- [ ] **Step 3: Run the focused unit tests and confirm the new assertions fail**

Run:

```bash
npx vitest run src/app/app-schema.test.ts src/app/micrographics-generator.test.ts --reporter=default
```

Expected: failures for missing `composition.templateTier` and the current Simple-only generator.

### Task 2: Add the runtime control and tier-aware eligible pool

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/poster-model.ts`

- [ ] **Step 1: Add the built-in segmented control**

Add this control to the Composition section:

```ts
templateTier: {
  ...responsive,
  defaultValue: "both",
  description:
    "Chooses whether seeded random compositions use Simple templates, Mega templates, or both.",
  label: "Random type",
  options: [
    { label: "Simple", value: "simple" },
    { label: "Mega", value: "mega" },
    { label: "Both", value: "both" },
  ],
  orderRole: "mode",
  target: "composition.templateTier",
  type: "segmented",
},
```

- [ ] **Step 2: Parse the new state target**

Extend `SceneConfig` with `templateTier: "simple" | "mega" | "both"` and normalize invalid persisted values to `"both"` in `readConfig`.

- [ ] **Step 3: Build explicit eligible pools**

Import `micrographTemplateIds`. Build `simplePool` from `templatesForKit(config.kit)` filtered to Simple, and `megaPool` from the full catalog filtered to Mega. Select Simple, Mega, or their combination based on `config.templateTier`.

- [ ] **Step 4: Guarantee both tiers in Both mode**

When both non-empty pools participate and the generated count is at least two, seed the chosen list with one deterministic member from each tier, then fill the remaining positions from the shuffled combined pool. Preserve deterministic output for identical state.

- [ ] **Step 5: Run the focused unit tests**

Run:

```bash
npx vitest run src/app/app-schema.test.ts src/app/micrographics-generator.test.ts --reporter=default
```

Expected: both files pass.

### Task 3: Make Mega the initial library tab and prove it in the browser

**Files:**
- Modify: `src/app/template-library-control.tsx`
- Modify: `e2e/app-canvas.spec.ts`

- [ ] **Step 1: Change the local browsing default**

Initialize the custom control tier with:

```ts
const [tier, setTier] = React.useState<"mega" | "simple">("mega");
```

- [ ] **Step 2: Add a focused browser scenario**

Add `browser: template library defaults to Mega and random tiers are selectable`. It should open the app, assert the Mega tab is pressed, assert a Mega tile is visible while a Simple-only tile is absent, then choose `Simple`, `Mega`, and `Both` through `composition.templateTier` and prove each option is reachable.

- [ ] **Step 3: Update the broad placement test's initial tier bookkeeping**

Set its initial active tier to `mega` and explicitly switch to Simple before locating Radar and Barcode.

- [ ] **Step 4: Run only the focused browser scenario**

Run:

```bash
npx playwright test e2e/app-canvas.spec.ts --grep "template library defaults to Mega" --workers=1
```

Expected: one passing browser test.

### Task 4: Align performance modeling, acceptance, section inventory, impact, and worklog

**Files:**
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/renderer-pipeline.ts`
- Modify: `e2e/app-performance-path-adapters.ts`
- Modify: `e2e/app-kernel-benchmarks.ts`
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/app-performance-impact.json`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Model tier density as a finite workload dimension**

Add `template-tier-weight` with exhaustive values Simple `1`, Both `2`, and Mega `3`. Include it in the `poster-scene` and `export-png` pass costs, compiled browser fixtures, and kernel workload.

- [ ] **Step 2: Add acceptance coverage for the tier selector**

Declare a `segmented` acceptance row for `composition.templateTier`, with `optionCoverage: ["simple", "mega", "both"]`, the focused generator test as automated evidence, and the focused browser scenario as browser evidence.

- [ ] **Step 3: Add the target to the Composition section inventory**

Include `composition.templateTier` and update the grouping reason to mention template tier.

- [ ] **Step 4: Keep exact performance ownership**

Keep schema, custom-control default, tests, and acceptance metadata functional. Keep `poster-model.ts`, `renderer-pipeline.ts`, `app-performance.ts`, the fixture adapter, and the kernel harness mapped to the exact `poster-scene` and `export-png` passes they affect.

- [ ] **Step 5: Record the Tier 3 delivery batch**

Add a worklog entry with the request, default `Both` choice, Kit/Simple and global-Mega semantics, focused checks, exact affected performance paths, skipped unrelated paths, and risks.

- [ ] **Step 6: Run exact targeted delivery once**

Run:

```bash
npm run verify:delivery -- --tier=3 --unit-test="src/app/app-schema.test.ts" --unit-test="src/app/random-template-tier.test.ts" --unit-test="src/app/renderer-pipeline.test.ts" --browser-test="browser: template library defaults to Mega and random tiers are selectable" --performance-test="<each exact impacted poster-scene/export path>"
```

Expected: integrity, code health, docs, typecheck/build, three focused unit files, one focused functional browser scenario, the protected kernel receipt, and only the exact impacted poster-scene/export paths pass.

This standalone directory is not a Git repository, so commit steps are intentionally omitted.

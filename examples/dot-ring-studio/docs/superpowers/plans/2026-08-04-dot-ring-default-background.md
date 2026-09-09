# Dot Ring Studio Default Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `#0C1A32` the fresh-state and Reset background default for Dot Ring Studio without discarding persisted user settings.

**Architecture:** Keep the schema color control as default/reset authority and align the settings parser's defensive fallback with it. Existing renderer, Infinity canvas, export, and persistence paths continue consuming the resolved `appearance.background` value unchanged.

**Tech Stack:** TypeScript, Toolcraft runtime schema, Vitest, Playwright, Canvas 2D

---

### Task 1: Add Focused Default And Reset Coverage

**Files:**
- Modify: `examples/dot-ring-studio/src/app/app-schema.test.ts`
- Modify: `examples/dot-ring-studio/e2e/app-controls.spec.ts`
- Modify: `examples/dot-ring-studio/e2e/dot-ring-export-background.spec.ts`

- [x] **Step 1: Add the settings resolver import**

Add this app-owned import beside the existing schema imports in
`src/app/app-schema.test.ts`:

```ts
import { getDotRingSettingsFromState } from "./dot-ring-settings";
```

- [x] **Step 2: Add a unit test for fresh and reset state**

Add this test inside `describe("Dot Ring Studio schema", ...)` after the product
contract test:

```ts
it("uses the approved background for fresh and reset state", () => {
  const initial = createToolcraftState(appSchema);
  const changed = toolcraftReducer(initial, {
    target: "appearance.background",
    type: "controls.setValue",
    value: { hex: "#FFFFFF" },
  });
  const reset = toolcraftReducer(changed, { type: "controls.reset" });

  expect(getDotRingSettingsFromState(initial).background).toBe("#0C1A32");
  expect(getDotRingSettingsFromState(reset).background).toBe("#0C1A32");
});
```

- [x] **Step 3: Assert the initial browser control value**

Replace the `appearance.background` case in `e2e/app-controls.spec.ts` with:

```ts
{
  action: async (control) => {
    await expect(control.getByRole("textbox").first()).toHaveValue("#0C1A32");
    await setColor(control, "#332244");
  },
  target: "appearance.background",
  title: "browser: background color changes rendered output",
},
```

- [x] **Step 4: Align the Infinity and export evidence expectation**

Set the background evidence expectation in
`e2e/dot-ring-export-background.spec.ts` to:

```ts
expectedBackgroundColor: "#0C1A32",
```

- [x] **Step 5: Run the focused unit test and confirm the old default fails**

Run from `examples/dot-ring-studio`:

```bash
pnpm exec vitest run src/app/app-schema.test.ts
```

Expected: FAIL because fresh/reset state still resolves the current schema
default `#030A16` instead of `#0C1A32`.

### Task 2: Align The Schema Default And Defensive Fallback

**Files:**
- Modify: `examples/dot-ring-studio/src/app/app-schema.ts:62`
- Modify: `examples/dot-ring-studio/src/app/dot-ring-settings.ts:92`

- [x] **Step 1: Change the schema default**

Set the existing color control default to:

```ts
background: {
  defaultValue: { hex: "#0C1A32" },
  label: "Background color",
  orderRole: "color",
  performanceReason:
    "Background color updates a single fill and should stay responsive.",
  performanceRole: "responsiveness",
  target: "appearance.background",
  type: "color",
},
```

- [x] **Step 2: Change the defensive settings fallback**

Set the background resolver to:

```ts
background: readColorHex(
  state.values["appearance.background"],
  "#0C1A32",
),
```

- [x] **Step 3: Run the focused unit test again**

Run from `examples/dot-ring-studio`:

```bash
pnpm exec vitest run src/app/app-schema.test.ts
```

Expected: PASS, including fresh state and Reset resolving to `#0C1A32`.

- [x] **Step 4: Run the focused browser acceptance**

Run from `examples/dot-ring-studio`:

```bash
pnpm exec playwright test e2e/app-controls.spec.ts --grep "browser: background color changes rendered output"
```

Expected: 1 passed; the visible Background color textbox starts at `#0C1A32`,
then changing it to `#332244` produces a stable product-output change.

- [x] **Step 5: Run the focused Infinity and export background acceptance**

Run from `examples/dot-ring-studio`:

```bash
pnpm exec playwright test e2e/dot-ring-export-background.spec.ts --grep "browser: include background controls png transparency"
```

Expected: 1 passed; the Infinity viewport and export evidence resolve the new
runtime background while preserving the existing transparency behavior.

### Task 3: Record The Decision And Run Ordinary Delivery Proof

**Files:**
- Modify: `examples/dot-ring-studio/docs/toolcraft/agent-worklog.md`
- Modify: `examples/dot-ring-studio/docs/superpowers/plans/2026-08-04-dot-ring-default-background.md`

- [x] **Step 1: Append the decision trail entry**

Append `Ordinary delivery — Default background #0C1A32` before the high-level
decision sections. Record the exact request, ordinary default/background task,
fresh/reset result, current schema/settings/persistence sources reviewed, Plan/
Implementation/Verification contracts read, unchanged `non-spatial` view and
existing interaction ownership, the choice to preserve persistence v2, rejected
schema-only and persistence-reset alternatives, the runtime state-to-preview/
Infinity/export mapping, the bare-delivery verification narrative, and the saved-
custom-background risk. The verification line must state:

```md
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
```

- [x] **Step 2: Run the protected ordinary delivery gate once**

Run from `examples/dot-ring-studio`:

```bash
npm run verify:delivery
```

Expected: PASS with an ordinary-delivery receipt derived from the existing
`appearance.background` ownership. Do not run `verify:perf`; no performance audit
is authorized or needed for this value-only change.

- [x] **Step 3: Mark completed plan checkboxes and inspect the focused diff**

Run from the monorepo root:

```bash
git diff --check
git diff -- examples/dot-ring-studio/src/app/app-schema.ts examples/dot-ring-studio/src/app/dot-ring-settings.ts examples/dot-ring-studio/src/app/app-schema.test.ts examples/dot-ring-studio/e2e/app-controls.spec.ts examples/dot-ring-studio/e2e/dot-ring-export-background.spec.ts examples/dot-ring-studio/docs/toolcraft/agent-worklog.md examples/dot-ring-studio/docs/superpowers/plans/2026-08-04-dot-ring-default-background.md
```

Expected: only the approved default, fallback, focused tests, worklog entry, and
completed implementation plan appear in this task's diff.

- [x] **Step 4: Commit only Dot Ring Studio task files**

Run from the monorepo root:

```bash
git add -- examples/dot-ring-studio/src/app/app-schema.ts examples/dot-ring-studio/src/app/dot-ring-settings.ts examples/dot-ring-studio/src/app/app-schema.test.ts examples/dot-ring-studio/e2e/app-controls.spec.ts examples/dot-ring-studio/e2e/dot-ring-export-background.spec.ts examples/dot-ring-studio/docs/toolcraft/agent-worklog.md examples/dot-ring-studio/docs/superpowers/plans/2026-08-04-dot-ring-default-background.md
git commit -m "fix(dot-ring-studio): update default background"
```

Expected: one focused implementation commit without unrelated workspace files.

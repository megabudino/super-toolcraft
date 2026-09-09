# Imported Default State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the supported values from the exported Micrographics settings file the schema defaults and Reset controls result.

**Architecture:** Keep Toolcraft schema defaults as the only source of resettable product defaults. Change only the four values that differ from the export, preserve persistence and disabled timeline behavior, and prove the mapping through unit and focused browser acceptance.

**Tech Stack:** TypeScript, Toolcraft schema, Vitest, Playwright.

---

### Task 1: Lock the imported defaults with a unit test

**Files:**
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Write the failing schema assertion**

Add an `it("uses the imported settings as product defaults", ...)` case that
locates the product sections and expects:

```ts
expect(composition?.controls.seed?.defaultValue).toBe(375);
expect(composition?.controls.count?.defaultValue).toBe(5);
expect(elements?.controls.scale?.defaultValue).toBe(80);
expect(sourcePhoto?.controls.preset?.defaultValue).toBe("chaos");
expect(appSchema.canvas.size).toEqual({
  height: 1350,
  unit: "px",
  width: 1080,
});
```

- [ ] **Step 2: Run the test and verify the old defaults fail**

Run:

```bash
npx vitest run src/app/app-schema.test.ts --reporter=default
```

Expected: FAIL for seed `137`, count `8`, scale `100`, and preset `atlas`.

### Task 2: Apply the imported defaults

**Files:**
- Modify: `src/app/app-schema.ts`

- [ ] **Step 1: Change the four schema defaults**

Apply:

```ts
seed: { defaultValue: 375, ... }
count: { defaultValue: 5, ... }
scale: { defaultValue: 80, ... }
preset: { defaultValue: "chaos", ... }
```

Leave all already-matching defaults, persistence, canvas size, and timeline
configuration unchanged.

- [ ] **Step 2: Run the focused unit test**

Run:

```bash
npx vitest run src/app/app-schema.test.ts --reporter=default
```

Expected: all tests pass.

### Task 3: Prove Reset controls restores the imported state

**Files:**
- Create: `e2e/app-default-state.spec.ts`

- [ ] **Step 1: Add the focused browser scenario**

Create `browser: reset restores imported default state`. Navigate to the app,
change seed, count, scale, and cover through their real controls, click the
runtime `Reset controls` button, then assert:

```ts
await expect(seedSlider).toHaveAttribute("aria-valuenow", "375");
await expect(countSlider).toHaveAttribute("aria-valuenow", "5");
await expect(scaleSlider).toHaveAttribute("aria-valuenow", "80");
await expect(chaosButton).toHaveAttribute("data-selected", "true");
await expect(poster.locator("[data-element-index]")).toHaveCount(5);
await expect(posterCover).toHaveAttribute("href", "/covers/chaos-blue.jpg");
```

- [ ] **Step 2: Run the focused browser scenario**

Run:

```bash
npx playwright test e2e/app-default-state.spec.ts --workers=1
```

Expected: one test passes.

### Task 4: Record and deliver the batch

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Record Tier 2 decisions**

Add a Decision Trail entry covering the imported JSON source, the four changed
defaults, preserved persistence, ignored metadata/timeline, targeted checks,
and skipped performance work.

- [ ] **Step 2: Run exact delivery verification**

Run:

```bash
npm run verify:delivery -- --tier=2 \
  --unit-test="src/app/app-schema.test.ts" \
  --browser-test="browser: reset restores imported default state"
```

Expected: integrity, focused unit/browser proof, and the Tier 2 delivery receipt
pass. Do not run the full performance audit.

- [ ] **Step 3: Confirm the existing dev server**

Verify the saved project URL serves the Toolcraft title marker. Start
`npm run dev` only if the existing server is not already serving this app.

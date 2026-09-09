# Sprinkle Surface Embedding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every sprinkle sit slightly inside the current icing surface and allow signed surface-offset tuning.

**Architecture:** Keep icing sampling and tangential relaxation unchanged. Replace full-radius support with a shape-aware embedded support distance, then add the signed runtime offset along the sampled local normal. Extend the existing schema, parsing, acceptance, and browser proof rather than adding a second control.

**Tech Stack:** TypeScript, Three.js, Toolcraft runtime schema, Vitest, Playwright.

---

Verification tier: Tier 3
Reason: Sprinkle instance geometry, a renderer-driving schema range, imported settings validation, and browser-visible output change.
Run: Focused Vitest and Playwright during development, then bare `npm run verify:delivery`.
Skip: Measured performance; the user requested functional geometry behavior, not a performance iteration.

### Task 1: Specify Signed Placement

**Files:**
- Modify: `src/app/donut/donut-sprinkle-layout.test.ts`
- Modify: `src/app/donut/donut-values.test.ts`
- Modify: `src/app/donut/donut-schema.test.ts`

- [ ] **Step 1: Write failing geometry assertions**

For each sprinkle shape at zero offset, compute:

```ts
const distance = new Vector3(...item.position)
  .sub(new Vector3(...item.surfacePosition))
  .dot(new Vector3(...item.normal));
const transverseRadius = Math.max(item.scale[0], item.scale[2]) * 0.5;
expect(distance).toBeCloseTo(transverseRadius * 0.82, 6);
```

Then compare otherwise identical layouts at `surfaceOffset: -0.04`, `0`, and
`0.04`; the projected support distance must change by exactly the authored
signed offset.

- [ ] **Step 2: Write failing parser and schema assertions**

Parse `"sprinkles.surfaceOffset": -0.08` and expect `-0.08`. Parse values below
`-0.15` and above `0.15` and expect symmetric clamping. Assert the schema slider
has `min: -0.15` and `max: 0.15`.

- [ ] **Step 3: Run the focused tests and confirm the old zero-lower-bound behavior fails**

Run:

```bash
pnpm exec vitest run src/app/donut/donut-sprinkle-layout.test.ts src/app/donut/donut-values.test.ts src/app/donut/donut-schema.test.ts
```

Expected: the embedding ratio, negative parsing, and slider-min assertions fail.

### Task 2: Implement Shape-Aware Embedding

**Files:**
- Modify: `src/app/donut/donut-sprinkle-layout.ts`
- Modify: `src/app/donut/donut-values.ts`
- Modify: `src/app/donut/donut-schema-sections.ts`
- Modify: `src/app/donut/donut-reference-acceptance.ts`

- [ ] **Step 1: Add the shared embedding ratio**

Declare:

```ts
export const DONUT_SPRINKLE_SUPPORT_RATIO = 0.82;
```

Build each support distance as:

```ts
const transverseRadius = Math.max(scale[0], scale[2]) * 0.5;
const supportOffset =
  transverseRadius * DONUT_SPRINKLE_SUPPORT_RATIO +
  sprinkles.surfaceOffset;
```

- [ ] **Step 2: Accept and expose signed offsets**

Change both the runtime parser and schema slider limits to `-0.15` and `0.15`.
Update the tooltip and acceptance wording so zero means natural contact,
negative means deeper embedding, and positive means lift.

- [ ] **Step 3: Run focused unit tests**

Run the Task 1 Vitest command.

Expected: all focused tests pass.

### Task 3: Prove the Negative Control in the Browser

**Files:**
- Modify: `e2e/donut-product.spec.ts`
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/app-verification-impact.json`

- [ ] **Step 1: Strengthen the existing surface-offset browser scenario**

Inside the generated deep-control test, special-case
`sprinkles.surfaceOffset`: assert the slider has `min="-0.15"`, set it to
`-0.08`, assert the retained input value, and prove the renderer output
signature changes.

- [ ] **Step 2: Align acceptance and ownership**

Describe the signed embed/lift behavior in the existing deep-control acceptance
row and make sure the changed geometry/schema modules retain ownership of the
`sprinkles.surfaceOffset` acceptance path.

- [ ] **Step 3: Run focused browser proof**

Run:

```bash
pnpm exec playwright test e2e/donut-product.spec.ts --grep 'sprinkles\.surfaceOffset'
```

Expected: one test passes and the slider retains a negative value.

### Task 4: Record and Deliver the Coherent Batch

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Record the geometry decision**

Add the user request, shape-aware support ratio, signed offset range, retained
settings target, verification tier, and the decision not to run measured
performance.

- [ ] **Step 2: Run static checks**

Run:

```bash
pnpm ai:check
pnpm exec tsc --noEmit
```

Expected: both commands pass.

- [ ] **Step 3: Run the protected delivery gate**

Run:

```bash
npm run verify:delivery
```

Expected: a successful functional-targeted delivery receipt covering the
settings defaults and sprinkle geometry change.

- [ ] **Step 4: Confirm the existing dev server**

Verify the saved app port serves the Toolcraft identity endpoint and index title.
If no matching server exists, run `npm run dev`.


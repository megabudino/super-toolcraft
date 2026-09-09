# Fine Details Trail Card Radius Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live `0–100 px` Toolcraft slider that controls and persists the shared corner radius of Fine Details trail cards.

**Architecture:** Extend the existing `trail` settings contract with one numeric `cardRadius` property on both sides of the versioned Toolcraft-to-website bridge. Keep the current media pipeline untouched: radius changes invalidate only preview sync, and the website applies the normalized value to the existing clipping card element.

**Tech Stack:** TypeScript, React 19, Next.js 16 `Image`, Motion, Toolcraft control schema, Vitest, Node test runner.

---

### Task 1: Extend the Toolcraft trail contract and control

**Files:**
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.product.test.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-trail-values.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-trail-control-sections.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-pipeline.ts`
- Modify: `recraft-tools/fine-details/src/app/app-acceptance-data.ts`

- [ ] **Step 1: Write the failing Toolcraft contract test**

Add `cardRadius: 0` to the expected `FINE_DETAILS_PREVIEW_DEFAULTS.trail` object and add this focused product test:

```ts
it("publishes a live 0–100 px trail card radius control", () => {
  const trailSection = appSchema.panels.controls?.sections.find(
    (section) => section.id === "trail",
  );

  expect(trailSection?.controls.cardRadius).toMatchObject({
    defaultValue: 0,
    label: "Card radius",
    max: 100,
    min: 0,
    step: 1,
    target: "trail.cardRadius",
    type: "slider",
    unit: "px",
  });
  expect(createFineDetailsTrailFromValues({ "trail.cardRadius": 140 }).cardRadius).toBe(100);
  expect(createFineDetailsTrailFromValues({}).cardRadius).toBe(0);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run src/app/fine-details-preview.product.test.ts
```

Expected: FAIL because `trail.cardRadius` and `cardRadius` do not exist yet.

- [ ] **Step 3: Add the Toolcraft target, default, normalization, and slider**

In `fine-details-trail-values.ts`, add the target and setting property:

```ts
cardRadius: "trail.cardRadius",
```

```ts
cardRadius: number;
```

Add `cardRadius: 0` to `FINE_DETAILS_TRAIL_DEFAULTS`, then normalize it in `createFineDetailsTrailFromValues`:

```ts
cardRadius: numberValue(
  values[fineDetailsTrailTargets.cardRadius],
  FINE_DETAILS_TRAIL_DEFAULTS.cardRadius,
  0,
  100,
),
```

In the Trail control section, place this control immediately after `cardSize`:

```ts
cardRadius: trailSlider({
  applicability: trailActive,
  defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.cardRadius,
  label: "Card radius",
  max: 100,
  min: 0,
  step: 1,
  target: fineDetailsTrailTargets.cardRadius,
  unit: "px",
}),
```

- [ ] **Step 4: Register preview invalidation and product acceptance**

Add `fineDetailsTrailTargets.cardRadius` beside `cardSize` in `previewSettingsTargets`. Add a slider acceptance entry:

```ts
fineDetailsControlAcceptance({
  componentType: "slider",
  expectedObservable:
    "Every trail image is clipped by the selected shared pixel corner radius.",
  target: fineDetailsTrailTargets.cardRadius,
  userAction: "Drag Trail Card radius.",
}),
```

Add the target to the `trail` acceptance section's target list and update the section copy from twelve to thirteen primary controls.

- [ ] **Step 5: Run the focused Toolcraft test and verify it passes**

Run:

```bash
pnpm exec vitest run src/app/fine-details-preview.product.test.ts
```

Expected: PASS, including `validateProductAcceptanceCoverage()`.

### Task 2: Extend website normalization and persistence

**Files:**
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-trail-card-radius.test.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-applied-settings.json`
- Modify: `recraft-tools/fine-details/e2e/product-fine-details-preview.spec.ts`

- [ ] **Step 1: Write a failing website settings contract test**

Create a source-contract test consistent with the existing Fine Details component tests:

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const settingsSource = readFileSync(new URL('./fine-details-settings.ts', import.meta.url), 'utf8');
const trailSource = readFileSync(new URL('./fine-details-image-trail.tsx', import.meta.url), 'utf8');

test('trail card radius is defaulted, bounded, persisted and rendered', () => {
  assert.match(settingsSource, /cardRadius: number;/);
  assert.match(settingsSource, /cardRadius: 0,/);
  assert.match(
    settingsSource,
    /normalizeDefaultedNumber\(value\.cardRadius, defaults\.cardRadius, 0, 100\)/,
  );
  assert.match(settingsSource, /cardRadius: settings\.trail\.cardRadius/);
  assert.match(trailSource, /borderRadius: settings\.cardRadius/);
});
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run:

```bash
node --test src/components/pages/home/fine-details-trail-card-radius.test.ts
```

Expected: FAIL because the settings and renderer do not contain `cardRadius`.

- [ ] **Step 3: Add the website trail setting**

In `fine-details-settings.ts`, add `cardRadius: number` to `FineDetailsTrailSettings` and `cardRadius: 0` to `defaultFineDetailsTrailSettings`. Normalize it with:

```ts
const cardRadius = normalizeDefaultedNumber(
  value.cardRadius,
  defaults.cardRadius,
  0,
  100,
);
```

Require `cardRadius !== null`, return it in the normalized trail object, and include it in `createPersistedFineDetailsSettings`:

```ts
cardRadius: settings.trail.cardRadius,
```

Add `"cardRadius": 0` next to `"cardSize"` in `fine-details-applied-settings.json` so the checked-in site default remains explicit.

Add `cardRadius: 0` to the expected applied trail settings in `product-fine-details-preview.spec.ts`, keeping the browser contract aligned with the expanded persisted payload.

- [ ] **Step 4: Confirm backward compatibility and persistence in the focused contract**

Keep `normalizeDefaultedNumber` rather than a required bounded number so payloads created before this feature receive `0`. The existing Apply path serializes the new field through `createPersistedFineDetailsSettings`; the existing Reset path uses `defaultFineDetailsTrailSettings.cardRadius`.

### Task 3: Apply the radius to the existing trail-card clip

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-image-trail.tsx`
- Test: `recraft-v4-styles/src/components/pages/home/fine-details-trail-card-radius.test.ts`

- [ ] **Step 1: Render the radius without changing geometry**

Add the property to the existing outer Motion card style:

```ts
style={{
  borderRadius: settings.cardRadius,
  boxShadow,
  height: settings.cardSize,
  left: card.x,
  top: card.y,
  width: cardWidth,
}}
```

Keep `className="absolute overflow-hidden"`; this clips the existing Next Image to the configured corners while leaving width, height, aspect, animation, and shadow calculations unchanged.

- [ ] **Step 2: Run only the targeted Fine Details checks**

Run:

```bash
node --test \
  src/components/pages/home/fine-details-trail-card-radius.test.ts \
  src/components/pages/home/fine-details-image-trail-image.test.ts \
  src/components/pages/home/fine-details-image-trail-motion.test.ts \
  src/components/pages/home/fine-details-image-trail-prompt-focus.test.ts
```

Expected: all targeted website tests PASS.

Run:

```bash
pnpm exec vitest run src/app/fine-details-preview.product.test.ts
```

Expected: the focused Toolcraft product test PASS.

- [ ] **Step 3: Review the scoped diff without committing**

Run:

```bash
git diff -- \
  recraft-tools/fine-details/src/app \
  recraft-tools/fine-details/docs/superpowers/specs/2026-08-24-fine-details-trail-card-radius-design.md \
  recraft-tools/fine-details/docs/superpowers/plans/2026-08-24-fine-details-trail-card-radius.md \
  recraft-v4-styles/src/components/pages/home/fine-details-settings.ts \
  recraft-v4-styles/src/components/pages/home/fine-details-applied-settings.json \
  recraft-v4-styles/src/components/pages/home/fine-details-image-trail.tsx \
  recraft-v4-styles/src/components/pages/home/fine-details-trail-card-radius.test.ts
```

Expected: only the approved radius settings path, control, renderer, tests, spec, and plan are present. Do not commit or push; the user will test locally first.

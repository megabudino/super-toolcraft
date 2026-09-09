# Fine Details Trail Card Border Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated Toolcraft section that enables and configures a geometry-preserving solid border on every Fine Details trail card.

**Architecture:** Extend the shared trail settings contract with a nested `border` object and three Toolcraft targets. Border controls invalidate only preview sync; the website validates and persists the object, then applies a native border inside the existing Motion card bounds with `box-sizing: border-box`.

**Tech Stack:** TypeScript, React 19, Next.js 16, Motion, Toolcraft control schema, Vitest, Node test runner.

---

### Task 1: Define and test the Toolcraft border controls

**Files:**
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.product.test.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-trail-values.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-trail-control-sections.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-pipeline.ts`
- Modify: `recraft-tools/fine-details/src/app/app-acceptance-data.ts`

- [ ] **Step 1: Write the failing Toolcraft product test**

Add `border: { color: "#FFFFFF", enabled: false, width: 1 }` to the expected trail defaults, add `Trail Border` between Trail Motion and Trail Shadow in the expected section titles, and add this focused test:

```ts
it("publishes conditional trail border controls", () => {
  const borderSection = appSchema.panels.controls?.sections.find(
    (section) => section.id === "trail-border",
  );

  expect(borderSection?.controls.borderEnabled).toMatchObject({
    defaultValue: false,
    label: "Border",
    target: "trail.border.enabled",
    type: "switch",
  });
  expect(borderSection?.controls.borderWidth).toMatchObject({
    defaultValue: 1,
    label: "Border width",
    max: 20,
    min: 1,
    step: 1,
    target: "trail.border.width",
    type: "slider",
    unit: "px",
  });
  expect(borderSection?.controls.borderColor).toMatchObject({
    defaultValue: "#FFFFFF",
    label: "Border color",
    target: "trail.border.color",
    type: "color",
  });
  expect(
    createFineDetailsTrailFromValues({
      "trail.border.color": "#00FF88",
      "trail.border.enabled": true,
      "trail.border.width": 40,
    }).border,
  ).toEqual({ color: "#00FF88", enabled: true, width: 20 });
  expect(createFineDetailsTrailFromValues({}).border).toEqual({
    color: "#FFFFFF",
    enabled: false,
    width: 1,
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run src/app/fine-details-preview.product.test.ts -t "publishes conditional trail border controls"
```

Expected: FAIL because the border section and trail border settings do not exist.

- [ ] **Step 3: Add Toolcraft targets, defaults, and normalization**

Add the three targets:

```ts
borderColor: "trail.border.color",
borderEnabled: "trail.border.enabled",
borderWidth: "trail.border.width",
```

Add this nested property to `FineDetailsTrailSettings` and its defaults:

```ts
border: Readonly<{
  color: string;
  enabled: boolean;
  width: number;
}>;
```

```ts
border: { color: "#FFFFFF", enabled: false, width: 1 },
```

Add a solid-color helper matching the existing uppercase Toolcraft color contract:

```ts
function colorValue(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9A-F]{6}$/.test(value)
    ? value
    : fallback;
}
```

Map the three values in `createFineDetailsTrailFromValues`:

```ts
border: {
  color: colorValue(
    values[fineDetailsTrailTargets.borderColor],
    FINE_DETAILS_TRAIL_DEFAULTS.border.color,
  ),
  enabled: booleanValue(
    values[fineDetailsTrailTargets.borderEnabled],
    FINE_DETAILS_TRAIL_DEFAULTS.border.enabled,
  ),
  width: numberValue(
    values[fineDetailsTrailTargets.borderWidth],
    FINE_DETAILS_TRAIL_DEFAULTS.border.width,
    1,
    20,
  ),
},
```

- [ ] **Step 4: Add the dedicated conditional control section**

Define `trailBorderActive` with both `trail.enabled` and `trail.border.enabled`. Extend the slider helper applicability union to accept it, then add this section after Trail Motion:

```ts
{
  controls: {
    borderEnabled: {
      applicability: trailActive,
      defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.border.enabled,
      label: "Border",
      orderRole: "mode" as const,
      performanceReason:
        "The shared trail-card border must appear or disappear immediately.",
      performanceRole: "responsiveness" as const,
      target: fineDetailsTrailTargets.borderEnabled,
      type: "switch" as const,
    },
    borderWidth: trailSlider({
      applicability: trailBorderActive,
      defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.border.width,
      label: "Border width",
      max: 20,
      min: 1,
      step: 1,
      target: fineDetailsTrailTargets.borderWidth,
      unit: "px",
    }),
    borderColor: {
      applicability: trailBorderActive,
      defaultValue: FINE_DETAILS_TRAIL_DEFAULTS.border.color,
      label: "Border color",
      performanceReason:
        "The shared trail-card border color must update immediately.",
      performanceRole: "responsiveness" as const,
      target: fineDetailsTrailTargets.borderColor,
      type: "color" as const,
    },
  },
  id: "trail-border",
  title: "Trail Border",
},
```

- [ ] **Step 5: Register preview and product acceptance contracts**

Add all three border targets to `previewSettingsTargets`:

```ts
fineDetailsTrailTargets.borderEnabled,
fineDetailsTrailTargets.borderWidth,
fineDetailsTrailTargets.borderColor,
```

Add the three acceptance entries:

```ts
fineDetailsControlAcceptance({
  componentType: "switch",
  expectedObservable:
    "The shared solid border appears or disappears on every retained and newly spawned trail card.",
  target: fineDetailsTrailTargets.borderEnabled,
  userAction: "Toggle Trail Border.",
}),
fineDetailsControlAcceptance({
  componentType: "slider",
  expectedObservable:
    "Every trail card uses the selected internal border width without changing its outer bounds.",
  target: fineDetailsTrailTargets.borderWidth,
  userAction: "Drag Trail Border width.",
}),
fineDetailsControlAcceptance({
  componentType: "color",
  expectedObservable:
    "Every trail card border uses the selected solid color without changing its image or shadow.",
  target: fineDetailsTrailTargets.borderColor,
  userAction: "Choose a Trail Border color.",
}),
```

Register the control inventory section:

```ts
{
  entity: "Fine Details cursor trail border",
  entityId: "fine-details-trail-border",
  groupingReason:
    "Visibility, width, and color jointly define the shared solid border for every trail card.",
  id: "trail-border",
  targets: [
    fineDetailsTrailTargets.borderEnabled,
    fineDetailsTrailTargets.borderWidth,
    fineDetailsTrailTargets.borderColor,
  ],
  title: "Trail Border",
},
```

- [ ] **Step 6: Run the focused Toolcraft test**

Run:

```bash
pnpm exec vitest run src/app/fine-details-preview.product.test.ts -t "sends the canvas height|publishes conditional trail border controls"
```

Expected: both selected tests PASS.

### Task 2: Normalize and persist the website border settings

**Files:**
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-trail-card-border.test.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-applied-settings.json`
- Modify: `recraft-tools/fine-details/e2e/product-fine-details-preview.spec.ts`

- [ ] **Step 1: Write the failing website border contract test**

Create:

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const settingsSource = readFileSync(new URL('./fine-details-settings.ts', import.meta.url), 'utf8');
const trailSource = readFileSync(new URL('./fine-details-image-trail.tsx', import.meta.url), 'utf8');

test('trail card border is defaulted, bounded, persisted and rendered inside card bounds', () => {
  assert.match(settingsSource, /border: FineDetailsBorderSettings;/);
  assert.match(settingsSource, /border: \{ color: '#FFFFFF', enabled: false, width: 1 \}/);
  assert.match(settingsSource, /normalizeTrailBorder\(value\.border\)/);
  assert.match(settingsSource, /border: settings\.trail\.border/);
  assert.match(trailSource, /borderColor: settings\.border\.color/);
  assert.match(trailSource, /borderWidth: settings\.border\.enabled \? settings\.border\.width : 0/);
  assert.match(trailSource, /boxSizing: 'border-box'/);
});
```

- [ ] **Step 2: Run the website test and verify it fails**

Run:

```bash
node --test src/components/pages/home/fine-details-trail-card-border.test.ts
```

Expected: FAIL because border settings and rendering do not exist.

- [ ] **Step 3: Add website types, defaults, and partial-object normalization**

Define:

```ts
export interface FineDetailsBorderSettings {
  color: string;
  enabled: boolean;
  width: number;
}
```

Add `border: FineDetailsBorderSettings` and the default object to the trail settings. Add a helper that accepts a missing object or missing fields while rejecting invalid provided fields:

```ts
function normalizeTrailBorder(value: unknown): FineDetailsBorderSettings | null {
  if (value === undefined) return defaultFineDetailsTrailSettings.border;
  if (!isRecord(value)) return null;

  const defaults = defaultFineDetailsTrailSettings.border;
  const color =
    value.color === undefined
      ? defaults.color
      : typeof value.color === 'string' && /^#[0-9a-f]{6}$/i.test(value.color)
        ? value.color.toUpperCase()
        : null;
  const enabled = normalizeDefaultedBoolean(value.enabled, defaults.enabled);
  const width = normalizeDefaultedNumber(value.width, defaults.width, 1, 20);

  return color === null || enabled === null || width === null
    ? null
    : { color, enabled, width };
}
```

Call `normalizeTrailBorder(value.border)`, include it in the null guard and normalized return object, and persist it with:

```ts
border: settings.trail.border,
```

- [ ] **Step 4: Update explicit persisted defaults and Apply E2E expectation**

Add the border object beside card radius in `fine-details-applied-settings.json` and in the expected `trail` payload in `product-fine-details-preview.spec.ts`:

```json
"border": {
  "color": "#FFFFFF",
  "enabled": false,
  "width": 1
}
```

### Task 3: Render the geometry-preserving native border

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-image-trail.tsx`
- Test: `recraft-v4-styles/src/components/pages/home/fine-details-trail-card-border.test.ts`

- [ ] **Step 1: Add border styling to the existing outer card**

Keep radius, shadow, width, and height on the same Motion element and extend its style:

```ts
style={{
  borderColor: settings.border.color,
  borderRadius: settings.cardRadius,
  borderStyle: 'solid',
  borderWidth: settings.border.enabled ? settings.border.width : 0,
  boxShadow,
  boxSizing: 'border-box',
  height: settings.cardSize,
  left: card.x,
  top: card.y,
  width: cardWidth,
}}
```

The existing `overflow-hidden` remains the only clipping mechanism.

- [ ] **Step 2: Run the focused website checks**

Run:

```bash
node --test \
  src/components/pages/home/fine-details-trail-card-border.test.ts \
  src/components/pages/home/fine-details-trail-card-radius.test.ts \
  src/components/pages/home/fine-details-image-trail-image.test.ts \
  src/components/pages/home/fine-details-image-trail-motion.test.ts \
  src/components/pages/home/fine-details-image-trail-prompt-focus.test.ts
```

Expected: all selected tests PASS.

- [ ] **Step 3: Run the focused Toolcraft checks**

Run:

```bash
pnpm exec vitest run src/app/fine-details-preview.product.test.ts -t "sends the canvas height|publishes a live 0–100 px trail card radius control|publishes conditional trail border controls"
```

Expected: all three selected tests PASS.

- [ ] **Step 4: Review the scoped changes without committing**

Inspect the radius-adjacent Toolcraft and website files, new border test, applied JSON, E2E expectation, spec, and plan. Confirm that no image derivative, card geometry, motion, prompt focus, or shadow logic changed. Do not commit or push; the user will test the running local server.

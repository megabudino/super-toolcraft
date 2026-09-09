# Hero Sphere Card Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Sphere rows from disappearing when a card center crosses the lens latitude limit while any part of that card is still visible.

**Architecture:** Keep the existing cycle candidate range, card geometry, row spacing, viewport intersection, frame cap, depth ordering, near-plane clipping, and backface culling. Remove only the contradictory center-only latitude rejection so full-card intersection and the renderer remain the visibility authority.

**Tech Stack:** TypeScript, Node test runner through `tsx`, WebGL scene/field/post renderer, Playwright-backed Toolcraft preview.

---

## Verification Tier

This is a later-stage Tier 3 renderer behavior fix. Verification is intentionally focused: one exact layout regression, the existing phase-carry layout regression, the supplied Toolcraft JSON in the real iframe, formatting, and `git diff --check`. Broad build, aggregate browser suites, and measured performance are out of scope.

### Task 1: Lock the reported disappearing-row state in a focused regression

**Files:**

- Create: `recraft-v4-styles/src/components/pages/home/hero-sphere-layout-visibility.test.ts`
- Reference: `recraft-v4-styles/src/components/pages/home/hero-sphere-layout.ts:145`
- Reference: `recraft-v4-styles/src/components/pages/home/hero-sphere-layout-phase.test.ts:1`

- [x] **Step 1: Add a test fixture matching the supplied JSON geometry**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import type { HeroGalleryImageSource } from './hero-gallery-sources';
import { layoutHeroSphereGallery } from './hero-sphere-layout';

const source: HeroGalleryImageSource = {
  height: 1389,
  id: 'reported-card',
  key: 'reported-card',
  ready: true,
  transform: { flipHorizontal: false, flipVertical: false, rotationDeg: 0 },
  url: '/reported-card.png',
  width: 1080,
};

function layoutAt(panY: number) {
  return layoutHeroSphereGallery({
    bendX: 0.5,
    bendY: 0.99,
    bleed: { horizontal: 256, vertical: 80 },
    cardHeight: 610,
    focal: 1660,
    gap: 35,
    pan: { turns: 2, x: 0.10278273062713428, y: panY },
    phaseCarries: [0, 0, 0],
    phases: [0, 0, 0],
    principal: { x: 890.88, y: 574.36 },
    rowGap: 17,
    rowSources: [[source], [source], [source]],
    rows: [
      { offset: -101, speed: 3 },
      { offset: -9, speed: 14.5 },
      { offset: -8, speed: 3 },
    ],
    rx: 990,
    ry: 410,
    rz: 1390,
    viewport: { height: 1136, width: 1920 },
  });
}

test('keeps every intersecting row when card centers cross the lens latitude limit', () => {
  for (const panY of [-0.672, -0.6760161940841449, -0.68]) {
    const layout = layoutAt(panY);
    const visibleRows = [...new Set(layout.cards.map((card) => card.rowIndex))].toSorted();

    assert.deepEqual(visibleRows, [0, 1, 2]);
    assert.ok(layout.cards.length <= 96);
    assert.deepEqual(
      layout.cards.map((card) => card.order),
      layout.cards.map((_, index) => index),
    );
  }
});
```

- [x] **Step 2: Run the new test and confirm the expected red state**

Run from `recraft-v4-styles`:

```bash
pnpm dlx tsx --test src/components/pages/home/hero-sphere-layout-visibility.test.ts
```

Expected: the assertion fails because the current center-only cutoff returns only row index `2` around the reported Pan Y.

### Task 2: Remove only the contradictory center-latitude rejection

**Files:**

- Modify: `recraft-v4-styles/src/components/pages/home/hero-sphere-layout.ts:269`
- Test: `recraft-v4-styles/src/components/pages/home/hero-sphere-layout-visibility.test.ts`
- Test: `recraft-v4-styles/src/components/pages/home/hero-sphere-layout-phase.test.ts`

- [x] **Step 1: Keep `phiCenter` as card metadata but remove the center-only `continue`**

Change:

```ts
const vCenter = baseV + cycle * panelPeriod;
const phiCenter = origin.phi0 - vCenter / Math.max(1, ry);
if (Math.abs(phiCenter) > maximumLatitude) continue;
```

to:

```ts
const vCenter = baseV + cycle * panelPeriod;
const phiCenter = origin.phi0 - vCenter / Math.max(1, ry);
```

Do not alter `getLimitedCycleRange`, `cardIntersectsViewport`, the 96-card cap, sorting, `Row gap`, Pan, lens projection, or any shader.

- [x] **Step 2: Run the focused visibility and phase-carry tests**

```bash
pnpm dlx tsx --test \
  src/components/pages/home/hero-sphere-layout-visibility.test.ts \
  src/components/pages/home/hero-sphere-layout-phase.test.ts
```

Expected: both test files pass; the reported fixture retains row indices `0`, `1`, and `2`, and phase/copy identity remains unchanged.

- [x] **Step 3: Format only the touched website files**

```bash
pnpm exec oxfmt \
  src/components/pages/home/hero-sphere-layout.ts \
  src/components/pages/home/hero-sphere-layout-visibility.test.ts
```

Expected: formatter exits successfully without unrelated rewrites.

### Task 3: Verify the real Toolcraft iframe and record the result

**Files:**

- Modify: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`
- Input: `/Users/kusnizza/Downloads/hero-settings (1).json`

- [x] **Step 1: Import the supplied JSON through the real Toolcraft UI**

Use the existing Toolcraft server and website iframe. Import `/Users/kusnizza/Downloads/hero-settings (1).json`, wait for `data-hero-gallery-ready="true"`, and confirm the Sphere preview reports Pan approximately `0.1028:-0.6760:2` with the `scene→field→post` pipeline.

- [x] **Step 2: Inspect the exact failing position and adjacent Pan positions**

At Pan Y `-0.6760161940841449`, confirm upper, middle, and lower row geometry is present. Move Pan slightly across `-0.672` and `-0.680`; rows must move continuously instead of collapsing to one row and reappearing. Confirm card dimensions, `Row gap`, horizontal gap, lens bend, and dispersion appearance do not change.

- [x] **Step 3: Record Delivery 27 in the Toolcraft worklog**

Append a concise Delivery 27 entry that records:

- protocol remains v14;
- root cause was the redundant center-only `±85°` cutoff after a full-card candidate range;
- the fix delegates visibility to full-card viewport intersection plus existing near-plane/backface clipping;
- card size, gaps, Pan mapping, lens geometry, shaders, and settings are unchanged;
- exact focused tests and real supplied-JSON browser evidence;
- no aggregate build, broad browser suite, or measured performance run.

- [x] **Step 4: Run final focused hygiene checks**

From the repository root:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the intended visibility regression, one-line layout fix, worklog update, and already-existing user changes appear. Do not stage or modify the user's Pan-handle/CSS/planning files.

## Completion Criteria

- The exact reported Pan state retains all three intersecting rows.
- Adjacent Pan positions no longer blink rows in or out.
- Cards still leave only through full-card viewport rejection, near-plane clipping, or backface culling.
- The 96-card cap and deterministic output ordering remain intact.
- No setting, protocol, shader, card size, gap, Pan mapping, or lens geometry changes.

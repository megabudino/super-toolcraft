# Fine Details Carousel Auto Height and Text Gap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace manual carousel height with one shared text-gap control and automatically size every card to the measured typography band with an 800px cap.

**Architecture:** Toolcraft replaces `carousel.height` with `carousel.textGap` and advances the paired preview protocol to v7. The website normalizes/persists the new field and derives card height from the measured band using `Math.min(800, bandHeight - 2 * textGap)`; all other carousel rendering behavior stays unchanged.

**Tech Stack:** TypeScript, React 19, Next.js `next/image`, Toolcraft runtime schema, CSS Modules, Vitest, Node test runner.

---

### Task 1: Paired Toolcraft and website auto-height migration

**Files:**
- Modify: `recraft-tools/fine-details/src/app/fine-details-carousel-values.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-carousel-control-sections.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-protocol.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-pipeline.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.tsx`
- Modify: `recraft-tools/fine-details/src/app/app-acceptance-data.ts`
- Modify: `recraft-tools/fine-details/src/app/app-performance.ts`
- Modify: `recraft-tools/fine-details/e2e/product-fine-details-preview.spec.ts`
- Modify: `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`
- Modify: Toolcraft carousel/product protocol tests that assert the replaced target or v6
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-image-carousel.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-preview-boundary.tsx`
- Modify: website carousel/settings tests that assert manual height or v6

- [ ] **Step 1: Change focused tests to the approved contract**

Toolcraft expectations must use:

```ts
expect(fineDetailsCarouselTargets.textGap).toBe("carousel.textGap");
expect(FINE_DETAILS_CAROUSEL_DEFAULTS.textGap).toBe(24);
expect(FINE_DETAILS_PREVIEW_VERSION).toBe(7);
```

Website expectations must use:

```ts
assert.equal(defaultFineDetailsCarouselSettings.textGap, 24);
assert.equal(normalized?.carousel.textGap, 200); // clamped upper boundary
assert.match(boundarySource, /const previewProtocolVersion = 7/);
```

The component contract must assert the automatic formula and fixed cap:

```ts
const usableHeight = bandHeight - settings.textGap * 2;
const effectiveHeight = Math.min(800, usableHeight);
```

- [ ] **Step 2: Replace the Toolcraft height target and control**

Use this target/default model:

```ts
textGap: "carousel.textGap",
// defaults
textGap: 24,
```

Normalize with `0..200`. Replace the Height slider with a continuous `Text gap` slider, `0..200`, step `1`, unit `px`, default `24`. Remove `carousel.height` from values, controls, pipeline invalidation, acceptance, inventory targets, preview data attributes, and product tests. Keep all other 13 carousel targets unchanged.

- [ ] **Step 3: Advance the paired protocol to v7**

Set both constants to `7`:

```ts
export const FINE_DETAILS_PREVIEW_VERSION = 7;
const previewProtocolVersion = 7;
```

The payload `carousel` object carries `textGap` and no `height`. Update runtime id and protocol fixture wording to v7. Pointer/media message shapes remain unchanged.

- [ ] **Step 4: Replace website settings and persistence**

Use:

```ts
export interface FineDetailsCarouselSettings {
  border: FineDetailsCarouselBorderSettings;
  count: number;
  gap: number;
  radius: number;
  shadow: FineDetailsShadowSettings;
  speed: number;
  textGap: number;
}
```

Default `textGap` to `24`, clamp it to `0..200`, ignore legacy `carousel.height`, and ensure persisted settings write `textGap` but not `height`.

- [ ] **Step 5: Derive card height from the typography band**

In the existing measurement callback calculate:

```ts
const usableHeight = bandHeight - settings.textGap * 2;
const effectiveHeight = isValid && usableHeight > 0
  ? Math.min(800, usableHeight)
  : 0;
```

The band is valid for card rendering only when `effectiveHeight > 0`. Keep the root band spanning the typography edges and center the full-height viewport so a capped card keeps equal residual spacing. Remove all manual-height dependencies and keep the existing typography measurement key, loop math, Next Image sizing, border, shadow, hover pause, and reduced-motion logic.

- [ ] **Step 6: Update the authored integration scenario and worklog**

The unexecuted Playwright scenario must stop writing `carousel.height`. Use `count: 4` plus `gap: 100` for overflow and `count: 1` for static fit. Update the existing Decision Trail to record automatic height, the 800px cap, one shared text gap, protocol v7, focused checks, and no browser/performance run.

- [ ] **Step 7: Run only focused checks**

Run:

```bash
pnpm exec vitest run src/app/fine-details-carousel-values.test.ts src/app/fine-details-carousel-toolcraft.test.ts --reporter=default
```

from `recraft-tools/fine-details`, and:

```bash
pnpm dlx tsx --test src/components/pages/home/fine-details-settings.test.ts src/components/pages/home/fine-details-carousel.test.ts
```

from `recraft-v4-styles`, followed by repository-root `git diff --check`. Do not run Playwright, builds, full suites, delivery verification, or measured performance.

- [ ] **Step 8: Hand off without commit**

Report touched files, focused test counts, and remaining local visual risk. Do not commit or push because the user requested local testing first.

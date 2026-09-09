# Hero Heading Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add independent line sizing, line spacing, badge visibility, two-axis placement, and gallery-underlap for the Recraft hero heading.

**Architecture:** Keep canonical editable values in the Toolcraft schema and synchronize them through the existing iframe bridge. The Next.js website validates the new version-5 payload and remains the sole owner of the heading DOM and stacking order.

**Tech Stack:** TypeScript, React 19, Toolcraft schema/runtime, Next.js 16, CSS Modules, Vitest.

---

### Task 1: Define heading targets and schema controls

**Files:**

- Create: `src/app/hero-heading-values.ts`
- Modify: `src/app/app-schema.ts`

- [ ] Define stable targets and defaults for both line sizes, line gap, badge visibility, and normalized position.
- [ ] Add a cohesive `Hero Heading` section using Slider, Switch, and Vector built-ins.

### Task 2: Extend preview state and synchronization

**Files:**

- Modify: `src/app/hero-preview-protocol.ts`
- Modify: `src/app/hero-preview-pipeline.ts`

- [ ] Add the nested heading settings to `HeroPreviewSettings` and bump the protocol to version 5.
- [ ] Map runtime values to the heading payload with finite, bounded fallbacks.
- [ ] Add scalar/vector edits to control-drag invalidation and badge visibility to control-change invalidation.

### Task 3: Apply heading settings in the website

**Files:**

- Modify: `../recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `../recraft-v4-styles/src/components/pages/home/hero-preview-boundary.tsx`
- Modify: `../recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Create: `../recraft-v4-styles/src/components/pages/home/hero-v4-styles.module.css`

- [ ] Validate and clamp the heading payload and accept protocol version 5.
- [ ] Render the badge conditionally, size each line independently, and apply an adjustable signed line gap.
- [ ] Translate the badge/title group from normalized X/Y and put it below the gallery while keeping the prompt and announcement strip above.

### Task 4: Keep Toolcraft contracts aligned

**Files:**

- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/hero-preview.product.test.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] Add interaction ownership, acceptance rows including both Vector semantic parts, and the `Hero Heading` section inventory.
- [ ] Add focused payload-mapping cases for every heading control.
- [ ] Record the later ordinary feature decision and intentionally limited verification scope.

### Task 5: Minimal verification

**Files:**

- Verify all modified files.

- [ ] Run `npm exec vitest run src/app/hero-preview.product.test.ts` in `recraft-tools/hero`.
- [ ] Run `npm run typecheck` in `recraft-tools/hero`.
- [ ] Run `pnpm typecheck` in `recraft-v4-styles`.
- [ ] Run `git diff --check` from the repository root.
- [ ] Do not run aggregate delivery, browser, feature, or performance suites unless the user asks.

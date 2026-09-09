# Hero Background Pattern Implementation Plan

> **For agentic workers:** Execute this plan inline in the current Toolcraft app. Do not dispatch subagents. Do not commit, and do not run verification commands unless the user explicitly requests them.

**Goal:** Add a configurable native checker pattern over the existing editable hero background color.

**Architecture:** Toolcraft owns three canonical pattern values and sends them through iframe protocol version 8. The website normalizes those values and renders a pointer-transparent CSS `conic-gradient` layer above the solid hero background and below hero content.

**Tech Stack:** TypeScript, React, Toolcraft schema controls, Next.js, CSS Modules.

---

### Task 1: Define canonical pattern values

**Files:**
- Create: `src/app/hero-background-pattern-values.ts`

- [ ] Add `heroBackgroundPatternTargets` for `background.pattern.enabled`, `background.pattern.colorOpacity`, and `background.pattern.squareSize`.
- [ ] Add `HeroBackgroundPatternSettings` with `enabled`, canonical `{ hex, opacity }`, and `squareSize` fields.
- [ ] Add defaults: disabled, `#FFFFFF`, opacity `12`, and square size `32`.

### Task 2: Add Toolcraft Pattern controls

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/hero-preview-pipeline.ts`

- [ ] Add a `Pattern` section after the runtime source `Background` section.
- [ ] Add a Background-conditional `switch`, plus Pattern-conditional `colorOpacity` and continuous `slider` controls.
- [ ] Bound `Square size` to 4–160px with a 1px step.
- [ ] Add all three targets to the preview change/drag invalidation lists according to interaction type.

### Task 3: Extend the iframe settings protocol

**Files:**
- Modify: `src/app/hero-preview-protocol.ts`
- Modify: `src/app/hero-preview.product.test.ts`

- [ ] Bump `HERO_PREVIEW_PROTOCOL_VERSION` from 7 to 8.
- [ ] Add nested `pattern` settings to `HeroPreviewSettings` and defaults.
- [ ] Map Switch, Color Opacity, and Slider canonical values with safe fallbacks and bounds.
- [ ] Add mapping cases for all three targets to the existing table-driven product test without running it.

### Task 4: Normalize pattern settings on the website

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-preview-boundary.tsx`

- [ ] Add `HeroBackgroundPatternSettings` to `HeroSceneSettings` and defaults.
- [ ] Clamp canonical opacity to 0–100 and square size to 4–160px; normalize `hex` through the existing color helper.
- [ ] Bump the website preview protocol from 7 to 8.

### Task 5: Render the native checker layer

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.module.css`

- [ ] Create typed CSS variables for pattern color, percentage-derived CSS opacity, square size, and tile size.
- [ ] Render `data-hero-background-pattern` only when both Background and Pattern are enabled.
- [ ] Use one locally scoped absolute layer with a four-quadrant `conic-gradient` and a tile size equal to two squares.
- [ ] Keep the layer pointer-transparent and below cards, heading, prompt, and ticker.

### Task 6: Align Toolcraft product contracts

**Files:**
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] Add the three pattern targets to panel interaction ownership.
- [ ] Add control acceptance rows and a `Pattern` section inventory entry.
- [ ] Update product summary/requested behavior for native editable background pattern.
- [ ] Add a Decision Trail entry recording the supplied PNG structure, built-in control selection, protocol version 8, CSS technique, and deferred verification boundary.

### Task 7: Hand off without additional verification

- [ ] Review only the authored diff for accidental unrelated edits while preserving all pre-existing worktree changes.
- [ ] Do not run tests, feature gates, browser checks, lint, typecheck, format, or build.
- [ ] Report the implementation files and explicitly state that verification was left to the reviewer.

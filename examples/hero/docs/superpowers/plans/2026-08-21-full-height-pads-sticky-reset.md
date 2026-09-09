# Full-Height Hero Pads And Sticky Reset Implementation Plan

> **For agentic workers:** Execute inline in the current session. Steps use checkbox (`- [ ]`) syntax for tracking. Do not dispatch subagents, run verification commands, or commit because the user reserved local verification and Git publication.

**Goal:** Give both hero Vector pads the complete usable vertical range and add a sticky Reset beside Apply that resets Toolcraft, the website runtime, and tracked website defaults.

**Architecture:** Convert the heading and prompt from opposing flex anchors to normalized absolute positions inside one inset overlay. Extend the existing panel action coordinator so sticky Reset dispatches the canonical runtime reset and performs one acknowledged website save, while suppressing the duplicate history-observer write.

**Tech Stack:** React, TypeScript, CSS custom properties, Toolcraft Vector controls and panel actions, versioned iframe save protocol, Next.js local settings endpoint, BroadcastChannel

---

### Task 1: Change canonical position defaults

**Files:**
- Modify: `recraft-tools/hero/src/app/hero-heading-values.ts`
- Modify: `recraft-tools/hero/src/app/hero-prompt-values.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-applied-settings.json`

- [ ] Set `HERO_HEADING_DEFAULTS.position` and website heading reset position to `{ x: 0, y: -1 }`.
- [ ] Set `HERO_PROMPT_DEFAULTS.position` and website prompt reset position to `{ x: 0, y: 1 }`.
- [ ] Set the tracked applied JSON to the same values so the standalone visual remains heading-top and prompt-bottom after the layout conversion.

### Task 2: Map Vector Y across the complete hero height

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.module.css`

- [ ] Replace vertical offset variables with position and self-anchor variables derived from `(y + 1) * 50`.
- [ ] Change the first-row content wrapper to a positioned overlay with the existing responsive insets.
- [ ] Absolutely position heading and prompt from `left: 50%`, applying `top: position%` and `translateY(-position%)` so the complete element remains inside at both extremes.
- [ ] Preserve the horizontal `36vw` range by combining it with the centered `-50%` X anchor.

### Task 3: Add sticky Reset without duplicate persistence

**Files:**
- Modify: `recraft-tools/hero/src/app/app-schema.ts`
- Modify: `recraft-tools/hero/src/app/hero-panel-actions.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview-website-actions.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview.tsx`

- [ ] Add outline `{ label: "Reset", value: "website.reset" }` before primary Apply in the sticky action list.
- [ ] Add a small counted suppression coordinator with `markHeroWebsiteResetHandled` and `consumeHeroWebsiteResetHandled`.
- [ ] Handle `website.reset` by marking suppression, dispatching `controls.reset`, and awaiting a reset-intent save of `HERO_PREVIEW_DEFAULTS`.
- [ ] Make the reset-generation observer consume suppression before performing its automatic save, preserving the existing header Reset path.
- [ ] Report distinct stable feedback when sticky Reset cannot update the local website.

### Task 4: Align acceptance and documentation sources

**Files:**
- Modify: `recraft-tools/hero/src/app/app-acceptance-data.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview.product.test.ts`
- Modify: `recraft-tools/hero/e2e/product-website-settings.spec.ts`
- Modify: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`
- Modify: `recraft-tools/hero/docs/superpowers/specs/2026-08-21-hero-settings-apply-reset-design.md`
- Modify: `recraft-tools/hero/docs/superpowers/plans/2026-08-21-hero-settings-apply-reset.md`

- [ ] Register both `website.reset` and `website.apply` action coverage and describe the explicit product-level reset override.
- [ ] Update source-level acceptance expectations to require outline Reset beside Apply.
- [ ] Point the browser acceptance source at sticky Reset rather than the header button.
- [ ] Record the normalized full-height coordinate mapping, new defaults, suppression flow, and no-verification boundary in the worklog and existing Apply/Reset docs.

### Task 5: Handoff without verification commands

- [ ] Read the changed source regions for contradictions or missing imports.
- [ ] Do not run tests, browser checks, lint, typecheck, formatting, build, delivery, commit, or push.
- [ ] Hand the feature to the user for local verification.


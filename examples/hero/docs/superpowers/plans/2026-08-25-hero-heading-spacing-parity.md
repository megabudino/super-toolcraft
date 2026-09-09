# Hero Heading Spacing Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize the four Hero heading-group distances across Toolcraft Reset and the standalone website.

**Architecture:** Keep the existing spacing controls and direct DOM margin mapping. Change only canonical defaults and the website applied snapshot, then prove the exact values through focused mapping tests and one DOM measurement.

**Tech Stack:** TypeScript, React, Next.js, Toolcraft schema defaults, JSON, Vitest, Node test runner.

---

### Task 1: Add the spacing parity expectations

**Files:**

- Modify: `recraft-tools/hero/src/app/hero-heading-cta-toolcraft.test.ts`
- Modify: `recraft-tools/hero/src/app/hero-heading-subtitle-toolcraft.test.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.test.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-heading-cta.test.ts`

- [x] Assert Toolcraft Reset distances are line gap `-24`, badge gap `28`, subtitle gap `0`, and CTA gap `39`.
- [x] Assert the website fallback/applied settings expose those four values and preserve the approved subtitle style.
- [x] Assert CTA style maps gap `39` directly to `marginTop: "39px"`.

### Task 2: Synchronize canonical defaults

**Files:**

- Modify: `recraft-tools/hero/src/app/hero-heading-values.ts`
- Modify: `recraft-tools/hero/src/app/hero-heading-cta-values.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-applied-settings.json`

- [x] Change only line gap, badge gap, and CTA gap defaults required for parity.
- [x] Keep subtitle gap `0` and all already-matching subtitle parameters unchanged.
- [x] Keep protocol v23 and the direct margin mapping unchanged.

### Task 3: Focused verification

- [x] Run the focused Toolcraft heading tests.
- [x] Run the focused website heading/settings tests.
- [x] Measure the website subtitle-to-CTA boundary and computed margin as `39px`.
- [x] Run scoped formatting and whitespace checks; skip broad checks.

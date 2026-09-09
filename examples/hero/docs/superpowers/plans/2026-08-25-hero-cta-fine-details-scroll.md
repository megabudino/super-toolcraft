# Hero CTA Fine Details Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the Hero CTA and make it scroll quickly and smoothly to the Fine Details section.

**Architecture:** Preserve the existing semantic link and Button composition. A small client click handler uses native smooth scrolling while the hash remains the fallback; reduced-motion users retain an immediate transition. A stable section id supplies the destination, and synchronized website and Toolcraft defaults prevent Reset or persisted fallback from restoring stale copy.

**Tech Stack:** Next.js 16, React 19, TypeScript, Node test runner, Vitest.

---

### Task 1: Synchronize CTA copy and destination

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-heading-cta.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-section.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-applied-settings.json`
- Modify: `recraft-tools/hero/src/app/hero-heading-cta-values.ts`
- Test: `recraft-v4-styles/src/components/pages/home/hero-heading-cta.test.ts`
- Test: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.test.ts`
- Test: `recraft-tools/hero/src/app/hero-heading-cta-toolcraft.test.ts`

- [x] **Step 1: Update focused expectations**

Assert exact copy `See How it Works`, CTA destination `#fine-details`, and section id `fine-details`.

- [x] **Step 2: Run focused tests and confirm RED**

Run the focused website and Toolcraft test files. Expected: stale copy/destination assertions fail.

- [x] **Step 3: Apply the minimal implementation**

Update website/default/applied/Toolcraft copy, the CTA hash destination, the Fine Details section id, and the native smooth-scroll click handler with reduced-motion fallback.

- [x] **Step 4: Run focused tests and whitespace validation**

Expected: focused tests pass and `git diff --check` prints no output.

- [x] **Step 5: Leave changes uncommitted**

The user requested implementation but did not request a commit or push.

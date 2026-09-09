# Hero Site Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the approved Toolcraft Hero state and its 36 active images the website's authored default.

**Architecture:** Store the current Dia images as static website assets, resolve them through Next image metadata, and update both the typed fallback constants and applied settings snapshot from schema v2. Runtime media overrides and the preview protocol remain unchanged.

**Tech Stack:** Next.js 16, React 19, TypeScript, static image imports, WebGL.

---

### Task 1: Preserve the current Hero media

**Files:**

- Create: `recraft-v4-styles/src/assets/images/recraft-hero/defaults/*.jpg`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-gallery-sources.ts`

- [x] Extract all 36 active `127.0.0.1:3003` JPEG payloads from Dia without re-encoding.
- [x] Import all 36 files statically and use their `src`, `width`, and `height` in authored WebGL sources.

### Task 2: Apply schema-v2 values

**Files:**

- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-applied-settings.json`

- [x] Copy every compatible Hero value from `hero-settings (14).json`.
- [x] Convert percentage controls to normalized renderer values.

### Task 3: Fast verification

- [x] Run focused settings and CTA tests: 11/11 passed. The live site reported WebGL ready, six rows, 36 ordered images, and 36 Next Image preloads with no console errors. The standalone gallery test cannot load static `.jpg` modules through `tsx`; the same contract was checked in the live Next runtime.
- [x] Run `git diff --check`. Full typecheck was attempted and stopped on three existing unrelated errors in `fine-details-image-trail-motion.test.ts`, `hero-dispersion-card.tsx`, and `hero-v4-styles.tsx`.

### Task 4: Refresh Settings 16 subtitle and row-speed defaults

**Files:**

- Modify: `recraft-tools/hero/src/app/hero-heading-subtitle-values.ts`
- Modify: `recraft-tools/hero/src/app/hero-gallery-values.ts`
- Modify: `recraft-tools/hero/src/app/app-schema.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-applied-settings.json`
- Test: `recraft-tools/hero/src/app/hero-heading-subtitle-toolcraft.test.ts`
- Test: `recraft-tools/hero/src/app/hero-gallery-values.test.ts`
- Test: `recraft-v4-styles/src/components/pages/home/hero-heading-subtitle.test.ts`
- Test: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.test.ts`

- [x] Update Toolcraft subtitle defaults and the six-row reset value from `hero-settings (16).json`.
- [x] Update the website typed fallback and applied JSON with the same subtitle values and row speeds.
- [x] Update focused expectations for the new canonical defaults.
- [x] Run only the four focused test files plus scoped formatting and whitespace checks.

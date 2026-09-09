# Styles Ultra Italic and Heading Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Self-host the supplied ABC Gravity Wide Trial Ultra Italic as WOFF2 for `STYLES` and add one shared Toolcraft heading-text color.

**Architecture:** Convert the complete OTF once outside project dependency graphs, then register the generated WOFF2 through the website's centralized `next/font/local` bridge. Extend the existing nested heading settings across Toolcraft schema, versioned iframe protocol, website normalization, and CSS variables.

**Tech Stack:** FontTools with Brotli, Next.js 16 `next/font/local`, React 19, TypeScript, Tailwind CSS 4, Toolcraft schema runtime, Vitest

---

### Task 1: Convert and record the supplied font

**Files:**
- Source: `/Users/kusnizza/Desktop/ABCGravityWideTrial-UltraItalic.otf`
- Create: `recraft-v4-styles/src/fonts/abc-gravity/abc-gravity-wide-trial-ultra-italic.woff2`
- Modify: `recraft-v4-styles/src/fonts/abc-gravity/sources.json`

- [ ] **Step 1: Create an isolated converter**

Create a temporary directory with `mktemp -d`, initialize a Python virtual environment there, and install `fonttools[woff]`. Do not modify either project manifest.

- [ ] **Step 2: Convert the complete font**

Use `fontTools.ttLib.TTFont` with `recalcTimestamp=False`, set `font.flavor = "woff2"`, and save to `abc-gravity-wide-trial-ultra-italic.woff2`. Do not run a glyph subset operation.

- [ ] **Step 3: Verify fidelity and provenance**

Open both files with FontTools and assert their glyph order, family/subfamily names, and `OS/2.usWeightClass` match. Compute the generated WOFF2 SHA-256 and add a `sources.json` entry with `sourceUrl: "user-supplied:ABCGravityWideTrial-UltraItalic.otf"`.

### Task 2: Register the exact face centrally

**Files:**
- Modify: `recraft-v4-styles/src/lib/theme-fonts.ts`
- Modify: `recraft-v4-styles/src/styles/globals.css`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.module.css`

- [ ] **Step 1: Register WOFF2 through `next/font/local`**

Add one loader pointing to `../fonts/abc-gravity/abc-gravity-wide-trial-ultra-italic.woff2`, using the detected static weight, `style: "italic"`, `display: "swap"`, and variable `--font-abc-gravity-wide-ultra-italic`. Include its variable in `fontVariablesClassName`.

- [ ] **Step 2: Add and consume the font alias**

Map `--font-display-wide-ultra-italic` to the new generated variable. Set `.stylesLine` to that font family and italic style while leaving `.recraftLine` unchanged.

### Task 3: Add heading color to Toolcraft state and protocol

**Files:**
- Modify: `recraft-tools/hero/src/app/hero-heading-values.ts`
- Modify: `recraft-tools/hero/src/app/app-schema.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview-protocol.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview-pipeline.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview.product.test.ts`
- Modify: `recraft-tools/hero/src/app/app-acceptance-data.ts`

- [ ] **Step 1: Write the failing mapping case**

Add a preview case for `heading.color` with `#FF22AA` and assert the converted settings expose the same normalized color.

- [ ] **Step 2: Add the canonical value and control**

Add `heroHeadingTargets.color`, default `#D8FB5B`, and a built-in `color` control labeled `Text color` in the existing Hero Heading section.

- [ ] **Step 3: Extend preview synchronization**

Add the color to nested heading settings, parse uppercase six-digit hex with the existing color validator, bump the preview protocol to 7, and include the target in the `control-change` invalidation list.

- [ ] **Step 4: Extend acceptance metadata**

Add one global panel ownership and product-output acceptance entry for `heading.color`, and add the target to the existing Hero Heading section inventory.

### Task 4: Apply heading color in the website

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-preview-boundary.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.module.css`

- [ ] **Step 1: Extend and normalize website settings**

Add `heading.color`, default it to `#D8FB5B`, normalize it with `normalizeColor`, and accept protocol version 7.

- [ ] **Step 2: Map the color to product text**

Add `--hero-heading-color` to `HeroHeadingStyle`, remove `text-primary` from the title, and apply the variable to title text through the heading's local CSS. Keep the badge's explicit gray color.

### Task 5: Record and verify the focused delivery

**Files:**
- Modify: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Add the delivery decision**

Record exact-font conversion, fixed line-family ownership, shared color ownership, protocol version 7, selected focused checks, and the commercial-font licensing risk.

- [ ] **Step 2: Run focused checks**

Run the preview product test, TypeScript checks in both projects, format only touched website files, validate the generated WOFF2 through FontTools, and run `git diff --check`.

- [ ] **Step 3: Leave the shared working tree uncommitted**

Do not commit, push, deploy, or run broad browser/delivery/performance suites without explicit authorization.

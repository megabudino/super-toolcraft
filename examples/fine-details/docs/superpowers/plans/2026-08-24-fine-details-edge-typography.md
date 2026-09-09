# Fine Details Edge Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Figma-matched upper-left and lower-right typography compositions to Fine Details with live pixel controls and complete Apply/Reset persistence.

**Architecture:** Keep typography as two website-owned absolute DOM groups and carry their measurements through the existing Toolcraft values → protocol v3 → website normalization pipeline. Add one focused Toolcraft value adapter, then extend existing schema, pipeline, persistence, and section rendering without changing the prompt or background implementation.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, Toolcraft runtime, `postMessage`, local JSON settings persistence.

---

### Task 1: Add canonical Toolcraft typography values

**Files:**
- Create: `recraft-tools/fine-details/src/app/fine-details-typography-values.ts`

- [ ] **Step 1: Define targets, settings type, ranges, and Figma defaults**

```ts
export const fineDetailsTypographyTargets = {
  lowerRightBodyFontSize: "typography.lowerRight.bodyFontSize",
  lowerRightBottom: "typography.lowerRight.bottom",
  lowerRightGap: "typography.lowerRight.gap",
  lowerRightHeadingFontSize: "typography.lowerRight.headingFontSize",
  lowerRightRight: "typography.lowerRight.right",
  upperLeftFontSize: "typography.upperLeft.fontSize",
  upperLeftLeft: "typography.upperLeft.left",
  upperLeftTop: "typography.upperLeft.top",
} as const;

export const FINE_DETAILS_TYPOGRAPHY_INSET_MAX = 8192;
export const FINE_DETAILS_TYPOGRAPHY_SIZE_MIN = 8;
export const FINE_DETAILS_TYPOGRAPHY_SIZE_MAX = 512;
export const FINE_DETAILS_TYPOGRAPHY_GAP_MAX = 512;

export type FineDetailsTypographySettings = Readonly<{
  lowerRight: Readonly<{
    bodyFontSize: number;
    bottom: number;
    gap: number;
    headingFontSize: number;
    right: number;
  }>;
  upperLeft: Readonly<{
    fontSize: number;
    left: number;
    top: number;
  }>;
}>;

export const FINE_DETAILS_TYPOGRAPHY_DEFAULTS: FineDetailsTypographySettings = {
  lowerRight: {
    bodyFontSize: 24,
    bottom: 112,
    gap: 16,
    headingFontSize: 88,
    right: 112,
  },
  upperLeft: { fontSize: 131, left: 112, top: 112 },
};
```

- [ ] **Step 2: Map canonical Toolcraft values into bounded settings**

Add a local finite `numberValue` helper and export `createFineDetailsTypographyFromValues(values)`. Clamp insets to `0–8192`, font sizes to `8–512`, and gap to `0–512`, falling back to the defaults above.

### Task 2: Expose the measurements in Toolcraft

**Files:**
- Modify: `recraft-tools/fine-details/src/app/app-schema.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-pipeline.ts`

- [ ] **Step 1: Add the Upper Left Typography control section**

Import the new targets, defaults, and bounds. Add three continuous one-pixel sliders with `unit: "px"`: `Left`, `Top`, and `Font size`. Use section id `upper-left-typography` and title `Upper Left Typography`.

- [ ] **Step 2: Add the Lower Right Typography control section**

Add five continuous one-pixel sliders: `Right`, `Bottom`, `Heading size`, `Body size`, and `Gap`. Use section id `lower-right-typography` and title `Lower Right Typography`. Placement sliders use `0–8192`, size sliders use `8–512`, and gap uses `0–512`.

- [ ] **Step 3: Make every typography target invalidate preview sync**

Append all values of `fineDetailsTypographyTargets` to `previewSettingsTargets` and update the pipeline runtime id to `fine-details-external-preview-v3`.

### Task 3: Extend the Toolcraft preview and persistence payload

**Files:**
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-protocol.ts`
- Modify: `recraft-tools/fine-details/src/app/app-acceptance-data.ts`
- Modify: `recraft-tools/fine-details/src/app/app-performance.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.tsx`

- [ ] **Step 1: Advance the protocol and include typography**

Set `FINE_DETAILS_PREVIEW_VERSION` to `3`, add `typography: FineDetailsTypographySettings` to `FineDetailsPreviewSettings`, add `typography: FINE_DETAILS_TYPOGRAPHY_DEFAULTS` to defaults, and return `createFineDetailsTypographyFromValues(values)` from `createFineDetailsPreviewSettingsFromValues`.

- [ ] **Step 2: Keep inspection metadata synchronized**

Add the serialized typography object as `data-fine-details-typography` on the preview root. Update acceptance copy, fixtures, product summary, requested behavior, control entries, and section inventory to include both typography groups and protocol v3. Update performance risks and fixture copy to mention retained typography DOM and protocol v3.

### Task 4: Extend the website settings contract

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-applied-settings.json`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-preview-boundary.tsx`

- [ ] **Step 1: Add website typography types and defaults**

Mirror the Toolcraft `FineDetailsTypographySettings` interface, add it to `FineDetailsSettings`, and add the eight Figma defaults under `typography`.

- [ ] **Step 2: Normalize each typography measurement**

Add a `normalizeTypography` helper that requires both nested records and clamps values to the same Toolcraft ranges. Make `normalizeFineDetailsSettings` reject settings without a valid typography object and return the normalized object.

- [ ] **Step 3: Persist the expanded default shape and advance the receiver**

Add the default typography object to `fine-details-applied-settings.json` and set `previewProtocolVersion` to `3`. Existing Apply and Reset logic then carries the complete normalized object without a separate save path.

### Task 5: Render the two Figma typography groups

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-section.tsx`

- [ ] **Step 1: Render the upper-left heading**

Add a pointer-events-none absolute `<p>` with `font-heading`, `font-black`, uppercase text, `lineHeight: 0.96`, and settings-driven `left`, `top`, and `fontSize`. Keep the fixed text `TRY IT` and mark it `aria-hidden="true"`.

- [ ] **Step 2: Render the lower-right composition**

Add a pointer-events-none absolute flex column with settings-driven `right`, `bottom`, and `gap`. Render `YOUR WAY` with `font-display-wide-ultra-italic`, uppercase, single-line text, and `lineHeight: 0.96`. Render the fixed body in a 465px-wide Geist Medium paragraph using settings-driven size, `lineHeight: 1.25`, and `letterSpacing: -0.02em`.

- [ ] **Step 3: Preserve layer order**

Keep the grid at the section base, both typography groups above the grid, and the existing prompt at z-index 10. Do not alter prompt position, shadow math, background texture, responsive section height, or overflow behavior.

### Task 6: Hand off for local review

**Files:**
- Review: `recraft-tools/fine-details/src/app/`
- Review: `recraft-v4-styles/src/components/pages/home/fine-details-*.{ts,tsx,json}`

- [ ] **Step 1: Confirm implementation coverage by inspection**

Confirm the eight defaults are identical across Toolcraft, website defaults, and applied JSON; both protocol endpoints use version 3; and every new target appears in the preview invalidation list.

- [ ] **Step 2: Leave runtime verification to the user**

Do not run tests, lint, typecheck, build, browser automation, formatting, or commit/push. Hand off the running local Toolcraft and website for the requested manual check.

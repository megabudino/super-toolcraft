# Studio Room Center Composition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Studio Room center title with the approved Figma composition and add four live Toolcraft controls for its two row scales and two gaps.

**Architecture:** Add a strict `composition` branch to the existing website and Toolcraft Studio Room settings models. The current iframe live-sync sends those values with the rest of the settings payload, and the website-owned `PreFooter` renders the centered composition from them. Existing Apply/Reset code is not changed.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, Toolcraft runtime controls, iframe `postMessage` protocol.

---

### Task 1: Extend the Studio Room settings contract

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/studio-room-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/studio-room-applied-settings.json`
- Modify: `recraft-v4-styles/src/components/pages/home/studio-room-settings.test.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/studio-room-preview-protocol.ts`
- Modify: `recraft-tools/studio-room/src/app/studio-room-values.ts`
- Modify: `recraft-tools/studio-room/src/app/studio-room-preview-protocol.ts`

- [ ] **Step 1: Add focused settings expectations**

Assert defaults and normalization for:

```ts
composition: {
  buttonGap: 6,
  firstRowScale: 100,
  lineGap: -12,
  secondRowScale: 100,
}
```

and verify clamps `buttonGap` to `0..160`, row scales to `50..150`, and `lineGap` to `-40..80`.

- [ ] **Step 2: Implement the shared shape**

Add the same nested composition type/defaults to both settings models and include it in strict root validation:

```ts
export interface StudioRoomCompositionSettings {
  buttonGap: number;
  firstRowScale: number;
  lineGap: number;
  secondRowScale: number;
}
```

- [ ] **Step 3: Bump the preview contract**

Change both protocol versions from `4` to `5` so stale senders cannot pass the old payload shape.

### Task 2: Render the Figma composition

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/pre-footer.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/pre-footer.module.css`

- [ ] **Step 1: Replace the old linked heading**

Render a centered stack with static `TRY IN RECRAFT` and `STUDIO` rows plus one login link button. Reuse project font utilities:

```tsx
<span className="font-display-condensed">TRY</span>
<span className="font-display-condensed">IN</span>
<span className="font-display-condensed-upright">RECRAFT</span>
<span className="font-display-expanded-italic">STUDIO</span>
```

- [ ] **Step 2: Map settings to layout variables**

Compute row font sizes and the first-row internal gap from the percent settings, and pass line/button gaps as CSS custom properties. Keep each row and the complete stack centered.

- [ ] **Step 3: Match the Figma button**

Use Geist Medium 22px, `#D5F940`, 12px radius, 26px horizontal padding, and 20px vertical padding. Only the button links to the existing Recraft login URL.

### Task 3: Add live Toolcraft controls

**Files:**
- Modify: `recraft-tools/studio-room/src/app/studio-room-values.ts`
- Modify: `recraft-tools/studio-room/src/app/app-schema.ts`
- Modify: `recraft-tools/studio-room/src/app/studio-room-preview-pipeline.ts`
- Modify: `recraft-tools/studio-room/src/app/studio-room-values.test.ts`
- Modify: `recraft-tools/studio-room/src/app/studio-room-preview.product.test.ts`

- [ ] **Step 1: Define targets and value extraction**

Add targets for `composition.firstRowScale`, `composition.secondRowScale`, `composition.lineGap`, and `composition.buttonGap`; read and clamp them in `createStudioRoomSettingsFromValues`.

- [ ] **Step 2: Add the Center Composition section**

Add four continuous sliders with the approved ranges and defaults, including the revised 6px button gap. Do not add actions or edit the existing Website section.

- [ ] **Step 3: Invalidate the preview on live changes**

Include all four targets in `studioRoomPreviewSettingsTargets` so every slider change sends a new settings payload immediately.

### Task 4: Focused verification

**Files:**
- Verify only touched Studio Room files.

- [ ] **Step 1: Run focused website tests**

Run:

```bash
pnpm exec tsx --test src/components/pages/home/studio-room-settings.test.ts src/components/pages/home/studio-room-preview-boundary.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 2: Run focused Toolcraft tests**

Run:

```bash
pnpm exec vitest run src/app/studio-room-values.test.ts src/app/studio-room-preview.product.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 3: Check the live preview**

Open `http://127.0.0.1:3005/`, confirm the new composition is centered and the four controls update it without an error overlay.

### Task 5: Use the supplied TRY IN font

**Files:**
- Create: `recraft-v4-styles/src/fonts/abc-gravity/abc-gravity-condensed-trial-bold-italic.woff2`
- Modify: `recraft-v4-styles/src/lib/theme-fonts.ts`
- Modify: `recraft-v4-styles/src/styles/globals.css`
- Modify: `recraft-v4-styles/src/components/pages/home/pre-footer.tsx`

- [ ] **Step 1: Convert the supplied font without subsetting**

Convert `ABCGravityCondensedTrial-BoldItalic.otf` to WOFF2 with FontTools, retaining the complete glyph set and authored metadata.

- [ ] **Step 2: Register an isolated local font**

Add a `next/font/local` declaration using weight `700`, style `italic`, and a dedicated `--font-abc-gravity-condensed-bold-italic` variable. Add a corresponding `font-display-condensed-bold-italic` theme utility without changing the existing condensed utilities.

- [ ] **Step 3: Apply the font only to TRY and IN**

Replace the existing `font-display-condensed` utility on the two spans with `font-display-condensed-bold-italic`; keep `RECRAFT`, `STUDIO`, sizing, spacing, and interaction unchanged.

- [ ] **Step 4: Run the minimal asset check**

Inspect the generated WOFF2 metadata and run a scoped formatting/diff check for the three text files. Do not run the full build or aggregate test suites.

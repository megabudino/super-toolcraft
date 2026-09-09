# Hero Website Defaults Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Hero parameter initialized by Toolcraft match the effective applied defaults rendered by the `/v4styles` website.

**Architecture:** Capture the website's applied Hero settings as one standalone Toolcraft-owned snapshot, then derive every domain default constant and the preview fallback from that snapshot. Prove parity through the real resolved Toolcraft schema state so percentage-scaled controls, vectors, conditional branches, and nested settings cannot drift silently.

**Tech Stack:** TypeScript, Vitest, Toolcraft schema/runtime state, React iframe `postMessage` bridge.

---

### Task 1: Add the website-default snapshot and a failing schema-parity test

**Files:**
- Create: `src/app/hero-website-defaults.ts`
- Create: `src/app/hero-website-defaults.test.ts`

- [ ] **Step 1: Record the exact website-applied settings snapshot**

Create `src/app/hero-website-defaults.ts` with the exact normalized fields consumed by `HeroPreviewSettings`:

```ts
export const HERO_WEBSITE_DEFAULTS = {
  background: "#030303",
  backgroundEnabled: true,
  dispersion: {
    amount: 200,
    aura: 0.8,
    blur: 22,
    count: 6,
    curve: 1.4,
    edgeFade: 0,
    edgeWidth: 25,
    gateGlow: 0.6,
    gateOffset: 35,
    gateRefraction: 10,
    gateWidth: 116,
    hue: 0,
    spectrum: 0.82,
    turbulence: 0.7,
    turbulenceScale: 130,
    velocity: 0.8,
    warp: 4,
    warpFace: 47,
    warpOffset: 5,
    warpSharpness: 2,
    warpStyle: "prism",
    warpWave: 18,
    warpWaveBlur: 0,
    warpWaveEnabled: false,
    warpWaveKind: "glass",
    warpWaveLength: 140,
  },
  effects: {
    crt: {
      chroma: 5.5,
      enabled: true,
      fade: 0.6,
      flicker: 0.43,
      pitch: 5,
      scanlines: 0.15,
    },
    grain: { amount: 0.09, enabled: true, size: 2.5 },
  },
  gallery: {
    cardGap: 24,
    cardHeight: 610,
    cardRadius: 45,
    images: [],
    position: { x: 0, y: 0.02 },
    rows: { roll: 42, safetyWidth: 694 },
    sphere: {
      autoScroll: { duration: 0.3, enabled: true, interval: 4 },
      bendX: 0.5,
      bendY: 0.99,
      depth: 1270,
      height: 520,
      pan: { x: 0.8821207137451461, y: -0.13462165235322487 },
      rowGap: 17,
      rows: [
        { images: [], offset: -101, speed: -4 },
        { images: [], offset: -9, speed: 4 },
        { images: [], offset: -8, speed: -4 },
        { images: [], offset: 0, speed: 4 },
        { images: [], offset: 0, speed: -4 },
        { images: [], offset: 0, speed: 4 },
      ],
      width: 510,
    },
    type: "sphere",
  },
  heading: {
    badgeColor: "#E6E6E6",
    badgeGap: 28,
    badgeScale: 131,
    badgeShadow: {
      blur: 32,
      colorOpacity: { hex: "#000000", opacity: 25 },
      enabled: true,
      offset: { x: 0, y: 0.125 },
      spread: 4,
    },
    badgeVisible: true,
    color: "#D2FC31",
    cta: {
      backgroundColor: "#E6E6E6",
      fontSize: 22,
      gap: 39,
      horizontalPadding: 32,
      shadow: {
        blur: 16,
        colorOpacity: { hex: "#000000", opacity: 20 },
        enabled: true,
        offset: { x: 0, y: 0.2 },
        spread: 8,
      },
      text: "See How it Works",
      textColor: "#000000",
      verticalPadding: 20,
    },
    lineGap: -24,
    position: { x: 0, y: -0.16 },
    recraftSize: 137,
    shadow: {
      blur: 51,
      colorOpacity: { hex: "#000000", opacity: 35 },
      enabled: true,
      offset: { x: 0, y: 0.125 },
      spread: 12,
    },
    stylesSize: 149,
    subtitle: {
      fontSize: 28,
      gap: 0,
      shadow: {
        blur: 12,
        colorOpacity: { hex: "#000000", opacity: 40 },
        enabled: true,
        offset: { x: 0, y: 0.125 },
        spread: 1,
      },
    },
  },
  pattern: {
    colorOpacity: { hex: "#FFFFFF", opacity: 5 },
    enabled: true,
    squareSize: 11,
  },
  perspective: 1660,
  vanishingPoint: { x: 50, y: 44 },
} as const;
```

- [ ] **Step 2: Write the failing resolved-schema parity test**

Create `src/app/hero-website-defaults.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createToolcraftState } from "@/toolcraft/runtime/state/create-template-state";

import { appSchema } from "./app-schema";
import {
  createHeroPreviewSettingsFromValues,
  HERO_PREVIEW_DEFAULTS,
} from "./hero-preview-protocol";
import { HERO_WEBSITE_DEFAULTS } from "./hero-website-defaults";

describe("Hero website default parity", () => {
  it("matches the website snapshot through resolved Toolcraft defaults", () => {
    const state = createToolcraftState(appSchema);

    expect(HERO_PREVIEW_DEFAULTS).toEqual(HERO_WEBSITE_DEFAULTS);
    expect(createHeroPreviewSettingsFromValues(state.defaults)).toEqual(
      HERO_WEBSITE_DEFAULTS,
    );
  });
});
```

- [ ] **Step 3: Run the test to verify the mismatch is reproduced**

Run: `./node_modules/.bin/vitest run src/app/hero-website-defaults.test.ts`

Expected: FAIL with the existing Toolcraft values differing from the website snapshot across background, dispersion, effects, gallery, heading, pattern, and perspective.

### Task 2: Derive every Toolcraft default domain from the website snapshot

**Files:**
- Modify: `src/app/hero-background-pattern-values.ts`
- Modify: `src/app/hero-dispersion-values.ts`
- Modify: `src/app/hero-effects-values.ts`
- Modify: `src/app/hero-gallery-values.ts`
- Modify: `src/app/hero-heading-cta-values.ts`
- Modify: `src/app/hero-heading-subtitle-values.ts`
- Modify: `src/app/hero-heading-values.ts`
- Modify: `src/app/hero-preview-protocol.ts`

- [ ] **Step 1: Repoint the domain constants at the snapshot**

Import `HERO_WEBSITE_DEFAULTS` into each domain module and use these exact assignments:

```ts
export const HERO_BACKGROUND_PATTERN_DEFAULTS: HeroBackgroundPatternSettings =
  HERO_WEBSITE_DEFAULTS.pattern;

export const HERO_DISPERSION_DEFAULTS: HeroDispersionSettings =
  HERO_WEBSITE_DEFAULTS.dispersion;

export const HERO_EFFECTS_DEFAULTS: HeroEffectsSettings =
  HERO_WEBSITE_DEFAULTS.effects;

export const HERO_SPHERE_ROWS_DEFAULT: readonly HeroSphereRow[] =
  HERO_WEBSITE_DEFAULTS.gallery.sphere.rows;

export const HERO_GALLERY_DEFAULTS: HeroGallerySettings =
  HERO_WEBSITE_DEFAULTS.gallery;

export const HERO_HEADING_CTA_DEFAULTS: HeroHeadingCtaSettings =
  HERO_WEBSITE_DEFAULTS.heading.cta;

export const HERO_HEADING_SUBTITLE_DEFAULTS: HeroHeadingSubtitleSettings =
  HERO_WEBSITE_DEFAULTS.heading.subtitle;

export const HERO_HEADING_DEFAULTS: HeroHeadingSettings =
  HERO_WEBSITE_DEFAULTS.heading;
```

Keep `HERO_SPHERE_ROW_DEFAULT` unchanged because it is the Add Row template rather than part of the website's six-row applied composition.

- [ ] **Step 2: Make the preview fallback use the same snapshot**

In `src/app/hero-preview-protocol.ts`, remove the old independent `HERO_PREVIEW_DEFAULTS` literal, import `HERO_WEBSITE_DEFAULTS`, and declare after `HeroPreviewSettings`:

```ts
export const HERO_PREVIEW_DEFAULTS: HeroPreviewSettings =
  HERO_WEBSITE_DEFAULTS;
```

- [ ] **Step 3: Run the parity test to verify the fix**

Run: `./node_modules/.bin/vitest run src/app/hero-website-defaults.test.ts`

Expected: PASS with the resolved schema payload deeply equal to the website snapshot.

- [ ] **Step 4: Run neighboring value and preview contracts**

Run:

```bash
./node_modules/.bin/vitest run \
  src/app/hero-dispersion-values.test.ts \
  src/app/hero-gallery-values.test.ts \
  src/app/hero-preview.product.test.ts \
  src/app/hero-heading-cta-toolcraft.test.ts \
  src/app/hero-heading-subtitle-toolcraft.test.ts \
  src/app/hero-effects-toolcraft.test.ts
```

Expected: PASS, with any changed expected defaults updated only where the website snapshot intentionally changed them.

### Task 3: Record and verify the later defaults-parity delivery

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Add Delivery 52 to the decision trail**

Record the 61-field diagnostic, the website JSON source, unchanged fixed-camera and interaction ownership, the single-snapshot decision, existing-persistence behavior, focused tests, browser proof, and unverified boundaries.

- [ ] **Step 2: Run focused static verification**

Run:

```bash
npm run docs:check
npm run typecheck
npm run ai:check
git diff --check -- .
```

Expected: the docs and changed-file checks pass; report any unrelated pre-existing repository failures without modifying them.

- [ ] **Step 3: Verify the reset/default outcome in the browser**

Run the website at `http://localhost:3000/v4styles`, start the Hero Toolcraft app on its saved port, clear only the Hero Toolcraft persistence entry or use the real global Reset command, then compare the iframe's normalized Hero state with `HERO_WEBSITE_DEFAULTS`.

Expected: the fresh/reset Toolcraft control state and website-rendered Hero use the same nested settings. Existing persisted user values remain intentionally preserved until Reset.

- [ ] **Step 4: Review the final diff**

Confirm that only Hero default sources, the parity contract, the required worklog, and the previously requested `/v4styles` route changes are present. Preserve the unrelated `recraft-v4-styles` pending-generation edits and the untracked Hero lockfile.

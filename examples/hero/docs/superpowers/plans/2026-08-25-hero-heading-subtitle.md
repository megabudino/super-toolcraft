# Hero Heading Subtitle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the Figma subtitle under the website hero heading and add focused Toolcraft controls for its font size, gap, and independent shadow.

**Architecture:** Add a focused subtitle value/control module beside the existing CTA modules, include it in the shared heading preview payload, and normalize the expanded v23 payload on the website. Render the subtitle as DOM text with adjustable size, fixed 1.25 line-height, proportional `-0.02em` tracking, and the existing hero SVG shadow filter so offset, blur, spread, and color-opacity all remain real settings.

**Tech Stack:** React, Next.js, TypeScript, Tailwind CSS, Toolcraft schema controls, iframe `postMessage` preview protocol, Vitest, Node test runner.

---

### Task 1: Define subtitle settings and preview payload

**Files:**
- Create: `src/app/hero-heading-subtitle-values.ts`
- Modify: `src/app/hero-heading-values.ts`
- Modify: `src/app/hero-preview-protocol.ts`
- Test: `src/app/hero-heading-subtitle-toolcraft.test.ts`

- [ ] **Step 1: Write the focused settings test**

Assert the canonical defaults and normalized value mapping:

```ts
expect(HERO_HEADING_SUBTITLE_DEFAULTS).toEqual({
  fontSize: 24,
  gap: 24,
  shadow: {
    blur: 24,
    colorOpacity: { hex: "#000000", opacity: 25 },
    enabled: false,
    offset: { x: 0, y: 0.125 },
    spread: 0,
  },
});
expect(settings.heading.subtitle).toEqual({
  fontSize: 40,
  gap: 40,
  shadow: {
    blur: 18,
    colorOpacity: { hex: "#123456", opacity: 60 },
    enabled: true,
    offset: { x: -0.25, y: 0.5 },
    spread: 4,
  },
});
```

- [ ] **Step 2: Run the focused test and confirm the missing module fails**

Run: `pnpm vitest run src/app/hero-heading-subtitle-toolcraft.test.ts`

Expected: FAIL because `hero-heading-subtitle-values.ts` does not exist.

- [ ] **Step 3: Add the settings module and v23 payload mapping**

Create `heroHeadingSubtitleTargets`, `HeroHeadingSubtitleSettings`, defaults, and `createHeroHeadingSubtitleSettingsFromValues`. Add `subtitle` to `HeroHeadingSettings`, use the subtitle defaults in `HERO_HEADING_DEFAULTS`, map values in `createHeroPreviewSettingsFromValues`, and set `HERO_PREVIEW_PROTOCOL_VERSION` to `23`.

```ts
export const heroHeadingSubtitleTargets = {
  fontSize: "heading.subtitle.fontSize",
  gap: "heading.subtitle.gap",
  shadowBlur: "heading.subtitle.shadow.blur",
  shadowColorOpacity: "heading.subtitle.shadow.colorOpacity",
  shadowEnabled: "heading.subtitle.shadow.enabled",
  shadowOffset: "heading.subtitle.shadow.offset",
  shadowSpread: "heading.subtitle.shadow.spread",
} as const;
```

- [ ] **Step 4: Run the focused Toolcraft settings test**

Run: `pnpm vitest run src/app/hero-heading-subtitle-toolcraft.test.ts`

Expected: PASS.

### Task 2: Add built-in Toolcraft controls and contract mappings

**Files:**
- Create: `src/app/hero-heading-subtitle-control-sections.ts`
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/hero-preview-pipeline.ts`
- Modify: `src/app/hero-product-control-acceptance.ts`
- Modify: `src/app/hero-visual-preview-cases.ts`
- Modify: `src/app/app-acceptance-data.ts`
- Test: `src/app/hero-heading-subtitle-toolcraft.test.ts`

- [ ] **Step 1: Extend the focused test with schema and pipeline assertions**

Assert a `Hero Subtitle` section on `hero-heading-group`, continuous font-size and gap sliders, a shadow switch, four conditional shadow controls, acceptance rows, and preview invalidation for every target.

```ts
expect(findControl(heroHeadingSubtitleTargets.gap)?.type).toBe("slider");
expect(findControl(heroHeadingSubtitleTargets.fontSize)?.type).toBe("slider");
expect(findControl(heroHeadingSubtitleTargets.shadowEnabled)?.type).toBe("switch");
expect(findControl(heroHeadingSubtitleTargets.shadowOffset)?.applicability).toMatchObject({
  all: [{ equals: true, target: heroHeadingSubtitleTargets.shadowEnabled }],
  mode: "conditional",
});
```

- [ ] **Step 2: Add one schema section using only built-in controls**

Declare `Font size`, `Gap`, `Shadow`, `Shadow offset`, `Shadow blur`, `Shadow spread`, and `Shadow color`; condition all detail controls on the switch and insert the section after `Hero Heading`.

- [ ] **Step 3: Register output and acceptance ownership**

Add numeric controls to `HERO_PREVIEW_CONTROL_DRAG_TARGETS`, discrete controls to `HERO_PREVIEW_CONTROL_CHANGE_TARGETS`, add visual-preview readers, add one acceptance row per target, add the section inventory row, and add the targets to the existing panel-owned interaction list.

- [ ] **Step 4: Run the focused Toolcraft contract test**

Run: `pnpm vitest run src/app/hero-heading-subtitle-toolcraft.test.ts`

Expected: PASS with the v23 payload and all seven targets represented.

### Task 3: Normalize and render the subtitle on the website

**Files:**
- Create: `recraft-v4-styles/src/components/pages/home/hero-heading-subtitle.tsx`
- Create: `recraft-v4-styles/src/components/pages/home/hero-heading-subtitle.test.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-preview-boundary.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.test.ts`

- [ ] **Step 1: Write the website component and normalization tests**

Assert the exact Figma copy/classes, 24px default size, proportional tracking, 24px gap, independent shadow filter URL, legacy fallback, clamping, and protocol v23 boundary.

```ts
assert.match(markup, />Style it once, every image matches</);
assert.match(markup, /leading-\[1\.25\]/);
assert.match(markup, /font-size:24px/);
assert.match(markup, /letter-spacing:-0\.48px/);
```

- [ ] **Step 2: Add website settings and legacy normalization**

Add `HeroHeadingSubtitleSettings`, defaults, numeric bounds, and subtitle normalization. Missing subtitle data in existing applied JSON must resolve to the new defaults without invalidating the rest of the saved hero state. Change the website preview boundary version to `23`.

- [ ] **Step 3: Add the focused subtitle component**

Render a paragraph with fixed Figma copy, family, weight, line-height, and color. Expose `data-hero-heading-subtitle` and apply dynamic `fontSize`, proportional `letterSpacing`, `marginTop`, plus the optional filter URL.

```tsx
<p
  className="font-sans leading-[1.25] font-medium whitespace-nowrap text-white"
  data-hero-heading-subtitle
  style={createHeroHeadingSubtitleStyle(settings, shadowFilterId)}
>
  Style it once, every image matches
</p>
```

- [ ] **Step 4: Reuse the existing SVG shadow filter and mount the subtitle**

Create a stable subtitle filter id, add one `HeroShadowFilter` definition, and render `HeroHeadingSubtitle` between the `h1` and existing CTA.

- [ ] **Step 5: Run only focused website tests**

Run: `pnpm dlx tsx --test src/components/pages/home/hero-heading-subtitle.test.ts src/components/pages/home/hero-scene-settings.test.ts`

Expected: PASS.

### Task 4: Record focused verification and hand off

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`
- Verify: all files changed by Tasks 1–3

- [ ] **Step 1: Record the Figma source and Tier 2 scope**

Add one decision-trail entry citing node `6057:643`, the adjustable size with preserved typography proportions, panel ownership, the v23 mapping, and the explicit omission of full delivery/export/performance checks.

- [ ] **Step 2: Run the smallest directly relevant checks**

Run:

```bash
pnpm vitest run src/app/hero-heading-subtitle-toolcraft.test.ts
cd ../../recraft-v4-styles
pnpm dlx tsx --test src/components/pages/home/hero-heading-subtitle.test.ts src/components/pages/home/hero-scene-settings.test.ts
pnpm exec oxfmt --check src/components/pages/home/hero-heading-subtitle.tsx src/components/pages/home/hero-heading-subtitle.test.ts src/components/pages/home/hero-scene-settings.ts src/components/pages/home/hero-preview-boundary.tsx src/components/pages/home/hero-v4-styles.tsx
```

Expected: focused tests and touched-file formatting PASS. Do not run `verify:delivery`, the full browser suite, export matrices, builds, or performance checks.

- [ ] **Step 3: Review the diff without modifying unrelated work**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; unrelated dirty Fine Details files remain untouched.

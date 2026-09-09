# Hero Badge Scale, Gap, and Shadow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Neither execution skill is available in this session, so the primary agent will execute the same steps inline. Do not commit unless the user asks.

**Goal:** Add live Toolcraft controls for whole-badge scale, badge-to-heading gap, and an independent badge shadow without changing the badge's authored internal geometry.

**Architecture:** Extend the canonical heading settings envelope and reuse `HeroShadowSettings` for a new `badgeShadow`. Toolcraft owns values, persistence, reset, and iframe synchronization; the website normalizer clamps the new envelope fields and the heading renderer scales the existing badge as one child inside a bounds-reserving wrapper with its own SVG shadow filter.

**Tech Stack:** TypeScript, React 19, Next.js 16, Toolcraft schema controls, CSS transforms, SVG filters, Vitest/node:test.

---

### Task 1: Define and test the Toolcraft badge value model

**Files:**
- Modify: `src/app/hero-heading-values.ts`
- Modify: `src/app/hero-preview-protocol.ts`
- Modify: `src/app/hero-preview-pipeline.ts`
- Modify: `src/app/hero-visual-preview-cases.ts`
- Test: `src/app/hero-preview.product.test.ts`

- [ ] **Step 1: Add failing preview cases for scale, gap, and badge shadow**

Add cases that map `heading.badgeScale` to `settings.heading.badgeScale`, `heading.badgeGap` to `settings.heading.badgeGap`, and all five `heading.badgeShadow.*` targets to `settings.heading.badgeShadow.*`. Update the protocol assertion from 20 to 21.

- [ ] **Step 2: Run the focused test and confirm the missing targets fail**

Run: `pnpm vitest run src/app/hero-preview.product.test.ts`

Expected: failure because the new heading targets and settings fields do not exist.

- [ ] **Step 3: Extend the canonical settings and preview mapper**

Add these targets and settings fields:

```ts
badgeGap: "heading.badgeGap",
badgeScale: "heading.badgeScale",
badgeShadowBlur: "heading.badgeShadow.blur",
badgeShadowColorOpacity: "heading.badgeShadow.colorOpacity",
badgeShadowEnabled: "heading.badgeShadow.enabled",
badgeShadowOffset: "heading.badgeShadow.offset",
badgeShadowSpread: "heading.badgeShadow.spread",
```

Use defaults `badgeScale: 100`, `badgeGap: 10`, and the approved disabled shadow. Map values through `createHeroShadowSettingsFromValues`, clamp scale to 25–300 and gap to 0–160, add the targets to the appropriate drag/change pipeline target lists, and increment `HERO_PREVIEW_PROTOCOL_VERSION` to 21.

- [ ] **Step 4: Run the focused mapping test**

Run: `pnpm vitest run src/app/hero-preview.product.test.ts`

Expected: all preview mapping cases pass.

### Task 2: Add built-in Badge and Badge Shadow controls

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/hero-visual-control-sections.ts`
- Modify: `src/app/hero-product-control-acceptance.ts`
- Modify: `src/app/app-acceptance-data.ts`
- Test: `src/app/hero-preview.product.test.ts`

- [ ] **Step 1: Add failing control coverage expectations**

Assert that each new target resolves to a schema control, has its canonical default, and has a matching acceptance row. Include scale and gap in the visual preview cases so the existing generic loop proves pipeline membership and output mapping.

- [ ] **Step 2: Move Badge visibility into the Badge section and add scale/gap**

Keep `Hero Heading` focused on both heading lines and placement. In `Badge`, render the existing visibility switch plus:

```ts
badgeScale: {
  applicability: { all: [{ equals: true, target: heroHeadingTargets.badgeVisible }], mode: "conditional" },
  defaultValue: 100,
  label: "Scale",
  min: 25,
  max: 300,
  step: 1,
  type: "slider",
  unit: "%",
  variant: "continuous",
  sliderValueKind: "continuous",
},
badgeGap: {
  applicability: { all: [{ equals: true, target: heroHeadingTargets.badgeVisible }], mode: "conditional" },
  defaultValue: 10,
  label: "Text gap",
  min: 0,
  max: 160,
  step: 1,
  type: "slider",
  unit: "px",
  variant: "continuous",
  sliderValueKind: "continuous",
},
```

Keep Badge color in the same section. Add a separate `Badge Shadow` section with the existing Switch → conditional Vector/Blur/Spread/Color & Opacity pattern used by Heading Shadow and CTA Shadow.

- [ ] **Step 3: Align section inventory and acceptance**

Record all four Badge targets under workflow stage `badge`, the five shadow targets under `badge-shadow`, and add one product-observable acceptance row per target. Scale must resize only the badge, gap must move only the heading relative to the badge, and badge shadow controls must not alter heading or CTA shadows.

- [ ] **Step 4: Run the focused Toolcraft test**

Run: `pnpm vitest run src/app/hero-preview.product.test.ts`

Expected: all new controls, acceptances, defaults, and mappings pass.

### Task 3: Normalize the extended website settings envelope

**Files:**
- Modify: `../recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `../recraft-v4-styles/src/components/pages/home/hero-preview-boundary.tsx`
- Test: `../recraft-v4-styles/src/components/pages/home/hero-scene-settings.test.ts`
- Test: `../recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.test.ts`

- [ ] **Step 1: Add a failing normalization test**

Verify legacy JSON receives defaults and untrusted values clamp as follows:

```ts
assert.equal(normalized.heading.badgeScale, 300);
assert.equal(normalized.heading.badgeGap, 0);
assert.deepEqual(normalized.heading.badgeShadow, {
  enabled: true,
  offset: { x: 1, y: -1 },
  blur: 100,
  spread: -32,
  colorOpacity: { hex: '#112233', opacity: 100 },
});
```

- [ ] **Step 2: Extend website types, defaults, bounds, and normalizer**

Add `badgeScale`, `badgeGap`, and `badgeShadow` to `HeroHeadingSettings`; add `[25, 300]` and `[0, 160]` bounds; normalize the shadow with `normalizeHeroShadowSettings`; preserve defaults for old applied JSON.

- [ ] **Step 3: Increment the website preview protocol**

Change `previewProtocolVersion` from 20 to 21 and update its focused source assertion.

- [ ] **Step 4: Run the focused website tests**

Run: `../recraft-tools/hero/node_modules/.bin/vite-node src/components/pages/home/hero-scene-settings.test.ts`

Run: `../recraft-tools/hero/node_modules/.bin/vite-node src/components/pages/home/hero-dispersion-post-shader.test.ts`

Expected: both focused files pass.

### Task 4: Render scale, exact gap, and independent badge shadow

**Files:**
- Modify: `../recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Test: `../recraft-v4-styles/src/components/pages/home/hero-heading-badge.test.ts`

- [ ] **Step 1: Add a focused renderer contract test**

Read the renderer source and assert that the badge has its own filter id, uses `settings.heading.badgeScale / 100`, reserves scaled bounds in a wrapper, uses `settings.heading.badgeGap` for the heading margin, and reads `settings.heading.badgeShadow` independently from `settings.heading.shadow`.

- [ ] **Step 2: Implement one-unit scaling**

Keep the existing badge markup and responsive base sizes. Wrap it in a layout box whose dimensions are the scaled base size and scale the unchanged badge child with `transform: scale(...)`. Center the child in the wrapper so the complete ring, stroke, and V4 lettering scale together.

- [ ] **Step 3: Apply exact gap and a separate SVG filter**

Replace the fixed `mt-2.5` with inline `marginTop: settings.heading.badgeGap` when visible. Create a unique badge filter id and reproduce the existing morphology → blur → offset → flood → composite → merge chain using `settings.heading.badgeShadow`; apply it to the bounds wrapper only when enabled.

- [ ] **Step 4: Run the focused renderer test**

Run: `../recraft-tools/hero/node_modules/.bin/vite-node src/components/pages/home/hero-heading-badge.test.ts`

Expected: the renderer contract passes.

### Task 5: Record the decision and hand off for local review

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Record the later-feature verification note**

Add one Decision Trail entry with the user request, whole-artwork scale decision, built-in controls, independent shadow state/output mapping, Tier 2 classification, and focused checks. Explicitly record that aggregate delivery, full browser, build, and measured performance are skipped.

- [ ] **Step 2: Run only directly affected checks**

Run the Toolcraft preview test and the two focused website tests from Tasks 2–4. Do not run `verify:delivery`, build, full browser suites, or performance measurement.

- [ ] **Step 3: Confirm the existing dev servers remain available**

Check `http://127.0.0.1:3003/` and `http://localhost:3000/`. Let Vite/Next hot reload the change; do not restart healthy processes.

- [ ] **Step 4: Return the feature for user testing**

Report the Hero Toolcraft URL and summarize the three new control groups. Do not commit or push unless the user explicitly requests it.

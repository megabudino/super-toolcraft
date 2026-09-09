# Hero Shadows, Badge Color, and Card Radius Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add independently persisted Hero heading and prompt shadows, V4 badge color, and shared gallery-card corner radius to Toolcraft live preview and Apply.

**Architecture:** A shared typed `HeroShadowSettings` value model is decoded by Toolcraft and normalized again by the website bridge. The heading uses an SVG morphology/blur/offset filter for real spread, the prompt uses `box-shadow`, and the gallery radius is applied in the canonical WebGL card sampler plus CSS fallbacks so Rows and Sphere stay consistent.

**Tech Stack:** React 19, Next.js 16, TypeScript, Toolcraft schema/runtime, iframe `postMessage`, CSS box-shadow, SVG filters, WebGL/GLSL, Vitest, Playwright.

---

### Task 1: Add typed values and protocol mapping

**Files:**
- Create: `recraft-tools/hero/src/app/hero-shadow-values.ts`
- Modify: `recraft-tools/hero/src/app/hero-heading-values.ts`
- Modify: `recraft-tools/hero/src/app/hero-prompt-values.ts`
- Modify: `recraft-tools/hero/src/app/hero-gallery-values.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview-protocol.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview-pipeline.ts`
- Test: `recraft-tools/hero/src/app/hero-preview.product.test.ts`
- Test: `recraft-tools/hero/src/app/hero-gallery-values.test.ts`

- [ ] **Step 1: Write failing value-mapping tests**

Add cases that pass every new target through `createHeroPreviewSettingsFromValues` and assert independent nested output:

```ts
expect(settings.heading.badgeColor).toBe("#FF00AA");
expect(settings.heading.shadow).toEqual({
  blur: 24,
  colorOpacity: { hex: "#102030", opacity: 55 },
  enabled: true,
  offset: { x: -0.5, y: 0.25 },
  spread: 8,
});
expect(settings.prompt.shadow.enabled).toBe(false);
expect(settings.gallery.cardRadius).toBe(48);
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run:

```bash
pnpm vitest run src/app/hero-preview.product.test.ts src/app/hero-gallery-values.test.ts
```

Expected: fail because the new targets and settings fields do not exist.

- [ ] **Step 3: Implement the shared value shape and entity targets**

Create:

```ts
export type HeroShadowSettings = Readonly<{
  blur: number;
  colorOpacity: Readonly<{ hex: string; opacity: number }>;
  enabled: boolean;
  offset: Readonly<{ x: number; y: number }>;
  spread: number;
}>;
```

Add `badgeColor` and five `heading.shadow.*` targets, five `prompt.shadow.*` targets, and `cards.radius`. Use bounded normalization: offset `-1..1`, blur `0..100`, spread `-32..32`, opacity `0..100`, radius `0..160`.

- [ ] **Step 4: Extend the preview payload**

Add the new nested settings to `HeroPreviewSettings`, decode all targets, include them in live synchronization, and bump `HERO_PREVIEW_PROTOCOL_VERSION` once.

- [ ] **Step 5: Run focused mapping tests**

Run the Task 1 Vitest command again.

Expected: pass.

### Task 2: Add Toolcraft controls and acceptance inventory

**Files:**
- Modify: `recraft-tools/hero/src/app/app-schema.ts`
- Modify: `recraft-tools/hero/src/app/app-acceptance-data.ts`
- Modify: `recraft-tools/hero/src/app/app-performance.ts`
- Test: `recraft-tools/hero/src/app/hero-preview.product.test.ts`

- [ ] **Step 1: Add a failing schema assertion**

Assert that the schema exposes `Heading Effects`, six controls in `Prompt`, and `Card radius` in `Gallery`, all bound to the new targets.

- [ ] **Step 2: Add built-in controls**

Use the following control kinds:

```ts
badgeColor: { type: "color", target: heroHeadingTargets.badgeColor }
shadowEnabled: { type: "switch", target: heroHeadingTargets.shadowEnabled }
shadowOffset: { type: "vector", coordinateMode: "screen", target: heroHeadingTargets.shadowOffset }
shadowBlur: { type: "slider", min: 0, max: 100, unit: "px" }
shadowSpread: { type: "slider", min: -32, max: 32, unit: "px" }
shadowColor: { type: "colorOpacity", target: heroHeadingTargets.shadowColorOpacity }
```

Repeat the same shadow kinds for Prompt with independent targets. Add `Card radius` as an always-applicable `0..160px` slider to Gallery.

- [ ] **Step 3: Split the heading inventory correctly**

Keep `Hero Heading` at six controls and add `Heading Effects` at six controls. Both inventory entries use the same heading `entityId`, distinct `workflowStage` values, and the same `splitReason`. Preserve semantic groups on the eight-control Gallery section.

- [ ] **Step 4: Add acceptance and performance mappings**

Add one observable acceptance row per new target. Add the targets to the live iframe renderer path and performance target inventory as responsiveness controls; do not add workload dimensions.

- [ ] **Step 5: Run focused product and code-health tests**

Run:

```bash
pnpm vitest run src/app/hero-preview.product.test.ts
pnpm ai:check
```

Expected: pass without running the broad delivery suite.

### Task 3: Normalize and render shadows and badge color on the website

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-applied-settings.json`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Modify: `recraft-v4-styles/src/components/ai-prompt-input.tsx`

- [ ] **Step 1: Extend website settings normalization**

Add `HeroShadowSettings`, default values, and bounded normalization. Missing fields must fall back so older settings files still load. Add `badgeColor`, `heading.shadow`, `prompt.shadow`, and `gallery.cardRadius` to the applied JSON without changing unrelated current values.

- [ ] **Step 2: Add a reusable shadow-to-CSS mapper**

Map the normalized vector to the same pixel range for both shadows:

```ts
const offsetX = shadow.offset.x * 48;
const offsetY = shadow.offset.y * 48;
const color = `${shadow.colorOpacity.hex}${alphaHex}`;
return shadow.enabled
  ? `${offsetX}px ${offsetY}px ${shadow.blur}px ${shadow.spread}px ${color}`
  : "none";
```

- [ ] **Step 3: Render the prompt shadow on the form root**

Extend `AiPromptInputProps` with `style?: CSSProperties`, pass it to `<form>`, and supply the computed `boxShadow` from the Hero instance. Inline style overrides only the Hero instance; other consumers retain the existing authored shadow.

- [ ] **Step 4: Render badge color**

Replace the fixed-color ring image with a `border-current` circle. Set `color: settings.heading.badgeColor` on the badge container so both ring and `V4` inherit the same persisted value.

- [ ] **Step 5: Render real heading spread**

Create a stable SVG filter id with `useId`. Apply `feMorphology`, `feGaussianBlur`, `feOffset`, `feFlood`, `feComposite`, and `feMerge` to the `<h1>` only. Use `dilate` for non-negative spread and `erode` for negative spread. Omit the filter style while disabled.

- [ ] **Step 6: Run focused website static checks**

Run:

```bash
pnpm exec oxfmt --check src/components/pages/home/hero-scene-settings.ts src/components/pages/home/hero-v4-styles.tsx src/components/ai-prompt-input.tsx
pnpm typecheck
```

Expected: pass.

### Task 4: Apply radius in Rows and Sphere rendering

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-card-dispersion-webgl.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-dispersion-card.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-webgl.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-sphere-gallery.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`

- [ ] **Step 1: Add a shared shader uniform**

Declare `uniform float uCornerRadius;` and mask `sampleCard` using a rounded-rectangle signed distance in card-local pixels:

```glsl
float roundedCardMask(vec2 local) {
  float radius = clamp(uCornerRadius, 0.0, min(uCardSize.x, uCardSize.y) * 0.5);
  vec2 halfSize = uCardSize * 0.5;
  vec2 q = abs(local - halfSize) - (halfSize - vec2(radius));
  float distance = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  return 1.0 - smoothstep(0.0, 1.0, distance);
}
```

Multiply sampled premultiplied color and alpha by the mask.

- [ ] **Step 2: Feed radius through the Rows renderer**

Add `cornerRadius` to `HeroCardRollLayout`, set the uniform in `setLayout`, pass `settings.gallery.cardRadius` through `HeroDispersionCard`, and include it in the row motion signature.

- [ ] **Step 3: Feed radius through the Sphere renderer**

Resolve `uCornerRadius` in its locations and upload `settings.gallery.cardRadius` before drawing cards.

- [ ] **Step 4: Match fallbacks**

Set `borderRadius: settings.gallery.cardRadius` and `overflow: hidden` on Rows/Sphere fallback image containers so non-WebGL output matches.

- [ ] **Step 5: Run focused format and type checks**

Run:

```bash
pnpm exec oxfmt --check src/components/pages/home/hero-card-dispersion-webgl.ts src/components/pages/home/hero-dispersion-card.tsx src/components/pages/home/hero-sphere-gallery-webgl.ts src/components/pages/home/hero-sphere-gallery.tsx src/components/pages/home/hero-v4-styles.tsx
pnpm typecheck
```

Expected: pass.

### Task 5: Focused browser proof and worklog

**Files:**
- Modify: `recraft-tools/hero/e2e/product-cards-preview.spec.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview.product.test.ts`
- Modify: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Add focused browser assertions**

Use the real Toolcraft iframe and prove:

```ts
// heading shadow changes while prompt shadow stays unchanged
// prompt spread changes while heading shadow stays unchanged
// badge text and ring resolve to the selected color
// Rows and Sphere both expose the selected card radius
// Apply sends and acknowledges all new nested settings
```

- [ ] **Step 2: Run the smallest feature checks**

Run:

```bash
pnpm vitest run src/app/hero-preview.product.test.ts src/app/hero-gallery-values.test.ts
npm run test:feature -- heading.badgeColor
npm run test:feature -- heading.shadow.enabled
npm run test:feature -- prompt.shadow.enabled
npm run test:feature -- cards.radius
```

Expected: each focused scenario passes. Do not run `verify:delivery`, the broad browser suite, or measured performance.

- [ ] **Step 3: Perform one manual browser check**

Open the existing Hero Toolcraft server, move each new control, verify live iframe updates, switch Rows/Sphere for radius, click Apply, and reload the website to confirm persisted output.

- [ ] **Step 4: Update the worklog**

Record this as later Tier 3 feature work, list the exact focused checks, note that measured performance was not run, and document the shared value model plus two rendering techniques.

- [ ] **Step 5: Review the final diff**

Confirm only intended additive edits are present and that unrelated dirty Hero lens/gallery work remains untouched.

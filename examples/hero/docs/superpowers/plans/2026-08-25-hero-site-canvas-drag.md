# Hero Site Canvas Drag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the website Hero canvas the same direct pan drag as Toolcraft while preserving the normal cursor and CTA interaction.

**Architecture:** Add a small pure website pan helper that mirrors Toolcraft's wrap and delta formulas. `HeroSphereGallery` owns ephemeral interactive pan and a pointer-captured, requestAnimationFrame-coalesced gesture; the renderer continues to receive the existing scene settings with only pan overridden during website interaction.

**Tech Stack:** React 19, TypeScript, Pointer Events, requestAnimationFrame, Next.js 16, WebGL.

---

### Task 1: Port Toolcraft pan math

**Files:**

- Create: `recraft-v4-styles/src/components/pages/home/hero-gallery-drag.ts`
- Test: `recraft-v4-styles/src/components/pages/home/hero-gallery-drag.test.ts`

- [x] **Step 1: Write the failing math contract**

```ts
assert.deepEqual(
  applyHeroGalleryPanDrag({
    deltaPx: { x: Math.PI * 510, y: panelPeriod / 4 },
    panelPeriod,
    sphereWidth: 510,
    start: { x: 0, y: 0 },
  }),
  { x: -1, y: 0.5 },
);
```

- [x] **Step 2: Run the focused test and confirm it fails because the helper is absent**

Run: `pnpm dlx tsx --test src/components/pages/home/hero-gallery-drag.test.ts`

- [x] **Step 3: Implement the exact Toolcraft formulas**

```ts
export function wrapHeroGalleryPanUnit(value: number) {
  return ((((value + 1) % 2) + 2) % 2) - 1;
}

export function applyHeroGalleryPanDrag({ deltaPx, panelPeriod, sphereWidth, start }: Input) {
  return {
    x: wrapHeroGalleryPanUnit(start.x + deltaPx.x / (Math.PI * Math.max(1, sphereWidth))),
    y: wrapHeroGalleryPanUnit(start.y + deltaPx.y / Math.max(1, panelPeriod / 2)),
  };
}
```

- [x] **Step 4: Run the focused test and confirm it passes**

Run: `pnpm dlx tsx --test src/components/pages/home/hero-gallery-drag.test.ts`

### Task 2: Add the website pointer gesture

**Files:**

- Modify: `recraft-v4-styles/src/components/pages/home/hero-sphere-gallery.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Test: `recraft-v4-styles/src/components/pages/home/hero-gallery-drag.test.ts`

- [x] **Step 1: Add source contracts for capture and lifecycle**

```ts
assert.match(componentSource, /setPointerCapture\?\.\(event\.pointerId\)/);
assert.match(componentSource, /onLostPointerCapture=/);
assert.match(componentSource, /onPointerCancel=/);
assert.match(componentSource, /requestAnimationFrame/);
```

- [x] **Step 2: Implement local interactive pan and pointer capture**

Use the supplied settings pan as the gesture baseline, coalesce pointer movement through one animation frame, call `setPointerCapture` on down, and release it on up/cancel/lost capture. Reset interactive pan whenever the supplied pan changes.

- [x] **Step 3: Preserve interaction ownership**

Make the sphere canvas `pointer-events-auto touch-none` with the normal cursor, keep the decorative heading wrapper `pointer-events-none`, and make the CTA itself `pointer-events-auto`.

- [x] **Step 4: Run the focused contract**

Run: `pnpm dlx tsx --test src/components/pages/home/hero-gallery-drag.test.ts`

### Task 3: Fast live verification

**Files:**

- Modify: `recraft-tools/hero/docs/superpowers/plans/2026-08-25-hero-site-canvas-drag.md`

- [x] **Step 1: Verify the site interaction on port 3000**

Drag the Hero canvas and confirm `data-hero-gallery-pan` changes, the renderer remains `webgl`, and pointer capture is released. Click the CTA separately and confirm the hash changes to `#hero-cta`.

Actual result: pan changed from `0.8821:-0.1346:0` to `0.9601:-0.1054:0`, drag state returned to `idle`, renderer stayed `webgl/ready`, the console had no errors, and CTA navigation reached `#hero-cta`.

- [x] **Step 2: Run only scoped checks**

Run the focused test, format touched files, and run `git diff --check`. Do not run full build/e2e per the user's speed request.

- [x] **Step 3: Preserve the shared dirty worktree**

Do not commit or stage files; unrelated Fine Details, heading-selection, and other in-progress changes remain untouched.

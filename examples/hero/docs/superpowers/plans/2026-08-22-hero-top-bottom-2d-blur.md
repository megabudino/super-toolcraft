# Hero Top/Bottom 2D Blur Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the hard duplicated horizontal strip at the Sphere top/bottom zone by making Blur two-dimensional there while preserving the current side effect exactly.

**Architecture:** Keep the existing Sphere scene→field→post pipeline and uniforms. Split sample offsets only after the current side/vertical dominance decision: side pixels retain the existing formula, while vertical pixels combine lens-aligned dispersion with a deterministic 2D disk blur whose radius enters through a smooth vertical envelope.

**Tech Stack:** TypeScript, GLSL ES 1.00, Node test runner through `tsx`, WebGL1, Toolcraft iframe preview.

---

## Verification Tier

This is a later Tier 3 visual shader correction. Run only the focused post-shader contract, existing Sphere motion/layout regressions, one live Toolcraft before/after scenario, formatting, and `git diff --check`. Do not run aggregate delivery, build, broad browser matrices, or measured performance.

### Task 1: Lock the vertical-only 2D blur contract in a failing test

**Files:**

- Modify: `recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.test.ts`
- Reference: `recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.ts:310-480`

- [x] **Step 1: Add one focused contract test**

Append:

```ts
test('top and bottom use a soft 2D blur without changing side offsets', () => {
  assert.match(
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    /float verticalDominant = verticalDistance > sideDistance \? 1\.0 : 0\.0;/,
  );
  assert.match(HERO_DISPERSION_POST_FRAGMENT_SHADER, /vec2 diskSampleOffset\(/);
  assert.match(
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    /float verticalBlurEntrance = smoothstep\(0\.0, 0\.2, verticalDistance\);/,
  );
  assert.match(
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    /vec2 sideOffset = direction \* span \* spread \+ motionVelocity \* spread \* 2\.0 \+\s*perpendicular \* \(\(jitterY \* 2\.0 - 1\.0\) \* verticalExtent\);/,
  );
  assert.match(
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    /vec2 verticalOffset = direction \* verticalDispersionSpan \* spread \+\s*motionVelocity \* spread \* 2\.0 \+ diskSampleOffset\(/,
  );
  assert.match(
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    /vec2 offset = verticalDominant > 0\.5 \? verticalOffset : sideOffset;/,
  );
  assert.doesNotMatch(
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    /verticalOffset\s*=\s*direction \* span/,
  );
  assert.match(
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    /vec2 auraOffset = verticalDominant > 0\.5 \? verticalAuraOffset : sideAuraOffset;/,
  );
});
```

- [x] **Step 2: Run the focused test and confirm the red state**

Run from `recraft-v4-styles`:

```bash
pnpm dlx tsx --test src/components/pages/home/hero-dispersion-post-shader.test.ts
```

Expected: the new test fails because the current shader has no `verticalDominant`, no disk kernel, and still puts `blurExtent` into the vertical directional `span`.

### Task 2: Split vertical dispersion from Blur inside the existing post loop

**Files:**

- Modify: `recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.ts:289-480`
- Test: `recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.test.ts`

- [x] **Step 1: Add a deterministic bounded disk helper before `main`**

```glsl
vec2 diskSampleOffset(
  vec2 axis,
  vec2 perpendicularAxis,
  float radiusSeed,
  float angleSeed,
  float radius
) {
  float angle = angleSeed * 6.283185;
  float sampleRadius = sqrt(clamp(radiusSeed, 0.0, 1.0)) * max(radius, 0.0);
  return (axis * cos(angle) + perpendicularAxis * sin(angle)) * sampleRadius;
}
```

- [x] **Step 2: Record vertical ownership without changing the existing side tie-break**

Immediately after the existing directions:

```glsl
float verticalDominant = verticalDistance > sideDistance ? 1.0 : 0.0;
```

Keep these existing lines unchanged:

```glsl
float distance = max(sideDistance, verticalDistance);
vec2 direction = sideDistance >= verticalDistance ? sideDirection : verticalDirection;
vec2 perpendicular = vec2(-direction.y, direction.x);
```

- [x] **Step 3: Derive a vertical dispersion span and soft 2D radius**

Replace the extent block with:

```glsl
float dispersionExtent = uAmount * staticEdge;
float blurExtent = uBlur * staticEdge + uWarpWaveBlur * warpWindow;
float span = dispersionExtent + blurExtent;
float verticalExtent = blurExtent * 0.5;
float verticalDispersionSpan = dispersionExtent;
float verticalBlurEntrance = smoothstep(0.0, 0.2, verticalDistance);
float verticalBlurRadius = verticalExtent * verticalBlurEntrance;
```

When turbulence computes its existing modulation, assign it once and apply it to all three extents:

```glsl
float modulation = mix(1.0, 0.55 + 1.05 * envelope, uTurbulence);
span *= modulation;
verticalDispersionSpan *= modulation;
verticalBlurRadius *= modulation;
```

The side path remains equivalent because it still consumes `span` and `verticalExtent` with the original constants.

- [x] **Step 4: Branch only the main sample offset**

Replace the current single `offset` expression with:

```glsl
vec2 sideOffset = direction * span * spread + motionVelocity * spread * 2.0 +
  perpendicular * ((jitterY * 2.0 - 1.0) * verticalExtent);
vec2 verticalOffset = direction * verticalDispersionSpan * spread +
  motionVelocity * spread * 2.0 + diskSampleOffset(
    direction,
    perpendicular,
    jitterX,
    jitterY,
    verticalBlurRadius
  );
vec2 offset = verticalDominant > 0.5 ? verticalOffset : sideOffset;
```

- [x] **Step 5: Give the vertical aura the same 2D geometry while preserving side aura**

Replace the current aura `offset` expression with:

```glsl
vec2 sideAuraOffset = direction * (span * 2.6 + 24.0) * haloSwing * spread +
  motionVelocity * spread * 3.0 + perpendicular *
  ((jitterY * 2.0 - 1.0) * (verticalExtent * 2.5 + 12.0) + haloWave * 34.0);
vec2 verticalAuraOffset = direction * verticalDispersionSpan * 2.6 * haloSwing * spread +
  motionVelocity * spread * 3.0 + diskSampleOffset(
    direction,
    perpendicular,
    jitterX,
    jitterY,
    (verticalBlurRadius * 2.5 + 12.0 * verticalBlurEntrance) * haloSwing
  ) + perpendicular * haloWave * 34.0;
vec2 auraOffset = verticalDominant > 0.5 ? verticalAuraOffset : sideAuraOffset;
```

Sample with `sampleScene(point + auraOffset)`.

- [x] **Step 6: Run focused shader, motion, and layout tests**

```bash
pnpm dlx tsx --test \
  src/components/pages/home/hero-dispersion-post-shader.test.ts \
  src/components/pages/home/hero-sphere-gallery-motion.test.ts \
  src/components/pages/home/hero-sphere-layout-phase.test.ts \
  src/components/pages/home/hero-sphere-layout-visibility.test.ts
```

Expected: all focused tests pass; the side formula contract, global drag motion, phase carry, and the separate card-visibility regression remain green.

- [x] **Step 7: Format only the touched shader files**

```bash
pnpm exec oxfmt \
  src/components/pages/home/hero-dispersion-post-shader.ts \
  src/components/pages/home/hero-dispersion-post-shader.test.ts
```

Expected: formatter succeeds without unrelated rewrites.

### Task 3: Verify the real top/bottom transition and document the delivery

**Files:**

- Modify: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`
- Input: `/Users/kusnizza/Downloads/hero-settings (1).json`

- [x] **Step 1: Recheck the isolated vertical fixture in the real UI**

Use the existing Toolcraft/website servers and the same imported JSON. Set `Edge width = 0` and `Top and bottom = 20` through the real controls at Pan approximately `0.1028:-0.6760:2`. Confirm the hard duplicated horizontal strip is gone, the top/bottom effect follows the curved lens, and its inner edge transitions softly.

- [x] **Step 2: Recheck side-only behavior**

Set `Top and bottom = 0` and restore `Edge width = 30`. Confirm the side output still uses the existing directed stretch/dispersive appearance and the renderer remains one ready WebGL `scene→field→post` canvas with no console errors.

- [x] **Step 3: Restore the supplied JSON state**

Import `/Users/kusnizza/Downloads/hero-settings (1).json` again so the local Toolcraft preview is returned to the user's exact settings.

- [x] **Step 4: Record Delivery 28 in the Toolcraft worklog**

Record the root cause, vertical-only 2D disk kernel, byte-equivalent side branch, unchanged protocol v14/pipeline/settings, exact focused commands, real iframe observations, and the explicit exclusion of aggregate/build/measured-performance checks.

- [x] **Step 5: Run final hygiene checks**

From the repository root:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors. Preserve and do not stage unrelated Pan-handle/CSS/planning changes. Do not commit or push implementation files unless the user explicitly requests it.

## Completion Criteria

- Blur never contributes to the vertical directional dispersion span.
- Top/bottom Blur uses a soft deterministic 2D disk kernel.
- Vertical aura cannot recreate the hard duplicated strip.
- The side sample and aura formulas remain unchanged.
- No new setting, protocol field, pass, framebuffer, texture, or workload dimension.
- Focused source regressions and the live iframe check pass.

# Hero Random Long Auto-Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add smooth `1.0–1.5` turn Hero Sphere auto-scroll glides every second or third automatic movement while preserving all existing short glides and interaction lifecycle behavior.

**Architecture:** Keep target generation and cadence selection as deterministic pure functions in the existing Sphere motion module. The retained WebGL renderer owns the cadence state, selects a glide kind only when a scheduled timer actually starts a glide, and multiplies the configured base duration only for long targets.

**Tech Stack:** TypeScript, React/WebGL retained renderer, Node test runner

---

### Task 1: Add deterministic long-glide motion primitives

**Files:**
- Modify: `../../recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-motion.ts`
- Test: `../../recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-motion.test.ts`

- [x] **Step 1: Write failing distance, cadence, and duration tests**

Import the new public constants and helpers in `hero-sphere-gallery-motion.test.ts`:

```ts
import {
  MAX_LONG_X,
  MAX_X,
  MIN_LONG_X,
  MIN_X,
  beginHeroAutoScrollGlide,
  consumeHeroAutoScrollCadence,
  createHeroAutoScrollCadenceState,
  createHeroAutoScrollState,
  getHeroAutoScrollDurationMultiplier,
} from './hero-sphere-gallery-motion';
```

Add deterministic coverage for both long bounds and both signs:

```ts
test('long auto-scroll uses one to one-and-a-half unwrapped horizontal turns', () => {
  const negative = beginHeroAutoScrollGlide(
    createHeroAutoScrollState(),
    1,
    scriptedRandom([0, 0]),
    'long',
  );
  const positive = beginHeroAutoScrollGlide(
    createHeroAutoScrollState(),
    1,
    scriptedRandom([1, 1]),
    'long',
  );

  assert.equal(MIN_LONG_X, 1);
  assert.equal(MAX_LONG_X, 1.5);
  assert.equal(negative.target.x, -MIN_LONG_X);
  assert.equal(positive.target.x, MAX_LONG_X);
  assert.equal(negative.target.y, 0);
  assert.equal(positive.target.y, 0);
});
```

Add cadence coverage that proves the random choices create one or two shorts between longs:

```ts
test('long auto-scroll cadence always resolves to every second or third glide', () => {
  let cadence = createHeroAutoScrollCadenceState();
  const random = scriptedRandom([0, 1, 0]);
  const kinds = Array.from({ length: 8 }, () => {
    const consumed = consumeHeroAutoScrollCadence(cadence, random);
    cadence = consumed.state;
    return consumed.glideKind;
  });

  assert.deepEqual(kinds, [
    'short',
    'long',
    'short',
    'short',
    'long',
    'short',
    'long',
    'short',
  ]);
});
```

Add duration coverage:

```ts
test('only long auto-scroll scales duration relative to the maximum short distance', () => {
  const short = beginHeroAutoScrollGlide(
    createHeroAutoScrollState(),
    1,
    scriptedRandom([1, 1]),
  );
  const minimumLong = beginHeroAutoScrollGlide(
    createHeroAutoScrollState(),
    1,
    scriptedRandom([0, 1]),
    'long',
  );
  const maximumLong = beginHeroAutoScrollGlide(
    createHeroAutoScrollState(),
    1,
    scriptedRandom([1, 1]),
    'long',
  );

  assert.equal(getHeroAutoScrollDurationMultiplier(short), 1);
  assert.equal(getHeroAutoScrollDurationMultiplier(minimumLong), MIN_LONG_X / MAX_X);
  assert.equal(getHeroAutoScrollDurationMultiplier(maximumLong), MAX_LONG_X / MAX_X);
});
```

- [x] **Step 2: Run the focused motion test and verify failure**

Run from `recraft-v4-styles`:

```bash
node --import ./scripts/register-test-hooks.mjs --import tsx --test \
  src/components/pages/home/hero-sphere-gallery-motion.test.ts
```

Expected: FAIL because the long-distance constants, glide kind, cadence helpers, and duration multiplier do not exist.

- [x] **Step 3: Implement the pure cadence and target helpers**

In `hero-sphere-gallery-motion.ts`, keep the current short bounds and add:

```ts
export const MIN_X = 0.1;
export const MAX_X = 0.45;
export const MIN_LONG_X = 1;
export const MAX_LONG_X = 1.5;

export type HeroAutoScrollGlideKind = 'long' | 'short';

export interface HeroAutoScrollCadenceState {
  shortGlidesRemaining: number | null;
}

export function createHeroAutoScrollCadenceState(): HeroAutoScrollCadenceState {
  return { shortGlidesRemaining: null };
}

function getRandomShortGlideCount(random: () => number) {
  return clampRandomSample(random) < 0.5 ? 1 : 2;
}

export function consumeHeroAutoScrollCadence(
  state: HeroAutoScrollCadenceState,
  random: () => number,
): { glideKind: HeroAutoScrollGlideKind; state: HeroAutoScrollCadenceState } {
  const shortGlidesRemaining =
    state.shortGlidesRemaining ?? getRandomShortGlideCount(random);

  if (shortGlidesRemaining > 0) {
    return {
      glideKind: 'short',
      state: { shortGlidesRemaining: shortGlidesRemaining - 1 },
    };
  }

  return {
    glideKind: 'long',
    state: { shortGlidesRemaining: getRandomShortGlideCount(random) },
  };
}
```

Extend `beginHeroAutoScrollGlide` with a defaulted kind so every current caller remains a short glide:

```ts
export function beginHeroAutoScrollGlide(
  state: HeroAutoScrollState,
  rowCount: number,
  random: () => number,
  glideKind: HeroAutoScrollGlideKind = 'short',
): HeroAutoScrollState {
  const count = Math.max(1, Math.floor(rowCount));
  const step = getHeroAutoScrollStep(count);
  const currentRow = Math.round(state.offset.y / step);
  let rowDelta = 0;

  if (count > 1) {
    const alternative =
      1 + Math.min(count - 2, Math.floor(clampRandomSample(random) * (count - 1)));
    if (alternative * 2 === count) {
      rowDelta = clampRandomSample(random) < 0.5 ? -alternative : alternative;
    } else {
      rowDelta = alternative * 2 < count ? alternative : alternative - count;
    }
  }

  const horizontalSample = clampRandomSample(random);
  const minimumX = glideKind === 'long' ? MIN_LONG_X : MIN_X;
  const maximumX = glideKind === 'long' ? MAX_LONG_X : MAX_X;
  const horizontalMagnitude =
    horizontalSample === 0
      ? minimumX
      : horizontalSample === 1
        ? maximumX
        : minimumX + (maximumX - minimumX) * horizontalSample;
  const horizontalSign = clampRandomSample(random) < 0.5 ? -1 : 1;
  const offset = { ...state.offset };

  return {
    elapsed: 0,
    from: offset,
    mode: 'gliding',
    offset: { ...offset },
    target: {
      x: offset.x + horizontalMagnitude * horizontalSign,
      y: (currentRow + rowDelta) * step,
    },
  };
}
```

Expose the duration multiplier without changing `HeroAutoScrollState` or the existing interpolation API:

```ts
export function getHeroAutoScrollDurationMultiplier(state: HeroAutoScrollState) {
  const horizontalDistance = Math.abs(state.target.x - state.from.x);
  return horizontalDistance >= MIN_LONG_X ? horizontalDistance / MAX_X : 1;
}
```

- [x] **Step 4: Run the focused motion test and verify it passes**

```bash
node --import ./scripts/register-test-hooks.mjs --import tsx --test \
  src/components/pages/home/hero-sphere-gallery-motion.test.ts
```

Expected: all Sphere motion tests PASS, including the unchanged short-distance and easing assertions.

### Task 2: Integrate cadence and scaled duration into the retained renderer

**Files:**
- Modify: `../../recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-webgl.ts`
- Test: `../../recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-lifecycle.test.ts`

- [x] **Step 1: Write a failing retained-renderer sequence test**

Add a lifecycle test that drives five scheduled glides. The random samples select a long glide second, then a long glide third after that:

```ts
test('renderer mixes short glides with long glides every second or third trigger', () => {
  const harness = createRendererHarness([
    0, 0, 1,
    1, 0, 1,
    0, 1,
    0, 1,
    0, 0, 1,
  ]);
  harness.renderer.setSettings(
    createAutoScrollSettings({ duration: 0.1, interval: 1, rowCount: 1 }),
  );
  const completedOffsets: number[] = [];

  for (let index = 0; index < 5; index += 1) {
    harness.fireTimer(harness.onlyActiveTimerId());
    harness.flushFramesUntilIdle(300, 50);
    completedOffsets.push(harness.renderer.getState().autoScrollOffset.x);
  }

  const distances = completedOffsets.map((offset, index) =>
    offset - (completedOffsets[index - 1] ?? 0),
  );
  assert.deepEqual(distances.map((distance) => Number(distance.toFixed(6))), [
    0.1,
    1,
    0.1,
    0.1,
    1,
  ]);
  harness.renderer.dispose();
});
```

Add an integration assertion after starting the second glide: after the base `0.1 s` has elapsed, its full `1.0` turn target must not yet be complete and the next interval timer must not be armed. Then finish frames and assert the timer appears. This verifies the renderer applies the pure duration multiplier instead of merely generating a larger target.

```ts
test('renderer scales long-glide duration before arming the next timer', () => {
  const harness = createRendererHarness([0, 0, 1, 0, 0, 1]);
  harness.renderer.setSettings(
    createAutoScrollSettings({ duration: 0.1, interval: 1, rowCount: 1 }),
  );

  harness.fireTimer(harness.onlyActiveTimerId());
  harness.flushFramesUntilIdle(300, 50);
  assert.equal(Number(harness.renderer.getState().autoScrollOffset.x.toFixed(6)), 0.1);

  harness.fireTimer(harness.onlyActiveTimerId());
  harness.flushFrame(50);
  harness.flushFrame(50);
  const partialLongOffset = harness.renderer.getState().autoScrollOffset.x;
  assert.ok(partialLongOffset > 0.1 && partialLongOffset < 1.1);
  assert.equal(harness.activeTimerIds().length, 0);

  harness.flushFramesUntilIdle(300, 50);
  assert.equal(Number(harness.renderer.getState().autoScrollOffset.x.toFixed(6)), 1.1);
  assert.equal(harness.activeTimerIds().length, 1);
  harness.renderer.dispose();
});
```

Update existing lifecycle fixtures that start an auto-scroll timer so the added cadence sample does not change their intended target:

```ts
// renderer replaces one interval timer...
const harness = createRendererHarness([0, 0, 1, 1]);
// ...
assert.equal(harness.randomCalls, 4);

// settings changes cancel or reset...
const harness = createRendererHarness([0, 0, 1, 1, 0, 0, 1, 1]);

// snapshot capture does not advance...
const harness = createRendererHarness([0, 0, 1, 1]);
```

Their first glides must retain the exact existing short offsets and assertions.

- [x] **Step 2: Run the focused lifecycle test and verify failure**

```bash
node --import ./scripts/register-test-hooks.mjs --import tsx --test \
  src/components/pages/home/hero-sphere-gallery-lifecycle.test.ts
```

Expected: FAIL because the renderer still starts every glide with the default short kind and unscaled duration.

- [x] **Step 3: Wire cadence and duration into actual scheduled glides**

Import the new helpers in `hero-sphere-gallery-webgl.ts`:

```ts
import {
  consumeHeroAutoScrollCadence,
  createHeroAutoScrollCadenceState,
  getHeroAutoScrollDurationMultiplier,
} from './hero-sphere-gallery-motion';
```

Add retained state beside the existing auto-scroll state:

```ts
let autoScroll = createHeroAutoScrollState();
let autoScrollCadence = createHeroAutoScrollCadenceState();
let autoScrollDurationMultiplier = 1;
```

When a valid timer callback is about to start a glide, consume cadence once and pass its kind into target generation:

```ts
const consumedCadence = consumeHeroAutoScrollCadence(
  autoScrollCadence,
  dependencies.random,
);
autoScrollCadence = consumedCadence.state;
autoScroll = beginHeroAutoScrollGlide(
  autoScroll,
  currentRows.length,
  dependencies.random,
  consumedCadence.glideKind,
);
autoScrollDurationMultiplier = getHeroAutoScrollDurationMultiplier(autoScroll);
```

Advance the active glide using the scaled duration:

```ts
autoScroll = advanceHeroAutoScrollGlide(
  autoScroll,
  frameDt,
  sphere.autoScroll.duration * autoScrollDurationMultiplier,
);
```

Reset `autoScrollDurationMultiplier` to `1` after completion and whenever an active glide is cancelled. Reset both multiplier and cadence state when auto-scroll state is fully reset because Sphere mode is disabled or the gallery switches to Rows:

```ts
autoScroll = createHeroAutoScrollState();
autoScrollCadence = createHeroAutoScrollCadenceState();
autoScrollDurationMultiplier = 1;
```

Do not reset cadence for temporary inactivity, reduced motion, context loss, snapshot capture, or authored-pan cancellation. Those paths keep their existing timer semantics and do not select a new glide kind until a valid scheduled callback starts.

- [x] **Step 4: Run focused motion and lifecycle tests**

```bash
node --import ./scripts/register-test-hooks.mjs --import tsx --test \
  src/components/pages/home/hero-sphere-gallery-motion.test.ts \
  src/components/pages/home/hero-sphere-gallery-lifecycle.test.ts
```

Expected: both files PASS. Short glides retain their previous values, the long sequence is `2/3`, and long completion is delayed by the distance multiplier.

### Task 3: Verify and commit the isolated behavior change

**Files:**
- Modify: `2026-08-25-hero-random-long-auto-scroll.md`

- [x] **Step 1: Run the final focused tests**

From `recraft-v4-styles`:

```bash
node --import ./scripts/register-test-hooks.mjs --import tsx --test \
  src/components/pages/home/hero-sphere-gallery-motion.test.ts \
  src/components/pages/home/hero-sphere-gallery-lifecycle.test.ts \
  src/components/pages/home/hero-scene-settings.test.ts
```

Expected: all selected tests PASS. The settings test confirms no Toolcraft or persistence schema change was introduced.

- [x] **Step 2: Validate only the feature diff**

From the repository root:

```bash
git diff --check -- \
  recraft-tools/hero/docs/superpowers/plans/2026-08-25-hero-random-long-auto-scroll.md \
  recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-motion.ts \
  recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-motion.test.ts \
  recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-webgl.ts \
  recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-lifecycle.test.ts
```

Expected: no whitespace errors.

- [x] **Step 3: Mark every completed plan checkbox**

Change each completed `- [ ]` entry in this plan to `- [x]` after its command or implementation step succeeds.

- [x] **Step 4: Commit only the feature files**

```bash
git add \
  recraft-tools/hero/docs/superpowers/plans/2026-08-25-hero-random-long-auto-scroll.md \
  recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-motion.ts \
  recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-motion.test.ts \
  recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-webgl.ts \
  recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-lifecycle.test.ts
git commit -m "feat: add random long Hero auto-scrolls"
```

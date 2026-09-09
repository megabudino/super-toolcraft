# Hero Top-edge Dispersion Symmetry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the hard duplicated strip at the top of the Sphere lens during drag while preserving motion and the accepted bottom and side effects.

**Architecture:** Keep the existing scene -> field -> post pipeline and the current motion math. Prevent vertical top/bottom blur taps outside the vertically rendered scene target from contributing their `CLAMP_TO_EDGE` texel, while leaving side sampling unchanged; top and bottom then share the same validity rule and motion magnitude.

**Tech Stack:** TypeScript, WebGL 1 GLSL, Node test runner, Toolcraft iframe browser verification.

---

## File map

- Modify `recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.test.ts`: focused shader contract for symmetric vertical sample validity.
- Modify `recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.ts`: reject out-of-target vertical taps before accumulation without altering motion offsets.
- Modify `recraft-tools/hero/docs/toolcraft/agent-worklog.md`: record the actual diagnosis and focused verification.

### Task 1: Lock the top-edge failure contract

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.test.ts`
- Test: `recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.test.ts`

- [ ] **Step 1: Add the failing shader contract test**

Add this test next to the existing top/bottom motion tests:

```ts
test('top and bottom ignore vertically out-of-scene taps without changing side motion', () => {
  assert.match(
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    /float verticalSceneValidity\(vec2 samplePoint\)/,
  );
  assert.match(
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    /float sampleValidity = mix\(1\.0, verticalSceneValidity\(point \+ offset\), verticalDominant\);/,
  );
  assert.match(
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    /float auraSampleValidity = mix\(1\.0, verticalSceneValidity\(point \+ auraOffset\), verticalDominant\);/,
  );
  assert.match(
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    /motionVelocity \* spread \* 2\.0/,
  );
  assert.match(
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    /verticalSampleRadius \+ verticalMotionRadius/,
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run from the repository root:

```bash
(cd recraft-v4-styles && pnpm dlx tsx --test src/components/pages/home/hero-dispersion-post-shader.test.ts)
```

Expected: the new test fails because `verticalSceneValidity`, `sampleValidity`, and `auraSampleValidity` do not exist; the existing tests remain green.

- [ ] **Step 3: Commit the red test**

```bash
git add recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.test.ts
git commit -m "test: reproduce hero top edge sampling strip"
```

### Task 2: Reject clamped top and bottom scene taps

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.ts`
- Test: `recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.test.ts`

- [ ] **Step 1: Add one symmetric vertical validity helper**

Add immediately after `sampleScene`:

```glsl
float verticalSceneValidity(vec2 samplePoint) {
  vec2 uv = (samplePoint + uSceneMargin) / max(uSceneSize, vec2(1.0));
  return step(0.0, uv.y) * step(uv.y, 1.0);
}
```

This helper checks only the vertical scene extent. Horizontal sampling continues to use the existing clamped behavior, so the accepted side effect does not change.

- [ ] **Step 2: Gate the main vertical accumulation**

In the main `MAX_SAMPLES` loop, replace the unconditional accumulation with:

```glsl
float validSampleCount = 0.0;
// inside the loop, after offset is selected
float sampleValidity = mix(1.0, verticalSceneValidity(point + offset), verticalDominant);
vec4 texel = sampleScene(point + offset);
vec3 validWeight = weight * sampleValidity;
accumulated += texel.rgb * validWeight;
weightSum += validWeight;
float luminanceWeight = (weight.r + weight.g + weight.b) / 3.0 * sampleValidity;
alpha += texel.a * luminanceWeight;
alphaWeight += luminanceWeight;
validSampleCount += sampleValidity;
```

After the loop, retain the existing normalized color when at least one tap is valid and fall back to the unshifted scene sample otherwise:

```glsl
color = validSampleCount > 0.5
  ? vec4(accumulated / max(weightSum, vec3(1e-5)), alpha / max(alphaWeight, 1e-5))
  : sampleScene(point);
```

- [ ] **Step 3: Gate the vertical Aura accumulation with the same rule**

Inside the `AURA_SAMPLES` loop, use:

```glsl
float auraSampleValidity = mix(
  1.0,
  verticalSceneValidity(point + auraOffset),
  verticalDominant
);
vec4 texel = sampleScene(point + auraOffset);
vec3 validAuraWeight = weight * auraSampleValidity;
auraColor += texel.rgb * validAuraWeight;
auraWeightSum += validAuraWeight;
float luminanceWeight =
  (weight.r + weight.g + weight.b) / 3.0 * auraSampleValidity;
auraAlpha += texel.a * luminanceWeight;
auraAlphaWeight += luminanceWeight;
```

Do not change `motionVelocity`, `verticalMotionRadius`, `sideOffset`, `verticalOffset`, smoothing, or decay.

- [ ] **Step 4: Run the focused shader tests and verify GREEN**

Run from the repository root:

```bash
(cd recraft-v4-styles && pnpm dlx tsx --test src/components/pages/home/hero-dispersion-post-shader.test.ts)
```

Expected: all tests pass, including the new symmetry contract.

- [ ] **Step 5: Format only the two touched source files**

```bash
(cd recraft-v4-styles && pnpm exec oxfmt --write \
  src/components/pages/home/hero-dispersion-post-shader.ts \
  src/components/pages/home/hero-dispersion-post-shader.test.ts)
git diff --check
```

Expected: formatter exits 0 and `git diff --check` prints nothing.

- [ ] **Step 6: Commit the implementation**

```bash
git add \
  recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.ts \
  recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.test.ts
git commit -m "fix: remove hero top edge sampling strip"
```

### Task 3: Verify real drag behavior and record evidence

**Files:**
- Modify: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Restore the supplied fixture through the real Toolcraft import UI**

Open `http://127.0.0.1:3003/`, click `Import Settings`, and choose:

```text
/Users/kusnizza/Downloads/hero-settings (2).json
```

Verify the iframe reports the Sphere WebGL post pipeline and the imported values include `Blur 22`, `Dispersion 120`, `Aura 0.6`, and `Motion boost 0.8`.

- [ ] **Step 2: Capture the active top transition**

Perform one long real pointer drag over the canvas and capture at least four frames while the pointer is still down. Expected:

```text
- the top boundary has a soft blurred/dispersed transition;
- no hard horizontally duplicated strip appears;
- drag distortion remains clearly visible;
- the bottom boundary remains unchanged.
```

- [ ] **Step 3: Check the unchanged side path**

Set `Top and bottom` to `0`, keep `Edge width` at the imported value, and perform the same drag. Expected: the side effect matches its pre-fix behavior because horizontal scene validity is not gated.

Re-import the supplied JSON after this diagnostic step so Toolcraft is left in the user's original state.

- [ ] **Step 4: Update the worklog with only executed evidence**

Append a delivery entry stating:

```markdown
- Root cause: vertical post samples beyond the finite scene target inherited `CLAMP_TO_EDGE`, repeating the target's top texel row during drag.
- Fix: top and bottom share one vertical scene-validity rule; invalid vertical taps contribute zero weight, while motion and side sampling are unchanged.
- Verification: focused shader test result, active-drag frame count, exact imported fixture, and `git diff --check` result.
- Not run: aggregate build, broad browser suite, and measured performance.
```

- [ ] **Step 5: Commit the verified worklog**

```bash
git add recraft-tools/hero/docs/toolcraft/agent-worklog.md
git commit -m "docs: record hero top edge strip fix"
```

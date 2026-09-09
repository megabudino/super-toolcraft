# Fine Details Trail Prompt Focus and Layering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Commit steps require explicit user authorization in this local-first workspace.

**Goal:** Let the Fine Details image trail pass continuously through the prompt area, render above typography but below the prompt, and pause only new spawns while the prompt contains focus.

**Architecture:** Keep focus ownership inside `FineDetailsImageTrail`. Remove rectangle hit-testing from pointer updates, listen to prompt-root `focusin`/`focusout`, and reuse the existing suppression, resume-delay, resume-ramp, and card-lifetime state. Express the visual order with explicit `z-index` utilities.

**Tech Stack:** React 19, TypeScript, Motion, Tailwind CSS, Node test runner.

---

### Task 1: Add a prompt-focus and layer-order contract

**Files:**
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-image-trail-prompt-focus.test.ts`
- Read: `recraft-v4-styles/src/components/pages/home/fine-details-image-trail.tsx`
- Read: `recraft-v4-styles/src/components/pages/home/fine-details-section.tsx`

- [ ] **Step 1: Write the failing source contract**

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const trailSource = readFileSync(new URL('./fine-details-image-trail.tsx', import.meta.url), 'utf8');
const sectionSource = readFileSync(new URL('./fine-details-section.tsx', import.meta.url), 'utf8');

test('trail passes through prompt coordinates and pauses only for prompt focus', () => {
  assert.doesNotMatch(trailSource, /insidePrompt|promptRect/);
  assert.match(trailSource, /addEventListener\('focusin', handlePromptFocusIn\)/);
  assert.match(trailSource, /addEventListener\('focusout', handlePromptFocusOut\)/);
  assert.match(trailSource, /prompt\.contains\(event\.relatedTarget\)/);
});

test('trail is above typography and below the prompt', () => {
  assert.match(trailSource, /className="[^"]*z-\[5\][^"]*"/);
  assert.match(sectionSource, /className="[^"]*z-\[1\][^"]*"[\s\S]{0,250}data-fine-details-upper-left-typography/);
  assert.match(sectionSource, /className="[^"]*z-\[1\][^"]*"[\s\S]{0,250}data-fine-details-lower-right-typography/);
  assert.match(sectionSource, /className="absolute z-10[^\"]*"/);
});
```

- [ ] **Step 2: Run the contract and verify it fails**

Run:

```bash
cd recraft-v4-styles
node --test src/components/pages/home/fine-details-image-trail-prompt-focus.test.ts
```

Expected: FAIL because prompt rectangle variables still exist, focus listeners do not exist, and the trail has no `z-[5]`.

- [ ] **Step 3: Do not commit until the user explicitly requests it**

### Task 2: Replace coordinate suppression with focus suppression

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-image-trail.tsx:130-240`

- [ ] **Step 1: Simplify pointer updates**

Change `updatePointer` to accept only the point, retain raw/smoothed position updates, and set status from the existing focus suppression and resume timestamp:

```ts
const updatePointer = useCallback(
  (point: Point) => {
    const wasActive = pointerActiveRef.current;
    pointerActiveRef.current = true;
    rawX.set(point.x);
    rawY.set(point.y);
    if (!wasActive) {
      smoothX.jump(point.x);
      smoothY.jump(point.y);
    }

    setStatus(
      suppressedRef.current || performance.now() < resumeAtRef.current
        ? 'suppressed'
        : 'active',
    );
  },
  [rawX, rawY, smoothX, smoothY],
);
```

Update both standalone and bridge-pointer callers to remove the section argument.

- [ ] **Step 2: Add prompt focus listeners after the feature-enabled effect**

```ts
useEffect(() => {
  const section = layerRef.current?.closest<HTMLElement>('section');
  const prompt = section?.querySelector<HTMLElement>('[data-fine-details-prompt]');
  if (!prompt) return;

  function handlePromptFocusIn() {
    if (!featureEnabled) return;
    suppressedRef.current = true;
    resumeAtRef.current = Number.POSITIVE_INFINITY;
    lastSpawnPointRef.current = null;
    setStatus('suppressed');
  }

  function handlePromptFocusOut(event: FocusEvent) {
    if (!featureEnabled || (event.relatedTarget instanceof Node && prompt.contains(event.relatedTarget))) {
      return;
    }

    suppressedRef.current = false;
    resumeAtRef.current = performance.now() + settings.resumeDelay;
    lastSpawnPointRef.current = null;
    setStatus(pointerActiveRef.current ? 'suppressed' : 'idle');
  }

  prompt.addEventListener('focusin', handlePromptFocusIn);
  prompt.addEventListener('focusout', handlePromptFocusOut);
  if (featureEnabled && prompt.contains(document.activeElement)) handlePromptFocusIn();

  return () => {
    prompt.removeEventListener('focusin', handlePromptFocusIn);
    prompt.removeEventListener('focusout', handlePromptFocusOut);
  };
}, [featureEnabled, settings.resumeDelay]);
```

Do not call `clearCards`; existing lifetime timers must continue.

- [ ] **Step 3: Put the trail at z-index 5**

```tsx
className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
```

Keep typography at `z-[1]` and prompt at `z-10`.

- [ ] **Step 4: Run the focused tests**

Run:

```bash
node --test \
  src/components/pages/home/fine-details-image-trail-prompt-focus.test.ts \
  src/components/pages/home/fine-details-image-trail-image.test.ts \
  src/components/pages/home/fine-details-image-trail-motion.test.ts
```

Expected: 4 passing tests with no failures.

- [ ] **Step 5: Do not commit until the user explicitly requests it**

### Task 3: Local interaction smoke-check

**Files:**
- Modify only if a defect is found: `recraft-v4-styles/src/components/pages/home/fine-details-image-trail.tsx`

- [ ] **Step 1: Open the running Fine Details Toolcraft preview**

Use `http://127.0.0.1:3006/` with the website iframe at `http://localhost:3000/toolcraft/fine-details`.

- [ ] **Step 2: Verify uninterrupted prompt crossing**

Move the pointer across the prompt without focusing an interactive control. Confirm cards continue spawning and visually pass under the prompt while covering typography.

- [ ] **Step 3: Verify focus behavior**

Focus the prompt textarea, move the pointer, and confirm no new cards spawn while existing cards expire normally. Move focus between prompt controls and confirm spawning remains paused.

- [ ] **Step 4: Verify resume behavior**

Move focus outside the prompt and confirm spawning returns after the configured Resume delay and uses Resume ramp.

- [ ] **Step 5: Report focused results**

Report the source-test result and smoke-check result. Do not run repository-wide build, lint, typecheck, or browser suites.

## Completion

- [x] Removed prompt rectangle hit-testing from both pointer paths.
- [x] Added focus-in suppression without clearing live cards.
- [x] Kept internal prompt focus transfers suppressed and reused resume timing on focus exit.
- [x] Set the explicit typography `1`, trail `5`, prompt `10` layer order.
- [x] Passed four focused tests and the local interaction smoke-check.
- [x] Left the worktree uncommitted for local review.

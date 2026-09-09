# Fine Details Draggable Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let website visitors drag the Fine Details prompt panel and quickly return it to its Toolcraft-authored position with a double-click.

**Architecture:** Keep authored placement in `FineDetailsSection` and introduce one small client component that owns only a transient pixel offset. Pure geometry and target-classification helpers make pointer behavior testable without a browser DOM. Because the Toolcraft iframe is intentionally pointer-transparent, protocol v5 carries the panel's current scene-space rectangle back to Toolcraft and forwards only prompt-owned pointer gestures into the iframe; all other canvas gestures keep their existing ownership.

**Tech Stack:** Next.js 16, React 19, TypeScript, Pointer Events, CSS transforms, Node test through `tsx`, Playwright through the existing Toolcraft harness.

---

### Task 1: Add deterministic drag geometry and lifecycle helpers

**Files:**
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-draggable-prompt.tsx`
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-draggable-prompt.test.ts`

- [x] **Step 1: Write failing helper tests**

Cover primary-pointer admission, interactive descendants, pointer deltas, large-section containment, narrow-section reachability, clamping, and reduced-motion reset duration:

```ts
test('interactive prompt descendants never start panel dragging', () => {
  for (const tagName of ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']) {
    assert.equal(canStartFineDetailsPromptDrag({ tagName }), false);
  }
});

test('a large section keeps the complete panel inside a 16px inset', () => {
  assert.deepEqual(
    getFineDetailsPromptOffsetBounds(
      { bottom: 700, left: 0, right: 1200, top: 0 },
      { height: 180, left: 300, top: 220, width: 640 },
      { x: 0, y: 0 },
    ),
    { maxX: 244, maxY: 284, minX: -284, minY: -204 },
  );
});
```

- [x] **Step 2: Run the focused test and record RED**

Run:

```bash
cd recraft-v4-styles
pnpm dlx tsx --test src/components/pages/home/fine-details-draggable-prompt.test.ts
```

Expected: FAIL because the drag module does not exist.

- [x] **Step 3: Implement the pure helpers and client component**

Export focused helpers and render one wrapper around children:

```tsx
'use client';

export const FINE_DETAILS_PROMPT_RESET_DURATION_MS = 220;

export function canStartFineDetailsPromptDrag(target: PromptDragTarget): boolean {
  return !target.isContentEditable && !interactiveTags.has(target.tagName) &&
    !interactiveRoles.has(target.role ?? '');
}

export function FineDetailsDraggablePrompt({ baseTransform, children, className, style }) {
  // Keep offset/pointer/animation in refs, capture one primary pointer,
  // write CSS variables directly, clamp against the closest Fine Details section,
  // and reset to 0,0 on a qualified double-click.
  return <div data-fine-details-prompt-drag-root>{children}</div>;
}
```

The live wrapper must use `translate3d(var(--fine-details-prompt-drag-x), var(--fine-details-prompt-drag-y), 0)`, set `data-fine-details-prompt-dragging`, honor `prefers-reduced-motion`, and clear pointer/rAF/resize resources during cleanup.

- [x] **Step 4: Run the focused test and record GREEN**

Run the Task 1 command again. Expected: all helper and source-contract tests pass.

### Task 2: Compose transient drag with authored Fine Details placement

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-section.tsx`
- Test: `recraft-v4-styles/src/components/pages/home/fine-details-draggable-prompt.test.ts`

- [x] **Step 1: Add a failing section wiring assertion**

Require the section boundary marker, the new client wrapper, the unchanged `AiPromptInput`, and the exact authored transform passed as `baseTransform`.

- [x] **Step 2: Run the focused website test and record RED**

Expected: the section still owns a plain absolute wrapper.

- [x] **Step 3: Replace only the prompt wrapper**

Keep all existing position/shadow/default-prompt behavior:

```tsx
<section
  aria-label="Fine details"
  className="relative isolate w-full overflow-hidden"
  data-fine-details-section
>
  <FineDetailsDraggablePrompt
    baseTransform={`translate(-50%, ${-promptPositionY}%)`}
    className="absolute z-10 w-[calc(100vw-2rem)] max-w-160"
    style={{
      left: `calc(50% + ${settings.prompt.position.x * 36}vw)`,
      top: `${promptPositionY}%`,
    }}
  >
    <AiPromptInput
      className="w-full"
      defaultPrompt="Create four campaign visuals: a sneaker, camera, chair, and perfume bottle."
      style={createPromptPanelStyle(settings.prompt.shadow)}
    />
  </FineDetailsDraggablePrompt>
</section>
```

- [x] **Step 4: Format only the two website files and rerun the focused test**

Run:

```bash
cd recraft-v4-styles
pnpm exec oxfmt src/components/pages/home/fine-details-draggable-prompt.tsx src/components/pages/home/fine-details-draggable-prompt.test.ts src/components/pages/home/fine-details-section.tsx
pnpm dlx tsx --test src/components/pages/home/fine-details-draggable-prompt.test.ts
```

Expected: PASS without modifying shared `AiPromptInput`.

### Task 3: Register interaction ownership and real iframe acceptance

**Files:**
- Modify: `recraft-tools/fine-details/src/app/app-acceptance-data.ts`
- Create: `recraft-tools/fine-details/src/app/fine-details-prompt-drag.test.ts`
- Create: `recraft-tools/fine-details/e2e/product-fine-details-prompt-drag.spec.ts`

- [x] **Step 1: Write failing ownership and acceptance tests**

Require one canvas-owned `direct-spatial-edit` operation on the existing semantic target `prompt.position`, plus one runtime acceptance row whose stable id is `prompt.runtimeOffset`:

```ts
assert.deepEqual(
  appProductReadiness.interactionOwnership.find(
    (entry) => entry.id === 'canvas-fine-details-prompt-runtime-offset',
  ),
  assert.match.object({
    capability: 'direct-spatial-edit',
    surface: 'canvas',
    target: 'prompt.position',
  }),
);
```

The persistent Toolcraft vector remains the sole owner of `prompt.position`; visitor drag is explicitly transient and therefore not a mirrored state edit.

- [x] **Step 2: Run the focused Toolcraft test and record RED**

Run:

```bash
cd recraft-tools/fine-details
pnpm exec vitest run src/app/fine-details-prompt-drag.test.ts
```

Expected: FAIL because ownership and runtime acceptance are absent.

- [x] **Step 3: Add ownership and runtime acceptance data**

Add `interactionId: "canvas-fine-details-prompt-runtime-offset"`, `kind: "runtime"`, `componentType: "canvas"`, semantic target `prompt.position`, and a browser title dedicated to drag-and-reset behavior. The transient offset never writes that setting.

- [x] **Step 4: Add the focused real-iframe Playwright case**

The browser test must:

1. reset the Toolcraft workspace and wait for the website iframe;
2. edit the prompt textarea and retain its value;
3. drag from a non-interactive panel edge by a known delta;
4. assert the prompt rectangle changed and remains inside the section;
5. attach product-observable evidence for the runtime acceptance id while targeting `prompt.position` semantically;
6. double-click the same non-interactive surface;
7. poll until the prompt rectangle returns within one pixel of its authored rectangle;
8. assert the textarea still contains the edited value.

- [x] **Step 5: Run only the focused Toolcraft unit and browser cases**

Run:

```bash
pnpm exec vitest run src/app/fine-details-prompt-drag.test.ts
pnpm exec playwright test e2e/product-fine-details-prompt-drag.spec.ts --reporter=list
```

Expected: both focused checks pass. Do not run aggregate delivery or measured performance.

### Task 3.5: Preserve the pointer-transparent iframe through a selective gesture bridge

**Files:**
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-protocol.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.tsx`
- Create: `recraft-tools/fine-details/src/app/fine-details-prompt-bridge.test.ts`
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-prompt-drag-bridge.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-preview-boundary.tsx`

- [x] **Step 1: Reproduce the real iframe failure**

The first focused Playwright run failed with an unchanged `0.00:0.00` offset. Source inspection confirmed `.frame { pointer-events: none; }`, an intentional constraint that preserves Toolcraft canvas panning and the RAF-coalesced image-trail pointer bridge.

- [x] **Step 2: Add a failing protocol/scene-geometry contract**

Require protocol v5, a website-to-Toolcraft prompt rectangle, Toolcraft-to-website prompt gestures, finite ordered bounds, and scene mapping from rendered DOM geometry.

- [x] **Step 3: Implement selective gesture ownership**

The website publishes the current prompt rectangle in the 1920×section-height scene. Toolcraft starts capture only when pointer-down hits that rectangle, stops propagation to CanvasShell for the active gesture, and forwards down/move/up/cancel/double-click messages. Outside the rectangle, iframe pointer transparency, canvas pan/zoom, and trail hover remain unchanged.

- [x] **Step 4: Isolate and rerun the browser proof**

Disable the autonomous image trail through its real Toolcraft switch before capturing the stable baseline. The exact drag/reset browser case then passes through the real iframe bridge.

### Task 4: Record the later feature and audit the final diff

**Files:**
- Modify: `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`
- Modify: `recraft-tools/fine-details/docs/superpowers/plans/2026-08-24-fine-details-draggable-prompt.md`

- [x] **Step 1: Add a truthful Decision Trail entry**

Record the request, transient-versus-authored ownership split, Pointer Events decision, rejected native drag/Motion dependency, reduced-motion behavior, exact focused checks, and that measured performance was not run.

- [x] **Step 2: Mark only completed plan steps**

Leave any unexecuted browser or manual check unchecked and state why.

- [x] **Step 3: Run final narrow hygiene checks**

Run:

```bash
git diff --check
git status --short
```

Review the complete prompt-drag diff and confirm unrelated Fine Details image-trail and Hero CTA work remains untouched. Do not commit until the user explicitly requests it.

### Task 5: Exclude the textarea while retaining padding and lower-row dragging

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-draggable-prompt.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-draggable-prompt.test.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-prompt-drag-bridge.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-preview-boundary.tsx`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-protocol.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.tsx`
- Modify: `recraft-tools/fine-details/src/app/fine-details-prompt-bridge.test.ts`
- Modify: `recraft-tools/fine-details/e2e/product-fine-details-prompt-drag.spec.ts`

- [x] **Step 1: Write failing prompt-minus-textarea hit tests**

Require a point in panel padding and a point in the lower row to pass, while a point inside the textarea scene rectangle is rejected:

```ts
expect(
  isPointInsideFineDetailsPromptDragRegion(
    { x: 500, y: 350 },
    { bottom: 600, left: 400, right: 1200, top: 300 },
    { bottom: 430, left: 440, right: 1160, top: 330 },
  ),
).toBe(false);
```

- [x] **Step 2: Run focused tests and record RED**

Run the existing website prompt test and Toolcraft bridge test. Expected: FAIL because protocol geometry has no textarea exclusion and parent hit testing accepts the complete prompt rectangle.

- [x] **Step 3: Publish and validate the textarea exclusion rectangle**

Extend prompt geometry payload to `{ rect, textareaRect }`. Measure the actual descendant `textarea` and map its bounds through the same 1920×section-height transform as the prompt. Preserve `null` for teardown and reject unordered/non-finite geometry.

- [x] **Step 4: Apply prompt-minus-textarea hit testing**

Toolcraft may capture only when the scene point is inside `rect` and outside `textareaRect`. Native website dragging continues using the existing interactive descendant selector, so textarea interaction remains unchanged while surrounding padding and non-interactive lower-row space remain draggable.

- [x] **Step 5: Strengthen the real iframe browser proof**

First drag from the textarea center and assert the offset remains zero. Then drag from the lower-row/padding surface and retain the existing movement, bounds, text preservation, and double-click reset assertions.

- [x] **Step 6: Run only focused unit/browser checks and diff hygiene**

Run the two focused unit files, the exact Playwright prompt case, focused website lint/type evidence, and `git diff --check`. Do not run broad build, aggregate browser, or measured performance.

### Task 6: Exclude every interactive descendant from prompt dragging

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-draggable-prompt.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-draggable-prompt.test.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-prompt-drag-bridge.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-preview-boundary.tsx`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-protocol.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.tsx`
- Modify: `recraft-tools/fine-details/src/app/fine-details-prompt-bridge.test.ts`
- Modify: `recraft-tools/fine-details/e2e/product-fine-details-prompt-drag.spec.ts`
- Modify: `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`

- [x] **Step 1: Replace the textarea-only RED with multiple interactive rectangles**

Require textarea and button points to be rejected while padding, a gap, and free lower-row space remain accepted:

```ts
const interactiveRects = [
  { bottom: 430, left: 440, right: 1160, top: 330 },
  { bottom: 550, left: 1040, right: 1150, top: 470 },
];

expect(isPointInsideFineDetailsPromptDragRegion({ x: 500, y: 350 }, rect, interactiveRects)).toBe(false);
expect(isPointInsideFineDetailsPromptDragRegion({ x: 1080, y: 500 }, rect, interactiveRects)).toBe(false);
expect(isPointInsideFineDetailsPromptDragRegion({ x: 420, y: 350 }, rect, interactiveRects)).toBe(true);
expect(isPointInsideFineDetailsPromptDragRegion({ x: 800, y: 520 }, rect, interactiveRects)).toBe(true);
```

- [x] **Step 2: Run the two focused tests and record RED**

Run:

```bash
cd recraft-v4-styles && pnpm dlx tsx --test src/components/pages/home/fine-details-draggable-prompt.test.ts
cd ../recraft-tools/fine-details && pnpm exec vitest run src/app/fine-details-prompt-bridge.test.ts
```

Expected: FAIL because the geometry publisher and v5 validator still expose only `textareaRect`.

- [x] **Step 3: Publish actual interactive descendant rectangles**

Use the same semantic selector for native hit testing and iframe geometry. Add focusable/clickable coverage and map every visible descendant through the existing scene transform:

```ts
const interactiveElements = root.querySelectorAll<HTMLElement>(interactivePromptSelector);
const interactiveRects = Array.from(interactiveElements)
  .map((element) => element.getBoundingClientRect())
  .filter((rect) => rect.width > 0 && rect.height > 0)
  .map((rect) => getFineDetailsPromptSceneRect(sectionRect, rect, sceneHeight));

setFineDetailsPromptBridgeGeometry({ rect, interactiveRects });
```

Observe the root, section, and every current interactive descendant with `ResizeObserver`. Teardown publishes `{ rect: null, interactiveRects: [] }`.

- [x] **Step 4: Validate and consume the complete exclusion array**

Change protocol geometry to:

```ts
type FineDetailsPromptSceneGeometry = Readonly<{
  rect: FineDetailsPromptSceneRect | null;
  interactiveRects: readonly FineDetailsPromptSceneRect[];
}>;
```

Reject non-arrays, malformed rectangles, and interactive rectangles outside the prompt. Parent pointer-down and double-click use:

```ts
insidePrompt && !interactiveRects.some((interactiveRect) => inside(point, interactiveRect));
```

- [x] **Step 5: Prove every current clickable surface remains stationary**

In the exact real-iframe Playwright case, enumerate visible `textarea`, `input`, `button`, `a[href]`, `select`, interactive roles, and non-negative tabindex descendants. Attempt a short drag from each center and assert `data-fine-details-prompt-offset="0.00:0.00"` after every attempt. Then retain the working padding drag, bounds, text preservation, and animated reset proof.

- [x] **Step 6: Run focused checks and document the result**

Run only the two focused unit groups, exact prompt Playwright case, focused website oxfmt/oxlint, and `git diff --check`. Update the Fine Details worklog with the actual RED/GREEN counts and explicit broad-check exclusions. Do not commit until the user requests it.

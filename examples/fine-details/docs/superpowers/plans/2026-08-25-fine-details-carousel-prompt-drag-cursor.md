# Fine Details Carousel-only Prompt Drag Cursor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task with spec and quality review.

**Goal:** Keep the Fine Details prompt draggable only while Images mode is `Carousel`, show the correct `grab`/`grabbing` affordance on non-interactive prompt chrome, and make `Trail` mode immediately restore and keep the prompt at its authored position.

**Architecture:** `FineDetailsSection` remains the source of mode truth and passes one explicit `dragEnabled` capability into the existing transient prompt wrapper. In Toolcraft, Carousel keeps the iframe pointer-interactive and therefore uses the same native website drag path; Trail makes the iframe pointer-transparent and returns pointer ownership to the preview wrapper. The wrapper and defensive bridge both gate gestures, publish an empty hit region when disabled, cancel in-flight capture on a mode change, and clear only the transient offset. A locally scoped CSS module owns native cursor affordances and restores the cursor on every interactive descendant. Toolcraft keeps the same protocol and transient-position ownership; the existing acceptance row proves both mode branches through the real UI.

**Tech Stack:** Next.js 16, React, TypeScript, CSS Modules, Node test/tsx, Toolcraft product acceptance, Playwright.

**Delivery boundary:** This is a later ordinary feature edit. Run only the focused website test and `prompt.runtimeOffset` browser feature. Do not run aggregate delivery, build, or measured performance checks. Do not commit or push product changes unless the user explicitly asks.

---

## Task 1: Model the mode gate and cursor contract on the website

**Files:**

- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-draggable-prompt.test.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-draggable-prompt.tsx`
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-draggable-prompt.module.css`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-section.tsx`

### Step 1: Write the failing focused contract

Extend `fine-details-draggable-prompt.test.ts` so it proves:

```ts
assert.equal(
  canStartFineDetailsPromptDrag({ dragDisabled: true, tagName: 'DIV' }),
  false,
);
assert.match(sectionSource, /dragEnabled=\{settings\.imagesMode === 'carousel'\}/u);
assert.match(source, /data-fine-details-prompt-drag-enabled/u);
assert.match(source, /setFineDetailsPromptBridgeGeometry\(\{ interactiveRects: \[\], rect: null \}\)/u);
assert.match(cssSource, /cursor:\s*grab/u);
assert.match(cssSource, /cursor:\s*grabbing/u);
```

Run from `recraft-v4-styles`:

```bash
pnpm dlx tsx --test src/components/pages/home/fine-details-draggable-prompt.test.ts
```

Expected: FAIL because the section does not pass the mode capability, the wrapper does not expose/gate it, and the CSS module does not exist.

### Step 2: Add one explicit `dragEnabled` capability

Update the component signature:

```tsx
export function FineDetailsDraggablePrompt({
  baseTransform,
  children,
  className,
  dragEnabled,
  style,
}: {
  baseTransform: string;
  children: ReactNode;
  className?: string;
  dragEnabled: boolean;
  style?: CSSProperties;
}) {
```

Pass it from the section:

```tsx
<FineDetailsDraggablePrompt
  baseTransform={`translate(-50%, ${-promptPositionY}%)`}
  dragEnabled={settings.imagesMode === 'carousel'}
  ...
>
```

Do not infer the mode inside the prompt wrapper and do not add a persisted setting.

### Step 3: Gate every gesture source and bridge hit region

Keep a fresh `dragEnabledRef` for the long-lived bridge subscription. Apply the same gate to native pointer-down, pointer-move, double-click, bridge down/move/up/cancel, resize publishing, and transition-end publishing.

When disabled:

```ts
setFineDetailsPromptBridgeGeometry({ interactiveRects: [], rect: null });
```

On a `true -> false` mode change:

- cancel the active native or bridge gesture;
- release pointer capture when present;
- set `data-fine-details-prompt-dragging="false"`;
- clear transition and restore transient offset to `{ x: 0, y: 0 }` immediately;
- publish an empty bridge region so Toolcraft pointer input falls through to Trail behavior;
- preserve authored `prompt.position`, form content, schema state, Apply state, and history.

On a `false -> true` change, publish current prompt/interactivity geometry without changing authored placement.

Expose the branch for acceptance:

```tsx
data-fine-details-prompt-drag-enabled={dragEnabled ? 'true' : 'false'}
```

Use `touchAction: dragEnabled ? 'none' : undefined` so Trail does not retain a drag-only touch policy.

### Step 4: Add locally scoped cursor affordances

Create `fine-details-draggable-prompt.module.css`:

```css
.root[data-fine-details-prompt-drag-enabled='true'] {
  cursor: grab;
}

.root[data-fine-details-prompt-drag-enabled='true'][data-fine-details-prompt-dragging='true'] {
  cursor: grabbing;
}
```

In the same module, mirror the existing interactive selector for anchors, buttons, inputs, labels, selects, textareas, semantic interactive roles, focusable descendants, and `[data-fine-details-prompt-no-drag]`, restoring their own cursor with `cursor: revert`. In Trail, the root must not show `grab` or `grabbing`.

Compose the CSS-module root with the caller class without changing layout:

```tsx
className={[styles.root, className].filter(Boolean).join(' ')}
```

### Step 5: Run the focused website test

```bash
pnpm dlx tsx --test src/components/pages/home/fine-details-draggable-prompt.test.ts
```

Expected: PASS.

---

## Task 2: Strengthen Toolcraft acceptance for both image modes

**Files:**

- Modify: `recraft-tools/fine-details/src/app/app-acceptance-data.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.tsx`
- Modify: `recraft-tools/fine-details/src/app/fine-details-prompt-bridge.test.ts`
- Modify: `recraft-tools/fine-details/e2e/product-fine-details-prompt-drag.spec.ts`

### Step 1: Write the failing mode-specific browser expectations

In the existing `prompt.runtimeOffset` scenario, switch Images mode through the real `images.mode` Toolcraft control. Add expectations that fail against the old implementation:

- Carousel exposes `data-fine-details-prompt-drag-enabled="true"`;
- the actual top-level hit target in Carousel is the pointer-interactive iframe;
- non-interactive prompt chrome has computed `cursor: grab`;
- pointer-down on that chrome produces `data-fine-details-prompt-dragging="true"` and computed `cursor: grabbing`;
- interactive descendants neither move the prompt nor inherit a drag cursor;
- dragging moves the complete prompt and double-click resets it;
- switching to Trail restores offset `0.00:0.00`;
- Trail exposes `data-fine-details-prompt-drag-enabled="false"`;
- the actual top-level hit target in Trail is the outer preview wrapper;
- the same outer-chrome drag and double-click cannot move/reset-start the prompt;
- the prompt value remains intact across both branches.

Use the existing `fineDetailsCarouselTargets.imagesMode` target and the real visible `Carousel` / `Trail` buttons. Do not mutate preview settings directly.

### Step 2: Update the acceptance row without changing ownership

Keep id `prompt.runtimeOffset`, interaction id, and transient `prompt.position` ownership. Update the human-readable contract to state:

```ts
expectedObservable:
  "In Carousel, non-interactive prompt chrome shows grab/grabbing, moves the complete panel within the section, and double-click resets it; in Trail, the prompt returns to its authored position and cannot be dragged without changing form content.",
userAction:
  "Select Carousel, drag and reset the prompt from non-interactive chrome, then select Trail and repeat the same gesture.",
```

No protocol version, schema control, pipeline, persistence, Apply payload, renderer strategy, or performance path changes are required.

Keep the Toolcraft host mode authoritative even for the retained bridge: Trail clears active host
capture and cursor state synchronously, rejects late non-null geometry, and reads current scene
height/mode through fresh refs so Canvas-height changes cannot churn the long-lived message
subscription or lose Apply readiness. Animated website reset withdraws bridge geometry until its
final transform is published.

### Step 3: Run focused Toolcraft source tests

Run the narrow product tests that validate the edited acceptance catalog and bridge behavior:

```bash
pnpm exec vitest run src/app/fine-details-preview.product.test.ts src/app/fine-details-prompt-bridge.test.ts
```

Expected: PASS.

---

## Task 3: Prove the website/iframe behavior and record the decision

**Files:**

- Modify: `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`
- Verify: `recraft-tools/fine-details/e2e/product-fine-details-prompt-drag.spec.ts`

### Step 1: Run the one affected feature acceptance

From `recraft-tools/fine-details`:

```bash
pnpm test:feature -- prompt.runtimeOffset
```

Expected: PASS for the real Toolcraft UI -> pointer-interactive Carousel iframe -> native website
prompt flow, plus Trail pointer fallthrough and defensive bridge cleanup.

If the test fails, fix the product or test fixture; do not weaken the semantic assertions, bypass the UI, or replace the product result with a data-attribute-only claim.

### Step 2: Append an exact Decision Trail entry

Append `## Decision Trail: carousel-only prompt drag affordance` to `agent-worklog.md` in the established format. Record:

- exact request evidence: `сделай на промпт блок на область за которую можно делать драг, курсор драга, только в стейте Карусель.` and `давай в трэид драг отключим`;
- Carousel owns transient visitor drag plus `grab/grabbing` affordance;
- Trail publishes no bridge hit region and immediately clears transient offset;
- interactive form elements remain normal controls in both modes;
- authored position, protocol, schema, Apply, persistence, history, renderer, and visuals are unchanged;
- exact executed focused checks and the explicit fact that aggregate/build/performance checks were not run.

### Step 3: Final focused checks

```bash
# recraft-v4-styles
pnpm dlx tsx --test src/components/pages/home/fine-details-draggable-prompt.test.ts
pnpm exec oxfmt --check src/components/pages/home/fine-details-draggable-prompt.tsx src/components/pages/home/fine-details-draggable-prompt.test.ts src/components/pages/home/fine-details-draggable-prompt.module.css src/components/pages/home/fine-details-section.tsx

# recraft-tools/fine-details
pnpm exec vitest run src/app/fine-details-preview.product.test.ts src/app/fine-details-prompt-bridge.test.ts
pnpm test:feature -- prompt.runtimeOffset
pnpm typecheck
pnpm docs:check

# repository root
git diff --check
```

Expected: focused checks PASS. Report any pre-existing unrelated failures separately and do not edit unrelated Hero, Fine Details defaults/assets, carousel-height work, or sustained-motion performance changes.

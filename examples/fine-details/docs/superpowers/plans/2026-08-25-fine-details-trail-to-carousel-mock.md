# Fine Details Trail-to-Carousel Mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to execute this plan task-by-task when delegation is explicitly authorized. In this session, execute inline because the user did not request subagents.

**Goal:** Make the standalone website Fine Details section start in Trail and switch the same persistent section to Carousel after a valid prompt submission, while leaving Toolcraft mode selection manual.

**Architecture:** Keep `FineDetailsPreviewBoundary` as the live settings bridge and add a website-only wrapper that owns the transient `trail | carousel` mock state. `FineDetailsSection` accepts an optional submit callback and optional image-layer transition flag; only the active image renderer crossfades, while typography, grid, and prompt stay mounted. Remove the obsolete prompt output-mode control and data model.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Motion for React, Node test runner through `vite-node`, oxfmt.

---

### Task 1: Add focused failing contracts

**Files:**
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-homepage-mock.test.ts`
- Create: `recraft-v4-styles/src/components/ai-prompt-input-simplification.test.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-draggable-prompt.test.ts`

**Step 1: Write the failing homepage mock contract**

Read the homepage, Toolcraft route, boundary, section, and new wrapper/transition sources. Assert that:

- the homepage enables the website mock path;
- the Toolcraft route uses the default boundary path;
- the website wrapper starts in `trail`, changes to `carousel` on submit, and passes transition mode;
- the transition uses `AnimatePresence`, a mode key, reduced-motion handling, and renders only Trail or Carousel inside the animated image layer;
- the prompt callback reaches `AiPromptInput` and prompt dragging is tied to the active mode.

**Step 2: Write the failing prompt simplification contract**

Assert that `AiPromptInput` no longer imports or renders `OutputModeSelect`, no longer owns `outputMode`, and submits only `presetId`, `prompt`, and `styleReferences`. Assert that the obsolete output-mode data/type/component is absent from the controls source while Style Preset remains.

**Step 3: Run the focused tests to verify RED**

Run from `recraft-v4-styles`:

```bash
node ../recraft-tools/fine-details/node_modules/.pnpm/vite-node@3.2.4_@types+node@22.19.19_jiti@2.7.0_lightningcss@1.33.0/node_modules/vite-node/vite-node.mjs src/components/pages/home/fine-details-homepage-mock.test.ts
node ../recraft-tools/fine-details/node_modules/.pnpm/vite-node@3.2.4_@types+node@22.19.19_jiti@2.7.0_lightningcss@1.33.0/node_modules/vite-node/vite-node.mjs src/components/ai-prompt-input-simplification.test.ts
```

Expected: FAIL because the mock wrapper/transition do not exist and the Exact control is still present.

### Task 2: Implement the website-only state transition

**Files:**
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-homepage-mock.tsx`
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-image-state-transition.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-preview-boundary.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-section.tsx`
- Modify: `recraft-v4-styles/src/app/(website)/page.tsx`

**Step 1: Add the website mock wrapper**

Create a client component with `useState<'trail' | 'carousel'>('trail')`. Merge only `imagesMode` into the live settings, pass the effective settings to `FineDetailsSection`, enable the image transition, and change state to `carousel` from the prompt-submit callback. Repeated submissions remain idempotent through `setMode('carousel')`.

**Step 2: Add the focused image-layer crossfade**

Use `AnimatePresence` with overlapping keyed layers. Fade Trail out in about 250ms and Carousel in in about 350ms. Use `useReducedMotion` to make both durations zero. Keep the animated wrapper absolute and at the existing image-layer z-index so typography and prompt are not remounted or animated.

**Step 3: Wire the section and routes**

Add optional `onPromptSubmit` and `transitionImages` props to `FineDetailsSection`. Pass the callback to `AiPromptInput`; keep `dragEnabled={settings.imagesMode === 'carousel'}`. Let `FineDetailsPreviewBoundary` opt into the homepage mock through a boolean prop. Pass that prop only on the website homepage; keep `/toolcraft/fine-details` unchanged.

**Step 4: Run the focused mock contract**

```bash
node ../recraft-tools/fine-details/node_modules/.pnpm/vite-node@3.2.4_@types+node@22.19.19_jiti@2.7.0_lightningcss@1.33.0/node_modules/vite-node/vite-node.mjs src/components/pages/home/fine-details-homepage-mock.test.ts
node ../recraft-tools/fine-details/node_modules/.pnpm/vite-node@3.2.4_@types+node@22.19.19_jiti@2.7.0_lightningcss@1.33.0/node_modules/vite-node/vite-node.mjs src/components/pages/home/fine-details-draggable-prompt.test.ts
```

Expected: PASS.

### Task 3: Remove Exact and the obsolete output-mode model

**Files:**
- Modify: `recraft-v4-styles/src/components/ai-prompt-input.tsx`
- Modify: `recraft-v4-styles/src/components/ai-prompt-input-controls.tsx`

**Step 1: Simplify the submission type and handler**

Delete `AiPromptOutputMode`, `outputMode` state, its export, and the `outputMode` submission property. Preserve preset, prompt, style-reference, status, file lifecycle, and keyboard-submit behavior.

**Step 2: Remove the prompt control**

Delete the divider immediately before Exact and delete `OutputModeSelect`. Remove its data/type/component from the controls file while preserving the shared Style Preset select implementation.

**Step 3: Run the focused prompt contract**

```bash
node ../recraft-tools/fine-details/node_modules/.pnpm/vite-node@3.2.4_@types+node@22.19.19_jiti@2.7.0_lightningcss@1.33.0/node_modules/vite-node/vite-node.mjs src/components/ai-prompt-input-simplification.test.ts
```

Expected: PASS.

### Task 4: Focused regression checks and handoff

**Files:**
- Modify: `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`

**Step 1: Run only related existing contracts**

```bash
node ../recraft-tools/fine-details/node_modules/.pnpm/vite-node@3.2.4_@types+node@22.19.19_jiti@2.7.0_lightningcss@1.33.0/node_modules/vite-node/vite-node.mjs \
  src/components/pages/home/fine-details-homepage-mock.test.ts \
  src/components/ai-prompt-input-simplification.test.ts \
  src/components/pages/home/fine-details-draggable-prompt.test.ts \
  src/components/pages/home/fine-details-image-trail-motion.test.ts \
  src/components/pages/home/fine-details-carousel.test.ts
```

Expected: PASS. Do not run the full build or broad browser suite.

**Step 2: Format only touched files**

```bash
pnpm exec oxfmt --write \
  'src/app/(website)/page.tsx' \
  src/components/ai-prompt-input.tsx \
  src/components/ai-prompt-input-controls.tsx \
  src/components/ai-prompt-input-simplification.test.ts \
  src/components/pages/home/fine-details-preview-boundary.tsx \
  src/components/pages/home/fine-details-section.tsx \
  src/components/pages/home/fine-details-homepage-mock.tsx \
  src/components/pages/home/fine-details-homepage-mock.test.ts \
  src/components/pages/home/fine-details-image-state-transition.tsx
```

**Step 3: Record the implementation and inspect the patch**

Append the mode ownership, transition durations, Toolcraft isolation, prompt simplification, and focused test results to the Fine Details worklog. Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors. Do not commit or push; hand the local implementation to the user for testing.

# Prompt Position Pad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Toolcraft Vector pad that moves only the AI prompt popup across the embedded Recraft hero preview.

**Architecture:** Keep `prompt.position` as canonical normalized `{ x, y }` state in the Toolcraft schema, synchronize it through the existing iframe `postMessage` bridge, and let the Next.js website validate and render the responsive transform. The panel owns the interaction; the iframe remains pointer-transparent and Toolcraft canvas pan/zoom remains unchanged.

**Tech Stack:** TypeScript, React 19, Toolcraft schema/runtime, Vitest, Next.js 16, CSS Modules, pnpm.

---

### Task 1: Define the prompt position value and failing product mapping case

**Files:**

- Create: `src/app/hero-prompt-values.ts`
- Modify: `src/app/hero-preview.product.test.ts`

- [ ] **Step 1: Add the failing product mapping case**

Import `heroPromptTargets` and add this `PreviewCase` beside the heading cases:

```ts
{
  acceptanceId: heroPromptTargets.position,
  read: (settings) => settings.prompt.position,
  target: heroPromptTargets.position,
  value: { x: -0.45, y: 0.6 },
},
```

The test should also expect `prompt.position` to belong to `HERO_PREVIEW_CONTROL_DRAG_TARGETS`, using the existing generic assertions in the file.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm exec vitest run src/app/hero-preview.product.test.ts`

Expected: FAIL because `hero-prompt-values.ts` and `settings.prompt.position` do not exist yet.

- [ ] **Step 3: Add the stable prompt target/default module**

Create `src/app/hero-prompt-values.ts`:

```ts
export const heroPromptTargets = {
  position: "prompt.position",
} as const;

export type HeroPromptSettings = Readonly<{
  position: Readonly<{
    x: number;
    y: number;
  }>;
}>;

export const HERO_PROMPT_DEFAULTS: HeroPromptSettings = {
  position: { x: 0, y: 0 },
};
```

- [ ] **Step 4: Leave the test red until schema and protocol support are added**

Run: `npm exec vitest run src/app/hero-preview.product.test.ts`

Expected: FAIL on missing `settings.prompt`, proving the test reaches the intended mapping boundary.

### Task 2: Add the built-in Vector pad to the Toolcraft schema

**Files:**

- Modify: `src/app/app-schema.ts`

- [ ] **Step 1: Import prompt targets/defaults**

```ts
import {
  HERO_PROMPT_DEFAULTS,
  heroPromptTargets,
} from "./hero-prompt-values";
```

- [ ] **Step 2: Add a dedicated Prompt section after Hero Heading**

```ts
{
  controls: {
    position: {
      applicability: { mode: "always" },
      coordinateMode: "screen",
      defaultValue: HERO_PROMPT_DEFAULTS.position,
      description:
        "Moves only the AI prompt popup across the hero canvas while the heading stays in place.",
      label: "Position",
      performanceReason:
        "Two-axis prompt placement must remain live throughout pad gestures.",
      performanceRole: "responsiveness",
      target: heroPromptTargets.position,
      type: "vector",
    },
  },
  id: "prompt",
  title: "Prompt",
},
```

- [ ] **Step 3: Run schema/type validation**

Run: `npm run typecheck`

Expected: FAIL only where the preview protocol and acceptance inventory do not yet know `prompt.position`; the Vector declaration itself must typecheck.

### Task 3: Extend the Toolcraft preview protocol and renderer invalidation

**Files:**

- Modify: `src/app/hero-preview-protocol.ts`
- Modify: `src/app/hero-preview-pipeline.ts`

- [ ] **Step 1: Extend the typed payload and bump the protocol**

Import `HERO_PROMPT_DEFAULTS`, `heroPromptTargets`, and `HeroPromptSettings`. Change the protocol constant to `6`, add `prompt: HeroPromptSettings` to `HeroPreviewSettings`, and add this default:

```ts
prompt: HERO_PROMPT_DEFAULTS,
```

- [ ] **Step 2: Map canonical runtime state into the prompt payload**

Inside `createHeroPreviewSettingsFromValues`, read the Vector with the existing bounded `vectorValue` helper and return:

```ts
prompt: {
  position: vectorValue(
    values[heroPromptTargets.position],
    HERO_PROMPT_DEFAULTS.position,
  ),
},
```

- [ ] **Step 3: Add prompt position to live drag invalidation**

Import `heroPromptTargets` in `hero-preview-pipeline.ts` and add:

```ts
heroPromptTargets.position,
```

to `HERO_PREVIEW_CONTROL_DRAG_TARGETS`. Do not add a pass or workload dimension; the existing `preview-sync` pass owns the retained DOM placement update.

- [ ] **Step 4: Run the focused mapping test**

Run: `npm exec vitest run src/app/hero-preview.product.test.ts`

Expected: the new mapping assertion still fails only because its acceptance row is not present; all payload and invalidation assertions pass.

### Task 4: Validate and render prompt placement in the Next.js website

**Files:**

- Modify: `../recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `../recraft-v4-styles/src/components/pages/home/hero-preview-boundary.tsx`
- Modify: `../recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Modify: `../recraft-v4-styles/src/components/pages/home/hero-v4-styles.module.css`

- [ ] **Step 1: Extend the website scene model**

Add:

```ts
export interface HeroPromptSettings {
  position: {
    x: number;
    y: number;
  };
}
```

Add `prompt: HeroPromptSettings` to `HeroSceneSettings`, default it to `{ position: { x: 0, y: 0 } }`, and add `promptPosition: [-1, 1]` to `numericBounds`.

- [ ] **Step 2: Clamp untrusted prompt payload values**

In `normalizeHeroSceneSettings`, narrow `input.prompt` and `prompt.position` exactly as the heading is narrowed, then return:

```ts
prompt: {
  position: {
    x: clampNumber(
      promptPosition.x,
      numericBounds.promptPosition,
      defaultHeroSceneSettings.prompt.position.x,
    ),
    y: clampNumber(
      promptPosition.y,
      numericBounds.promptPosition,
      defaultHeroSceneSettings.prompt.position.y,
    ),
  },
},
```

- [ ] **Step 3: Accept protocol version 6**

Change `previewProtocolVersion` in `hero-preview-boundary.tsx` from `5` to `6`. The existing trusted-origin, source, shape, and normalization checks remain unchanged.

- [ ] **Step 4: Add prompt-only CSS variables and transform**

In `hero-v4-styles.tsx`, define:

```ts
type HeroPromptStyle = CSSProperties & {
  '--hero-prompt-offset-x': string;
  '--hero-prompt-offset-y': string;
};

function createHeroPromptStyle(settings: HeroSceneSettings): HeroPromptStyle {
  return {
    '--hero-prompt-offset-x': `${settings.prompt.position.x * 36}vw`,
    '--hero-prompt-offset-y': `${settings.prompt.position.y * 28}vh`,
  };
}
```

Apply `styles.prompt` and `style={createHeroPromptStyle(settings)}` to `AiPromptInput`, and add `data-hero-prompt` for focused browser geometry checks.

In `hero-v4-styles.module.css`, add:

```css
.prompt {
  transform: translate3d(
    var(--hero-prompt-offset-x),
    var(--hero-prompt-offset-y),
    0
  );
  will-change: transform;
}
```

Do not move the heading wrapper or change the prompt's width, margin, or stacking classes.

- [ ] **Step 5: Format and typecheck the website files**

Run:

```bash
pnpm exec oxfmt src/components/pages/home/hero-scene-settings.ts src/components/pages/home/hero-preview-boundary.tsx src/components/pages/home/hero-v4-styles.tsx src/components/pages/home/hero-v4-styles.module.css
pnpm typecheck
```

Expected: both commands PASS.

### Task 5: Align Toolcraft acceptance, section inventory, and readiness

**Files:**

- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/hero-preview.product.test.ts`

- [ ] **Step 1: Add prompt position to panel ownership**

Import `heroPromptTargets`, include `...Object.values(heroPromptTargets)` in the existing panel-owned target list, and update `productSummary` / `requestedBehavior` so they explicitly mention prompt placement.

- [ ] **Step 2: Add Vector acceptance with both semantic parts**

Insert:

```ts
{
  ...controlAcceptance({
    componentType: "vector",
    expectedObservable:
      "Changing either axis moves only the AI prompt popup while the V4 badge and both heading lines keep their current position.",
    id: heroPromptTargets.position,
    target: heroPromptTargets.position,
    userAction: "Move Prompt Position horizontally and vertically.",
  }),
  controlPartCoverage: ["vector.x", "vector.y"],
},
```

- [ ] **Step 3: Add the one-control Prompt inventory entity**

```ts
{
  entity: "Hero AI prompt popup",
  entityId: "hero-prompt-popup",
  groupingReason:
    "Two-axis placement is the complete editable positioning surface for the website-owned prompt popup.",
  id: "prompt",
  targets: [heroPromptTargets.position],
  title: "Prompt",
},
```

- [ ] **Step 4: Run the focused Toolcraft tests**

Run:

```bash
npm exec vitest run src/app/hero-preview.product.test.ts
npm run typecheck
npm run ai:check
```

Expected: all commands PASS and the new product case proves schema default, payload mapping, acceptance coverage, and preview-sync invalidation.

### Task 6: Record the later feature decision and verify the real interaction

**Files:**

- Modify: `docs/toolcraft/agent-worklog.md`
- Browser diagnostics: `.toolcraft/browser-artifacts/`

- [ ] **Step 1: Add Delivery 12 to the worklog**

Record the exact request (`я хочу иметь возможность двигать этот попап по канвасу.` plus the clarification `через пад в панели`), Tier 2 later feature classification, panel ownership, Vector selection, version-6 data flow, rejected slider/canvas-drag alternatives, no new workload, focused checks, and remaining clipping behavior at the hero bounds.

Update the high-level Renderer, Interaction Ownership, Controls, and Verification sections to mention protocol version 6 and the Prompt section.

- [ ] **Step 2: Run the focused product browser acceptance**

Run: `npm run test:feature -- prompt.position`

Expected: PASS with the `prompt.position` product acceptance scenario and no measured performance work.

- [ ] **Step 3: Run website repository gates that exist in package.json**

From `../recraft-v4-styles`, run:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm build
git diff --check
```

Expected: all commands PASS. Record that `architecture`, `test:unit`, and repository-owned e2e scripts are not defined in this checkout rather than inventing alternate scripts.

- [ ] **Step 4: Verify browser geometry and reset behavior**

Start/reuse both local servers. In Hero Scene Lab:

1. Record the prompt and heading bounding rectangles at `{ x: 0, y: 0 }`.
2. Move the Prompt pad to a nonzero X/Y value.
3. Assert the prompt rectangle changes on both axes while the heading rectangle remains unchanged.
4. Reset the Prompt section and assert the prompt returns to its original rectangle.
5. Confirm blank-canvas pan/zoom still works because the iframe remains pointer-transparent.

Store screenshots or geometry diagnostics under `.toolcraft/browser-artifacts/`.

- [ ] **Step 5: Review the final diff**

Run `git status --short` and `git diff --check` in both repositories. Confirm only prompt-position product files, the spec/plan, and the Toolcraft worklog changed. Do not commit, push, deploy, or run measured performance without explicit authorization.

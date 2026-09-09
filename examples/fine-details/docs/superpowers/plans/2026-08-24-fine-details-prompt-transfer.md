# Fine Details Prompt Transfer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the existing AI prompt popup and its editing state from Hero, render it in Fine Details, and expose only position and shadow controls in the Fine Details Toolcraft app.

**Architecture:** Fine Details becomes the only owner of the prompt settings, normalization, website rendering, iframe payload, persistence, and Toolcraft controls. Hero drops the prompt from its renderer, settings model, protocol, controls, pipeline, and acceptance inventory so later Hero Apply/Reset operations cannot overwrite the moved state. The existing `AiPromptInput` remains unchanged and is positioned relative to the Fine Details section.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Toolcraft schema/runtime, `postMessage`, `BroadcastChannel`, JSON-backed local development persistence.

**Verification tier:** Tier 2 — schema/product behavior. The user explicitly requested implementation without strong or additional checks, so tests, lint, typecheck, build, browser suites, formatting, and measured performance are not executed; test/acceptance source is kept aligned mechanically and the running development servers receive the changes through HMR for manual review.

---

### Task 1: Add Fine Details prompt values and controls

**Files:**
- Create: `recraft-tools/fine-details/src/app/fine-details-prompt-values.ts`
- Modify: `recraft-tools/fine-details/src/app/app-schema.ts`

- [ ] **Step 1: Define the canonical Toolcraft targets and migrated defaults**

```ts
export const fineDetailsPromptTargets = {
  position: "prompt.position",
  shadowBlur: "prompt.shadow.blur",
  shadowColorOpacity: "prompt.shadow.colorOpacity",
  shadowEnabled: "prompt.shadow.enabled",
  shadowOffset: "prompt.shadow.offset",
  shadowSpread: "prompt.shadow.spread",
} as const;

export const FINE_DETAILS_PROMPT_DEFAULTS = {
  position: { x: 0, y: 0.25 },
  shadow: {
    blur: 40,
    colorOpacity: { hex: "#000000", opacity: 35 },
    enabled: true,
    offset: { x: 0, y: 0.125 },
    spread: 0,
  },
} as const;
```

- [ ] **Step 2: Add built-in Prompt and Prompt Shadow sections**

Add a `vector` Position control in `Prompt`, then a Switch, conditional Vector, two conditional Sliders, and conditional ColorOpacity control in `Prompt Shadow`. Use `coordinateMode: "screen"`; keep blur at `0..100`, spread at `-32..32`, and bind all defaults to `FINE_DETAILS_PROMPT_DEFAULTS`.

```ts
{
  controls: {
    position: {
      applicability: { mode: "always" },
      coordinateMode: "screen",
      defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.position,
      label: "Position",
      target: fineDetailsPromptTargets.position,
      type: "vector",
    },
  },
  id: "prompt",
  title: "Prompt",
}
```

Keep Reset and Apply adjacent in the existing sticky Website section.

### Task 2: Extend the Fine Details preview contract

**Files:**
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-protocol.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-pipeline.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.product.test.ts`
- Modify: `recraft-tools/fine-details/e2e/product-fine-details-preview.spec.ts`

- [ ] **Step 1: Add prompt settings to the versioned payload**

Import the new defaults/targets, add `prompt` to `FineDetailsPreviewSettings`, build its value from Toolcraft state, and increase `FINE_DETAILS_PREVIEW_VERSION` from `1` to `2`.

```ts
export interface FineDetailsPreviewSettings {
  background: string;
  gridOpacity: number;
  gridSize: number;
  height: number;
  prompt: FineDetailsPromptSettings;
}
```

Normalize Toolcraft values with the same bounded vector, boolean, number, and color-opacity helpers used by the Hero bridge, using the migrated Fine Details defaults for invalid individual runtime values.

- [ ] **Step 2: Register prompt targets in the preview-sync pass**

```ts
const previewSettingsTargets = [
  "canvas.size.height",
  fineDetailsTargets.background,
  fineDetailsTargets.gridOpacity,
  fineDetailsTargets.gridSize,
  ...Object.values(fineDetailsPromptTargets),
] as const;
```

Change the pipeline runtime id to `fine-details-external-preview-v2`.

- [ ] **Step 3: Align protocol and browser expectations without running them**

Update expected payloads and message versions to `2`. Include the complete migrated prompt object in Apply expectations so future verification checks the same persisted shape the website receives.

### Task 3: Render and persist the prompt in Fine Details

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-applied-settings.json`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-section.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-preview-boundary.tsx`

- [ ] **Step 1: Add strict website prompt settings normalization**

Add shared `FineDetailsColorOpacity`, `FineDetailsShadowSettings`, and `FineDetailsPromptSettings` interfaces. Extend the defaults with the migrated Hero values and reject complete incoming settings when nested prompt, position, shadow, color-opacity, or finite numeric fields are missing or invalid.

```ts
prompt: {
  position: { x: 0, y: 0.25 },
  shadow: {
    blur: 40,
    colorOpacity: { hex: '#000000', opacity: 35 },
    enabled: true,
    offset: { x: 0, y: 0.125 },
    spread: 0,
  },
},
```

Clamp position and offset to `-1..1`, blur to `0..100`, spread to `-32..32`, and opacity to `0..100`; retain strict six-digit hex validation.

- [ ] **Step 2: Add prompt rendering above the retained background/grid**

Import `AiPromptInput`, calculate the normalized section-relative point, and render the existing component with its existing content and behavior.

```tsx
<div
  className="absolute left-1/2 z-10 w-[calc(100vw-2rem)] max-w-160"
  data-fine-details-prompt
  style={{
    left: `calc(50% + ${settings.prompt.position.x * 36}vw)`,
    top: `${(settings.prompt.position.y + 1) * 50}%`,
    transform: `translate(-50%, ${-(settings.prompt.position.y + 1) * 50}%)`,
  }}
>
  <AiPromptInput
    className="w-full"
    defaultPrompt="Create four campaign visuals: a sneaker, camera, chair, and perfume bottle."
    style={createPromptPanelStyle(settings.prompt.shadow)}
  />
</div>
```

Create the box-shadow string with the existing 48px normalized offset scale and no shadow when disabled.

- [ ] **Step 3: Upgrade the website receiver to protocol v2**

Set `previewProtocolVersion` to `2`. The existing normalizer, PUT endpoint, BroadcastChannel, Apply, and Reset paths will then carry the complete prompt-aware `FineDetailsSettings` object without a second persistence channel.

### Task 4: Remove prompt ownership from the website Hero

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.module.css`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-applied-settings.json`

- [ ] **Step 1: Remove Hero prompt rendering and styling**

Delete the `AiPromptInput` import, `HeroPromptStyle`, position helper, prompt-only color/shadow helpers, `HeroShadowSettings` type import, prompt JSX block, and `.prompt` CSS rule. Keep `shadowOffsetPixels` because the heading SVG shadow still uses that scale.

- [ ] **Step 2: Remove prompt from the Hero settings model**

Delete `HeroPromptSettings`, `HeroSceneSettings.prompt`, the default prompt block, `promptPosition` bounds, prompt parsing, prompt shadow normalization, and the normalized result field. Preserve every current gallery, heading, pattern, auto-scroll, and dispersion setting unchanged.

- [ ] **Step 3: Remove the persisted Hero prompt field**

Delete only the top-level `prompt` object from `hero-applied-settings.json`; do not rewrite or reset any unrelated applied Hero values.

### Task 5: Remove prompt ownership from Hero Toolcraft

**Files:**
- Delete: `recraft-tools/hero/src/app/hero-prompt-values.ts`
- Modify: `recraft-tools/hero/src/app/hero-visual-control-sections.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview-protocol.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview-pipeline.ts`
- Modify: `recraft-tools/hero/src/app/hero-product-control-acceptance.ts`
- Modify: `recraft-tools/hero/src/app/hero-visual-preview-cases.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview.product.test.ts`
- Modify: `recraft-tools/hero/src/app/app-acceptance-data.ts`
- Modify: `recraft-tools/hero/e2e/product-hero-visual-effects.spec.ts`
- Delete: `recraft-tools/hero/e2e/product-prompt-preview.spec.ts`

- [ ] **Step 1: Remove Prompt sections and bridge fields**

Delete the two prompt sections and their imports. Remove `prompt` from `HeroPreviewSettings`, defaults, value conversion, and all preview pipeline targets. Align the Hero Toolcraft protocol version with the existing website Hero receiver version while preserving unrelated current Hero behavior.

- [ ] **Step 2: Remove obsolete acceptance and preview cases**

Delete prompt acceptance rows, prompt control inventory entries, visual-preview cases, and the dedicated prompt E2E file. Remove only prompt cases/imports from shared Hero tests and preserve all heading/gallery/dispersion cases.

- [ ] **Step 3: Confirm source ownership by targeted search only**

Use one read-only `rg` search for `heroPrompt`, `HERO_PROMPT`, `prompt.position`, `data-hero-prompt`, and `AiPromptInput` in Hero-owned files. This is a source-target inventory check, not a test, lint, typecheck, build, browser, formatting, or delivery verification command.

### Task 6: Align Fine Details acceptance metadata and worklog

**Files:**
- Modify: `recraft-tools/fine-details/src/app/app-acceptance-data.ts`
- Modify: `recraft-tools/fine-details/src/app/app-performance.ts`
- Modify: `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Add control coverage and section inventory**

Add product-output acceptance rows for Position, Shadow, Shadow offset, Shadow blur, Shadow spread, and Shadow color. Add `Prompt` and `Prompt Shadow` inventory entries with the exact targets. Update product summary/requested behavior so Fine Details owns the prompt popup as well as its background.

- [ ] **Step 2: Update protocol metadata**

Replace protocol-v1 fixture wording with protocol v2 and describe the prompt payload as part of the same constant-cost iframe sync pass. Keep workload dimensions empty because no new workload control or rendering loop is introduced.

- [ ] **Step 3: Record the delivery decision**

Append a Decision Trail entry covering the full ownership transfer, built-in panel-only interaction ownership, no prompt-content controls, no export, protocol v2, and the user's explicit manual-review/no-checks instruction.

- [ ] **Step 4: Hand off to the running servers**

Do not run tests, lint, typecheck, build, browser suites, formatting, diff verification, commit, or push. Leave the existing Next.js server and Fine Details Toolcraft server running so the user can review through HMR.

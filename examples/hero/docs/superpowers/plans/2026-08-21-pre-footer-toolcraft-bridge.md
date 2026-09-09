# Pre-footer Toolcraft Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `recraft-tools/pre-footer`, a standalone Toolcraft app that previews the real website pre-footer and maps Toolcraft Canvas height to the section's exact visible height.

**Architecture:** Generate a fresh stable Toolcraft app instead of copying the hero product. Toolcraft owns canonical canvas height and sends it through a versioned `postMessage` bridge to a dedicated Next.js preview route that reuses the existing `PreFooter` component.

**Tech Stack:** Toolcraft runtime, React 19, TypeScript, Vite, Vitest, Playwright, Next.js App Router, Tailwind CSS, pnpm/npm

---

### Task 1: Generate the isolated Toolcraft starter

**Files:**

- Create: `recraft-tools/pre-footer/**`
- Source only: `/Users/kusnizza/Projects/primeui-v2/starter/**`
- Source only: `/Users/kusnizza/Projects/primeui-v2/packages/toolcraft-runtime/src/**`
- Source only: `/Users/kusnizza/Projects/primeui-v2/packages/ui/src/**`

- [ ] **Step 1: Run the generated-app code-health preflight**

Run:

```bash
npm run ai:check
```

Working directory: `recraft-tools/hero`.

Expected: the existing generated app reports a successful code-health boundary before a second app is generated.

- [ ] **Step 2: Generate the current stable starter without installing skills or dependencies**

Run:

```bash
node cli/bin/create-toolcraft-app.mjs /Users/kusnizza/Projects/recraft/recraft-landing/recraft-tools/pre-footer --name pre-footer --yes --no-skills --no-install
```

Working directory: `/Users/kusnizza/Projects/primeui-v2`.

Expected: a new generated app whose `index.html` identity and `src/app/app-identity.ts` both use `Pre Footer`, with no copied hero source.

- [ ] **Step 3: Read the generated contract and install its pinned dependencies**

Run:

```bash
npm install
```

Working directory: `recraft-tools/pre-footer`.

Expected: `package-lock.json` remains the package authority and dependencies install successfully.

### Task 2: Make the website section height-controlled

**Files:**

- Modify: `recraft-v4-styles/src/components/pages/home/pre-footer.tsx`
- Create: `recraft-v4-styles/src/components/pages/home/pre-footer-preview-boundary.tsx`
- Create: `recraft-v4-styles/src/app/(toolcraft-preview)/layout.tsx`
- Create: `recraft-v4-styles/src/app/(toolcraft-preview)/toolcraft/pre-footer/page.tsx`

- [ ] **Step 1: Add a height prop without changing the home-page default**

Use this public component contract:

```tsx
interface PreFooterProps {
  height?: number;
}

export default function PreFooter({ height = 1080 }: PreFooterProps) {
  return (
    <section
      aria-labelledby="pre-footer-title"
      className="relative overflow-hidden"
      data-pre-footer-height={height}
      style={{ height }}
    >
      {/* Existing section children remain unchanged. */}
    </section>
  );
}
```

Expected: the normal home page still renders at 1080 px because it calls `<PreFooter />` without a prop.

- [ ] **Step 2: Add the trusted preview receiver**

Create a client component with these protocol values and validation rules:

```tsx
const previewChannel = 'recraft.pre-footer-section';
const previewProtocolVersion = 1;
const defaultHeight = 1080;

interface PreviewSettingsMessage {
  channel: typeof previewChannel;
  payload: { height: number };
  type: 'settings';
  version: typeof previewProtocolVersion;
}

function normalizeHeight(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1
    ? Math.round(value)
    : null;
}
```

The effect must accept only the parent window and the trusted local referrer origin, update height only for valid `settings` messages, and post `{ channel, type: 'ready', version }` after listener registration.

- [ ] **Step 3: Add a headerless preview route**

Create a route-group layout that renders a `<body>` with the existing `fontVariablesClassName` and `fontVariablesStyle`, then render `<PreFooterPreviewBoundary />` at `/toolcraft/pre-footer`.

Expected: the preview URL contains only the pre-footer section and project fonts, without the website Header or Footer.

- [ ] **Step 4: Format and typecheck the website files**

Run:

```bash
pnpm exec oxfmt src/components/pages/home/pre-footer.tsx src/components/pages/home/pre-footer-preview-boundary.tsx 'src/app/(toolcraft-preview)/layout.tsx' 'src/app/(toolcraft-preview)/toolcraft/pre-footer/page.tsx'
pnpm typecheck
```

Expected: formatting succeeds; typecheck has no errors introduced by these files. If the known unrelated `hero-preview-boundary.tsx` error remains, record it separately and verify the new files directly.

### Task 3: Implement the Toolcraft height bridge

**Files:**

- Modify: `recraft-tools/pre-footer/src/app/app-schema.ts`
- Modify: `recraft-tools/pre-footer/src/app/app-composition.tsx`
- Create: `recraft-tools/pre-footer/src/app/pre-footer-preview-protocol.ts`
- Create: `recraft-tools/pre-footer/src/app/pre-footer-preview-pipeline.ts`
- Create: `recraft-tools/pre-footer/src/app/pre-footer-preview.tsx`
- Create: `recraft-tools/pre-footer/src/app/pre-footer-preview.module.css`
- Test: `recraft-tools/pre-footer/src/app/pre-footer-preview.product.test.ts`

- [ ] **Step 1: Write the protocol and schema assertions first**

Add tests that assert:

```ts
expect(PRE_FOOTER_PREVIEW_URL).toBe('http://localhost:3000/toolcraft/pre-footer');
expect(createPreFooterPreviewSettingsMessage(720)).toEqual({
  channel: 'recraft.pre-footer-section',
  payload: { height: 720 },
  type: 'settings',
  version: 1,
});
expect(appSchema.canvas.size).toEqual({ height: 1080, unit: 'px', width: 1920 });
expect(appSchema.canvas.upload).toBe(false);
expect(appSchema.panels.controls.sections).toHaveLength(1);
```

The single resolved section is runtime Setup; no app-authored product section is allowed.

- [ ] **Step 2: Run the focused test and observe the expected failure**

Run:

```bash
npx vitest run src/app/pre-footer-preview.product.test.ts
```

Expected: fail because the pre-footer protocol and product schema are not implemented yet.

- [ ] **Step 3: Configure the minimal schema**

Use this product schema shape:

```ts
export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    size: { height: 1080, unit: 'px', width: 1920 },
    sizing: { mode: 'editable-output' },
  },
  identity: appIdentity,
  panels: {
    controls: { sections: [], title: 'Controls' },
  },
  toolbar: { history: true, radar: true, zoom: true },
});
```

Omitting `canvas.upload` disables the neutral starter's upload surface. Do not add product sections, media, timeline, layers, or panel actions.

- [ ] **Step 4: Implement the versioned protocol**

Create:

```ts
export const PRE_FOOTER_PREVIEW_CHANNEL = 'recraft.pre-footer-section';
export const PRE_FOOTER_PREVIEW_PROTOCOL_VERSION = 1;
export const PRE_FOOTER_PREVIEW_URL = 'http://localhost:3000/toolcraft/pre-footer';

export function createPreFooterPreviewSettingsMessage(height: number) {
  return {
    channel: PRE_FOOTER_PREVIEW_CHANNEL,
    payload: { height },
    type: 'settings',
    version: PRE_FOOTER_PREVIEW_PROTOCOL_VERSION,
  } as const;
}
```

Also export a strict `isPreFooterPreviewReadyMessage` guard.

- [ ] **Step 5: Register one synchronization pass**

Create a renderer pipeline with:

```ts
interactionInvalidation: [
  {
    interaction: 'initial-render',
    invalidates: ['preview-sync'],
    targets: ['canvas.initial-render'],
  },
  {
    interaction: 'control-change',
    invalidates: ['preview-sync'],
    targets: ['canvas.size.height'],
  },
  {
    interaction: 'viewport-drag',
    invalidates: [],
    mustNotInvalidate: ['preview-sync'],
    targets: ['canvas.viewport'],
  },
  {
    interaction: 'viewport-zoom',
    invalidates: [],
    mustNotInvalidate: ['preview-sync'],
    targets: ['canvas.viewport'],
  },
]
```

The `preview-sync` pass is a constant-cost, discrete, main-thread composite pass with call-scoped/no-cache lifecycle and full quality.

- [ ] **Step 6: Render the external preview from canonical canvas state**

`PreFooterExternalPreview` must select `state.canvas.size.height`, keep one iframe ref, verify `event.source` and `event.origin`, and remount `PreviewSyncPass` after `ready`, iframe `load`, or height changes. The iframe uses the dedicated preview URL and stays pointer-transparent through local CSS:

```css
.preview {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

.frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
  pointer-events: none;
}
```

- [ ] **Step 7: Compose only schema, preview, and pipeline**

Use:

```tsx
export const appComposition: ToolcraftAppComposition = {
  canvasContent: <PreFooterExternalPreview />,
  rendererPipelineRegistration: preFooterPreviewPipelineRegistration,
  schema: appSchema,
};
```

- [ ] **Step 8: Run the focused test**

Run:

```bash
npx vitest run src/app/pre-footer-preview.product.test.ts
```

Expected: pass.

### Task 4: Declare product readiness, acceptance, and performance

**Files:**

- Modify: `recraft-tools/pre-footer/src/app/app-acceptance-data.ts`
- Modify: `recraft-tools/pre-footer/src/app/app-performance.ts`
- Modify: `recraft-tools/pre-footer/docs/toolcraft/agent-worklog.md`
- Create: `recraft-tools/pre-footer/e2e/product-pre-footer-preview.spec.ts`

- [ ] **Step 1: Switch readiness from starter to product**

Declare:

```ts
export const appTransferMode = {
  animationIntent: { mode: 'none' },
  behaviorCoverage: ['renderer-state'],
  mode: 'new-toolcraft-app',
  referenceInputs: [],
} as const;
```

Product readiness must set all export modes to not requested/user removed, use `fixed-camera` with the supplied static reference as evidence, and declare panel ownership for `canvas.size.height`. Keep `appControlSectionInventory` empty because Setup is runtime-owned.

- [ ] **Step 2: Add acceptance for exact height and persistence**

Add one control acceptance with id `section.height`, target `canvas.size.height`, component type `text`, rendered-pixels evidence, and expected output stating that Toolcraft canvas height and `[data-pre-footer-height]` match exactly. Retain one `persistence.reload` runtime row covering resolved localStorage slices.

- [ ] **Step 3: Declare the constant DOM renderer model**

Use `rendererStrategy: 'dom'`, the exact `preFooterPreviewPipelineRegistration`, zero workload dimensions, no fixture adapters, and scenarios derived from `deriveToolcraftPerformancePaths`. Exclude export interactions and describe the iframe bridge as website-owned DOM output.

- [ ] **Step 4: Add the focused browser scenario**

The Playwright test must:

1. open the Toolcraft app through protected product helpers;
2. set Canvas height to a non-default value such as 720;
3. wait for the iframe preview handshake;
4. assert the finite Toolcraft canvas and child `[data-pre-footer-height="720"]` both use 720 px;
5. emit acceptance evidence only after the persistent observable assertion succeeds.

- [ ] **Step 5: Replace the neutral worklog with the concrete product decision**

Record Mode `product`, the exact user request, stable-starter generation source, fixed-camera DOM iframe renderer, panel-owned height, no uploads/timeline/layers/export/actions, the versioned bridge mapping, Tier 4 first-delivery checks, no measured performance, and the risk that the website dev server must be available at localhost:3000.

### Task 5: Verify and run the first slice

**Files:**

- Verify: `recraft-tools/pre-footer/**`
- Verify: `recraft-v4-styles/src/components/pages/home/pre-footer*.tsx`
- Verify: `recraft-v4-styles/src/app/(toolcraft-preview)/**`

- [ ] **Step 1: Run generated-app code health and focused tests**

Run:

```bash
npm run ai:check
npx vitest run src/app/pre-footer-preview.product.test.ts
npm run typecheck
```

Working directory: `recraft-tools/pre-footer`.

Expected: all commands pass.

- [ ] **Step 2: Run first-delivery functional proof without measured performance**

Run:

```bash
npm run verify:delivery
```

Expected: the protected initial functional receipt passes. Do not run `verify:perf` or browser tests named `browser perf:`.

- [ ] **Step 3: Start or reuse both servers**

Run the website with `pnpm dev` from `recraft-v4-styles` if localhost:3000 is not already serving it. Run `npm run dev` from `recraft-tools/pre-footer`; let Toolcraft select and save the next free app port without stopping the hero server.

Expected: the new Toolcraft identity endpoint and `toolcraft-app-title` marker confirm the reported URL belongs to Pre Footer.

- [ ] **Step 4: Perform one focused visual check**

Open the new Toolcraft URL, confirm the real pre-footer renders without site header/footer, change Canvas height to 720, and confirm the visible section and artboard bottom move together. Do not run unrelated website end-to-end suites.

- [ ] **Step 5: Review final scope and whitespace**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; new work is limited to `recraft-tools/pre-footer`, the pre-footer bridge/route, and the approved spec/plan. Do not create a Git commit without explicit authorization.

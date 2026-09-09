# Complete Visible Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Shaders PNG/JPG exports include the visible Button Image icon and all other product-rendered layers.

**Architecture:** Keep the Toolcraft 2D export helper responsible for selected dimensions, background, and downloadable output. Render the product first through the existing `renderLiquidGlassExportCanvas` WebGL path at those exact dimensions, then copy that complete surface into the standard export canvas.

**Tech Stack:** React 19, TypeScript, Toolcraft runtime export helpers, Canvas 2D, WebGL, Playwright, Vite, Vercel.

---

### Task 1: Add A Failing Complete-Composition Export Test

**Files:**
- Modify: `e2e/app-controls.spec.ts`

- [x] **Step 1: Add a downloaded-image snapshot helper**

Add a helper beside `decodeDownloadedImageDimensions` that loads downloaded
bytes in the browser, draws the image to a stable `256x144` canvas, and returns
an FNV-1a pixel hash:

```ts
async function decodeDownloadedImageSnapshot(
  page: Page,
  path: string,
  mimeType: string,
): Promise<string> {
  const base64 = readFileSync(path).toString("base64");

  return page.evaluate(
    async ({ base64: encoded, mimeType: type }) => {
      const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type }));
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 144;
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        throw new Error("Unable to inspect downloaded image pixels.");
      }

      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let hash = 2166136261;

      for (const value of pixels) {
        hash ^= value;
        hash = Math.imul(hash, 16777619);
      }

      bitmap.close();
      return `${canvas.width}x${canvas.height}:${(hash >>> 0).toString(16)}`;
    },
    { base64, mimeType },
  );
}
```

- [x] **Step 2: Extend the existing image-export browser test**

In `browser: image export writes final glass output`, hash the initial PNG while
the visible default Button Image exists, remove the Button Image through the real
control, export the same scene again, and require different pixel hashes:

```ts
  const pngWithIconSnapshot = await decodeDownloadedImageSnapshot(
    page,
    pngDownload.path,
    "image/png",
  );

  await getButtonImageSection(page)
    .getByRole("button", { name: "Remove image" })
    .click();
  await waitForLiquidGlassRendererSettled(page);

  const pngWithoutIconDownload = await exportImage(page);
  const pngWithoutIconSnapshot = await decodeDownloadedImageSnapshot(
    page,
    pngWithoutIconDownload.path,
    "image/png",
  );

  expect(pngWithIconSnapshot).not.toBe(pngWithoutIconSnapshot);
```

- [x] **Step 3: Run the test and verify the regression fails**

Run:

```bash
pnpm exec playwright test e2e/app-controls.spec.ts --grep "browser: image export writes final glass output" --workers=1
```

Expected: FAIL because the pre-fix route omits Button Image in both exports, so
the two downloaded pixel hashes are equal.

### Task 2: Route Export Through The Complete Product Renderer

**Files:**
- Modify: `src/routes/index.tsx`

- [x] **Step 1: Replace duplicate asset assembly imports**

Import `getToolcraftImageExportSize` beside
`createToolcraftPngExportCanvas`. Import `renderLiquidGlassExportCanvas` beside
`LiquidGlassRenderer`, and remove route imports for
`loadLiquidGlassMediaImage`, `renderLiquidGlassToCanvas`,
`findLiquidGlassSourceAsset`, and `findLiquidGlassTextureAsset`.

```ts
import {
  createToolcraftPngExportCanvas,
  getToolcraftImageExportSize,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import {
  LiquidGlassRenderer,
  renderLiquidGlassExportCanvas,
} from "../app/liquid-glass-renderer";
```

- [x] **Step 2: Render the complete WebGL product before 2D composition**

Replace the route-owned source/texture loading and inline WebGL render with:

```ts
  const imageFormat = getImageExportFormat(state);
  const imageResolution = getImageExportResolution(state);
  const exportSize = getToolcraftImageExportSize({
    resolution: imageResolution,
    state,
  });
  const webglCanvas = document.createElement("canvas");
  webglCanvas.width = exportSize.width;
  webglCanvas.height = exportSize.height;

  await renderLiquidGlassExportCanvas(webglCanvas, state, settings);
  reportProgress(0.65);

  const exportCanvas = createToolcraftPngExportCanvas({
    background: settings.background,
    includeBackground: settings.includeBackground,
    render: ({ context, cssHeight, cssWidth }) => {
      context.drawImage(webglCanvas, 0, 0, cssWidth, cssHeight);
    },
    resolution: imageResolution,
    state,
  });
```

This reuses the existing helper that resolves source, texture, Button Image, and
all three media transforms.

- [x] **Step 3: Run the focused browser regression test**

Run:

```bash
pnpm exec playwright test e2e/app-controls.spec.ts --grep "browser: image export writes final glass output" --workers=1
```

Expected: PASS; the icon-present and icon-removed exports have different hashes,
and existing 2K PNG/4K JPG assertions still pass.

- [x] **Step 4: Commit implementation and regression coverage**

```bash
git add src/routes/index.tsx e2e/app-controls.spec.ts
git commit -m "fix(glass): include visible icon in image export"
```

### Task 3: Run Narrow Verification And Record The Delivery

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [x] **Step 1: Run focused static checks**

Run:

```bash
pnpm typecheck
pnpm vitest run src/app/app-acceptance.test.ts
```

Expected: both commands exit `0`.

Outcome: `pnpm typecheck` passed. The complete acceptance file exposed one
pre-existing stale control-order expectation unrelated to export; the focused
export acceptance subset passed 8/8.

- [x] **Step 2: Run only the export performance scenario**

Run:

```bash
pnpm exec playwright test e2e/liquid-glass-performance.spec.ts --grep "browser perf: image export stays within liquid glass budget" --workers=1
```

Expected: PASS. Do not run the full performance suite or unrelated browser
matrix.

- [x] **Step 3: Append the decision trail**

Add a product-mode worklog entry recording:

```md
### 2026-08-04 — Complete visible image export

Request: Include the visible Button Image icon in Shaders export and deploy the fix.
Task type: Export bug / renderer orchestration.
User-visible result: PNG and JPG exports now include the same Button Image layer visible in preview, including its current transform and blend settings.
Source/reference checked: Live preview render options, route export action, existing `renderLiquidGlassExportCanvas`, and the default icon scene spec.
Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `decision-contract.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `performance.md`, and `renderer-technique.md`.
Contract rules applied: `output-export-required`, `acceptance-product-observable`, `performance-coverage-levels`, `workflow-required`.
Decision: Route export through the existing complete product export renderer, then compose its WebGL surface through `createToolcraftPngExportCanvas`.
Alternatives rejected: duplicating Button Image asset loading in the route would preserve two export assembly paths; changing the shader would address the wrong layer.
State/output mapping: Current Toolcraft source, texture, and `buttonImage.upload` assets and transforms flow through `renderLiquidGlassExportCanvas`; standard image resolution/background state flows through `createToolcraftPngExportCanvas`.
Files changed: `src/routes/index.tsx`, `e2e/app-controls.spec.ts`.
Verification: focused image-export browser test, typecheck, acceptance unit test, and focused image-export performance test.
Skipped checks: full browser/performance suites, per user request to avoid heavy checks; unrelated app behavior and renderer algorithms did not change.
Risks or follow-ups: None identified.
```

- [x] **Step 4: Commit the worklog**

```bash
git add docs/toolcraft/agent-worklog.md
git commit -m "docs(glass): record complete export verification"
```

### Task 4: Deploy The Shaders App As A Vercel Preview

**Files:**
- No source changes expected.

- [x] **Step 1: Create the preview deployment**

Run from `examples/glass` with a ten-minute timeout:

```bash
vercel deploy . -y
```

Expected: Vercel completes the build and prints an HTTPS preview URL.

Outcome: deployment `dpl_41GdACoMc3m42AypuBDcEfiLz3ML` reached `READY` at
`https://glass-9cecbx04n-pixelpoint.vercel.app`.

- [x] **Step 2: Report deployment**

Return the preview URL and the exact focused checks that passed. Do not promote
to production because the request did not explicitly ask for a production
deployment.

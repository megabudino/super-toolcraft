# Dots Animation Infinity Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Toolcraft's runtime-owned Infinity canvas to Dots Animation with unclipped world-space preview, tight PNG bounds, one video time-range envelope, persistence, and protected acceptance proof.

**Architecture:** Refresh the standalone app's signed framework files from a newly generated app instead of editing `src/toolcraft`. Add one product-owned deterministic scene-bounds module and reuse its coordinate model in the Canvas 2D preview, PNG export, video export, and `ToolcraftAppComposition.sceneBoundsProvider`.

**Tech Stack:** TypeScript, React 19, Toolcraft runtime schema and commands, Canvas 2D, Vitest, Playwright, Vite.

---

### Task 1: Refresh The Signed Generated Framework

**Files:**
- Replace from fresh generation: paths listed by `/tmp/particle-typography-toolcraft-refresh/src/toolcraft/.toolcraft-manifest.json`
- Replace: `src/toolcraft/**`
- Replace protected app files listed by the fresh manifest
- Preserve: `src/app/app-schema.ts`
- Preserve: `src/app/app-composition.tsx`
- Preserve: `src/app/app-acceptance-data.ts`
- Preserve: `src/app/app-performance.ts`
- Preserve and migrate: `src/app/app-verification-impact.json`
- Preserve: `src/app/dots/**`
- Preserve: product-owned `e2e/dots-*.ts`
- Preserve: `docs/toolcraft/agent-worklog.md`
- Preserve: `docs/superpowers/**`

- [x] **Step 1: Generate a fresh current-framework app**

Run from `/Users/kusnizza/Projects/primeui-v2`:

```bash
node cli/bin/create-toolcraft-app.mjs \
  --dir /tmp/particle-typography-toolcraft-refresh \
  --name particle-typography \
  --yes \
  --no-skills \
  --no-install
```

Expected: a new standalone app whose copied runtime contains
`toolcraftCanvasInfinityTarget`, `sceneBoundsProvider`, and
`browser-infinity-canvas-evidence.ts`.

- [x] **Step 2: Compare dependency and protected-file inventories**

Run:

```bash
diff -u \
  /Users/kusnizza/Projects/toolcraft-apps/particle-typography/package.json \
  /tmp/particle-typography-toolcraft-refresh/package.json
node -e 'const current=require("/Users/kusnizza/Projects/toolcraft-apps/particle-typography/src/toolcraft/.toolcraft-manifest.json"); const fresh=require("/tmp/particle-typography-toolcraft-refresh/src/toolcraft/.toolcraft-manifest.json"); console.log({currentFiles:Object.keys(current.files).length,currentProtected:Object.keys(current.protectedFiles).length,freshFiles:Object.keys(fresh.files).length,freshProtected:Object.keys(fresh.protectedFiles).length})'
```

Expected: the fresh manifest contains the current Infinity canvas runtime,
acceptance, browser evidence, and signed verification files. Any package
dependency delta is recorded before synchronization.

- [x] **Step 3: Copy only fresh signed framework inputs**

Use the fresh manifest as the copy allowlist:

```js
import fs from "node:fs/promises";
import path from "node:path";

const source = "/tmp/particle-typography-toolcraft-refresh";
const target = "/Users/kusnizza/Projects/toolcraft-apps/particle-typography";
const manifest = JSON.parse(
  await fs.readFile(
    path.join(source, "src/toolcraft/.toolcraft-manifest.json"),
    "utf8",
  ),
);

async function copy(relativePath) {
  const destination = path.join(target, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(path.join(source, relativePath), destination);
}

for (const relativePath of Object.keys(manifest.files)) {
  await copy(path.posix.join("src/toolcraft", relativePath));
}
await copy("src/toolcraft/.toolcraft-manifest.json");
for (const relativePath of Object.keys(manifest.protectedFiles)) {
  await copy(relativePath);
}
```

Run the code with `node --input-type=module -e`, then verify:

```bash
npm run docs:check
node scripts/check-toolcraft-integrity.mjs
```

Expected: both commands pass before product changes are added. Product-owned
dots source, specs, plans, worklog, and tests remain unchanged.

- [x] **Step 4: Reconcile package dependencies only when required**

If Step 2 reports dependency changes, preserve `"name": "particle-typography"` and
copy the fresh `dependencies` and `devDependencies` into the existing
`package.json`, preserving product-only scripts that do not override protected
scripts. Then run:

```bash
npm install
```

Expected: `package-lock.json` matches the refreshed package manifest. If there
is no dependency delta, do not reinstall.

### Task 2: Define The Canonical Dots Scene Bounds

**Files:**
- Create: `src/app/dots/dots-scene-bounds.ts`
- Create: `src/app/dots/dots-scene-bounds.test.ts`
- Modify: `src/app/app-verification-impact.json`

- [x] **Step 1: Write deterministic bounds tests**

Create tests that construct a Toolcraft state from `appSchema`, call the new
provider twice, and assert:

```ts
expect(first).toEqual(second);
expect(first).toHaveLength(1);
expect(first[0]!.width).toBeGreaterThan(0);
expect(first[0]!.height).toBeGreaterThan(0);
expect(first[0]!.width).toBeLessThan(state.canvas.size.width);
expect(first[0]!.height).toBeLessThan(state.canvas.size.height);
expect(first[0]!.x).toBeLessThan(0);
expect(first[0]!.y).toBeLessThan(0);
```

Add a time-range case:

```ts
const still = getDotsSceneBounds({ state });
const video = getDotsSceneBounds({
  state,
  timeRange: { startSeconds: 0, endSeconds: state.timeline.durationSeconds },
});

expect(video[0]!.width).toBeGreaterThanOrEqual(still[0]!.width);
expect(video[0]!.height).toBeGreaterThanOrEqual(still[0]!.height);
```

Also assert that increasing glow or trails never shrinks the rectangle.

- [x] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run src/app/dots/dots-scene-bounds.test.ts
```

Expected: FAIL because `dots-scene-bounds.ts` does not exist.

- [x] **Step 3: Implement shared bounds calculation**

Create:

```ts
import {
  getToolcraftTimelineLoopProgress,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import type {
  ToolcraftProductSceneBoundsProvider,
  ToolcraftSceneRect,
} from "@/toolcraft/runtime/react";

import { dotPositionAt } from "./dots-motion";
import { getDotPlan } from "./dots-shape";
import { readDotsSettings } from "./dots-values";

export const DOTS_VIDEO_FRAME_RATE = 30;

export function getDotsWorldOrigin(state: ToolcraftState) {
  return state.canvas.mode === "infinite"
    ? {
        x: -state.canvas.size.width / 2,
        y: -state.canvas.size.height / 2,
      }
    : { x: 0, y: 0 };
}

export const getDotsSceneBounds: ToolcraftProductSceneBoundsProvider = ({
  state,
  timeRange,
}) => {
  // Read one DotsSettings snapshot, evaluate the deterministic DotPlan at the
  // current progress or each exact 30 fps export-frame sample, include dot radius,
  // glow and active trail points, convert local pixels through
  // getDotsWorldOrigin, and return one finite positive ToolcraftSceneRect.
};
```

The implementation must reuse `dotPositionAt`, `getDotPlan`, and the renderer's
trail-step formula. It must not inspect rendered pixels, DOM geometry, or
finite-artboard styles.

- [x] **Step 4: Run bounds tests**

Run:

```bash
npx vitest run src/app/dots/dots-scene-bounds.test.ts
```

Expected: PASS with deterministic still and time-range bounds.

- [x] **Step 5: Register verification ownership**

Add:

```json
{
  "path": "src/app/dots/dots-scene-bounds.ts",
  "kind": "performance",
  "passIds": [
    "dots.image-export",
    "dots.preview-frame",
    "dots.video-frame"
  ]
}
```

Expected: the impact inventory remains sorted and every product production
module is classified.

### Task 3: Wire Runtime Setup And Preview Geometry

**Files:**
- Modify: `src/app/app-composition.tsx`
- Modify: `src/app/app-schema.test.ts`
- Modify: `src/app/dots/dots-renderer.tsx`
- Modify: `src/app/dots/dots-renderer.module.css`
- Test: `src/app/dots/dots-scene-bounds.test.ts`

- [x] **Step 1: Extend the schema contract test**

Assert the generated Setup block contains:

```ts
expect(appSchema.panels.controls?.sections[0]?.controls.infinityCanvas)
  .toMatchObject({
    defaultValue: false,
    label: "Infinity canvas",
    target: "canvas.infinity",
    type: "switch",
  });
expect(appSchema.assembly.capabilities).toContain("canvas.infinity");
```

Also assert the Timeline/Infinity inline layout order and the absence of
descriptions.

- [x] **Step 2: Run the schema test**

Run:

```bash
npx vitest run src/app/app-schema.test.ts
```

Expected: PASS after Task 1; if it fails, repair the framework refresh rather
than declaring a product-owned control.

- [x] **Step 3: Expose product scene bounds**

Wire:

```ts
import { getDotsSceneBounds } from "./dots/dots-scene-bounds";

export const appComposition: ToolcraftAppComposition = {
  // existing fields
  sceneBoundsProvider: getDotsSceneBounds,
};
```

- [x] **Step 4: Render the infinite preview in world space**

Use `getDotsSceneBounds({ state })[0]` when `state.canvas.mode === "infinite"`.
Set the product root's inline `left`, `top`, `width`, and `height` to that
rectangle and set the canvas backing to the rectangle multiplied by render
scale. Translate the context from local dot coordinates through
`getDotsWorldOrigin(state)` into the rectangle before calling
`renderDotsFrame`.

Finite mode keeps `left/top` unset and uses the full canvas size.

- [x] **Step 5: Run renderer and schema tests**

Run:

```bash
npx vitest run \
  src/app/app-schema.test.ts \
  src/app/dots/dots-product.test.ts \
  src/app/dots/dots-scene-bounds.test.ts
```

Expected: PASS.

### Task 4: Apply The Same Frame To PNG And Video

**Files:**
- Modify: `src/app/dots/dots-export.ts`
- Modify: `src/app/dots/dots-product.test.ts`

- [x] **Step 1: Extend export tests with frame resolution**

Test a finite and infinite state. Assert PNG calls
`resolveSceneExportFrame()` without a time range and video calls:

```ts
resolveSceneExportFrame({
  timeRange: {
    startSeconds: 0,
    endSeconds: state.timeline.durationSeconds,
  },
});
```

Assert the returned frame is passed to `createToolcraftPngExportCanvas` or
`getToolcraftVideoExportSize`.

- [x] **Step 2: Run the export test to verify it fails**

Run:

```bash
npx vitest run src/app/dots/dots-product.test.ts
```

Expected: FAIL because the current exports use `state.canvas.size` directly.

- [x] **Step 3: Extend the export context**

Change:

```ts
type ExportContext = Pick<
  ToolcraftPanelActionContext,
  | "rendererPipeline"
  | "reportProgress"
  | "resolveSceneExportFrame"
  | "state"
>;
```

Resolve a frame at the beginning of each export and throw
`ToolcraftSceneExportError` when the result is not `ok`.

- [x] **Step 4: Translate PNG rendering through the resolved frame**

Pass `frame` to `createToolcraftPngExportCanvas`. For ordinary canvas output,
translate by `getDotsWorldOrigin(state)` before rendering local dots. For
streamed PNG rows, use:

```ts
context.setTransform(
  pixelRatio,
  0,
  0,
  pixelRatio,
  (origin.x - frame.x) * pixelRatio,
  (origin.y - frame.y) * pixelRatio - y,
);
```

Render with `settings.canvas.width` and `settings.canvas.height`; do not treat
the cropped frame size as the product's local coordinate system.

- [x] **Step 5: Translate every video frame through one envelope**

Resolve once for `0..duration`, pass the frame to
`getToolcraftVideoExportSize`, and use:

```ts
context.setTransform(
  width / frame.width,
  0,
  0,
  height / frame.height,
  (origin.x - frame.x) * (width / frame.width),
  (origin.y - frame.y) * (height / frame.height),
);
```

Use this transform for initial and subsequent frames.

- [x] **Step 6: Run export tests**

Run:

```bash
npx vitest run src/app/dots/dots-product.test.ts
```

Expected: PASS.

### Task 5: Declare And Prove Infinity Acceptance

**Files:**
- Modify: `src/app/app-acceptance-data.ts`
- Create: `e2e/dots-infinity-canvas.spec.ts`
- Modify: `e2e/dots-acceptance-support.ts` only if shared product artifact inspection needs one focused helper

- [x] **Step 1: Add typed acceptance rows**

Add three runtime entries whose exact coverage is:

```ts
{
  componentType: "canvas",
  evidence: "viewport-side-effect",
  id: "canvas.infinity.mode",
  infinityCanvasCoverage: "mode-and-restoration",
  target: "canvas.infinity",
}
{
  componentType: "canvas",
  evidence: "exported-bytes",
  id: "canvas.infinity.imageExport",
  infinityCanvasCoverage: "scene-bounds-image-export",
  target: "actions.output",
}
{
  componentType: "canvas",
  evidence: "exported-bytes",
  id: "canvas.infinity.videoExport",
  infinityCanvasCoverage: "scene-bounds-video-export",
  target: "actions.output",
}
```

All three use the exact browser title
`browser: Infinity canvas preserves the dots scene and bounded exports`.

- [x] **Step 2: Run acceptance validation**

Run:

```bash
npx vitest run src/app/app-acceptance.canvas-sizing.test.ts src/app/app-acceptance.test.ts
```

Expected: PASS with no missing `infinityCanvasCoverage` errors.

- [x] **Step 3: Write the focused browser proof**

Use the refreshed protected helpers:

```ts
import {
  expectToolcraftInfinityCanvasImageExportEvidence,
  expectToolcraftInfinityCanvasModeEvidence,
  expectToolcraftInfinityCanvasVideoExportEvidence,
  observeInfinityCanvas,
} from "./browser-infinity-canvas-evidence";
```

The test must:

- capture the finite state and exact 1080×1350 size;
- enable `canvas.infinity`;
- assert the product scene rectangle, transparent preview background, pan,
  reload, restore, undo, and redo;
- intercept and decode finite/infinite PNG output;
- intercept and decode finite/infinite video output;
- pass the observed artifacts to all three protected evidence helpers.

- [x] **Step 4: Run only the focused browser test**

Run:

```bash
npx playwright test e2e/dots-infinity-canvas.spec.ts
```

Expected: PASS and runtime evidence for all three acceptance entries.

### Task 6: Update Worklog And Deliver

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`
- Modify: `docs/superpowers/plans/2026-07-27-dots-infinity-canvas.md`

- [x] **Step 1: Record the Decision Trail**

Add one entry containing:

```md
- Request: "добавь в эту апку согласно контракту инфинит канвас"
- Task type: Ordinary product delivery with a generated framework refresh plus canvas, renderer, image export, video export, persistence, and acceptance.
- User-visible result: Runtime Infinity canvas removes the finite artboard and background while preserving visible dots, restores finite size exactly, and exports tight scene bounds.
- Source/reference checked: current `primeui-v2` main starter/runtime and the existing Dots Animation renderer/export paths.
- Alternatives rejected: product-authored Infinity switch; direct edits under `src/toolcraft`.
- Verification: `npm run verify:delivery`
- Skipped: full performance certification was not requested.
```

Include exact files changed, state/output mapping, and any remaining risk.

- [x] **Step 2: Read the Verification phase docs**

Read `docs/toolcraft/acceptance-testing.md` completely, then
`docs/toolcraft/performance.md` completely, one document per terminal read.

- [x] **Step 3: Run targeted development checks**

Run:

```bash
npm run ai:check
npx vitest run \
  src/app/app-schema.test.ts \
  src/app/dots/dots-product.test.ts \
  src/app/dots/dots-scene-bounds.test.ts
npx playwright test e2e/dots-infinity-canvas.spec.ts
```

Expected: all pass.

- [ ] **Step 4: Run the one protected delivery gate**

Run:

```bash
npm run verify:delivery
```

Expected: a successful protected ordinary-delivery receipt with the exact
ownership-derived functional and renderer proof. Do not run a full performance
audit afterward because the user did not request one.

- [ ] **Step 5: Start or reuse the app server**

Run:

```bash
npm run dev
```

Expected: the saved Dots Animation port serves this app identity. If the same
app is already running, reuse its verified URL instead of starting a duplicate.

- [ ] **Step 6: Perform final browser QA**

Verify the Setup row, finite/infinite transition, background suppression,
scene visibility, pan/zoom, exact finite restoration, and both sticky export
actions against the running app. Record the URL and result in the worklog.

- [ ] **Step 7: Treat the protected receipt as the completion record**

Do not mutate verified source after a successful delivery merely to tick the
remaining delivery/launch boxes. The protected receipt and final handoff own
those outcomes.

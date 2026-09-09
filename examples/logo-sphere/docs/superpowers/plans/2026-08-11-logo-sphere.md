# Logo Sphere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Toolcraft editor that renders uploaded logo cards as an interactive, animated, configurable 3D sphere and exports the current frame.

**Architecture:** A pure sphere model generates and projects deterministic points. One Canvas 2D draw kernel consumes that projection for both live preview and Toolcraft-owned export, while a small React canvas adapter connects runtime state, media presentation URLs, timeline progress, retina backing, and shared orbit state. One canonical renderer-pipeline registration defines layout and composite invalidation and is reused by the composition and performance assessment.

**Tech Stack:** React 19, TypeScript 6, Toolcraft runtime/schema/hooks, Canvas 2D, Vitest, Playwright.

---

This folder is not a Git repository, so the commit steps from the generic workflow are replaced by explicit test checkpoints. The complete product specification is `docs/superpowers/specs/2026-08-11-logo-sphere-design.md`.

## Iteration 2 — Stronger depth and pixel-level silhouette fade

User feedback reports that rear logos feel nearly equal in opacity and that cards disappear too abruptly at the silhouette. This remains part of the Tier 4 first-delivery batch.

- Modify `src/app/logo-sphere-model.ts` and its tests: separate depth opacity from edge masking, strengthen the front/rear curve, expose deterministic radial-mask geometry, and preserve seamless depth sorting.
- Modify `src/app/logo-sphere-renderer.ts` and its tests: draw the logo layer, apply one soft `destination-in` radial gradient across actual logo pixels, then composite the optional background with `destination-over`.
- Modify `src/app/logo-sphere-canvas.tsx` and `src/app/app-composition.tsx`: pass the same runtime background intent to the shared renderer in finite preview and export; keep Infinity preview background runtime-owned.
- Modify `src/app/app-schema.ts`, acceptance wording/tests, and the worklog: tune the default depth/perspective for an immediately legible sphere and prove that feather changes mask geometry while rear opacity changes only depth.
- Run focused model/renderer Vitest, focused fade/depth/export Playwright checks, `pnpm typecheck`, and browser visual inspection. Run the single bare `npm run verify:delivery` only when the complete first-delivery batch is ready; do not run measured performance.

## Iteration 3 — Supplied SVG cards and depth-aware card styling

The user now requires the 30 SVG files from the same supplied folder, a configurable non-scaling outline, perspective-correct corner rounding, and a configurable shadow that changes with distance. This remains inside the same Tier 4 first-delivery batch.

- Replace the generated PNG data-url source with the lexically sorted 30 supplied SVG files. Package them into one runtime-attached SVG atlas to avoid concurrent hydration contention while expanding it to 30 source rectangles in the image registry.
- Add one `Card Style` schema section with global Stroke width/color, Corner radius, and Shadow color/opacity/blur/offset controls. All values remain in Toolcraft state and apply equally to preview and export.
- Extend the renderer with a pure depth-style geometry helper. Stroke width remains constant in scene-screen pixels; corner radius, shadow blur, and shadow offset multiply by the projected card scale and distant shadows inherit card depth opacity.
- Draw a shadowed rounded white card, clip the supplied SVG to the rounded contour, then draw the constant-width outline before the existing pixel-level sphere fade.
- Update the canonical renderer pipeline, acceptance inventory/rows, verification-impact ownership, renderer-technique record, product tests, browser controls, persistence coverage, and worklog.
- Run focused Vitest and Playwright checks during development, then the single bare `npm run verify:delivery` at the coherent delivery boundary. Do not run measured performance.

## File map

- Create `public/assets/logos/logo-01.png` through `logo-30.png`: deterministic copies of the user-supplied defaults.
- Create `src/app/logo-sphere-assets.ts`: typed metadata for default media assets.
- Create `src/app/logo-sphere-model.ts`: pure point distribution, quaternion/axis rotation, projection, depth sort, and opacity math.
- Create `src/app/logo-sphere-model.test.ts`: deterministic model tests.
- Create `src/app/logo-sphere-pipeline.ts`: canonical renderer-pipeline registration and assessed render plan.
- Create `src/app/logo-sphere-renderer.ts`: reusable Canvas 2D frame renderer and image cache interface.
- Create `src/app/logo-sphere-canvas.module.css`: locally anchored product-only canvas styles.
- Create `src/app/logo-sphere-canvas.tsx`: live canvas, runtime state/media/timeline binding, resize/backing synchronization, orbit, and inertia.
- Create `src/app/logo-sphere.e2e.ts`: product-specific browser acceptance helpers/selectors if the generic harness requires app-owned glue.
- Create `e2e/logo-sphere.spec.ts`: focused browser behavior and visual-output coverage.
- Modify `src/app/app-identity.ts`: rename the product to Logo Sphere.
- Modify `src/app/app-schema.ts`: product schema, controls, media defaults, timeline, export, and persistence.
- Modify `src/app/app-composition.tsx`: canvas content, scene bounds, export renderer, and pipeline registration.
- Modify `src/app/app-acceptance-data.ts`: readiness, interaction ownership, section inventory, and acceptance rows.
- Modify `src/app/app-performance.ts`: one visible-count workload dimension, renderer technique, derived paths, fixture adapter, and scenarios.
- Modify `src/app/app-verification-impact.json`: exact product module ownership.
- Modify `docs/toolcraft/agent-worklog.md`: product mode and Decision Trail.

### Task 1: Complete implementation preflight and import default assets

**Files:**
- Read: `docs/toolcraft/decision-contract.md`
- Read: `docs/toolcraft/schema-reference.md`
- Read: `docs/toolcraft/component-rules.md`
- Read: `docs/toolcraft/renderer-technique.md`
- Read: `docs/toolcraft/performance.md`
- Create: `public/assets/logos/logo-01.png` … `logo-30.png`
- Create: `src/app/logo-sphere-assets.ts`

- [ ] **Step 1: Read each Implementation-phase document in its own command**

Run the five `sed -n` reads separately and continue each document to EOF if needed. Record the chosen rules in the worklog before the delivery boundary.

- [ ] **Step 2: Run the signed code-health precheck**

Run: `pnpm ai:check`

Expected: the neutral starter passes before product changes.

- [ ] **Step 3: Copy and normalize the 30 binary assets**

Create `public/assets/logos/`, sort the source filenames lexically, and copy them to `logo-01.png` through `logo-30.png`. Verify with:

```bash
find public/assets/logos -type f -name 'logo-*.png' | sort | wc -l
```

Expected: `30`.

- [ ] **Step 4: Declare the reusable default-asset table**

Create `src/app/logo-sphere-assets.ts` with one stable record per file:

```ts
export const logoSphereDefaultAssets = Array.from({ length: 30 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return {
    fileName: `logo-${number}.png`,
    mimeType: "image/png",
    sourceTarget: "logos.sources",
    url: `/assets/logos/logo-${number}.png`,
  } as const;
});
```

- [ ] **Step 5: Typecheck the asset declaration**

Run: `pnpm typecheck`

Expected: PASS; if the runtime default-asset type uses a different field name, adjust the table to the exact schema type rather than casting around it.

### Task 2: Build the deterministic sphere model with TDD

**Files:**
- Create: `src/app/logo-sphere-model.test.ts`
- Create: `src/app/logo-sphere-model.ts`

- [ ] **Step 1: Write failing distribution and seam tests**

Cover exactly these outcomes:

```ts
expect(createSpherePoints({ count: 30, distribution: "fibonacci" })).toHaveLength(30);
expect(allPointsAreUnitLength(points)).toBe(true);
expect(projectLogoSphere({ ...fixture, loopProgress: 0 })).toEqual(
  projectLogoSphere({ ...fixture, loopProgress: 1 }),
);
expect(projected.map((item) => item.z)).toEqual([...projected.map((item) => item.z)].sort((a, b) => a - b));
```

Also assert that increasing `spread` increases projected radius, increasing `perspective` reduces front/rear scale contrast, `depth: 0.4` flattens Z relative to `depth: 1`, and a larger mask feather produces a wider partial-opacity band.

- [ ] **Step 2: Run the focused test and observe failure**

Run: `pnpm vitest run src/app/logo-sphere-model.test.ts`

Expected: FAIL because `logo-sphere-model.ts` does not exist.

- [ ] **Step 3: Implement the pure public interface**

Create these exported types/functions:

```ts
export type SphereDistribution = "fibonacci" | "rings";
export type SpinAxis = "vertical" | "diagonal" | "horizontal";
export type SpherePoint = Readonly<{ x: number; y: number; z: number }>;
export type ProjectedLogo = Readonly<{
  index: number;
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
}>;

export function createSpherePoints(input: {
  count: number;
  distribution: SphereDistribution;
}): readonly SpherePoint[];

export function projectLogoSphere(input: LogoSphereProjectionInput): readonly ProjectedLogo[];
```

Use the golden-angle Fibonacci formula for the default distribution, explicit latitude rings for `rings`, stable integer clamping for visible count, a normalized camera quaternion from `view.orbit`, a full-cycle spin rotation from `loopProgress * spinAmount * 2π`, perspective `cameraDistance / (cameraDistance - z)`, back-to-front sort, and smoothstep-based rear/radial opacity.

- [ ] **Step 4: Run focused model tests**

Run: `pnpm vitest run src/app/logo-sphere-model.test.ts`

Expected: PASS.

### Task 3: Declare schema, readiness, and control ownership

**Files:**
- Modify: `src/app/app-identity.ts`
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-acceptance-data.ts`

- [ ] **Step 1: Rename the product**

Set `appIdentity.title` to `Logo Sphere` while preserving id `logos-grid` so persisted app identity remains stable.

- [ ] **Step 2: Author the product schema through `defineToolcraft`**

Declare:

```ts
canvas: {
  enabled: true,
  renderScale: true,
  sizing: "editable-output",
  size: { width: 1920, height: 1080 },
  upload: true,
},
media: { defaultAssets: logoSphereDefaultAssets },
panels: {
  controls: { title: "Logo Sphere", sections: [/* six sections below */] },
  timeline: { defaultDurationSeconds: 12, mode: "playback" },
},
```

Create ordinary sections `logos`, `sphere`, `fade-mask`, `motion`, `background`, and `image-export`, followed by sticky `panelActions`. Use built-ins only: `fileDrop`, `slider`, `segmented`, `switch`, `color`, `select`, `orientationGizmo`, and `panelActions`. Every resettable control gets `defaultValue`; every visible product control gets `applicability: "always"`. Mark `sphere.visibleCount` with `performanceRole: "workload"` and an integer 6–72 domain. Keep the hidden gizmo in the Sphere section with target `view.orbit`, `label: false`, and `keyframeable: false`.

- [ ] **Step 3: Declare product readiness and ownership before renderer code**

Switch readiness to product mode with:

```ts
exportIntent: {
  image: { mode: "toolcraft-default" },
  video: { mode: "not-requested" },
},
viewInteraction: {
  mode: "orbit",
  orientationTargets: ["view.orbit"],
  reason: "The editable logo sphere is a visible spatial scene rotated directly on canvas.",
},
```

Add typed interaction-ownership entries for canvas orbit, panel source collection, panel sphere appearance, panel fade, and timeline transport. Export `appControlSectionInventory` with exact entity ids/targets and grouping reasons for all six sections.

- [ ] **Step 4: Add acceptance rows for every visible entity**

Create stable ids for `logos.media`, `sphere.visible-count`, `sphere.appearance`, `sphere.orbit`, `fade.mask`, `motion.timeline`, `background.output`, `export.image`, `persistence.reload`, and `canvas.render-scale`. Use the fixed media, orientation, timeline-loop, background, image-artifact, persistence, and selected-backing-pixels recipes required by the local types.

- [ ] **Step 5: Run schema and acceptance unit checks**

Run: `pnpm vitest run src/app/app-schema.test.ts src/app/app-acceptance.*.test.ts`

Expected: PASS after every schema/acceptance contract mismatch is fixed at its source.

### Task 4: Compile the canonical render pipeline and performance envelope

**Files:**
- Create: `src/app/logo-sphere-pipeline.ts`
- Modify: `src/app/app-performance.ts`
- Test: `src/app/app-performance.*.test.ts`

- [ ] **Step 1: Define the pass inventory before renderer implementation**

Register one runtime id and two passes:

```ts
export const logoSpherePipelineRegistration = compileToolcraftRendererPipeline({
  runtimeId: "logo-sphere-canvas-2d",
  passes: [
    {
      id: "sphere-layout",
      executionLocation: "main-thread",
      frequency: "on-demand",
      invalidators: ["sphere.visibleCount", "sphere.distribution"],
      workloadDimensions: ["visible-logos"],
    },
    {
      id: "sphere-composite",
      executionLocation: "main-thread",
      frequency: "animation-frame",
      invalidators: ["timeline", "view.orbit", "sphere", "fade", "media", "canvas"],
      workloadDimensions: ["visible-logos"],
      quality: "retina",
    },
  ],
});
```

Use the exact runtime discriminants and required cost/lifecycle/cache fields from `renderer-technique.md`; do not weaken the declaration with casts.

- [ ] **Step 2: Assess the render plan**

Set renderer strategy to Canvas 2D, declare source and product representations, explain why DOM and WebGL were rejected, add one `visible-logos` schema-target envelope dimension with default 30 and interactive max 72, and call `assessToolcraftRenderPlan` with the same pipeline registration.

- [ ] **Step 3: Derive paths and compile fixtures**

Use `deriveToolcraftPerformancePaths` and `compileToolcraftPerformanceFixturePlan`. Add exactly one dimension adapter that writes and observes `sphere.visibleCount`. Declare exactly one scenario per derived path with the exact `coversTargets` returned by the path.

- [ ] **Step 4: Run structural performance tests only**

Run: `pnpm vitest run src/app/app-performance.*.test.ts`

Expected: PASS with no structural error; a protected kernel benchmark requirement may remain explicitly pending for later authorized measured work.

### Task 5: Implement the shared Canvas 2D renderer

**Files:**
- Create: `src/app/logo-sphere-renderer.ts`
- Extend: `src/app/logo-sphere-model.test.ts`

- [ ] **Step 1: Add failing draw-kernel tests with a recording context**

Assert that an empty image set performs no `drawImage`, N projected items perform N draws when all images are ready, media order determines cyclic image assignment, draw order is rear-to-front, and transforms are applied before drawing the corresponding image.

- [ ] **Step 2: Run the focused test and observe failure**

Run: `pnpm vitest run src/app/logo-sphere-model.test.ts`

Expected: FAIL because the renderer is absent.

- [ ] **Step 3: Implement a deterministic frame renderer**

Export:

```ts
export type LogoSphereImageSource = Readonly<{
  id: string;
  image: CanvasImageSource;
  transform: Readonly<{ rotation: number; flipX: boolean; flipY: boolean }>;
}>;

export function renderLogoSphereFrame(input: {
  context: CanvasRenderingContext2D;
  frame: Readonly<{ x: number; y: number; width: number; height: number }>;
  images: readonly LogoSphereImageSource[];
  projection: LogoSphereProjectionSettings;
  pixelRatio: number;
}): void;
```

Clear only the owned product frame, project and sort points, apply opacity with `context.globalAlpha`, draw each card centered at its projected coordinate, apply runtime image rotation/flip metadata around the card center, and restore the context after each item. Do not draw the configurable background; runtime preview/export owns it.

- [ ] **Step 4: Run focused tests**

Run: `pnpm vitest run src/app/logo-sphere-model.test.ts`

Expected: PASS.

### Task 6: Connect live preview, orbit, timeline, and export

**Files:**
- Create: `src/app/logo-sphere-canvas.module.css`
- Create: `src/app/logo-sphere-canvas.tsx`
- Modify: `src/app/app-composition.tsx`

- [ ] **Step 1: Build the live product canvas adapter**

Use only public runtime hooks:

```ts
useToolcraftProductSceneFrame();
useToolcraftMediaPresentationUrls(mediaAssets);
useToolcraftModelOrbitInteraction({ target: "view.orbit", hitTest, inertia });
useToolcraftPipelinePass(/* canonical pass */);
useToolcraftSelector(/* values, media, timeline, viewport interaction */);
```

The component renders one `<canvas data-toolcraft-product-output>` with a locally anchored CSS module class. Backing dimensions equal scene-frame CSS pixels × devicePixelRatio × runtime render scale. Image elements are created in effects, cached by media id/resource URL, and released on replacement/unmount. One requestAnimationFrame loop draws timeline playback and inertia, and coalesces non-essential playback while Toolcraft viewport interaction is active without changing playback state.

- [ ] **Step 2: Implement sphere hit testing and direct orbit**

The hit test accepts pointer-down only inside the current projected sphere silhouette. Primary hits rotate the shared `view.orbit` target; misses are untouched for Toolcraft pan. Use the runtime orientation hook instead of local angle controls. Feed the schema `motion.inertia` value into release damping.

- [ ] **Step 3: Add scene bounds and composition**

Export a scene-bounds provider that returns the centered sphere rectangle computed from spread and logo size. In finite mode the live canvas fills the runtime frame; in infinite mode it consumes the provider-resolved frame from `useToolcraftProductSceneFrame` and never reads dormant finite dimensions.

Set composition fields:

```ts
{
  schema: appSchema,
  canvasContent: LogoSphereCanvas,
  renderDefaultCanvasMedia: false,
  sceneBoundsProvider,
  rendererPipelineRegistration: logoSpherePipelineRegistration,
  exportRenderer: {
    baseFileName: "logo-sphere",
    renderFrame: renderLogoSphereExportFrame,
  },
}
```

The export callback resolves runtime media resources through the public export/runtime presentation boundary, awaits image readiness, reads `state.values`, `timelineProgress`, exact `frame`, and `pixelRatio`, and calls the same `renderLogoSphereFrame`. It does not allocate a canvas, encode, download, or create object URLs.

- [ ] **Step 4: Run typecheck and focused product tests**

Run: `pnpm typecheck`

Run: `pnpm vitest run src/app/logo-sphere-model.test.ts src/app/app-schema.test.ts`

Expected: PASS.

### Task 7: Add product browser proof and ownership inventory

**Files:**
- Create: `e2e/logo-sphere.spec.ts`
- Modify: `src/app/app-verification-impact.json`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Read Verification-phase docs one at a time**

Read `docs/toolcraft/acceptance-testing.md`, then `docs/toolcraft/performance.md`, each in its own command and to EOF, before writing browser proof.

- [ ] **Step 2: Add focused browser scenarios**

Using the protected public helpers, assert:

```ts
test("browser: logo sphere reacts to count, orbit, fade, playback, and reload", async ({ page }) => {
  // apply controls through their visible labels
  // sample non-empty product canvas pixels
  // drag inside the sphere and prove orientation/output changes
  // play the runtime timeline and prove distinct frames plus 0/1 seam equality
  // reload and prove exact persisted values/media/panels
});
```

Add the fixed media lifecycle recipe for default removal/reset/reorder/transforms, selected backing-pixel evidence for `interaction`, `playback`, and `steady`, and decoded 2K/4K/8K PNG/JPG artifact checks with background on/off.

- [ ] **Step 3: Declare exact verification ownership**

List every product production module. Classify the pure model, pipeline, renderer, and canvas adapter as `performance` owners with only their exact pass ids and nearest acceptance ids; classify schema/readiness/composition/assets as `functional` unless they directly change pass execution. Do not use blanket acceptance or pass lists.

- [ ] **Step 4: Replace the starter worklog**

Set `Mode: product`. Add one Decision Trail entry containing the exact request, Tier 4 classification, screenshot and logo-folder evidence, docs read, Canvas 2D technique matrix, playback timeline intent, no layers, image-only export intent, orbit and panel ownership decisions, control/state/output mapping, one bare-delivery narrative, and the explicit statement that measured performance is not authorized or run.

- [ ] **Step 5: Run targeted functional and browser feedback**

Run: `pnpm ai:check`

Run: `pnpm vitest run src/app/logo-sphere-model.test.ts src/app/app-schema.test.ts src/app/app-performance.*.test.ts`

Run: `pnpm test:browser --grep "logo sphere"`

Expected: all focused checks PASS.

### Task 8: Verify the coherent delivery and leave the app running

**Files:**
- Update only product-owned files implicated by failures.

- [ ] **Step 1: Run the protected delivery gate once**

Run: `npm run verify:delivery`

Expected: a first-delivery functional receipt covering complete product contracts, one production build, and full functional browser acceptance. No measured performance suite runs.

- [ ] **Step 2: Start the development server**

Run: `npm run dev`

Expected: Vite reports a local URL and remains running.

- [ ] **Step 3: Use the browser workflow for the final real-app pass**

Open the reported URL and verify the default 30-card sphere, panel fit, direct drag, inertial release, gizmo, timeline play/scrub, visible-count extremes, mask extremes, upload/reorder/remove/reset, Infinity toggle/restoration, zoom/pan, and Export PNG. Store any screenshots under `.toolcraft/browser-artifacts/`.

- [ ] **Step 4: Deliver with the exact evidence level**

Report that the product is implemented and passed functional delivery. State explicitly that measured performance was not run because the request did not authorize a targeted performance iteration or full audit. Include clickable links to the design, plan, and primary app files plus the live local URL.

## Plan self-review

- Spec coverage: source media, projection, perspective scale, count, spread, fade mask, canvas orbit, inertia, timeline loop, background, Infinity, export, persistence, render scale, acceptance, and worklog all map to tasks above.
- Placeholder scan: no `TBD`, `TODO`, `implement later`, or unspecified test requirement remains.
- Type consistency: `sphere.visibleCount`, `view.orbit`, `logos.sources`, pipeline pass ids `sphere-layout` / `sphere-composite`, and acceptance ids are named once and reused consistently.
- Scope: the plan intentionally excludes layers, video export, per-logo editing, and WebGL effects as stated in the approved design.

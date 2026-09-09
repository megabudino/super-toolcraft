# Surface Perimeter Bend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an adjustable, smoothly downward-bent Terrain perimeter with an exact object-free placement band shared by every vegetation and scan layer.

**Architecture:** A focused `grass-surface-bend` module owns normalization, curve evaluation, and the inner placement shape. Terrain geometry uses that profile, while Tall, Lawn, scans, rocks, and boulder use the derived inner shape. A dedicated retained ground-geometry pipeline pass separates Terrain rebuilding from Tall layout work and is shared by preview and export.

**Tech Stack:** TypeScript, React, Three.js/WebGL, Toolcraft schema/runtime pipeline, Vitest, Playwright.

---

Verification tier: Tier 3
Reason: changes persisted controls, Terrain mesh construction, all placement domains, renderer invalidation, hit testing, shadows, and exported pixels.
Run: targeted bend/schema/acceptance Vitest; render-plan/typecheck/AI checks; focused Chromium bend test; exact impact-derived `npm run verify:delivery`; `npm run dev`.
Skip: full performance refresh because no performance complaint or optimization request exists and the change adds no new workload dimension.

This standalone folder has no `.git`, so commit steps are intentionally omitted; each task ends with a focused passing check instead.

### Task 1: Specify bend math and control state with failing tests

**Files:**
- Create: `src/app/grass/grass-surface-bend.test.ts`
- Test: `src/app/grass/grass-field-shape.test.ts`

- [x] **Step 1: Add a failing schema/settings test**

Assert the five exact targets, defaults, bounds, and `visibleWhen` rules through `appSchema`, then read a Toolcraft state through `readGrassSettings` and assert normalized values:

```ts
expect(findControl("surface.bendEnabled")).toMatchObject({
  defaultValue: true,
  label: "Include",
  type: "switch",
});
expect(findControl("surface.bendDepth")).toMatchObject({
  defaultValue: 0.75,
  max: 2.5,
  min: 0,
  step: 0.05,
  unit: "m",
  visibleWhen: { equals: true, target: "surface.bendEnabled" },
});
expect(findControl("surface.bendWidth")).toMatchObject({
  defaultValue: 18,
  max: 40,
  min: 5,
  step: 1,
  unit: "%",
});
expect(settingsWith().surface.bend).toEqual({
  depth: 0.75,
  enabled: true,
  roundness: 0.65,
  smoothness: 0.85,
  width: 0.18,
});
```

- [x] **Step 2: Add failing pure-profile tests**

Import `getGrassSurfaceBendOffset`, `getGrassSurfacePlacementShapeSettings`, and `isGrassSurfaceBendPoint`. Prove the center and inner boundary are unchanged, the outer edge reaches `-depth`, Roundness changes the middle profile, Smoothness changes the middle profile, disabled mode is flat, and the placement shape scales width/depth by `1 - bend.width`.

- [x] **Step 3: Run the tests and confirm the intended failure**

Run:

```bash
npx vitest run src/app/grass/grass-surface-bend.test.ts src/app/grass/grass-field-shape.test.ts
```

Expected: FAIL because the module, state, and controls do not exist.

### Task 2: Implement normalized bend state and the Surface Bend section

**Files:**
- Create: `src/app/grass/grass-surface-bend.ts`
- Modify: `src/app/grass/grass-settings-types.ts`
- Modify: `src/app/grass/grass-defaults.ts`
- Modify: `src/app/grass/grass-values.ts`
- Modify: `src/app/grass/grass-appearance-controls.ts`
- Modify: `src/app/grass/grass-controls.ts`
- Modify: `src/app/app-schema.ts`
- Test: `src/app/grass/grass-surface-bend.test.ts`

- [x] **Step 1: Add the typed settings and defaults**

Add this nested state to `GrassSettings.surface`:

```ts
bend: Readonly<{
  depth: number;
  enabled: boolean;
  roundness: number;
  smoothness: number;
  width: number;
}>;
```

Add exact persisted defaults:

```ts
"surface.bendDepth": 0.75,
"surface.bendEnabled": true,
"surface.bendRoundness": 65,
"surface.bendSmoothness": 85,
"surface.bendWidth": 18,
```

Normalize Depth to `0–2.5`, Width to `0.05–0.4`, and Roundness/Smoothness to `0–1` in `readGrassSettings`.

- [x] **Step 2: Implement the focused bend module**

Expose these stable functions:

```ts
export function getGrassSurfaceBendOffset(
  relativeDistance: number,
  bend: GrassSettings["surface"]["bend"],
): number;

export function getGrassSurfacePlacementShapeSettings(
  settings: Pick<GrassSettings, "field" | "surface" | "terrain">,
): GrassFieldShapeSettings;

export function isGrassSurfaceBendPoint(
  x: number,
  z: number,
  settings: Pick<GrassSettings, "field" | "surface" | "terrain">,
): boolean;
```

Use `t = clamp((distance - (1 - width)) / width, 0, 1)`, blend linear `t` with quintic smootherstep by Smoothness, then apply a Roundness exponent from `2.4` at 0% to `0.65` at 100%. Return negative Depth times the profile. Disabled mode returns zero and the original Field shape.

- [x] **Step 3: Add built-in controls and section order**

Export `grassSurfaceBendSection` from `grass-appearance-controls.ts` with `Include`, `Depth`, `Width`, `Roundness`, and `Smoothness`. Use built-in switch/slider schemas, `semanticGroup: "perimeter-bend"`, and `visibleWhen` on the four sliders. Insert the section directly after `grassSurfaceSection` and before `grassSurfaceFadeSection`.

- [x] **Step 4: Advance persistence for the new product state**

Advance the persistence key/version to `v20`/`20` so the five new Surface Bend
targets form one explicit product-state generation. The normal Toolcraft
`values`, `canvas`, `media`, `panels`, and `timeline` policy remains unchanged.

- [x] **Step 5: Run the focused state test**

Run:

```bash
npx vitest run src/app/grass/grass-surface-bend.test.ts
```

Expected: the schema, normalization, profile, and placement-shape assertions pass.

### Task 3: Deform Terrain and exclude every placed entity

**Files:**
- Modify: `src/app/grass/grass-geometry.ts`
- Modify: `src/app/grass/grass-layout.ts`
- Modify: `src/app/grass/grass-scan-layout.ts`
- Modify: `src/app/grass/grass-settings-signatures.ts`
- Test: `src/app/grass/grass-surface-bend.test.ts`
- Test: `src/app/grass/grass-placement-candidates.test.ts`
- Test: `src/app/grass/grass-scan-layout.test.ts`

- [x] **Step 1: Add failing geometry and placement assertions**

Build default and disabled ground geometries, sample center/inner/outer vertices, and assert exact downward displacement plus finite normals. Build Tall, Lawn, all five scan layouts, and boulder layout with a wide bend; assert each root or footprint lies inside `getGrassSurfacePlacementShapeSettings(settings)`.

- [x] **Step 2: Apply bend displacement to Terrain vertices**

In `createGrassGroundGeometry`, compute shared Field relative distance for each mapped `(x, z)`, then set:

```ts
const surfaceHeight = getGrassReferenceSurfaceHeight(x, z, settings) - 0.012;
const bendOffset = getGrassSurfaceBendOffset(
  getGrassFieldRelativeDistance(x, z, fieldShape),
  settings.surface.bend,
);
positions.setY(index, surfaceHeight + bendOffset);
```

Keep current UV/UV1 behavior and recompute normals after all vertices move.

- [x] **Step 3: Route all layouts through the inner placement shape**

Replace the placement-only calls to `getGrassFieldShapeSettings(settings)` in `createGrassLayout`, `createGrassScanLayout`, and `createGrassBoulderLayout` with `getGrassSurfacePlacementShapeSettings(settings)`. Keep ground geometry on the original full shape.

- [x] **Step 4: Include bend occupancy in memoization keys**

Add `bendEnabled` and `bendWidth` to Tall, Lawn, and scan layout keys. Add all five bend values to the separate ground-geometry key introduced in Task 4. Depth, Roundness, and Smoothness must not enter vegetation/scan keys.

- [x] **Step 5: Run geometry and layout tests**

Run:

```bash
npx vitest run src/app/grass/grass-surface-bend.test.ts src/app/grass/grass-placement-candidates.test.ts src/app/grass/grass-scan-layout.test.ts
```

Expected: all bend geometry and no-placement assertions pass without changing exact requested layer count semantics.

### Task 4: Add a canonical retained ground-geometry pass

**Files:**
- Modify: `src/app/app-renderer-pipeline-types.ts`
- Modify: `src/app/app-renderer-pipeline.ts`
- Modify: `src/app/grass/grass-render-targets.ts`
- Modify: `src/app/grass/grass-layout-pass-inputs.ts`
- Modify: `src/app/grass/grass-scene.ts`
- Modify: `src/app/grass/grass-output.tsx`
- Modify: `src/app/grass/grass-export.ts`
- Modify: `src/app/grass/grass-settings-signatures.ts`
- Modify: `src/app/app-performance.ts`
- Test: `src/app/app-performance.gates.test.ts`
- Test: `src/app/grass/grass-surface-bend.test.ts`

- [x] **Step 1: Add exact target groups and a ground key**

Declare:

```ts
export const grassSurfaceBendPlacementTargets = [
  "surface.bendEnabled",
  "surface.bendWidth",
] as const;

export const grassSurfaceBendGeometryTargets = [
  ...grassSurfaceBendPlacementTargets,
  "surface.bendDepth",
  "surface.bendRoundness",
  "surface.bendSmoothness",
] as const;
```

Include placement targets in Tall/Lawn/scan layout inputs. Export `getGrassGroundGeometryKey(settings)` using Field shape/dimensions, Terrain settings, and all bend settings.

- [x] **Step 2: Separate ground rebuilding from Tall layout**

Make `GrassSceneRenderer.updateGround(settings)` public and return the geometry key/signature. Remove `this.updateGround(settings)` from `updateTallLayout`. Call `updateGround` explicitly in both still/video export scene setup paths before rendering.

- [x] **Step 3: Register `grass-ground-geometry-build`**

Add the pass contract and pipeline pass:

```ts
{
  cacheKey: grassGroundGeometryInputTargets,
  cost: {
    dimensions: ["terrain-octaves"],
    frequency: "interaction",
    relationship: "linear",
  },
  id: "grass-ground-geometry-build",
  inputs: grassGroundGeometryInputTargets,
  invalidatedBy: grassGroundGeometryInputTargets,
  kind: "vector-build",
  lifecycle: { cache: "memoized", resourceScope: "renderer" },
  output: "intermediate",
  quality: "full",
  runsOn: "main",
}
```

Add it to initial render, Field/Terrain/bend invalidation, scene-render inputs, export-frame inputs, `allPassIds`, `grassPipelinePasses`, and runtime id `grass-live-pbr-clumps-webgl-v20`.

- [x] **Step 4: Execute the pass once per geometry key in preview**

In `GrassOutput`, track `groundGeometryKeyRef`, run the pass before layouts when the key changes, and pass exact Field, Terrain, and bend values as pass inputs. Include the key in non-timeline invalidation and published diagnostics.

- [x] **Step 5: Keep the performance scenario actionable**

When a canonical control-drag path includes `surface.bendDepth`, choose `Depth` as `controlLabel`; when it includes `surface.bendWidth`, choose `Width`. Update the renderer technique risk list with the bounded retained ground rebuild and object-free placement-domain rebuild.

- [x] **Step 6: Run render-plan and type checks**

Run:

```bash
npx vitest run src/app/app-performance.gates.test.ts src/app/grass/grass-surface-bend.test.ts
npm run typecheck
```

Expected: render-plan assessment has no errors or new kernel benchmark requirement; TypeScript passes.

### Task 5: Add acceptance inventory and protected browser proof

**Files:**
- Create: `src/app/app-acceptance-surface-bend-data.ts`
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/grass/grass-render-diagnostics.ts`
- Create: `e2e/grass-surface-bend.spec.ts`
- Test: `src/app/app-acceptance.base-coverage.test.ts`
- Test: `src/app/app-acceptance.section-dependencies.test.ts`

- [x] **Step 1: Declare five acceptance rows and section ownership**

Create control rows with ids `grass.surface-bend-enabled`, `grass.surface-bend-depth`, `grass.surface-bend-width`, `grass.surface-bend-roundness`, and `grass.surface-bend-smoothness`. Use `evidence: "product-output"`, the shared browser test name `Surface Bend deforms the perimeter and keeps every layer inside`, and `visibilityCoverage: ["hidden", "visible"]` on the four gated sliders.

Add this inventory entry after `Surface`:

```ts
{
  entity: "Downward Terrain perimeter and bend-free placement area",
  groupingReason:
    "Enable, depth, width, profile roundness, and smoothing author one continuous edge while Width defines the exact no-placement band for every layer.",
  targets: [
    "surface.bendEnabled",
    "surface.bendDepth",
    "surface.bendWidth",
    "surface.bendRoundness",
    "surface.bendSmoothness",
  ],
  title: "Surface Bend",
  workflowStage: "Composite",
}
```

- [x] **Step 2: Publish stable bend diagnostics**

Add data attributes for enabled state, ground geometry key, inner relative radius, minimum ground height, and maximum Tall/Lawn/scan placement relative distance. Diagnostics must be derived from the real retained geometry/layouts, not copied directly from control values.

- [x] **Step 3: Write the protected browser test**

Use `prepareGrassSession`, `expectToolcraftConditionalControlVisibility`, and `expectToolcraftProductObservableToChange`. Toggle Include off/on to prove visibility, then edit each slider through the real numeric edit affordance. For every acceptance id, attach target-scoped product-observable evidence. Assert the outer minimum height drops, all published placement distances stay below the inner radius, and orbit/zoom do not change the geometry key.

- [x] **Step 4: Run focused acceptance checks**

Run:

```bash
npx vitest run src/app/app-acceptance.base-coverage.test.ts src/app/app-acceptance.section-dependencies.test.ts src/app/grass/grass-surface-bend.test.ts
npx playwright test e2e/grass-surface-bend.spec.ts --project=chromium
```

Expected: all five targets have automated and protected browser evidence; bend pixels and diagnostics change persistently; placement remains inside.

### Task 6: Complete impact inventory and decision trail

**Files:**
- Modify: `src/app/app-performance-impact.json`
- Modify: `docs/toolcraft/agent-worklog.md`
- Modify: `docs/superpowers/plans/2026-07-23-surface-perimeter-bend.md`

- [x] **Step 1: Classify every added/changed production module**

Add the new acceptance file as `functional`. Add `grass-surface-bend.ts` as `performance` owning `grass-ground-geometry-build`, both grass layout passes, every scan layout pass, scene render, and export frame. Add `grass-ground-geometry-build` to the exact existing module ownership entries that construct, key, execute, or render the retained Terrain geometry; do not assign it to unrelated control/metadata modules.

- [x] **Step 2: Record the Toolcraft decision trail**

Add a Tier 3 worklog entry containing the Russian request, selected routes, chosen mesh deformation, rejected skirt and shader-only approaches, five state/output mappings, empty-band behavior, new pass cost/lifecycle, targeted checks, delivery result, and remaining Surface Fade interaction note.

- [x] **Step 3: Mark completed plan checkboxes after each passing result**

Update only completed checkboxes and the final Run result; do not claim delivery before the protected receipt exists.

### Task 7: Run the delivery boundary once and start the app

**Files:**
- Verify: complete workspace

- [x] **Step 1: Run code-health and focused regression checks**

Run:

```bash
npm run ai:check
npx vitest run src/app/grass/grass-surface-bend.test.ts src/app/grass/grass-placement-candidates.test.ts src/app/grass/grass-scan-layout.test.ts src/app/app-performance.gates.test.ts src/app/app-acceptance.base-coverage.test.ts src/app/app-acceptance.section-dependencies.test.ts
npm run typecheck
```

Expected: all commands pass.

- [x] **Step 2: Read the impact-derived delivery requirement without running extra aggregate gates**

Run `npm run verify:delivery -- --tier=3` once the implementation and focused browser test are stable. If the runner requests exact unit/browser/performance selectors, rerun the same delivery command with only those printed exact selectors.

- [ ] **Step 3: Confirm the protected delivery receipt**

Expected: integrity, selected unit/browser proof, affected performance path if required, build, and receipt pass. Do not run `verify:quick`, `verify:perf`, or `verify:final` for unchanged source.

- [x] **Step 4: Start or reuse the verified app server**

Run:

```bash
npm run dev
```

Expected: the saved Toolcraft port serves this app identity and the terminal reports the verified local URL. Leave the server running and report the URL.

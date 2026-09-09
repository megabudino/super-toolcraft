# Lossless Grass Render Optimization Implementation Plan

Date: 2026-07-23

Status: revised after completed Surface Bend and fourth thermo-nuclear architecture review

Spec: `docs/superpowers/specs/2026-07-22-lossless-grass-render-optimization-design.md`

## Program Rules

- Preserve exact textures, counts, geometry, PBR, selected render scale, Tall and
  Lawn distribution maps, Current/Clover colors, coordinated generated palette,
  Ground Shadow, Surface Bend geometry and placement boundaries, masks, HDRI,
  camera, and full-density still output.
- Create one `GrassRenderSession` in `app-composition.tsx` and inject it into the
  canvas output and panel-action handler; do not add a registry or try to
  reacquire a cached retained resource through another pass execution.
- Make typed renderer-pipeline pass inputs the only invalidation authority.
  Delete parallel JSON settings signatures, component key refs, and duplicated
  target lists instead of moving them into the session.
- Keep every renderer pass executable and measurable; shadow refresh is a mode of
  the real frame render, not a pretend pass.
- Do not begin a later delivery batch until the previous batch has a passed
  protected delivery receipt. A documented external blocker stops the program;
  it is not permission to run a later targeted delivery without a first-stable
  receipt.
- Treat the retained field renderer and the four `grassNoisePreview` WebGL2
  controls as separate context owners. The one-context invariant applies to the
  field preview plus still export, not to product control previews.
- Do not edit `src/toolcraft`, protected configs, or signed acceptance harnesses.

## Stabilization Gate — Freeze The Current Product Before Optimization

Verification tier: Tier 4 structural stabilization followed by Tier 3 visual
characterization

Reason: independent Lawn distribution, Current/Clover colors, coordinated world
palettes, Ground Shadow, Scene Setup/Scratch, and Surface Bend are now implemented.
Surface Bend deliberately established persistence generation `v20`, but the
current canonical pipeline still over-invalidates ground geometry, duplicates one
scene dependency, and omits ground geometry from export ownership. The product
also has no durable first-stable delivery receipt. Those correctness and
maintainability gaps must be closed before an optimization baseline is trusted.

Files:

- `src/app/app-acceptance-data.ts`
- focused `src/app/app-acceptance-*-data.ts` modules
- `src/app/app-renderer-pipeline.ts`
- `src/app/app-renderer-pass-definitions.ts` (new cohesive pass owner)
- `src/app/app-renderer-interactions.ts` (new cohesive invalidation-policy owner)
- `src/app/app-performance.ts`
- `src/app/grass/grass-performance-envelope.ts` (new)
- `src/app/grass/grass-performance-scenarios.ts` (new)
- `src/app/grass/grass-render-targets.ts`
- `e2e/app-performance-path-adapters.ts`
- focused product-owned performance adapter modules under `e2e/`
- `src/app/grass-product.test.ts`
- focused product tests under `src/app/`
- `src/app/grass/grass-values.ts`
- `src/app/grass/grass-value-readers.ts` (new normalization primitives)
- `src/app/grass/grass-layer-settings-values.ts` (new)
- `src/app/grass/grass-scan-settings-values.ts` (new)
- `src/app/grass/grass-surface-settings-values.ts` (new)
- `src/app/grass/grass-wind-settings-values.ts` (new)
- `src/app/grass/grass-scene.ts`
- `src/app/grass/grass-scene-lighting.ts` (new cohesive retained lighting owner)
- current Surface Bend, Ground Shadow, pipeline, persistence, and worklog tests

Actions:

1. Treat Surface Bend and persistence `v20`/`20` as the current product baseline.
   Do not roll back to `v19`: that would ignore authored `v20` state and revive an
   older storage generation. Correct the optimization spec and persistence
   fixtures to start from real `v20` state.
2. Before restructuring `grass-scene.ts`, capture a narrow fixed-state safety
   image and exact diagnostics for the current default scene. This is a temporary
   behavior guard, not the canonical performance baseline.
3. Repair the canonical pipeline before measuring it:
   - Tall distribution invalidates Tall layout and preview only, never ground
     geometry;
   - `grass-ground-geometry-build` occurs exactly once in scene-render
     inputs/invalidators;
   - `grass-export-frame` explicitly consumes and is invalidated by
     `grass-ground-geometry-build`;
   - focused tests assert exact inputs and `mustNotInvalidate` behavior.
4. Split `app-renderer-pipeline.ts` into pass definitions, interaction policies,
   and the small canonical registration. Use one typed policy constructor that
   derives `mustNotInvalidate` as the complement of `invalidates`; do not repeat
   hand-maintained pass arrays.
5. Split `app-performance.ts` into a numeric workload-envelope owner and a
   scenario owner. Replace the nested target-string label conditional with a
   typed target-to-control-label table plus explicit interaction fallbacks.
6. Split `app-acceptance-data.ts` by existing product entities, split performance
   adapters by layout/scene/export ownership, and split `grass-product.test.ts`
   by behavior. Do not move or duplicate protected evidence helpers.
7. Turn `grass-values.ts` into a small settings composer. Move primitive schema
   normalization, layer/gradient parsing, scan/boulder parsing, surface/terrain
   parsing, and wind parsing into the named domain owners. Preserve exact defaults
   and bounds; do not create re-export-only wrappers.
8. Extract one cohesive retained scene-lighting/environment resource from
   `grass-scene.ts`; do not create pass-through files or change pixels, resource
   URLs, renderer ownership, or invalidation.
9. Compare the stabilization result with the safety image/diagnostics, then make
   TypeScript, code health, product boundary, focused product tests, and the
   production build green.
10. Record the exact current control order and settings inventory, including Scene
   Setup, Surface Bend, Ground Shadow, Lawn Distribution, Surface colors,
   Background, Image Export, Video Export, and the still-present Timeline.
11. Run the bare first-stable delivery gate for the stabilized current product.
    It must mint the durable delivery and full-performance baseline receipts
    before the custom raster Baseline Gate or optimization implementation begins.

Gate:

```bash
npm run typecheck
npm run ai:check
npx vitest run \
  src/app/app-schema.test.ts \
  src/app/grass-product.test.ts \
  src/app/grass/grass-ground-shadow.test.ts \
  src/app/grass/grass-surface-bend.test.ts \
  src/app/grass/grass-layout-distribution.test.ts \
  src/app/grass/grass-randomizer.test.ts \
  src/app/app-performance.gates.test.ts
npm run build
npm run verify:delivery
```

Do not enter the Baseline Gate while any source-health failure, false pipeline
edge, unexplained safety-fixture delta, protected-runner blocker, or missing
first-stable receipt remains.

## Baseline Gate — Record Outcomes Before Refactoring

Verification tier: Tier 3 diagnostic preparation

Reason: this adds test evidence around the existing WebGL renderer without
changing product behavior.

Files:

- `e2e/grass-render-optimization.spec.ts` (new)
- `e2e/fixtures/grass-render-baseline/` (new fixed-phase pixels/signatures)
- `src/app/grass/grass-render-baseline.test.ts` (new)
- `e2e/app-kernel-benchmarks.ts`

Actions:

1. Define three explicit fixtures from schema state rather than whatever happens
   to be in localStorage:
   - reset all-enabled default;
   - authored stress state with intentionally different Tall/Lawn maps,
     contrasting Current/Clover colors, visible non-default Ground Shadow, and a
     fixed coordinated world palette, plus non-default Surface Bend depth, width,
     roundness, and smoothing;
   - persisted Scratch state created through the real `Scratch` action and a real
     reload, with Surface visible and every other content layer hidden.
2. Capture Static preview RGBA at render scales 1 and 2 for default and authored
   stress settings.
3. Capture one active-wind RGBA frame at an explicit progress through the
   executable renderer benchmark, before Timeline removal.
4. Record exact independent Tall/Lawn map settings and layout signatures,
   per-scan counts, authored/detailed/lightweight/clump counts, Ground Shadow
   diagnostics, Surface Bend settings, ground-geometry pass inputs/generation and
   bounds, placement exclusion diagnostics, Current/Clover colors, coordinated
   palette, draw calls, triangles, real shadow decision, retained resources, and
   texture dimensions.
5. Count the retained field `WebGLRenderer` separately from the four custom
   `grassNoisePreview` WebGL2 contexts. Baseline the global total, but never use it
   to force control previews into `GrassRenderSession`.
6. Record cold preparation separately from ten warm cached-shadow frames and ten
   warm refreshed-shadow frames. Do not mix startup with frame timing.
7. Record the protected Chromium build, WebGL vendor/renderer identity, reset
   all-enabled cold preparation, and real persisted Scratch cold preparation.
   These measurements decide whether optional asset-repository work exists at all.
8. Exercise `Randomize` once from reset state and `Scratch` once from the generated
   state. Record command count, pipeline executions, final palette provenance,
   independent layouts, and frame coalescing so a multi-command action cannot
   accidentally render partial intermediate scenes after the refactor.
9. Implement the raster comparator: dimensions exact; at most 0.1% of pixels may
   exceed a 2/255 channel delta; mean absolute channel delta <= 0.25/255.
10. Instrument outcomes rather than implementation spelling: pipeline counters,
   MutationObserver writes, WebGL context creations, and live shader compilation.

Gate:

```bash
npx vitest run src/app/grass/grass-render-baseline.test.ts
pnpm verify:kernel
npx playwright test e2e/grass-render-optimization.spec.ts --project=chromium
```

Do not edit optimization production code until this evidence is saved and green.
The current-source kernel receipt must replace the existing stale receipt after
all stabilization changes.

## Delivery Batch 1 — One Render Session And A Smaller Hot Path

Verification tier: Tier 4

Reason: behavior-preserving restructuring of renderer ownership, frame
invalidation, shader execution, diagnostics, and canonical performance passes.
Timeline and both export actions remain present in this batch so visual/performance
changes are isolated from product-model changes.

### Task 1.1 — Make App Composition Own One Render Session

Files:

- `src/app/grass/grass-render-session.ts` (new)
- `src/app/grass/grass-render-session.test.ts` (new)
- `src/app/app-composition.tsx`
- `src/app/grass/grass-output.tsx`
- `src/app/grass/use-grass-simulation-interactions.ts`
- `src/app/grass/grass-surface-tilt.ts`
- `src/app/app-renderer-pipeline-types.ts`
- `src/app/app-renderer-pipeline.ts`

Actions:

1. Construct one `GrassRenderSession` in `app-composition.tsx` and pass it to
   `<GrassOutput session={...} />`. This explicit app-owned dependency is not a
   module registry and is independently constructible in tests.
2. Keep `grass-scene-resource` retaining `GrassSceneRenderer`. Canvas size and
   render scale resize it; only session detach or pipeline disposal retires its
   generation.
3. Model the session as `detached | ready | exporting | detaching`, not a cluster
   of nullable fields and booleans.
4. Move frame backpressure, queued-frame state, scheduling, latest immutable
   snapshot, and changed-diagnostics diffing from React into the session.
5. Keep `GrassOutput` responsible for Toolcraft state subscription, canvas/host
   mounting, `ResizeObserver`, orbit/pointer adapters, applying typed diagnostics
   patches, and attach/detach calls.
6. Make the scene-resource disposer call the session's async retirement barrier;
   it must wait for active work before disposing GPU state.
7. During this batch, Timeline progress may still arrive through React. React may
   request a session frame, but it owns no RAF queue, backpressure, or local
   animation state.
8. Keep every `grassNoisePreview` lifecycle inside its custom control. The session
   owns only the retained field canvas and must not become a cross-context manager.
9. Keep the existing singleton panel-action handler during Batch 1 because legacy
   image/video export still owns temporary renderers. Inject the session into the
   handler only when Batch 2 replaces still export; do not add an unused dependency.
10. Delete the fixed 3000 ms scene delay and the chain of unconditional 16 ms
    stage sleeps. On initial attach, start independent environment and scan-source
    preparation concurrently, execute each required CPU pass once, and publish one
    complete frame. One generation token cancels stale completion after detach or
    replacement. If a cooperative yield is still required by measured
    responsiveness, the session owns one bounded yield point rather than delay
    constants scattered between passes.

Acceptance:

- one app session and one retained live-preview `WebGLRenderer` exist; legacy
  export may still create its existing temporary renderer until Batch 2;
- Timeline state can update progress, but only the session schedules/coalesces the
  actual draw;
- `Randomize` and `Scratch` publish only a final coalesced field frame, never a
  visible partial command-by-command scene;
- unmount disposes exactly once;
- `grass-output.tsx` is <=250 lines, the session is <=350 lines, and output +
  session + scene are <=1050 lines combined.

### Task 1.2 — Split Static Synchronization From Real Frames

Files:

- `src/app/grass/grass-scene.ts`
- `src/app/grass/grass-scene-material-settings.ts`
- `src/app/grass/grass-settings-signatures.ts` (delete)
- `src/app/grass/grass-layout-pass-inputs.ts` (replace)
- `src/app/grass/grass-render-pass-inputs.ts` (new canonical pass selectors)
- `src/app/grass/grass-scan-layout.ts`
- `src/app/grass/grass-ground-resource.ts`
- `src/app/grass/grass-ground-shadow.ts`
- `src/app/grass/grass-surface-bend.ts`
- `src/app/grass/grass-distribution-values.ts`
- `src/app/grass/grass-render-session.ts`
- `src/app/grass/grass-scene.test.ts` (focused additions)

Actions:

1. Replace monolithic `render` with `syncStaticScene` and `renderFrame`.
2. Make `grass-render-pass-inputs.ts` the sole typed projection from
   `GrassSettings` into ground, Tall, Lawn, scan, static-sync, and frame-render
   pass inputs. Assert that each selector's exact keys match its registered pass
   inputs. Do not duplicate those fields in `GrassOutput` or the session.
3. Delete `getGrassRenderKey`, `getGrassGroundGeometryKey`,
   `getGrassLayoutKey`, `getLawnLayoutKey`, `getGrassScanLayoutKey`, their JSON
   serialization, and all component/session key refs. State changes submit the
   latest immutable snapshot once; pipeline cache execution is the only decision
   about whether a pass callback runs. Diagnostics use returned layout signatures
   and generation counters, not recreated input signatures.
4. Give each retained scene resource a narrow typed static snapshot and a direct
   `sync` operation. `syncStaticScene` calls a fixed straight-line resource list
   and aggregates changed flags; it does not grow one giant conditional or one
   all-settings key.
5. Apply environment, camera, material, visibility, texture, Current/Clover
   colors, coordinated palette, Ground Shadow, background, and surface settings
   only when their resource-local typed snapshot changes.
6. Move `GrassGroundShadowResource.update` and its diagnostics allocation out of
   every frame. Its typed snapshot contains Ground Shadow controls plus Field
   dimensions, shape, irregularity, Terrain seed, and Surface visibility.
7. Keep Surface Bend geometry as its own retained invalidation path. A Bend edit
   rebuilds `grass-ground-geometry-build` and then the affected placement layouts;
   wind, lighting, material, and color edits rebuild neither. Preserve the exact
   deformed Terrain bounds and placement-exclusion contract recorded at baseline.
8. Keep one retained Terrain mesh identity. Ground rebuild swaps and disposes only
   its geometry; it does not remove/recreate the mesh or expose nullable mesh
   state after scene initialization.
9. Keep independent Tall, Lawn, and per-scan layout invalidation separate from
   static synchronization. A Tall-map edit must not rebuild Lawn/scans; a
   Lawn-map edit must not rebuild Tall/scans.
10. Retain reusable Three.js vectors/colors and frame diagnostics in the scene;
   remove per-frame arrays, settings objects, JSON payloads, and signature
   strings.
11. Return typed synchronization/frame results used by both diagnostics and the
   renderer pipeline.

Acceptance:

- ten moving frames increment only frame-render counters;
- Ground Shadow, surface colors, distribution settings, visibility, and
  coordinated palette perform zero repeated static writes during those frames;
- Surface Bend geometry and dependent placement layouts perform zero work during
  wind-only, camera-only, lighting-only, and material-only frames;
- Static after settle schedules no frame;
- Tall/Lawn/scan layout and static control invalidation execute only their
  declared owner;
- no settings JSON serialization or parallel component key ref participates in
  invalidation;
- fixed pixels/counts remain within the baseline contract.

### Task 1.3 — Evaluate Wind Once And Preserve Legacy Export

Files:

- `src/app/grass/grass-wind-material.ts`
- `src/app/grass/grass-material.ts`
- `src/app/grass/grass-scan-wind.ts`
- `src/app/grass/grass-wind-material.test.ts`
- `src/app/grass/grass-scene.ts`
- `e2e/grass-render-optimization.spec.ts`

Actions:

1. Compute one shared vertex-force value before position/normal chunks in
   generated Tall/Lawn and scan foliage shaders.
2. Add a uniform-coherent zero-force return before expensive hash/trigonometric
   work.
3. Keep custom-depth deformation on the identical force function and phase.
4. Render the recorded fixed phases and compare pixels/counts.
5. Keep `preserveDrawingBuffer: true` while the legacy image/video export waits a
   later animation frame before copying the canvas. Record it as a Batch 2 removal
   precondition; do not create a transient broken export state.

Acceptance:

- live compiled color shaders execute one force evaluation per vertex;
- Static takes the zero-force path;
- depth/color geometry stays aligned;
- no shader errors, raster tolerance passes, and current image/video exports remain
  unchanged in this behavior-preserving batch.

### Task 1.4 — Make Pipeline Passes Match Executable Work

Files:

- `src/app/app-renderer-pipeline.ts`
- `src/app/app-renderer-pipeline-types.ts`
- `src/app/app-performance.ts`
- `src/app/app-performance-impact.json`
- `e2e/app-kernel-benchmarks.ts`
- `e2e/app-performance.spec.ts`

Actions:

1. Add executable `grass-static-sync` and rename/retain one executable
   `grass-frame-render` pass.
2. Return `shadowRefreshed: boolean` from the real frame result, but do not add
   string `shadowMode` to the numeric workload envelope and do not create two
   scenarios for one canonical path. The one canonical frame scenario measures
   the worst-case forced-refresh frame against its protected budget; the cached
   warm sample remains a separately reported diagnostic in the raster benchmark.
   Do not declare a separate shadow pass.
3. Keep timeline playback/scrub paths for this batch and prove they invalidate
   frame render only.
4. Retain the independent `grass-layout-build`, `grass-lawn-layout-build`, and
   per-scan layout passes. Do not collapse them into one generic layout pass.
5. Retain the executable `grass-ground-geometry-build` pass and its exact bend
   inputs. Do not hide ground deformation inside static sync or frame render.
6. Keep `grass-noise-preview` a separate custom-control raster pass and model its
   four reachable preview owners without attributing their contexts to the field
   session.
7. Model cold resource preparation separately from warm frames.
8. Add one Scene Setup interaction fixture proving `Randomize` and `Scratch`
   coalesce without rebuilding unrelated retained resources.
9. Update impact ownership for every touched production module.

Batch 1 focused checks:

```bash
npx vitest run \
  src/app/grass/grass-render-baseline.test.ts \
  src/app/grass/grass-render-session.test.ts \
  src/app/grass/grass-scene.test.ts \
  src/app/grass/grass-wind-material.test.ts \
  src/app/app-performance.gates.test.ts
pnpm verify:kernel
npx playwright test e2e/grass-render-optimization.spec.ts --project=chromium
npm run verify:delivery -- --reason=explicit-performance-work
npm run dev
```

The Stabilization Gate already owns the first-stable checkpoint. This delivery is
the explicit performance refresh authorized by the optimization request. It must
pass before Batch 2 begins. If a protected infrastructure check remains blocked,
stop here; do not reinterpret the blocker as permission to run Batch 2 selectors.

## Delivery Batch 2 — Still-Only Product And Atomic Export

Verification tier: Tier 4

Reason: removes Timeline/video product surfaces, changes persistence and frame
ownership, adds autonomous animation time, and replaces export rendering while
reusing the proven session. This is a major renderer/timeline/export rewrite even
though it follows a proven performance batch.

### Task 2.1 — Remove Video And Timeline Without Touching Other Sections

Files:

- `src/app/grass/grass-controls.ts`
- `src/app/grass/grass-defaults.ts`
- `src/app/grass/grass-settings-types.ts`
- `src/app/grass/grass-values.ts`
- `src/app/app-schema.ts`
- `src/app/app-product-readiness.ts`
- `src/app/app-acceptance-data.ts`
- `src/app/app-acceptance-scene-data.ts`
- focused acceptance-data modules created by the Stabilization Gate
- `src/app/grass-product-delivery.test.ts`
- `src/app/app-schema.test.ts`
- `e2e/grass-output.spec.ts`
- `e2e/grass-timeline-persistence.spec.ts` (rename to
  `e2e/grass-persistence.spec.ts`)
- `e2e/grass-test-helpers.ts`

Actions:

1. Delete Video Export, format/resolution targets, Export Video action,
   MediaRecorder helpers, MIME selection, and all video acceptance/performance
   paths.
2. Remove playback Timeline and remove `"timeline"` from persistence `include`,
   but keep the current stable v20 key and version. Runtime persistence already filters
   values against currently known schema targets, so the next write prunes removed
   video targets while preserving every known authored value. Do not add direct
   localStorage migration code and do not bump to an unreadable version.
3. Keep Image Export in its existing order with PNG/JPG and 2K/4K/8K choices.
4. Update Animation Intent Inventory, readiness, requested behavior, acceptance,
   section inventory, and settings-transfer expectations.
5. Preserve and update the existing real reload scenario under the non-Timeline
   filename. Seed a real v20 snapshot containing non-default Lawn distribution,
   Surface Bend, Ground Shadow, Current/Clover colors, coordinated palette,
   canvas, panels, media, Scene Setup visibility values, plus old timeline/video
   data. Prove known state restores while removed timeline/video fields do not
   return.
6. Preserve the current section order: Scene Setup; environment/light/grade;
   Field/Terrain/Surface/Surface Bend/Surface Fade/Ground Shadow; complete Lawn
   including Lawn Distribution; complete Tall; scans/rocks; Wind; Background;
   Image Export.
7. Do not introduce a runtime Layers panel. Existing layer visibility is stored in
   schema value targets and must remain independently switchable.
8. Do not change controls outside delivery, canvas behavior, or renderer quality.

Acceptance: Video and Timeline UI/targets are absent; all remaining section order,
values, settings transfer, reset, and persistence behavior stay intact.

### Task 2.2 — Put Autonomous Time Inside The Session

Files:

- `src/app/grass/grass-render-session.ts`
- `src/app/grass/grass-render-session.test.ts`
- `src/app/grass/grass-wind.ts`
- `src/app/grass/use-grass-simulation-interactions.ts`

Actions:

1. Add a private monotonic six-second forward phase to the session; do not add an
   independent clock service or React timer.
2. Accumulate active elapsed time so background-tab suspension does not jump the
   phase.
3. Schedule at most one frame and only for non-Static wind or pointer/tilt
   recovery; keep 24 FPS ceiling and existing backpressure.
4. Suspend non-essential motion during Toolcraft viewport interaction and resume
   without changing authored state.
5. Expose one immutable `capturePhase()` operation for still export.

Acceptance: seamless first/last phase, moving wind, pointer direction/recovery,
and zero Static autonomous work.

### Task 2.3 — Render Still Pixels Through The Retained Session

Files:

- `src/app/grass/grass-export.ts`
- `src/app/app-composition.tsx`
- `src/app/grass/grass-panel-actions.ts`
- `src/app/grass/grass-render-session.ts`
- `src/app/grass/grass-scene.ts`
- `src/app/grass/grass-export.test.ts`
- `src/app/app-renderer-pipeline.ts`
- `src/app/app-renderer-pipeline-types.ts`
- `e2e/grass-output.spec.ts`

Actions:

1. Replace the exported singleton handler with
   `createGrassPanelActionHandler(session)` and inject the same composition-owned
   session used by `GrassOutput`. Do not add `grass-scene-registry.ts` and do not
   call a cached resource pass as if that acquired a new lease.
2. Keep `randomize.scene` and `scratch.scene` as direct local-action branches in
   that factory. Forward the original runtime `dispatch` unchanged so the existing
   `WeakMap<dispatch, GrassWorldPaletteMarker>` provenance remains stable;
   `Scratch` must still clear the marker and change visibility only.
3. Make `session.exportStill(snapshot)` transition `ready -> exporting`, pin the
   attached scene, freeze settings/phase, await the active frame, and suspend
   scheduling. A concurrent export is rejected with one explicit error.
4. Make detach/pipeline disposal transition to `detaching`; the scene-resource
   disposer returns a promise that waits until export releases the pin before it
   calls `scene.dispose()`.
5. Before mutating renderer state, validate target width/height against WebGL
   `MAX_TEXTURE_SIZE` and `MAX_RENDERBUFFER_SIZE` and fail clearly if unsupported.
6. Render complete geometry with one forced real shadow-map refresh into one
   same-context
   `WebGLRenderTarget`; never resize the visible preview canvas to 8K.
7. Preserve the procedural Ground Shadow plane, Surface Bend geometry and
   placement bounds, independent Tall/Lawn layouts, Current/Clover colors,
   coordinated palette, Surface Fade, and every visibility value in the frozen
   export snapshot. The underlay remains outside Surface Tilt exactly as in
   preview.
8. Read into one RGBA typed array, flip rows in place with one scanline scratch
   buffer, and pass a shared-buffer `ImageData` to the Toolcraft export canvas. Do
   not allocate another app-owned full-frame pixel copy.
9. Restore render target, viewport, camera, visibility, instance limits,
   shadow cadence, and scheduler and dispose the target in `try/finally`, including
   allocation, readback, or encoder failure.
10. After this path passes while the buffer is preserved, set
   `preserveDrawingBuffer: false` and rerun preview screenshot plus 2K/4K/8K export
   proof.
11. Let `grass-export.ts` own PNG/JPG encoding/download only. If the session is
   detached, fail clearly and never construct another scene or WebGL context.

Acceptance:

- one context/resource identity serves preview and export;
- simultaneous export requests cannot interleave;
- 2K/4K/8K bytes/dimensions and complete geometry are correct;
- Ground Shadow, Surface Bend, placement exclusion, and all independent
  material/distribution state match preview;
- Randomize/Scratch behavior and palette provenance are unchanged by the handler
  factory;
- preview pixels/size/motion restore after success and forced failure;
- unsupported dimensions fail before renderer mutation, and target disposal occurs
  once on every exit path.

### Task 2.4 — Update Real Interactions And Passes

Files:

- `src/app/app-renderer-pipeline.ts`
- `src/app/app-renderer-pipeline-types.ts`
- `src/app/app-performance.ts`
- `src/app/app-performance-impact.json`
- `e2e/app-kernel-benchmarks.ts`
- `e2e/app-performance.spec.ts`

Actions:

1. Remove timeline interactions and video targets.
2. Map `animation-frame` and pointer recovery to frame render only.
3. Make `grass-still-export` execute the real render-target render/readback path.
4. Prove viewport drag/zoom cannot invalidate layouts, static sync, resources, or
   export work.

Batch 2 focused checks:

```bash
npx vitest run \
  src/app/grass/grass-render-session.test.ts \
  src/app/grass/grass-export.test.ts \
  src/app/app-schema.test.ts \
  src/app/app-acceptance.persistence-coverage.test.ts \
  src/app/grass-product-delivery.test.ts \
  src/app/app-performance.gates.test.ts
npx playwright test e2e/grass-output.spec.ts e2e/grass-persistence.spec.ts e2e/grass-render-optimization.spec.ts --project=chromium
npm run verify:delivery -- \
  --tier=4 \
  --unit-test=src/app/grass/grass-render-session.test.ts \
  --unit-test=src/app/grass/grass-export.test.ts \
  --unit-test=src/app/app-acceptance.persistence-coverage.test.ts \
  --browser-test="grass still-only export reuses one renderer and restores preview" \
  --browser-test="grass autonomous wind remains live without Timeline" \
  --browser-test="grass field state restores after reload" \
  --browser-test="scene setup randomizes the authored look and scratches back to surface" \
  --browser-test="control sections follow the scene authoring workflow" \
  --performance-test="browser perf: grass autonomous frame and still export use the retained session"
npm run dev
```

The quoted browser/performance strings are the exact titles to give the new
Playwright scenarios; the protected runner resolves titles rather than filenames.

## Optional Follow-Up Batch 3 — Lazy Exact Assets

Verification tier: Tier 3

Reason: restructures source decode/upload lifecycle without changing assets or
default pixels, but only for persisted-disabled startup after quantitative proof.

Entry gate:

1. Use the Baseline Gate's same protected browser/renderer identity.
2. Compare reset all-enabled startup with the Baseline Gate's real persisted
   Scratch state. Create it by clicking `Scratch`, wait for persistence, and
   reload; do not synthesize localStorage or mutate runtime state directly.
3. Continue only when skipped unrelated families account for both at least 10% and
   at least 100 ms of cold preparation. Otherwise record the result, mark this
   optional batch skipped, and add no repository abstraction.
4. Never claim an improvement for the default all-enabled scene, which still needs
   every source.

### Task 3.1 — Introduce One Keyed Asset Repository

Files:

- `src/app/grass/grass-asset-repository.ts` (new)
- `src/app/grass/grass-asset-repository.test.ts` (new)
- `src/app/grass/grass-scan-resource.ts`
- `src/app/grass/grass-scene.ts`
- `src/app/app-renderer-scan-pipeline.ts`
- `src/app/app-renderer-pipeline.ts`
- `src/app/app-renderer-pipeline-types.ts`
- `src/app/app-performance-impact.json`

Actions:

1. Replace the all-assets promise with one repository keyed by ground, boulder,
   and scan family.
2. Load required keys with one `Promise.all`; never serialize independent enabled
   families.
3. Preserve exact URLs, bytes, 4K/2K dimensions, color spaces, anisotropy, mip
   behavior, and shared-source ownership.
4. Dispose renderer-owned clones only. Retain decoded sources for re-enabled
   layers.
5. Keep this as one repository; do not introduce per-family wrapper modules.
6. Keep `grass-scan-resource.ts` plus `grass-asset-repository.ts` at or below 650
   lines combined through cohesive extraction.

Acceptance: persisted Scratch loads required Ground/Current/Clover resources but
does not decode/upload hidden scan/rock families; re-enabling one family through
its real visibility switch loads only that family plus already-required ground;
concurrent all-enabled defaults render identically without a false speedup claim;
every Terrain/Clover map remains exact 4096 x 4096.

### Task 3.2 — Measure Cold And Warm Work Honestly

Files:

- `src/app/app-performance.ts`
- `src/app/app-performance-impact.json`
- `e2e/app-kernel-benchmarks.ts`
- `e2e/app-performance.spec.ts`
- `e2e/grass-render-optimization.spec.ts`

Actions:

1. Keep exactly one protected scenario per derived canonical path. Add cold
   all-enabled, cold one-family, and warm re-enable only where they derive
   distinct paths. Record warm cached-shadow and forced-refresh samples as
   diagnostics inside the one frame-path proof, with forced refresh owning the
   protected worst-case budget.
2. Keep the historical 1000-rock maximum visible as a separate unresolved
   full-scene risk if it still exceeds the protected software-WebGL budget; do not
   lower workload bounds or relabel it as a warm-frame success.
3. Require current-source executable evidence for each claimed pass improvement.

Batch 3 focused checks:

```bash
npx vitest run \
  src/app/grass/grass-asset-repository.test.ts \
  src/app/grass/grass-render-baseline.test.ts \
  src/app/app-performance.gates.test.ts
pnpm verify:kernel
npx playwright test e2e/grass-render-optimization.spec.ts e2e/app-performance.spec.ts --project=chromium
npm run verify:delivery -- --reason=explicit-performance-work
npm run dev
```

## Final Completion Checklist

- Stabilization safety fixtures pass; TypeScript, code health, product boundary,
  and production build are green before the canonical baseline.
- Surface Bend remains the completed current product at persistence `v20`/`20`;
  no optimization step rolls state back to `v19`.
- Canonical pipeline ownership is exact before measurement: Tall distribution
  does not invalidate ground geometry, scene render lists ground geometry once,
  and export explicitly consumes ground geometry.
- Typed pass input selectors plus pipeline execution are the only pass-level
  invalidation authority. No JSON settings signature, component key ref, or
  duplicated target list remains.
- Initial attachment contains no fixed 3000 ms delay or scattered unconditional
  16 ms stage sleeps; environment and scan preparation start concurrently and one
  generation token cancels stale work.
- Baseline raster tolerance passes at both render scales and active fixed phase.
- Independent Tall/Lawn distributions, scan counts, Ground Shadow, complete still
  geometry, Surface Bend deformation/placement exclusion, Current/Clover colors,
  coordinated palette, PBR, real shadows, and exact texture identities/dimensions
  are unchanged.
- Scene Setup still exposes adjacent Randomize/Scratch actions; Randomize
  coalesces to one final scene and Scratch preserves Surface-only visibility
  without resetting authored hidden-layer settings.
- `GrassOutput`, scene, session, scan resource, Surface Bend, acceptance data,
  performance adapters, and product tests meet exit limits. The renderer-pipeline,
  performance, and values module groups meet their explicit per-file and combined
  caps without pass-through wrappers.
- No registry, second field-renderer WebGL context, Timeline, video target,
  MediaRecorder path, or fictional shadow pass remains. The four independent
  noise-preview control contexts remain explicitly outside the field session.
  Eager unrelated asset preparation is removed only
  when the optional repository entry gate passed; otherwise its measured skip is
  documented without adding new abstractions.
- Static is idle; moving frames touch only dynamic uniforms and the real draw.
- 2K/4K/8K PNG/JPG export is atomic and restores preview state on failure.
- Cold and warm performance evidence are reported separately, including any
  unresolved high-poly-rock maximum. Lazy assets exist only if their entry gate
  passed; otherwise the documented skip is the correct result.
- Each coherent batch has its protected delivery result and identity-verified
  development URL.

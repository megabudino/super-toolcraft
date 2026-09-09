# Lossless Grass Render Optimization And Still-Only Delivery

Date: 2026-07-23

Status: revised after completed Surface Bend and fourth thermo-nuclear architecture review

## Goal

Reduce steady-frame CPU/GPU work, cold resource pressure, and still-export
duplication without changing authored Tall/Lawn counts, scan counts, geometry,
independent Tall/Lawn distribution, Ground Shadow, Current/Clover colors,
coordinated generated palettes, Surface Bend deformation and placement exclusion,
PBR appearance, selected render scale, or source texture resolution. Remove video
delivery and keep still images as the only product output.

## Confirmed Product Decision

The original request removed video export. The architecture review made the
dependent Timeline tradeoff explicit: in this generated app, a playback Timeline
requires Video Export. The user's instruction to continue after that warning is
the decision to remove both Video Export and playback Timeline. Live wind remains
animated, but there is no play, pause, scrub, duration, loop, or export-at-time UI.

This product change is delivered separately from the behavior-preserving renderer
refactor so a regression cannot be hidden inside performance work.

## Non-Negotiable Fidelity Contract

- Keep the existing 4096 x 4096 Terrain and Clover maps byte-for-byte; do not
  downscale, re-encode, pack, compress, or replace them.
- Keep the existing 2048 x 2048 boulder maps and all scan maps unchanged.
- Keep authored Tall/Lawn root counts, Preview Quality ranges, detailed and
  lightweight coverage partitions, scan counts, and full still geometry.
- Keep independent Tall/Lawn distribution maps, exact scan Count behavior,
  Scene Setup Randomize/Scratch semantics, Current/Clover colors, coordinated
  twenty-color generated palettes, Ground Shadow controls/output, and Surface
  Bend geometry/placement behavior.
- Keep the selected `canvas.renderScale`, PBR lighting, gradients, instance
  colors, masks, HDRI, real shadow-map behavior, camera, Surface Fade, and field
  boundary behavior.
- Do not introduce grass LOD, rock decimation, dynamic resolution, or a
  lower-quality interaction preview.
- Fixed settings and a fixed animation phase must preserve the visible result
  within the explicit raster tolerance recorded before implementation.

## Canonical Ownership Model

The implementation has three mandatory product-owned concepts and one optional
evidence-gated concept with one-way ownership:

1. `GrassOutput` is a thin React/DOM adapter. It mounts the host/canvas, owns the
   `ResizeObserver` and interaction adapters, applies typed diagnostics patches,
   and forwards immutable state snapshots to the session.
2. `GrassRenderSession` is an explicit dependency created by
   `app-composition.tsx` and injected into both `GrassOutput` and the panel-action
   handler. It owns only attachment state, frame scheduling/coalescing,
   backpressure, current animation phase, and the serialized export transaction.
3. `GrassSceneRenderer` owns Three.js/WebGL resources and exposes explicit
   `syncStaticScene`, `renderFrame`, and `renderStillToPixels` operations. It owns
   static invalidation and produces typed diagnostics.
4. `GrassAssetRepository` owns lazy, memoized, exact source assets and
   renderer-owned clones as an internal dependency of `GrassSceneRenderer`. It is
   one keyed repository, not one wrapper per family.

The existing `grass-scene-resource` renderer-pipeline pass continues to retain the
`GrassSceneRenderer`, not the session. The composition-injected session attaches
that scene once and is the only code allowed to invalidate its generation. The
resource disposer delegates to the session and awaits any active export before
actually disposing GPU state. Canvas size and render scale resize the retained
scene; they do not replace it.

This explicit composition dependency avoids both a global registry and an invalid
attempt to retrieve a cached retained resource through a second `runPass` call:
renderer-pipeline cache hits return the prior promise and do not acquire a new
execution lease. No fallback path silently constructs another renderer.

Typed renderer-pipeline pass inputs are the single invalidation authority.
`GrassRenderSession` submits the latest immutable snapshot once and the pipeline
decides whether ground, Tall, Lawn, scan, static-sync, or frame callbacks execute.
The refactor deletes `grass-settings-signatures.ts`, component/session key refs,
and duplicated JSON keys. Runtime pass selectors are checked against the exact
registered input keys. Layout diagnostics use returned content signatures and
generation counters rather than a second settings-key system.

The intended dependency direction is:

```text
appComposition
      -> GrassOutput -> GrassRenderSession -> GrassSceneRenderer
      -> panel action          |                    |
                              |                    -> GrassAssetRepository
                              -> serialized scene attachment/export lifetime
```

No new module may exist solely to forward a call or re-export a constant. Each
new module must own a lifecycle or a cohesive pure algorithm.

The field-session one-context invariant is scoped deliberately. The controls
panel currently exposes four `grassNoisePreview` controls, each with its own
small WebGL2 context. Those contexts remain custom-control resources and never
enter `GrassRenderSession`; only the main retained field renderer is shared by
field preview and still export.

## Renderer Design

### Static Synchronization Versus Frame Rendering

`GrassSceneRenderer.syncStaticScene` applies settings only after a control,
layout, environment, asset, visibility, material, camera, canvas-size, or
background invalidation. It returns a typed result describing which GPU state was
changed.

Each retained resource owns one narrow typed static snapshot and a direct `sync`
method. `syncStaticScene` invokes a fixed straight-line resource list and
aggregates changed flags; it does not own one giant all-settings key or grow a
conditional dispatcher.

Tall, Lawn, and every scan family remain separate layout owners. Tall distribution
cannot invalidate Lawn/scans; Lawn distribution cannot invalidate Tall/scans.
Scene Setup may change several owners in one command sequence, but the session
coalesces those updates and publishes only the complete final scene.

The procedural `GrassGroundShadowResource` is static scene state. Its uniforms,
mesh transform, visibility, and diagnostics update only after Ground Shadow,
Field dimensions/shape/irregularity, Terrain seed, or Surface visibility changes;
they are not rebuilt on wind-only frames. This underlay remains outside the
pointer-driven Surface Tilt group in preview and export.

Surface Bend is a separate retained ground-geometry owner. Its normalized
settings produce the typed inputs for the explicit
`grass-ground-geometry-build` pass, and the same deformed boundary is consumed by
Terrain geometry plus Tall, Lawn, scan, rock, and boulder placement exclusion.
Bend changes may rebuild ground geometry and dependent layouts; wind, lighting,
material, camera, and color changes may not. The pass remains executable and
measurable rather than disappearing inside static synchronization or frame
render.

Ground geometry rebuilds preserve one Terrain mesh identity. A rebuild replaces
and disposes only the geometry, so raycasting, material ownership, scene
attachment, and nullable lifecycle state do not churn.

`GrassSceneRenderer.renderFrame` resolves wind/pointer/tilt, updates the small
dynamic uniform set, chooses cached-shadow versus refreshed-shadow behavior, and
submits one real Three.js render. It does not repeat static color parsing, texture
wrapping, material grading, camera setup, scan visibility, or settings
serialization.

The scene retains vectors, colors, resource-local typed snapshots, and reusable
frame objects. During the first behavior-preserving batch, Toolcraft Timeline
state may still deliver progress through React, but React owns no renderer queue
or local animation state: it only forwards the latest snapshot to the session.
After Timeline removal, a normal autonomous frame performs no React state update,
layout rebuild, asset preparation, material compile, or static diagnostics
serialization.

Current and Clover keep separate retained tint uniforms. Coordinated generated
palette values are ordinary immutable settings in the snapshot; the renderer
does not reconstruct or randomize them during synchronization.

### One Wind Evaluation Per Vertex

Evaluate the analytical wind field once for each generated-grass or scan color
vertex and reuse that force for position and normal deformation. Add a coherent
zero-force return before hash, trigonometric, and turbulence work when ambient
and directed forces are inactive. Use identical force math and phase in color
and custom-depth materials so geometry, normals, and shadows remain aligned.

### Diagnostics

`GrassSceneRenderer` returns typed diagnostics with each synchronization/frame
result. `GrassRenderSession` diffs them against the last published snapshot and
emits a typed changed-only patch. `GrassOutput` is the only DOM owner and applies
that patch to host/canvas attributes. No standalone stateful publisher service or
DOM dependency is added to the session.

### Shadows And Performance Passes

Keep the existing 1024 x 1024 PCF map and visual cadence. Static mode refreshes a
shadow after a real static invalidation. Moving wind keeps the existing bounded
20 Hz deformation cadence. Still export forces one shadow refresh.

Three.js executes shadow and color work inside the same `renderer.render()` call,
so the canonical performance model has one executable frame-render pass.
`shadowRefreshed: boolean` is a typed execution result, not a string workload
dimension. The one canonical frame-path proof budgets the worst-case forced
refresh; cached warm frames remain separately reported diagnostics. The model
does not claim a fictional independent shadow pass or duplicate scenarios for one
path.

## Autonomous Motion

After the behavior-preserving renderer refactor is proven, the session replaces
Toolcraft playback time with one monotonic six-second forward clock. It schedules
at most one retained animation frame and preserves the current 24 FPS ceiling and
backpressure. It runs only for non-Static wind or active pointer/surface recovery,
pauses during Toolcraft viewport manipulation, and stops on settle/unmount.

The clock is session state, not React state and not an independent service.
`Static` schedules no autonomous frame. Tab suspension resumes from accumulated
active elapsed time rather than jumping by wall-clock time.

Initial attachment has no fixed startup sleep and no chain of arbitrary
per-pass delays. Environment and scan-source preparation start concurrently.
One generation token cancels stale completion, CPU passes execute once for the
latest snapshot, and one complete frame is published. Any cooperative yield is a
single measured session policy rather than scattered timeout constants.

## Atomic Still Export

`app-composition.tsx` constructs one session and injects it into both the canvas
output and a `createGrassPanelActionHandler(session)` handler. The panel action
therefore calls the attached session directly instead of looking it up through a
registry or trying to reacquire a cached pipeline resource. Missing attachment is
an explicit state error; it never causes a second `WebGLRenderer` to be
constructed.

The handler factory changes export ownership only. It retains the direct
`randomize.scene` and `scratch.scene` branches and forwards the original Toolcraft
`dispatch` object unchanged. This preserves the randomizer's existing
`WeakMap<dispatch, GrassWorldPaletteMarker>` provenance; Scratch still clears that
marker and changes only the nine visibility targets.

The session uses an explicit `detached | ready | exporting | detaching` state
machine. Export pins the attached scene. Unmount or pipeline disposal changes the
state to `detaching`, cancels future frames, and returns an async resource-disposal
barrier that completes only after the export transaction releases the scene.

Still export is one session transaction:

1. acquire a single-export mutex and reject a second request;
2. capture immutable Toolcraft settings and one animation phase;
3. suspend frame scheduling and await the active frame;
4. validate the requested dimensions against `MAX_TEXTURE_SIZE` and
   `MAX_RENDERBUFFER_SIZE` before changing renderer state;
5. render complete Tall/Lawn/scan geometry into one same-context
   `WebGLRenderTarget` at the Toolcraft-provided 2K/4K/8K size;
6. preserve the frozen independent Tall/Lawn layouts, Current/Clover colors,
   coordinated palette, Ground Shadow, Surface Bend geometry/placement bounds,
   Surface Fade, and visibility state;
7. read into one RGBA buffer, flip rows in place with one scanline scratch buffer,
   and transfer it into the standard Toolcraft image canvas without another
   app-authored full-frame copy;
8. restore renderer, camera, visibility, instance limits, shadow cadence, and
   scheduling state and dispose the render target in `try/finally`;
9. encode PNG/JPG and release the mutex.

The visible preview canvas is never resized to the export resolution. Pointer
tilt/audio are excluded. The export action owns encoding/download; the session
owns only deterministic pixels and renderer state.

`preserveDrawingBuffer: true` remains unchanged while the legacy image/video
export path exists in the behavior-preserving batch. Only after the render-target
still path passes with the preserved buffer may the implementation set it to
`false` and rerun screenshot/export proof.

## Conditional Exact Asset Repository

All scan families and both rock layers are enabled in the default product state,
so a lazy repository cannot improve default cold start: it would still load every
asset. Repository work is therefore not part of the unconditional optimization.

After the primary renderer/export batches, proceed only if the protected baseline
shows that the real persisted Scratch workflow avoids at least 10% and 100 ms of
measured cold preparation by skipping unrelated families. Scratch must be invoked
through its visible action and followed by a real persistence reload; tests do not
synthesize localStorage or direct runtime mutations. Otherwise record the evidence
and delete this batch from the delivery rather than adding a speculative
abstraction.

When the entry gate passes, replace the eager all-assets promise with one keyed
`GrassAssetRepository`. Ground, boulder, and each scan family have lazy memoized
source promises. The repository prepares all currently required keys concurrently
and never serializes independent downloads/decodes. It must not claim a default
all-enabled startup improvement.

Source URLs, dimensions, bytes, color spaces, anisotropy, mip behavior, and
texture ownership remain unchanged. Disabled optional layers do not decode or
upload their assets. Re-enabling a layer reuses its retained source and creates
only renderer-owned clones required by the current scene.

## File-Size Exit Criteria

The refactor must delete orchestration complexity rather than distribute it:

- `grass-output.tsx`: at most 250 lines;
- `grass-scene.ts`: at most 450 lines;
- `grass-render-session.ts`: at most 350 lines;
- `grass-output.tsx` + `grass-render-session.ts` + `grass-scene.ts`: at most
  1050 lines combined;
- `app-renderer-pipeline.ts`, `app-renderer-pass-definitions.ts`, and
  `app-renderer-interactions.ts`: at most 300 lines each and at most 700 lines
  combined; the split must remove repeated pass complements and duplicate edges;
- `app-performance.ts`, `grass-performance-envelope.ts`, and
  `grass-performance-scenarios.ts`: at most 350 lines each and at most 700 lines
  combined; scenario labels use typed tables instead of a nested target-string
  conditional;
- when the optional repository gate passes, `grass-scan-resource.ts` plus
  `grass-asset-repository.ts`: at most 650 lines combined;
- `grass-values.ts`: at most 220 lines as a domain composer; it plus
  `grass-value-readers.ts`, `grass-layer-settings-values.ts`,
  `grass-scan-settings-values.ts`, `grass-surface-settings-values.ts`, and
  `grass-wind-settings-values.ts` stays at or below the current 700 lines
  combined;
- no production file crosses the local 700-line code-health limit;
- product-owned e2e support files stay at or below the local 500-line limit;
- product-owned test files stay at or below the local 500-line limit;
- acceptance data stays split into focused product modules, with no production
  acceptance module above 700 lines.

These are design constraints, not targets to satisfy through formatting or
pass-through modules.

## Product Model

Retained product surfaces:

- Preview Quality and Scene Setup with adjacent Randomize/Scratch actions;
- environment, lighting, grade, Field, Terrain, Surface, Surface Bend, Surface
  Fade, Ground Shadow, complete Lawn including Lawn Distribution, complete Tall,
  scans, rocks, Wind, Background, and Image Export;
- independent visibility switches, orientation gizmo, settings transfer, and
  persistence of authored values/canvas/panels/media;
- PNG/JPG and 2K/4K/8K still delivery.

Removed surfaces:

- Video Export section and MP4/WebM targets;
- Export Video action and MediaRecorder implementation;
- playback Timeline and timeline persistence.

Surface Bend established the current product persistence generation at
`v20`/`20`. Optimization never rolls back to `v19` and never advances the
generation merely to remove product targets. The still-only batch removes only
`"timeline"` from the included slices. The runtime reads only targets still
present in the current schema, so old video values are ignored and pruned by the
next normal write while all known v20 authored values remain restorable. No
product code reads or rewrites localStorage directly.

## Truthful Performance Model

Canonical executable boundaries are:

- retained source/resource preparation;
- retained Surface Bend ground-geometry construction;
- independent Tall/Lawn and per-scan layout construction;
- custom-control noise preview rasterization, measured separately from the field
  session;
- static scene synchronization;
- one frame render whose typed result reports whether its real shadow work
  refreshed;
- atomic still export including target render and pixel readback.

Cold preparation and warm retained frames are different scenarios. The recorded
8933.5 ms SwiftShader cold maximum is not relabeled as a warm frame. Before a pass
claim is accepted, the baseline must record both costs and state which protected
budget applies. The plan does not promise an 80 ms cold maximum while preserving
1000 high-poly rocks; if that separate workload remains over budget, it is
reported as an explicit unresolved full-scene risk rather than hidden by a
candidate-only benchmark.

## Raster And Behavioral Acceptance

Before implementation, record:

- reset-default and authored-stress Static pixels at render scales 1 and 2 through
  the real preview;
- active-wind pixels at a fixed explicit phase through the executable renderer
  benchmark;
- independent Tall/Lawn map settings and layout signatures, scan counts,
  authored/detailed/lightweight/clump counts, Ground Shadow diagnostics,
  Surface Bend settings, ground-geometry pass inputs/generation and bounds,
  placement exclusion, Current/Clover and coordinated palette values, calls,
  triangles, real shadow decision, resource identity, field context count,
  control-preview context count, and texture dimensions;
- one Randomize and one Scratch transaction with final-state pipeline counts and
  no visible intermediate scene;
- cold preparation time separately from warm cached-shadow and refreshed-shadow
  frames.
- the Chromium build plus WebGL vendor/renderer identity used for raster fixtures.

The before/after raster contract is: identical dimensions, no more than 0.1% of
pixels with any channel delta above 2/255, and mean absolute channel delta no
greater than 0.25/255. Counts, resource identities, context count, and 4K texture
dimensions are exact. Stored RGBA is compared only under the same protected
Chromium/SwiftShader identity; hardware-browser inspection is separate visual QA,
not a cross-GPU byte comparison.

Persistence acceptance starts from a real v20 snapshot containing non-default
Lawn distribution, Surface Bend, Ground Shadow, Current/Clover palette, canvas,
panels, media, visibility, and obsolete timeline/video data. A real reload must
restore known state while removed timeline/video state does not return.

Outcome proof observes pipeline execution counts, MutationObserver attribute
writes, WebGL-context creation, and compiled shader behavior. Tests must not infer
success only from source spelling.

## Delivery Sequence

This program has one mandatory stabilization gate, two mandatory coherent
batches, and one evidence-gated follow-up:

1. freeze completed Surface Bend on current v20 persistence, repair the canonical
   pipeline model, decompose near-limit modules, restore code health, and mint the
   first-stable protected receipt;
2. record the current raster/cold/warm characterization baseline;
3. behavior-preserving render-session/static-frame/shader refactor and run the
   explicit performance delivery;
4. Tier 4 still-only Timeline/video removal plus autonomous clock and atomic
   export;
5. optional lazy exact-asset repository for persisted Scratch startup only when
   its quantitative entry gate passes.

Each batch reaches its own green focused checkpoint and protected delivery result
before the next begins. An external protected-runner blocker stops the sequence;
it never authorizes later targeted selectors without a prior delivery receipt.
This keeps visual, scheduling, export, and loading regressions attributable.

# Polar Signals Flame Graph worklog

## Status

Mode: product
Active change: flame-infinity-default

## Decision Trail

### flame-infinity-default
- Change ID: flame-infinity-default
- Request: сделай по дефолту инфигит канвас включенный
- Task type: Later focused default change.
- Owner: src/app/app-schema.ts; existing canvas.infinity coverage and explicit finite-mode setup in size, background and export fixtures.
- Decision: Use the canonical editable-output sizing defaultMode: infinite. Fresh workspaces and Reset start in Infinity; runtime persistence continues to restore a user's saved mode. Keep the saved finite frame at 1920 × 1080.
- Docs/contracts read: workflow; core/control-selection; core/layout; schema-reference; component-rules; acceptance-testing.
- Focused checks: Existing canvas.infinity unit and registered browser scenario, including the initial checked state, hidden finite sizing controls, mode continuity and reload. Manual embedded-browser review of the current workspace.
- Skip: Aggregate delivery, full suite, build, export matrix and measured performance; only the initial canvas mode changes.
- Verification: Passed the existing canvas.infinity unit (initial mode, finite toggle and Reset) and `npm run test:feature -- canvas.infinity` (one browser scenario: initial Infinity, absent width/height inputs, scene/viewport continuity, reload and Undo/Redo). Log: `.toolcraft/scratch/infinity-default-feature.log`; journal run `a76bba38-282a-49f3-a966-d5109693f9c1`. Reviewed the graph in Codex's embedded browser and enabled Infinity through its normal switch in the current saved workspace. Finite-size/export/background fixtures now explicitly select finite mode where their observations require it; the performance dimension adapter likewise prepares finite sizing through the UI, with no measurement run.

### flame-zoom-frame-continuity
- Change ID: flame-zoom-frame-continuity
- Request: при зум ин и зум аут график моргает
- Task type: Later focused visual bug fix.
- Owner: src/flame/FlameCanvas.tsx; canvas.scale browser coverage.
- Diagnosis: React writes canvas backing dimensions as soon as zoom changes, clearing the displayed bitmap before the asynchronous worker reply. Preserve the displayed bitmap until the next complete frame can resize and paint atomically.
- Scope: Existing worker, pipeline, workload, scene frame, quality and export semantics remain the same. This is a missing-frame correctness fix, not a latency or throughput optimization; no measured performance intent is recorded.
- Reproduction: Real Zoom in produced alpha=0 both after a backing resize and in a browser animation frame. The regression now exercises two Zoom in and two Zoom out steps, samples every resize and 30 animation frames per step, and checks exact final CSS × DPR × 2 backing.
- Result: Canvas backing size and the completed worker bitmap now commit in the same synchronous paint; the previous frame remains visible while a replacement is pending.
- Verification: `npm run test:feature -- canvas.scale` passed (one browser scenario, including four zoom steps with no empty resize/frame samples and exact final backing). Render-plan structural test and two facade-authority tests passed. Manual zoom in/out reviewed in Codex's embedded browser; development file check passed. Functional proof only; no measured performance run. Logs: `.toolcraft/scratch/zoom-before.log`, `.toolcraft/scratch/zoom-feature-retry.log`; successful journal run `0ce73d3a-e9f5-4395-bcb4-b47b5e266947`.
- Docs/contracts read: workflow; decision-contract; core/runtime-boundary; core/performance; component-rules; renderer-technique; performance; acceptance-testing. Local systematic-debugging and browser workflows applied.
- Focused checks: canvas.scale plus the unchanged render-plan structural test. Skip aggregate delivery, full suite, export matrix and measured performance because only live preview frame publication changes.
- Verification integration: The first test:feature attempt rejected callback-based reference-parity/render-scale recipes imported directly from their implementation modules. Extended the existing signed product-test facade in `/Users/kusnizza/Projects/primeui-v2/starter/e2e/toolcraft-product-test.ts` with those two public helper exports, following its existing canvas-handle/orientation export pattern; their assertions and authority validators remain intact. The two focused facade-authority tests passed. Regenerated signed sources through the CLI; the regenerated host also includes current upstream host-panel support/removal of its unused active switch, with the default app host path unchanged. No unrelated upstream edits were overwritten.

### flame-reference-port
- Change ID: flame-reference-port
- Request: изучи этот проект и перенеси его полностью в текущий рантайм проекта тулкрафт по правилам тулкрафта. логика и поведение должно остаться как в рефереенсе
- Task type: First product delivery; reference app port, app assembly, schema/controls, renderer/canvas, export/background and persistence.
- User-visible result: Reference flame graph inside the Toolcraft editor; first-delivery functional gate passed on 2026-09-15.
- Source/reference checked: /Users/kusnizza/Projects/polar-signals-flame-graph/src/App.tsx, components/Sidebar.tsx, components/FlameGraphCanvas.tsx, components/HslColorPicker.tsx, utils/flameGraph.ts. Original launched with Vite on 127.0.0.1:5174; inspected through Codex's host-embedded browser.
- Reference inputs: Source application only. No motion asset; referenceInputs: [].
- Docs/contracts read: workflow; core/reference-study, runtime-boundary, control-selection, layout, performance, setup-export, media-upload, slider-ranges, development-files; assembly-workflow; schema-reference; component-rules; decision-contract; renderer-technique; performance; acceptance-testing. Plan and Implementation routes completed before editing; Verification read before proof.
- Contract rules applied: runtime-shell-required, canvas-no-app-ui, canvas-surface-preserved, infinity-canvas-scene-bounds, interaction-surface-ownership, controls-section-inventory-required, renderer-technique-inventory, reference-clone-source-of-truth, acceptance-product-observable, persistence-policy-explicit, workflow-required.
- View interaction intent: non-spatial — two-dimensional graph, vertical editing handles, no orbit.
- Interaction ownership: Canvas owns envelope point drags; panel owns global structure/shading and Regenerate. No duplicated point editor.
- Decision: Preserve original geometry and HSL shading with built-in Toolcraft controls, transparent foreground, runtime image export and a retained preview worker.
- Alternatives rejected: Copied sidebar/route would bypass the runtime. Gradient type/angle/arbitrary stops are not reference parameters. A panel Curves editor would duplicate canvas envelope manipulation and change cosine interpolation/point count. No Layers, timeline, SVG or video is required.
- State/output mapping: flame columns/depth/noise/layout/envelopes/seed -> deterministic source-equivalent column generator; dark/middle/light/core/border -> shared Canvas2D draw; canvas scene rect -> live/export geometry; runtime Background -> runtime preview/artifact composition.
- Verification: Baseline pnpm ai:check passed. Pre-renderer assessToolcraftRenderPlan returned zero structural errors; raster kernel comparison remains pending under first-delivery deferred policy. Protected npm run verify:delivery passed: code health, local docs, 712 Vitest tests, production build and all 18 registered product browser scenarios.
- Risks: Focused proof covers worker frame ordering, exact backing, clipping/gradients, and pointer ownership. Extreme user-entered canvas dimensions remain subject to browser raster-allocation limits; no measured performance certification is claimed.

Verification tier: Tier 3
Reason: Complete reference port with custom raster renderer, canvas handles, state and artifacts.
Run: focused product unit/browser checks, manual host-embedded browser review, then npm run verify:delivery through its first successful completion.
Skip: measured performance/full audit/kernel measurement, because this is ordinary first product delivery.

## Decisions

Preserve the inspected reference behavior through runtime-owned controls, state, foreground rendering and export. Specific decisions follow.

### Renderer
- Decision: Canvas2D source-equivalent rectangles/gradients, worker preview, shared deterministic draw for runtime export, textless SVG editing overlay.
- Reason: Preserve original pixel operations and keep drag-time raster work outside the main thread.
- Evidence: Original FlameGraphCanvas.tsx; declared flamePipeline, render plan assessment with no structural errors.

### View Interaction
- Decision: non-spatial.
- Reason: Only two-dimensional vertical envelope geometry exists.
- Evidence: Original canvas/browser; no camera, model, 3D transform or transport.
- Source: inspected reference.
- Alternatives: Orbit/fixed-camera/timeline-camera do not describe this product.
- Targets: flame.envelopes; canvas navigation stays runtime-owned.

### Interaction Ownership
- Decision: Canvas envelope dragging; panel global properties and regenerate command.
- Reason: Matches original spatial editing and avoids a duplicated panel point editor.
- Evidence: flameReadiness.interactionOwnership maps every operation and alternative.

### Timeline
- Decision: Absent; animationIntent none, referenceTimeline none.
- Reason: Original is static between user actions.
- Evidence: Source uses dependency-triggered useMemo/useEffect, no animation loop.

### Layers
- Decision: Absent.
- Reason: No user-requested layer workflow or reference layer management.
- Evidence: Original has one graph and a non-exportable guide overlay.

### Controls
- Decision: One Flame Graph section with layout, width, depth, noise, three segment color roles, core threshold and border opacity. Background source section moves into runtime Settings.
- Reason: One graph, coherent reset scope, nine visible controls; no cardinality editor. Built-in color is an exact semantic fit for independent discrete rank roles; generic Gradient would expose unsupported angle/type/stops and change reference behavior.
- Evidence: Sidebar.tsx and HslColorPicker.tsx; public @/toolcraft/ui and schema control models inspected; flameSectionInventory declares exact targets and selector roles.
- Slider domains: Preserve reference count/depth bounds (10..200, 3..30) as supported generator workload limits; editableRange allows scale edits within these bounds. Noise/border/core keep reference percentage domains; no unbounded numeric extension is inferred.

### Export
- Decision: Runtime imageExportModule with PNG/JPG and 2K/4K/8K. SVG/video not requested. Foreground contains no background or handles.
- Reason: User requested Toolcraft rules; canonical Background controls both preview and artifact, PNG transparency is available with Background off. Mandatory runtime output resolutions replace source fixed 2× download sizing.
- Evidence: Source has PNG-only 2× transparent export; core/setup-export mandates runtime artifact ownership and background semantics. Primary user message supplies no optional SVG/video authority.

### Performance
- Decision: Demand-driven worker raster with stable resource, geometry/style keys and exact backing; export is isolated deterministic batch work.
- Reason: Keep source visual semantics and maintain live feedback without quality clamps.
- Evidence: flamePerformanceModel and flamePipeline; paths derived by deriveToolcraftPerformancePaths. No measured performance performed.
- Workload: Columns, depth, canvas dimensions, resolution scale, zoom and artifact long edge.
- Lifecycle: Worker retained for renderer lifetime; raster memoized by exact request; guides independent; export call-owned.
- Assessment: Zero structural errors before renderer implementation; Canvas2D/WebGL raster benchmark requirement deferred to authorized performance work.
- Paths: Canonically derived from initial render, control change/drag, envelope drag, viewport drag/zoom and export.

## Risks
- Risk: Extreme user-entered canvas sizes remain subject to browser raster-allocation limits. Kernel comparison and measured performance are explicitly deferred, not claimed as passed.

## Integration and focused verification
- Reference algorithm retained with an explicit seed. Geometry keys serialize top/middle/bottom point arrays in fixed order, so runtime persistence object-key normalization cannot change the saved picture.
- Worker lifecycle: one renderer-owned worker, one active raster plus one newest pending request; stale bitmaps close without replacing a newer frame. Geometry caching ignores color and size changes. Exact selected CSS × DPR × render-scale backing is retained.
- Envelope gestures use grouped runtime history so Undo restores the whole drag. They are spatial control drags; no masking operation exists.
- The shared Toolcraft source in `/Users/kusnizza/Projects/primeui-v2` needed narrowly scoped product-boundary corrections: explicit SVG handle pointer geometry, distinguishing event-handler callbacks from rendered descendants, resolving safe procedural array/callback types when bounded flow analysis exhausts, and distinguishing Worker messaging from DOM mutation. Regression fixtures retain rejection of unmarked actions and disguised DOM elements. The obsolete style-source spelling assertion was replaced with a behavior fixture.
- Regenerated the signed framework with create-toolcraft-app; product modules remain outside signed owners. Unrelated upstream changes were preserved. A pre-refresh backup lives in `.toolcraft/scratch/before-runtime-refresh.tar.gz`.
- Base UI is pinned at the template-compatible 1.4.1; TypeScript verification passes.
- `npm run ai:check`: passed (39 product files).
- Focused Vitest: 40 contract/domain checks, then 27 current product/adapter checks passed.
- Focused Playwright: all 18 product behaviors passed across targeted runs; the two failures were resolved by waiting for the numeric editor to initialize and by avoiding source refresh during a browser proof. The new dedicated product persistence scenario also passed with exact restored guide geometry and raster pixels.
- Embedded-browser review: Codex In-app Browser, localhost:3002; default colors, Center (21 handles), Top Down (7 handles), numeric width entry, zoom and toolbar reviewed. No external browser fallback used.
- Verification authority: functional first delivery only. No measured performance or kernel benchmark ran.

## Evidence
- Source reviewed: Reference App.tsx, Sidebar.tsx, FlameGraphCanvas.tsx, HslColorPicker.tsx and utils/flameGraph.ts; current src/app assembly and src/flame modules.
- Contract applied: runtime-shell-required, canvas-no-app-ui, reference-clone-source-of-truth, output-export-required, persistence-policy-explicit.
- Original and migrated app both reviewed in the host-embedded browser; product unit and browser outcomes listed above.

## Verification
- Verification tier: Tier 3; first-delivery functional proof only.
- Protected delivery attempts preserved in `.toolcraft/scratch/first-delivery*.log` and runtime receipts/journal. Initial collection required domain-separated browser files; these were split without changing assertions.
- The full contract pass exposed stale neutral app-schema tests and two framework fixture assumptions about Settings section position. Product contracts replace the neutral-only schema checks. The shared fixtures now find stable section identities and derive their expected position; framework regenerated from source.
- Full production proof exposed an obstructed screenshot comparison after guide Undo. Saved trace pixels showed only four changed pixels on the overlapping panel's rounded width input, while the pre-drag stable frame and restored frame matched exactly. The guide test now collapses the panel through its real UI before comparing artwork, awaits ready raster frames, and verifies the restored point coordinate before comparing pixels. The rendering and Undo implementation required no further change.
- The shared boundary regression suite passed 183 tests.
- Final `npm run verify:delivery`: passed, exit 0; code health (39 product files), local docs, 103 Vitest files / 712 tests, production build and 18/18 product browser scenarios. Full successful log: `.toolcraft/scratch/first-delivery-retry-5.log`. No measured performance or kernel benchmark was run. First-delivery aggregate proof is complete; later edits use focused verification only.


## Deployment — 2026-09-15

Change ID: polar-signals-production-20260915

- Request: Publish this supplied app using the existing Toolcraft Vercel scheme, with public production access and a future Case Studies Live URL.
- Owners: examples/polar-signals deployment config; website demo route registry; starter/e2e/browser-acceptance-outcome-helpers.ts.
- Result: Prepared /demos/polar-signals with a matching Vite project, main production branch, Node 24, npm ci, dist, preview-only authentication and stable project alias. Website adds exact and nested proxy rewrites.
- Source: The supplied /Users/kusnizza/Projects/polar-signals-flame-toolcraft snapshot. Product source, defaults, dependencies and lockfile are unchanged.
- Build repair: A clean build reproduced three existing helper type errors, also present in the original folder. The canonical source now narrows action/callback unions directly and gives Playwright equality a concrete unknown generic. Copied the generated signed framework output and its whole manifest; the only other synchronized change removes an unused public barrel export for a boundary still imported directly by ToolcraftRoot. Runtime behavior and assertions are unchanged.
- Focused checks: Production build with /demos/polar-signals/ base; platform integrity (871 files); 11 demo registry tests; 7 deployment route tests; headless production smoke covering real pixels, layout, Width, reload and JS/CSS/fonts; in-app visual inspection. No aggregate or measured-performance audit was run.
- Scope: The Case Studies page and editorial assets remain separate work; its Live URL is https://toolcraft.sh/demos/polar-signals. Release results are recorded in the deployment report.

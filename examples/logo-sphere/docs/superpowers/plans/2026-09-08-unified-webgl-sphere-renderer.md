# Logo Sphere — Unified WebGL Renderer Implementation Plan

> **For agentic workers:** Follow `AGENTS.md` preflight (workflow routes: runtime boundary, renderer technique, timeline animation, core performance, acceptance testing) before editing. Steps use checkbox (`- [ ]`) syntax for tracking. This plan supersedes the Grid render-quality tiers introduced in worklog Iterations 12–13.

**Goal:** Make the sphere animation work: Grid cards stay wrapped on the sphere while the timeline plays and while the sphere is dragged, nothing flickers or pops between representations, and every mode (Fibonacci, Rings, Grid, up to 500 points) animates smoothly at the selected 2× backing on a retina display.

**Architecture:** Replace the three-tier Canvas 2D renderer (`full` / `interaction` / `playback`) plus the flat-quad WebGL playback overlay with **one WebGL2 renderer that draws the complete authored scene (wrapped cards, rounded corners, constant-width strokes, soft shadows, depth fade, radial mask) directly into the single product canvas at the exact selected backing, on every frame, in every state**. The same renderer draws image export through an offscreen WebGL2 surface, so preview and export stay identical by construction. The existing pure model (`logo-sphere-model.ts`) remains the only source of projection math: the renderer builds its vertex data through `projectLogoSphere` and `createLogoSphereSurfaceCardMapper`. The Canvas 2D kernel survives only as a `webgl2-unavailable` fallback and is stripped of its tiers.

**Tech Stack:** React 19, TypeScript 6, Toolcraft runtime/schema/hooks, WebGL2 (raw API, no Three.js), Canvas 2D fallback, Vitest, Playwright.

**Verification tier:** Tier 4 — major post-generation iteration that rewrites the renderer, animation path, and export path. Reason: renderer technique changes from `canvas-2d` to `webgl`, the composite path changes for every state, and browser proofs that assert the old quality tiers must be rewritten. Run: `pnpm ai:check`, `pnpm typecheck`, focused Vitest (`logo-sphere-*.test.ts`), focused Playwright (`e2e/logo-sphere-*.spec.ts`), browser visual pass in the running app, then one bare `npm run verify:delivery` and `npm run dev`. Skip: `npm run verify:perf` (full audit is explicit-request only); the user's complaint is recorded as performance request evidence for the protected lifecycle, but this batch is delivered as functional proof.

---

## 1. Diagnosis (measured 2026-09-08 on the user's machine)

Environment: Apple M4 Pro, Chrome 148 (Claude desktop browser pane), `devicePixelRatio = 2`, Resolution scale = 2 (default), finite 1920×1080 canvas → product canvas backing **7680×4320 (33 megapixels)**. Frame cost was measured by forcing a raster flush (`getImageData(0,0,1,1)`) after each frame in the live app at `http://127.0.0.1:3006/`.

| Scene | Path taken today | Raster cost per frame |
| --- | --- | --- |
| Fibonacci, 30 points, playing | Canvas 2D `full` | p50 **64 ms**, p95 93 ms (≈ 12–15 fps) |
| Grid, 30 points, paused redraw (slider / gizmo / pause) | Canvas 2D `full` | 45–100 ms |
| Grid, 312 points, paused redraw | Canvas 2D `full` | p50 **226 ms**, max 454 ms; Pause issues two full frames back-to-back = **515 ms freeze** |
| Grid, 312 points, playing | WebGL flat quads on a second canvas at DPR-only backing (3840×2160 = ¼ of the product pixels), 1 of 4 vertical stripes per frame | ≈ 2–3 ms GPU, ≈ 6 ms main thread |

Micro-benchmarks on a 7680×4320 Canvas 2D surface: `fillRect` of the whole surface 2.2 ms; 30 rounded-clipped `drawImage` calls 11.6 ms; **one radial-gradient `destination-in` fill over the mask square 64.7 ms** (15.3 ms at 3840×2160, 4.4 ms at 1920×1080). WebGL2 on the same machine: 30 warped 8×8-mesh cards at 1400 px each render in 18 ms at 7680×4320 (fill-rate bound); a WebGL→Canvas 2D `drawImage` copy of a 7680×4320 surface costs **85 ms**, so a "render in WebGL, blit into the 2D product canvas" design is not viable.

### Root causes

1. **The per-frame Canvas 2D composite is fundamentally too expensive at the contractual backing.** The Toolcraft render-scale contract (`docs/toolcraft/core/performance.md`, "Render Scale And Quality") requires the product canvas to keep `CSS × devicePixelRatio × selected scale` backing pixels in interaction, playback, and steady state. At DPR 2 and scale 2 that is 33 megapixels. The single `destination-in` radial-gradient mask in `applyLogoSphereMask` (`src/app/logo-sphere-renderer.ts`) alone costs ~65 ms per frame at that size, before any card is drawn. Every "full" frame is therefore ≤ 15 fps even in the cheapest distribution, and Grid adds one affine draw or 8/18 clipped triangle draws per card (subdivision 1/2/3, bounded by the 88-triangle budget) on top. Iterations 9–13 optimized draw counts and added lower-fidelity tiers around this cost instead of removing it.
2. **Grid cards are flat during motion by design of Iterations 12–13.** `renderQuality` in `src/app/logo-sphere-canvas.tsx` selects `"interaction"` while the pointer drags, through the whole inertia glide after release, or for 650 ms after a release without inertia (`INTERACTION_REFINEMENT_DELAY_MS`), and `"playback"` whenever the timeline plays in Grid. `drawLogoSphereGridCard` (`logo-sphere-grid-warp.ts`) draws a flat `drawInteractionBillboard` for any non-`full` quality, and `selectInteractionGridCards` (`logo-sphere-grid-renderer.ts`) keeps only 48 cards. `createLogoSpherePlaybackVertices` (`logo-sphere-playback-geometry.ts`) emits one flat axis-aligned quad per card with no rounding, stroke, shadow, or sphere warp, drawn on a second canvas whose backing is DPR-only (`playbackWidth/Height` in `logo-sphere-state.ts`), i.e. a quarter of the product pixels at scale 2. The user sees exactly this: while the animation runs (the normal state of the product), the logos are flat white squares that merge into a blob and do not lie on the sphere; only the paused frame is wrapped.
3. **Flicker comes from temporal striping and representation swaps.** `logo-sphere-playback-webgl.ts` (`PLAYBACK_STRIPE_COUNT = 4`) clears and redraws only one vertical quarter of the sphere per frame after the first frame, so adjacent stripes show poses up to three frames apart — visible tearing and shimmer during playback. Play/pause swaps two canvases through the `hiddenCanvas` class, drag start/end swaps the 48-card billboard shell for the wrapped frame, and inertia end restores the full frame — each swap is a visible pop, and the pause swap freezes the UI for 0.5 s at dense counts.
4. **Redundant work on every steady Grid frame.** In `logo-sphere-canvas.tsx` the `full` Grid branch calls `playbackRendererRef.current.prepare(images)` and then renders the hidden WebGL playback surface again after the Canvas 2D frame ("priming"), so every paused redraw pays both renderers.
5. **Animation cadence is coupled to React state churn.** Each timeline tick is a transient store update that re-renders `LogoSphereCanvas` (which subscribes to the whole state through `useToolcraft()`) and re-runs the layout effect whose dependency list includes `state`. This is acceptable once a frame costs a few milliseconds, but it amplifies the 60–500 ms frames today because the store, React commit, and raster flush all serialize on the main thread.

### Why not a smaller fix

- Drawing all four stripes every frame and dropping the priming render removes the striping and the double work, but the moving picture stays flat quads without card styling at a quarter of the selected backing, and the paused frame stays 45–450 ms. This is offered below as an optional 20-minute hotfix (Section 2), not as the fix.
- Restricting the Canvas 2D mask to the feather annulus and clipping cards to the outer circle cuts the mask to roughly 20 ms at 8K; Grid frames still cost 60–300 ms, so the tiers (and the flat cards) would have to stay.
- Lowering the backing during motion is a functional failure under the render-scale contract (`AGENTS.md` item 16) and is rejected.
- Rendering in WebGL and blitting into the 2D product canvas costs 85 ms per frame at 8K on this machine (confirmed again today; Iteration 13 measured 75 ms on SwiftShader). Rejected.
- Three.js would add a large dependency for a scene that is 500 textured patches with custom SDF shading; raw WebGL2 keeps the exact model math and deterministic export. Rejected.

---

## 2. Optional hotfix (only if a stopgap is wanted before Section 3 lands)

- [ ] `src/app/logo-sphere-playback-webgl.ts`: set `PLAYBACK_STRIPE_COUNT = 1` so the whole sphere redraws every frame (kills the tearing/shimmer).
- [ ] `src/app/logo-sphere-canvas.tsx`: in the `full` Grid branch remove the priming `playbackRendererRef.current?.render(...)` call (keep `prepare(images)`), so paused Grid redraws stop paying the second renderer.
- [ ] Run `pnpm typecheck` and `playwright test e2e/logo-sphere-timeline.spec.ts`; the "dense Grid playback" test still passes because it only checks attributes, opacity, and backing sizes.

Do not extend this path further; every line of it is deleted by Section 3.

---

## 3. Target design

### 3.1 One renderer, one canvas, one quality

- `LogoSphereCanvas` renders a single `<canvas data-toolcraft-product-output="logo-sphere">` whose backing is `getLogoSphereCanvasBacking(sceneFrame.rect, devicePixelRatio, canvas.renderScale)` exactly as today (unchanged contract). The playback canvas, `playbackSurfaceActive`, `hiddenCanvas`, `LogoSphereRenderQuality` tiers, `INTERACTION_REFINEMENT_DELAY_MS`, `selectInteractionGridCards`, `drawInteractionBillboard`, the caller-side `quality === "full" ? allocate… : fill(1)` subdivision bypass, and the dirty-region partial clearing are removed.
- The canvas acquires a WebGL2 context (`alpha: true`, `premultipliedAlpha: true`, `antialias: false` (edges are SDF anti-aliased), `depth: true`, `preserveDrawingBuffer: true` so Playwright/app helpers can sample pixels with `drawImage(canvas)` at any time, `desynchronized: false`). If WebGL2 is unavailable or lost permanently, the canvas falls back to a 2D context and the existing Canvas 2D kernel at full quality only; `data-renderer="webgl2" | "canvas-2d"` exposes the branch for browser proof, and `data-render-quality` stays `"full"` in every state.
- Every frame — steady, pointer drag, inertia, timeline playback, scrub, control drag — draws the complete authored scene. There is no lower-fidelity representation anywhere, so nothing can pop.

### 3.2 Frame pipeline (`sphere-composite` pass, unchanged contract)

1. `projectLogoSphere(projection)` gives per-card center, size, opacity, view z (existing, tested).
2. Geometry builder (pure module) produces, per drawable card, an `N×N` patch mesh whose vertices are `createLogoSphereSurfaceCardMapper(projection)(point)(faceX, faceY)` for Grid (exact exponential-map wrap, identical to the paused Canvas 2D outline) and a single quad around the projected center for Fibonacci/Rings. `N` is chosen from projected size: `> 600 px → 8`, `> 240 px → 6`, `> 90 px → 4`, else `2`. Vertex attributes: position (backing pixels), face uv (source uv, mirrored horizontally when the card faces away, exactly like `mirrorRear` today), card alpha, card depth, per-card style params (corner radius in face units, tile index). Cards fully outside the frame or with opacity `< 0.01` are culled as today.
3. Draw order: the stacking order is the model's `compareLogoSphereDrawOrder(distribution)` from the stable-stacking plan (`2026-09-08-stable-card-stacking-order.md`): Grid draws the rear hemisphere first and then a fixed sticker order by descending point index (view-independent, so overlapping neighbours never re-stack while the ball turns); Fibonacci/Rings keep centre-depth order. Every card's GPU depth is its **draw position** (`(count - position) / (count + 1)`, front-most smallest), never its centre `z`. Cards with opacity ≥ 0.995 are drawn in **reverse draw order with depth test + depth write** (early-z rejects covered fragments — this is what keeps 500 overlapping points cheap); all remaining translucent cards are drawn in **draw order with depth test and no depth write** (correct blending, hidden fragments still rejected). Because depth encodes the same order the painter's pass uses, the two passes can never disagree about which card is on top. Fragments outside the rounded rectangle `discard`, so corners never occlude.
4. Shadows: one textured quad per card that casts a shadow today, drawn before that card in the same order, sampling the pre-blurred sprite from `getLogoSphereShadowSprite` uploaded once per style key. Grid keeps the `facing > 0.05` gate, the mapped-center span, and the `facing / 0.45` alpha ramp of `drawGridCardShadow`; Fibonacci/Rings keep `drawProjectedLogo`'s sprite branch for every drawable card (opacity-scaled, no facing gate), so the paused look of every distribution is preserved.
5. Fragment shader: rounded-rectangle SDF in face space (anti-aliased with `fwidth`) clips the card; the white backing is the SDF interior; the logo texture (`texture(atlas, uv)`) composites over it; the outline is a band of `strokeWidth` **scene pixels** (`strokeWidth × pixelRatio` backing pixels, exactly the width the Canvas 2D path strokes under its `setTransform(pixelRatio, …)`), measured through `fwidth`, so it stays constant across depth and along a warped card; the radial fade multiplies alpha by the same linear ramp between `innerRadius` and `outerRadius` as the Canvas 2D gradient; card alpha multiplies everything; output is premultiplied, blend `ONE, ONE_MINUS_SRC_ALPHA`.
6. Atlas: all `LogoSphereImageSource` entries (with their transforms baked, as `drawAtlasTile` does today) are packed into one mipmapped RGBA texture, rebuilt only when the source list changes (`sameSource` logic from the playback renderer). Tile size preserves today's raster fidelity: the default SVG set uses 512 px tiles (its authored 2× raster: 256 px cell × 2); uploads use 1024 px tiles up to 16 sources (matches `VECTOR_RASTER_TARGET_EDGE`), 768 px up to 36, and 512 px up to the 72-upload maximum (9×8 tiles = 4608×4096), always ≤ `MAX_TEXTURE_SIZE`. The texture outlives frames and unrelated interactions and is released on unmount — same retained-resource semantics Iteration 13 declared.
7. Background: preserved pixel-for-pixel. In finite mode with Background on, the 2D path today fills the cleared region with `appearance.background` and adds a `destination-over` fill inside the mask bounds, so the product canvas is opaque there; the WebGL renderer clears to the same opaque background color in that case and to transparent otherwise (Infinity canvas or Background off). The surface `<div>` background stays as it is. Export keeps the `destination-over` fill inside the mask bounds after the blit.

### 3.3 Interaction and playback scheduling

- Pointer drag and inertia keep the current imperative path: `orientationRef` is updated per pointer move, one frame is drawn per animation frame from the ref, and runtime pose commits stay coalesced at 250 ms plus the final commit (Iteration 12 behavior). Because the frame is now the full scene, `sphereInteracting` no longer changes what is drawn; it only prevents the layout effect from redrawing a pose that the imperative path already drew.
- Timeline playback keeps React as the canonical driver (each transient tick re-renders the canvas component and the layout effect draws the frame), which satisfies the timeline contract. The effect's dependency list is narrowed from `state` to the slices the frame consumes (`state.values`, `state.defaults`, `state.timeline`, `state.canvas.mode`, `state.mediaAssets`, `sceneFrame`, `layout`, `registryVersion`) to stop unrelated store churn from redrawing.
- Viewport gestures (`viewportInteracting`) keep suspending redraws and resume from the current timeline state, as required by the timeline-animation rules.

### 3.4 Export

- `appComposition.exportRenderer.renderFrame` renders through the same WebGL2 renderer into a retained offscreen surface sized to the export pixel size (`frame × context scale`, up to 8192×4608 for 8K, within `MAX_RENDERBUFFER_SIZE` on current GPUs), then draws that surface into the runtime-owned 2D export context in scene coordinates. The 85 ms copy is acceptable once per export. If WebGL2 is unavailable, export uses the Canvas 2D kernel so a PNG is always produced.
- `previewRenderer` and `exportRenderer` both become `webgl`; no `previewExportDifferenceReason` is needed. The fallback is recorded as a fidelity risk.

### 3.5 Behavior that must not change

- Model math, distributions, Grid blue-noise fill, tile span, fisheye, opacity curves, mask geometry, orbit deltas, inertia feel, hit test, coalesced pose commits, history labels.
- Schema, controls, defaults, persistence, timeline configuration, export settings, scene bounds provider, pipeline registration ids and invalidation.
- Backing size in every state (`canvas.render-scale` proof unchanged).

---

## 4. File map

- Create `src/app/logo-sphere-gl-geometry.ts` (≤ 400 lines): pure builder — patch meshes, culling, subdivision policy, opaque/translucent ordering, shadow quads, atlas uv lookup. No DOM/WebGL imports.
- Create `src/app/logo-sphere-gl-geometry.test.ts`: deterministic tests (Section 6).
- Create `src/app/logo-sphere-gl-shaders.ts`: GLSL sources and attribute/uniform names.
- Create `src/app/logo-sphere-gl-atlas.ts`: atlas packing/upload, shadow sprite texture, `sameSource` cache, disposal.
- Create `src/app/logo-sphere-gl-renderer.ts` (≤ 600 lines): `createLogoSphereGlRenderer(canvas | offscreen)` → `{ render(input), resize(), dispose(), isLost() }`, context creation, program/buffer/texture state, two draw passes, context-loss handling.
- Create `src/app/logo-sphere-surface-renderer.ts`: `createLogoSphereSurfaceRenderer(canvas)` chooses WebGL2 or the Canvas 2D fallback behind one `render(input)` interface; `renderLogoSphereExportFrame(context, input)` for export.
- Modify `src/app/logo-sphere-canvas.tsx`: single canvas, renderer factory, remove tiers/playback canvas/refinement timer/dirty regions, narrow effect dependencies, `data-renderer` attribute.
- Modify `src/app/logo-sphere-canvas.module.css`: remove `playbackCanvas`/`hiddenCanvas` rules.
- Modify `src/app/logo-sphere-renderer.ts`: keep `renderLogoSphereFrame` as the Canvas 2D fallback with `quality` removed; re-export card types unchanged.
- Modify `src/app/logo-sphere-grid-renderer.ts` and `src/app/logo-sphere-grid-warp.ts`: delete interaction/playback branches (`INTERACTION_*`, `selectInteractionGridCards`, `drawInteractionBillboard`, `quality` parameters); keep the wrapped-card fallback drawing and occlusion culling.
- Modify `src/app/logo-sphere-renderer-types.ts`: remove `LogoSphereRenderQuality`.
- Delete `src/app/logo-sphere-playback-webgl.ts`, `src/app/logo-sphere-playback-geometry.ts`, `src/app/logo-sphere-playback-geometry.test.ts`.
- Modify `src/app/app-composition.tsx`: export through `renderLogoSphereExportFrame`.
- Modify `src/app/app-performance.ts`: `rendererStrategy: "webgl"`, `previewRenderer: "webgl"`, `exportRenderer: "webgl"`, layer renderer `webgl`, updated `intentionalRasterizationReason`, `whyNotAlternativeStrategies` (Canvas 2D at 33 MP measured ≥ 45 ms per frame; blit path 85 ms; Three.js unnecessary), `fidelityRisks` (Canvas 2D fallback; atlas tile resolution at 8K), `performanceRisks` (fragment fill at 500 overlapping points; context loss). The render-plan assessment already lists a pending kernel benchmark for `sphere-composite` at `{distribution-complexity: 2, visible-logos: 500}` with candidates `canvas-2d`/`webgl` (asserted in `src/app/logo-sphere-performance.test.ts`); it stays pending — `docs/toolcraft/core/performance.md` allows `pnpm verify:kernel` only inside a request-authorized performance iteration or an explicit full audit. Update that test only if the candidate set changes.
- Modify `src/app/logo-sphere-performance.test.ts`: keep the pending-benchmark assertion aligned with the `webgl` strategy.
- Modify `src/app/logo-sphere-state.ts`: drop `playbackWidth`/`playbackHeight` from `getLogoSphereCanvasBacking` (dead once the playback canvas is gone); everything else unchanged.
- Modify `src/app/app-verification-impact.json`: add the new modules with `performance` ownership on `sphere-composite`/`sphere-export`, remove the deleted modules, keep acceptance ids.
- Modify `src/app/app-acceptance-data.ts`: renderer wording only where it names Canvas 2D tiers; `renderScaleCoverage` stays `["interaction", "playback", "steady"]`.
- Modify `src/app/logo-sphere-renderer.test.ts`: drop tier tests; keep fallback tests (order, background, cyclic assignment, geometry helper, shadow softness).
- Modify `e2e/logo-sphere-test-helpers.ts`: the scratch-canvas `drawImage(canvas)` sampling already exists; only remove the `canvas.getContext("2d", …)` guard on the product canvas in `readLogoSphereCanvasSignature` and `readLogoSphereOrientationObservation` (it returns `null` for a WebGL canvas), keeping signatures otherwise identical.
- Modify `e2e/logo-sphere-timeline.spec.ts`: replace "dense Grid playback keeps authored backing while motion uses device-pixel LOD" with "dense Grid playback keeps wrapped cards on one canvas at the selected backing" (Section 6).
- Modify `e2e/logo-sphere-sphere.spec.ts`: replace "Grid orbit uses interaction detail without reducing backing pixels" with "Grid orbit keeps the complete wrapped frame at the selected backing".
- Modify `e2e/app-performance-path-adapters.ts`: `verifyOutcome` expects `data-render-quality="full"` for `animation-frame` as well.
- Modify `docs/superpowers/specs/2026-08-11-logo-sphere-design.md`: "Rendering and performance model" describes the unified WebGL2 renderer and the Canvas 2D fallback; remove the Canvas 2D-only rationale.
- Modify `docs/toolcraft/agent-worklog.md`: add "Iteration 14 — Unified WebGL sphere renderer" (request quoted verbatim, root causes above, decision, rejected alternatives, state/output mapping, performance intent `performance-iteration` with the exact request evidence, risks); update the Renderer and Performance decisions.

---

## 5. Tasks

### Task 1: Preflight and baseline
- [ ] Read `docs/toolcraft/workflow.md`, then the Plan/Implementation phases of runtime boundary, renderer technique, timeline animation, core performance, performance, component rules, and the acceptance-testing verification route — one document per read.
- [ ] Record the verification note (Tier 4, above) and open the Iteration 14 worklog entry with the request text and root causes.
- [ ] Declare the technique before renderer code (renderer-technique normative sequence): update `src/app/app-performance.ts` to `rendererStrategy: "webgl"`, `previewRenderer: "webgl"`, `exportRenderer: "webgl"`, layer renderer `webgl`, and the new reasons/risks from Section 4; run `vitest run src/app/app-performance.gates.test.ts src/app/logo-sphere-performance.test.ts`. The `sphere-composite` kernel-benchmark requirement stays pending (functional batch); do not run `pnpm verify:kernel` and never author timings.
- [ ] `pnpm ai:check` and `pnpm typecheck` must pass on the untouched tree.
- [ ] Baseline numbers: in the running app, capture the frame-flush measurement for Grid 30 / Grid 312 (paused redraw and playing) and Fibonacci 30 playing with the diagnostic approach from Section 1 (patch `requestAnimationFrame` only when the tab is hidden; force flush with `getImageData(0,0,1,1)` on the product canvas). Keep the script in `.toolcraft/browser-artifacts/diagnose-frame-cost.mjs` next to the existing diagnostics.

### Task 2: Pure geometry builder (TDD)
- [ ] Write `logo-sphere-gl-geometry.test.ts` first:
  - Grid card patch vertices equal `createLogoSphereSurfaceCardMapper` output for the same face coordinates (compare 8×8 patch corners and midpoints within 1e-6).
  - Fibonacci/Rings produce one axis-aligned quad per card centered at `projected.x/y` with `projected.size`.
  - Subdivision policy follows projected size thresholds; a 500-point sphere never exceeds a fixed vertex budget (assert total vertices ≤ 500 × 81).
  - Cards are ordered by `compareLogoSphereDrawOrder(distribution)`; the depth attribute is strictly monotonic in draw order; opaque cards (opacity ≥ 0.995) are iterated in reverse draw order, translucent cards in draw order; every drawable card appears exactly once; for Grid at 312 points, two overlapping front cards keep the same depth relation across loop progresses `0.24` and `0.26`.
  - Rear-facing Grid cards mirror uv horizontally; front-facing do not.
  - Culling removes off-frame and `< 0.01` opacity cards; positions scale with the backing pixel ratio (backing 2× keeps scene coordinates × 2).
  - Grid shadow quads exist only for `facing > 0.05` and use the `drawGridCardShadow` span/offset/alpha math; Fibonacci/Rings emit a shadow quad for every drawable card with `drawProjectedLogo`'s sprite placement.
- [ ] Implement `logo-sphere-gl-geometry.ts` to pass them. Reuse `getLogoSphereCardGeometry`, `getLogoSphereGridTileSpan`, `getLogoSphereMaskGeometry`; no duplicated projection math.

### Task 3: Atlas and sprite textures
- [ ] Implement `logo-sphere-gl-atlas.ts`: pack sources into tiles sized by the Section 3.2 policy (rotation/flip baked as in `drawAtlasTile`), upload with `UNPACK_PREMULTIPLY_ALPHA_WEBGL`, `generateMipmap`, `LINEAR_MIPMAP_LINEAR`; expose `{ columns, rows, tileSize, ensure(images): boolean, dispose() }`; upload the shadow sprite from `getLogoSphereShadowSprite(style, baseCardSize, deviceScale)` keyed by the same key.
- [ ] Guard against `MAX_TEXTURE_SIZE`: step the tile size down (1024 → 768 → 512 → 256) only when the packed atlas would exceed it, and expose the chosen tile size on the renderer so a unit test can assert the policy.

### Task 4: WebGL2 renderer
- [ ] Implement `logo-sphere-gl-shaders.ts` (vertex: pixel → clip transform, pass-through uv/alpha/depth/style; fragment: rounded-rect SDF with `fwidth` AA, white backing + atlas sample, constant-pixel stroke band, radial mask ramp, `discard` outside the shape, premultiplied output).
- [ ] Implement `logo-sphere-gl-renderer.ts`: context creation with the options from 3.1, program link, one interleaved dynamic vertex buffer + one index buffer per frame, uniforms (resolution, mask center/radii in backing px, stroke color/width, shadow alpha scale), passes in the order shadow → opaque front-to-back (depth write) → translucent back-to-front (no depth write); `webglcontextlost` (preventDefault, mark lost) / `webglcontextrestored` (rebuild); `dispose()` deletes every GL object.
- [ ] Implement `logo-sphere-surface-renderer.ts`: `createLogoSphereSurfaceRenderer(canvas)` → WebGL2 renderer or the Canvas 2D fallback (which calls `renderLogoSphereFrame` with a 2D context), both behind `render({ images, projection, cardStyle, backgroundColor, backing })`; `renderLogoSphereExportFrame(context, input)` renders through a lazily created offscreen WebGL2 surface sized from `context.canvas` and `context.getTransform()`, blits with `context.drawImage`, then applies the `destination-over` background exactly as `renderLogoSphereFrame` does; falls back to the 2D kernel when WebGL2 is unavailable.
- [ ] Visual parity check in the browser (Grid 30, paused): compare the WebGL frame against a Canvas 2D fallback frame side by side (force the fallback only in a local scratch edit of the factory — never ship a query-string or environment switch in product code) for corner radius, stroke thickness, shadow softness, mask feather, and rear opacity. Differences must be limited to anti-aliasing.

### Task 5: Canvas component
- [ ] Rewrite `logo-sphere-canvas.tsx`: one canvas + `createLogoSphereSurfaceRenderer` held in a ref (created after mount, disposed on unmount, recreated when the canvas element changes); `renderFrame(orientation)` builds the projection as today and calls `renderer.render(...)` inside `pipeline.runPass(logoSphereCompositePass, ...)`; pointer/inertia code unchanged except that `interactionFrameRendererRef` draws the full frame; delete `renderQuality`, `playbackCanvasRef`, `playbackRendererRef`, `playbackSurfaceActive`, `refinementTimerRef`, `previousMaskRegionRef`, `backdropSignatureRef`, `getLogoSphereDirtyRegion`, `INTERACTION_REFINEMENT_DELAY_MS`.
- [ ] `startInertia` with zero velocity or zero inertia: just clear `sphereInteracting` (the final pose is already committed by `finishPointer`); no 650 ms timer, no extra dispatch.
- [ ] Narrow the layout-effect dependencies to the consumed slices (Section 3.3) and keep `viewportInteracting` suspension.
- [ ] Keep the `data-*` attributes used by proofs (`data-logo-count`, `data-orbit-*`, `data-ready-image-count`, `data-timeline-progress`, `data-render-quality="full"`), add `data-renderer`.
- [ ] Remove the playback `<canvas>` and its CSS.

### Task 6: Retire the tiers and the old playback overlay
- [ ] Delete `logo-sphere-playback-webgl.ts`, `logo-sphere-playback-geometry.ts`, its test.
- [ ] Strip `quality` from `renderLogoSphereFrame`, `renderLogoSphereGridCards`, `drawLogoSphereGridCard`; delete `selectInteractionGridCards`, `drawInteractionBillboard`, `INTERACTION_FULL_DETAIL_CARD_COUNT`, `INTERACTION_CARD_BUDGET`; keep `allocateLogoSphereGridSubdivisions` and occlusion culling for the fallback.
- [ ] Update `logo-sphere-renderer.test.ts`: remove "replaces Grid surface detail with bounded interaction draw work", "bounds dense Grid interaction cards without changing the full frame", "keeps dense Grid card coverage during lightweight playback"; keep the rest green.
- [ ] `pnpm ai:check` (acyclic graph, line budgets, AST boundary) must pass.

### Task 7: Contracts, docs, and proofs
- [ ] Update `app-verification-impact.json` and `app-acceptance-data.ts` as listed in Section 4 (the `app-performance.ts` technique declaration was done in Task 1); run `vitest run src/app/app-performance.*.test.ts src/app/app-acceptance*.test.ts`.
- [ ] Update `e2e/logo-sphere-test-helpers.ts`, `e2e/logo-sphere-timeline.spec.ts`, `e2e/logo-sphere-sphere.spec.ts`, `e2e/app-performance-path-adapters.ts` (Section 6 scenarios).
- [ ] Update the design spec section and write the Iteration 14 worklog entry.

### Task 8: Verification
- [ ] `pnpm typecheck`; `vitest run src/app/logo-sphere-*.test.ts`.
- [ ] `playwright test e2e/logo-sphere-timeline.spec.ts e2e/logo-sphere-sphere.spec.ts e2e/logo-sphere-canvas.spec.ts e2e/logo-sphere-export.spec.ts e2e/logo-sphere-motion.spec.ts`.
- [ ] Browser pass in the running app at DPR 2: Grid 30 / 312 / 500 — play, pause, drag, release with inertia, gizmo snap, slider drags, radius 140 and 1600, Infinity canvas on/off, upload one PNG logo, export PNG 4K and 8K and open the files. Re-run the Task 1 measurement and record it in the worklog.
- [ ] One bare `npm run verify:delivery`, then `npm run dev`.

---

## 6. Acceptance criteria

Functional (browser proofs, app-owned specs):
- "browser: dense Grid playback keeps wrapped cards on one canvas at the selected backing": Grid + 312 points, Play → `data-render-quality` stays `full`, `data-renderer` reports `webgl2` (or `canvas-2d` when the proof browser has no WebGL2 — the remaining assertions hold either way), no `data-toolcraft-playback-output` canvas exists, `data-timeline-progress` advances, canvas backing equals the paused backing, and the product observable changes between two frames 200 ms apart; Pause → observable stable and backing unchanged.
- "browser: Grid orbit keeps the complete wrapped frame at the selected backing": Grid + 500 points, drag → `data-render-quality` stays `full` throughout, backing unchanged, pose changes, no representation change after release (observable at release + 100 ms equals observable at release + 900 ms with inertia 0).
- Existing proofs keep passing unchanged in meaning: `canvas.render-scale` (interaction/playback/steady backing), `timeline.playback` (seamless forward-only loop), `sphere.orbit` (gizmo/drag/miss-pan), every `sphere.*`, `fade.*`, `card.*`, `motion.*` observable change, media reorder/upload, export dimensions and decoded non-empty pixels, persistence and reset.

Visual (manual pass, recorded in the worklog):
- During playback and drag in Grid, cards are visibly wrapped on the sphere with rounded corners, stroke, and shadow — the moving frame is indistinguishable from the paused frame except for motion.
- No tearing, stripes, or swaps at play/pause and drag start/end; no freeze on pause.
- Fibonacci and Rings look as before.

Performance (diagnostic numbers, DPR 2, scale 2, 7680×4320):
- Grid 30 points: ≤ 6 ms raster + ≤ 4 ms main thread per frame (target 60 fps).
- Grid 312 points: ≤ 16 ms per frame end-to-end (60 fps, p95 ≤ 20 ms).
- Grid 500 points at default logo size (fully covered ball): ≤ 33 ms per frame (≥ 30 fps).
- Pause/Play/drag transitions: no frame above 40 ms.
- Export 4K ≤ 1 s, 8K ≤ 3 s.

---

## 7. Risks and mitigations

- **Fragment fill at 500 points / 8K.** Overlapping front cards can shade 100+ megapixels per frame. Mitigation: opaque front-to-back pass with depth write (early-z), `discard` outside the SDF, shadow quads only for front-facing cards. If the 500-point target is still missed, add a CPU occlusion pre-pass identical to `collectVisibleGridCards` before building geometry.
- **WebGL context loss / unavailability.** Handled by rebuild on restore and the Canvas 2D fallback; the fallback is full-quality-only and slow at 8K (documented risk, matches pre-Iteration-12 behavior).
- **Backing above hardware limits** (Infinity canvas with radius 1600 at scale 2 approaches 14k px): pre-existing hazard for both renderers; clamp to `MAX_RENDERBUFFER_SIZE` only as a hard hardware guard and report through runtime feedback rather than silently shrinking; record in the worklog.
- **Preview/export parity.** Guaranteed by the shared renderer; the export blit is measured at ~85 ms for 8K and runs once.
- **Protected proofs that sample the product canvas.** The protected helpers screenshot the element (compositor), which works with WebGL; only the app-owned helpers need the `drawImage` sampling change.
- **Render-plan assessment.** The pending `sphere-composite` kernel-benchmark requirement is pre-existing and stays pending in this functional batch; a later request-authorized performance iteration can resolve it through protected `pnpm verify:kernel` with `canvas-2d`/`webgl` candidates in `e2e/app-kernel-benchmarks.ts`.
- **Atlas resolution at 8K export** (512 px default-set tiles behind ~1400 px front cards): identical to today's 2× atlas; uploads keep their current 1024 px raster up to 16 sources and step down beyond that (documented fidelity risk); a follow-up can rasterize a 4× default atlas for export only.

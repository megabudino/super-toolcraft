# Implementation Worklog

Active change: template-release-2026-09-09

## Status

Mode: product

## Decision Trail

### Iteration 1 — Interactive logo sphere

- Request: Build an app that places the supplied uploaded logos over a sphere, changes their apparent size with depth, lets the user change the visible count and sphere/fade parameters, and supports cursor-driven animated rotation.
- Task type: Fresh Toolcraft product, custom Canvas 2D renderer, media, spatial interaction, timeline playback, Infinity canvas, image export, persistence, acceptance, and browser delivery.
- User-visible result: Thirty supplied logo cards form an editable perspective sphere. Users can change count, distribution, spread, logo size, depth, perspective, edge fade, feather, rear opacity, spin axis, turns, and inertia; drag the sphere directly or use the orientation gizmo; scrub or play a seamless loop; upload and reorder source images; switch finite/Infinity canvas; and export PNG or JPG output.
- Source/reference checked: `/Users/kusnizza/Desktop/logos/`, the supplied distant visual reference `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-bb4ea38b-db8c-4e54-be0c-fd9167acba8f.png`, the neutral starter, runtime Canvas/Infinity/export/orientation APIs, and the live local application.
- Reference inputs: The screenshot established only the soft card and fade direction; the user's written request is the source of truth for a real spherical arrangement, depth scaling, cursor rotation, animation, visible-count control, fade-mask control, and use of the supplied logo folder.
- Docs/contracts read: `workflow.md`; Plan routes for runtime boundary, assembly, control selection, layout, performance, timeline, setup/export, media, and reference study; Implementation routes for decision contract, schema reference, component rules, renderer technique, and performance; Verification route for acceptance testing.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `infinity-canvas-scene-bounds`, `interaction-surface-ownership`, `controls-product-coverage`, `output-export-required`, `controls-section-inventory-required`, `renderer-technique-inventory`, `renderer-view-interaction`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: The visible editable spatial scene uses `orbit`; direct sphere drag and the runtime orientation gizmo write the same canonical `view.orbit` pose, while a canvas miss remains viewport pan.
- Interaction ownership: Canvas owns direct orbit and inertial release; the orientation gizmo owns axis drag and snap; the panel owns logo sources, numeric appearance/motion parameters, background, export settings, and the export action; the timeline owns playback and scrubbing.
- Decision: Use a retained Canvas 2D renderer with Fibonacci or ring distributions, depth-sorted billboards, perspective scale, radial and rear-hemisphere opacity, one canonical renderer pipeline, exact render-scale backing, and the runtime playback timeline. Bundle the thirty supplied PNGs as default runtime media data so upload, ordering, transforms, reset, persistence, and export share one source collection.
- Alternatives rejected: A flat CSS grid, DOM card transforms without deterministic export, WebGL for this bounded 72-logo workload, canvas-local state, duplicate panel/canvas orbit controls, a fixed camera, layers without a layer workflow, video export without a request, and a screenshot-matched clone.
- State/output mapping: Runtime schema values drive deterministic sphere points, camera pose, projection, opacity, spin, and background. Runtime media order and transforms feed the shared image registry. The same model and renderer draw live preview and image export. Scene bounds derive from current spread and logo size. Persistence retains values, media, canvas, timeline, and panel slices.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Browser image decoding can briefly show fewer cards during startup, so rendering waits for ready runtime presentation URLs. Maximum 8K export remains intentionally batch work. Measured performance was not requested and is not authorized for this delivery.

### Iteration 2 — Stronger depth and continuous edge fade

- Request: Make the sphere depth more apparent because rear logos currently feel equally opaque, and remove abrupt whole-logo disappearance so the silhouette is cut only by a fade.
- Task type: Targeted renderer and projection correction inside the still-open first-delivery batch.
- User-visible result: Front logos remain crisp while deeper logos become progressively smaller and dimmer; the outer silhouette now feathers through each logo's pixels continuously instead of changing the whole card opacity at its center.
- Root cause: Projection multiplied depth opacity by a center-sampled radial mask. Sparse cards therefore crossed the mask threshold as whole units, while the asymmetric depth curve left much of the rear hemisphere too close to full opacity.
- Source/reference checked: The existing projection model, renderer, live sphere output, and fade controls.
- Reference inputs: No new external reference; the user's written depth and fade correction is the source of truth.
- Docs/contracts read: `workflow.md`, runtime boundary, renderer technique, acceptance testing, and performance guidance.
- Contract rules applied: `canvas-surface-preserved`, `renderer-technique-inventory`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Preserve the existing `orbit` scene interaction without changing camera ownership.
- Interaction ownership: Canvas and orientation gizmo retain orbit ownership; panels retain depth and fade controls.
- Decision: Keep rear-depth opacity in the projection model, make its curve symmetric and more pronounced, remove center-sampled mask opacity from card alpha, and apply one frame-level Canvas 2D `destination-in` radial gradient before placing the background behind the logo layer.
- State/output mapping: `sphere.depth`, `sphere.perspective`, and `fade.rearOpacity` determine Z scale and depth alpha; `fade.maskSize` and `fade.feather` determine radial gradient geometry only. Preview and export call the same renderer with the same runtime background intent.
- Alternatives rejected: Hiding additional rear points, clipping cards with a hard path, per-card opacity thresholds, per-logo scratch canvases, and a full-frame auxiliary canvas. These either preserve popping, create hard edges, or add unnecessary per-frame memory/work.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: The new silhouette changes exact export pixel bounds and samples, so image-artifact expectations must be remeasured from the deterministic frame rather than copied from the prior renderer.

### Iteration 3 — Supplied SVGs and depth-aware card styling

- Request: Replace the built-in logos with the SVG files from the same folder; add configurable outline width/color, keep outline width constant through perspective scale, add corner rounding that changes with distance when physically correct, and add a similarly depth-responsive shadow.
- Task type: Source-format, schema, renderer, export, persistence, acceptance, and browser extension inside the open first-delivery batch.
- User-visible result: The sphere now uses all 30 supplied 82×82 SVG cards. Card Style exposes Stroke width/color, Corner radius, and Shadow color/opacity/blur/offset. Near and far cards share one screen-pixel outline width, while visible corner radius, shadow blur, and shadow offset scale with perspective; rear depth opacity also weakens the shadow.
- Source/reference checked: All 30 lexically sorted `.svg` files in `/Users/kusnizza/Desktop/logos/`; each declares an 82×82 authored card with a white background, logo vectors, clipping, and a subtle source shadow.
- Reference inputs: The supplied SVG files and the user's styling requirements are the source of truth; no independent visual clone was requested.
- Docs/contracts read: `workflow.md`, media upload, runtime boundary, renderer technique, schema reference, acceptance testing, and performance guidance.
- Contract rules applied: `canvas-surface-preserved`, `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Preserve the existing `orbit` scene interaction while card appearance changes remain panel-owned.
- Interaction ownership: Canvas and orientation gizmo retain orbit ownership; the Card Style panel owns the new appearance operations.
- Decision: Preserve the supplied SVG bytes and package them inside one attached SVG atlas. Expand the atlas into 30 source rectangles in the image registry, so the runtime hydrates one durable source while the renderer still assigns and projects 30 distinct logos. Draw a rounded white card and depth-scaled shadow, clip the SVG, then draw a constant-width outline before the continuous sphere fade.
- Physical model: Corner radius, shadow blur, and shadow offset are card-space quantities and multiply by `projected.size / baseLogoSize`; outline width is a deliberate screen-space styling exception and never multiplies by depth scale. Shadow alpha is additionally multiplied by each projected card's depth opacity.
- Alternatives rejected: Thirty concurrent default SVG media assets because runtime hydration contention delayed uploads; editing the authored logo paths; scaling the outline with the card; fixed-size far-card corners/shadows; DOM filters with a separate export path; and hidden renderer-only defaults.
- State/output mapping: Seven `card.*` schema targets feed one pure card-style resolver and the shared preview/export draw kernel. Values persist in the runtime `values` slice; the canonical composite pass invalidates for every style change without rebuilding sphere layout.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: The supplied SVGs contain their own subtle authored filter, so the configurable Canvas shadow supplements rather than destructively rewriting source vectors. Extreme 8K export remains batch work.

### Iteration 4 — Soft shadow rendering, authored-card crop, and inertia release smoothing

- Request: Verify the previously requested constant-width outline plus distance-responsive corner rounding and shadow, and improve logo animation behavior; the user selected smooth drag-release inertia as the improvement scope, then reported that the card shadow does not blur and that a gray band appears near the bottom of each card.
- Task type: Renderer output correction, default-source crop correction, and canvas-interaction behavior fix inside the still-open first-delivery batch.
- User-visible result: Card shadows are now genuinely soft blurred silhouettes that look identical in live preview and in 2K/4K/8K exports at any render scale; the gray band baked into the supplied SVGs no longer appears at card bottoms; and releasing a sphere drag no longer jerks: a pause before release cancels stale velocity, flick strength no longer depends on pointer event rate or display refresh rate, and the glide decays identically on 60 Hz and 120 Hz screens.
- Root cause: Canvas 2D `shadowBlur` and `shadowOffsetY` are device-space values that ignore the current transform, so the card-space blur was divided by every devicePixelRatio × renderScale × export factor and the visible part of the shadow was dominated by the hard-edged solid cast shape drawn below the card. The band was the authored drop shadow plus inner edge bevels baked into each supplied 82×82 SVG, whose white card only occupies an 80×80 region; stretching the full canvas onto the card exposed the baked styling as a stripe. Release velocity was the last single pointer-event delta: stale after a hold, uncapped, and per-event rather than per-time, while the inertia loop applied fixed per-frame decay that ran twice as fast on 120 Hz displays.
- Source/reference checked: The live card shadow and crop output, supplied SVG artwork, pointer interaction, and preview/export renderer paths.
- Reference inputs: The user's visible shadow, gray-band, and release-smoothing reports are the source of truth.
- Docs/contracts read: `workflow.md`; Plan routes for decision contract, runtime boundary, and core performance; Implementation routes for component rules, renderer technique, and performance; timeline-animation core rules; acceptance-testing verification route.
- Contract rules applied: `canvas-surface-preserved`, `interaction-surface-ownership`, `renderer-technique-inventory`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Preserve `orbit` and make only its inertial release time-based and stable.
- Interaction ownership: Canvas owns drag and inertial release; the orientation gizmo retains axis manipulation; panels retain card styling.
- Decision: Draw the shadow as the blurred silhouette of an off-frame cast shape — the source shape sits far above the clipped frame and only its device-scaled offset shadow lands on the card — so no hard fill edge is ever visible and blur/offset multiply by the `context.getTransform()` scale for backing parity. Crop the atlas source rectangles to the clean authored card interior (82-unit canvas → 77-unit interior) so the baked drop shadow, bevels, and atlas-edge sampling stay outside projected cards. Track pointer velocity as a time-normalized exponentially smoothed value, fade it to zero across a 40–120 ms hold before release, cap release speed, and make inertia decay and rotation steps proportional to real elapsed frame time.
- Alternatives rejected: Keeping the solid cast shape with scaled blur only, which still reads as a plate at low blur; editing or re-authoring the supplied SVG bytes to strip their filters; pre-rendering shadows into offscreen sprites; a spring-based orbit controller that would change feel beyond the requested fix; sampling velocity from only the final event pair; and leaving decay frame-locked.
- State/output mapping: The same seven `card.*` targets feed the unchanged pure geometry helper; the draw kernel consumes the context transform scale for its device-space shadow kernel in both preview and export passes, and the image registry maps the attached atlas through authored-crop constants owned by the asset module. `motion.inertia` still owns glide retention; release velocity is derived from the live pointer session only and never persists.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Shadows become visibly softer than the previously under-blurred preview, which is the corrected intent; the authored-card crop trims about 1.5 units of authored edge treatment per side, which removes the baked bevel highlight by design; extremely fast flicks are now capped, which slightly changes maximum glide speed.

### Iteration 5 — Organic sphere-distorted Grid mode with a true radius control

- Request: Add a mode with logos over a sphere; through steering the user required whole-sphere coverage rotating with the ball, lag removal, an organic (non-artificial) distribution with breathing room, a genuine sphere-radius control instead of Spread, and cards genuinely distorted by the sphere rather than lying flat on tangent normals.
- Task type: Model, renderer performance, schema, state, pipeline, acceptance, and browser extension inside the still-open first-delivery batch.
- User-visible result: Distribution gains a third Grid option that fills the whole sphere with evenly spaced organic points (a relaxed blue-noise set; the Points slider sets how many, and source logos repeat onto them). Each card wraps onto the sphere surface through the exponential map, so it is visibly distorted by the ball, while its tangent frame is built in view space with a strictly horizontal axis, so every logo stays upright on screen — never rotated — through spin and orbit; only physical perspective convergence remains. Edge cards curve and foreshorten with the surface, and the rear hemisphere shows through faintly with forward-reading logos. All cards share one base size, so every on-screen size difference is pure sphere perspective — largest toward the viewer, shrinking toward the limb and rear — and grid opacity fades on true facing with a steepened curve so the ball visibly darkens from the front card outward instead of reading near-uniform. The former Spread slider is now Sphere radius in pixels (140–1600) in every distribution, from a compact ball to one far larger than the frame. Depth reads through the standard rear-opacity falloff, and shadows fade out toward the limb so the ball stays clean.
- Root cause of the earlier lag: Every per-frame drawImage of the attached SVG atlas forced browsers to re-rasterize vector source (measured ~1.19 s per frame in an instrumented Chromium run), and per-card Canvas shadow blur added large Gaussian kernels every frame in all modes.
- Source/reference checked: The user's reference render of an organically covered logo ball, the existing sphere model and pipeline, an instrumented Chromium frame-time benchmark, and rendered-frame screenshots at default, small, huge, and mid-spin states compared against the reference.
- Reference inputs: The supplied reference established organic whole-sphere coverage; the user's written steering established upright, wrapped cards and true radius behavior.
- Docs/contracts read: `workflow.md`, runtime boundary, control selection, renderer technique, timeline animation, acceptance testing, and performance guidance.
- Contract rules applied: `canvas-surface-preserved`, `interaction-surface-ownership`, `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Preserve `orbit` so the wrapped Grid rotates through the same canonical pose as other distributions.
- Interaction ownership: Canvas and orientation gizmo own orbit; the Sphere panel owns distribution and radius; the timeline owns transport.
- Decision: Grid layout points are a deterministic blue-noise set: an offset Fibonacci lattice decorrelated with hash-based tangent jitter and evened back out by repulsion relaxation (memoized per count), after user steering showed the pure lattice's spiral arms reading as straight rows and columns of cards; nearest-neighbor distances stay within about 30 percent across the sphere with no visible alignment; card base size derives from the per-card sphere-area share times the Logo size factor, computed identically in model and renderer, with no per-card variation — an earlier golden-ratio size jitter was removed after the user required equal sizes at equal depth — so size differences are exclusively the sphere's perspective; grid opacity swaps the shared falloff for a steeper facing-based curve (smoothstep over the full view-z range raised to 2.2) so depth fading is unmistakable. Cards render as surface patches: the rounded footprint and an adaptive texture mesh map through the exponential-map surface mapper shared with the center projection, the tangent frame is derived after spin and orbit with a horizontal east axis so cards never roll, the constant-width outline strokes the projected path, shadows draw from cached pre-blurred sprites with alpha scaled by facing, and rear-facing cards sample their texture unmirrored so logos read forward through the ball. The radius control feeds projection directly and the same value drives infinite-mode scene bounds. Performance: the SVG atlas is rasterized once into a 2x bitmap in the image registry and shadow sprites replace per-frame Gaussian blur in every mode; instrumented frame time dropped from ~1.19 s to about 10 ms at 72 wrapped cards on software rendering.
- Alternatives rejected: Aligned latitude/longitude rows, rejected as artificial; a raw jittered scatter without relaxation, rejected as uneven; the pure offset Fibonacci lattice, rejected after user steering because its parastichy arms read as straight card rows from the front; a world-space geographic tangent frame that rolled cards into diamonds during spin; flat billboards and capped-tilt plates, which erased the sphere's distortion; a relative Spread multiplier; a deterministic per-card size jitter, removed once the user required equal sizes at equal depth; mirrored rear textures; per-frame SVG drawing; and per-card offscreen warp canvases.
- State/output mapping: `sphere.distribution` gains the `grid` option in the same segmented control and layout cache key; `sphere.radius` (px) replaces `sphere.spread` across schema, state, projection, pipeline invalidation, acceptance, and impact ownership; grid card size derives from `visibleCount` and the radius alone, so no additional target exists.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Persisted `sphere.spread` values from earlier sessions are ignored in favor of the radius default; at very small radii the fixed pixel-valued shadow styling is large relative to the cards, which the Shadow sliders resolve; at maximum radius most of the sphere intentionally lies outside the frame.

### Iteration 6 — Fisheye wide-angle slider

- Request: A slider working like a fisheye effect that increases the magnification and distortion of the nearest logos from the front.
- Task type: Model, renderer shadow fix, schema, state, pipeline invalidation, acceptance, impact ownership, and browser extension inside the still-open first-delivery batch.
- User-visible result: The Sphere section gains a Fisheye slider (0–100 percent, default 0). Raising it performs a dolly-zoom: the sphere silhouette keeps its exact screen size, so nothing reads as zoom, while the front-most logos grow dramatically and visibly distort through the sphere projection itself, mid-ring neighbors hold nearly their base size, and the limb and far hemisphere compress like a wide-angle edge — the size contrast between the front logos and their neighbors rises. Zero leaves the existing look untouched in every distribution.
- Source/reference checked: The existing projection model, rendered Chromium frames at zero, half, and maximum fisheye in Grid and Fibonacci distributions, and a numeric front-clearance sweep across point counts and perspective values.
- Reference inputs: The user's written fisheye behavior is the source of truth; live rendered comparisons establish the expected silhouette and front magnification.
- Docs/contracts read: `workflow.md`, runtime boundary, control selection, renderer technique, acceptance testing, and performance guidance.
- Contract rules applied: `canvas-surface-preserved`, `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Preserve the same `orbit` pose while fisheye changes only projection optics.
- Interaction ownership: Canvas and orientation gizmo own orbit; the Sphere panel owns fisheye; the timeline owns transport.
- Decision: Fisheye interpolates the camera distance in optical power (1/distance) from the Perspective value down to an ultra-wide minimum just outside the sphere (`max(1.32, depth + 0.24)` radii), shared by the center projection and the surface-card mapper, so near cards gain both scale and genuine per-vertex perspective distortion through one real projection that can never fold. After user steering that the raw dolly read as zoom, the whole projection is renormalized by the silhouette ratio `f(base) / f(effective)` with `f(E) = E / sqrt(E^2 - d^2)`, pinning the sphere's widest screen ring exactly: the framing holds while front cards gain up to about 1.7x against nearly unchanged mid neighbors and the rear compresses to about 0.64x. The infinite-scene bounds run through the same effective perspective and normalization. The grid shadow sprite basis moved from a corner-anchored affine to a center-anchored central-difference affine, which keeps shadows attached to strongly curved close-up patches.
- Alternatives rejected: A facing-based per-card scale boost, which overlapped front cards because spacing stayed fixed; a dual-profile variant that also displaced positions radially, which stretched mid-ring patches into smears and detached their shadows; a screen-space barrel remap, which would magnify the faint rear card at the screen center instead of the near logos; the un-normalized dolly, rejected after user steering because the whole ball inflated and read as zoom rather than added front contrast; a mid-ring-pinned normalization, whose silhouette still grew about nine percent.
- State/output mapping: New `sphere.fisheye` slider target flows through settings (percent to 0–1), projection input, composite control-drag invalidation, acceptance row and sphere inventory, impact ownership, and the browser slider matrix; the Sphere section now holds eight controls, so every control carries a `semanticGroup` (`sphere-fill`, `sphere-body`, `sphere-lens`, `sphere-pose`).
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: At maximum fisheye the front card intentionally dominates and can cover mid-ring cards, matching a real close-up wide-angle shot; combined maximum depth and fisheye approach the near-clip guard, which the `depth + 0.24` floor keeps stable; the silhouette is pinned by construction, and the limb ring compresses up to roughly twenty percent at maximum, which is the intended wide-angle edge squeeze.

### Iteration 7 — Points to 500 with a dense-sphere renderer overhaul

- Request: Stop capping the fill points at 72 and allow far more.
- Task type: Model clamp, schema, layout clamp, renderer performance for dense spheres, acceptance, and browser extension inside the still-open first-delivery batch.
- User-visible result: The Points slider now reaches 500 (from 72). The evenly spaced fill, cell-fit card sizing, perspective sizing, depth fade, and fisheye all extend unchanged, so a maximum sphere becomes a dense evenly covered logo ball; source logos keep repeating onto the points.
- Root cause of the dense-sphere frame cliff: An instrumented Chromium profile attributed most of a ~200 ms frame at 500 cards to canvas save/clip/restore pairs and drawImage calls — about ten per card via the fixed 2x2 texture mesh — with software rasterizers also degrading on rotated sprite draws and on per-card destination-size churn that defeats the scaled-image cache.
- Source/reference checked: The live Points control, model clamp, dense Grid output, renderer pipeline, and instrumented Chromium frames up to 500 cards.
- Reference inputs: No new external reference; the user's request to extend the existing fill beyond 72 is the source of truth.
- Docs/contracts read: `workflow.md`, control selection, runtime boundary, renderer technique, acceptance testing, and performance guidance.
- Contract rules applied: `canvas-surface-preserved`, `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Preserve `orbit` at the expanded point-count range.
- Interaction ownership: Canvas and orientation gizmo retain orbit; the Sphere panel owns Points; the timeline owns transport.
- Decision: The clamp, schema maximum, and layout-pass clamp move to 500, and the slider is classified stepped-continuous now that the 6–500 integer domain is far beyond marker scale. The renderer scales work with density instead of assuming 72 cards: the texture mesh follows on-screen size (one warped cell under 44 px, 2x2 to 150 px, 3x3 above), the grid cast shadow becomes its own pass helper drawing an axis-aligned square-span sprite fitted around the mapped card center (rotation-free and smooth-scaling along the depth-sorted order), sprite blur and padding scale with the card's base size so dense spheres get proportionally small soft shadows, the sprite bakes through an OffscreenCanvas into an immutable ImageBitmap, the device scale is read once per frame instead of per card, and cards fully outside the frame are culled before any per-card math.
- Alternatives rejected: Keeping a smaller cap (the measured bottlenecks were fixable, not inherent); chunked shadow/body passes and quantized shadow destinations, which profiling showed attacked the wrong mechanism; skewed affine shadow sprites, which fall off rasterizer fast paths at high counts.
- State/output mapping: `sphere.visibleCount` keeps its target, default, and step; only the maximum and the slider value-kind change, and the acceptance observable now names 6 through 500.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: At 500 points cards are small, so the fixed-pixel Card Style values read differently than on sparse spheres, which the existing sliders resolve; persisted workspaces keep their stored Points value and simply gain slider range; shadows are now square-span blobs, indistinguishable at card scale but no longer skewed with extreme foreshortening.

### Iteration 8 — Point count decoupled from logo size

- Request: Increasing the point count must not shrink the logos.
- Task type: Model sizing, renderer and state call sites, acceptance wording, and unit proof inside the still-open first-delivery batch.
- User-visible result: The grid card span is now a constant of the sphere (one cell of the reference 30-point fill), so the default look is unchanged while raising Points only densifies the coverage: logos keep their exact size and progressively overlap into a fully covered ball. Card size is driven solely by Logo size, the sphere radius, and perspective.
- Source/reference checked: The existing Grid output at 30, 90, and 200 points, model sizing helpers, and renderer/state call sites.
- Reference inputs: The user's written requirement that point count never resize logos is the source of truth.
- Docs/contracts read: `workflow.md`, runtime boundary, renderer technique, acceptance testing, and performance guidance.
- Contract rules applied: `canvas-surface-preserved`, `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Preserve `orbit`; only Grid density and card sizing semantics change.
- Interaction ownership: Canvas and orientation gizmo retain orbit; the Sphere panel separately owns Points and Logo size.
- Decision: `getLogoSphereGridTileSpan` loses its count parameter and returns the reference-cell constant, applied identically in projection, renderer, and infinite-scene bounds; blue-noise fill, perspective sizing, depth fade, and fisheye are untouched.
- Alternatives rejected: Cell-fit sizing per count, rejected by user steering; decoupling from the sphere radius as well, rejected because cards lying on a ball should scale with the ball.
- State/output mapping: No target changes; the Points and Logo size acceptance observables now state that count never changes card size.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Beyond roughly 50 points cards intentionally overlap at the default Logo size, and extreme Points with large Logo size is fill-heavy; both resolve through the Logo size and Sphere radius sliders.

### Iteration 9 — Animation performance for dense spheres

- Request: Animation lags; investigate and improve performance.
- Task type: Renderer-only optimization inside the still-open first-delivery batch.
- Root cause: Three stacked costs in the dense grid. Most fundamentally, an instrumented sweep isolated a rasterizer capability knee at roughly four thousand clipped texture draws per frame — between 400 and 450 cards at the standard mesh, frame time jumps from ~18 ms to ~890 ms. On top of that, every fully hidden rear card still drew its shadow, backing, mesh, and stroke, and every card traced its outline twice for fill and clip.
- User-visible result: Identical pictures at dramatically lower frame cost. Rendered output is byte-identical with occlusion culling on and off across five configurations, and the interactive matrix now sits at 2–17 ms per frame from 30 through 500 points across radii (previously up to ~900 ms), with only frame-filling giant-radius spheres remaining fill-bound around 50–70 ms on software rendering.
- Source/reference checked: The live dense Grid animation, instrumented Chromium frame sweeps, renderer call counts, and byte-comparison screenshots.
- Reference inputs: The user's report that animation lags is the source of truth for the affected visible playback operation.
- Docs/contracts read: `workflow.md`, runtime boundary, renderer technique, acceptance testing, and performance guidance.
- Contract rules applied: `canvas-surface-preserved`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: Preserve `orbit` and timeline playback while reducing the frame cost of the shared composite path.
- Interaction ownership: Canvas and orientation gizmo retain orbit; the timeline retains playback; the renderer owns drawing efficiency only.
- Decision: Three renderer changes. First, a conservative front-to-back occlusion pass over a coarse screen grid accumulates per-cell transmittance from the strictly interior boxes (corner plus edge-midpoint samples, corner-inset) of near-opaque cards, skipping a card and its shadow only when every cell it could touch keeps under one intensity level of see-through or lies wholly outside the radial mask — provably invisible skips. Second, a per-frame triangle budget (2600) keeps the mesh under the rasterizer knee: when dense spheres would exceed it, rear faded cards drop to a single warped cell first while near cards keep their full mesh, and the size thresholds were retuned (one cell under 60 px, 2x2 to 260 px, 3x3 above). Third, one traced outline now serves both the white backing fill and the texture clip.
- Alternatives rejected: Pattern-fill triangles instead of clipped draws, only ~1.3x past the knee; chunked shadow/body passes, quantized shadow sizes, and sprite source swaps, all shown by profiling to target the wrong mechanism; skipping translucent rear cards aggressively, which would visibly change the depth fade.
- State/output mapping: No schema or target changes; behavior is identical at identical settings.
- Performance intent: performance-iteration
- Performance request evidence: "Animation lags"
- Performance paths: ["performance-path:%5B%22interactive-continuous%22%2C%22animation-frame%22%2C%5B%22sphere-composite%22%5D%2C%5B%22main%22%5D%2C%5B%22distribution-complexity%22%2C%22visible-logos%22%5D%5D"]
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Under the triangle budget, rear cards at extreme density use a single-cell mesh, whose slight texture-warp difference hides behind the depth fade and the covering front shell; giant-radius frame-filling spheres remain fill-bound by nature.

### Iteration 10 — Localized Grid animation optimization

- Request: вариант грид тормозит сейчас, давай работать над его оптимизацией
- Task type: Localized Canvas 2D renderer performance iteration for the visible Grid animation.
- User-visible result: Grid retains the exact 2× backing, sphere-surface outline, front-card texture mesh, rounded cards, strokes, shadows, fade, orbit, timeline, and export behavior while reducing per-frame clipped texture work. The default 30-point Grid keeps full mesh detail on the four front-most cards and uses one affine texture patch inside the same exact curved outline for the faded rear shell; dense frames keep one patch per card instead of crossing the rasterizer's clip/draw knee.
- Root cause: The old 2600-triangle budget was effectively inert at the normal 30-point Grid and allowed eight clipped texture draws per card. At 3840×2160 the measured default Grid executed about 254 `drawImage` calls and 271 clip operations per frame, producing about 21 FPS versus 28–30 FPS for Fibonacci/Rings. The declared performance envelope was also stale at 72 points and treated Distribution as responsiveness even though Grid changes the composite cost independently.
- Source/reference checked: The live local app in instrumented Chromium at 30 and 312 points, the current renderer/model/pipeline, the pre-change Grid screenshot in `.toolcraft/browser-artifacts/grid-before.png`, and the generated Toolcraft performance compiler.
- Reference inputs: The user's exact Grid slowdown report identifies timeline animation in the Grid distribution as the affected visible operation; no new visual reference was supplied.
- Docs/contracts read: `workflow.md`; Plan phase `decision-contract.md`, `core/runtime-boundary.md`, and `core/performance.md`; Implementation phase `component-rules.md`, `renderer-technique.md`, and `performance.md`; Verification phase `acceptance-testing.md` and `performance.md`.
- Contract rules applied: `canvas-surface-preserved`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`. Selected backing resolution, source fidelity, product limits, live playback, and shared preview/export behavior remain unchanged.
- View interaction intent: Preserve `orbit` and timeline playback exactly; optimize only the shared Grid composite workload.
- Interaction ownership: Canvas and orientation gizmo retain orbit; the timeline retains playback; the renderer owns drawing efficiency only.
- Decision: Replace the unreachable coarse triangle ceiling with a frame-level detail allocator. It removes detail rear-to-front, preserves every sparse six-card Grid at full 2×2 detail, keeps four front-most cards detailed at the default count, and never drops below one patch per visible card. The one-cell rear level uses one affine texture draw inside the existing projected rounded outline instead of two separately clipped triangles. Model `sphere.distribution` as a discrete workload dimension (`fibonacci=0`, `rings=1`, `grid=2`) and restore the true 500-point boundary; the compiled development fixture is Grid plus approximately 312 points and maximum is Grid plus 500. Keep the renderer dependency graph acyclic by separating shared card types, raster helpers, Grid warping, and Grid orchestration into focused production modules while retaining `logo-sphere-renderer.ts` as the stable public frame API.
- Alternatives rejected: Lowering render scale or canvas dimensions, capping Points below 500, skipping visible rear cards, reducing animation cadence, and moving only preview to a separate WebGL renderer. Those options weaken authored quality/product scope or split deterministic preview/export behavior instead of removing redundant Canvas state and draws.
- State/output mapping: No product target or default changes. `sphere.visibleCount` and `sphere.distribution` now jointly describe layout/composite/export workload; the existing `sphere-composite` and `sphere-export` passes continue to call the same renderer, whose allocation depends only on the already projected rear-to-front card list.
- Performance intent: performance-iteration
- Performance request evidence: "вариант грид тормозит сейчас"
- Performance paths: ["performance-path:%5B%22interactive-continuous%22%2C%22animation-frame%22%2C%5B%22sphere-composite%22%5D%2C%5B%22main%22%5D%2C%5B%22distribution-complexity%22%2C%22visible-logos%22%5D%5D"]
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: At high counts the faded rear shell uses affine texture mapping while the outer card remains exactly sphere-wrapped; the front-most cards retain the higher-detail mesh where internal curvature is visible. The project has no previous successful delivery, so this boundary must create the mandatory first functional receipt; protected measured performance requires a later user-evaluation iteration.

### Iteration 11 — First product delivery closure

- Request: Complete the accumulated working product as its mandatory first product delivery before any later protected measured iteration.
- Task type: Delivery-contract closure for the existing coherent product state; no additional user-visible behavior change.
- User-visible result: The complete logo-sphere product and the current Grid rendering improvement are delivered together with functional acceptance, production build, and browser proof. Runtime color-control values now feed their `{ hex }` representation into stroke and shadow rendering instead of silently falling back to defaults.
- Source/reference checked: The current product schema, renderer pipeline, acceptance inventory, live browser output, and all preceding decision entries.
- Reference inputs: No new reference input; this entry closes the accumulated first product delivery required by the project lifecycle.
- Docs/contracts read: `workflow.md`, runtime boundary, acceptance testing, performance guidance, and the delivery lifecycle contract.
- Contract rules applied: `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Preserve the shipped `orbit` interaction and timeline playback without further changes.
- Interaction ownership: Existing canvas, gizmo, panel, timeline, and runtime export ownership remains unchanged.
- Decision: Close the overdue first product delivery as functional proof; each earlier localized performance complaint remains documented, but protected measured performance requires a previous successful delivery receipt. Normalize both persisted string colors and runtime `{ hex }` colors at the product state boundary, and align the media/persistence browser fixtures with their current typed lifecycle and 500-point maximum.
- Alternatives rejected: Skipping the mandatory first functional receipt or treating local diagnostic timings as a protected performance receipt.
- State/output mapping: No state or output mapping changes; this closure verifies the current product state.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Protected measured performance remains deferred until a later delivery can derive authority from the successful first receipt.

### Iteration 12 — Cooperative Grid drag rendering

- Request: все также тормозит при взаимодействии
- Task type: Localized performance iteration for direct Grid sphere drag/orbit on the main-thread composite path.
- User-visible result: Dense Grid drag now follows the pointer through a bounded interaction representation of the same rotating sphere, then restores the complete curved-card render after release. Canvas size, selected 2× backing, runtime pose, history, inertia, timeline state, source logos, steady preview, and export output remain unchanged.
- Root cause: Pointer movement previously coupled every animation-frame preview to a full runtime/React pose commit and the complete Grid composite. At dense counts that repeatedly paid curved texture clips, shadows, strokes, and the full-backing radial destination mask while the pointer was still moving. The main thread therefore spent too long inside individual frames even after the earlier steady Grid mesh optimization.
- Source/reference checked: The live local Grid at its reachable dense point count, instrumented Chromium pointer drags, the canvas/orbit runtime hook, the Grid warp/composite modules, the canonical performance path compiler, and browser screenshots of interaction and refined states.
- Reference inputs: The user's exact report identifies interaction in the previously established Grid variant as the affected visible operation; no new external visual reference was supplied.
- Docs/contracts read: `workflow.md`; Plan phase `decision-contract.md`, `core/runtime-boundary.md`, and `core/performance.md`; Implementation phase `component-rules.md`, `renderer-technique.md`, and `performance.md`; Verification phase `acceptance-testing.md` and `performance.md`.
- Contract rules applied: `canvas-surface-preserved`, `interaction-surface-ownership`, `renderer-technique-inventory`, `renderer-view-interaction`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: Preserve `orbit` over the canonical `view.orbit` pose; the optimization changes scheduling and transient draw detail, not the spatial interaction model.
- Interaction ownership: Canvas retains direct drag and inertial release; the orientation gizmo retains axis manipulation; the runtime command bus retains pose/history authority; the renderer owns only transient interaction scheduling and drawing.
- Decision: Draw pointer and inertia preview frames imperatively from the current pose while coalescing runtime pose commits to a 250 ms cadence plus the mandatory final commit, and do not redraw an already current transient frame when a coalesced runtime commit reconciles React state. During that bounded interaction window, draw an evenly sampled 48-card shell as cheap source-faithful billboards whose edge clearance preserves the circular silhouette without curved texture clips, shadows, strokes, or a full-backing gradient composite; spheres at or below 48 points keep every card. Clear only the previous/current sphere region between interaction frames. Return to the complete curved Grid renderer 650 ms after a zero-inertia release or immediately when inertia settles. Keep the physical canvas backing at the selected 2× scale throughout.
- Alternatives rejected: Reducing canvas backing or render scale, lowering the product's 500-point boundary, delaying pointer feedback until release, changing the canonical pose outside the runtime command bus, leaving the expensive radial pixel mask active during drag, and launching an unrelated complete performance audit.
- State/output mapping: `view.orbit` remains the sole persistent pose. A ref holds the newest transient pose between coalesced commits; `sphereInteracting` selects only the interaction draw plan. Full steady preview and export continue through the unchanged canonical renderer inputs and full-quality branch.
- Performance intent: performance-iteration
- Performance request evidence: "все также тормозит при взаимодействии"
- Performance paths: ["performance-path:%5B%22interactive-continuous%22%2C%22control-drag%22%2C%5B%22sphere-composite%22%5D%2C%5B%22main%22%5D%2C%5B%22distribution-complexity%22%2C%22visible-logos%22%5D%5D"]
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: The interaction shell intentionally carries less internal card detail than the refined frame, so very dense overlaps visibly sharpen after release; the shell still preserves a filled circular silhouette, all source identities through repetition, pose direction, and exact backing resolution.

### Iteration 13 — Dense Grid timeline playback rendering

- Request: анимация тормозит найди причину и почини
- Task type: Localized performance iteration for dense Grid timeline playback on the main-thread `sphere-composite` path.
- User-visible result: Grid timeline playback now keeps the complete selected point population moving at the selected 2× backing size through a lightweight all-card playback representation. Pausing immediately restores the complete curved cards, rounded outlines, shadows, strokes, and radial mask; steady preview and image export remain on the full renderer.
- Root cause: The prior drag optimization was scoped only to direct orbit. Timeline playback still executed the full curved Grid composite on every runtime animation frame, so the reachable Grid + 312-point development fixture repeatedly paid hundreds of rounded outline maps, clipped affine/triangle texture draws, shadows, strokes, occlusion work, and a full-quality radial composite. A live reproduction measured p50 225.6 ms, p95 342.1 ms, and a 376 ms long task while `data-render-quality` remained `full` throughout playback. The first lightweight Canvas attempt kept all 312 cards but still issued one 2D `drawImage` per card and measured about 42 ms p95, isolating that bottleneck to per-card high-resolution Canvas raster composite. An offscreen WebGL batch then measured about 75 ms p95 because copying its 7680×4320 surface back to Canvas synchronized GPU and 2D work; presenting it directly still cost about 74 ms while the fragment shader cleared the full 33-megapixel buffer and shaded every overlapping card layer. The first GPU batch also retained CPU region splitting for translucent overlaps, so its cold frame reached 100.4 ms. Replacing that combinatorial pre-composite with one front-to-back quad per point removed the CPU spike, but profiling on the required SwiftShader proof environment showed that presenting a changing 7680×4320 overlay still imposed a full-surface compositor cost even when only a narrow scissor changed.
- Source/reference checked: The live local app at Grid + 312 points, its timeline transport, the canvas quality state, real 7680×4320 backing dimensions, the Grid orchestration/warp modules, the retained playback atlas/WebGL producer, the renderer tests, and the canonical performance adapter for `animation-frame`.
- Reference inputs: The user's exact animation-lag report identifies timeline playback in the established Grid variant as the affected visible operation; no new external visual reference was supplied.
- Docs/contracts read: `workflow.md`; Plan phase `decision-contract.md`, `core/runtime-boundary.md`, `core/performance.md`, and `core/timeline-animation.md`; Implementation phase `component-rules.md`, `renderer-technique.md`, `performance.md`, and `decision-contract.md`; Verification phase `acceptance-testing.md` and `performance.md`.
- Contract rules applied: `canvas-surface-preserved`, `timeline-enabled-behavior`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: Preserve `orbit` and the standard forward-only timeline; playback quality changes renderer scheduling/detail only and does not create a second camera or transport.
- Interaction ownership: The timeline retains play/pause/scrub ownership; canvas and orientation gizmo retain orbit; the renderer owns only the playback draw plan.
- Decision: Add an explicit `playback` renderer quality. Grid playback keeps every projected card while the canonical Canvas 2D product surface remains at the exact selected 2× backing for steady state, interaction evidence, pause, and export. Playback compiles all source images and transforms into one retained 256-pixel tile atlas and submits one front-to-back quad per selected point in a WebGL2 triangle batch with the radial fade in the fragment shader. Hardware depth testing rejects covered rear fragments without CPU region splitting, a stable sphere scissor limits work to the mask square, and four vertical stripes distribute the remaining fill across consecutive frames. The pointer-transparent motion overlay renders at device-pixel resolution rather than the additional authoring render-scale multiplier; full selected-resolution detail returns immediately on pause and remains authoritative for export. The atlas/program are prepared while Grid is paused so Play does not upload textures inside its cold sample. The overlay is presented directly instead of copied back to Canvas 2D. Atlas texture/program/buffer resources survive timeline-only updates and are released on unmount; the all-card Canvas branch remains a capability fallback. Unlike the bounded 48-card direct-drag shell, playback never caps the selected point population. React continues to draw each runtime timeline state so motion, loop timing, scrub state, and pause behavior stay canonical. A local DPR 2 diagnostic at the 312-point fixture measured p50 16.7 ms, p95 25.7 ms, max 33.4 ms, and zero long tasks while the canonical product canvas stayed 7680×4320 and the transient overlay used 3840×2160.
- Alternatives rejected: Reusing the 48-card drag shell, because continuous playback must retain the chosen population; lowering canvas render scale or the 500-point boundary; throttling the timeline clock; leaving the adapter as a static no-op; changing the standard Toolcraft transport; and changing export to the playback renderer.
- State/output mapping: `state.timeline.isPlaying` selects `playback` only when `sphere.distribution` is `grid`; `sphere.visibleCount`, `runtime.animation-frame`, and the canonical timeline progress still drive the same scene. Paused Grid, non-Grid modes, direct drag, and export keep their existing branches. `data-render-quality` exposes the active branch for browser proof, and canvas backing width/height remain unchanged across play and pause.
- Performance intent: performance-iteration
- Performance request evidence: "анимация тормозит найди причину и почини"
- Performance paths: ["performance-path:%5B%22interactive-continuous%22%2C%22animation-frame%22%2C%5B%22sphere-composite%22%5D%2C%5B%22main%22%5D%2C%5B%22distribution-complexity%22%2C%22visible-logos%22%5D%5D"]
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Playback intentionally flattens the internal card warp, omits card decoration, and uses device-pixel rather than authoring-scale raster detail only while the scene is moving; all selected logo identities and positions remain visible, and the complete authored curved treatment returns on pause and is always used for image export. Temporal striping means a visible stripe can be at most three animation frames older than its neighbor, so very fast motion may show mild vertical temporal separation. A targeted animation-path receipt does not certify unrelated interactions or the maximum-fixture matrix.

### Iteration 14 — One full-quality WebGL sphere renderer

- Request: «делай план лишние проверки не делай»; execute `docs/superpowers/plans/2026-09-08-unified-webgl-sphere-renderer.md`.
- Task type: Approved renderer replacement and visual-regression repair, one functional delivery batch.
- Performance intent: ordinary-product-work
- Reason: One renderer replaces paused, playback, orbit, and export raster paths; schema, projection math, runtime state, and controls remain unchanged.
- Skip: Repeated baseline profiling, unrelated matrices, and `verify:perf`; no complete performance audit was requested.
- Source/reference checked: Current Canvas full renderer, flat interaction/playback branches, canonical sphere mapper, and the supplied implementation plan. The prior reproduction showed flat squares only in the simplified moving renderer.
- Docs/contracts read: `workflow.md`; renderer, animation, visual-regression, and export routes, including runtime boundary, performance, timeline, setup/export, media upload, renderer technique, schema/component rules, and acceptance.
- Contract rules applied: `canvas-surface-preserved`, `renderer-technique-inventory`, `renderer-view-interaction`, `timeline-enabled-behavior`, `output-export-required`, `acceptance-product-observable`, `workflow-required`.
- Decision: One directly presented WebGL2 canvas at exact selected backing; canonical curved mesh math, rounded edges, stroke, cached transformed logo textures and shadows in every frame. Composite the radial mask once on GPU to preserve overlap alpha. Retain full Canvas fallback for unavailable WebGL. Export uses the same deterministic renderer as an intermediate surface, with sizing, encoding, background policy, and download owned by runtime.
- Alternatives rejected: Flat quads for Grid, 48-card sampling, lower motion backing, temporal stripes, delayed refinement, changing the point distribution, and a second preview surface.
- Plan adjustment: Keep the delivered `logo-sphere-playback-geometry.test.ts` path with the new unified-geometry tests; the protected ownership resolver cannot derive proof for a deleted unit-test path. The obsolete production modules remain removed. Background color/on-off now invalidate the composite pass because the single GPU surface consumes that background directly.
- Fidelity corrections: The opaque-face shadow depth bias exceeds two 16-bit depth steps, preventing a card from shadowing itself. Resizing checks actual WebGL drawing-buffer dimensions as well as DOM dimensions: Chromium can silently cap a retained 8192×4608 request to 7680×4320. Such unsupported allocations use the existing full-resolution Canvas fallback instead of cropping or stretching the artifact.
- View interaction and ownership: Preserve orbit on `view.orbit`, runtime gizmo/history, coalesced direct-drag/inertia pose commits, and runtime timeline transport; panels keep existing properties and media ownership.
- State/output mapping: Existing projection inputs, card style, media order/transforms, timeline progress, and scene frame feed one renderer. No quality choice depends on play or gesture state. Background and export controls keep their existing meaning.
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Full-backing GPU limits and software rendering may limit speed; never hide this by downsampling. Context recovery must recreate resources without leaving a second canvas.

### Iteration 15 — Stable Grid card stacking

- Request: «docs/superpowers/plans/2026-09-08-stable-card-stacking-order.md делай план лишние проверки не запускай».
- Task type: Execute the approved targeted model/renderer visual correction.
- User-visible result: Overlapping front Grid cards keep the same sticker order while the sphere spins or orbits; Fibonacci and Rings retain centre-depth order.
- Source/reference checked: The supplied stable-stacking plan, the current model comparator, unified GPU geometry, Canvas fallback detail allocator, occlusion traversal, and shadow facing logic.
- Reference inputs: The supplied implementation plan; no new image or video reference.
- Docs/contracts read: `workflow.md`; renderer, timeline animation, and visual-mismatch routes: runtime boundary, performance, timeline, decision contract, renderer technique, component rules, and acceptance testing.
- Contract rules applied: `renderer-technique-inventory`, `renderer-view-interaction`, `timeline-enabled-behavior`, `acceptance-product-observable`, `workflow-required`.
- Root cause: Centre-depth sorting can swap overlapping Grid neighbours at the front of the sphere. Every preview/export consumer inherits the model's order, so the correction belongs in that model, not in transport or individual renderer branches.
- Decision: Grid sorts by rear/front hemisphere then descending point index. The unified WebGL path already encodes depth from draw position; preserve its GPU passes and 16-bit-safe shadow bias. Canvas detail allocation explicitly prioritizes physical `z` without reordering its painter input. Occlusion and shadows already consume draw order or `z` correctly.
- Plan adjustment: Do not restore the removed playback-only geometry or interaction selector. Extend the existing delivered geometry test path. The unified renderer plan already includes the stable-order carry-over. Correct old Grid unit assertions that conflated draw order with depth order.
- Visual interpretation: Dense Grid screenshots after orbit retain curved, rounded cards and the faded silhouette; the paused PNG preserves the preview's overlap pattern. Functional loop/order diagnostics are separate from performance measurement.
- Alternatives rejected: Depth epsilon, hysteresis, per-pixel neighbour clipping, and front-overlap cross-fades; these retain jumps, crop source artwork, or add visible blending and extra work.
- View interaction intent: Preserve orbit on `view.orbit`; runtime gizmo, direct drag/inertia, timeline phase, history, and reset keep their existing owners.
- Interaction ownership: No new operation or duplicate surface; canvas owns orbit, timeline owns transport, panels own source and appearance properties.
- State/output mapping: Existing distribution, point index, and transformed `z` determine stacking. Position, size, opacity, mesh shape, stroke, shadow, radial mask, backing, persisted values, and runtime artifact dimensions remain unchanged. The same model order feeds preview and export, including full-resolution Canvas fallback.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Existing Grid images re-stack once relative to earlier exports. Hemisphere transitions still change order at the limb; they are thin and faded at the plan's default appearance but may be more visible with unusually opaque/unmasked settings. Billboards retain their previous rare centre-depth overlap flips.

### Iteration 16 — User-supplied default preset

- Request: «сделай эти настройки дефолтными сильные проверки не запускай», superseded within the same batch by «вот эти делай» with the second settings file.
- Task type: Schema-default update, not a renderer or runtime rewrite.
- User-visible result: Fresh workspaces and control resets use the second supplied preset: Grid, 63 cards, radius 360, size 110, depth 66, perspective 2.2, fisheye 46, exact supplied orbit, mask 109, feather 30, rear opacity 10, stroke width 0.5, and Infinity canvas.
- Source/reference checked: Both supplied JSON files, with `logos-grid-settings (2).json` as final authority; schema normalization and runtime state creation for supported default fields.
- Reference inputs: `/Users/kusnizza/Downloads/logos-grid-settings (2).json`; the earlier `(1)` file is superseded.
- Docs/contracts read: Workflow schema/defaults route, control selection, layout, schema reference, component rules, acceptance, and performance configuration contracts.
- Contract rules applied: `controls-product-coverage`, `persistence-policy-explicit`, `interaction-surface-ownership`, `renderer-view-interaction`, `workflow-required`.
- Decision: Change schema `defaultValue` and `canvas.sizing.defaultMode`; align workload defaults without changing limits, passes, or rendering. Retain existing source assets, finite 1920×1080 dimensions, 2× render scale, styling not changed in the JSON, image export, and the 12-second timeline.
- Alternatives rejected: Overwriting existing browser persistence, importing a Downloads path in production, modifying the signed runtime, or dispatching transport resets on mount.
- View interaction intent: Preserve orbit on `view.orbit`; only the schema's initial/reset pose changes.
- Interaction ownership: Existing panel properties, direct canvas orbit/gizmo, and timeline transport retain their separate owners; no new control or action.
- State/output mapping: Schema defaults feed fresh state and runtime resets; persisted user values still take precedence. The runtime remains responsible for scene bounds, export dimensions, media, layers policy, timeline and persistence.
- Performance intent: ordinary-product-work
- Verification: The user explicitly deferred heavy checks for this batch. One bare `npm run verify:delivery` would derive protected proof at a later authorized delivery boundary; no new protected receipt is claimed here.
- Risks: Runtime schema does not expose default pause/play or playhead time, so the second file's paused 2.073-second transport state is not made a default. Ordinary settings import still restores that exact frame. Existing browser/export acceptance fixtures tied to the former default scene need rebaselining before a future aggregate run; no heavy suite is run for this request.


### Template release repair — 2026-09-09

- Change ID: template-release-2026-09-09
- Entry type: focused
- Request: Make every gallery app cloneable through the published Toolcraft CLI and verify installation/startup.
- Changed owner: Upstream example snapshot packaging, integrity restoration, and public distribution metadata.
- User-visible result: The `logo-sphere` template is admitted as a complete standalone snapshot; original framework hashes remain authoritative. Canonical identity regeneration, where needed, uses the upstream identity generator.
- Verification: Source template admission passed. Published dependency installation and browser startup results are recorded in the upstream `docs/template-release-report.md`; these smoke checks do not claim renderer or export certification.
- Risks: Historical templates retain their original runtime and workflow versions.

## Decisions

### Renderer

- Decision: One full-quality WebGL2 renderer with the existing canonical layout, composite, and export pipeline passes; full Canvas 2D capability fallback. Grid uses rear hemisphere first and fixed descending-index sticker order within each hemisphere; Fibonacci/Rings use centre depth.
- Reason: The 500-card workload needs curved Grid meshes, deterministic preview/export parity, rounded clipping, constant-width outlines, shadows, opacity, and exact raster backing during every interaction state.
- Evidence: Product output is one canvas using `useToolcraftProductSceneFrame`; preview and export share the GPU renderer and apply the final silhouette fade once after card composition.

### Timeline

- Decision: Enable the standard 12-second playback timeline with a seamless forward-only loop.
- Reason: Rotation is requested product animation and must support play, pause, and scrub without a duplicate transport.
- Evidence: Timeline progress feeds sphere rotation modulo one; first and last frames share the same pose.

### Layers

- Decision: Keep layers disabled.
- Reason: Logos are one editable source collection whose order is already owned by the media control; no independent visibility/grouping workflow was requested.
- Evidence: `panels.layers` is omitted and acceptance maps source ordering to `logos.sources`.

### Controls

- Decision: Use built-in Toolcraft file drop, sliders, segmented controls, orientation gizmo, switches, colors, and selects in semantic product sections.
- Reason: Each operation has one primary surface and every visible control maps to current rendered output or export behavior.
- Evidence: `appControlSectionInventory` declares Logos, Sphere, Fade Mask, Card Style, Motion, Background, and Image Export entities.

### View Interaction

- Decision: Use `orbit` over `view.orbit` with direct canvas hit testing, runtime gizmo parity, history, reset, and inertia.
- Reason: The visible editable sphere is spatial and the user explicitly requested cursor-driven ball rotation.
- Evidence: Direct drag and gizmo actions share one pose target; canvas-miss pan remains runtime viewport navigation.

### Interaction Ownership

- Decision: Canvas owns direct sphere orbit and inertial release; the runtime orientation gizmo owns axis drag/snap; panels own source, appearance, motion, background, and export settings; the timeline owns transport.
- Reason: Each user operation has one primary surface, while complementary spatial actions share only the canonical `view.orbit` state.
- Evidence: `src/app/app-acceptance-data.ts` declares typed interaction ownership, `src/app/logo-sphere-canvas.tsx` consumes the runtime orbit hook, and product browser tests prove direct drag, gizmo, canvas-miss pan, history, and reset.

### Export

- Decision: Provide runtime image export in PNG/JPG at 2K, 4K, or 8K; no video export.
- Reason: The product has deterministic image output and the user did not request encoded video.
- Evidence: The runtime artifact renderer owns background, scale, encoding, download, and finite/Infinity frame resolution.

### Performance

- Decision: Preserve full selected 2× backing and all drawable cards during interaction, playback, and steady state. Retain transformed source/shadow textures, batch indexed meshes, reject occluded opaque interiors with depth testing, and blend translucent cards and shadows in canonical order. Keep coalesced runtime pose commits and viewport-work suspension, without motion quality tiers or temporal stripes.
- Reason: Optimizing fill and retained resources must not change the authored card shape, population, or selected raster quality.
- Evidence: `renderScaleCoverage` declares all three states; focused browser scenarios inspect the single full-quality surface through dense Grid playback and drag, including stable release pixels. The impact inventory maps the new renderer modules to existing acceptance and pass owners. Maximum-fixture timing is not inferred from these functional checks.
- Audit boundary: A complete performance audit remains a separate operator action, uses `npm run verify:perf`, and requires an explicit user request.

## Evidence

### Decision Trail — Gallery publication, 2026-09-08

- Request: Deploy logos-grid with a clearer name and fill its gallery description, following the established examples workflow.
- Task type: Existing standalone folder publication; Tier 4 packaging with identity-only product edits.
- User-visible result: Logo Sphere in the Toolcraft gallery, with a dedicated demo route and the supplied spherical logo editor.
- Source/reference checked: Read-only `/Users/kusnizza/Projects/toolcraft-apps/logos-grid`; existing Aura Carousel and Recraft Git-linked example deployment settings.
- Reference inputs: Existing application source and its bundled SVG collection. No replacement design or new visual reference.
- Docs/contracts read: AGENTS, workflow, runtime-boundary, assembly-workflow, decision-contract and acceptance-testing.
- Contract rules applied: Preserve the signed runtime and product composition, use the existing Vite BASE_URL router and runtime-owned export, retain defaults and do not invent new controls. User-authorized naming changes only package/app identity and explicit HTML title markers, not bootstrap behavior.
- View interaction intent: Existing orbit behavior and `view.orbit` orientation target remain unchanged.
- Interaction ownership: Existing canvas orbit, panel parameters and runtime media/export ownership remain unchanged.
- Decision: Logo Sphere describes every distribution mode; publish as `examples/logo-sphere` and `/demos/logo-sphere` with the standard assets-first SPA rewrites.
- Alternatives rejected: Logos Grid names only one mode; Brand Orbit is less descriptive. Do not redesign, add Apply, introduce an iframe, move the original source or modify other examples.
- State/output mapping: Existing schema controls, supplied SVG atlas, uploaded images, timeline state and shared frame renderer remain identical; only the published identity changes.
- Performance intent: ordinary-product-work; no measured performance authority requested.
- Verification: One bare `npm run verify:delivery` derives and runs the protected proof at this publication boundary. Focused deployment/browser checks are diagnostics, not a replacement receipt.
- Risks: Inherited source/template integrity limitations may block the protected gate; do not alter validators or declare an unearned receipt. Existing website work remains outside this commit.

- Source reviewed: `src/app/app-schema.ts`, `src/app/app-composition.tsx`, the logo-sphere model/renderer/pipeline modules, `/Users/kusnizza/Desktop/logos/`, the supplied screenshot, and the live local browser output.
- Contract applied: The Toolcraft runtime boundary, setup/export, media, timeline, control selection, layout, performance, acceptance, and persistence rules listed in the Decision Trail.

## Verification

### Decision Trail — Rings polar shadow repair and spaced gallery recording, 2026-09-08

- Request: поправь баг с тенью в этом приложении и перезапиши видео чтобы в настройках не было так кучно с логотипами6 более реальные версии  и чтобы расстояние между логотипами было
- Task type: Localized visual correctness repair in shared distribution geometry; Tier 3 functional delivery, followed by gallery media replacement.
- User-visible result: Rings assigns one logo per pole and distributes interior ring populations by circumference, removing coincident cards and the accumulated black polar shadow. The gallery demonstration uses fewer, smaller logos with visible separation in Grid, Fibonacci and Rings.
- Source/reference checked: User screenshot of the Logo Sphere gallery; current production preview with Rings at 100 points/110 px; shared point generator, WebGL geometry/shaders, cached shadow sprite, source SVG crop, renderer pipeline and export path.
- Reference inputs: `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-482b1b17-bf28-4917-a494-6d24c7b55f0d.png`. Existing recording scenario informs the replacement sequence, not a new reference implementation.
- Docs/contracts read: AGENTS, workflow, decision-contract, runtime-boundary, core/performance, component-rules, renderer-technique, performance and acceptance-testing; systematic-debugging, brainstorming and writing-plans workflows.
- Contract rules applied: Product-owned geometry only; preserve signed runtime, shared preview/export semantics, exact selected render scale, actual UI controls, timeline and orbit ownership.
- View interaction intent: Existing `orbit` mode and `view.orbit` remain; scene drag and gizmo share the existing runtime pose.
- Interaction ownership: Panel controls own count, distribution, size and projection parameters; canvas/gizmo owns orientation. Recording preparation uses those same controls.
- Decision: Eliminate duplicated zero-radius polar rings at their generator. Reserve each pole once, use equally spaced polar angles, allocate the exact remaining count by ring circumference and deterministic largest remainders, stagger adjacent rings. Keep current shadow style and all schema defaults.
- Alternatives rejected: Lowering shadow opacity would conceal coincident geometry; changing the shadow shader would not fix duplicated positions; deleting duplicate cards would violate the requested point count; uniformly populating tiny polar rings would keep excessive crowding.
- State/output mapping: `sphere.visibleCount` and `sphere.distribution` feed `sphere-layout`; the shared points feed projection, WebGL/Canvas compositing and image export. The corrected generator supplies exactly the selected number of unique unit positions. Recording-only count/size/fisheye preparation creates readable spacing while preserving the original off-white Infinity background and 100% editor zoom.
- Performance intent: ordinary-product-work; incorrect shadow pixels and recording composition, with no measured app-performance request.
- Verification: One bare `npm run verify:delivery` derives and runs protected functional proof for this coherent repair. Focused model regressions and agent-controlled browser/PNG checks establish development evidence; gallery media checks are separate from the protected app receipt.
- Risks: Perspective projection can still overlap front and rear cards by design, and deliberately extreme count/size choices remain supported. The recording chooses moderate settings to keep neighboring foreground logos separated.

Protected receipts own changed files, plans, executed checks, browser evidence, build output, measurements, and pass/fail status. This worklog records human decisions only.

## Risks

- Risk: Custom uploads depend on browser-decodable image formats supported by the runtime file control.
- Risk: Very pale source logos may intentionally approach the configured background/fade at the rear edge.
- Risk: A targeted interaction-path receipt does not certify the complete maximum-fixture performance matrix; that slower audit remains explicit-request only.

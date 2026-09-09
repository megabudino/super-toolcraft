# Implementation Worklog

## Status

Mode: product

Verification tier: Tier 3 — Hidden Timeline with autonomous preview and PNG-only delivery.

## Decisions

### Renderer

- Decision: Render the product through the retained Three.js/WebGL scene and the canonical Toolcraft renderer pipeline registration.
- Reason: Grass blades, scanned meshes, PBR textures, HDRI lighting, shadows, animation, and export share one physical scene.
- Evidence: `src/app/grass/grass-scene.ts`, `src/app/grass/grass-output.tsx`, and `src/app/app-renderer-pipeline.ts`.

### Timeline

- Decision: Omit the top Toolcraft Timeline from the visible schema and drive preview motion with an autonomous six-second loop.
- Reason: The requested product has no user-facing transport or video delivery; wind and butterflies should always animate without play, pause, scrub, duration, or Setup Timeline controls.
- Evidence: `src/app/app-schema.ts` omits `panels.timeline`, while `src/app/grass/use-grass-autonomous-clock.ts` supplies preview progress.

### Layers

- Decision: Do not enable the runtime Layers panel; product sections expose their own Include and Only-this-section controls.
- Reason: The scene is one composed environment, while authored visibility is already mapped to semantic product sections.
- Evidence: `src/app/app-schema.ts` omits `panels.layers` and the section controls feed retained mesh visibility.

### Controls

- Decision: Give Tall Grass and Lawn independent visible distribution maps with Scale, Detail, Roughness, Seed, Offset, and Black/white controls.
- Reason: Each generated grass layer needs independent spatial authorship; scan Count must not be attenuated by another layer's mask.
- Evidence: `src/app/grass/grass-tall-controls.ts`, `src/app/grass/grass-lawn-controls.ts`, `src/app/grass/grass-noise-preview.tsx`, and `src/app/grass/grass-world-coverage.ts`.

### Export

- Decision: Expose only Image Export settings and the Export PNG footer action.
- Reason: The user explicitly removed video delivery and wants static output only.
- Evidence: `src/app/grass/grass-controls.ts` excludes the retained video section/action descriptors from `grassControlSections`; the existing video exporter remains available in source for reversible re-enabling.

### Performance

- Decision: Filter a bounded four-times candidate pool for Tall/Lawn and retain up to the authored Density after mask evaluation; keep scan placement exact and footprint-safe.
- Reason: Distribution strength and black mask regions remain visible while Density describes retained grass instead of the smaller pre-mask candidate set.
- Evidence: `src/app/grass/grass-layout.ts`, `src/app/grass/grass-scan-layout.ts`, `src/app/app-performance.ts`, and `e2e/app-kernel-benchmarks.ts`.

## Decision Trail

### Delivery 2026-09-08 — Reviewed texture resolution budgets

- Request: Limit Grass World textures to 2K, analyze every material, and choose smaller appropriate maps for small objects such as butterflies.
- Task type: Tier 3 texture resource/output change. The explicit texture-resolution request supersedes the previous full-resolution requirement for these bundled maps.
- User-visible result: Same authored scene and controls with smaller texture resources. Production dist decreases from 100,295,679 to 65,554,603 bytes; the full scene, isolated materials, and large objects were compared in actual 4096x2304 exports before installation.
- Source/reference checked: All 40 PBR maps, eight HDR environments, eight environment previews, atlas UVs, material channel/color-space usage, alpha-test thresholds, source texture dimensions, default/max object sizes, resource consumers, and production exports.
- Reference inputs: Current Grass World sources and original local assets backed up under output/grass-texture-optimization/originals in the workspace parent. No new external visual design or motion reference.
- Docs/contracts read: AGENTS.md, workflow.md, core/runtime-boundary.md, core/performance.md, renderer-technique.md, performance.md, acceptance-testing.md; brainstorming and writing-plans skills; official Pillow, cwebp and Three.js color-management documentation.
- Contract rules applied: Runtime boundary, source resource ownership, explicit user-approved fidelity budget, retained renderer lifecycle, product-observable verification, immutable protected checks, and honest worklog results.
- View interaction intent: Existing orientation, viewport, autonomous motion, pointer simulation and export framing are unchanged.
- Interaction ownership: Toolcraft owns settings/history/viewport; the existing renderer owns PBR sampling, geometry, wind and butterfly flight/landing. No new controls are introduced.
- Decision: Ground, clover and hero boulder use 2048 color/normal maps with 512 AO/roughness. Small rocks use 1024 color, 512 normal and 256 AO/roughness. Vegetation retains its already compact 1024 color and opacity atlases; normal/AO/roughness use 256. Butterflies use 512 color, 1024 opacity and 256 normal/roughness. HDRIs retain their existing 1024/2048 dimensions; eight previews become pixel-identical lossless WebP at their existing dimensions.
- Alternatives rejected: Uniform 2K wastes small-object resources; uniform 512 damages texture detail and atlas silhouettes; 1K ground color/normal loses more fine terrain detail in isolated 4K exports. Some smaller lossless color candidates were larger than existing compressed 1K/2K originals, so those originals remain. Full-quality higher-resolution image export remains available.
- State/output mapping: Existing URLs feed the same source-memoized scan/butterfly resources. Color is downsampled in linear light; normals are filtered as linear vectors and normalized; alpha-weighted filtering avoids edge contamination. The resulting pixels are encoded losslessly. Butterfly diagnostics and product metadata describe the actual mixed allocation. Settings, instance counts, UVs, meshes, shaders, lighting, alpha tests and export dimensions are unchanged.
- Files changed: 29 PBR resources, eight preview resources, butterfly/preview URL references, butterfly dimension diagnostics and resource signature, relevant product descriptions, the butterfly browser expectations, the dedicated texture allocation test, and this worklog. The old JPEG-specific dimensions assertion moved into the broader texture test rather than being removed from coverage.
- Performance intent: Reduce package/texture resource cost. Existing source-decode passes are still memoized and initialization-only; pass inputs, invalidation, workload boundaries, and rendering architecture are unchanged. Existing impact inventory covers all modified production modules. No new kernel candidate or performance receipt is claimed.
- Verification: 13/13 focused texture-allocation and butterfly tests passed after the new dimension test first reproduced all ten old allocations. TypeScript and production build passed. Original, conservative, lean and selected candidates were compared through actual UI exports for the default scene, ground, rocks, plants, maximum-size butterflies, maximum-size boulder, and enlarged vegetation. Every candidate browser report records zero page errors or failed resources. A fresh browser without request substitution decoded all 40 installed maps at their expected dimensions, passed butterfly landing/takeoff, Include off/on, zoom and reload, and exported a real 4096x2304 PNG byte-identical to the selected comparison scene. The required pnpm verify:delivery command ran once: 346 unit tests passed and 21 failed, with exactly the same failure titles as the previous delivery and no new failures. Its unit phase stopped the aggregate browser/performance phases; installed-browser.json records the separate direct browser verification. No protected receipt or passed whole-product gate is claimed. Evidence, per-material sizes and original assets are in output/grass-texture-optimization in the workspace parent.
- Skipped checks: No unrelated default changes, shader rewrite, geometry reduction, or aggregate performance refresh. The existing missing kernel receipt and stale default-test expectations remain separate from this texture task.
- Risks: Downsampling intentionally removes source detail under the user's requested budget; this is not pixel identity with the original 4K maps. Encoding preserves the resampled reference pixels exactly. Previously retained originals and all rejected candidates remain outside the app for review/recovery. No deployment is included.

### Delivery 2026-09-08 — Lossless butterfly asset packaging

- Request: Optimize the three largest apps without losing image quality.
- Task type: Tier 2 resource packaging; no production module, schema, renderer workload, resolution, or resource lifecycle changes.
- User-visible result: Production distribution decreases from 101,133,583 to 100,295,679 bytes with identical butterfly pixels and the existing complete scene.
- Source/reference checked: Current defaults, simultaneous ground/clover texture blending, enabled scan families, butterfly asset definitions, and prior size audit.
- Reference inputs: Current local Grass World and its existing PBR textures; no new visual or motion reference.
- Docs/contracts read: AGENTS.md, workflow.md, core/runtime-boundary.md, core/performance.md, renderer-technique.md, performance.md, and acceptance-testing.md.
- Contract rules applied: Selected source fidelity and preview quality, runtime boundary, exact targeted verification, protected delivery ownership, and worklog requirements.
- View interaction intent: Existing model orientation, viewport, and terrain interaction remain unchanged.
- Interaction ownership: Runtime settings, original renderer, and butterfly interaction remain unchanged.
- Decision: Repack four butterfly JPEGs with jpegtran -copy all -optimize -progressive after smaller-byte and exact Chromium RGBA/dimension verification. Keep all 4096 textures, both blended ground sets, every scan family, meshes, and HDRIs at original fidelity.
- Alternatives rejected: Deferring one ground set or initially enabled scans would change the default scene. The exact lossless clover-normal WebP candidate increased size from 9.78 to 26.78 MB, so it was not installed. No lossy codec, downsampling, or renderer-quality reduction was used.
- State/output mapping: The same imported texture paths feed the unchanged PBR materials and runtime settings. JPEG coefficients, decoded pixels, image dimensions, and copied metadata are preserved.
- Files changed: Four JPEG resources under src/app/grass/assets/butterflies and this worklog.
- Performance intent: Package-size reduction only. Existing dimensions, enforced boundaries, pipeline, fixture plans, and performance impact inventory are unchanged; no new performance measurements are claimed.
- Verification: grass-butterflies.test.ts passed 2/2; production build passed. Chromium startup rendered 18 butterflies with 4096 texture diagnostics and a 3840x2160 backing canvas; real Include off/on and reload passed with zero page errors or failed resources. All four JPEGs passed exact RGBA/dimension comparisons. The protected targeted command rejected selectors because this checkout has no first-stable receipt, so the required first-stable pnpm verify:delivery command was run once. Its unit phase reports 335 passed and 21 failed: 19 existing default/coverage assertions in unchanged product code, a missing protected kernel receipt, and the worklog validator requiring a passed delivery statement. No passed result was fabricated. The aggregate runner stopped before browser/performance phases; diagnostic browser checks are recorded separately in output/app-size-optimization/grass-world-browser.json.
- Skipped checks: No renderer/kernel edits or full performance refresh are requested by this resource-only batch.
- Risks: Large PBR assets remain necessary at the requested fidelity. The protected whole-product delivery gate is not green; its log is output/app-size-optimization/grass-world-delivery.log in the workspace parent. Source and test changes are absent except the four JPEGs and this truthful worklog. Local diagnostic reports do not mint protected receipts. No deployment is included.

### Iteration 1 — Independent Tall and Lawn maps with exact scan counts

- Request: Fix distribution behavior for every mapped material and add a separate map for Lawn.
- Task type: Controls, renderer layout, invalidation, randomizer, acceptance, and performance.
- User-visible result: Lawn has its own draggable distribution preview and six settings; Tall controls only Tall; PBR scan and rock Count values produce the requested number of footprint-safe elements.
- Source/reference checked: User request, current Tall distribution controls, Lawn layout, scan placement, scene diagnostics, renderer pass inventory, and the running app.
- Reference inputs: Existing Grass Studio scene and its downloaded PBR grass, flower, rock, boulder, and ground resources.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, decision contract, runtime boundary, control selection, layout, schema reference, component rules, custom controls, renderer technique, performance, and acceptance testing routes.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Use two explicit deterministic Voronoi masks, filter one requested-size candidate set once per generated grass layer, and remove grass masks from every scanned material layout.
- Alternatives rejected: Sharing Tall's map with Lawn; hidden topology multipliers; oversized refill pools that erase mask influence; reducing scan Count after placement filtering.
- State/output mapping: `field.distribution*` drives only Tall layout, `lawn.distribution*` drives only Lawn layout, and each `scan.*.count` drives its own exact instanced layout independently.
- Files changed: Distribution defaults/types/readers/controls/preview, coverage/layout/scan layout, render targets and pass inputs, pipeline/performance contracts, randomizer, acceptance data, diagnostics, tests, and browser evidence.
- Verification: `npm run verify:delivery`.
- Skipped checks: None.
- Risks: Maximum authored density remains GPU-dependent, but schema bounds, retained resources, exact workload fixtures, kernel benchmarks, and delivery performance coverage enforce the supported envelope.

### Iteration 82 — Adjustable empty Surface Bend perimeter

- Request: «Сделать контрол, который позволяет загибать землю внизу для имитации толщины дна; регулировать степень загиба, скругление и плавность; ничего на загибе не располагать; загиб идёт по периметру Surface».
- Task type: Tier 3 schema/product behavior, retained Terrain geometry, every placement domain, renderer invalidation, preview/export parity, acceptance, and performance ownership.
- User-visible result: A new `Surface Bend` section sits directly after `Surface` with `Include`, `Depth`, `Width`, `Roundness`, and `Smoothness`. The complete authored Field perimeter rolls downward while Tall, Lawn, five scan layers, rocks, and the boulder remain inside the exact flat inner contour.
- Source/reference checked: The user's request; current Field shape and irregular perimeter math; Terrain geometry, retained Three.js scene, Tall/Lawn/scan/boulder layouts, pointer hit testing, preview diagnostics, PNG/video export setup, canonical renderer pipeline, and the running app. No external URL, Figma file, screenshot, video, or new asset was supplied.
- Reference inputs: Existing Grass Studio procedural Terrain and downloaded Current/Clover/scanned PBR resources; the bend is generated from product state rather than a reference image.
- Docs/contracts read: `AGENTS.md`; `docs/toolcraft/workflow.md`; Plan routes for control selection, layout, runtime boundary, and performance; Implementation routes for schema reference, component rules, renderer technique, and performance; Verification route for acceptance testing; Toolcraft `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser` workflows.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Deform the existing fixed-topology Terrain grid with a deterministic downward profile derived from the shared Field relative distance. `Width` also uniformly scales the legal placement shape. A dedicated memoized `grass-ground-geometry-build` pass owns the bounded rebuild; only `Include` and `Width` additionally invalidate placement layouts.
- Alternatives rejected: A separate vertical skirt, because it would create a seam and would not provide Roundness/Smoothness; shader-only vertex displacement, because pointer hit testing, CPU diagnostics, and placement/export geometry would disagree; placing objects first and filtering by height, because footprints could still cross the bend and Count semantics would become unstable; and custom curve UI, because four bounded built-in sliders express the requested product behavior.
- State/output mapping: `surface.bendEnabled` gates geometry plus the empty band; `surface.bendDepth` sets the outer negative displacement in metres; `surface.bendWidth` sets both profile reach and the exact object-free normalized band; `surface.bendRoundness` biases the middle of the profile; `surface.bendSmoothness` blends a chamfer toward quintic tangent-continuous easing. Preview, hit testing, PNG/JPG, and video use the same retained ground builder. Persistence advances to `toolcraft:grass-studio:state:v20`/`20`, includes normal Toolcraft values/canvas/media/panels/timeline state, and reset uses schema defaults.
- Performance ownership: Ground rebuild work is fixed-topology, memoized per renderer, main-thread vector work bounded by the existing `terrain-octaves` dimension. Orbit, zoom, playback, materials, and lighting do not rebuild it. Placement rebuilding remains bounded by existing Tall/Lawn/scan workload limits and occurs only when the legal inner boundary changes. Initial retained stages yield to the Toolcraft shell, and scan-layout invalidation uses the stable combined signature rather than a fresh object identity, preventing paused full-frame churn.
- Files changed: Surface-bend state/defaults/parser/controls/profile module; Terrain geometry and extracted retained ground resource; Tall/Lawn/scan/boulder placement keys and inputs; scene, preview, export, render targets, canonical pipeline and diagnostics; persistence, control inventory, acceptance data, performance config/impact inventory; focused Vitest and Playwright proof; design, plan, and this worklog.
- Verification: `npm run verify:delivery` was invoked. Focused Surface Bend Vitest passes 5/5; the selected schema/product regression set passes 31/31; TypeScript passes; the current-source kernel benchmark and production build pass; `Surface Bend deforms the perimeter and keeps every layer inside` passes in 41.4 seconds; the corrected current range-slider scenario passes in 42.3 seconds; the model-import lifecycle recipe passes in 26.6 seconds; and the signed conditional-visibility recipe passes in 22.7 seconds when Playwright tracing is disabled. The protected delivery invocation completed integrity, AI/code-health/product-boundary, 346 workspace Vitest tests, build, and 63 browser cases before exposing a signed-harness timing limit: with mandatory `trace: "retain-on-failure"`, the generic conditional recipe performs five sequential scans across 215 control owners and exceeds its immutable 30-second test timeout, so no protected receipt was minted. Product code, the signed Playwright config, and the generic evidence helper were not weakened to bypass that limitation. In-app visual QA on `http://127.0.0.1:3008/` shows the empty rolled perimeter, reports a retained minimum height of `-0.762 m`, an inner relative radius of `0.82`, and no browser console errors.
- Skipped checks: No explicit full performance refresh because the user requested a renderer feature rather than performance work; no dependency install because dependencies and lockfile did not change.
- Risks: Existing `Surface Fade` remains independent and can make part of the outer bend transparent at its default 12% width; users can lower Fade Width/Strength when they want the full curved wall opaque. Very wide bends intentionally reduce the legal placement area but keep existing requested Count semantics within the smaller footprint-safe domain.

## Concurrent Delivery Notes

### Iteration 81 — Ground Shadow scale

- Request: Add an explicit scale control to the complete under-ground shadow.
- Task type: Tier 3 renderer/canvas feature extension and persistent schema-control delivery.
- Verification tier: Tier 3.
- Reason: One new persistent slider changes the retained WebGL underlay footprint in preview and every export format, while preserving the existing constant draw-call cost.
- Run: Focused Ground Shadow/schema/acceptance Vitest; TypeScript; code health; product boundary; production build; exact six-control Chromium scenario; one protected delivery invocation; keep the saved development URL running.
- Skip: Full performance refresh because Scale only changes retained uniform/transform values on the existing fixed two-triangle draw and adds no workload dimension, texture, framebuffer, loop, or resource allocation.
- User-visible result: `Ground Shadow` now includes `Scale` between `Front / back` and `Blur`. Its 25–200% range uniformly grows or shrinks the shadow footprint around the field center without resizing Terrain; default is 100%.
- Source/reference checked: Existing analytic Ground Shadow SDF, retained plane transform, Field width/depth correlation, metre-based Blur, schema defaults/parser, render-target invalidation, acceptance inventory, and exact Ground Shadow browser proof.
- Reference inputs: The user's direct request; no external asset, URL, screenshot, Figma file, or video reference.
- Docs/contracts read: `AGENTS.md`; the already-selected Ground Shadow Toolcraft routes; Toolcraft `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser` skills.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Normalize the authored slider from 25–200% into 0.25–2.0, multiply both analytic half-extents and the retained plane's horizontal dimensions by that value, and keep Blur as an independent world-metre expansion. Preserve position, color, strength, Terrain visibility gating, randomizer exclusion, persistence, reset, undo/redo, settings transfer, and shared preview/export rendering.
- Alternatives rejected: Separate X/Z scale sliders without a request for anisotropic deformation; scaling Blur with the footprint; rebuilding plane geometry; scaling Terrain itself; and adding another renderer pass.
- State/output mapping: `groundShadow.scale` parses into `GrassSettings.groundShadow.scale`, invalidates the existing render path, updates the retained shadow half-size and mesh transform, and is consumed identically by live preview and PNG/JPG/MP4/WebM export.
- Performance ownership: The existing `grass-ground-shadow.ts` ownership remains `grass-scene-resource`, `grass-scene-render`, and `grass-export-frame`; Scale is a constant-time setting on the same fixed draw call.
- Files changed: Ground Shadow defaults/types/parser/render target/control/resource, acceptance inventory and browser fixtures, focused unit proof, the existing Ground Shadow plan, and this worklog.
- Verification: Focused Ground Shadow test passes 2/2 after replacing one exact floating-point assertion with a tolerance assertion. TypeScript and Toolcraft code health pass; production build passes; product boundary passes for 100 production modules. The selected broader suite passes 46/48; its only failures are separate missing `Surface Bend` acceptance rows/inventory and contain no Ground Shadow error. Exact Playwright `Ground Shadow controls move and style the complete underlay` passes with real canvas-pixel and conditional-visibility evidence for all six controls. One initial Vite asset-fetch/navigation failure was discarded; the clean retry passed in 3.5 minutes. Two delivery invocations correctly refused to start because another workspace process continuously held the Toolcraft verification lock; that external verification was not interrupted. The saved app remains running on `http://127.0.0.1:3008/`.
- Skipped checks: No explicit full performance checkpoint for this constant-cost extension.
- Risks: At the 25% minimum, a large blur can visually dominate the small core silhouette by design because Blur remains physically authored in metres. Workspace-wide acceptance still depends on the separate unfinished `Surface Bend` acceptance mapping.

### Iteration 82 — Halved Tall and Lawn minimum spacing

- Request: Reduce the minimum distance for both Tall and Lawn grass by two without strong or long verification.
- Task type: Tier 3 bounded layout-density default and schema-range change.
- Verification tier: Tier 3 with explicitly reduced proof scope.
- Reason: Existing Tall/Lawn deterministic layout consumes the two values, so closer roots can change visible coverage and actual instance counts within unchanged density ceilings.
- Run: Focused coverage-policy Vitest and TypeScript only.
- Skip: Browser, performance, build, kernel, and protected delivery by explicit user request.
- User-visible result: Tall minimum/default spacing changes from `0.04 m` to `0.02 m`; Lawn changes from `0.015 m` to `0.0075 m`. Lawn slider step changes to `0.0025 m` so the new minimum is exactly selectable.
- Decision: Change both current defaults and schema lower bounds, preserving all masks, seeds, requested-count ceilings, layout algorithms, render passes, persistence policy, and export behavior.
- State/output mapping: `field.distanceMin` and `lawn.distanceMin` continue through the existing state reader and layout signatures; only their authored default/minimum values change.
- Verification: Focused coverage policy passes 2/2 and TypeScript passes.
- Risks: Existing persisted browser settings can retain their prior values until edited or reset; no performance or browser regression proof was run by request.

### Iteration 84 — Tall and Lawn density recovery

- Request: Make both grass layers visibly denser, raise both maximum counts by 20%, and fix the density bug without strong or long verification.
- Task type: Tier 3 deterministic layout semantics, retained Lawn geometry, schema workload bounds, randomizer clamps, and focused regression proof.
- Verification tier: Tier 3 with explicitly reduced proof scope.
- Reason: Tall/Lawn masks previously filtered only the first `Density` candidates, so the visible result could be roughly half the authored value. Lightweight Lawn clumps also represented six equivalent blades with only three visible ribbons.
- User-visible result: Tall now fills from the existing bounded four-times placement pool after its mask is evaluated, taking up to the requested Density while preserving black mask regions and real minimum spacing. Lightweight Lawn clumps render all six visible ribbons. Tall maximum rises from `20,000` to `24,000`; Lawn rises from `30,000` to `36,000`.
- Decision: Keep the deterministic candidate generator and its bounded work, expose its complete pool to Tall/Lawn layout, apply the independent layer mask to that pool, then slice accepted positions to the requested count. Preserve defaults, seeds, masks, clumping, materials, lighting, terrain size, and wind.
- State/output mapping: `field.densityMax` and `lawn.densityMax` remain retained-root targets; `field.distribution*` and `lawn.distribution*` independently choose legal roots; coverage policy and schema enforce `24,000`/`36,000`; the world generator clamps to the same bounds; lightweight Lawn geometry now visually matches its six-blade equivalence.
- Measured result: On current schema defaults, Tall changes from the diagnosed `6,429 / 12,500` to `12,500 / 12,500`; Lawn remains `30,000 / 30,000` roots but restores its missing lightweight ribbons. At the new maxima, Lawn reaches `36,000 / 36,000`; Tall reaches `23,293 / 24,000` because the active mask and real `0.02 m` spacing exhaust the bounded legal positions.
- Verification: Focused placement, layout distribution, coverage, Lawn clump geometry, schema, and delivery-contract Vitest pass 30/30. TypeScript passes.
- Skipped checks: Browser, production build, performance, kernel, code-health aggregate, and protected delivery by explicit user request for no strong or long checks.
- Risks: The maximum Lawn preview now draws the lightweight ribbons it previously omitted, so its real renderer workload is higher. No performance or browser checkpoint was run in this batch. Existing persisted Density/spacing settings remain until edited or reset.

### Iteration 85 — Current-look scene randomizer

- Request: Build every randomized world in the exact colors of the current active configured project and limit maximum generated height to 20% above that project, without heavy verification.
- Task type: Tier 2 Scene Setup action ownership, deterministic world compiler bounds, acceptance copy, and focused regression proof.
- Verification tier: Tier 2 with explicitly reduced proof scope.
- User-visible result: Randomize still changes terrain morphology, quantities, distributions, clumping, seeds, and correlated object scale, but no longer writes any Ground, Clover, Tall, Lawn, plant, flower, rock, or boulder color. Terrain maximum height, Tall/Lawn height ranges, the boulder, and all scan size ranges can reach at most 120% of the active source scene instead of 125%.
- Source/reference checked: Current Scene Setup action, generated-world ownership partition, color-patch integration, scale recovery path, generated-world catalog, unit coverage, acceptance row, browser scenario, and performance description.
- Reference inputs: The user's current active Grass Studio project state; no external asset, URL, screenshot, Figma file, or video reference.
- Docs/contracts read: `AGENTS.md`; `docs/toolcraft/workflow.md`; Plan-phase `core/control-selection.md` and `core/layout.md`; Implementation-phase `schema-reference.md` and `component-rules.md`; Verification-phase `acceptance-testing.md`; Toolcraft `brainstorming`, `writing-plans`, and `systematic-debugging` skills.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Move every world-color target from generated ownership into preserved ownership, remove palette generation and palette-marker handling from Randomize, change the shared scale ceiling and catalog endpoint from `1.25` to `1.20`, and retain a small dispatch-scoped scale marker so repeated generations recover the active source baseline without cumulative growth. A manually edited scaled target becomes the new active baseline for that target.
- Alternatives rejected: Generating a narrower palette, because the request requires exact current colors; applying the 20% ceiling only to Terrain, because Tall/Lawn and scanned objects could still become disproportionately tall; scaling from the immediately previous generated result without recovery, because repeated clicks would accumulate growth; freezing all sizes, because the request still allows bounded world variation.
- State/output mapping: `actions.sceneSetup` dispatches only `GRASS_GENERATED_WORLD_TARGETS`; color targets now belong to `GRASS_PRESERVED_TARGETS` and never enter the patch. `GRASS_WORLD_SCALE_MAX = 1.2` bounds `terrain.maxHeight`, `blade.heightRange`, `lawn.heightRange`, `scan.boulder.size`, and every `scan.*.sizeRange`; the existing retained renderer and export consume those resulting state values unchanged.
- Files changed: World generator, randomizer, scale recovery/marker, world scale catalog, Scene Setup copy, acceptance/inventory descriptions, performance notes, focused unit tests, future browser scenario, implementation plan, and this worklog.
- Verification: `src/app/grass/grass-randomizer.test.ts` and `src/app/grass/grass-world-generator.test.ts` pass 16/16; TypeScript passes.
- Skipped checks: Browser, production build, performance, kernel, full code-health aggregate, and protected delivery by explicit user request for no heavy checks.
- Risks: The aligned browser scenario was updated but not executed. The standalone palette-generation utility remains in the repository for its isolated color-math tests, but Scene Randomize no longer imports or calls it.

### Iteration 86 — Equal Tall Grass color on both ribbon faces

- Request: Make Tall Grass show the same color from its front and reverse sides without heavy verification.
- Task type: Tier 3 retained WebGL material visual-mismatch fix and focused shader proof.
- Verification tier: Tier 3 with explicitly reduced proof scope.
- User-visible result: A Tall Grass blade now keeps the same authored gradient and PBR lighting normal when viewed from either side instead of changing shade when its back-facing ribbon becomes visible.
- Source/reference checked: The retained Tall/Lawn material factory, generated vertex normals, Three.js `MeshPhysicalMaterial` double-sided fragment-normal chunk, material extension order, shader cache keys, and existing material-compilation test patterns.
- Reference inputs: The user's observation in the current Grass Studio scene; no external asset, URL, screenshot, Figma file, or video reference.
- Docs/contracts read: `AGENTS.md`; `docs/toolcraft/workflow.md`; Plan-phase `decision-contract.md` and `core/runtime-boundary.md`; Implementation-phase `component-rules.md` and `renderer-technique.md`; Verification-phase `acceptance-testing.md` and `performance.md`; Toolcraft `brainstorming`, `writing-plans`, and `systematic-debugging` skills.
- Contract rules applied: `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Keep `THREE.DoubleSide` geometry and PBR material behavior, add a Tall-only `GRASS_EQUAL_FACE_SHADING` define, and undo the standard back-face normal inversion immediately after `normal_fragment_begin`, including `nonPerturbedNormal`. Lawn clumps retain their prior normal behavior.
- Alternatives rejected: Duplicating every blade with reversed geometry, because it doubles ribbon topology and does not guarantee one lighting normal; using `FrontSide`, because Tall blades would disappear from half the camera angles; flattening or unlighting the material, because it would discard the requested PBR quality; changing authored colors, because the mismatch came from normals rather than gradient state.
- State/output mapping: Existing Tall gradient, instance colors, sun patches, color grade, wind, and edge fade still feed the same retained material in preview and export. Only back-facing Tall fragments normalize to the same orientation as their front-facing counterpart.
- Files changed: Tall/Lawn material factory, focused shader-compilation test, implementation plan, and this worklog.
- Verification: Focused `grass-material-face-shading.test.ts` passes 1/1 after the initial failing proof exposed that the define was attached to the depth material; the corrected PBR attachment passes. TypeScript passes.
- Skipped checks: Browser, production build, performance, kernel, full code-health aggregate, and protected delivery by explicit user request for no heavy checks.
- Risks: No raster comparison was run, so view-dependent sheen can still vary naturally with camera angle; the base gradient and lighting normal no longer change solely because the ribbon is back-facing.

### Iteration 87 — Ground Shadow clipping on rectangular surfaces

- Request: Fix the Ground Shadow being visibly cut off for some surface types.
- Task type: Tier 3 retained analytic WebGL shadow visual-mismatch fix and focused resource proof.
- Verification tier: Tier 3 with explicitly reduced proof scope.
- User-visible result: Ground Shadow now expands far enough on each Field axis for its complete soft falloff, so rectangular, scaled, or otherwise strongly anisotropic surfaces no longer reveal the straight edge of the underlying shadow plane.
- Source/reference checked: The supplied screenshot; current Ground Shadow fragment SDF; Blur normalization; Field width/depth and Scale mapping; retained plane transform; preview/export scene reuse; and focused Ground Shadow resource tests.
- Reference inputs: `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-e1ae4ac0-1927-4dcb-92b5-672c2e462db5.png`.
- Docs/contracts read: `AGENTS.md`; `docs/toolcraft/workflow.md`; Plan-phase `decision-contract.md` and `core/runtime-boundary.md`; Implementation-phase `component-rules.md` and `renderer-technique.md`; Verification-phase `acceptance-testing.md` and `performance.md`; Toolcraft `brainstorming`, `writing-plans`, and `systematic-debugging` skills.
- Contract rules applied: `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Preserve the existing superellipse SDF and its normalized Blur, derive a per-axis world-space padding from that exact normalized radius, pass the padded half-extent to the shader, and size the retained plane from the same value.
- Alternatives rejected: A fixed overscan multiplier, because it would still fail at some aspect ratios or waste fill elsewhere; clamping alpha at an earlier distance, because it would visibly reduce the authored Blur; enlarging the user-facing Scale value, because that changes the shadow silhouette rather than only its transparent support bounds; increasing geometry topology, because the resource remains one analytic two-triangle plane.
- State/output mapping: Existing `groundShadow.blur`, `groundShadow.scale`, Field width/depth, offset, color, and strength continue to drive one retained shader in preview and export. The shader evaluates the same silhouette, while `uGrassGroundShadowExtent` and mesh scale guarantee alpha reaches zero before every plane edge.
- Files changed: Ground Shadow retained resource/shader, focused Ground Shadow unit test, implementation plan, and this worklog.
- Verification: Focused `grass-ground-shadow.test.ts` passes 2/2, including a rectangular 8×6 Field whose longer-axis padding exceeds raw Blur while both shader and mesh share exact extents. TypeScript passes.
- Skipped checks: Browser, production build, performance, kernel, full code-health aggregate, and protected delivery by explicit request for a lightweight fix.
- Risks: The supplied camera/surface combination was not rerendered in a browser in this batch; the unit proof covers the mathematical clipping cause and the retained resource bounds.

### Iteration 88 — Renderer optimization stabilization gate (critical slice complete)

- Request: Begin executing the approved lossless grass-render optimization plan.
- Verification tier: Tier 4.
- Reason: This batch corrects canonical renderer-pass ownership and decomposes renderer/performance orchestration before a raster and cold/warm baseline is captured. It can change which expensive passes execute for a reachable control even though visible pixels must remain identical.
- Run: Focused renderer-pipeline tests, existing performance gates, TypeScript, code health, product boundary, production build, then the stabilization gate's protected delivery command only after the complete stabilization batch and browser safety evidence are ready.
- Skip during implementation: Full browser performance and `verify:delivery`; they belong to the completed stabilization boundary, not the first red/green pipeline correction.
- User-visible result so far: No intended pixel or control change. The canonical graph now treats Tall distribution independently from Terrain geometry, lists Terrain geometry exactly once in the live scene, and makes still export consume Terrain geometry explicitly.
- Implementation decisions: Derive every interaction's `mustNotInvalidate` set from the complete pass registry instead of maintaining a second hand-written complement; split pass definitions, interaction invalidation, performance envelope, workload scenarios, settings readers, and scene lighting into focused owners before measuring; keep the exact current materials, density, placement, wind, camera, and export behavior.
- Files changed for stabilization: `src/app/app-renderer-pipeline.ts`, `src/app/app-renderer-pass-definitions.ts`, `src/app/app-renderer-interactions.ts`, `src/app/app-renderer-pipeline.test.ts`, `src/app/app-performance.ts`, `src/app/grass/grass-performance-envelope.ts`, `src/app/grass/grass-performance-scenarios.ts`, the focused `grass-*-settings-values.ts` readers, `src/app/grass/grass-scene-lighting.ts`, `src/app/grass/grass-scene.ts`, and `src/app/app-performance-impact.json`.
- Focused verification so far: The new four-case pipeline regression suite passes; performance coverage, production-module ownership, and visible-control role gates pass; TypeScript passes; `npm run ai:check` passes; the production build passes; a real Chrome session at the app's saved port renders the field and controls without WebGL errors.
- Concurrent-state note: A separate Butterfly feature batch began modifying the same schema, scene, pipeline, performance adapters, and acceptance inventory during this stabilization pass. Its reachable production modules and passes were retained and mapped rather than reverted.
- Kernel follow-up: The protected assessment correctly required an executable `grass-butterfly-layout-build` WebGL harness after Butterfly entered the graph. A deterministic terrain-aware 0–64-instance harness was added, `npm run verify:kernel` passes, and a current-source kernel receipt was recorded.
- Protected delivery attempt: `npm run verify:delivery` reaches the generated infrastructure self-tests, then fails in `scripts/check-ai-skills.test.mjs`. The test assumes a clean `HOME` means no skills, while the signed helper intentionally discovers the tracked project-local `.agents/skills`; therefore the expected missing-skills stderr branch is unreachable in this generated project. Renderer, schema, pipeline, kernel, code-health, boundary, and build checks before this framework self-test are green.
- Local framework repair authorized by the user: The generated copy of the stale clean-`HOME` skill test now isolates project-local skills for its missing-skills branch; slow generated aggregate/browser recipes use realistic timeouts for this heavy scene. The canonical `primeui-v2` starter is intentionally unchanged for the user to repair separately.
- Critical renderer stabilization: Removed the fixed three-second startup stall, coalesced identical initial forced renders, starts scan and environment preparation concurrently, stops Timeline churn in Static, skips coherent wind noise when its force is uniformly zero, and reuses that force across the position/normal shader paths. No density, geometry topology, texture resolution, material model, lighting, or export-quality setting was reduced.
- First-paint resource ordering: Exact 4K Butterfly PBR maps now begin only after the browser has crossed a real paint boundary and a short post-paint delay. The initial field remains the first completed visual workload; the retained Butterfly resource then loads and refreshes normally.
- Measured result: The original cold full-frame characterization was approximately 22.3 seconds. The final focused cold run completed in 17.7 seconds (about 21% faster) with one initial scene frame, no Butterfly 4K request before that frame, and the same authored scene quality. The largest remaining long animation frame is approximately 5.4 seconds and is the next retained-session/static-frame optimization target.
- Focused verification: Model-import lifecycle recipe passes 1/1; cold-render ordering/baseline passes 1/1; deferred Butterfly resource plus hover/landing smoke passes 1/1; focused material, wind, Butterfly, and pipeline Vitest pass 8/8; TypeScript and `npm run ai:check` pass; `npm run verify:kernel` passes and records the current-source receipt; its production build succeeds.
- Remaining gate: The broad first-stable `verify:delivery` browser matrix was not restarted after the user narrowed this turn to the critical renderer slice. Retained render-session/static-frame decomposition and export/Timeline restructuring remain separate large iterations.
- Risk: Cold startup is materially improved but still dominated by a multi-second initial WebGL compile/render frame. Claiming the complete optimization plan is finished would be incorrect until the retained-session work and the protected full delivery receipt are complete.

### Iteration 89 — PBR butterflies with staggered curved landing

- Request: Add adjustable flying butterflies from `/Users/kusnizza/Desktop/Butterflies 4K.zip`, land them on Terrain hover, relaunch them on leave, then correct the landing so it is curved, realistic, and starts at a different time for every butterfly.
- Task type: Tier 3 schema controls, retained WebGL renderer layer, Timeline animation, pointer/Terrain interaction, randomizer/Scratch ownership, export inclusion, acceptance, and workload modeling.
- User-visible result: An independently switchable flock of 0–64 PBR butterflies flies through deterministic seamless paths. Terrain hover now starts a Seed-derived landing wave: delayed butterflies continue flying, each approach captures its own current pose, curves sideways toward its Terrain anchor, eases into descent, banks, levels at contact, and folds its wings independently. Pointer leave reverses the paths and order for takeoff.
- Source/reference checked: The supplied Butterflies 4K archive and its Quixel JSON; all 4096×4096 BaseColor, Opacity, Normal, and Roughness atlas maps; the existing Terrain height/raycast path; Timeline loop progress; retained scene/export ownership; Scene Randomize/Scratch; renderer pipeline and performance envelope.
- Reference inputs: `/Users/kusnizza/Desktop/Butterflies 4K.zip` and the eight-species two-column/four-row 4K butterfly atlas contained in it.
- Docs/contracts read: `AGENTS.md`; `docs/toolcraft/workflow.md`; Plan-phase control selection, layout, runtime boundary, performance, Timeline animation, and setup/export routes; Implementation-phase schema, component, renderer, performance, and decision-contract routes; Verification-phase acceptance and performance routes; Toolcraft `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser` skills.
- Contract rules applied: `canvas-no-app-ui`, `controls-product-coverage`, `controls-section-inventory-required`, `timeline-enabled-behavior`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Preserve all four exact 4K maps and reconstruct the source atlas as one retained two-wing `InstancedMesh` with one PBR material and a 64-instance hard cap. Add deterministic instance attributes for species, wing phase, and individual landing fold; derive unique landing order from Butterfly Seed; interpret Landing time as the complete first-start to last-contact wave; use real elapsed time so low preview FPS cannot stall the transition.
- Alternatives rejected: One mesh/material per butterfly, because it multiplies draw calls and resource ownership; texture downscaling or re-encoding, because the user explicitly protects source resolution; one global vertical translation, because it looks mechanical; freezing all delayed butterflies, because they should keep flying until their own approach; frame-capped landing increments, because slow frames stretched a 0.75-second landing into tens of seconds; exporting transient hover state, because still/video output must remain deterministic at Timeline time.
- State/output mapping: `butterflies.enabled`, `count`, `sizeRange`, `seed`, `heightRange`, `flightCycles`, `wingCycles`, and `landingTime` parse into `GrassSettings`; count/seed/Terrain inputs key the bounded layout pass; motion controls, Timeline, and `renderer.butterflyHover` invalidate scene render only; the retained resource samples the shared Terrain height and environment lighting; PNG/JPG/video export uses the same atlas, layout, and Timeline pose but remains airborne.
- Performance: `butterfly-count` is a schema-backed direct workload dimension with default 18 and interactive/batch maximum 64. `grass-butterfly-resource` decodes/uploads four exact maps once; `grass-butterfly-layout-build` is memoized and linear in count; scene/export perform one bounded matrix update per instance and one draw call. Hover and wing folding update retained matrices/attributes without texture decode or layout rebuild.
- Files changed: Butterfly asset maps, controls/defaults/types/readers, deterministic layout/pass inputs/resource/diagnostics/hover hook, scene/output/export integration, pipeline passes/interactions/contracts, randomizer/scale ownership, acceptance/readiness/inventory, performance envelope/scenarios/adapters/impact inventory, unit/browser tests, feature design/plan, and this worklog.
- Verification: TypeScript passes. Toolcraft code health and product boundary pass for 120 production modules. Focused Butterfly, world-generator, randomizer, schema, and pipeline Vitest pass 26/26. Production build passes and emits the four exact butterfly maps. Real Chromium smoke `butterfly hover preview changes landing blend` passes, proving resource readiness, Terrain hover, completed landing, leave, and completed relaunch; the browser console contains only the pre-existing missing favicon request. The earlier failing smoke exposed and fixed the frame-capped transition bug that stalled at 0.5333 on the heavy field.
- Skipped checks: No full performance checkpoint because this user request is feature/behavior work, not the separate explicit optimization program. The full protected delivery remains blocked by the signed `check-ai-skills.test.mjs` clean-HOME assumption documented in Iteration 88; the generated framework script/test was not patched locally.
- Risks: The supplied archive has no authored mesh, so wing-card silhouette and articulation are a deliberate reconstruction from the PBR atlas. The full all-control butterfly acceptance scenario is authored but remains slower than the focused semantic smoke on the current heavy scene; the protected delivery receipt still depends on the upstream framework self-test repair.

### Iteration 90 — Settings export 20 as the v21 start scene

- Request: Make `/Users/kusnizza/Downloads/grass-studio-settings (20).json` the project start state.
- Task type: Tier 3 schema defaults, reset behavior, persistence generation, renderer start pixels, existing workload defaults, and focused browser verification.
- User-visible result: A clean project load and Reset now open the supplied authored composition: its camera, Sunrise environment and lights, Terrain, Clover Surface, Ground Shadow, Lawn, Tall Grass, five scan families, rocks, boulder, butterflies, simulation wind, background, and export selections. The canvas remains 1920×1080 at render scale 2.
- Source/reference checked: The complete version-1 Toolcraft settings export, current schema and 283-target defaults record, color-control value shapes, persistence v20, renderer diagnostics, randomizer scale bounds, retained-state browser fixture, and the running app.
- Reference inputs: `/Users/kusnizza/Downloads/grass-studio-settings (20).json`, exported 2026-07-23 at 12:13:20 UTC.
- Docs/contracts read: `AGENTS.md`; `docs/toolcraft/workflow.md`; Plan-phase `core/control-selection.md` and `core/layout.md`; Implementation-phase `schema-reference.md` and `component-rules.md`; Verification-phase `acceptance-testing.md`; Toolcraft `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser` skills.
- Contract rules applied: `controls-product-coverage`, `persistence-policy-explicit`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Overlay all 240 export values that match current product targets onto the existing complete defaults record; normalize single-field `{ hex }` color objects to color strings; preserve 43 newer defaults absent from the export; retain the already matching canvas, six-second timeline, loop policy, and paused initial playback; exclude transient `timeline.currentTimeSeconds: 5.8400`; advance persistence to `toolcraft:grass-studio:state:v21`/`21`.
- Alternatives rejected: Replacing the complete defaults record and losing newer texture-mask/PBR controls; importing the file only into the active browser session; retaining v20 and allowing old local state to hide the requested start; treating the transient playhead position as authored scene configuration.
- State/output mapping: `grassStartStateV21` overlays `grassDefaults`, every existing schema control consumes the resulting `defaultValue`, Reset restores those values, and the retained WebGL preview/export readers consume the same state. The v21 persistence key ensures clean reload writes and restores the new values. Existing canvas and timeline schema remain unchanged.
- Performance: Tall reset density becomes 24,000, Lawn 36,000, Tufted/Wild/White/Yellow reset counts become 1,000, Rocks becomes 89, and Butterflies remains 18. Existing schema maxima, candidate bounds, renderer passes, instancing, texture resolution, and export paths are unchanged. `grass-start-state.ts` has the same impact ownership as `grass-defaults.ts`. The Boulder randomizer ceiling now permits the authored 1.55 default while still clamping oversized imported values to that authored field-safe ceiling.
- Files changed: Start-state source and focused test; defaults overlay; persistence schema and expectations; retained Surface Bend fixture; performance impact ownership; preset-dependent Surface Bend/Megascans/randomizer tests; Boulder scale boundary; design, plan, and this worklog.
- Verification: The focused start-state/product and affected renderer-value suite passes 54/54 across nine files. TypeScript passes. `npm run ai:check` passes code health for 496 files and product boundary for 121 production modules. Production build passes. A clean real-Chromium v21 load reports Tall 24,000, Lawn 36,000, Butterflies 18 with height 0.4–0.8 and three flight cycles, every visible layer enabled, persisted background `#88BB77`, and localStorage version 21; visual output matches the supplied composition. The only console error is the pre-existing missing favicon request.
- Skipped checks: No full performance checkpoint because this request changes the start preset within existing limits and is not explicit performance work. The separate pending first-stable Tier 4 delivery program from Iteration 88 was not restarted for this focused batch.
- Risks: Higher reset counts make the clean scene intentionally dense, but remain within existing declared workload maxima. Historical v20 snapshots remain under their old namespace and are not migrated; v21 starts from the requested preset by design.

### Iteration 91 — Hidden Timeline and PNG-only delivery

- Request: Remove Export Video from the interface, leave only PNG, completely hide Timeline, and make animation always play by default without deleting the retained Timeline/video code; do not run checks.
- Task type: Tier 3 schema/product behavior, autonomous renderer clock, persistence generation, delivery controls, acceptance metadata, and retained legacy browser coverage.
- User-visible result: The floating Timeline and its Setup switch are absent. Wind and butterflies animate automatically with no transport controls. The footer exposes only Export PNG, and the Video Export settings section is absent.
- Source/reference checked: Current Toolcraft playback ownership, schema assembly, persistence include list, Grass preview progress mapping, footer actions, video encoder action handler, control inventory, acceptance rows, and grass-specific browser scenarios.
- Reference inputs: The user's direct request; no external asset, URL, screenshot, Figma file, or video reference was supplied for this batch.
- Docs/contracts read: `AGENTS.md`; `docs/toolcraft/workflow.md`; Plan-phase Timeline animation, performance, setup/export, and media-upload routes; Implementation-phase decision contract, schema reference, and component rules; Toolcraft `brainstorming` and `writing-plans` workflows.
- Contract rules applied: `timeline-mode-choice`, `controls-product-coverage`, `controls-section-inventory-required`, `output-export-required`, `persistence-policy-explicit`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`, with the user's explicit PNG-only and no-check instructions taking precedence for delivery scope.
- Decision: Remove `panels.timeline` from the active schema rather than hiding runtime UI with CSS. Add a product-owned six-second requestAnimationFrame clock capped at 24 published updates per second because the runtime playback clock is mounted by the Timeline panel itself. Exclude video controls/actions from the visible section array while retaining their descriptors, exporter, and panel-action implementation in source.
- Alternatives rejected: CSS-only concealment, because hidden controls would remain semantically active; leaving the runtime Timeline mounted offscreen, because Setup would still expose its switch; forcing `state.timeline.isPlaying`, because the runtime clock does not advance when the Timeline panel is absent; deleting video/timeline implementation, because the user explicitly requested reversible hiding.
- State/output mapping: Autonomous progress drives the existing preview render path; static wind mode still resolves to its existing zero wind phase while butterflies continue their autonomous flight. `grassControlSections` includes Image Export and Export PNG only. Persistence advances to `toolcraft:grass-world:state:v22`/`22` and excludes timeline state so an older paused transport cannot restore.
- Files changed: Active schema and persistence; grass controls and autonomous preview clock; Grass output progress source; readiness, control inventory, acceptance and performance metadata; focused unit/browser expectations; feature design and implementation plan; and this worklog.
- Verification: Not run, by explicit user request.
- Skipped checks: All unit, typecheck, build, browser, performance, and protected delivery commands were intentionally skipped.
- Risks: This batch is intentionally unverified. The retained hidden video/timeline code can drift from visible product behavior until it is re-enabled and checked in a future batch.

## Planning Notes

### Iteration 80 — Optimization plan refreshed against the current product

- Request: Recheck and update the grass-render optimization plan after the latest application changes.
- Task type: Tier 0 planning/documentation update for a future Tier 4 renderer optimization program.
- Verification tier: Tier 0 for this planning-only batch. The revised implementation sequence classifies stabilization and the renderer refactor as Tier 4, with a Tier 3 characterization baseline between them.
- Reason: No schema, renderer, controls, runtime behavior, pixels, assets, or tests are changed in this batch. The existing optimization documents had drifted behind completed Ground Shadow work and the in-progress Surface Bend geometry/persistence/pass changes.
- Run: Inspect current schema persistence, current feature/worklog state, Surface Bend plan/pass ownership, optimization design and implementation documents; run the local docs contract check after editing.
- Skipped checks: TypeScript, build, browser, kernel, renderer performance, and protected delivery because this batch changes planning documents only. Those checks are now explicit gates inside the revised implementation sequence.
- User-visible result: The optimization plan now starts only after Surface Bend is finished and the current product is stable. It protects Surface Bend terrain deformation and placement exclusion alongside independent Tall/Lawn maps, Ground Shadow, Current/Clover colors, generated palettes, Scene Setup, exact textures, and full-density still output.
- Source/reference checked: Current `app-schema.ts` persistence (`v20`/Timeline still present), current Surface Bend controls and geometry/pass plan, current Ground Shadow delivery record, renderer/session plan, present file-size boundaries, runtime persistence snapshot filtering behavior, and the absence of a first-stable delivery receipt.
- Reference inputs: The user's request to refresh the plan after application changes; no external asset, URL, screenshot, Figma file, or video reference.
- Docs/contracts read: `AGENTS.md`; `docs/toolcraft/workflow.md`; plan-phase runtime-boundary, performance, setup-export, media-upload, timeline-animation, control-selection, and layout modules; Toolcraft `brainstorming` and `writing-plans` skills; the strict-review findings from the immediately preceding optimization-plan audit.
- Contract rules applied: `renderer-technique-inventory`, `timeline-mode-choice`, `timeline-enabled-behavior`, `controls-product-coverage`, `controls-section-inventory-required`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Add a mandatory Tier 4 stabilization gate; finish Surface Bend before measuring; preserve its explicit `grass-ground-geometry-build` pass and dependent placement invalidation; add non-default bend state and exact geometry/boundary diagnostics to raster baselines; preserve Bend through retained-session still export; keep the four noise-preview contexts outside the one-context field session; and require the first protected receipt to pass before the still-only batch begins.
- Persistence correction: Restore and retain the stable pre-bend `v19` key/version. New Surface Bend targets take schema defaults when absent from an older valid snapshot. The later still-only batch removes `"timeline"` from `include` without a version bump or product-owned localStorage migration; the runtime filters unknown removed targets during normal restoration/writeback.
- Alternatives rejected: Baseline the actively changing Surface Bend tree; treat the completed Ground Shadow as unfinished; hide bend geometry inside static sync; merge Tall/Lawn/scan layouts; force the four control-preview contexts into the field render session; accept a documented delivery blocker as permission to continue; or use a `v20` bump as a substitute for migration.
- State/output mapping: Surface Bend settings key retained Terrain geometry and the placement boundary consumed by Tall, Lawn, scans, rocks, and the boulder. Bend changes execute ground geometry and dependent layouts; wind, lighting, material, camera, and color changes do not. Randomize/Scratch continue to coalesce through the original dispatcher, and still export freezes the same Bend/Ground Shadow/palette/layout state as preview.
- Files changed: `docs/superpowers/plans/2026-07-22-lossless-grass-render-optimization.md`, `docs/superpowers/specs/2026-07-22-lossless-grass-render-optimization-design.md`, `docs/superpowers/plans/2026-07-23-surface-perimeter-bend.md`, and this worklog.
- Verification: Planning references were reconciled against the current source tree. No implementation claim or performance result is made by this batch; the local docs check is the only delivery proof required for the document changes.
- Risks: The source tree still temporarily declares persistence `v20` and Surface Bend remains in progress. Optimization must not start until Bend returns to stable persistence, focused feature checks and code health are green, the stabilization safety fixture matches, and the canonical baseline has been captured. The first-stable protected receipt is still absent.

### Iteration 83 — Optimization plan corrected after the fourth thermo-nuclear audit

- Request: Correct the upcoming render-optimization plan against the latest application files and the strict audit findings.
- Task type: Tier 0 planning/documentation correction for a future Tier 4 renderer optimization program.
- Verification tier: Tier 0.
- Reason: This batch changes only the optimization plan, design specification, and decision trail. It does not change schema, renderer output, controls, persistence bytes, assets, tests, or runtime behavior.
- Run: Reconcile the plan and design against the completed Surface Bend delivery, current persistence generation, canonical renderer-pipeline edges, current invalidation layers, startup staging, performance scenario rules, and present file-size pressure; then run `npm run docs:check`.
- Skipped checks: TypeScript, build, browser, kernel, performance, and protected delivery because no implementation file changes in this planning-only batch. The implementation plan assigns those checks to the stabilization and delivery gates that own them.
- User-visible result: The implementation sequence now starts by stabilizing the actual completed `v20` product, correcting false pipeline ownership, decomposing near-limit modules, and minting the missing first-stable protected receipt. Only then may it record a raster baseline or begin renderer optimization.
- Source/reference checked: Current `app-schema.ts` and Surface Bend persistence/tests; `app-renderer-pipeline.ts`; `grass-output.tsx`; `grass-settings-signatures.ts`; `grass-scene.ts`; `grass-values.ts`; `app-performance.ts`; current Toolcraft performance and delivery contracts; and the fourth thermo-nuclear audit findings.
- Reference inputs: The user's request to revise the plan after the audit; no external URL, asset, screenshot, Figma file, or video reference.
- Docs/contracts read: `AGENTS.md`; `docs/toolcraft/workflow.md`; applicable runtime-boundary, performance, timeline/export, control, layout, and verification routes; Toolcraft `brainstorming` and `writing-plans` skills; and the strict-review findings from the immediately preceding audit.
- Contract rules applied: `renderer-technique-inventory`, `timeline-mode-choice`, `timeline-enabled-behavior`, `controls-product-coverage`, `controls-section-inventory-required`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Keep persistence at the completed Surface Bend generation `v20`/`20`; repair the three known canonical pipeline edge errors before measuring; make typed pass-input selectors plus pipeline execution the only pass-level invalidation authority; delete JSON settings signatures and component key refs; remove fixed startup delays; preserve one Terrain mesh identity while swapping geometry; model shadow refresh as a typed frame result; and split pipeline, performance, values, scene-lighting, acceptance, adapter, and test ownership before adding new passes.
- Superseded conclusion: Iteration 80's proposed rollback to `v19` and description of Surface Bend as in progress are no longer valid. Surface Bend is complete, `v20` is the current authored persistence generation, and optimization must preserve it.
- Alternatives rejected: Roll persistence back to `v19`; baseline the known-false pipeline graph; retain three parallel invalidation systems; treat cached and refreshed shadow frames as duplicate string workload scenarios; leave arbitrary 3000 ms/16 ms startup sleeps in the optimized path; add passes to near-limit monoliths; or continue after a missing first-stable protected receipt.
- State/output mapping: Tall distribution owns Tall layout/preview only; ground geometry appears once in scene render and is an explicit export dependency; resource-local typed snapshots prevent redundant GPU writes without becoming a second pass scheduler; forced shadow refresh owns the canonical frame budget while cached shadow is diagnostic; the still-only Timeline/video removal remains a later Tier 4 batch.
- Files changed: `docs/superpowers/plans/2026-07-22-lossless-grass-render-optimization.md`, `docs/superpowers/specs/2026-07-22-lossless-grass-render-optimization-design.md`, and this worklog.
- Verification: `npm run docs:check` passes.
- Risks: The first-stable protected delivery receipt is still absent. Stabilization must stop if the protected runner remains blocked; no baseline, optimization batch, or still-only batch may proceed without that receipt.

## Evidence

- Source reviewed: Tall/Lawn distribution state and controls, deterministic layout samplers, scan placement, renderer invalidation, performance ownership, acceptance mappings, and browser diagnostics.
- Contract applied: Product control ownership is explicit; each visible control maps to output; layout workload and exact count boundaries are declared.
- Evidence: The focused browser scenario changed every Lawn map control while proving the Tall frame signature and all five scan counts stayed unchanged.

## Verification

- Unit: 48 focused layout, schema, randomizer, pipeline, and scan tests pass.
- Typecheck: `pnpm exec tsc --noEmit` passes.
- Code health: product boundary and Toolcraft code-health checks pass.
- Browser: `pnpm exec playwright test e2e/grass-lawn-distribution.spec.ts --reporter=line` passes.
- Performance: `npm run verify:kernel` passes and records the current-source receipt.
- Run: `npm run verify:delivery`.

## Risks

- Risk: A composition using all five scan layers at their 1000-item maxima is intentionally dense; the renderer uses bounded instancing, retained resources, and protected performance coverage for that case.
- None: No known distribution ownership or scan-count correctness issue remains in the verified paths.


## 2026-08-05 — Canonical product identity and deployment path

- User-visible result: Renamed the standalone product to `Grass World` and aligned its repository package plus public demo base to `grass-world`. Product rendering, controls, defaults, and export behavior remain unchanged.
- Request: Apply the approved complete rename across code, folders, gallery identity, and deployment wiring without preserving old route aliases.
- Source/reference checked: The approved complete-app-renaming design and implementation plan, the current standalone package metadata, Vite/router base handling, `vercel.json`, identity metadata, and active acceptance/deployment assertions.
- Contract rules applied: Broad identity/deployment migration because the directory and public deployment identity change across the generated app boundary. Existing product-domain modules remain semantically named; the external Vercel stage must retain the current Project ID.
- State/output mapping: Package name, HTML title, control/acceptance identity, persistence/settings-transfer namespace where present, Vite base, public asset prefix, and Vercel rewrites now use `grass-world`. Changed persistence namespaces intentionally reset prior browser-local settings.
- Verification: Canonical package/title/base audit and every available standalone `demo-deployment.test.mjs` passed for this migration batch.
- Risks: Old demo paths are intentionally absent; no compatibility redirect is retained.

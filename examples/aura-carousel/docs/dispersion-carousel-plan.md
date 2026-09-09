# Dispersion Carousel Sandbox — Implementation Plan

Verification tier: Tier 4
Reason: First complete product delivery with new pinned dependencies, Figma assets, a reference-runtime carousel port, a WebGL raster effect, editable canvas sizing, persistence, and image export.
Run: `pnpm ai:check`; focused Vitest and Playwright checks while developing; one bare `npm run verify:delivery`; then `npm run dev` and a real-browser visual and interaction pass.
Skip: Video/timeline/layer checks because those surfaces are intentionally disabled; measured performance and `verify:perf` because the request does not authorize a performance iteration or full audit.

1. Add pinned `@paper-design/shaders-react@0.0.80`, its core package, and local Figtree font assets. Save all five Figma card frames as exact PNG exports at 2×.
2. Replace the starter schema with editable-output Setup, Background, Resolution scale, three entity-first product sections, standard Image Export, and sticky Export PNG.
3. Add focused product modules for targets/defaults, the Paper parameter reader, reference carousel behavior, renderer pipeline registration, export provider, and renderer CSS module.
4. Implement the canvas renderer with the exact heading/card geometry, native snap scrolling and keyboard behavior from the inspected source, synchronized textless arrow handles, a translated Paper Lens Distortion rail, symmetric CSS edge mask, viewport-interaction coalescing, and exact render-scale backing.
5. Implement deterministic image export for the current scroll position and Paper edge composite through the runtime export renderer.
6. Replace starter readiness with product readiness, typed interaction ownership, non-spatial view intent, reference-runtime study/inventory, entity-first section inventory, acceptance rows, workload envelope, derived renderer paths, and verification-impact ownership.
7. Add focused product unit tests and browser scenarios covering Figma structure, source carousel parity, edge-only dispersion, control outcomes, render scale, canvas crop, export, and persistence.
8. Update the product worklog with the inspected Figma node, original app run/source evidence, Paper source/version, decisions, rejected curvature alternatives, state/output mapping, and one bare-delivery narrative.
9. Run focused feedback checks, resolve root causes with the systematic-debugging workflow if anything fails, then run the Tier 4 delivery gate once and leave the dev server running.

## Iteration 2 — Vertical canvas padding, Figma radius, white background

Verification tier: Tier 3
Reason: Changes finite/infinite canvas geometry, renderer placement, still-export composition, card clipping, and background defaults without changing controls, pipeline technique, or workload boundaries.
Run: `pnpm ai:check`; focused product/unit tests; focused browser checks for canvas geometry, Figma reference parity, background, export, and persistence; one bare `npm run verify:delivery`; then `npm run dev` and a real-browser screenshot.
Skip: Measured performance, video, timeline, layers, and media checks because this iteration changes only functional canvas/presentation geometry and still-image output.

1. Add immutable geometry constants for `160px` top/bottom padding, `12px` card radius, and the resulting `1472×1034` default/output scene.
2. Update schema defaults and scene bounds to the taller canvas without changing editable-output behavior or control inventory.
3. Shift header and both carousel layers down by 160px; apply the exact Figma `12px` radius to clean cards and to the repeated Paper-card mask.
4. Change the product background default to white and keep the runtime Background switch/export behavior authoritative.
5. Shift deterministic export drawing by the same inset and preserve exact finite/infinite output bounds.
6. Update acceptance fixtures, reference evidence, product tests, browser expected dimensions, persistence expectations, and verification-impact ownership.
7. Record this coherent delivery batch in the worklog, run focused feedback, then one protected later-delivery gate and visual browser verification.

## Iteration 3 — Reference-matched progressive edge optics

Verification tier: Tier 3
Reason: Changes the WebGL composite, adds a workload-bearing visual control, changes default shader tuning, and updates preview/export edge rendering without changing carousel geometry.
Run: `pnpm ai:check`; render-plan and focused product/unit tests; focused browser checks for edge width, progressive blur, reference composition, render scale, export, and persistence; one bare `npm run verify:delivery`; then `npm run dev` and reference-oriented visual QA.
Skip: Video, timeline, layers, media, and full measured performance certification because the request is a visual-fidelity correction rather than performance authority.

1. Record the reference diagnosis: long clean center, nonlinear edge transition, broad RGB trail, and blur that grows toward the outer boundary while the rail remains flat.
2. Keep the pinned official Paper Lens Distortion source as the chromatic sampler; reject Fluted Glass because its one-direction blur and flute grid introduce an unrelated optical structure.
3. Add an `Edge blur` built-in slider beside `Edge width`, persist it as product state, and retune initial edge width, spread, bias, hue, sample count, and texture values to a stronger reference-like recipe.
4. Replace the linear shader reveal with a multi-stop nonlinear mask and add four overlapping, smoothly masked backdrop-filter layers whose combined blur radius increases toward each outside edge without band seams.
5. Apply the same nonlinear opacity and variable-radius band recipe to deterministic Canvas 2D export while preserving 12px card clipping.
6. Extend the renderer workload envelope, pipeline invalidation, acceptance inventory, browser coverage, persistence version, and verification-impact ownership for `edgeZone.blur`.
7. Compare a clean-workspace browser capture with both supplied references, tune the bounded defaults, then run focused proof and one protected later-delivery gate.

## Iteration 4 — Revised card components and optional text dispersion

Verification tier: Tier 3
Reason: Replaces every card source, changes the DOM/WebGL composition, adds one persistent product switch, and changes deterministic still export while preserving carousel mechanics and canvas geometry.
Run: `pnpm ai:check`; focused product/unit checks; focused browser checks for Figma text/layout parity, text-effect switching, carousel movement, render scale, export, and persistence; one bare `npm run verify:delivery`; then `npm run dev` and final visual QA.
Skip: Video, timeline, layers, uploads, and measured performance because they remain outside the requested product behavior and no performance audit was authorized.

1. Copy the five supplied 896×1120 PNGs into the existing product asset slots in Figma node order and rebuild the transparent 4608×1120 image strip with exact 32px gaps.
2. Extend the card data model with the exact testimonial strings extracted from Figma node `6811:7821` and render each item as one DOM component containing its image plus bottom-aligned paragraph.
3. Add the built-in `Text effect` switch to the Edge Zone entity, backed by `dispersion.includeText`, defaulting on and participating in reset, persistence, and settings transfer.
4. Build a retained transparent testimonial texture from the same card data and Figtree metrics. Sample it inside the existing WebGL pass when the switch is on; when off, render a synchronized clean DOM text track above the distorted image rail.
5. Preserve native snap scrolling, arrows, keyboard navigation, stationary screen-space edge treatment, exact render-scale backing, and the current finite/infinite canvas behavior.
6. Update still export so enabled text is captured by the velocity-free shader snapshot and disabled text is drawn cleanly after the snapshot with identical wrapping and placement.
7. Update pipeline invalidation, readiness, section inventory, acceptance rows, browser tests, persistence version, performance descriptions, and verification-impact ownership.
8. Record the Figma node and supplied source assets in the worklog, run focused checks, then run one protected later-delivery gate and leave the correct dev server running.

## Iteration 5 — Neutral halo artifact cleanup

Verification tier: Tier 3
Reason: Corrects fragment-compositing behavior in the existing WebGL preview/export pass without changing controls, canvas geometry, persistence, or workload bounds.
Run: Focused typecheck and renderer/product tests; reload the running app and visually verify the full top and bottom padding plus both zone boundaries on the white background; one bare `npm run verify:delivery` for the coherent delivery batch.
Skip: Video, timeline, layers, media, and measured performance because this is a bounded functional renderer correction and no performance review was requested.

1. Reproduce the broad neutral bands on white and separate them from authored grey image content.
2. Gate boundary-light RGB and alpha by sampled card coverage so the light curtain cannot create opacity in empty canvas padding.
3. Preserve the authored card pixels, but outside their original silhouettes remove the common neutral RGB component from the premultiplied halo and retain only spectral channel differences.
4. Verify that the 160px padding returns to white, colored dispersion remains visible at both sides, the clean center and rounded cards are unchanged, and the shader still compiles in the real browser.
5. Record the diagnosis and correction in the worklog, run focused feedback, then complete the protected delivery gate.

## Iteration 7 — Canvas-only native pinch zoom

Verification tier: Tier 4
Reason: Fixes shared canvas viewport input, adds Safari gesture compatibility, and refreshes the signed generated runtime while preserving product controls and renderer output.
Run: Focused shared-runtime interaction tests and typecheck; focused product carousel and persistence browser checks; real-browser canvas/panel/page-scale verification; one bare `npm run verify:delivery`; then `npm run dev`.
Skip: Measured performance and `verify:perf` because the report concerns missing and incorrectly scoped gesture behavior, not latency or throughput.

1. Reproduce two-touch Pointer Events and Safari/macOS gesture events against the runtime canvas and distinguish canvas-origin gestures from panel-origin gestures.
2. Track the first two active touch pointers, preserve the gesture midpoint as the world anchor, update zoom and offset transiently, and commit one viewport history boundary at gesture end.
3. Capture Safari `gesturestart`, `gesturechange`, and `gestureend` on the runtime workspace so browser-page zoom is prevented everywhere while only a canvas-origin gesture changes the canvas viewport.
4. Keep mouse pan, one-finger touch pan, trackpad wheel pinch, toolbar zoom, product carousel gestures, and panel controls on their existing ownership paths.
5. Sync the upstream source into the signed generated runtime and update the integrity manifest through the canonical signing helper.
6. Prove stable `visualViewport.scale` and panel bounds while the canvas world transform changes, then run the protected delivery gate and leave the development server available.
